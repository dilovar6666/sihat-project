from functools import lru_cache

from pydantic import SecretStr, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "SIHAT API"
    app_version: str = "0.1.0"
    app_env: str = "development"
    debug: bool = False
    database_url: str = "postgresql+psycopg://sihat:sihat@localhost:5432/sihat"
    jwt_secret: SecretStr = SecretStr("development-only-key-replace-before-production")
    access_token_minutes: int = 15
    refresh_token_days: int = 30
    google_oauth_client_id: str | None = None
    google_oauth_client_secret: SecretStr | None = None
    google_oauth_redirect_uri: str | None = None
    allowed_origins: str = "http://localhost:5173"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @property
    def allowed_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]

    @property
    def google_oauth_is_configured(self) -> bool:
        return bool(
            self.google_oauth_client_id
            and self.google_oauth_client_secret
            and self.google_oauth_redirect_uri
        )

    @model_validator(mode="after")
    def reject_placeholder_secret_outside_development(self) -> "Settings":
        if self.app_env != "development" and self.jwt_secret.get_secret_value().startswith(
            "REPLACE_WITH_"
        ):
            raise ValueError("JWT_SECRET must be set to a secure value outside development")
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
