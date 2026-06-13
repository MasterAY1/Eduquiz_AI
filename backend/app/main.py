"""Main FastAPI application entrypoint."""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import init_db
from app.routers import auth, documents, quizzes, dashboard, admin_ai, chat, analytics
from app.utils.errors import register_exception_handlers


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle hook for startup and shutdown actions."""
    # Run migrations or table setup on startup
    await init_db()
    yield
    # Shutdown / Cleanup operations here if any


app = FastAPI(
    title="EduQuiz AI API",
    description="AI-powered educational platform for Nigerian students",
    version="1.0.0",
    lifespan=lifespan,
)

settings = get_settings()

# Setup CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL, 
        "http://localhost:3000", 
        "https://eduquiz-ai-rose.vercel.app",
        "https://eduquiz-ai-rose-masteray1s-projects.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register custom exception handlers
register_exception_handlers(app)

# Integrate SlowAPI Limiter Exception Handler
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler
from app.utils.rate_limit import limiter

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Custom HTTP Middleware to manage Request IDs and Context variables
import uuid
from fastapi import Request
from app.utils.context import request_id_ctx, client_ip_ctx, user_agent_ctx, user_id_ctx

@app.middleware("http")
async def request_context_middleware(request: Request, call_next):
    req_id = uuid.uuid4()
    req_id_token = request_id_ctx.set(req_id)
    ip_token = client_ip_ctx.set(request.client.host if request.client else None)
    ua_token = user_agent_ctx.set(request.headers.get("user-agent"))
    uid_token = user_id_ctx.set(None)

    try:
        response = await call_next(request)
        response.headers["X-Request-ID"] = str(req_id)
        return response
    finally:
        request_id_ctx.reset(req_id_token)
        client_ip_ctx.reset(ip_token)
        user_agent_ctx.reset(ua_token)
        user_id_ctx.reset(uid_token)

# Include API routers
app.include_router(auth.router, prefix="/api/v1/auth")
app.include_router(documents.router, prefix="/api/v1/documents")
app.include_router(quizzes.router, prefix="/api/v1/quizzes")
app.include_router(dashboard.router, prefix="/api/v1/dashboard")
app.include_router(admin_ai.router, prefix="/api/v1/admin/ai")
app.include_router(chat.router, prefix="/api/v1/chat")
app.include_router(analytics.router, prefix="/api/v1/analytics")


@app.get("/", status_code=200)
async def root() -> dict[str, str]:
    """Root endpoint."""
    return {"message": "Welcome to the EduQuiz AI Backend. Visit /docs for the API documentation."}

@app.get("/health", status_code=200)
async def health_check() -> dict[str, str]:
    """Check API server health status."""
    return {"status": "healthy", "version": "1.0.0"}
