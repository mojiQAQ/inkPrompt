"""Main FastAPI application entry point."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.database import init_db, get_db
from app.utils.init_data import init_system_tags

settings = get_settings()

# Create FastAPI app instance
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="提示词写作空间 API",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    """Initialize database on application startup."""
    init_db()

    # Initialize system preset tags
    db = next(get_db())
    try:
        created_count = init_system_tags(db)
        if created_count > 0:
            print(f"✅ Initialized {created_count} system preset tags")
    except Exception as e:
        print(f"⚠️ Failed to initialize system tags: {e}")
    finally:
        db.close()


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "message": "让提示词，更像写作，而不是编程",
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


# Import and include routers
from app.api import auth
from app.api import prompts
from app.api import tags
from app.api import versions
from app.api import optimization
from app.api import model_calls
from app.api import prompt_folders

app.include_router(auth.router, prefix="/api")
app.include_router(prompts.router, prefix="/api")
app.include_router(tags.router, prefix="/api")
app.include_router(versions.router, prefix="/api")
app.include_router(optimization.router, prefix="/api")
app.include_router(model_calls.router, prefix="/api")
app.include_router(prompt_folders.router, prefix="/api")
