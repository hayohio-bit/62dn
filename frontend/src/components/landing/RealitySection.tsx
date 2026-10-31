import { useEffect, useRef, useState } from "react";
import { animate, useInView, useReducedMotion } from "framer-motion";
import Reveal from "@/components/motion/Reveal";
import { NOTICE_RULE, realityStats } from "@/constants/landingContent";
import StatsSourceLinks from "@/components/landing/StatsSourceLinks";
import { assetUrl } from "@/lib/assetUrl";

/** 화면에 들어오면 0부터 목표 숫자까지 올라간다 */
function CountUp({ to, decimals = 0 }: { to: number; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px 0px" });
  const reduce = useReducedMotion();
  const [value, setValue] = useState(reduce ? to : 0);

  useEffect(() => {
    if (!inView || reduce) return;
    const controls = animate(0, to, {
      duration: 1.6,
      ease: [0.2, 0.8, 0.2, 1],
      onUpdate: (v) => setValue(v),
    });
    return () => controls.stop();
  }, [inView, reduce, to]);

  return <span ref={ref}>{value.toFixed(decimals)}</span>;
}

/** 보호소의 현실: 2025년 구조된 동물이 어떻게 되었는지 */
export default function RealitySection() {
  return (
    <section className="bg-cream-200/60">
      <div className="mx-auto grid max-w-[76rem] gap-12 px-6 py-24 md:grid-cols-12 md:items-center md:py-32">
        <Reveal className="relative md:col-span-6">
          <div className="overflow-hidden rounded-[1.75rem]">
            <img
              src={assetUrl("hero-three-left-behind.webp")}
              alt="텅 빈 보호소 견사에 홀로 앉아 있는 개"
              loading="lazy"
              className="aspect-[4/3] w-full object-cover"
            />
          </div>
          <p className="absolute -bottom-5 right-5 max-w-[15rem] rounded-2xl bg-ink px-5 py-4 text-sm leading-relaxed text-cream shadow-lift">
            {NOTICE_RULE}
          </p>
        </Reveal>

        <div className="md:col-span-5 md:col-start-8">
          <Reveal>
            <p className="dn-eyebrow">Reality · 2025</p>
            <h2 className="mt-4 font-display text-4xl leading-tight md:text-5xl">
              구조된 동물 중
              <br />
              <span className="text-terracotta">약 4분의 1</span>이
              <br />
              입양으로 새 가족을 만나요
            </h2>
            <p className="mt-6 leading-relaxed text-ink-soft">
              2025년 한 해 동안 95,685마리가 구조되었습니다. 구조된 동물 전체 가운데 입양 25.6%, 자연사 25.7%, 인도적
              처리 17.3%, 보호중 13.2%, 반환 11.2%, 기증 4.6%, 방사·미포획 2.4%로 조치되었어요. 한편 1년 안에 반려동물
              입양 계획이 있는 응답자의 88.3%는 유실·유기동물 입양 의향이 있다고 답했어요. 그 마음이 보호소에 닿으면
              더 많은 아이가 새 가족을 만날 수 있어요.
            </p>
          </Reveal>

          <dl className="mt-12 grid grid-cols-3 gap-6 border-t border-ink/15 pt-8">
            {realityStats.map((s, i) => (
              <Reveal key={s.label} delay={i * 0.1} className="flex flex-col-reverse justify-end">
                {/* 화면에는 숫자를 위에 두되, 스크린리더는 라벨(dt)을 먼저 읽도록 순서를 뒤집어 배치한다 */}
                <dt className="mt-2 text-[0.8125rem] leading-snug text-ink-muted">{s.label}</dt>
                <dd className="font-display font-display-strong text-4xl md:text-5xl">
                  <CountUp to={s.value} decimals={s.decimals} />
                  <span className="text-2xl">{s.suffix}</span>
                </dd>
              </Reveal>
            ))}
          </dl>
          <p className="mt-8 text-xs leading-relaxed text-ink-muted">
            <StatsSourceLinks />
            <br />
            비율은 구조 동물 전체(95,685마리) 대비이며, 마지막 숫자는 원문의 자연사와 인도적 처리 비율을 더해 계산한 값입니다.
          </p>
        </div>
      </div>
    </section>
  );
}
