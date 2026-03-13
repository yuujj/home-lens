/**
 * AddressInput — 주소 및 매물 정보 입력 폼
 * 메인 페이지에서 사용하는 핵심 입력 컴포넌트
 * API 호출은 이 컴포넌트에서 직접 수행하지 않고 onSubmit 콜백으로 위임
 */

"use client";

import { useState, type FormEvent } from "react";
import type { AddressInputData, HousingType } from "@/types";

interface Props {
  /** 폼 제출 시 호출 — API 호출은 상위 컴포넌트(페이지)에서 처리 */
  onSubmit: (data: AddressInputData) => void;
  /** 제출 진행 중 여부 — 버튼 비활성화 및 로딩 표시에 사용 */
  isLoading?: boolean;
}

/** 주택 유형 선택지 레이블 */
const HOUSING_TYPE_LABELS: Record<HousingType, string> = {
  apt: "아파트",
  rh: "빌라",
  sh: "단독주택",
  offi: "오피스텔",
};

export default function AddressInput({ onSubmit, isLoading = false }: Props) {
  const [address, setAddress] = useState("");
  const [housingType, setHousingType] = useState<HousingType>("apt");
  const [exclusiveAreaM2, setExclusiveAreaM2] = useState("");
  const [listedJeonsePrice, setListedJeonsePrice] = useState("");

  /** 폼 유효성 검사 */
  function validate(): string | null {
    if (!address.trim()) return "주소를 입력해 주세요.";
    const area = parseFloat(exclusiveAreaM2);
    if (!exclusiveAreaM2 || isNaN(area) || area <= 0)
      return "전용면적을 올바르게 입력해 주세요.";
    const price = parseInt(listedJeonsePrice, 10);
    if (!listedJeonsePrice || isNaN(price) || price <= 0)
      return "전세보증금을 올바르게 입력해 주세요.";
    return null;
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const error = validate();
    if (error) {
      alert(error);
      return;
    }
    onSubmit({
      address: address.trim(),
      housingType,
      exclusiveAreaM2: parseFloat(exclusiveAreaM2),
      listedJeonsePrice: parseInt(listedJeonsePrice, 10),
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
      aria-label="전세 안전 진단 입력 폼"
      noValidate
    >
      <div className="grid gap-5">
        {/* 주소 입력 */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="address"
            className="text-sm font-medium text-slate-700"
          >
            주소 <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <input
            id="address"
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="예) 서울시 마포구 합정동 123-4"
            required
            disabled={isLoading}
            className={[
              "w-full rounded-lg border px-3 py-2.5 text-sm text-slate-900",
              "placeholder:text-slate-400",
              "border-slate-300 bg-white",
              "focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200",
              "disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400",
            ].join(" ")}
            aria-required="true"
          />
        </div>

        {/* 주택 유형 선택 */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="housingType"
            className="text-sm font-medium text-slate-700"
          >
            주택 유형 <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <select
            id="housingType"
            value={housingType}
            onChange={(e) => setHousingType(e.target.value as HousingType)}
            disabled={isLoading}
            className={[
              "w-full rounded-lg border px-3 py-2.5 text-sm text-slate-900",
              "border-slate-300 bg-white",
              "focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200",
              "disabled:cursor-not-allowed disabled:bg-slate-50",
            ].join(" ")}
            aria-required="true"
          >
            {(Object.entries(HOUSING_TYPE_LABELS) as [HousingType, string][]).map(
              ([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              )
            )}
          </select>
        </div>

        {/* 전용면적 + 전세보증금 — 2열 그리드 */}
        <div className="grid gap-5 sm:grid-cols-2">
          {/* 전용면적 */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="exclusiveAreaM2"
              className="text-sm font-medium text-slate-700"
            >
              전용면적 (m²){" "}
              <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <input
              id="exclusiveAreaM2"
              type="number"
              min="1"
              step="0.01"
              value={exclusiveAreaM2}
              onChange={(e) => setExclusiveAreaM2(e.target.value)}
              placeholder="예) 59.94"
              required
              disabled={isLoading}
              className={[
                "w-full rounded-lg border px-3 py-2.5 text-sm text-slate-900",
                "placeholder:text-slate-400",
                "border-slate-300 bg-white",
                "focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200",
                "disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400",
              ].join(" ")}
              aria-required="true"
            />
          </div>

          {/* 전세보증금 */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="listedJeonsePrice"
              className="text-sm font-medium text-slate-700"
            >
              전세보증금 (만원){" "}
              <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <input
              id="listedJeonsePrice"
              type="number"
              min="1"
              step="1"
              value={listedJeonsePrice}
              onChange={(e) => setListedJeonsePrice(e.target.value)}
              placeholder="예) 35000"
              required
              disabled={isLoading}
              className={[
                "w-full rounded-lg border px-3 py-2.5 text-sm text-slate-900",
                "placeholder:text-slate-400",
                "border-slate-300 bg-white",
                "focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200",
                "disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400",
              ].join(" ")}
              aria-required="true"
            />
          </div>
        </div>

        {/* 제출 버튼 */}
        <button
          type="submit"
          disabled={isLoading}
          className={[
            "mt-1 w-full rounded-lg px-6 py-3 text-sm font-semibold text-white",
            "transition-all duration-150",
            "focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2",
            isLoading
              ? "cursor-not-allowed bg-slate-400"
              : "bg-blue-700 hover:bg-blue-800 active:scale-[0.98]",
          ].join(" ")}
          aria-busy={isLoading}
        >
          {isLoading ? "분석 중..." : "전세 안전 진단 시작"}
        </button>
      </div>
    </form>
  );
}
