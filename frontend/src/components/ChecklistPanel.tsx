import type { ChecklistItem } from "@/types";

interface Props {
  items: ChecklistItem[];
}

export default function ChecklistPanel({ items }: Props) {
  const sorted = [...items].sort(
    (a, b) =>
      (a.priority === "필수" ? -1 : 1) - (b.priority === "필수" ? -1 : 1)
  );
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-700">계약 전 확인 체크리스트</h3>
      <ul className="flex flex-col gap-2">
        {sorted.map((item) => (
          <li key={item.item} className="flex items-start gap-2.5">
            <span
              className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                item.priority === "필수"
                  ? "bg-red-100 text-red-700"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {item.priority}
            </span>
            <span className="text-sm text-slate-700">{item.item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
