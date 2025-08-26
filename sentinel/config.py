"""Configuration management for Sentinel One Lite."""

from typing import Optional
from pydantic import Field
from pydantic_settings import BaseSettings


class DatabaseSettings(BaseSettings):
    """Database connection settings."""
    
    host: str = Field(default="localhost", env="DB_HOST")
    port: int = Field(default=5432, env="DB_PORT")
    name: str = Field(default="sentinel_lite", env="DB_NAME")
    user: str = Field(default="postgres", env="DB_USER")
    password: str = Field(default="postgres", env="DB_PASSWORD")
    
    @property
    def url(self) -> str:
        """Get database connection URL."""
        return f"postgresql://{self.user}:{self.password}@{self.host}:{self.port}/{self.name}"


class APISettings(BaseSettings):
    """API server settings."""
    
    host: str = Field(default="0.0.0.0", env="API_HOST")
    port: int = Field(default=8000, env="API_PORT")
    debug: bool = Field(default=False, env="API_DEBUG")
    reload: bool = Field(default=False, env="API_RELOAD")


class AgentSettings(BaseSettings):
    """Agent collection settings."""
    
    collection_interval: int = Field(default=30, env="AGENT_INTERVAL")
    buffer_size: int = Field(default=1000, env="AGENT_BUFFER_SIZE")
    retry_attempts: int = Field(default=3, env="AGENT_RETRY_ATTEMPTS")
    retry_backoff: float = Field(default=1.5, env="AGENT_RETRY_BACKOFF")


class Settings(BaseSettings):
    """Main application settings."""
    
    app_name: str = Field(default="Sentinel One Lite", env="APP_NAME")
    app_version: str = Field(default="0.1.0", env="APP_VERSION")
    environment: str = Field(default="development", env="ENVIRONMENT")
    
    database: DatabaseSettings = DatabaseSettings()
    api: APISettings = APISettings()
    agent: AgentSettings = AgentSettings()
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


# Global settings instance
settings = Settings()
