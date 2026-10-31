import { Link } from "react-router-dom";
import Wordmark from "@/components/layout/Wordmark";

const columns = [
  {
    title: "둘러보기",
    links: [
      { to: "/animals", label: "가족 찾기" },
      { to: "/support", label: "봉사·기부" },
      { to: "/mypage", label: "관심 동물" },
    ],
  },
  {
    title: "안내",
    links: [
      { to: "/guide/adoption", label: "입양 절차" },
      { to: "/guide/foster", label: "임시보호 절차" },
      { to: "/#faq", label: "자주 묻는 질문" },
    ],
  },
  {
    title: "정보",
    links: [
      { to: "/privacy", label: "개인정보처리방침" },
      { to: "/terms", label: "이용약관" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="toss-footer">
      <div className="toss-footer-inner">
        <div className="grid gap-12 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Link to="/" className="toss-footer-brand" aria-label="62댕냥 홈">
              <Wordmark tone="dark" />
            </Link>
            <p className="mt-4 max-w-xs text-[0.9375rem] leading-relaxed text-cream/60">
              전국 보호소의 유기동물 공고를 모아 보여 주고,
              <br />
              새 가족과 보호소를 이어 드립니다.
            </p>
          </div>
          {columns.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-cream/60">{col.title}</p>
              <ul className="space-y-3">
                {col.links.map((l) => (
                  <li key={l.to}>
                    <Link to={l.to} className="toss-footer-link">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="mt-16 flex flex-col gap-2 border-t border-cream/10 pt-6 md:flex-row md:items-center md:justify-between">
          <p className="toss-footer-copy">© {new Date().getFullYear()} 62댕냥. All rights reserved.</p>
          <p className="toss-footer-copy">동물 정보 출처: 농림축산식품부 국가동물보호정보시스템 (공공데이터포털)</p>
        </div>
      </div>
    </footer>
  );
}
