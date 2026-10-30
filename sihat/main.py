from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from sihat.admin import router as admin_router
from sihat.assistant import router as assistant_router
from sihat.attempts import guest_router as guest_attempts_router
from sihat.attempts import router as attempts_router
from sihat.auth import get_current_user
from sihat.auth import router as auth_router
from sihat.auth_schemas import UserOutput
from sihat.catalog import admin_router as catalog_admin_router
from sihat.catalog import router as catalog_router
from sihat.config import get_settings
from sihat.content import router as content_router
from sihat.models import User
from sihat.results import router as results_router
from sihat.symptom_triage import router as symptom_triage_router
from sihat.ws import router as ws_router

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="SIHAT API. Understand your health without diagnostic claims.",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)
app.include_router(auth_router)
app.include_router(assistant_router)
app.include_router(guest_attempts_router)
app.include_router(attempts_router)
app.include_router(results_router)
app.include_router(catalog_router)
app.include_router(content_router)
app.include_router(symptom_triage_router)
app.include_router(catalog_admin_router)
app.include_router(admin_router)
app.include_router(ws_router)


@app.get("/health", tags=["system"])
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "sihat-api", "version": settings.app_version}


@app.get("/me/profile", response_model=UserOutput, tags=["me"])
async def read_profile(user: User = Depends(get_current_user)) -> UserOutput:
    return UserOutput(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        age_group=user.age_group,
    )

