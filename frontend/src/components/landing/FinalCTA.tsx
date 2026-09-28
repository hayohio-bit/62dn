import { Link } from "react-router-dom";
import Reveal from "@/components/motion/Reveal";

const words = ["입양", "임시보호", "산책 봉사", "물품 후원", "공고 공유"];

/** 흐르는 단어 띠 + 마지막 행동 유도 */
export default function FinalCTA() {
  return (
    <section className="overflow-hidden bg-terracotta text-white">
      <div className="border-b border-white/15 py-5" aria-hidden>
        <div className="flex w-max animate-marquee gap-10 whitespace-nowrap font-serif text-2xl text-white/80 md:text-3xl">
          {[...words, ...words, ...words, ...words].map((w, i) => (
            <span key={i} className="flex items-center gap-10">
              {w}
              <span className="text-white/40">✦</span>
            </span>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-[76rem] px-6 py-24 text-center md:py-32">
        <Reveal>
          <h2 className="font-serif text-5xl leading-[1.1] md:text-7xl">
            그 숫자를 바꾸는 건,
            <br />
            오늘의 한 걸음이에요
          </h2>
          <p className="mx-auto mt-6 max-w-lg text-lg text-white/80">
            마음에 닿는 아이를 찾았다면 보호소에 전화 한 통으로 시작할 수 있어요.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link
              to="/animals"
              className="toss-btn bg-cream px-7 py-4 text-base text-ink hover:bg-white"
            >
              첫 인연 찾아보기 <span aria-hidden>→</span>
            </Link>
            <Link
              to="/support"
              className="toss-btn px-7 py-4 text-base text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,.5)] hover:shadow-[inset_0_0_0_1px_#fff]"
            >
              가까운 보호소 찾기
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
