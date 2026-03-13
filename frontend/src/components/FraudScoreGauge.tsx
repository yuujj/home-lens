import type { FraudGrade } from "@/types";

interface Props {
  score: number;
  grade: FraudGrade;
}

const GRADE_CONFIG: Record<string, { bar: string; badge: string; text: string }> = {
  "안전":      { bar: "bg-green-500",  badge: "bg-green-100 text-green-800",   text: "위험 요소가 발견되지 않았습니다." },
  "주의":      { bar: "bg-yellow-400", badge: "bg-yellow-100 text-yellow-800", text: "일부 주의 항목이 있습니다. 확인하세요." },
  "위험":      { bar: "bg-orange-500", badge: "bg-orange-100 text-orange-800", text: "위험 요소가 다수 발견됩니다." },
  "매우 위험": { bar: "bg-red-600",    badge: "bg-red-100 text-red-800",       text: "계약 전 전문가 상담을 강력 권장합니다." },
  "분석 전":   { bar: "bg-slate-300",  badge: "bg-slate-100 text-slate-600",   text: "등기부 텍스트를 입력하여 분석하세요." },
};

export default function FraudScoreGauge({ score, grade }: Props) {
  const config = GRADE_CONFIG[grade] ?? GRADE_CONFIG["분석 전"];

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">전세 사기 위험도</h3>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${config.badge}`}>{grade}</span>
      </div>
      <div
        className="relative h-3 w-full overflow-hidden rounded-full bg-slate-100"
        role="progressbar"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`위험도 점수 ${score}점`}
      >
        <div
          className={`h-full rounded-full transition-all duration-700 ${config.bar}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <div className="flex items-end justify-between">
        <p className="text-2xl font-bold text-slate-900">
          {score}
          <span className="text-sm font-normal text-slate-400"> / 100</span>
        </p>
        <p className="text-xs text-slate-500">{config.text}</p>
      </div>
      <div className="grid grid-cols-4 text-center text-[10px] text-slate-400">
        <span>0~30 안전</span>
        <span>31~50 주의</span>
        <span>51~70 위험</span>
        <span>71↑ 매우위험</span>
      </div>
    </div>
  );
}
