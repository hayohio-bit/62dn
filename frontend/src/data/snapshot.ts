/**
 * 정적 데이터 스냅샷 로더. public/data/snapshot.json을 한 번만 받아 메모리에 둔다.
 * 파일은 scripts/build-data/ 스크립트가 만들고, 배포 때 사이트와 함께 올라간다.
 */
import type { Snapshot } from "@/types/snapshot";

/** Vite base 설정(BASE_URL)을 따르므로 GitHub Pages 하위 경로로 배포해도 그대로 동작한다 */
export const SNAPSHOT_URL = `${import.meta.env.BASE_URL}data/snapshot.json`;

let pending: Promise<Snapshot> | null = null;

/** 진행 중이거나 끝난 요청을 재사용한다. 실패하면 다음 호출에서 다시 요청한다. */
export function loadSnapshot(): Promise<Snapshot> {
  if (!pending) {
    pending = fetch(SNAPSHOT_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`데이터 스냅샷을 불러오지 못했습니다 (HTTP ${res.status})`);
        return res.json() as Promise<Snapshot>;
      })
      .catch((err: unknown) => {
        pending = null;
        throw err;
      });
  }
  return pending;
}

/** 테스트용: 받아 둔 스냅샷을 버린다 */
export function resetSnapshotCache() {
  pending = null;
}
