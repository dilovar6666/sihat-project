
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
    attempt_temporary_hours: int = 24
    gemini_api_key: SecretStr | None = None
    gemini_model: str = "gemini-3-flash-preview"
    google_oauth_client_id: str | None = None
    smtp_host: str | None = None
    smtp_port: int = 587
    smtp_username: str | None = None
    smtp_password: SecretStr | None = None
    smtp_from_email: str | None = None
    smtp_use_tls: bool = True
    password_reset_url: str = "http://localhost:5173/reset-password"
    allowed_origins: str = (
        "http://localhost:5173,http://127.0.0.1:5173,"
        "http://localhost:3000,http://127.0.0.1:3000,"
        "http://localhost:4173,http://127.0.0.1:4173"
    )

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @property
    def allowed_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]

    @property
    def google_oauth_is_configured(self) -> bool:
        return bool(self.google_oauth_client_id)

    @property
    def clean_google_oauth_client_id(self) -> str | None:
        if not self.google_oauth_client_id:
            return None
        return self.google_oauth_client_id.replace("https://", "").replace("http://", "").strip()

    @property
    def smtp_is_configured(self) -> bool:
        return bool(
            self.smtp_host and self.smtp_username and self.smtp_password and self.smtp_from_email
        )

    @property
    def gemini_is_configured(self) -> bool:
        return bool(self.gemini_api_key and self.gemini_api_key.get_secret_value())

    @model_validator(mode="after")
    def reject_placeholder_secret_outside_development(self) -> "Settings":
        if self.app_env != "development" and self.jwt_secret.get_secret_value().startswith(
            "REPLACE_WITH_"
        ):
            raise ValueError("JWT_SECRET must be set to a secure value outside development")
        return self


def get_settings() -> Settings:
    return Settings()
