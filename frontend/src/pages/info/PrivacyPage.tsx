import { Link } from "react-router-dom";
import InfoPage, { ExternalLink, InfoTable, type InfoSection } from "@/components/info/InfoPage";
import { CONTACT_URL, INFO_EFFECTIVE_DATE } from "@/constants/info";

/**
 * 개인정보 처리방침
 * 아래 내용은 2026. 11. 1. 기준 코드에서 확인한 사실만 쓴다 (frontend/src의 localStorage·sessionStorage 사용처, index.html과
 * KakaoMap.tsx의 외부 요청, 분석·추적 스크립트 없음, 서버로 입력을 보내는 코드 없음). 기능을 바꾸면 이 문서도 함께 고친다.
 */
const sections: InfoSection[] = [
  {
    id: "summary",
    title: "수집하지 않는 정보",
    children: (
      <>
        <p>
          이 사이트에는 회원가입, 로그인, 문의 입력창이 없습니다. 운영자는 방문자의 이름, 연락처, 주소 같은 개인정보를
          수집하거나 서버에 저장하지 않습니다. 분석·광고·추적 도구도 쓰지 않습니다.
        </p>
        <p>사이트가 직접 설정하는 쿠키는 없습니다.</p>
      </>
    ),
  },
  {
    id: "browser",
    title: "내 브라우저에 저장되는 정보",
    children: (
      <>
        <p>
          아래 정보는 방문자의 기기(브라우저)에만 저장됩니다. 서버로 전송되지 않고 운영자는 볼 수 없습니다. 브라우저 설정의
          &lsquo;사이트 데이터 삭제&rsquo;로 언제든 지울 수 있고, 기기마다 따로 저장되어 다른 기기와 공유되지 않습니다.
        </p>
        <InfoTable
          caption="브라우저에 저장되는 정보"
          head={["항목", "저장 내용", "쓰는 곳", "보관"]}
          rows={[
            ["관심 동물", "관심 동물로 저장한 동물의 번호", "관심 동물 화면", "직접 지우기 전까지 (localStorage)"],
            ["입양 선호 조건", "종류, 나이 범위, 크기, 지역", "‘나를 위한 추천’", "직접 지우기 전까지 (localStorage)"],
            [
              "최근 본 동물",
              "최근 본 동물 최대 10마리의 번호, 이름, 사진 주소, 종류, 품종, 공고 종료일",
              "동물 목록 위의 ‘최근 본 아이들’",
              "직접 지우기 전까지 (localStorage). 목록의 ‘기록 지우기’로 삭제",
            ],
            ["화면 위치", "페이지별 스크롤 위치", "뒤로 가기 때 원래 자리로 복원", "탭을 닫으면 삭제 (sessionStorage)"],
            ["새로고침 표시", "사이트가 갱신된 뒤 화면을 한 번 다시 불러왔다는 표시", "갱신 직후 화면 오류를 막는 용도", "탭을 닫으면 삭제 (sessionStorage)"],
          ]}
        />
      </>
    ),
  },
  {
    id: "third-party",
    title: "외부 서비스로 전달될 수 있는 접속 정보",
    children: (
      <>
        <p>
          사이트를 열면 방문자의 브라우저가 아래 서비스에 직접 접속합니다. 이때 방문자의 IP 주소와 브라우저 정보가 각
          서비스에 전달될 수 있고, 그 처리는 각 서비스의 정책에 따릅니다. 운영자는 이 정보를 받거나 저장하지 않습니다.
        </p>
        <InfoTable
          caption="접속 때 연결되는 외부 서비스"
          head={["서비스", "용도", "연결되는 때"]}
          rows={[
            ["GitHub Pages (GitHub, Inc.)", "사이트 파일 제공(호스팅)", "모든 화면"],
            ["Google Fonts (fonts.googleapis.com, fonts.gstatic.com)", "‘Gowun Dodum’ 글꼴", "모든 화면"],
            ["jsDelivr (cdn.jsdelivr.net)", "‘Pretendard’ 글꼴", "모든 화면"],
            ["국가동물보호정보시스템 (openapi.animal.go.kr)", "동물 사진", "동물 사진이 보이는 화면"],
            ["카카오 지도 (dapi.kakao.com)", "지도 표시", "동물 상세·보호소 화면에서 지도를 보여 줄 때. 지도 SDK가 추가로 접속하는 주소와 저장하는 정보는 카카오의 정책을 따릅니다"],
          ]}
        />
        <p>
          화면의 링크(국가동물보호정보시스템, 카카오맵 길찾기 등)를 눌러 다른 사이트로 이동한 뒤에는 그 사이트의 정책이
          적용됩니다.
        </p>
      </>
    ),
  },
  {
    id: "public-data",
    title: "공고에 게시된 보호소·담당자 정보",
    children: (
      <p>
        동물 상세 화면에는 공공데이터로 공개된 공고의 보호소 연락처와 담당자 이름·연락처가 그대로 표시됩니다. 이 사이트가
        새로 수집한 정보가 아니며, 정정이나 삭제는 공고를 게시한 보호소·지자체에 요청해 주세요. 공고 정보는 매일
        새벽에 갱신을 시도해 반영하므로 최신 상태와 다를 수 있습니다.
      </p>
    ),
  },
  {
    id: "your-choices",
    title: "방문자가 할 수 있는 일",
    children: (
      <p>
        브라우저에 저장된 정보는 브라우저의 사이트 데이터 삭제로 지울 수 있고, 외부 서비스로 가는 연결은 브라우저의 콘텐츠
        차단 기능이나 확장 프로그램으로 막을 수 있습니다. 글꼴이나 지도가 막히면 화면이 조금 다르게 보일 수 있지만
        동물 정보는 그대로 볼 수 있습니다.
      </p>
    ),
  },
  {
    id: "contact",
    title: "문의",
    children: (
      <>
        <p>
          이 방침이나 사이트에 대한 문의는 사이트 저장소(
          <ExternalLink href={CONTACT_URL}>{CONTACT_URL}</ExternalLink>
          )로 남겨 주세요. 이 사이트에는 별도의 개인정보 보호책임자나 전용 연락처가 없습니다.
        </p>
        <p>
          입양·임시보호·봉사·기부 문의는 이 사이트가 아니라 해당 보호소에 직접 해 주세요. 사이트 이용에 관한 안내는{" "}
          <Link to="/terms" className="underline underline-offset-2 hover:text-ink">
            이용 안내
          </Link>
          에 있습니다.
        </p>
      </>
    ),
  },
  {
    id: "changes",
    title: "방침의 변경",
    children: (
      <p>
        사이트가 쓰는 외부 서비스나 저장하는 정보가 바뀌면 이 페이지를 고치고 시행일을 갱신합니다. 이 방침은{" "}
        <span className="whitespace-nowrap">{INFO_EFFECTIVE_DATE}</span>부터 적용됩니다.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <InfoPage
      eyebrow="Privacy"
      title="개인정보 처리방침"
      intro="이 사이트가 어떤 정보를 다루는지, 방문자의 브라우저와 외부 서비스에서 무슨 일이 일어나는지 알려 드려요."
      effectiveDate={INFO_EFFECTIVE_DATE}
      sections={sections}
    />
  );
}
