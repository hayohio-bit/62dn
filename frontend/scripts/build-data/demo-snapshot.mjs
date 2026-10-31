// 공공데이터 서비스 키 없이 화면을 확인할 수 있는 데모 스냅샷.
// 백엔드 local 프로필의 LocalDemoDataLoader와 같은 보호소 6곳, 동물 20마리를 만든다.
// 공고일은 오늘(Asia/Seoul) 기준 상대값이라 실행할 때마다 새로 계산한다. 그래서 JSON을 커밋하지 않고 이 생성기를 커밋한다.
import { fileURLToPath } from "node:url";
import { sizeFromWeight, temporaryName } from "./transform.mjs";
import { addDays, koreanToday, writeSnapshot } from "./snapshot-file.mjs";

const UNSPLASH = (photoId) => `https://images.unsplash.com/photo-${photoId}?w=600&h=600&fit=crop`;

// [이름, 주소, 시도, 시군구, 위도, 경도, 전화]
const SHELTERS = [
  ["서울 강동 동물보호센터", "서울특별시 강동구 성내로 25", "서울", "강동구", 37.5301, 127.1238, "02-0000-1001"],
  ["경기 남양주 동물보호센터", "경기도 남양주시 경춘로 1037", "경기", "남양주시", 37.636, 127.2165, "031-000-1002"],
  ["인천 연수 동물보호센터", "인천광역시 연수구 원인재로 115", "인천", "연수구", 37.4101, 126.6783, "032-000-1003"],
  ["대전 유성 동물보호센터", "대전광역시 유성구 대학로 211", "대전", "유성구", 36.3624, 127.3562, "042-000-1004"],
  ["부산 해운대 동물보호센터", "부산광역시 해운대구 중동2로 11", "부산", "해운대구", 35.1631, 129.1636, "051-000-1005"],
  ["제주 동물보호센터", "제주특별자치도 제주시 광양9길 10", "제주", "제주시", 33.4996, 126.5312, "064-000-1006"],
];

// [보호소 인덱스, 종류, 품종, 이름, 나이, 성별, 크기, 체중, Unsplash 사진 id, 설명, 중성화, 공고 마감까지 일수]
const ANIMALS = [
  [0, "DOG", "믹스견", "보리", 2, "MALE", "MEDIUM", 12.4, "1477884213360-7e9d7dcc1e48", "산책을 좋아하고 사람을 잘 따르는 활발한 아이입니다.", true, 2],
  [1, "DOG", "퍼그", "먹물", 4, "FEMALE", "SMALL", 7.8, "1517849845537-4d257902454a", "조용하고 느긋한 성격으로 실내 생활에 잘 적응합니다.", true, 5],
  [2, "DOG", "웰시코기", "호두", 1, "MALE", "SMALL", 9.1, "1537151625747-768eb6cf92b2", "호기심이 많고 장난감 놀이를 좋아하는 어린 강아지입니다.", false, 1],
  [3, "DOG", "비글", "콩이", 3, "FEMALE", "MEDIUM", 11.0, "1543466835-00a7907e9de1", "밝은 표정으로 늘 꼬리를 흔드는 사교적인 아이입니다.", true, 8],
  [4, "DOG", "요크셔테리어", "밤톨", 1, "MALE", "SMALL", 2.3, "1546527868-ccb7ee7dfa6a", "작은 체구지만 용감하고 애교가 많습니다.", false, 12],
  [0, "DOG", "골든 리트리버", "햇살", 5, "FEMALE", "LARGE", 27.5, "1552053831-71594a27632d", "순하고 차분해서 아이가 있는 가정에도 잘 어울립니다.", true, 3],
  [1, "DOG", "골든 리트리버", "누리", 6, "MALE", "LARGE", 30.2, "1558788353-f76d92427f16", "사람 곁에 있는 것을 좋아하는 든든한 대형견입니다.", true, 20],
  [2, "DOG", "잭 러셀 테리어", "초코", 2, "MALE", "SMALL", 6.5, "1561037404-61cd46aa615b", "에너지가 넘쳐 매일 충분한 산책이 필요합니다.", true, 6],
  [3, "DOG", "프렌치 불도그", "망고", 3, "FEMALE", "SMALL", 10.2, "1583337130417-3346a1be7dee", "사람 무릎 위를 좋아하는 애교쟁이입니다.", true, 15],
  [4, "DOG", "프렌치 불도그", "두부", 2, "MALE", "SMALL", 11.4, "1583511655857-d19b40a7a54e", "처음엔 낯을 가리지만 금방 친해지는 아이입니다.", false, 25],
  [5, "DOG", "보더콜리 믹스", "구름", 4, "FEMALE", "MEDIUM", 16.8, "1587300003388-59208cc962cb", "영리해서 기본 훈련을 빠르게 익혔습니다.", true, 9],
  [5, "DOG", "골든 리트리버", "보름", 1, "MALE", "LARGE", 22.0, "1633722715463-d30f4f325e24", "잔디밭 산책을 가장 좋아하는 명랑한 청소년견입니다.", false, 30],
  [0, "CAT", "코리안숏헤어", "나비", 2, "FEMALE", "SMALL", 3.9, "1495360010541-f48722b34f7d", "조용히 곁을 지켜 주는 차분한 고양이입니다.", true, 4],
  [1, "CAT", "턱시도", "양말", 3, "MALE", "SMALL", 4.8, "1514888286974-6c03e2ca1dba", "사람 손길을 좋아하고 골골송을 잘 부릅니다.", true, 7],
  [2, "CAT", "코리안숏헤어", "호랑", 4, "MALE", "SMALL", 5.2, "1518791841217-8f162f1e1131", "창가에서 햇볕 쬐는 것을 좋아하는 느긋한 고양이입니다.", true, 11],
  [3, "CAT", "코리안숏헤어", "모찌", 1, "FEMALE", "SMALL", 3.1, "1543852786-1cf6624b9987", "장난감 낚싯대 놀이를 무척 좋아합니다.", false, 2],
  [4, "CAT", "메인쿤 믹스", "치즈", 5, "MALE", "MEDIUM", 6.7, "1573865526739-10659fec78a5", "덩치는 크지만 성격은 누구보다 순한 고양이입니다.", true, 18],
  [5, "CAT", "코리안숏헤어", "초록", 2, "FEMALE", "SMALL", 4.0, "1574158622682-e40e69881006", "초록 눈이 매력적인 호기심 많은 고양이입니다.", true, 14],
  [0, "CAT", "코리안숏헤어", "솜이", 1, "FEMALE", "SMALL", 2.2, "1592194996308-7b43878e84a6", "사람을 보면 먼저 다가오는 애교 많은 아기 고양이입니다.", false, 10],
  [1, "CAT", "코리안숏헤어", "귤이", 3, "MALE", "SMALL", 5.5, "1596854407944-bf87f6fdd49e", "현재 임시보호 가정에서 지내고 있습니다.", true, 21],
];

/** 마지막 고양이 "귤이"는 임시보호 중이다. */
const FOSTERING_INDEX = 19;

/** 공공데이터로 들어온 동물처럼 보이게 하는 항목: [동물 인덱스, 유기번호, 체중 모름 여부] */
const PUBLIC_DATA_MARKS = [
  [9, "448500202600101", false],
  [17, "448500202600102", true],
];

/**
 * 데모 스냅샷을 만든다. today는 "yyyy-MM-dd"(Asia/Seoul).
 * 공고 시작일은 동물마다 0~8일 전으로 달라서 "새로 들어온 순" 정렬을 확인할 수 있다.
 */
export function buildDemoSnapshot(today = koreanToday(), generatedAt = new Date().toISOString()) {
  const shelters = SHELTERS.map(([name, address, regionSido, regionSigungu, latitude, longitude, phone], i) => ({
    id: i + 1,
    name,
    address,
    regionSido,
    regionSigungu,
    latitude,
    longitude,
    phone,
  }));

  const animals = ANIMALS.map(([s, species, breed, name, age, gender, size, weight, photoId, description, neutered, daysUntilNoticeEnd], i) => {
    const shelter = shelters[s];
    return {
      id: i + 1,
      publicApiAnimalId: null,
      shelterId: shelter.id,
      species,
      breed,
      color: null,
      name,
      age,
      gender,
      size,
      weight,
      neutered,
      status: i === FOSTERING_INDEX ? "FOSTERING" : "PROTECTED",
      noticeStartDate: addDays(today, -(daysUntilNoticeEnd % 9)),
      noticeEndDate: addDays(today, daysUntilNoticeEnd),
      imageUrl: UNSPLASH(photoId),
      description,
      orgName: `${shelter.regionSido} ${shelter.regionSigungu}`,
      chargeName: null,
      chargePhone: shelter.phone,
      createdAt: generatedAt,
    };
  });

  // 공공데이터 동물은 유기번호가 있고, 이름은 임시 이름이며, 중성화·체중을 모른다. 크기는 체중으로 추정한다.
  for (const [index, desertionNo, weightUnknown] of PUBLIC_DATA_MARKS) {
    const a = animals[index];
    a.publicApiAnimalId = desertionNo;
    a.neutered = false;
    if (weightUnknown) a.weight = null;
    a.size = sizeFromWeight(a.weight);
    // 이름은 마지막에 정한다 (체중을 모르면 크기도 특징에서 빠진다)
    a.name = temporaryName(desertionNo, a.species === "CAT", { color: a.color, size: a.size, age: a.age, breed: a.breed });
  }

  return { version: 1, source: "demo", generatedAt, today, animals, shelters };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const snapshot = buildDemoSnapshot();
  const path = writeSnapshot(snapshot);
  console.log(`데모 스냅샷 저장: ${path} (동물 ${snapshot.animals.length}마리, 보호소 ${snapshot.shelters.length}곳, 기준일 ${snapshot.today})`);
}
