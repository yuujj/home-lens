"use client";
import type { UserProfileInput, LoanPurpose, HousingOwnership } from "@/types";
import { useLocalStorage } from "@/hooks/useLocalStorage";

interface Props {
  onSubmit: (profile: UserProfileInput) => void;
  isLoading: boolean;
}

const DEFAULT: UserProfileInput = {
  annualIncome: 0,
  isDualIncome: false,
  netAsset: 0,
  age: 30,
  isMarried: false,
  marriageYears: 0,
  numChildren: 0,
  hasNewborn2yr: false,
  housingOwnership: "none",
  isDisabled: false,
  isSingleParent: false,
  isMulticultural: false,
  subscriptionYears: 0,
  subscriptionCount: 0,
  loanPurpose: "jeonse",
};

export default function UserProfileForm({ onSubmit, isLoading }: Props) {
  const [form, setForm] = useLocalStorage<UserProfileInput>("homelens:profile", DEFAULT);
  const set = <K extends keyof UserProfileInput>(k: K, v: UserProfileInput[K]) =>
    setForm({ ...form, [k]: v });

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-700">정책 대출 자격 조회</h3>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs text-slate-600">
          대출 목적
          <select
            className="rounded-lg border border-slate-200 p-2 text-sm"
            value={form.loanPurpose}
            onChange={(e) => set("loanPurpose", e.target.value as LoanPurpose)}
          >
            <option value="jeonse">전세</option>
            <option value="buy">구입</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-slate-600">
          연소득 (만원, 세전)
          <input
            type="number"
            className="rounded-lg border border-slate-200 p-2 text-sm"
            value={form.annualIncome || ""}
            onChange={(e) => set("annualIncome", Number(e.target.value))}
            placeholder="예: 4500"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-slate-600">
          만 나이
          <input
            type="number"
            className="rounded-lg border border-slate-200 p-2 text-sm"
            value={form.age || ""}
            onChange={(e) => set("age", Number(e.target.value))}
            placeholder="예: 29"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-slate-600">
          순자산 (만원)
          <input
            type="number"
            className="rounded-lg border border-slate-200 p-2 text-sm"
            value={form.netAsset || ""}
            onChange={(e) => set("netAsset", Number(e.target.value))}
            placeholder="총자산 - 총부채"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-slate-600">
          주택 소유 이력
          <select
            className="rounded-lg border border-slate-200 p-2 text-sm"
            value={form.housingOwnership}
            onChange={(e) =>
              set("housingOwnership", e.target.value as HousingOwnership)
            }
          >
            <option value="none">무주택</option>
            <option value="first_time">생애최초</option>
            <option value="one_house">1주택</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-slate-600">
          자녀 수
          <input
            type="number"
            className="rounded-lg border border-slate-200 p-2 text-sm"
            value={form.numChildren || ""}
            onChange={(e) => set("numChildren", Number(e.target.value))}
            placeholder="0"
            min={0}
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-slate-600">
        {(
          [
            { key: "isMarried" as const, label: "기혼" },
            { key: "isDualIncome" as const, label: "맞벌이" },
            { key: "hasNewborn2yr" as const, label: "2년내 출산/입양" },
            { key: "isDisabled" as const, label: "장애인" },
            { key: "isSingleParent" as const, label: "한부모가정" },
          ] as const
        ).map(({ key, label }) => (
          <label key={key} className="flex cursor-pointer items-center gap-1.5">
            <input
              type="checkbox"
              checked={form[key] as boolean}
              onChange={(e) => set(key, e.target.checked)}
            />
            {label}
          </label>
        ))}
      </div>

      <button
        className="rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
        onClick={() => onSubmit(form)}
        disabled={isLoading || !form.annualIncome || !form.age}
      >
        {isLoading ? "조회 중..." : "정책 대출 조회하기"}
      </button>
    </div>
  );
}
