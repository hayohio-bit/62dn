import { Link, useLocation } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Reveal from "@/components/motion/Reveal";

// 이 컴포넌트로 연결된 준비 중 페이지만 둔다. (봉사·기부 신청 페이지는 제거된 기능이므로 제외)
const pages: Record<string, { title: string; eyebrow: string }> = {
  privacy: { title: "개인정보처리방침", eyebrow: "Privacy" },
  terms: { title: "이용약관", eyebrow: "Terms" },
};

export default function PlaceholderPage() {
  const pathname = useLocation().pathname.replace(/^\//, "") || "page";
  // 준비 중인 페이지(약관 등)가 아니면 존재하지 않는 주소로 안내한다.
  const known = pages[pathname];

  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <Header />
      <main className="flex flex-1 items-center">
        {known ? (
          <Reveal className="dn-page-head w-full pb-24">
            <p className="dn-eyebrow">{known.eyebrow}</p>
            <h1 className="dn-page-title">{known.title}</h1>
            <p className="dn-page-desc">
              이 페이지는 준비 중입니다. 궁금한 점은{" "}
              <a
                href="mailto:contact@dnplatform.com"
                className="border-b border-ink/30 text-ink transition-colors hover:border-terracotta hover:text-terracotta"
              >
                contact@dnplatform.com
              </a>
              으로 문의해 주세요.
            </p>
            <div className="mt-10">
              <Link to="/" className="toss-btn toss-btn-outline">
                <span aria-hidden>←</span> 홈으로 돌아가기
              </Link>
            </div>
          </Reveal>
        ) : (
          <section className="mx-auto grid w-full max-w-[76rem] items-center gap-12 px-6 pb-24 pt-[calc(var(--header-height)+3rem)] md:grid-cols-12 md:pb-32">
            <Reveal className="md:col-span-6">
              <p className="dn-eyebrow">404 · Not found</p>
              <h1 className="dn-page-title">
                페이지를 찾을 수
                <br />
                없습니다
              </h1>
              <p className="dn-page-desc">
                주소가 바뀌었거나 없는 페이지예요. 입력한 주소를 확인하거나, 아래에서 다시 시작해 주세요.
              </p>
              <div className="mt-10 flex flex-wrap gap-3">
                <Link to="/" className="toss-btn toss-btn-accent">
                  홈으로 가기
                </Link>
                <Link to="/animals" className="toss-btn toss-btn-outline">
                  아이들 만나러 가기
                </Link>
              </div>
            </Reveal>
            <Reveal delay={0.1} className="relative hidden md:col-span-5 md:col-start-8 md:block">
              <div
                className="overflow-hidden shadow-lift"
                style={{ borderRadius: "50% 50% 2rem 2rem / 36% 36% 2rem 2rem" }}
              >
                <img
                  src="/images/landing/hero-cat.webp"
                  alt=""
                  className="aspect-[4/5] w-full object-cover"
                />
              </div>
              <span
                aria-hidden
                className="absolute -bottom-8 -left-10 font-serif text-[7rem] leading-none text-terracotta/85"
              >
                404
              </span>
            </Reveal>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
