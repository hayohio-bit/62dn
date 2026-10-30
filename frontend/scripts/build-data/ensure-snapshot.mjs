#!/usr/bin/env node
// dev·build 전에 실행된다. 스냅샷 파일이 없을 때만 데모 스냅샷을 만들어, 키 없이도 화면이 뜨게 한다.
// 실제 데이터로 배포할 때는 이보다 먼저 `npm run data:fetch`를 실행하므로 덮어쓰지 않는다.
import { existsSync } from "node:fs";
import { buildDemoSnapshot } from "./demo-snapshot.mjs";
import { SNAPSHOT_PATH, writeSnapshot } from "./snapshot-file.mjs";

if (existsSync(SNAPSHOT_PATH)) {
  console.log(`스냅샷이 이미 있어 그대로 둡니다: ${SNAPSHOT_PATH}`);
} else {
  writeSnapshot(buildDemoSnapshot(), SNAPSHOT_PATH);
  console.log(`스냅샷이 없어 데모 스냅샷을 만들었습니다: ${SNAPSHOT_PATH}`);
}
