import { Link, useLocation } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

// 이 컴포넌트로 연결된 준비 중 페이지만 둔다. (봉사·기부 신청 페이지는 제거된 기능이므로 제외)
const labels: Record<string, string> = {
  privacy: "개인정보처리방침",
  terms: "이용약관",
};

export default function PlaceholderPage() {
  const pathname = useLocation().pathname.replace(/^\//, "") || "page";
  // 준비 중인 페이지(약관 등)가 아니면 존재하지 않는 주소로 안내한다.
  const knownTitle = labels[pathname];
  const title = knownTitle ?? "페이지를 찾을 수 없습니다";
  const description = knownTitle
    ? "해당 페이지는 준비 중입니다."
    : "주소가 올바른지 확인해 주세요.";

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-24">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">{title}</h1>
          <p className="text-slate-600 mb-8">{description}</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-primary-600 font-medium hover:text-primary-700"
          >
            홈으로 돌아가기
            <span aria-hidden>→</span>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
