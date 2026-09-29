import { Link } from "react-router-dom";
import Reveal from "@/components/motion/Reveal";
import { stories } from "@/constants/landingContent";

/** 입양 후기 */
export default function StoriesSection() {
  return (
    <section className="mx-auto max-w-[76rem] px-6 py-24 md:py-32">
      <Reveal className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="dn-eyebrow">Stories</p>
          <h2 className="mt-4 font-display text-4xl leading-tight md:text-5xl">숫자가 이름이 되는 순간</h2>
        </div>
        <Link to="/boards?type=FREE" className="border-b border-ink/30 pb-0.5 text-[0.9375rem] hover:border-ink">
          더 많은 이야기 보기
        </Link>
      </Reveal>

      <div className="mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
        {stories.map((s, i) => (
          <Reveal key={s.name} delay={i * 0.1} className={i === 1 ? "md:mt-16" : undefined}>
            <figure>
              <div className="overflow-hidden rounded-[1.5rem]">
                <img src={s.image} alt={`${s.tag} 후기 사진`} loading="lazy" className="aspect-[4/3] w-full object-cover" />
              </div>
              <blockquote className="mt-6 font-display text-xl leading-relaxed">“{s.quote}”</blockquote>
              <figcaption className="mt-4 flex items-center gap-2 text-sm text-ink-muted">
                <span className="h-px w-6 bg-ink/30" />
                {s.name} · {s.tag}
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
