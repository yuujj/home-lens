/**
 * ConfidenceBadge — 시세 데이터 신뢰도 배지
 * 색상과 텍스트를 병행하여 색맹 사용자 접근성 보장
 */

import type { MarketDataConfidence } from "@/types";

interface Props {
  confidence: MarketDataConfidence;
}

const CONFIG: Record<MarketDataConfidence, { label: string; className: string }> = {
  high:      { label: "데이터 충분",  className: "bg-green-100 text-green-800" },
  medium:    { label: "데이터 보통",  className: "bg-yellow-100 text-yellow-800" },
  low:       { label: "데이터 부족",  className: "bg-orange-100 text-orange-800" },
  estimated: { label: "추정값",       className: "bg-blue-100 text-blue-800" },
  none:      { label: "데이터 없음",  className: "bg-slate-100 text-slate-600" },
};

export default function ConfidenceBadge({ confidence }: Props) {
  const { label, className } = CONFIG[confidence];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}
    >
      {label}
    </span>
  );
}
