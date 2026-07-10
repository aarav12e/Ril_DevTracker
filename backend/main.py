from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import init_db
import app.models

# ── Import all routers ─────────────────────────────────────────
from app.routes.auth import router as auth_router
from app.routes.users import router as users_router
from app.routes.tasks import router as tasks_router
from app.routes.timer import router as timer_router
from app.routes.upload import router as upload_router
from app.routes.analytics import router as analytics_router
from app.routes.notifications import router as notifications_router
from app.routes.config import router as config_router
from app.routes.leaves import router as leaves_router


# ── Startup validation ─────────────────────────────────────────
def _validate_settings():
    """Crash loudly in production if insecure defaults are still set."""
    if settings.is_production:
        insecure_defaults = [
            "change-this-in-production",
            "change_this_to_a_secure_random_key_in_production",
            "your_super_secret_key_change_this_in_production",
        ]
        if settings.SECRET_KEY in insecure_defaults:
            raise RuntimeError(
                "FATAL: SECRET_KEY is still set to an insecure default value. "
                "Set a strong random SECRET_KEY in your Azure Application Settings before deploying."
            )


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Startup ────────────────────────────────────────────────
    _validate_settings()
    init_db()
    yield
    # ── Shutdown ───────────────────────────────────────────────


# ── App ────────────────────────────────────────────────────────
app = FastAPI(
    title="DevTracker API",
    description="Internal Developer Activity Tracking — H.N. Reliance Hospital",
    version="1.0.0",
    # Disable interactive docs in production to avoid exposing API surface
    docs_url=None if settings.is_production else "/docs",
    redoc_url=None if settings.is_production else "/redoc",
    openapi_url=None if settings.is_production else "/openapi.json",
    lifespan=lifespan,
)

# ── CORS ───────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Register routers ───────────────────────────────────────────
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(tasks_router)
app.include_router(timer_router)
app.include_router(upload_router)
app.include_router(analytics_router)
app.include_router(notifications_router)
app.include_router(config_router)
app.include_router(leaves_router)


# ── Health check ───────────────────────────────────────────────
@app.get("/", tags=["Health"])
def root():
    return {
        "app": settings.APP_NAME,
        "status": "running",
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT,
    }


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok"}
