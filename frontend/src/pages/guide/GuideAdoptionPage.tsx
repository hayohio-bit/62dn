import GuideLayout, { type GuideStep } from "@/components/guide/GuideLayout";
import Reveal from "@/components/motion/Reveal";

const ADOPTION_STEPS: GuideStep[] = [
  {
    title: "입양 전 필수 교육 완료",
    desc: "동물사랑배움터에서 제공하는 반려견 입양 전 교육을 반드시 이수하세요. 온라인으로 진행되며, 입양 전 준비사항, 반려견의 특성 이해, 건강관리 방법 등을 다룹니다.",
    link: { label: "동물사랑배움터", url: "https://apms.epis.or.kr" },
  },
  {
    title: "입양 대기 동물 확인",
    desc: "국가동물보호정보시스템에 접속하거나 각 지역 동물보호센터를 방문하여 입양 가능한 강아지를 확인하세요. 유실·유기동물은 보호소 입소 후 10일간의 공고 기간을 거친 후 분양 가능합니다.",
  },
  {
    title: "입양상담 예약",
    desc: "선택한 강아지가 있는 보호센터에 사전 전화 예약을 통해 방문 일정을 잡으세요. 유선 예약이 필수이며, 센터마다 다른 운영 시간과 상담자를 배정받습니다. 서울 예: 마포 02-2124-2839, 구로 02-2636-7650·7649, 동대문 02-921-2415.",
  },
  {
    title: "입양상담 및 동물 만남",
    desc: "입양 심사는 1~2회 이상의 면접과 만남을 통해 진행됩니다. 상담 시 신분증 2장 사본을 지참하고, 이동장, 안전문, 리드줄, 사료 등 기본 물품 준비 여부를 확인받습니다. 입양 후 파양(반환)은 불가능하므로 신중한 결정이 필요합니다.",
  },
  {
    title: "입양 계약 및 확정",
    desc: "모든 상담이 완료되면 입양계약서를 작성합니다. 입양신청서, 입양 전 교육 수료증, 신분증 사본 2장, 통장 사본(입양비 지원 신청 시)을 준비하세요. 입양이 확정되면 센터에서 전화로 공식 안내합니다.",
  },
  {
    title: "입양 후 관리",
    desc: "보호센터에서는 입양 전 중성화 수술과 동물등록을 완료한 상태로 반려견을 인도합니다. 입양 후 동물의 건강관리와 입양 후기 공유에 협조하세요.",
  },
];

const CAT_FLOW = ["정보 확인", "보호소에 전화로 입양 의사 전달", "서류 준비", "방문·상담", "동물 만남", "입양 확정"];

export default function GuideAdoptionPage() {
  return (
    <GuideLayout
      kind="adoption"
      eyebrow="Adoption guide"
      title="입양 절차 안내"
      desc="강아지·고양이 입양은 동물보호법에 따라 체계적으로 운영됩니다. 아래 단계를 차례로 따라가 주세요."
      notice={{
        title: "실제 신청·예약은 보호소에 전화로 진행합니다.",
        body: "상담 예약·운영 시간·지원금 등은 지자체·보호센터마다 다를 수 있으므로, 반드시 해당 지역 동물보호센터 또는 지자체에 전화로 확인하세요.",
      }}
      steps={ADOPTION_STEPS}
    >
      <Reveal className="mt-16 grid gap-6 md:mt-20 md:grid-cols-12">
        <div className="md:col-span-5">
          <p className="dn-eyebrow">For cats</p>
          <h2 className="mt-3 font-display text-3xl leading-tight text-ink md:text-4xl">고양이 입양 (보호소 유기묘)</h2>
        </div>
        <div className="md:col-span-7">
          <ol className="flex flex-wrap items-center gap-2 text-sm text-ink" aria-label="고양이 입양 순서">
            {CAT_FLOW.map((label, i) => (
              <li key={label} className="flex items-center gap-2">
                <span className="rounded-full border border-ink/15 bg-cream-50 px-3.5 py-1.5">{label}</span>
                {i < CAT_FLOW.length - 1 && (
                  <span aria-hidden className="text-ink-faint">
                    →
                  </span>
                )}
              </li>
            ))}
          </ol>
          <p className="mt-5 leading-relaxed text-ink-soft">
            동물보호관리시스템·지역 보호센터에서 입양 가능한 고양이를 조회할 수 있습니다.
          </p>
        </div>
      </Reveal>
    </GuideLayout>
  );
}
