/**
 * MarketPriceCard — 시세 분석 요약 카드
 * 추정 매매가 / 추정 전세가 / 입력 전세가 3열 비교 표시
 * 데이터 없음 상태는 안내 문구로 Graceful Degradation 처리
 */

import ConfidenceBadge from "./ConfidenceBadge";
import type { MarketDataConfidence } from "@/types";

interface Props {
  marketTradePrice: number | null;
  marketJeonsePrice: number | null;
  listedJeonsePrice: number;
  confidence: MarketDataConfidence;
}

/** 만원 단위 숫자를 억/만원 표기로 변환 */
function formatManwon(value: number | null): string {
  if (value === null) return "데이터 없음";
  if (value >= 10000) return `${(value / 10000).toFixed(1)}억`;
  return `${value.toLocaleString()}만원`;
}

export default function MarketPriceCard({
  marketTradePrice,
  marketJeonsePrice,
  listedJeonsePrice,
  confidence,
}: Props) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">시세 분석</h3>
        <ConfidenceBadge confidence={confidence} />
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-slate-500">추정 매매가</span>
          <span className="text-lg font-bold text-slate-900">
            {formatManwon(marketTradePrice)}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-slate-500">추정 전세가</span>
          <span className="text-lg font-bold text-slate-900">
            {formatManwon(marketJeonsePrice)}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-slate-500">입력 전세가</span>
          <span className="text-lg font-bold text-blue-700">
            {formatManwon(listedJeonsePrice)}
          </span>
        </div>
      </div>

      {confidence === "none" && (
        <p className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
          해당 지역·기간 실거래 데이터가 없습니다. 다른 기간이나 유사 지역 시세를 참고하세요.
        </p>
      )}
    </div>
  );
}
