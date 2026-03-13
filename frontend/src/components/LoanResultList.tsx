import LoanResultCard from "./LoanResultCard";
import type { LoanResult } from "@/types";

interface Props {
  loans: LoanResult[];
}

export default function LoanResultList({ loans }: Props) {
  if (loans.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
        자격 요건에 맞는 정책 대출 상품이 없습니다.
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-semibold text-slate-700">
        이용 가능한 상품 ({loans.length}개) — 금리 낮은 순
      </p>
      {loans.map((loan, i) => (
        <LoanResultCard key={loan.productName} loan={loan} rank={i + 1} />
      ))}
    </div>
  );
}
