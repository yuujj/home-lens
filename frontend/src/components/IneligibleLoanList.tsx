import type { IneligibleLoan } from "@/types";

interface Props {
  loans: IneligibleLoan[];
}

export default function IneligibleLoanList({ loans }: Props) {
  if (loans.length === 0) return null;
  return (
    <details className="rounded-xl border border-slate-200 bg-white p-4">
      <summary className="cursor-pointer text-sm font-semibold text-slate-500">
        자격 미충족 상품 ({loans.length}개) 보기
      </summary>
      <ul className="mt-3 flex flex-col gap-2">
        {loans.map((loan) => (
          <li
            key={loan.productName}
            className="flex items-start justify-between gap-2 text-xs"
          >
            <span className="font-medium text-slate-700">
              {loan.productName}
            </span>
            <span className="text-right text-slate-500">{loan.reason}</span>
          </li>
        ))}
      </ul>
    </details>
  );
}
