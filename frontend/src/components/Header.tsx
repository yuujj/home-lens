/**
 * Header — 서비스 로고 및 네비게이션 바
 * 모든 페이지 상단에 고정 표시
 */

import Link from "next/link";
import { Home } from "lucide-react";

interface Props {
  /** 현재 활성 경로 — 네비게이션 강조 표시에 사용 */
  activePath?: string;
}

export default function Header({ activePath = "/" }: Props) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
        {/* 로고 + 서비스명 */}
        <Link
          href="/"
          className="flex items-center gap-2 text-slate-900 transition-opacity hover:opacity-80"
          aria-label="HomeLens 홈으로 이동"
        >
          <span
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ backgroundColor: "var(--color-navy-800)" }}
            aria-hidden="true"
          >
            <Home className="h-4 w-4 text-white" />
          </span>
          <span
            className="text-lg font-semibold tracking-tight"
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            HomeLens
          </span>
        </Link>

        {/* 네비게이션 */}
        <nav aria-label="주요 메뉴">
          <ul className="flex items-center gap-1 text-sm">
            <li>
              <Link
                href="/"
                className={[
                  "rounded-md px-3 py-1.5 font-medium transition-colors",
                  activePath === "/"
                    ? "bg-slate-100 text-slate-900"
                    : "text-slate-600 hover:text-slate-900",
                ].join(" ")}
              >
                진단 시작
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
