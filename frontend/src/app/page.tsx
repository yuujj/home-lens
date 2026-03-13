/**
 * 메인 페이지 — 전세 안전 진단 시작점
 * 주소 입력 폼 + 서비스 소개 3가지 핵심 기능
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, BarChart2, Landmark } from "lucide-react";
import AddressInput from "@/components/AddressInput";
import type { AddressInputData } from "@/types";

/** 핵심 기능 소개 카드 데이터 */
const FEATURES = [
  {
    icon: BarChart2,
    title: "시세 분석",
    description:
      "공공 실거래가 기반 전세가율을 계산하고 5단계 안전 등급으로 표시합니다.",
  },
  {
    icon: ShieldCheck,
    title: "등기부 분석",
    description:
      "등기부등본 텍스트를 AI가 해석하여 전세 사기 위험도 점수와 위험 항목을 알려줍니다.",
  },
  {
    icon: Landmark,
    title: "정책 대출",
    description:
      "소득·나이·자산 조건에 맞는 정책 대출 상품과 예상 한도·금리를 즉시 제시합니다.",
  },
] as const;

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  /**
   * 폼 제출 처리 — 결과 페이지로 쿼리 파라미터와 함께 이동
   * 실제 API 호출은 /result 페이지에서 수행
   */
  function handleSubmit(data: AddressInputData) {
    setIsLoading(true);
    const params = new URLSearchParams({
      address: data.address,
      housingType: data.housingType,
      exclusiveAreaM2: String(data.exclusiveAreaM2),
      listedJeonsePrice: String(data.listedJeonsePrice),
    });
    router.push(`/result?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-12">
      {/* 히어로 섹션 */}
      <section className="flex flex-col items-center gap-4 pt-4 text-center sm:pt-8">
        <h1
          className="text-4xl font-normal leading-tight text-slate-900 sm:text-5xl"
          style={{ fontFamily: "'DM Serif Display', serif" }}
        >
          HomeLens
        </h1>
        <p className="max-w-md text-base leading-relaxed text-slate-500">
          주소 하나로 전세 사기 위험도, 시세 적정성, 정책 대출 자격을
          <br className="hidden sm:block" />
          한 번에 확인하세요.
        </p>
      </section>

      {/* 입력 폼 */}
      <section aria-labelledby="form-heading">
        <h2 id="form-heading" className="sr-only">
          전세 안전 진단 입력
        </h2>
        <AddressInput onSubmit={handleSubmit} isLoading={isLoading} />
      </section>

      {/* 핵심 기능 소개 */}
      <section aria-labelledby="features-heading">
        <h2
          id="features-heading"
          className="mb-6 text-center text-sm font-semibold uppercase tracking-widest text-slate-400"
        >
          제공 기능
        </h2>
        <ul className="grid gap-4 sm:grid-cols-3" role="list">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <li
              key={title}
              className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <span
                className="flex h-10 w-10 items-center justify-center rounded-lg"
                style={{ backgroundColor: "var(--color-navy-50)" }}
                aria-hidden="true"
              >
                <Icon
                  className="h-5 w-5"
                  style={{ color: "var(--color-navy-700)" }}
                />
              </span>
              <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
              <p className="text-sm leading-relaxed text-slate-500">
                {description}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
