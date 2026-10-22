from pydantic import BaseModel, EmailStr, Field


class RegistrationInput(BaseModel):
    full_name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    password: str = Field(min_length=12, max_length=128)
    age_group: str = Field(pattern="^(16_17|18_plus)$")


class LoginInput(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class GoogleTokenInput(BaseModel):
    id_token: str = Field(min_length=20, max_length=8192)
    age_group: str | None = Field(default=None, pattern="^(16_17|18_plus)$")


class RefreshInput(BaseModel):
    refresh_token: str = Field(min_length=32, max_length=256)


class ForgotPasswordInput(BaseModel):
    email: EmailStr


class ResetPasswordInput(BaseModel):
    token: str = Field(min_length=32, max_length=256)
    new_password: str = Field(min_length=12, max_length=128)


class UserOutput(BaseModel):
    id: str
    email: EmailStr
    full_name: str
    role: str
    age_group: str


class AuthTokensOutput(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserOutput
