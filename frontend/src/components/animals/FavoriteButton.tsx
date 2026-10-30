/**
 * 찜(즐겨찾기) 버튼 - 하트 아이콘
 * 로그인 없이 쓰고, 이 브라우저에 저장한다. 같은 동물의 하트는 어느 화면에서든 함께 바뀐다.
 */

import clsx from "clsx";
import { useFavoriteIds } from "@/hooks/useFavoriteIds";

interface FavoriteButtonProps {
  animalId: number;
  /** 목록에서 스크린리더가 어느 동물의 버튼인지 구분할 수 있도록 라벨에 넣는다 */
  animalName?: string | null;
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

export default function FavoriteButton({ animalId, animalName, className = "", size = "md" }: FavoriteButtonProps) {
  const { favoriteIds, setFavorite } = useFavoriteIds();
  const favorited = favoriteIds.includes(animalId);

  const handleClick = (e: React.MouseEvent) => {
    // 카드 링크로 이동하지 않도록 한다
    e.preventDefault();
    e.stopPropagation();
    setFavorite(animalId, !favorited);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={favorited}
      aria-label={`${animalName ? `${animalName} ` : ""}${favorited ? "찜 해제" : "찜하기"}`}
      className={clsx(
        "grid shrink-0 place-items-center rounded-full backdrop-blur transition duration-200",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta",
        "active:scale-95",
        favorited
          ? "bg-terracotta text-white shadow-glow hover:bg-terracotta-600"
          : "bg-cream-50/85 text-ink shadow-card hover:bg-white hover:text-terracotta",
        sizeClasses[size],
        className,
      )}
    >
      <svg
        className={iconSize[size]}
        viewBox="0 0 24 24"
        fill={favorited ? "currentColor" : "none"}
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
