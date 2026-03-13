import { describe, it, expect } from "vitest";

/**
 * 전세가율 등급 판정 유틸 — 프론트엔드 표시 로직 단위 테스트
 * 기준: 60% 미만=안전, 60~70%=양호, 70~80%=주의, 80~90%=위험, 90% 이상=매우위험
 */
function getJeonseGrade(ratio: number): string {
  if (ratio < 60) return "안전";
  if (ratio < 70) return "양호";
  if (ratio < 80) return "주의";
  if (ratio < 90) return "위험";
  return "매우위험";
}

function getJeonseGradeColor(grade: string): string {
  const colors: Record<string, string> = {
    안전: "text-green-600",
    양호: "text-blue-600",
    주의: "text-yellow-600",
    위험: "text-orange-600",
    매우위험: "text-red-600",
  };
  return colors[grade] ?? "text-gray-600";
}

describe("전세가율 등급 판정", () => {
  it("59% → 안전", () => {
    expect(getJeonseGrade(59)).toBe("안전");
  });

  it("60% → 양호 (경계값)", () => {
    expect(getJeonseGrade(60)).toBe("양호");
  });

  it("70% → 주의 (경계값)", () => {
    expect(getJeonseGrade(70)).toBe("주의");
  });

  it("80% → 위험 (경계값)", () => {
    expect(getJeonseGrade(80)).toBe("위험");
  });

  it("90% → 매우위험 (경계값)", () => {
    expect(getJeonseGrade(90)).toBe("매우위험");
  });

  it("95% → 매우위험", () => {
    expect(getJeonseGrade(95)).toBe("매우위험");
  });
});

describe("전세가율 등급별 색상", () => {
  it("안전 → green", () => {
    expect(getJeonseGradeColor("안전")).toBe("text-green-600");
  });

  it("매우위험 → red", () => {
    expect(getJeonseGradeColor("매우위험")).toBe("text-red-600");
  });

  it("알 수 없는 등급 → gray fallback", () => {
    expect(getJeonseGradeColor("알수없음")).toBe("text-gray-600");
  });
});
