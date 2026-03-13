/**
 * PropertyMap — Kakao Maps 기반 매물 위치 + 최근 거래 마커 지도
 * Phase E: SDK 미로드/키 미설정 시 graceful fallback
 */

"use client";

import { useEffect, useRef, useState } from "react";
import type { RecentTrade } from "@/types";
import { geocodeAddress } from "@/lib/kakaoMap";
import type { KakaoMap, KakaoMarker, KakaoInfoWindow } from "@/lib/kakaoMap";

interface Props {
  address: string;
  recentTrades?: RecentTrade[];
}

export default function PropertyMap({ address, recentTrades = [] }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;
    if (!key || typeof window === "undefined") {
      setHasError(true);
      setIsLoading(false);
      return;
    }

    const initMap = async () => {
      if (!window.kakao?.maps || !mapRef.current) {
        setHasError(true);
        setIsLoading(false);
        return;
      }

      window.kakao.maps.load(async () => {
        if (!mapRef.current) return;

        const coords = await geocodeAddress(address);
        if (!coords) {
          setHasError(true);
          setIsLoading(false);
          return;
        }

        const center = new window.kakao.maps.LatLng(coords.lat, coords.lng);
        const map: KakaoMap = new window.kakao.maps.Map(mapRef.current, {
          center,
          level: 4,
        });

        // 메인 매물 마커
        const mainMarker: KakaoMarker = new window.kakao.maps.Marker({
          position: center,
        });
        mainMarker.setMap(map);

        // 최근 거래 요약 InfoWindow (상위 3건 표시)
        if (recentTrades.length > 0) {
          const tradeRows = recentTrades
            .slice(0, 3)
            .map(
              (t) =>
                `<tr><td style="padding:1px 6px 1px 0;color:#555;">${t.aptNm || "—"}</td>` +
                `<td style="padding:1px 0;font-weight:600;">${t.dealAmount.toLocaleString()}만</td></tr>`
            )
            .join("");

          const infoContent = `
            <div style="padding:8px 10px;font-size:12px;line-height:1.6;">
              <div style="font-weight:700;margin-bottom:4px;color:#1e3a5f;">최근 실거래</div>
              <table>${tradeRows}</table>
            </div>`;

          const infoWindow: KakaoInfoWindow = new window.kakao.maps.InfoWindow({
            content: infoContent,
          });
          infoWindow.open(map, mainMarker);
        }

        setIsLoading(false);
      });
    };

    // afterInteractive 스크립트 로드 완료 대기 (300ms)
    const timer = setTimeout(initMap, 300);
    return () => clearTimeout(timer);
  }, [address, recentTrades]);

  if (hasError) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
        <p className="text-sm text-slate-400">지도를 불러올 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-200 shadow-sm">
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-50">
          <p className="text-sm text-slate-400">지도를 불러오는 중...</p>
        </div>
      )}
      <div ref={mapRef} className="h-64 w-full" />
    </div>
  );
}
