import GuideLayout, { type GuideStep } from "@/components/guide/GuideLayout";

const FOSTER_STEPS: GuideStep[] = [
  {
    title: "임보 신청서 작성",
    desc: "임보를 희망하는 단체나 개인이 제시하는 신청 양식을 작성합니다. 임보 희망 동물의 이름, 관리 가능한 문제 상황, 임보 가능 기간(최소 2개월 이상), 주거지 형태 등을 기재합니다.",
  },
  {
    title: "가정 환경 점검",
    desc: "임보 전 반드시 확인할 체크리스트: 가족 전원이 임보에 적극 동의, 환경의 안전 위험 요소 제거, 초기 2주간 집중 돌봄 가능성, 주거 규정(반려동물 사육 허용 여부), 응급 상황 시 병원 접근성.",
  },
  {
    title: "계약서 작성",
    desc: "임보자와 구조 단체 간의 책임 범위를 명확히 하는 계약서를 작성합니다. 임보 동물의 기본 정보, 의료 책임 범위, 입양 실패 시 처리 방법, 동물 학대 및 유기 금지, 긴급 연락처 등이 포함됩니다.",
  },
  {
    title: "동물 인수",
    desc: "구조 단체로부터 동물을 인수할 때 기본 건강 상태, 기본 케어용품 제공 여부, 의료 기록 및 예방접종 현황, 응급 시 24시간 연락처를 확인하세요.",
  },
];

export default function GuideFosterPage() {
  return (
    <GuideLayout
      kind="foster"
      eyebrow="Foster guide"
      title="임보 절차 안내"
      desc="임시보호(임보)는 입양으로 가는 과정의 중요한 경로이며, 강아지·고양이 모두 가능합니다."
      notice={{
        title: "실제 신청은 해당 단체/보호소에 전화로 문의하세요.",
        body: "임보 비용·지원 내용은 단체마다 다를 수 있으므로, 희망하는 단체에 직접 전화로 확인하세요.",
      }}
      steps={FOSTER_STEPS}
    />
  );
}
