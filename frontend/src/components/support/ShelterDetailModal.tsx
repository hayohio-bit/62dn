/**
 * 보호소 상세보기 모달
 * - 보호소 이름, 주소, 전화번호, 이메일 표시
 * - "전화 걸기" / "길찾기" 버튼 제공
 * - ESC 키 / 오버레이 클릭 시 닫힘
 */
import { useEffect } from "react";
import type { PublicShelterResponse } from "@/types/entities";

interface ShelterDetailModalProps {
  shelter: PublicShelterResponse;
  onClose: () => void;
}

export default function ShelterDetailModal({
  shelter,
  onClose,
}: ShelterDetailModalProps) {
  // ESC 키 닫기 + body 스크롤 잠금
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onEsc);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  // 카카오 지도 길찾기 URL 생성
  const kakaoMapUrl = shelter.latitude && shelter.longitude
    ? `https://map.kakao.com/link/to/${encodeURIComponent(shelter.name)},${shelter.latitude},${shelter.longitude}`
    : `https://map.kakao.com/link/search/${encodeURIComponent(shelter.address)}`;

  // 전화번호 정리 (숫자만)
  const cleanPhone = shelter.phone?.replace(/[^0-9]/g, "") || "";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* 오버레이 배경 */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* 모달 본체 */}
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <div className="flex items-center gap-3 min-w-0">
            <h2 className="text-xl font-bold text-gray-900 truncate">
              {shelter.name}
            </h2>
            {shelter.regionSido && (
              <span className="bg-orange-100 text-orange-700 text-xs px-2.5 py-1 rounded-full font-medium shrink-0">
                {shelter.regionSido} {shelter.regionSigungu}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-500 shrink-0"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        {/* 본문 */}
        <div className="p-6 space-y-5">
          {/* 주소 */}
          <div className="flex items-start gap-3">
            <span className="text-xl shrink-0 mt-0.5">📍</span>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">주소</p>
              <p className="text-gray-900">{shelter.address}</p>
            </div>
          </div>

          {/* 전화번호 */}
          {shelter.phone && (
            <div className="flex items-start gap-3">
              <span className="text-xl shrink-0 mt-0.5">📞</span>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">
                  전화번호
                </p>
                <a
                  href={`tel:${cleanPhone}`}
                  className="text-blue-600 hover:underline font-medium"
                >
                  {shelter.phone}
                </a>
              </div>
            </div>
          )}

          {/* 이메일 */}
          {shelter.email && (
            <div className="flex items-start gap-3">
              <span className="text-xl shrink-0 mt-0.5">✉️</span>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">
                  이메일
                </p>
                <a
                  href={`mailto:${shelter.email}`}
                  className="text-blue-600 hover:underline font-medium"
                >
                  {shelter.email}
                </a>
              </div>
            </div>
          )}
        </div>

        {/* 하단 액션 버튼 */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex gap-3 rounded-b-2xl">
          {shelter.phone && (
            <a
              href={`tel:${cleanPhone}`}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors"
            >
              📞 전화 걸기
            </a>
          )}
          <a
            href={kakaoMapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#FEE500] text-gray-900 font-bold rounded-xl hover:bg-[#FADB00] transition-colors"
          >
            카카오맵 길찾기
          </a>
        </div>
      </div>
    </div>
  );
}
