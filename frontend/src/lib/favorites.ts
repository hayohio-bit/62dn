/**
 * 찜한 동물 id (브라우저 localStorage, 기기마다 따로 저장). 로그인 없이 쓴다.
 * 스냅샷이 갱신되어 공고가 끝난 동물의 id도 남겨 두고, 보여 줄 때만 거른다.
 */
import { createLocalStore } from "@/lib/localStore";

export const FAVORITES_KEY = "dn:favorites";
const EMPTY: number[] = [];

export const favoritesStore = createLocalStore<number[]>(FAVORITES_KEY, EMPTY, (raw) => {
  if (!Array.isArray(raw)) return EMPTY;
  const ids = raw.filter((v): v is number => Number.isSafeInteger(v));
  return Array.from(new Set(ids));
});

/** 찜을 켜거나 끈다. 새 상태(true=찜함)를 돌려준다. 최근에 찜한 것이 뒤에 온다 */
export function setFavorite(animalId: number, favorited: boolean): boolean {
  const current = favoritesStore.snapshot();
  const has = current.includes(animalId);
  if (favorited && !has) favoritesStore.write([...current, animalId]);
  if (!favorited && has) favoritesStore.write(current.filter((id) => id !== animalId));
  return favorited;
}
