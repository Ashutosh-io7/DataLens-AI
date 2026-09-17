from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BACKEND_DIR / ".env",
        env_file_encoding="utf-8",
    )

    app_name: str = "DataLens AI API"
    environment: str = "development"

    cors_origins: list[str] = ["http://localhost:5173"]

    data_dir: Path = BACKEND_DIR / "data"
    database_url: str = "postgresql://postgres:postgres@localhost:5432/datalens_ai"

    @property
    def upload_dir(self) -> Path:
        return self.data_dir / "uploads"

    @property
    def metadata_dir(self) -> Path:
        return self.data_dir / "metadata"


settings = Settings()