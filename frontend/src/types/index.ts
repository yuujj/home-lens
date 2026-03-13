/**
 * 타입 정의 — backend/models/schemas.py 와 1:1 대응
 * Sam 담당 | 백엔드 모델 변경 시 이 파일도 동시 업데이트 필요
 */

// ─── 공통 열거형 ────────────────────────────────────────────────────────────

/** 주택 유형 — 백엔드 housing_type 필드와 동일 */
export type HousingType = "apt" | "rh" | "sh" | "offi";

/** 전세가율 기반 5단계 등급 */
export type JeonseGrade = "안전" | "양호" | "주의" | "위험" | "매우 위험" | "데이터 부족";

/** 전세 사기 위험도 4단계 등급 */
export type FraudGrade = "안전" | "주의" | "위험" | "매우 위험" | "분석 전";

/** 규제지역 구분 */
export type RegulationZone = "투기지역" | "투기과열" | "조정" | "일반";

/** 시세 데이터 신뢰도 */
export type MarketDataConfidence = "high" | "medium" | "low" | "estimated" | "none";

/** 주택 소유 현황 */
export type HousingOwnership = "none" | "first_time" | "one_house";

/** 대출 목적 */
export type LoanPurpose = "buy" | "jeonse";

// ─── 핵심 도메인 모델 ────────────────────────────────────────────────────────

/**
 * 정규화된 주소 — /api/address/normalize 응답
 * 백엔드 Address 모델과 대응 (snake_case → camelCase)
 */
export interface Address {
  rawInput: string;
  roadAddr: string;
  jibunAddr: string;
  /** RTMS 실거래가 API 용 법정동코드 5자리 */
  lawdCd5: string;
  /** 공시가격 API 용 법정동코드 10자리 */
  lawdCd10: string;
  sido: string;
  sigungu: string;
  dong: string;
  isMetropolitan: boolean;
  regulationZone: RegulationZone;
}

/**
 * 매물 정보 — PropertyInfo 백엔드 모델과 대응
 * 등기부등본 파싱 결과가 병합되어 완성됨
 */
export interface PropertyInfo {
  address: Address;
  housingType: HousingType;
  exclusiveAreaM2: number;
  floor: number | null;
  builtYear: number | null;
  /** 사용자 입력 전세보증금 (만원) */
  listedJeonsePrice: number | null;
  /** 사용자 입력 매매가 (만원) */
  listedTradePrice: number | null;
  /** 추정 매매 시세 (만원) — 공공 API 기반 */
  marketTradePrice: number | null;
  /** 추정 전세 시세 (만원) — 공공 API 기반 */
  marketJeonsePrice: number | null;
  marketDataConfidence: MarketDataConfidence;
  /** 선순위 근저당 채권최고액 합계 (만원) */
  seniorMortgageAmount: number;
  hasAttachment: boolean;
  hasProvisionalAttachment: boolean;
  hasAuction: boolean;
  hasTrust: boolean;
  hasLeaseRegistration: boolean;
}

/**
 * 사용자 프로필 — 정책 대출 자격 판단에 사용
 * 개인정보 포함 — 로그 출력 금지
 */
export interface UserProfile {
  /** 연소득 세전 (만원) */
  annualIncome: number;
  isDualIncome: boolean;
  /** 순자산 = 총자산 - 총부채 (만원) */
  netAsset: number;
  age: number;
  isMarried: boolean;
  marriageYears: number;
  numChildren: number;
  /** 2년 이내 출산/입양 여부 */
  hasNewborn2yr: boolean;
  housingOwnership: HousingOwnership;
  isDisabled: boolean;
  isSingleParent: boolean;
  isMulticultural: boolean;
  /** 청약통장 가입 기간 (년) */
  subscriptionYears: number;
  subscriptionCount: number;
  loanPurpose: LoanPurpose;
}

/**
 * 정책 대출 상품 결과 — LoanResult 백엔드 모델과 대응
 */
export interface LoanResult {
  productName: string;
  /** 예상 최대 한도 (만원) */
  maxLimit: number;
  /** 금리 하한 (%) */
  rateMin: number;
  /** 금리 상한 (%) */
  rateMax: number;
  /** 우대금리 적용 예상 금리 (%) */
  rateWithBenefit: number;
  ltv: number;
  /** 월 상환액 추정 (만원) — Sprint 4에서 추가 */
  monthlyPaymentEstimate?: number;
  notes: string[];
}

/**
 * 종합 분석 결과 — AnalysisResult 백엔드 모델과 대응
 */
export interface AnalysisResult {
  property: PropertyInfo;
  user: UserProfile;
  // 기능 1: 시세 분석
  jeonseRatio: number | null;
  jeonseGrade: JeonseGrade;
  priceTrend: string;
  priceTrendPct: number | null;
  // 기능 2: 전세 사기 리스크
  fraudScore: number;
  fraudGrade: FraudGrade;
  fraudFlags: string[];
  // 기능 3: 정책 대출
  eligibleLoans: LoanResult[];
}

// ─── API 요청/응답 타입 ──────────────────────────────────────────────────────

/**
 * 공통 API 응답 래퍼 — ApiResponse<T> 백엔드 모델과 대응
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  warnings: string[];
}

/**
 * 주소 입력 폼 데이터 — AddressInput 컴포넌트에서 사용
 */
export interface AddressInputData {
  address: string;
  housingType: HousingType;
  exclusiveAreaM2: number;
  listedJeonsePrice: number;
}

/**
 * 시세 분석 요청 — /api/market/analyze 요청 바디
 */
export interface MarketAnalyzeRequest {
  address: string;
  housingType: HousingType;
  exclusiveAreaM2: number;
  listedJeonsePrice: number;
}

/**
 * 시세 분석 응답 — /api/market/analyze 응답 데이터
 */
export interface MarketAnalyzeResponse {
  marketTradePrice?: number;
  marketJeonsePrice?: number;
  jeonseRatio?: number;
  jeonseGrade: JeonseGrade;
  marketDataConfidence: MarketDataConfidence;
  priceTrend: string;
  priceTrendPct?: number;
}
