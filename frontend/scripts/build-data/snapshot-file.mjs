// 스냅샷 파일 경로와 "오늘" 계산. 공고일·D-day의 기준 날짜는 서버 시간대와 무관하게 한국 날짜로 고정한다.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const frontendDir = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

/** 사이트가 읽는 스냅샷 파일. 빌드 결과물에는 /data/snapshot.json으로 들어간다. */
export const SNAPSHOT_PATH = resolve(frontendDir, "public", "data", "snapshot.json");

/** Asia/Seoul 기준 오늘을 "yyyy-MM-dd"로 돌려준다. */
export function koreanToday(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** "yyyy-MM-dd"에 일수를 더한다. 달력 계산은 UTC로 해서 시간대 영향을 받지 않는다. */
export function addDays(isoDate, days) {
  const [y, m, d] = isoDate.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

export function writeSnapshot(snapshot, path = SNAPSHOT_PATH) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
  return path;
}

/**
 * 실제 공공데이터로 만든 스냅샷이 비어 있으면 저장하지 않는다.
 * API가 오류 없이 0건을 돌려주는 경우(점검, 조회 조건 변경 등)에 배포가 사이트를 빈 화면으로 바꾸는 것을 막는다.
 */
export function assertNotEmpty(snapshot) {
  if (snapshot.animals.length === 0) {
    throw new Error("공공데이터에서 공고 중인 동물을 한 마리도 받지 못했습니다. 스냅샷을 저장하지 않습니다.");
  }
}
