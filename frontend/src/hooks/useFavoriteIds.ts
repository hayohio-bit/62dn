import { useSyncExternalStore } from "react";
import { favoritesStore, setFavorite } from "@/lib/favorites";

/**
 * 찜한 동물 id 목록. 브라우저에 저장되고, 어느 화면에서 바꿔도 모든 카드의 하트에 바로 반영된다.
 */
export function useFavoriteIds() {
  const favoriteIds = useSyncExternalStore(favoritesStore.subscribe, favoritesStore.snapshot);
  return { favoriteIds, setFavorite };
}
