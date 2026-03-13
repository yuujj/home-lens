import type { LoanResult } from "@/types";

interface Props {
  loan: LoanResult;
  rank: number;
}

function formatManwon(value: number): string {
  if (value >= 10000) return `${(value / 10000).toFixed(1)}억`;
  return `${value.toLocaleString()}만원`;
}

export default function LoanResultCard({ loan, rank }: Props) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-700 text-xs font-bold text-white">
            {rank}
          </span>
          <h3 className="text-sm font-semibold text-slate-800">
            {loan.productName}
          </h3>
        </div>
        <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
          LTV {Math.round(loan.ltv * 100)}%
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="flex flex-col gap-0.5 rounded-lg bg-slate-50 p-2">
          <span className="text-[10px] text-slate-500">최대 한도</span>
          <span className="text-base font-bold text-slate-900">
            {formatManwon(loan.maxLimit)}
          </span>
        </div>
        <div className="flex flex-col gap-0.5 rounded-lg bg-green-50 p-2">
          <span className="text-[10px] text-slate-500">우대 금리</span>
          <span className="text-base font-bold text-green-700">
            {loan.rateWithBenefit.toFixed(2)}%
          </span>
        </div>
        <div className="flex flex-col gap-0.5 rounded-lg bg-slate-50 p-2">
          <span className="text-[10px] text-slate-500">월 상환액</span>
          <span className="text-base font-bold text-slate-900">
            {loan.monthlyPaymentEstimate
              ? `${loan.monthlyPaymentEstimate.toLocaleString()}만원`
              : "—"}
          </span>
        </div>
      </div>

      {loan.notes.length > 0 && (
        <ul className="flex flex-col gap-0.5">
          {loan.notes.map((note) => (
            <li key={note} className="text-xs text-slate-500">
              • {note}
            </li>
          ))}
        </ul>
      )}
      <p className="text-[10px] text-slate-400">
        금리는 예상 범위이며 실제 금융기관 심사에 따라 상이할 수 있습니다.
      </p>
    </div>
  );
}
