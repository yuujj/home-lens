import { describe, it, expect } from "vitest";

/**
 * 숫자 포매팅 유틸 — 대출 한도·금리 표시 등에서 사용하는 형식 변환
 */
function formatManwon(value: number): string {
  if (value >= 10000) {
    const eok = Math.floor(value / 10000);
    const man = value % 10000;
    return man > 0 ? `${eok}억 ${man.toLocaleString()}만원` : `${eok}억원`;
  }
  return `${value.toLocaleString()}만원`;
}

function formatRate(rate: number): string {
  return `${rate.toFixed(2)}%`;
}

describe("formatManwon (만원 단위 포매팅)", () => {
  it("9,999만원 → 만원 단위 표시", () => {
    expect(formatManwon(9999)).toBe("9,999만원");
  });

  it("10,000만원(1억) → 억 단위로 변환", () => {
    expect(formatManwon(10000)).toBe("1억원");
  });

  it("30,000만원(3억) → 3억원", () => {
    expect(formatManwon(30000)).toBe("3억원");
  });

  it("25,000만원(2억5천) → 2억 5,000만원", () => {
    expect(formatManwon(25000)).toBe("2억 5,000만원");
  });

  it("0 → 0만원", () => {
    expect(formatManwon(0)).toBe("0만원");
  });
});

describe("formatRate (금리 포매팅)", () => {
  it("1.3 → 1.30%", () => {
    expect(formatRate(1.3)).toBe("1.30%");
  });

  it("2.35 → 2.35%", () => {
    expect(formatRate(2.35)).toBe("2.35%");
  });

  it("3 → 3.00%", () => {
    expect(formatRate(3)).toBe("3.00%");
  });
});
