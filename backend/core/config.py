"""애플리케이션 설정 모듈 — 환경변수 기반 싱글턴 설정 객체를 제공합니다."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """환경변수로부터 로드되는 애플리케이션 설정."""

    # 외부 API 키 (필수 — 없으면 서버 시작 불가)
    ANTHROPIC_API_KEY: str
    DATA_GO_KR_API_KEY: str
    JUSO_API_KEY: str
    RONE_API_KEY: str = ""
    ECOS_API_KEY: str = ""
    FSS_API_KEY: str = ""

    # 서비스 URL
    BACKEND_URL: str = "http://localhost:8000"

    # CORS 허용 오리진 (쉼표 구분 문자열)
    CORS_ORIGINS: str = "http://localhost:3000"

    # 캐시 TTL (초 단위)
    CACHE_TTL_SECONDS: int = 3600

    # 사용할 Claude 모델 ID
    CLAUDE_MODEL: str = "claude-sonnet-4-6"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}

    @property
    def cors_origins_list(self) -> list[str]:
        """CORS_ORIGINS 문자열을 쉼표로 분리한 리스트를 반환합니다."""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]


# 싱글턴 설정 인스턴스
settings = Settings()
