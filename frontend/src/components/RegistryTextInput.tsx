"use client";
import { useState } from "react";

interface Props {
  onSubmit: (text: string) => void;
  isLoading: boolean;
}

export default function RegistryTextInput({ onSubmit, isLoading }: Props) {
  const [text, setText] = useState("");

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">등기부등본 텍스트 입력</h3>
        <span className="text-xs text-slate-400">{text.length.toLocaleString()}자</span>
      </div>
      <p className="text-xs text-slate-500">
        인터넷등기소(iros.go.kr)에서 등기부등본 전체 내용을 복사하여 붙여넣으세요.
      </p>
      <textarea
        className="min-h-[200px] w-full resize-y rounded-lg border border-slate-200 p-3 text-sm text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        placeholder="등기부등본 텍스트를 여기에 붙여넣으세요..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={isLoading}
      />
      <button
        className="rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
        onClick={() => onSubmit(text)}
        disabled={isLoading || text.trim().length < 10}
      >
        {isLoading ? "AI 분석 중..." : "등기부 분석하기"}
      </button>
    </div>
  );
}
