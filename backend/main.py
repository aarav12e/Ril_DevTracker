from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import Base, engine
import app.models  # noqa — registers all models with Base

# ── Import all routers ─────────────────────────────────────────
from app.routes.auth import router as auth_router
from app.routes.users import router as users_router
from app.routes.tasks import router as tasks_router
from app.routes.timer import router as timer_router
from app.routes.upload import router as upload_router
from app.routes.analytics import router as analytics_router
from app.routes.notifications import router as notifications_router
from app.routes.config import router as config_router

# ── Create tables (use Alembic in production) ──────────────────
Base.metadata.create_all(bind=engine)

# ── App ────────────────────────────────────────────────────────
app = FastAPI(
    title="DevTracker API",
    description="Internal Developer Activity Tracking — H.N. Reliance Hospital",
    version="1.0.0",
    docs_url="/docs",        # Swagger UI at http://localhost:8000/docs
    redoc_url="/redoc",
)

# ── CORS ───────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",   # React Vite dev server
        "http://localhost:3000",
        "https://devtracker.vercel.app",   # Production frontend
    ],
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


# ── Health check ───────────────────────────────────────────────
@app.get("/", tags=["Health"])
def root():
    return {
        "app": settings.APP_NAME,
        "status": "running",
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok"}
