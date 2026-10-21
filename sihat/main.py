from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from sihat.auth import get_current_user
from sihat.auth import router as auth_router
from sihat.auth_schemas import UserOutput
from sihat.config import get_settings
from sihat.models import User

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
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)
app.include_router(auth_router)


@app.get("/health", tags=["system"])
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "sihat-api", "version": settings.app_version}


@app.get("/me/profile", response_model=UserOutput, tags=["me"])
def read_profile(user: User = Depends(get_current_user)) -> UserOutput:
    return UserOutput(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        age_group=user.age_group,
    )
