from pydantic import Field, ValidationError
from pydantic_settings import BaseSettings, SettingsConfigDict


class EnvSchema(BaseSettings):
    """Validated environment for the embedding service. Mirrors the Node app's
    `env.ts`: every key is required and the process fails fast on startup if any
    is missing or malformed."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    OPENAI_API_KEY: str = Field(description="API key to access OpenAI models")
    CLOUDINARY_CLOUD_NAME: str = Field(description="cloud name for the cloudinary")
    CLOUDINARY_API_KEY: str = Field(description="api key for the cloudinary")
    CLOUDINARY_API_SECRET: str = Field(description="secret key for the cloudinary")
    CLOUDINARY_PRESET: str = Field(description="Preset for cloudinary upload")


def create_env() -> EnvSchema:
    try:
        return EnvSchema()  # type: ignore[call-arg]
    except ValidationError as error:
        raise RuntimeError(f"Invalid environment configuration:\n{error}") from error


env = create_env()
