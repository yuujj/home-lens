/**
 * Kakao Maps SDK 타입 선언 + 지오코딩 유틸
 * any 타입 금지 — 필요한 메서드만 interface로 선언
 */

// ─── Kakao Maps 타입 선언 ─────────────────────────────────────────────────────

export interface KakaoLatLng {
  getLat(): number;
  getLng(): number;
}

export interface KakaoMap {
  setCenter(latlng: KakaoLatLng): void;
  getLevel(): number;
}

export interface KakaoMarker {
  setMap(map: KakaoMap | null): void;
}

export interface KakaoInfoWindow {
  open(map: KakaoMap, marker: KakaoMarker): void;
  close(): void;
}

interface KakaoGeocodeResult {
  address_name: string;
  road_address_name: string;
  /** 경도 */
  x: string;
  /** 위도 */
  y: string;
}

interface KakaoGeocoder {
  addressSearch(
    addr: string,
    callback: (result: KakaoGeocodeResult[], status: string) => void
  ): void;
}

interface KakaoMapConstructorOptions {
  center: KakaoLatLng;
  level: number;
}

interface KakaoMarkerConstructorOptions {
  position: KakaoLatLng;
}

interface KakaoInfoWindowConstructorOptions {
  content: string;
  removable?: boolean;
}

// Window 전역 타입 확장
declare global {
  interface Window {
    kakao: {
      maps: {
        load(callback: () => void): void;
        Map: new (container: HTMLElement, options: KakaoMapConstructorOptions) => KakaoMap;
        Marker: new (options: KakaoMarkerConstructorOptions) => KakaoMarker;
        InfoWindow: new (options: KakaoInfoWindowConstructorOptions) => KakaoInfoWindow;
        LatLng: new (lat: number, lng: number) => KakaoLatLng;
        services: {
          Geocoder: new () => KakaoGeocoder;
          Status: { OK: string };
        };
      };
    };
  }
}

// ─── 지오코딩 유틸 ────────────────────────────────────────────────────────────

/** 주소 문자열 → 위경도 반환 (실패 시 null) */
export async function geocodeAddress(
  address: string
): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !window.kakao?.maps) {
      resolve(null);
      return;
    }
    const geocoder = new window.kakao.maps.services.Geocoder();
    geocoder.addressSearch(address, (result, status) => {
      if (
        status === window.kakao.maps.services.Status.OK &&
        result.length > 0
      ) {
        resolve({ lat: parseFloat(result[0].y), lng: parseFloat(result[0].x) });
      } else {
        resolve(null);
      }
    });
  });
}
