/** 테스트에서 데모 스냅샷 생성기(Node 스크립트)를 픽스처로 쓰기 위한 선언 */
declare module "*/scripts/build-data/demo-snapshot.mjs" {
  import type { Snapshot } from "@/types/snapshot";
  export function buildDemoSnapshot(today?: string, generatedAt?: string): Snapshot;
}
