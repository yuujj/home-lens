/**
 * DisclaimerBanner — 면책 고지 배너
 * 모든 결과 화면 하단에 반드시 포함해야 하는 필수 컴포넌트
 * CLAUDE.md 20행 면책 고지 문구 준수
 */

import { AlertTriangle } from "lucide-react";

interface Props {
  /** 추가 CSS 클래스 — 위치 조정 등에 사용 */
  className?: string;
}

export default function DisclaimerBanner({ className = "" }: Props) {
  return (
    <aside
      role="note"
      aria-label="면책 고지"
      className={[
        "w-full rounded-lg border px-4 py-3",
        "border-amber-300 bg-amber-50",
        className,
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        {/* 경고 아이콘 — 색맹 대응을 위해 아이콘과 텍스트 병행 */}
        <AlertTriangle
          className="mt-0.5 h-4 w-4 shrink-0 text-amber-600"
          aria-hidden="true"
        />
        <p className="text-sm leading-relaxed text-amber-900">
          <strong className="font-semibold">주의:</strong>{" "}
          본 결과는 참고용이며 법적·금융 자문이 아닙니다. 실제 계약 전 전문가
          상담 및 공문서 직접 확인을 권장합니다.
        </p>
      </div>
    </aside>
  );
}
