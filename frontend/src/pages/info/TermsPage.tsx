import { Link } from "react-router-dom";
import InfoPage, { ExternalLink, type InfoSection } from "@/components/info/InfoPage";
import { CONTACT_URL, INFO_EFFECTIVE_DATE } from "@/constants/info";
import { statsSources } from "@/constants/landingContent";

/**
 * 이용 안내
 * 회원가입이나 거래가 없어 계약을 맺는 약관이 아니라, 정보의 출처·정확성·한계를 알리는 안내문이다.
 * 기능을 바꾸면 이 문서도 함께 고친다.
 */
const sections: InfoSection[] = [
  {
    id: "service",
    title: "이 사이트는 무엇인가요",
    children: (
      <p>
        전국 보호소의 유기동물 공고를 공공데이터로 모아 보여 주는 안내 사이트입니다. 입양, 임시보호, 봉사, 기부의
        신청과 예약은 이 사이트에서 받지 않고 각 보호소에 전화로 진행합니다.
      </p>
    ),
  },
  {
    id: "source",
    title: "공고 정보의 출처와 정확성",
    children: (
      <>
        <p>
          공고 정보는 농림축산식품부 농림축산검역본부의 국가동물보호정보시스템 구조동물 조회 서비스(공공데이터포털)에서
          받아 매일 새벽에 갱신을 시도합니다. 공고 내용은 보호소의 사정에 따라 수시로 바뀌므로, 이 사이트의 정보가 실제와 다를 수
          있고 이 사이트는 정확성이나 최신성을 보증하지 않습니다.
        </p>
        <p>입양이나 방문을 결정하기 전에 반드시 해당 보호소에 전화해 현재 상태를 확인해 주세요.</p>
      </>
    ),
  },
  {
    id: "processed",
    title: "사이트가 가공해서 보여 주는 정보",
    children: (
      <ul className="list-disc space-y-2 pl-5">
        <li>
          <strong className="font-semibold text-ink">임시 이름:</strong> 공고에 이름이 없는 동물에는 털색·크기·나이 등을 보고
          임시로 이름을 붙이고 &lsquo;임시 이름&rsquo;으로 표시합니다. 보호소가 부르는 이름과 다를 수 있습니다.
        </li>
        <li>
          <strong className="font-semibold text-ink">크기:</strong> 공고에 크기가 없어 체중으로 추정한 값은
          &lsquo;(추정)&rsquo;으로 표시합니다. 중성화 여부가 확인되지 않은 동물은 &lsquo;보호소 확인 필요&rsquo;로 표시합니다.
        </li>
        <li>
          <strong className="font-semibold text-ink">공고 기간 막대:</strong> 남은 기간을 숫자 없이 대략적인 길이로만
          보여 주며 정확한 일수가 아닙니다.
        </li>
        <li>
          <strong className="font-semibold text-ink">추천:</strong> 이 브라우저에 저장한 선호 조건과 맞는 동물을 모아 보여 주는
          기능이며 입양 적합성을 판단해 주지 않습니다.
        </li>
      </ul>
    ),
  },
  {
    id: "stats",
    title: "통계와 법령 안내",
    children: (
      <>
        <p>
          랜딩 화면의 통계는 아래 자료를 2026년 10월 31일에 원문과 대조해 옮긴 것입니다. 법령 설명은 동물보호법 2026. 10. 27.
          시행본을 확인한 요약이며 법률 자문이 아닙니다. 정확한 내용은 법령 원문과 해당 지자체·보호소에서 확인해 주세요.
        </p>
        <ul className="list-disc space-y-1 pl-5">
          {statsSources.map((s) => (
            <li key={s.href}>
              <ExternalLink href={s.href}>{s.label}</ExternalLink> <span className="whitespace-nowrap">({s.published})</span>
            </li>
          ))}
        </ul>
      </>
    ),
  },
  {
    id: "links",
    title: "외부 사이트와 지도",
    children: (
      <p>
        국가동물보호정보시스템, 동물사랑배움터, 카카오맵 길찾기처럼 다른 사이트로 연결되는 링크와 지도는 해당 운영자가
        제공합니다. 이동한 사이트의 내용과 정책은 그 운영자의 책임입니다. 이 사이트가 브라우저에 저장하는 정보와 접속 시
        연결되는 외부 서비스는{" "}
        <Link to="/privacy" className="underline underline-offset-2 hover:text-ink">
          개인정보 처리방침
        </Link>
        에 있습니다.
      </p>
    ),
  },
  {
    id: "license",
    title: "저작권과 라이선스",
    children: (
      <p>
        이 사이트의 소스 코드는 MIT 라이선스로{" "}
        <ExternalLink href={CONTACT_URL}>공개 저장소</ExternalLink>에 있습니다. 공고 정보와 동물 사진은 공공데이터와 공고를
        게시한 기관의 자료이며, 이 사이트는 그에 대한 권리를 주장하지 않습니다.
      </p>
    ),
  },
  {
    id: "contact",
    title: "문의와 변경",
    children: (
      <p>
        사이트에 대한 문의와 잘못된 정보 제보는 <ExternalLink href={CONTACT_URL}>사이트 저장소</ExternalLink>로 남겨 주세요.
        안내 내용이 바뀌면 이 페이지를 고치고 시행일을 갱신합니다. 이 안내는 <span className="whitespace-nowrap">{INFO_EFFECTIVE_DATE}</span>부터 적용됩니다.
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <InfoPage
      eyebrow="Terms"
      title="이용 안내"
      intro="이 사이트의 정보가 어디에서 왔고 어디까지 믿을 수 있는지, 이용할 때 알아 두면 좋은 점을 알려 드려요."
      effectiveDate={INFO_EFFECTIVE_DATE}
      sections={sections}
    />
  );
}
