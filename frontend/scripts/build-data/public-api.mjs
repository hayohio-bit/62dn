// 공공데이터포털 "농림축산식품부 구조동물 조회 서비스 v2" 호출과 응답 해석.
// 서비스 키는 URL에만 넣고 로그·오류 메시지에는 넣지 않는다.

export const DEFAULT_BASE_URL = "https://apis.data.go.kr/1543061/abandonmentPublicService_v2";
const ANIMAL_LIST_PATH = "/abandonmentPublic_v2";
const KIND_LIST_PATH = "/getKindList";

/** 오류 메시지에 서비스 키가 섞여 나가지 않도록 가린다. */
export function maskServiceKey(text) {
  return text.replace(/(serviceKey=)[^&\s"'<>]+/gi, "$1***");
}

export function buildUrl(baseUrl, path, params) {
  const url = new URL(baseUrl + path);
  for (const [key, value] of Object.entries(params)) {
    if (value != null && value !== "") url.searchParams.set(key, String(value));
  }
  return url;
}

/**
 * 응답 본문에서 item 목록을 꺼낸다.
 * - header.resultCode가 "00"이 아니면 body가 있어도 오류 → 실패
 * - 정상이고 결과가 0건이면 items가 빈 문자열로 온다 → []
 * - item이 하나면 배열이 아니라 객체로 온다 → [item]
 * - 인증 오류는 JSON이 아니라 XML(OpenAPI_ServiceResponse)로 온다 → returnAuthMsg를 담아 실패
 * - body 없이 header.resultCode만 오면 한도 초과 등 오류 → 실패
 */
export function parseItems(text) {
  if (text == null || text.trim() === "") throw new Error("공공 API 응답이 비어 있습니다.");
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    const m = /<returnAuthMsg>([A-Za-z0-9_ ]{1,100})<\/returnAuthMsg>/.exec(text);
    throw new Error(m ? `공공 API 오류 응답: ${m[1].trim()}` : "공공 API 응답을 해석할 수 없습니다.");
  }
  const auth = data?.OpenAPI_ServiceResponse?.cmmMsgHeader;
  if (auth) {
    throw new Error(`공공 API 오류 응답: ${auth.errMsg ?? auth.returnAuthMsg ?? "알 수 없음"}`);
  }
  const response = data?.response;
  if (response == null || typeof response !== "object") {
    throw new Error("공공 API 응답 형식이 올바르지 않습니다.");
  }
  // 한도 초과(22) 같은 오류는 HTTP 200에 resultCode만 바뀌어 올 수 있다. body 유무와 관계없이 코드가 "00"이 아니면 실패다.
  const code = response.header?.resultCode;
  if ((code != null && code !== "00") || response.body == null) {
    const msg = response.header?.resultMsg;
    throw new Error(`공공 API 오류 응답: resultCode=${code ?? "?"} ${msg ?? ""}`.trim());
  }
  const items = response.body.items;
  if (items == null || items === "" || items.item == null) return [];
  return Array.isArray(items.item) ? items.item : [items.item];
}

async function getText(fetchImpl, url) {
  const res = await fetchImpl(url);
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`공공 API 호출 실패 (HTTP ${res.status}): ${maskServiceKey(text).slice(0, 300)}`);
  }
  return text;
}

/**
 * 축종 하나의 공고를 전부 받는다. 한 페이지가 numOfRows보다 적게 오면 마지막 페이지다.
 * 날짜 범위(bgnde·endde)는 주어질 때만 보낸다.
 */
export async function fetchAnimals({
  fetchImpl = fetch,
  baseUrl = DEFAULT_BASE_URL,
  serviceKey,
  upkind,
  state = "notice",
  numOfRows = 1000,
  bgnde,
  endde,
  maxPages = 100,
  onPage = () => {},
}) {
  const all = [];
  for (let pageNo = 1; pageNo <= maxPages; pageNo += 1) {
    const url = buildUrl(baseUrl, ANIMAL_LIST_PATH, {
      serviceKey,
      pageNo,
      numOfRows,
      _type: "json",
      upkind,
      state,
      bgnde,
      endde,
    });
    const items = parseItems(await getText(fetchImpl, url));
    onPage({ upkind, pageNo, count: items.length });
    all.push(...items);
    if (items.length < numOfRows) break;
  }
  return all;
}

/** 품종 코드 → 품종명 표. kindCd가 코드로만 오는 항목의 품종명을 채우는 데 쓴다. */
export async function fetchKindMap({ fetchImpl = fetch, baseUrl = DEFAULT_BASE_URL, serviceKey, upkinds }) {
  const map = new Map();
  for (const upkind of upkinds) {
    const url = buildUrl(baseUrl, KIND_LIST_PATH, { serviceKey, upkind, _type: "json" });
    for (const kind of parseItems(await getText(fetchImpl, url))) {
      const code = kind.kindCd?.trim();
      const name = kind.kNm?.trim();
      if (code && name) map.set(code, name);
    }
  }
  return map;
}
