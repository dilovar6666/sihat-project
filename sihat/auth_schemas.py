from pydantic import BaseModel, EmailStr, Field, model_validator


class RegistrationInput(BaseModel):
    full_name: str = Field(min_length=1, max_length=120)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=32)
    password: str = Field(min_length=8, max_length=128)
    age_group: str = Field(pattern="^(16_17|18_plus)$")

    @model_validator(mode="after")
    def check_identifier(self) -> "RegistrationInput":
        if not self.email and not self.phone:
            raise ValueError("Either email or phone number must be provided")
        return self


class LoginInput(BaseModel):
    email: str | None = Field(default=None, max_length=320)
    phone: str | None = Field(default=None, max_length=32)
    password: str = Field(min_length=1, max_length=128)

    @model_validator(mode="after")
    def check_identifier(self) -> "LoginInput":
        if not self.email and not self.phone:
            raise ValueError("Either email or phone number must be provided")
        return self


class AttachEmailInput(BaseModel):
    email: EmailStr


class GoogleTokenInput(BaseModel):
    id_token: str = Field(min_length=20, max_length=8192)
    age_group: str | None = Field(default=None, pattern="^(16_17|18_plus)$")


class RefreshInput(BaseModel):
    refresh_token: str = Field(min_length=32, max_length=256)


class ForgotPasswordInput(BaseModel):
    email: EmailStr


class ResetPasswordInput(BaseModel):
    token: str = Field(min_length=32, max_length=256)
    new_password: str = Field(min_length=8, max_length=128)


class ProfileUpdateInput(BaseModel):
    full_name: str | None = Field(default=None, min_length=1, max_length=120)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=32)
    age_group: str | None = Field(default=None, pattern="^(16_17|18_plus)$")
    avatar_url: str | None = Field(default=None, max_length=500000)


class UserOutput(BaseModel):
    id: str
    email: str | None = None
    phone: str | None = None
    full_name: str
    role: str
    age_group: str
    avatar_url: str | None = None


class AuthTokensOutput(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserOutput
