"use client";
import { useRef, useState } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { uploadRegistryPdf } from "@/lib/api";

interface Props {
  onSubmit: (text: string) => void;
  isLoading: boolean;
}

export default function RegistryTextInput({ onSubmit, isLoading }: Props) {
  const [text, setText] = useLocalStorage<string>("homelens:registry", "");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(file: File) {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setUploadError("PDF 파일만 업로드 가능합니다.");
      return;
    }
    setIsUploading(true);
    setUploadError(null);
    try {
      const result = await uploadRegistryPdf(file);
      setText(result.text);
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : "PDF 업로드에 실패했습니다."
      );
    } finally {
      setIsUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileChange(file);
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">등기부등본 텍스트 입력</h3>
        <span className="text-xs text-slate-400">{text.length.toLocaleString()}자</span>
      </div>

      {/* PDF 업로드 영역 */}
      <div
        className="flex flex-col items-center gap-2 rounded-lg border-2 border-dashed border-slate-200 p-4 transition-colors hover:border-blue-300"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <p className="text-xs text-slate-500">
          PDF 파일을 드래그하거나 버튼으로 업로드하면 텍스트가 자동으로 채워집니다.
        </p>
        <button
          type="button"
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || isLoading}
        >
          {isUploading ? "추출 중..." : "PDF 파일 선택"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileChange(file);
            e.target.value = "";
          }}
        />
        {uploadError && (
          <p className="text-xs text-red-600">{uploadError}</p>
        )}
      </div>

      <p className="text-xs text-slate-500">
        또는 인터넷등기소(iros.go.kr)에서 등기부등본 전체 내용을 복사하여 붙여넣으세요.
      </p>
      <textarea
        className="min-h-[200px] w-full resize-y rounded-lg border border-slate-200 p-3 text-sm text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        placeholder="등기부등본 텍스트를 여기에 붙여넣으세요..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={isLoading || isUploading}
      />
      <button
        className="rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
        onClick={() => onSubmit(text)}
        disabled={isLoading || isUploading || text.trim().length < 10}
      >
        {isLoading ? "AI 분석 중..." : "등기부 분석하기"}
      </button>
    </div>
  );
}
