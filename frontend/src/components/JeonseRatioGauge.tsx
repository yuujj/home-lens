/**
 * JeonseRatioGauge — 전세가율 게이지 및 등급 표시 카드
 * 색상 + 텍스트 병행으로 색맹 사용자 접근성 보장
 * 기준: ~60% 안전 / ~70% 양호 / ~80% 주의 / 80%↑ 위험
 */

import type { JeonseGrade } from "@/types";

interface Props {
  ratio: number | null;
  grade: JeonseGrade;
}

const GRADE_CONFIG: Record<string, { bar: string; badge: string; text: string }> = {
  "안전":        { bar: "bg-green-500",  badge: "bg-green-100 text-green-800",   text: "전세가율이 낮아 안전합니다." },
  "양호":        { bar: "bg-lime-400",   badge: "bg-lime-100 text-lime-800",     text: "전세가율이 양호한 수준입니다." },
  "주의":        { bar: "bg-yellow-400", badge: "bg-yellow-100 text-yellow-800", text: "전세가율이 높습니다. 주의가 필요합니다." },
  "위험":        { bar: "bg-orange-500", badge: "bg-orange-100 text-orange-800", text: "전세가율이 위험 수준입니다." },
  "매우 위험":   { bar: "bg-red-600",    badge: "bg-red-100 text-red-800",       text: "전세가율이 매우 높습니다. 계약에 신중하세요." },
  "데이터 부족": { bar: "bg-slate-300",  badge: "bg-slate-100 text-slate-600",   text: "시세 데이터가 부족합니다." },
};

export default function JeonseRatioGauge({ ratio, grade }: Props) {
  const config = GRADE_CONFIG[grade] ?? GRADE_CONFIG["데이터 부족"];
  const pct = ratio !== null ? Math.min(ratio, 100) : 0;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">전세가율</h3>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${config.badge}`}>
          {grade}
        </span>
      </div>

      {/* 게이지 바 */}
      <div
        className="relative h-3 w-full overflow-hidden rounded-full bg-slate-100"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`전세가율 ${ratio !== null ? `${ratio.toFixed(1)}%` : "데이터 없음"}`}
      >
        <div
          className={`h-full rounded-full transition-all duration-700 ${config.bar}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex items-end justify-between">
        <p className="text-2xl font-bold text-slate-900">
          {ratio !== null ? `${ratio.toFixed(1)}%` : "—"}
        </p>
        <p className="text-xs text-slate-500">{config.text}</p>
      </div>

      {/* 기준선 표시 */}
      <div className="grid grid-cols-4 text-center text-[10px] text-slate-400">
        <span>~60% 안전</span>
        <span>~70% 양호</span>
        <span>~80% 주의</span>
        <span>80%↑ 위험</span>
      </div>
    </div>
  );
}
