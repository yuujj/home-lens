"""루트 conftest — 테스트 실행 전 외부 API 키 더미값 설정 (실제 호출 없음)"""

import os

# Settings 싱글턴이 초기화되기 전에 환경변수를 주입한다.
# 테스트에서는 외부 API를 호출하지 않으므로 더미값으로 충분하다.
os.environ.setdefault("ANTHROPIC_API_KEY", "test-dummy-anthropic-key")
os.environ.setdefault("DATA_GO_KR_API_KEY", "test-dummy-data-go-kr-key")
os.environ.setdefault("JUSO_API_KEY", "test-dummy-juso-key")
