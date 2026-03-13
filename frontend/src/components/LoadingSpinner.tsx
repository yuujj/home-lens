/**
 * LoadingSpinner — 분석 대기 중 표시 컴포넌트
 * API 응답 대기 시 사용자에게 진행 상태를 시각적으로 전달
 */

interface Props {
  message?: string;
}

export default function LoadingSpinner({ message = "분석 중..." }: Props) {
  return (
    <div
      className="flex flex-col items-center gap-3 py-12"
      role="status"
      aria-live="polite"
    >
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-700" />
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  );
}
