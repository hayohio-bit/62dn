import { beforeEach, describe, expect, it, vi } from "vitest";
import { createLocalStore } from "./localStore";

type Handler = (e: { key: string | null }) => void;

// 테스트 환경(node)에는 localStorage와 window가 없어 간단한 대역을 둔다
function stubBrowser() {
  const data = new Map<string, string>();
  const handlers = new Set<Handler>();
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
  });
  vi.stubGlobal("window", {
    addEventListener: (_: string, h: Handler) => handlers.add(h),
    removeEventListener: (_: string, h: Handler) => handlers.delete(h),
  });
  return { data, handlers };
}

describe("찜·선호 저장소", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
  });

  it("찜을 켜고 끄며 중복은 한 번만 담고 구독자에게 알린다", async () => {
    stubBrowser();
    const { favoritesStore, setFavorite } = await import("./favorites");
    const listener = vi.fn();
    favoritesStore.subscribe(listener);
    expect(favoritesStore.snapshot()).toEqual([]);
    setFavorite(3, true);
    setFavorite(3, true);
    setFavorite(7, true);
    expect(favoritesStore.snapshot()).toEqual([3, 7]);
    expect(listener).toHaveBeenCalledTimes(2);
    setFavorite(3, false);
    setFavorite(99, false);
    expect(favoritesStore.snapshot()).toEqual([7]);
    expect(listener).toHaveBeenCalledTimes(3);
  });

  it("같은 값이면 같은 배열 참조를 돌려준다 (useSyncExternalStore 요건)", async () => {
    stubBrowser();
    const { favoritesStore, setFavorite } = await import("./favorites");
    setFavorite(1, true);
    expect(favoritesStore.snapshot()).toBe(favoritesStore.snapshot());
  });

  it("손상된 값이나 숫자가 아닌 항목은 걸러 낸다", async () => {
    const { data } = stubBrowser();
    const { favoritesStore, FAVORITES_KEY } = await import("./favorites");
    data.set(FAVORITES_KEY, "{깨진 json");
    expect(favoritesStore.snapshot()).toEqual([]);
    data.set(FAVORITES_KEY, JSON.stringify([1, "2", null, 1, 3.5, 4]));
    expect(favoritesStore.snapshot()).toEqual([1, 4]);
  });

  it("다른 탭의 storage 이벤트로도 구독자를 깨운다", async () => {
    const { handlers } = stubBrowser();
    const { favoritesStore, FAVORITES_KEY } = await import("./favorites");
    const listener = vi.fn();
    const off = favoritesStore.subscribe(listener);
    handlers.forEach((h) => h({ key: FAVORITES_KEY }));
    handlers.forEach((h) => h({ key: "other" }));
    expect(listener).toHaveBeenCalledTimes(1);
    off();
    expect(handlers.size).toBe(0);
  });

  it("저장소를 쓸 수 없으면 기본값을 돌려주고 쓰기는 조용히 실패한다", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("denied");
      },
      setItem: () => {
        throw new Error("denied");
      },
    });
    const store = createLocalStore<number[]>("k", [], () => []);
    expect(store.snapshot()).toEqual([]);
    expect(() => store.write([1])).not.toThrow();
  });

  it("선호 조건은 알려진 값만 남기고 비어 있으면 null이다", async () => {
    stubBrowser();
    const { normalizePreference, savePreference, preferenceStore } = await import("./preference");
    expect(normalizePreference(null)).toBeNull();
    expect(normalizePreference({})).toBeNull();
    expect(normalizePreference({ species: "BIRD", size: "HUGE", minAge: -1, maxAge: 1.5, regions: [" ", 3] })).toBeNull();
    expect(
      normalizePreference({ species: "DOG", size: "SMALL", minAge: 0, maxAge: 5, regions: [" 서울 ", "서울", "경기", ""], extra: 1 }),
    ).toEqual({ species: "DOG", size: "SMALL", minAge: 0, maxAge: 5, regions: ["서울", "경기"] });
    expect(preferenceStore.snapshot()).toBeNull();
    expect(savePreference({ species: "CAT", regions: [] })).toEqual({ species: "CAT" });
    expect(preferenceStore.snapshot()).toEqual({ species: "CAT" });
    expect(savePreference({})).toBeNull();
    expect(preferenceStore.snapshot()).toBeNull();
  });
});
