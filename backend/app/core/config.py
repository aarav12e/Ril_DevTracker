from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # ── Database ──────────────────────────────────────────────────
    MONGO_URL: str  # Required — must be set via env var or .env file

    # ── JWT ───────────────────────────────────────────────────────
    SECRET_KEY: str = "change-this-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480

    # ── App ───────────────────────────────────────────────────────
    APP_NAME: str = "DevTracker"

    # ── Deployment ────────────────────────────────────────────────
    # "development" or "production"
    ENVIRONMENT: str = "development"

    # Comma-separated list of allowed CORS origins.
    # Example: "https://devtracker.azurestaticapps.net,https://devtracker.vercel.app"
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    # ── Corporate SSO Settings ────────────────────────────────────
    AUTH_MODE: str = "auto"
    SSO_LOGIN_URL: str = "https://ssodev.ril.com/loginSAP"

    class Config:
        env_file = ".env"

    @property
    def allowed_origins_list(self) -> List[str]:
        """Parse the comma-separated ALLOWED_ORIGINS string into a list."""
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT.lower() == "production"


settings = Settings()
