import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn (클래스 병합 유틸)", () => {
  it("단일 클래스를 그대로 반환한다", () => {
    expect(cn("text-red-500")).toBe("text-red-500");
  });

  it("여러 클래스를 공백으로 합친다", () => {
    expect(cn("px-4", "py-2")).toBe("px-4 py-2");
  });

  it("조건부 클래스: true면 포함, false면 제외한다", () => {
    expect(cn("base", false && "excluded", "included")).toBe("base included");
  });

  it("Tailwind 충돌 클래스는 마지막 값으로 병합한다", () => {
    // tailwind-merge: p-4가 px-2/py-2를 오버라이드
    expect(cn("px-2 py-2", "p-4")).toBe("p-4");
  });

  it("undefined/null 값을 무시한다", () => {
    expect(cn("text-sm", undefined, null as unknown as string)).toBe("text-sm");
  });
});
