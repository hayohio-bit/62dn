/**
 * 찜(즐겨찾기) 버튼 - 하트 아이콘
 * 로그인 시 토글, 비로그인 시 로그인 페이지로 이동한 뒤 이 동물 상세로 돌아온다.
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";
import { favoriteApi } from "@/api";
import { useAuthStore } from "@/store/authStore";

interface FavoriteButtonProps {
  animalId: number;
  isFavorited: boolean;
  onToggle?: (newState: boolean) => void;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
};

const iconSize = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-[1.375rem] w-[1.375rem]",
};

const HEART =
  "M12 20.3l-1.2-1.1C6.1 15 3 12.2 3 8.8 3 6 5.2 3.8 8 3.8c1.6 0 3.1.7 4 1.9.9-1.2 2.4-1.9 4-1.9 2.8 0 5 2.2 5 5 0 3.4-3.1 6.2-7.8 10.4L12 20.3z";

export default function FavoriteButton({
  animalId,
  isFavorited,
  onToggle,
  className = "",
  size = "md",
}: FavoriteButtonProps) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [favorited, setFavorited] = useState(isFavorited);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setFavorited(isFavorited);
  }, [isFavorited]);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      navigate("/login", { state: { from: `/animals/${animalId}` } });
      return;
    }

    if (loading) return;
    setLoading(true);
    try {
      const newState = !favorited;
      if (newState) {
        await favoriteApi.add(animalId);
      } else {
        await favoriteApi.remove(animalId);
      }
      setFavorited(newState);
      onToggle?.(newState);
    } catch {
      // 실패하면 상태를 바꾸지 않는다
    } finally {
      setLoading(false);
    }
  };

  const active = isAuthenticated && favorited;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      aria-pressed={isAuthenticated ? favorited : undefined}
      aria-label={!isAuthenticated ? "로그인 후 찜하기" : favorited ? "찜 해제" : "찜하기"}
      title={!isAuthenticated ? "로그인하면 찜할 수 있어요" : undefined}
      className={clsx(
        "grid shrink-0 place-items-center rounded-full backdrop-blur transition duration-200",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta",
        "disabled:cursor-wait active:scale-95",
        active
          ? "bg-terracotta text-white shadow-glow hover:bg-terracotta-600"
          : "bg-cream-50/85 text-ink shadow-card hover:bg-white hover:text-terracotta",
        sizeClasses[size],
        className,
      )}
    >
      <svg
        className={iconSize[size]}
        viewBox="0 0 24 24"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinejoin="round"
        aria-hidden
      >
        <path d={HEART} />
      </svg>
    </button>
  );
}
