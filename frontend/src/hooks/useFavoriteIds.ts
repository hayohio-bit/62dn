import { useEffect, useState } from "react";
import { favoriteApi } from "@/api";
import { useAuthStore } from "@/store/authStore";

/**
 * 로그인한 사용자가 찜한 동물 id 목록. 카드의 하트 표시에 쓴다.
 * 비로그인 상태이거나 조회에 실패하면 빈 목록이다.
 */
export function useFavoriteIds() {
  const { isAuthenticated } = useAuthStore();
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);

  useEffect(() => {
    if (!isAuthenticated) {
      setFavoriteIds([]);
      return;
    }
    let cancelled = false;
    favoriteApi
      .getMyFavoriteIds()
      .then((ids) => !cancelled && setFavoriteIds(ids))
      .catch(() => !cancelled && setFavoriteIds([]));
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  /** 카드에서 찜을 누르거나 해제한 결과를 목록에 반영한다 */
  const toggle = (animalId: number, added: boolean) =>
    setFavoriteIds((prev) => (added ? [...prev, animalId] : prev.filter((id) => id !== animalId)));

  return { favoriteIds, toggle };
}
