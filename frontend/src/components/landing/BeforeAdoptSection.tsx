import { Link } from "react-router-dom";
import Reveal from "@/components/motion/Reveal";
import { beforeAdopt } from "@/constants/landingContent";

/** 입양 전에 생각해 볼 세 가지 */
export default function BeforeAdoptSection() {
  return (
    <section className="mx-auto max-w-[76rem] px-6 py-24 md:py-32">
      <Reveal className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="dn-eyebrow">Before you adopt</p>
          <h2 className="mt-4 font-display text-4xl leading-tight md:text-5xl">
            데려오기 전에,
            <br />
            세 가지만 생각해 주세요
          </h2>
        </div>
        <Link to="/guide/adoption" className="border-b border-ink/30 pb-0.5 text-[0.9375rem] hover:border-ink">
          입양 절차 자세히 보기
        </Link>
      </Reveal>

      <ol className="mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
        {beforeAdopt.map((item, i) => (
          <li key={item.title} className={i === 1 ? "md:mt-16" : undefined}>
            <Reveal delay={i * 0.1}>
              <div className="overflow-hidden rounded-[1.5rem]">
                <img src={item.image} alt={item.alt} loading="lazy" className="aspect-[4/3] w-full object-cover" />
              </div>
              <p className="mt-6 text-sm font-semibold tabular-nums text-terracotta-600">0{i + 1}</p>
              <h3 className="mt-2 font-display text-2xl leading-snug">{item.title}</h3>
              <p className="mt-3 leading-relaxed text-ink-soft">{item.desc}</p>
            </Reveal>
          </li>
        ))}
      </ol>
    </section>
  );
}
