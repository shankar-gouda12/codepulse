from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+psycopg://postgres:shankar@localhost:5432/shankar"
    DATABASE_SYNC_URL: str = "postgresql://postgres:shankar@127.0.0.1:5432/shankar"
    SECRET_KEY: str = "yfQNfV8w7kN4a6OTEw_Kr-Y8I0tse87hwAxZQC_R8_oWeBQ25tkJGO34HmOyaluLxTqRhB6YR7jQPx-2F5k2lg"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    LEETCODE_SYNC_INTERVAL_MINUTES: int = 5

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
