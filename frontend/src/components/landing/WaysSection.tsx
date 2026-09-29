import { Link } from "react-router-dom";
import Reveal from "@/components/motion/Reveal";
import { ways } from "@/constants/landingContent";

/** 함께하는 세 가지 방법: 입양, 임시보호, 봉사·기부 */
export default function WaysSection() {
  return (
    <section className="mx-auto max-w-[76rem] px-6 py-24 md:py-32">
      <Reveal className="grid gap-6 md:grid-cols-12">
        <div className="md:col-span-5">
          <p className="dn-eyebrow">How to help</p>
          <h2 className="mt-4 font-display text-4xl leading-tight md:text-[3.25rem]">
            마음을 행동으로 옮기는
            <br />세 가지 방법
          </h2>
        </div>
        <p className="self-end text-lg leading-relaxed text-ink-soft md:col-span-6 md:col-start-7">
          꼭 입양이 아니어도 괜찮아요. 잠시 집을 내어 주는 임시보호, 한 시간의 산책 봉사, 담요 한 장의 후원도 한 생명의
          하루를 바꿉니다.
        </p>
      </Reveal>

      <div className="mt-16 border-t border-ink/15">
        {ways.map((w, i) => (
          <Reveal key={w.no} delay={i * 0.08}>
            <Link
              to={w.to}
              className="group grid items-center gap-4 border-b border-ink/15 py-8 transition-colors md:grid-cols-12 md:py-10"
            >
              <span className="font-display text-lg text-ink-faint md:col-span-1">{w.no}</span>
              <h3 className="font-display font-display-strong text-4xl transition-colors group-hover:text-terracotta md:col-span-4 md:text-5xl">
                {w.title}
              </h3>
              <p className="leading-relaxed text-ink-soft md:col-span-5">{w.desc}</p>
              <span className="flex items-center gap-2 text-[0.9375rem] font-semibold md:col-span-2 md:justify-end">
                {w.cta}
                <span className="grid h-10 w-10 place-items-center rounded-full border border-ink/20 transition group-hover:border-terracotta group-hover:bg-terracotta group-hover:text-white">
                  →
                </span>
              </span>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
