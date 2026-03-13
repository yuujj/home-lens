"use client";

import { useState, useEffect } from "react";

/**
 * SSR 안전 localStorage 커스텀 훅
 * useEffect로 hydration 이후 localStorage를 읽어 서버/클라이언트 불일치 방지
 * (lazy initializer에서 읽으면 SSR HTML과 클라이언트 렌더가 달라 onSubmit 핸들러가 미등록됨)
 */
export function useLocalStorage<T>(
  key: string,
  defaultValue: T
): [T, (value: T) => void] {
  // 서버/클라이언트 첫 렌더 모두 defaultValue로 시작 → hydration mismatch 없음
  const [storedValue, setStoredValue] = useState<T>(defaultValue);

  // hydration 완료 후 localStorage 값으로 동기화
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) setStoredValue(JSON.parse(item) as T);
    } catch {
      // 읽기 실패 시 defaultValue 유지
    }
  }, [key]);

  const setValue = (value: T) => {
    setStoredValue(value);
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // private 브라우징 등 localStorage 쓰기 불가 시 무시
    }
  };

  return [storedValue, setValue];
}
