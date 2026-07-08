from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    MONGO_URL: str = "mongodb+srv://aarav12f_db_user:VGjznEJPDn8aNJE4@cluster0.uxplnud.mongodb.net/?appName=Cluster0"

    SECRET_KEY: str = "change-this-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480

    APP_NAME: str = "DevTracker"

    AUTH_MODE: str = "auto"
    SSO_LOGIN_URL: str = "https://ssodev.ril.com/loginSAP"

    class Config:
        env_file = ".env"


settings = Settings()
