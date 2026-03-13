/**
 * ResultPage — 시세 분석 결과 페이지
 * 쿼리 파라미터로 매물 정보를 수신하여 analyzeMarket() 호출 후 결과 표시
 * DisclaimerBanner는 모든 상태(로딩/에러/성공)에서 항상 하단에 표시
 */

"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import JeonseRatioGauge from "@/components/JeonseRatioGauge";
import MarketPriceCard from "@/components/MarketPriceCard";
import LoadingSpinner from "@/components/LoadingSpinner";
import DisclaimerBanner from "@/components/DisclaimerBanner";
import { analyzeMarket } from "@/lib/api";
import type { MarketAnalyzeResponse } from "@/types";

export default function ResultPage() {
  const params = useSearchParams();
  const [data, setData] = useState<MarketAnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const address = params.get("address") ?? "";
    const housingType = (params.get("housingType") ?? "apt") as
      | "apt"
      | "rh"
      | "sh"
      | "offi";
    const exclusiveAreaM2 = parseFloat(params.get("exclusiveAreaM2") ?? "0");
    const listedJeonsePrice = parseInt(
      params.get("listedJeonsePrice") ?? "0",
      10
    );

    analyzeMarket({ address, housingType, exclusiveAreaM2, listedJeonsePrice })
      .then(setData)
      .catch((err: unknown) =>
        setError(
          err instanceof Error ? err.message : "분석에 실패했습니다."
        )
      )
      .finally(() => setIsLoading(false));
  }, [params]);

  const listedJeonsePrice = parseInt(
    params.get("listedJeonsePrice") ?? "0",
    10
  );

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-slate-900">시세 분석 결과</h1>

      {isLoading && (
        <LoadingSpinner message="시세 데이터를 조회하는 중..." />
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {data && (
        <div className="flex flex-col gap-4">
          <JeonseRatioGauge
            ratio={data.jeonseRatio ?? null}
            grade={data.jeonseGrade}
          />
          <MarketPriceCard
            marketTradePrice={data.marketTradePrice ?? null}
            marketJeonsePrice={data.marketJeonsePrice ?? null}
            listedJeonsePrice={listedJeonsePrice}
            confidence={data.marketDataConfidence}
          />
          {data.warnings && data.warnings.length > 0 && (
            <ul className="flex flex-col gap-1 rounded-lg bg-yellow-50 p-3">
              {data.warnings.map((w) => (
                <li key={w} className="text-xs text-yellow-800">
                  ⚠ {w}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <DisclaimerBanner />
    </div>
  );
}
