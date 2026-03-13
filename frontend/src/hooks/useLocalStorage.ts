"use client";

import { useState } from "react";

/**
 * SSR 안전 localStorage 커스텀 훅
 * lazy initializer 패턴으로 Next.js hydration mismatch 방지
 */
export function useLocalStorage<T>(
  key: string,
  defaultValue: T
): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") return defaultValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const setValue = (value: T) => {
    try {
      setStoredValue(value);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(value));
      }
    } catch {
      // private 브라우징 등 localStorage 쓰기 불가 시 무시
    }
  };

  return [storedValue, setValue];
}
