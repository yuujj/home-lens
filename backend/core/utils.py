"""공통 유틸리티 — 라우터 응답 직렬화 도구"""


def _camel(s: str) -> str:
    parts = s.split("_")
    return parts[0] + "".join(p.capitalize() for p in parts[1:])


def camelize(obj: object) -> object:
    """dict/list를 camelCase 키로 재귀 변환 — 프론트엔드 JSON 응답 직렬화용"""
    if isinstance(obj, dict):
        return {_camel(k): camelize(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [camelize(i) for i in obj]
    return obj
