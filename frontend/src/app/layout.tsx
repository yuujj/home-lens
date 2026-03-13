/**
 * 루트 레이아웃 — 모든 페이지에 공통 적용
 * lang="ko" — 한국어 서비스
 * Header, DisclaimerBanner 포함 구조
 */

import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "HomeLens",
  description: "AI 기반 전세 안전 진단 서비스",
};

interface Props {
  children: React.ReactNode;
}

export default function RootLayout({ children }: Props) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-slate-50 antialiased">
        <Header />
        <main id="main-content" className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
          {children}
        </main>
      </body>
    </html>
  );
}
