import socket
import time
import json
import urllib.request
import urllib.error
from urllib.parse import urlparse
from fastapi import HTTPException, status
from app.core.config import settings
from app.core.security import verify_password, hash_password, create_access_token
from app.models import User
from app.schemas import TokenResponse

# Cache structure to limit connection checks to ssodev.ril.com
_reachability_cache = {"is_reachable": None, "expires_at": 0}

def is_sso_reachable(url: str = None, timeout: float = 1.5) -> bool:
    """
    Checks if the SSO host is reachable by performing DNS resolution and a quick TCP connection.
    Caches the status for 2 minutes to prevent login latency.
    Supports force overrides via settings.AUTH_MODE ("local" | "sso" | "auto").
    """
    global _reachability_cache
    if settings.AUTH_MODE == "local":
        return False
    if settings.AUTH_MODE == "sso":
        return True

    url = url or settings.SSO_LOGIN_URL
    now = time.time()
    if _reachability_cache["expires_at"] > now and _reachability_cache["is_reachable"] is not None:
        return _reachability_cache["is_reachable"]

    try:
        parsed = urlparse(url)
        host = parsed.hostname
        port = parsed.port or (443 if parsed.scheme == "https" else 80)
        if not host:
            return False
        
        # Quick DNS check
        socket.gethostbyname(host)
        # Quick TCP check
        with socket.create_connection((host, port), timeout=timeout):
            pass
        reachable = True
    except Exception:
        reachable = False

    _reachability_cache["is_reachable"] = reachable
    _reachability_cache["expires_at"] = now + 120  # Cache for 2 minutes
    return reachable


def authenticate_user(username: str, password: str, db) -> TokenResponse:
    """
    Orchestrates the login request between Corporate SSO and local fallback auth strategy.
    """
    use_sso = is_sso_reachable()

    if use_sso:
        # ── SSO Strategy Path ──
        try:
            req_data = json.dumps({"username": username, "password": password}).encode("utf-8")
            req = urllib.request.Request(
                settings.SSO_LOGIN_URL,
                data=req_data,
                headers={"Content-Type": "application/json"},
                method="POST"
            )
            # Timeout of 5 seconds to ensure we don't hang if corporate SSO is slow
            with urllib.request.urlopen(req, timeout=5.0) as response:
                res_body = response.read().decode("utf-8")
                sso_data = json.loads(res_body)
        except urllib.error.HTTPError as e:
            if e.code in (401, 403):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid corporate SSO credentials"
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=f"Corporate SSO authentication returned error status: {e.code}"
                )
        except Exception as e:
            # Raise clear error if connection fails mid-attempt (flaky network / corporate DNS failure)
            # so that we do not silently fall back to local auth in a masking way.
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Corporate SSO service is unreachable: {str(e)}"
            )

        # SSO succeeded. Let's find or provision the user in our local database
        user_dict = db.users.find_one({
            "$or": [
                {"username": username},
                {"email": username}
            ]
        })
        if not user_dict:
            from app.core.database import get_next_sequence_value
            user_id = get_next_sequence_value("user_id")
            
            # Default to "developer" role for new auto-provisioned SSO users
            user_obj = User(
                id=user_id,
                username=username,
                email=sso_data.get("email") or f"{username}@ril.com",
                # Sync password hash locally so if they connect outside corporate intranet
                # in the future, the local auth fallback will verify correctly with the same credentials.
                password_hash=hash_password(password),
                full_name=sso_data.get("full_name") or username.replace("_", " ").title(),
                role=sso_data.get("role") or "developer",
                dev_type=sso_data.get("dev_type") or "react",
                domain="ril.com",
                is_active=True
            )
            db.users.insert_one(user_obj.to_dict())
            user_dict = user_obj.to_dict()
        else:
            # Update password hash locally in case it has changed on SSO side
            db.users.update_one(
                {"id": user_dict["id"]},
                {"$set": {"password_hash": hash_password(password)}}
            )
    else:
        # ── Local Fallback Strategy Path ──
        user_dict = db.users.find_one({
            "$or": [
                {"username": username},
                {"email": username}
            ]
        })
        if not user_dict:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username or password"
            )
        
        if not verify_password(password, user_dict.get("password_hash", "")):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username or password"
            )

    user = User(**user_dict)
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated"
        )

    # Issue our unified JWT session token
    token = create_access_token({"sub": str(user.id), "role": user.role})
    return TokenResponse(
        access_token=token,
        user_id=user.id,
        username=user.username,
        role=user.role,
        full_name=user.full_name,
    )
