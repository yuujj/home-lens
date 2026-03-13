/**
 * 백엔드 API 호출 함수 모음
 * Sam 담당 — 모든 fetch 호출은 이 파일에서만 수행
 * 컴포넌트 내부에서 직접 fetch 금지
 */

import type {
  Address,
  ApiResponse,
  MarketAnalyzeRequest,
  MarketAnalyzeResponse,
} from "@/types";

// 백엔드 베이스 URL — 환경변수로 관리
const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

// ─── 기본 fetch 래퍼 ─────────────────────────────────────────────────────────

/**
 * 공통 HTTP 요청 함수 — 에러 처리 및 JSON 파싱 포함
 * HTTP 4xx/5xx 응답은 Error를 throw하여 호출부에서 처리하도록 위임
 */
async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${BACKEND_URL}${path}`;

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    // 서버가 ApiResponse 형태의 에러를 반환하는 경우 메시지 추출
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    try {
      const errorBody = (await response.json()) as ApiResponse<unknown>;
      if (errorBody.error) {
        errorMessage = errorBody.error;
      }
    } catch {
      // JSON 파싱 실패 시 기본 메시지 사용
    }
    throw new Error(errorMessage);
  }

  return response.json() as Promise<T>;
}

// ─── 주소 정규화 ─────────────────────────────────────────────────────────────

/**
 * 사용자 입력 주소를 정규화하여 법정동코드 포함 Address 반환
 * 엔드포인트: POST /api/address/normalize
 */
export async function normalizeAddress(rawAddress: string): Promise<Address> {
  const result = await apiFetch<ApiResponse<Address>>(
    "/api/address/normalize",
    {
      method: "POST",
      body: JSON.stringify({ raw_address: rawAddress }),
    }
  );

  if (!result.success || !result.data) {
    throw new Error(result.error ?? "주소 정규화에 실패했습니다.");
  }

  return result.data;
}

// ─── 시세 분석 (Sprint 2 구현 예정) ─────────────────────────────────────────

/**
 * 시세 조회 및 전세가율 계산
 * 엔드포인트: POST /api/market/analyze
 * Sprint 2에서 구현 — 현재는 타입만 정의
 */
export async function analyzeMarket(
  data: MarketAnalyzeRequest
): Promise<MarketAnalyzeResponse> {
  const result = await apiFetch<ApiResponse<MarketAnalyzeResponse>>(
    "/api/market/analyze",
    {
      method: "POST",
      body: JSON.stringify({
        address: data.address,
        housing_type: data.housingType,
        exclusive_area_m2: data.exclusiveAreaM2,
        listed_jeonse_price: data.listedJeonsePrice,
      }),
    }
  );

  if (!result.success || !result.data) {
    throw new Error(result.error ?? "시세 분석에 실패했습니다.");
  }

  return result.data;
}
