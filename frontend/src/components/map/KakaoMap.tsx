/**
 * 카카오 지도 컴포넌트
 * 주소 또는 위·경도로 보호소 위치 표시
 * .env에 VITE_MAP_API_KEY (카카오 JavaScript 키) 설정 필요
 */

import { useEffect, useRef, useState } from "react";

const KAKAO_SCRIPT_URL = "//dapi.kakao.com/v2/maps/sdk.js";
const APP_KEY = import.meta.env.VITE_MAP_API_KEY;

/** 이 컴포넌트가 사용하는 카카오 지도 SDK의 일부 */
type KakaoLatLng = object;
type KakaoMapInstance = object;

interface KakaoMapsSdk {
  /** autoload=false로 불러온 경우 라이브러리(services 등) 로드를 시작 */
  load?: (callback: () => void) => void;
  Map: new (
    container: HTMLElement,
    options: { center: KakaoLatLng; level: number },
  ) => KakaoMapInstance;
  LatLng: new (lat: number, lng: number) => KakaoLatLng;
  Marker: new (options: { position: KakaoLatLng }) => {
    setMap: (map: KakaoMapInstance | null) => void;
  };
  event: {
    addListener: (target: object, type: string, handler: () => void) => void;
  };
  /** load() 완료 전에는 없을 수 있다 */
  services?: {
    Geocoder: new () => {
      addressSearch: (
        address: string,
        callback: (result: { x: string; y: string }[], status: string) => void,
      ) => void;
    };
    Status: { OK: string };
  };
}

declare global {
  interface Window {
    kakao?: { maps: KakaoMapsSdk };
  }
}

export interface KakaoMapProps {
  /** 보호소 주소 (위경도 없을 때 주소 검색으로 표시) */
  address?: string | null;
  /** 위도 (있으면 주소 검색 생략) */
  latitude?: number | null;
  /** 경도 */
  longitude?: number | null;
  /** 지도 높이 (px) */
  height?: number | string;
  className?: string;
}

/**
 * SDK 로드 요청을 모듈 단위로 한 번만 만든다.
 * 스크립트가 아직 내려받는 중일 때 지도가 다시 마운트되면(StrictMode의 effect 재실행, 상세 페이지 간 빠른 이동)
 * 예전 구현은 500ms만 기다린 뒤 성공으로 처리해 "Geocoder를 불러올 수 없습니다" 오류를 표시했다.
 */
let kakaoLoadPromise: Promise<void> | null = null;

function loadKakaoScript(): Promise<void> {
  if (window.kakao?.maps?.services) return Promise.resolve();
  if (kakaoLoadPromise) return kakaoLoadPromise;

  kakaoLoadPromise = new Promise<void>((resolve, reject) => {
    const onSdkReady = () => {
      const maps = window.kakao?.maps;
      if (!maps) {
        reject(new Error("Kakao Maps SDK not available"));
        return;
      }
      if (maps.load) {
        maps.load(() => resolve());
      } else {
        resolve();
      }
    };

    // 이미 로드가 끝난 스크립트가 있으면 라이브러리 로드만 이어서 진행
    if (window.kakao?.maps) {
      onSdkReady();
      return;
    }

    const script = document.createElement("script");
    script.src = `https:${KAKAO_SCRIPT_URL}?appkey=${APP_KEY}&libraries=services&autoload=false`;
    script.async = true;
    script.onload = onSdkReady;
    script.onerror = () =>
      reject(new Error("Failed to load Kakao Maps script"));
    document.head.appendChild(script);
  });

  // 실패하면 다음 마운트에서 다시 시도할 수 있도록 캐시를 비운다.
  kakaoLoadPromise.catch(() => {
    kakaoLoadPromise = null;
  });
  return kakaoLoadPromise;
}

export default function KakaoMap({
  address,
  latitude,
  longitude,
  height = 280,
  className = "",
}: KakaoMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<KakaoMapInstance | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 주소·좌표가 바뀌면 이전 오류 표시를 지우고 다시 시도한다.
    setError(null);
    if (!APP_KEY || APP_KEY === "your_map_api_key_here") {
      setError("지도 API 키가 설정되지 않았습니다.");
      return;
    }
    const hasCoords = latitude != null && longitude != null;
    if (!hasCoords && (!address || !address.trim())) {
      setError("표시할 주소가 없습니다.");
      return;
    }

    let cancelled = false;
    loadKakaoScript()
      .then(() => {
        if (cancelled || !containerRef.current) return;
        const maps = window.kakao?.maps;
        const services = maps?.services;
        if (!maps || !services?.Geocoder) {
          setError(
            "지도 서비스(Geocoder)를 불러올 수 없습니다. 잠시 후 다시 시도해 주세요.",
          );
          return;
        }
        const geocoder = new services.Geocoder();

        const showMap = (lat: number, lng: number) => {
          if (!containerRef.current) return;
          const center = new maps.LatLng(lat, lng);
          const map = new maps.Map(containerRef.current, {
            center,
            level: 3,
          });
          const marker = new maps.Marker({ position: center });
          marker.setMap(map);
          mapRef.current = map;
        };

        if (hasCoords) {
          showMap(latitude!, longitude!);
          return;
        }
        geocoder.addressSearch(
          address!.trim(),
          (result: unknown, status: unknown) => {
            if (cancelled) return;
            const arr = Array.isArray(result) ? result : [];
            if (status === services.Status.OK && arr[0]) {
              const lat = parseFloat(arr[0].y);
              const lng = parseFloat(arr[0].x);
              showMap(lat, lng);
            } else {
              setError("주소를 찾을 수 없습니다.");
            }
          },
        );
      })
      .catch((e) => {
        if (!cancelled) setError(e?.message || "지도를 불러올 수 없습니다.");
      });

    return () => {
      cancelled = true;
      mapRef.current = null;
    };
  }, [address, latitude, longitude]);

  if (error) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-3 rounded-3xl border border-ink/10 bg-cream-200/60 px-6 text-center text-sm text-ink-muted [background-image:radial-gradient(rgba(34,28,22,.06)_1px,transparent_1px)] [background-size:14px_14px] ${className}`}
        style={{ height: typeof height === "number" ? `${height}px` : height }}
        role="img"
        aria-label={`보호소 위치 지도를 표시할 수 없습니다: ${error}`}
      >
        <span className="grid h-11 w-11 place-items-center rounded-full bg-cream-50 text-ink-soft shadow-card" aria-hidden>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
            <circle cx="12" cy="9.5" r="2.5" />
          </svg>
        </span>
        <span aria-hidden>{error}</span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`overflow-hidden rounded-3xl border border-ink/10 bg-cream-200 ${className}`}
      style={{ height: typeof height === "number" ? `${height}px` : height }}
      role="region"
      aria-label="보호소 위치 지도"
    />
  );
}
