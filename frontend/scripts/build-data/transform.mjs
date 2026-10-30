// 공공데이터(농림축산식품부 구조동물 조회 v2) 응답을 사이트가 읽는 스냅샷으로 바꾸는 규칙.
// 백엔드 AnimalSyncService·TemporaryNames·SizeEstimate·AddressRegionParser·ContactPhone의 규칙을 그대로 옮겼다.
// 규칙을 바꾸면 화면의 표시 원칙(임시 이름, "(추정)" 크기, 보호소 확인 필요)이 달라지므로 테스트로 고정한다.

export const DOG_CODE = "417000";
export const CAT_CODE = "422400";
export const IMAGE_VIEW_BASE = "https://www.animal.go.kr/front/fileMng/imageView.do?f=";

// 공고에는 이름이 없어서 목록에서 구분할 수 있도록 붙이는 임시 이름 후보. 개와 고양이 이름은 겹치지 않는다.
export const DOG_NAMES = [
  "보리", "코코", "몽이", "콩이", "별이", "똘이", "쫑이", "꼬미", "하루", "하니",
  "모리", "비비", "토토", "루루", "단비", "세나", "요미", "행복", "뭉치", "뭉이",
  "몽실", "송이", "쥬리", "설이", "모모", "돌체", "라떼", "우주", "구찌", "루이",
  "랄프", "로이", "리리", "조이", "루비", "나나", "리아", "아루", "세이", "슈슈",
  "쪼꼬", "바람", "연탄", "바오", "루피", "바리", "해피", "사랑", "장군", "로렌",
  "로제", "마루", "두부", "떡이", "감자", "쿠키", "초코", "땅콩", "복이", "봉이",
  "순이", "땡이", "코디", "레오", "미미", "조조", "티티", "뽀미", "샤샤", "호두",
  "메이", "벨라", "루시", "데이", "뚱이", "소이", "노아", "엘리", "로미", "쿠마",
  "츄츄", "시나", "구름", "달이", "온유", "누리", "수아", "예미", "봄이", "가을",
  "꽃비", "도리", "라이", "키키", "피치", "쥬디", "베리", "코지", "바다", "하늘",
  "플로", "오리", "애니", "토리",
];

export const CAT_NAMES = [
  "라라", "바비", "도도", "루나", "소피", "징고", "무무", "핸니", "유채", "살랑",
  "소복", "포근", "눈꽃", "파도", "햇살", "샤인", "단풍", "밤콜", "보미", "꽃송",
  "라일", "새싹", "파블", "미소", "쪼미", "히야", "냥이", "초이", "리오", "올리",
  "쿠퍼", "제이", "로빈", "나옹", "야옹", "꾸미", "링링", "콩순", "까미", "초롱",
  "별솔", "하늘이", "달맞", "꽃이", "솜이", "버블", "스노우", "밍키", "토미", "제스",
  "까울", "루니", "보라", "하온", "수니", "다니", "율무", "새봄", "푸른", "하리",
  "고니", "달빛", "별빛", "꼬망", "냥순", "꼬리", "망고", "치즈", "모찌", "단지",
  "루카", "코니", "버니", "찰리", "찰스", "미키", "미니", "캔디", "팝콘", "호야",
  "시리", "다롱", "꼬물", "삐삐", "삐약", "꼬꼬", "찌니", "뽀뽀", "쭈니", "뿌니",
  "꿀미", "꿀떡", "말랑", "폭신", "달달", "콩닥", "깜순", "깜돌", "하트", "별님",
  "달님", "솜방울", "꼬마", "방울", "깨비", "두리", "몽실이", "꼬네", "콩알", "방울이",
  "꼬꼬미", "꾸꾸", "냥냥", "멍멍이", "캐럿", "샤이", "포포", "코알", "미뇽",
];

const isBlank = (s) => s == null || String(s).trim() === "";
const cut = (s, max) => (s.length > max ? s.slice(0, max) : s);
const yearOf = (isoDate) => Number(isoDate.slice(0, 4));

/** Java String.hashCode와 같은 32비트 정수 해시. 같은 유기번호가 백엔드와 같은 임시 이름을 받게 한다. */
export function javaHashCode(s) {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return h;
}

/** Java Math.floorMod: 음수에도 0 이상 n 미만을 돌려준다. */
export function floorMod(a, n) {
  return ((a % n) + n) % n;
}

/** 유기번호로 임시 이름을 고정 배정한다. 유기번호가 없으면 첫 이름이다. */
export function temporaryName(desertionNo, isCat) {
  const pool = isCat ? CAT_NAMES : DOG_NAMES;
  if (isBlank(desertionNo)) return pool[0];
  return pool[floorMod(javaHashCode(desertionNo), pool.length)];
}

/** 체중 문자열의 첫 번째 숫자를 kg으로 읽는다. "1~2(Kg)"는 12가 아니라 1이다. */
export function parseWeight(weight) {
  if (isBlank(weight)) return null;
  const m = /\d+(\.\d+)?/.exec(weight);
  if (!m) return null;
  const n = Number(m[0]);
  return Number.isFinite(n) ? n : null;
}

/** 체중으로 크기를 추정한다. 5kg 미만 SMALL, 15kg 미만 MEDIUM, 그 이상 LARGE. 모르면 null. */
export function sizeFromWeight(kg) {
  if (kg == null || kg <= 0) return null;
  if (kg < 5) return "SMALL";
  if (kg < 15) return "MEDIUM";
  return "LARGE";
}

/** 나이 문자열. 4자리 이상 숫자는 출생연도로 보고 올해와의 차이를, 그 외는 숫자 그대로 쓴다. */
export function parseAge(age, today) {
  if (isBlank(age)) return null;
  const num = String(age).replace(/[^0-9]/g, "");
  if (num.length >= 4) {
    return yearOf(today) - Number(num.slice(0, 4));
  }
  if (num === "") return null;
  return Number(num);
}

export function mapGender(sexCd) {
  if (sexCd == null) return null;
  switch (String(sexCd).toUpperCase()) {
    case "M":
      return "MALE";
    case "F":
      return "FEMALE";
    default:
      return null;
  }
}

/** 보호중·공고중 → PROTECTED, 임시보호 → FOSTERING, 입양·안락사·자연사·반환 등 → null(제외). */
export function mapStatus(processState) {
  if (processState == null) return "PROTECTED";
  if (processState.includes("임시보호")) return "FOSTERING";
  if (processState.includes("보호") || processState.includes("공고")) return "PROTECTED";
  return null;
}

export function mapSpecies(item) {
  if (item.upKindCd === CAT_CODE) return "CAT";
  if (item.upKindCd === DOG_CODE) return "DOG";
  const full = item.kindFullNm;
  if (full != null && full.includes("고양이")) return "CAT";
  return "DOG";
}

/** kindNm → kindFullNm에서 [축종] 제거 → kindCd 순. 품종 코드표(kindMap)에 있으면 이름으로 바꾸고, 숫자 코드만 남으면 "믹스". */
export function extractBreed(item, kindMap = new Map()) {
  if (!isBlank(item.kindNm)) return cut(item.kindNm.trim(), 50);
  const full = item.kindFullNm;
  const s = full != null ? full.replace(/\[.*?\]\s*/g, "").trim() : item.kindCd ?? "";
  if (s === "") return "믹스";
  const name = kindMap.get(s);
  if (name != null) return cut(name, 50);
  if (/^\d{4,}$/.test(s)) return "믹스";
  return cut(s, 50);
}

/** "yyyyMMdd..." 앞 8자리를 "yyyy-MM-dd"로. 달력에 없는 날짜면 null. */
export function parseDate(dateStr) {
  if (dateStr == null || dateStr.length < 8) return null;
  const m = /^(\d{4})(\d{2})(\d{2})/.exec(dateStr);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
  return `${m[1]}-${m[2]}-${m[3]}`;
}

/** popfile1 → popfile2 → popfile → filename 순. 전체 URL이 아니면 animal.go.kr 이미지 뷰어 주소로 만든다. */
export function resolveImageUrl(item) {
  const raw = [item.popfile1, item.popfile2, item.popfile, item.filename].find((v) => !isBlank(v));
  if (raw == null) return null;
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  let relPath;
  if (raw.startsWith("/files/")) {
    relPath = raw;
  } else if (raw.startsWith("/")) {
    relPath = raw.startsWith("/files") ? raw : `/files${raw}`;
  } else if (raw.startsWith("shelter/")) {
    relPath = `/files/${raw}`;
  } else {
    const dt = parseDate(item.happenDt);
    const filePart = raw.includes("/") ? raw.slice(raw.lastIndexOf("/") + 1) : raw;
    relPath =
      dt != null ? `/files/shelter/${dt.slice(0, 4)}/${dt.slice(5, 7)}/${filePart}` : `/files/shelter/${filePart}`;
  }
  return IMAGE_VIEW_BASE + relPath;
}

/** "[발견장소] …"와 "[특징] …"을 빈 줄로 이어 붙인다. 2000자 제한. */
export function buildDescription(item) {
  const parts = [];
  if (!isBlank(item.happenPlace)) parts.push(`[발견장소] ${item.happenPlace}`);
  if (!isBlank(item.specialMark)) parts.push(`[특징] ${item.specialMark}`);
  if (parts.length === 0) return null;
  return cut(parts.join("\n\n"), 2000);
}

/** 빈 값이면 null, 아니면 trim 후 maxLen까지. 관할기관·담당자·연락처용. */
export function trimMax(s, maxLen) {
  if (isBlank(s)) return null;
  return cut(s.trim(), maxLen);
}

/** 전화 링크로 내보낼 수 있는 번호만 남긴다. 숫자가 전부 0인 번호("000-0000-0000")는 없는 것으로 본다. */
export function usablePhone(phone) {
  if (isBlank(phone)) return null;
  const digits = phone.replace(/[^0-9]/g, "");
  if (digits === "" || /^0+$/.test(digits)) return null;
  return phone.trim();
}

// 주소에서 시/도·시군구를 뽑는 규칙. 긴 패턴을 먼저 맞춰 "경기도"가 "경기"보다 앞서게 한다 (길이 내림차순, 같은 길이는 선언 순서).
const SIDO_PATTERNS = [
  ["서울특별시", "서울"], ["부산광역시", "부산"], ["대구광역시", "대구"], ["인천광역시", "인천"],
  ["광주광역시", "광주"], ["대전광역시", "대전"], ["울산광역시", "울산"], ["세종특별자치시", "세종"],
  ["경기도", "경기"], ["강원특별자치도", "강원"], ["강원도", "강원"], ["충청북도", "충북"],
  ["충청남도", "충남"], ["전북특별자치도", "전북"], ["전라북도", "전북"], ["전라남도", "전남"],
  ["경상북도", "경북"], ["경상남도", "경남"], ["제주특별자치도", "제주"], ["제주도", "제주"],
  ["서울", "서울"], ["부산", "부산"], ["대구", "대구"], ["인천", "인천"], ["광주", "광주"],
  ["대전", "대전"], ["울산", "울산"], ["세종", "세종"], ["경기", "경기"], ["강원", "강원"],
  ["충북", "충북"], ["충남", "충남"], ["전북", "전북"], ["전남", "전남"], ["경북", "경북"],
  ["경남", "경남"], ["제주", "제주"],
].sort((a, b) => b[0].length - a[0].length);

const SIGUNGU_NAMES = [
  "남양주시", "고양시", "성남시", "수원시", "시흥시", "안산시", "안성시", "안양시", "양주시", "여주시",
  "오산시", "용인시", "의왕시", "의정부시", "이천시", "파주시", "평택시", "포천시", "하남시", "화성시",
  "부천시", "광명시", "광주시", "구리시", "군포시", "김포시", "동두천시", "가평군", "과천시", "양평군",
  "연천군",
  "강남구", "강동구", "강북구", "강서구", "관악구", "광진구", "구로구", "금천구", "노원구", "도봉구",
  "동대문구", "동작구", "마포구", "서대문구", "서초구", "성동구", "성북구", "송파구", "양천구", "영등포구",
  "용산구", "은평구", "종로구", "중랑구",
  "금정구", "기장군", "동래구", "부산진구", "사상구", "사하구", "수영구", "연제구", "영도구", "해운대구",
  "달서구", "수성구", "달성군",
  "강화군", "계양구", "남동구", "미추홀구", "부평구", "연수구", "옹진군",
  "광산구",
  "대덕구", "유성구",
  "울주군",
  "강릉시", "동해시", "삼척시", "속초시", "원주시", "춘천시", "태백시", "고성군", "양구군", "양양군",
  "영월군", "인제군", "정선군", "철원군", "평창군", "홍천군", "화천군", "횡성군",
  "괴산군", "단양군", "보은군", "영동군", "옥천군", "음성군", "제천시", "진천군", "청주시", "충주시",
  "증평군",
  "계룡시", "공주시", "금산군", "논산시", "당진시", "보령시", "부여군", "서산시", "서천군", "아산시",
  "예산군", "천안시", "청양군", "태안군", "홍성군",
  "고창군", "군산시", "김제시", "남원시", "무주군", "부안군", "순창군", "완주군", "익산시", "임실군",
  "장수군", "전주시", "정읍시", "진안군",
  "강진군", "고흥군", "곡성군", "광양시", "구례군", "나주시", "담양군", "목포시", "무안군", "보성군",
  "순천시", "신안군", "여수시", "영광군", "영암군", "완도군", "장성군", "장흥군", "진도군", "함평군",
  "해남군", "화순군",
  "경산시", "경주시", "고령군", "구미시", "김천시", "문경시", "봉화군", "상주시", "성주군", "안동시",
  "영덕군", "영양군", "영주시", "영천시", "예천군", "울릉군", "울진군", "의성군", "청도군", "청송군",
  "칠곡군", "포항시",
  "거제시", "거창군", "김해시", "남해군", "밀양시", "사천시", "산청군", "양산시", "의령군", "진주시",
  "창녕군", "창원시", "통영시", "하동군", "함안군", "함양군", "합천군",
  "서귀포시", "제주시",
  "남구", "동구", "북구", "서구", "중구",
].sort((a, b) => b.length - a.length);

/** 주소 → { sido, sigungu }. 프론트엔드 지역 필터 값과 같은 형식(예: 서울, 남양주시). 없으면 null. */
export function parseRegion(address) {
  if (isBlank(address)) return { sido: null, sigungu: null };
  const trimmed = address.trim();
  const sido = SIDO_PATTERNS.find(([pattern]) => trimmed.includes(pattern))?.[1] ?? null;
  const sigungu = SIGUNGU_NAMES.find((name) => trimmed.includes(name)) ?? null;
  return { sido, sigungu };
}

/** 공고 항목에서 보호소 정보를 만든다. 이름이 없으면 "미상". 공공데이터에는 좌표가 없다. */
export function shelterFromItem(item) {
  const name = isBlank(item.careNm) ? "미상" : item.careNm;
  const address = item.careAddr ?? "";
  const { sido, sigungu } = parseRegion(address);
  return {
    name,
    address,
    regionSido: sido,
    regionSigungu: sigungu,
    phone: usablePhone(item.careTel),
    latitude: null,
    longitude: null,
  };
}

/** 유기번호를 숫자 id로. 안전 정수가 아니면 null을 돌려주고 호출 쪽이 순번을 준다. */
export function idFromDesertionNo(desertionNo) {
  if (!/^\d+$/.test(desertionNo)) return null;
  const n = Number(desertionNo);
  return Number.isSafeInteger(n) ? n : null;
}

/**
 * 공공데이터 항목 목록을 스냅샷으로 만든다.
 * 제외: 유기번호 없음, 보호 대상 아님(입양·안락사 등), 공고 마감일이 오늘(Asia/Seoul) 이전. 같은 유기번호는 첫 항목만 쓴다.
 * 보호소는 이름으로 식별하고 첫 등장 순서로 id를 준다 (백엔드와 같은 규칙).
 */
export function buildSnapshot({ items, kindMap = new Map(), today, generatedAt, source }) {
  const shelters = [];
  const shelterIdByName = new Map();
  const animals = [];
  const seen = new Set();
  const usedIds = new Set();
  let fallbackId = 1;

  for (const item of items) {
    if (isBlank(item.desertionNo)) continue;
    const desertionNo = item.desertionNo.trim();
    if (seen.has(desertionNo)) continue;
    const status = mapStatus(item.processState);
    const noticeEndDate = parseDate(item.noticeEdt);
    if (status == null || (noticeEndDate != null && noticeEndDate < today)) continue;
    seen.add(desertionNo);

    const shelter = shelterFromItem(item);
    let shelterId = shelterIdByName.get(shelter.name);
    if (shelterId == null) {
      shelterId = shelters.length + 1;
      shelterIdByName.set(shelter.name, shelterId);
      shelters.push({ id: shelterId, ...shelter });
    }

    let id = idFromDesertionNo(desertionNo);
    if (id == null || usedIds.has(id)) {
      while (usedIds.has(fallbackId)) fallbackId += 1;
      id = fallbackId;
    }
    usedIds.add(id);

    const species = mapSpecies(item);
    const weight = parseWeight(item.weight);
    animals.push({
      id,
      publicApiAnimalId: desertionNo,
      shelterId,
      species,
      breed: extractBreed(item, kindMap),
      name: temporaryName(desertionNo, species === "CAT"),
      age: parseAge(item.age, today),
      gender: mapGender(item.sexCd),
      size: sizeFromWeight(weight),
      weight,
      neutered: String(item.neuterYn ?? "").toUpperCase() === "Y",
      status,
      noticeStartDate: parseDate(item.noticeSdt),
      noticeEndDate,
      imageUrl: resolveImageUrl(item),
      description: buildDescription(item),
      orgName: trimMax(item.orgNm, 100),
      chargeName: trimMax(item.chargeNm, 50),
      chargePhone: usablePhone(trimMax(item.officetel, 30)),
      createdAt: generatedAt,
    });
  }

  return { version: 1, source, generatedAt, today, animals, shelters };
}
