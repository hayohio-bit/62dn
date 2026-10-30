/**
 * localStorage 값을 구독 가능한 저장소로 다룬다. 같은 탭의 컴포넌트와 다른 탭(storage 이벤트)에 변경을 알린다.
 * 저장소를 쓸 수 없거나(사생활 보호 모드 등) 값이 손상됐으면 기본값을 돌려주고, 저장 실패는 무시한다.
 */
export function createLocalStore<T>(key: string, fallback: T, normalize: (raw: unknown) => T) {
  const listeners = new Set<() => void>();
  let cache: { raw: string | null; value: T } | null = null;

  function snapshot(): T {
    let raw: string | null = null;
    try {
      raw = localStorage.getItem(key);
    } catch {
      return fallback;
    }
    if (cache && cache.raw === raw) return cache.value;
    let value = fallback;
    if (raw != null) {
      try {
        value = normalize(JSON.parse(raw));
      } catch {
        value = fallback;
      }
    }
    cache = { raw, value };
    return value;
  }

  function write(value: T) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // 저장 공간이 없거나 저장소를 쓸 수 없으면 기록하지 않는다
      return;
    }
    listeners.forEach((l) => l());
  }

  function subscribe(listener: () => void) {
    listeners.add(listener);
    const onStorage = (e: StorageEvent) => {
      if (e.key === key || e.key === null) listener();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  }

  return { snapshot, write, subscribe };
}
