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
  RegistryParseResponse,
  FraudScoreRequest,
  FraudScoreResponse,
  LoanEligibleResponse,
  UserProfileInput,
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

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });
  } catch {
    throw new Error(
      "서버 연결에 실패했습니다. 백엔드 서버가 실행 중인지 확인해주세요."
    );
  }

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

// ─── FormData 전용 fetch 래퍼 (Content-Type 자동 설정) ──────────────────────

/**
 * multipart/form-data 요청용 래퍼 — Content-Type은 브라우저가 자동 설정
 */
async function apiFetchForm<T>(path: string, body: FormData): Promise<T> {
  const url = `${BACKEND_URL}${path}`;
  let response: Response;
  try {
    response = await fetch(url, { method: "POST", body });
  } catch {
    throw new Error(
      "서버 연결에 실패했습니다. 백엔드 서버가 실행 중인지 확인해주세요."
    );
  }
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    try {
      const errorBody = (await response.json()) as ApiResponse<unknown>;
      if (errorBody.error) errorMessage = errorBody.error;
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
        raw_address: data.address,
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

// ─── 등기부등본 PDF 업로드 ────────────────────────────────────────────────────

/** PDF 파일 업로드 → 텍스트 추출 — POST /api/registry/upload-pdf */
export async function uploadRegistryPdf(
  file: File
): Promise<{ text: string }> {
  const formData = new FormData();
  formData.append("file", file);
  const result = await apiFetchForm<ApiResponse<{ text: string }>>(
    "/api/registry/upload-pdf",
    formData
  );
  if (!result.success || !result.data)
    throw new Error(result.error ?? "PDF 텍스트 추출 실패");
  return result.data;
}

// ─── 등기부등본 파싱 ─────────────────────────────────────────────────────────

/** 등기부등본 텍스트 파싱 — POST /api/registry/parse */
export async function parseRegistry(
  registryText: string
): Promise<RegistryParseResponse> {
  const result = await apiFetch<ApiResponse<RegistryParseResponse>>(
    "/api/registry/parse",
    {
      method: "POST",
      body: JSON.stringify({ registry_text: registryText }),
    }
  );
  if (!result.success || !result.data)
    throw new Error(result.error ?? "등기부 파싱 실패");
  return result.data;
}

// ─── 전세 사기 위험도 스코어링 ────────────────────────────────────────────────

/** 전세 사기 위험도 스코어링 — POST /api/fraud/score */
export async function scoreFraud(
  data: FraudScoreRequest
): Promise<FraudScoreResponse> {
  const p = data.property_info;

  // 백엔드 snake_case 변환 (응답은 백엔드 camelize()로 이미 camelCase)
  const body = {
    registry_text: data.registry_text,
    property_info: {
      address: {
        raw_input: p.address.rawInput,
        road_addr: p.address.roadAddr,
        jibun_addr: p.address.jibunAddr,
        lawd_cd_5: p.address.lawdCd5,
        lawd_cd_10: p.address.lawdCd10,
        sido: p.address.sido,
        sigungu: p.address.sigungu,
        dong: p.address.dong,
        is_metropolitan: p.address.isMetropolitan,
        regulation_zone: p.address.regulationZone,
      },
      housing_type: p.housingType,
      exclusive_area_m2: p.exclusiveAreaM2,
      floor: p.floor,
      built_year: p.builtYear,
      listed_jeonse_price: p.listedJeonsePrice,
      listed_trade_price: p.listedTradePrice,
      market_trade_price: p.marketTradePrice,
      market_jeonse_price: p.marketJeonsePrice,
      market_data_confidence: p.marketDataConfidence,
      senior_mortgage_amount: p.seniorMortgageAmount,
      has_attachment: p.hasAttachment,
      has_provisional_attachment: p.hasProvisionalAttachment,
      has_auction: p.hasAuction,
      has_trust: p.hasTrust,
      has_lease_registration: p.hasLeaseRegistration,
    },
  };

  const result = await apiFetch<ApiResponse<FraudScoreResponse>>(
    "/api/fraud/score",
    {
      method: "POST",
      body: JSON.stringify(body),
    }
  );
  if (!result.success || !result.data)
    throw new Error(result.error ?? "스코어링 실패");
  return result.data;
}

// ─── 정책 대출 자격 조회 ──────────────────────────────────────────────────────

/**
 * 정책 대출 자격 판단 + 한도/금리 계산
 * 엔드포인트: POST /api/loan/eligible
 */
export async function getEligibleLoans(data: {
  user_profile: UserProfileInput;
  property_info: Record<string, unknown>;
}): Promise<LoanEligibleResponse> {
  const u = data.user_profile;
  const p = data.property_info;

  // 백엔드 snake_case 변환 + 필수 address 기본값 삽입
  const body = {
    user_profile: {
      annual_income: u.annualIncome,
      is_dual_income: u.isDualIncome,
      net_asset: u.netAsset,
      age: u.age,
      is_married: u.isMarried,
      marriage_years: u.marriageYears,
      num_children: u.numChildren,
      has_newborn_2yr: u.hasNewborn2yr,
      housing_ownership: u.housingOwnership,
      is_disabled: u.isDisabled,
      is_single_parent: u.isSingleParent,
      is_multicultural: u.isMulticultural,
      subscription_years: u.subscriptionYears,
      subscription_count: u.subscriptionCount,
      loan_purpose: u.loanPurpose,
    },
    property_info: {
      address: {
        raw_input: "",
        road_addr: "",
        jibun_addr: "",
        lawd_cd_5: "",
        lawd_cd_10: "",
        sido: "",
        sigungu: "",
        dong: "",
        is_metropolitan: false,
        regulation_zone: "일반",
      },
      housing_type: p.housingType,
      exclusive_area_m2: p.exclusiveAreaM2,
      listed_jeonse_price: p.listedJeonsePrice ?? null,
      listed_trade_price: p.listedTradePrice ?? null,
      market_trade_price: p.marketTradePrice ?? null,
      market_jeonse_price: p.marketJeonsePrice ?? null,
      market_data_confidence: p.marketDataConfidence ?? "none",
      senior_mortgage_amount: p.seniorMortgageAmount ?? 0,
    },
  };

  const result = await apiFetch<ApiResponse<Record<string, unknown>>>(
    "/api/loan/eligible",
    {
      method: "POST",
      body: JSON.stringify(body),
    }
  );
  if (!result.success || !result.data)
    throw new Error(result.error ?? "대출 조회 실패");

  // 백엔드 snake_case 응답 → 프론트 camelCase 변환
  const raw = result.data as Record<string, unknown[]>;
  return {
    eligible: ((raw.eligible as Record<string, unknown>[]) ?? []).map((l) => ({
      productName: l.product_name as string,
      maxLimit: l.max_limit as number,
      rateMin: l.rate_min as number,
      rateMax: l.rate_max as number,
      rateWithBenefit: l.rate_with_benefit as number,
      ltv: l.ltv as number,
      monthlyPaymentEstimate: l.monthly_payment_estimate as number | undefined,
      notes: (l.notes as string[]) ?? [],
    })),
    ineligible: ((raw.ineligible as Record<string, unknown>[]) ?? []).map((l) => ({
      productName: l.product_name as string,
      reason: l.reason as string,
    })),
  };
}
