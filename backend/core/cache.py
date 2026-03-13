"""인메모리 캐시 모듈 — TTL 기반 딕셔너리 캐시를 제공합니다."""

import time
from typing import Any, Optional

from core.config import settings


class InMemoryCache:
    """TTL을 지원하는 간단한 인메모리 딕셔너리 캐시."""

    def __init__(self) -> None:
        # { key: (value, expire_at) }
        self._store: dict[str, tuple[Any, float]] = {}

    def get(self, key: str) -> Optional[Any]:
        """키에 해당하는 캐시 값을 반환합니다. 만료되었거나 없으면 None."""
        entry = self._store.get(key)
        if entry is None:
            return None
        value, expire_at = entry
        if time.time() > expire_at:
            # 만료된 항목 제거
            del self._store[key]
            return None
        return value

    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        """키-값 쌍을 TTL과 함께 캐시에 저장합니다.

        Args:
            key: 캐시 키
            value: 저장할 값
            ttl: 유효 시간(초). None이면 config의 기본값 사용.
        """
        effective_ttl = ttl if ttl is not None else settings.CACHE_TTL_SECONDS
        expire_at = time.time() + effective_ttl
        self._store[key] = (value, expire_at)

    @staticmethod
    def market_cache_key(lawd_cd: str, housing_type: str, ym: str) -> str:
        """실거래가 API 캐시 키를 생성합니다.

        Args:
            lawd_cd: 법정동 코드
            housing_type: 주택 유형 (apt, rh, sh, offi)
            ym: 연월 (YYYYMM)

        Returns:
            "market:{lawd_cd}:{housing_type}:{ym}" 형식의 캐시 키
        """
        return f"market:{lawd_cd}:{housing_type}:{ym}"


# 싱글턴 캐시 인스턴스
cache = InMemoryCache()
