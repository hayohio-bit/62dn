import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Reveal from "@/components/motion/Reveal";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { assetUrl } from "@/lib/assetUrl";

/** 정의되지 않은 주소: 빈 화면 대신 안내 페이지를 보여 준다 */
export default function NotFoundPage() {
  useDocumentTitle("페이지를 찾을 수 없음");

  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <Header />
      <main className="flex flex-1 items-center">
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
              <img src={assetUrl("images/landing/hero-cat.webp")} alt="" className="aspect-[4/5] w-full object-cover" />
            </div>
            <span
              aria-hidden
              className="absolute -bottom-8 -left-10 font-display text-[7rem] leading-none text-terracotta/85"
            >
              404
            </span>
          </Reveal>
        </section>
      </main>
      <Footer />
    </div>
  );
}
