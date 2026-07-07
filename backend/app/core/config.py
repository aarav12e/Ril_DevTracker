from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    DB_HOST: str = "localhost"
    DB_PORT: int = 5432
    DB_NAME: str = "devtracker"
    DB_USER: str = "postgres"
    DB_PASSWORD: str = ""
    MONGO_URL: str = "mongodb+srv://aarav12f_db_user:VGjznEJPDn8aNJE4@cluster0.uxplnud.mongodb.net/?appName=Cluster0"

    SECRET_KEY: str = "change-this-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480

    APP_NAME: str = "DevTracker"
    ALLOWED_DOMAINS: str = "reliancehospital.com,ril.com,jiohealth.com"

    @property
    def DATABASE_URL(self) -> str:
        return (
            f"postgresql+psycopg2://{self.DB_USER}:{self.DB_PASSWORD}"
            f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
        )

    @property
    def allowed_domain_list(self) -> List[str]:
        return [d.strip() for d in self.ALLOWED_DOMAINS.split(",")]

    class Config:
        env_file = ".env"


settings = Settings()
