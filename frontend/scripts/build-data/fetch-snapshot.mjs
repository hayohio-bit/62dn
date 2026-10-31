// 공공데이터 API에서 공고 중인 동물을 받아 public/data/snapshot.json을 만든다.
//
//   DATA_API_KEY=<공공데이터포털 서비스 키(디코딩 값)> node scripts/build-data/fetch-snapshot.mjs [--out <경로>] [--days <N>]
//
// --days N: 공고 시작일 범위를 오늘-N일 ~ 오늘(bgnde·endde)로 제한한다. 기본은 범위 없이 state=notice 전체다.
// 서비스 키는 URL에만 쓰고 출력하지 않는다.
import { CAT_CODE, DOG_CODE, buildSnapshot } from "./transform.mjs";
import { fetchAnimals, maskServiceKey } from "./public-api.mjs";
import { summarizeColors } from "./names.mjs";
import { SNAPSHOT_PATH, addDays, assertNotEmpty, koreanToday, writeSnapshot } from "./snapshot-file.mjs";

function parseArgs(argv) {
  const args = { out: SNAPSHOT_PATH, days: null };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--out") args.out = argv[++i];
    else if (argv[i] === "--days") args.days = Number(argv[++i]);
    else throw new Error(`알 수 없는 옵션: ${argv[i]}`);
  }
  if (args.days != null && (!Number.isInteger(args.days) || args.days < 0)) {
    throw new Error("--days 값은 0 이상의 정수여야 합니다.");
  }
  return args;
}

async function main() {
  const { out, days } = parseArgs(process.argv.slice(2));
  const serviceKey = process.env.DATA_API_KEY;
  if (!serviceKey) {
    console.error("DATA_API_KEY 환경 변수가 없습니다. 공공데이터포털에서 발급한 서비스 키(디코딩 값)를 넣어 실행하세요.");
    console.error("키 없이 화면을 확인하려면 `npm run data:demo`로 데모 스냅샷을 만듭니다.");
    process.exit(1);
  }

  const today = koreanToday();
  const compact = (isoDate) => isoDate.replace(/-/g, "");
  const range = days == null ? {} : { bgnde: compact(addDays(today, -days)), endde: compact(today) };

  let items = [];
  for (const upkind of [DOG_CODE, CAT_CODE]) {
    const fetched = await fetchAnimals({
      serviceKey,
      upkind,
      ...range,
      onPage: ({ pageNo, count }) => console.log(`upkind=${upkind} page=${pageNo} ${count}건`),
    });
    items = items.concat(fetched);
  }

  const snapshot = buildSnapshot({
    items,
    today,
    generatedAt: new Date().toISOString(),
    source: "public-api",
  });
  assertNotEmpty(snapshot);
  const colors = summarizeColors(snapshot.animals);
  console.log(`털색: 분류 ${colors.classified}마리, 못 알아본 표기 ${colors.unclassified}마리, 털색 없음 ${colors.missing}마리`);
  if (colors.topUnclassified.length > 0) console.log(`못 알아본 털색 표기(많은 순): ${colors.topUnclassified.map(([v, n]) => `${v} ${n}`).join(", ")}`);
  const path = writeSnapshot(snapshot, out);
  console.log(`스냅샷 저장: ${path}`);
  console.log(`받은 항목 ${items.length}건 → 동물 ${snapshot.animals.length}마리, 보호소 ${snapshot.shelters.length}곳 (기준일 ${today})`);
}

main().catch((err) => {
  console.error(maskServiceKey(err instanceof Error ? err.message : String(err)));
  process.exit(1);
});
