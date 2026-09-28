import { useEffect, useRef, useState } from "react";
import { animate, useInView, useReducedMotion } from "framer-motion";
import Reveal from "@/components/motion/Reveal";
import { realityStats } from "@/constants/landingContent";

/** 화면에 들어오면 0부터 목표 숫자까지 올라간다 */
function CountUp({ to }: { to: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px 0px" });
  const reduce = useReducedMotion();
  const [value, setValue] = useState(reduce ? to : 0);

  useEffect(() => {
    if (!inView || reduce) return;
    const controls = animate(0, to, {
      duration: 1.6,
      ease: [0.2, 0.8, 0.2, 1],
      onUpdate: (v) => setValue(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, reduce, to]);

  return <span ref={ref}>{value}</span>;
}

/** 보호소의 현실: 구조되어도 절반은 돌아가지 못한다 */
export default function RealitySection() {
  return (
    <section className="bg-cream-200/60">
      <div className="mx-auto grid max-w-[76rem] gap-12 px-6 py-24 md:grid-cols-12 md:items-center md:py-32">
        <Reveal className="relative md:col-span-6">
          <div className="overflow-hidden rounded-[1.75rem]">
            <img
              src="/hero-three-left-behind.webp"
              alt="텅 빈 보호소 견사에 홀로 앉아 있는 개"
              loading="lazy"
              className="aspect-[4/3] w-full object-cover grayscale-[35%]"
            />
          </div>
          <p className="absolute -bottom-5 right-5 max-w-[15rem] rounded-2xl bg-ink px-5 py-4 text-sm leading-relaxed text-cream shadow-lift">
            공고 기간 10일이 지나면, 많은 아이들이 보호소에 그대로 남습니다.
          </p>
        </Reveal>

        <div className="md:col-span-5 md:col-start-8">
          <Reveal>
            <p className="dn-eyebrow">The other 62%</p>
            <h2 className="mt-4 font-serif text-4xl leading-tight md:text-5xl">
              구조되어도,
              <br />
              <span className="text-terracotta">절반은</span> 집으로
              <br />
              돌아가지 못해요
            </h2>
            <p className="mt-6 leading-relaxed text-ink-soft">
              매년 10만 마리가 넘는 동물이 보호소에 들어옵니다. 그중 절반 가까이는 자연사하거나 안락사로 생을 마감해요.
              마음속에만 있던 입양 의향이 실제 행동으로 이어진다면, 이 숫자는 바뀔 수 있습니다.
            </p>
          </Reveal>

          <dl className="mt-12 grid grid-cols-3 gap-6 border-t border-ink/15 pt-8">
            {realityStats.map((s, i) => (
              <Reveal key={s.label} delay={i * 0.1}>
                <dd className="font-serif text-4xl md:text-5xl">
                  <CountUp to={s.value} />
                  <span className="text-2xl">{s.suffix}</span>
                </dd>
                <dt className="mt-2 text-[0.8125rem] leading-snug text-ink-muted">{s.label}</dt>
              </Reveal>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
