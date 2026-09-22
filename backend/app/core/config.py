import os
from pathlib import Path
from typing import List, Union
from dotenv import load_dotenv
from pydantic import AliasChoices, Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Base directory of the backend project (where .env and uploads reside)
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Search order for .env files:
# 1. Custom ENV_FILE environment variable (if specified)
# 2. backend/.env
# 3. frontend/.env (shared monorepo config)
# 4. repository root .env
env_candidates = [
    Path(os.getenv("ENV_FILE")) if os.getenv("ENV_FILE") else None,
    BASE_DIR / ".env",
    BASE_DIR.parent / "frontend" / ".env",
    BASE_DIR.parent / ".env",
]

# Explicitly load environment variables via python-dotenv
# override=False ensures variables already in the host/container take precedence
for env_path in env_candidates:
    if env_path and env_path.is_file():
        load_dotenv(dotenv_path=env_path, override=False)


class Settings(BaseSettings):
    PROJECT_NAME: str = "Validra Base API"
    API_STR: str = "/api"
    ENV: str = Field(
        default="development",
        validation_alias=AliasChoices("ENV", "NEXT_PUBLIC_APP_ENV", "NODE_ENV", "env")
    )
    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://postgres:root@localhost:5432/validra",
        validation_alias=AliasChoices("DATABASE_URL", "POSTGRES_URL", "POSTGRES_PRISMA_URL", "database_url")
    )
    UPLOAD_DIR: str = "/tmp/uploads" if os.getenv("VERCEL") else str(BASE_DIR / "uploads")
    MAX_UPLOAD_SIZE_BYTES: int = 5 * 1024 * 1024  # 5 MB
    ALLOWED_IMAGE_TYPES: Union[List[str], str] = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/bmp",
    ]
    CORS_ORIGINS: Union[List[str], str] = ["*"]

    # ─── Auth & Security ───
    AUTH_SECRET: str = Field(
        default="validra-default-jwt-secret-key-change-in-production",
        validation_alias=AliasChoices("AUTH_SECRET", "NEXTAUTH_SECRET", "auth_secret", "nextauth_secret")
    )
    NEXTAUTH_SECRET: str = Field(
        default="",
        validation_alias=AliasChoices("NEXTAUTH_SECRET", "AUTH_SECRET", "nextauth_secret", "auth_secret")
    )
    JWT_ALGORITHM: str = "HS256"

    # ─── OCR & Extraction ───
    OCR_SPACE_API_KEY: str = Field(default="", validation_alias=AliasChoices("OCR_SPACE_API_KEY", "ocr_space_api_key"))
    GROQ_API_KEY: str = Field(default="", validation_alias=AliasChoices("GROQ_API_KEY", "groq_api_key"))
    GROQ_MODEL: str = "openai/gpt-oss-120b"

    # ─── Email & Notifications (SMTP / Nodemailer compatible) ───
    SMTP_HOST: str = Field(
        default="smtp.gmail.com",
        validation_alias=AliasChoices("SMTP_HOST", "EMAIL_HOST", "smtp_host", "email_host")
    )
    SMTP_PORT: int = Field(
        default=587,
        validation_alias=AliasChoices("SMTP_PORT", "EMAIL_PORT", "smtp_port", "email_port")
    )
    SMTP_USER: str = Field(
        default="",
        validation_alias=AliasChoices("SMTP_USER", "EMAIL_USER", "EMAIL_FROM", "smtp_user", "email_user")
    )
    SMTP_PASSWORD: str = Field(
        default="",
        validation_alias=AliasChoices("SMTP_PASSWORD", "EMAIL_PASSWORD", "smtp_password", "email_password")
    )
    EMAIL_FROM: str = Field(
        default="noreply@validra.gov.in",
        validation_alias=AliasChoices("EMAIL_FROM", "SMTP_USER", "EMAIL_USER", "email_from")
    )
    REPORT_RECIPIENT_EMAIL: str = "complaints.metrology@gov.in"

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_db_connection(cls, v: str) -> str:
        if isinstance(v, str):
            v = v.strip().strip("'\"")
            if v.startswith("postgres://"):
                v = v.replace("postgres://", "postgresql+asyncpg://", 1)
            elif v.startswith("postgresql://") and not v.startswith("postgresql+asyncpg://"):
                v = v.replace("postgresql://", "postgresql+asyncpg://", 1)

            from urllib.parse import parse_qs, urlencode, urlparse, urlunparse
            parsed = urlparse(v)
            if parsed.query:
                query_params = parse_qs(parsed.query, keep_blank_values=True)
                cleaned_query = {}
                if "sslmode" in query_params:
                    cleaned_query["ssl"] = query_params["sslmode"][0]
                elif "ssl" in query_params:
                    cleaned_query["ssl"] = query_params["ssl"][0]

                allowed_keys = {
                    "ssl", "timeout", "command_timeout", "statement_cache_size",
                    "max_cached_statement_lifetime", "max_cacheable_statement_size",
                    "server_settings", "direct_tls"
                }
                for k, vals in query_params.items():
                    if k in allowed_keys and k not in cleaned_query:
                        cleaned_query[k] = vals[0]

                v = urlunparse((
                    parsed.scheme,
                    parsed.netloc,
                    parsed.path,
                    parsed.params,
                    urlencode(cleaned_query),
                    parsed.fragment
                ))
        return v

    @field_validator("ALLOWED_IMAGE_TYPES", "CORS_ORIGINS", mode="before")
    @classmethod
    def parse_list_or_str(cls, v: Union[List[str], str]) -> List[str]:
        if isinstance(v, str):
            return [t.strip() for t in v.split(",") if t.strip()]
        return v

    model_config = SettingsConfigDict(
        env_file=tuple(
            str(p)
            for p in env_candidates
            if p and p.is_file()
        ) or None,
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )


settings = Settings()
