/**
 * ResultPage — 시세 분석 + 사기 위험도 + 정책 대출 탭 결과 페이지
 * 탭1: 시세 분석 (Sprint 2), 탭2: 사기 위험도 (Sprint 3), 탭3: 정책 대출 (Sprint 4)
 * DisclaimerBanner는 모든 상태(로딩/에러/성공)에서 항상 하단에 표시
 */

"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import JeonseRatioGauge from "@/components/JeonseRatioGauge";
import MarketPriceCard from "@/components/MarketPriceCard";
import LoadingSpinner from "@/components/LoadingSpinner";
import DisclaimerBanner from "@/components/DisclaimerBanner";
import RegistryTextInput from "@/components/RegistryTextInput";
import FraudScoreGauge from "@/components/FraudScoreGauge";
import FraudFlagList from "@/components/FraudFlagList";
import ChecklistPanel from "@/components/ChecklistPanel";
import UserProfileForm from "@/components/UserProfileForm";
import LoanResultList from "@/components/LoanResultList";
import IneligibleLoanList from "@/components/IneligibleLoanList";
import RecentTradesTable from "@/components/RecentTradesTable";
import PropertyMap from "@/components/PropertyMap";
import { Suspense } from "react";
import { analyzeMarket, scoreFraud, getEligibleLoans } from "@/lib/api";
import type {
  MarketAnalyzeResponse,
  FraudScoreResponse,
  FraudGrade,
  LoanEligibleResponse,
  UserProfileInput,
} from "@/types";

type Tab = "market" | "fraud" | "loan";

/** useSearchParams()는 Next.js 15에서 반드시 Suspense 경계 안에서 사용해야 함 */
export default function ResultPage() {
  return (
    <Suspense fallback={<LoadingSpinner message="페이지를 불러오는 중..." />}>
      <ResultPageContent />
    </Suspense>
  );
}

function ResultPageContent() {
  const params = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>("market");

  // ── 탭1: 시세 분석 상태 ────────────────────────────────────────────────────
  const [marketData, setMarketData] = useState<MarketAnalyzeResponse | null>(null);
  const [marketError, setMarketError] = useState<string | null>(null);
  const [isMarketLoading, setIsMarketLoading] = useState(true);

  // ── 탭2: 사기 위험도 상태 ─────────────────────────────────────────────────
  const [fraudData, setFraudData] = useState<FraudScoreResponse | null>(null);
  const [fraudError, setFraudError] = useState<string | null>(null);
  const [isFraudLoading, setIsFraudLoading] = useState(false);

  // ── 탭3: 정책 대출 상태 ───────────────────────────────────────────────────
  const [loanData, setLoanData] = useState<LoanEligibleResponse | null>(null);
  const [loanError, setLoanError] = useState<string | null>(null);
  const [isLoanLoading, setIsLoanLoading] = useState(false);

  // 쿼리 파라미터 파싱
  const address = params.get("address") ?? "";
  const housingType = (params.get("housingType") ?? "apt") as
    | "apt"
    | "rh"
    | "sh"
    | "offi";
  const exclusiveAreaM2 = parseFloat(params.get("exclusiveAreaM2") ?? "0");
  const listedJeonsePrice = parseInt(params.get("listedJeonsePrice") ?? "0", 10);

  // 탭1 시세 분석 — 페이지 마운트 시 자동 실행
  useEffect(() => {
    analyzeMarket({ address, housingType, exclusiveAreaM2, listedJeonsePrice })
      .then(setMarketData)
      .catch((err: unknown) =>
        setMarketError(
          err instanceof Error ? err.message : "분석에 실패했습니다."
        )
      )
      .finally(() => setIsMarketLoading(false));
  }, [params]); // eslint-disable-line react-hooks/exhaustive-deps

  // 탭2 사기 위험도 — 등기부 텍스트 제출 시 실행
  function handleRegistrySubmit(registryText: string) {
    setIsFraudLoading(true);
    setFraudError(null);
    setFraudData(null);

    scoreFraud({
      property_info: {
        address: {
          rawInput: address,
          roadAddr: address,
          jibunAddr: "",
          lawdCd5: "",
          lawdCd10: "",
          sido: "",
          sigungu: "",
          dong: "",
          isMetropolitan: false,
          regulationZone: "일반",
        },
        housingType,
        exclusiveAreaM2,
        floor: null,
        builtYear: null,
        listedJeonsePrice: listedJeonsePrice || null,
        listedTradePrice: null,
        marketTradePrice: marketData?.marketTradePrice ?? null,
        marketJeonsePrice: marketData?.marketJeonsePrice ?? null,
        marketDataConfidence: marketData?.marketDataConfidence ?? "none",
        seniorMortgageAmount: 0,
        hasAttachment: false,
        hasProvisionalAttachment: false,
        hasAuction: false,
        hasTrust: false,
        hasLeaseRegistration: false,
      },
      registry_text: registryText,
    })
      .then(setFraudData)
      .catch((err: unknown) =>
        setFraudError(
          err instanceof Error ? err.message : "사기 위험도 분석에 실패했습니다."
        )
      )
      .finally(() => setIsFraudLoading(false));
  }

  // 탭3 정책 대출 — 프로필 폼 제출 시 실행
  function handleLoanSubmit(profile: UserProfileInput) {
    setIsLoanLoading(true);
    setLoanError(null);
    setLoanData(null);

    // 전세 목적인데 보증금 정보가 없으면 경고
    if (profile.loanPurpose === "jeonse" && !listedJeonsePrice && !marketData?.marketJeonsePrice) {
      setLoanError("전세보증금 정보를 확인할 수 없습니다. 처음 화면으로 돌아가 전세보증금을 입력해 주세요.");
      setIsLoanLoading(false);
      return;
    }

    // 구입 목적인데 주택가격 정보가 없으면 경고
    if (profile.loanPurpose === "buy" && !profile.housePrice && !marketData?.marketTradePrice) {
      setLoanError("주택가격을 입력해 주세요.");
      setIsLoanLoading(false);
      return;
    }


    getEligibleLoans({
      user_profile: profile,
      property_info: {
        housingType,
        exclusiveAreaM2,
        listedJeonsePrice: listedJeonsePrice || null,
        listedTradePrice: (profile.loanPurpose === "buy" && profile.housePrice) ? profile.housePrice : (marketData?.marketTradePrice ?? null),
        marketTradePrice: marketData?.marketTradePrice ?? null,
        marketJeonsePrice: marketData?.marketJeonsePrice ?? null,
        marketDataConfidence: marketData?.marketDataConfidence ?? "none",
        // Phase C: 사기 위험도 탭에서 파싱된 선순위 근저당 금액 연동
        seniorMortgageAmount: fraudData?.seniorMortgageAmount ?? 0,
      },
    })
      .then(setLoanData)
      .catch((err: unknown) =>
        setLoanError(
          err instanceof Error ? err.message : "정책 대출 조회에 실패했습니다."
        )
      )
      .finally(() => setIsLoanLoading(false));
  }

  // 탭2 초기 게이지용 기본값
  const initialGrade: FraudGrade = "분석 전";

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-slate-900">분석 결과</h1>

      {/* 탭 네비게이션 */}
      <div className="flex border-b border-slate-200">
        {(
          [
            { key: "market" as const, label: "시세 분석" },
            { key: "fraud" as const, label: "사기 위험도" },
            { key: "loan" as const, label: "정책 대출" },
          ] as const
        ).map(({ key, label }) => (
          <button
            key={key}
            className={`px-5 py-2.5 text-sm font-semibold transition-colors ${
              activeTab === key
                ? "border-b-2 border-blue-700 text-blue-700"
                : "text-slate-500 hover:text-slate-700"
            }`}
            onClick={() => {
              if (activeTab === "loan" && key !== "loan") {
                setLoanData(null);
                setLoanError(null);
              }
              setActiveTab(key);
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 탭1: 시세 분석 */}
      {activeTab === "market" && (
        <div className="flex flex-col gap-4">
          {isMarketLoading && (
            <LoadingSpinner message="시세 데이터를 조회하는 중..." />
          )}
          {marketError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {marketError}
            </div>
          )}
          {marketData && (
            <>
              <JeonseRatioGauge
                ratio={marketData.jeonseRatio ?? null}
                grade={marketData.jeonseGrade}
              />
              <MarketPriceCard
                marketTradePrice={marketData.marketTradePrice ?? null}
                marketJeonsePrice={marketData.marketJeonsePrice ?? null}
                listedJeonsePrice={listedJeonsePrice}
                confidence={marketData.marketDataConfidence}
              />
              {/* Phase D: 최근 실거래 테이블 */}
              <RecentTradesTable trades={marketData.recentTrades ?? []} />
              {/* Phase E: 매물 위치 지도 */}
              <PropertyMap
                address={address}
                recentTrades={marketData.recentTrades ?? []}
              />
              {marketData.warnings && marketData.warnings.length > 0 && (
                <ul className="flex flex-col gap-1 rounded-lg bg-yellow-50 p-3">
                  {marketData.warnings.map((w) => (
                    <li key={w} className="text-xs text-yellow-800">
                      &#9888; {w}
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      )}

      {/* 탭2: 사기 위험도 */}
      {activeTab === "fraud" && (
        <div className="flex flex-col gap-4">
          <RegistryTextInput
            onSubmit={handleRegistrySubmit}
            isLoading={isFraudLoading}
          />
          {isFraudLoading && (
            <LoadingSpinner message="등기부를 AI로 분석하는 중..." />
          )}
          {fraudError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {fraudError}
            </div>
          )}
          {fraudData ? (
            <>
              <FraudScoreGauge
                score={fraudData.fraudScore}
                grade={fraudData.fraudGrade}
              />
              <FraudFlagList flags={fraudData.fraudFlags} />
              {fraudData.checklistItems.length > 0 && (
                <ChecklistPanel items={fraudData.checklistItems} />
              )}
            </>
          ) : (
            !isFraudLoading && (
              <FraudScoreGauge score={0} grade={initialGrade} />
            )
          )}
        </div>
      )}

      {/* 탭3: 정책 대출 */}
      {activeTab === "loan" && (
        <div className="flex flex-col gap-4">
          <UserProfileForm onSubmit={handleLoanSubmit} isLoading={isLoanLoading} />
          {isLoanLoading && (
            <LoadingSpinner message="정책 대출 자격을 확인하는 중..." />
          )}
          {loanError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {loanError}
            </div>
          )}
          {loanData && (
            <>
              <LoanResultList loans={loanData.eligible} />
              <IneligibleLoanList loans={loanData.ineligible} />
            </>
          )}
        </div>
      )}

      <DisclaimerBanner />
    </div>
  );
}
