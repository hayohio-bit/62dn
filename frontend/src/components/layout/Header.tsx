import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, NavLink } from "react-router-dom";
import clsx from "clsx";
import Wordmark from "@/components/layout/Wordmark";

const navItems = [
  { to: "/animals", label: "가족 찾기" },
  { to: "/guide/adoption", label: "입양·임시보호 안내" },
  { to: "/support", label: "봉사·기부" },
  { to: "/mypage", label: "찜한 아이들" },
];

function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
      {open ? (
        <>
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </>
      ) : (
        <>
          <line x1="4" y1="8" x2="20" y2="8" />
          <line x1="4" y1="16" x2="20" y2="16" />
        </>
      )}
    </svg>
  );
}

export default function Header() {
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const lastYRef = useRef(0);
  const tickingRef = useRef(false);

  const closeMenu = () => setMenuOpen(false);

  // 아래로 스크롤하면 숨기고, 위로 스크롤하면 다시 보여 준다
  useEffect(() => {
    lastYRef.current = window.scrollY;

    const onScroll = () => {
      if (tickingRef.current) return;
      tickingRef.current = true;

      window.requestAnimationFrame(() => {
        const y = window.scrollY;
        const delta = y - lastYRef.current;
        if (Math.abs(delta) > 8) {
          if (delta > 0 && y > 120) setHidden(true);
          if (delta < 0) setHidden(false);
        }
        lastYRef.current = y;
        if (y <= 10) setHidden(false);
        setScrolled(y > 12);
        tickingRef.current = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    const onResize = () => window.innerWidth >= 768 && setMenuOpen(false);
    document.body.classList.add("toss-menu-open");
    document.addEventListener("keydown", onEsc);
    window.addEventListener("resize", onResize);
    return () => {
      document.body.classList.remove("toss-menu-open");
      document.removeEventListener("keydown", onEsc);
      window.removeEventListener("resize", onResize);
    };
  }, [menuOpen]);

  return (
    <header
      className={clsx(
        "toss-header",
        hidden && !menuOpen && "toss-header--hidden",
        scrolled && "toss-header--scrolled",
      )}
    >
      <div className="toss-header-inner relative">
        <Link to="/" className="toss-logo" aria-label="62댕냥 홈">
          <Wordmark />
        </Link>

        <nav className="toss-nav hidden md:flex" aria-label="메인 메뉴">
          {navItems.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => clsx("toss-nav-link", isActive && "toss-nav-link--active")}
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            className="toss-hamburger md:hidden"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "메뉴 닫기" : "메뉴 열기"}
          >
            <HamburgerIcon open={menuOpen} />
          </button>
        </div>
      </div>

      {/* 모바일 메뉴 드로어: body에 포탈로 렌더링해 헤더의 쌓임 맥락과 분리한다 */}
      {createPortal(
        <>
          <div
            className={clsx("toss-menu-backdrop", menuOpen && "toss-menu-backdrop--open")}
            onClick={closeMenu}
            aria-hidden
          />
          <div className={clsx("toss-menu-drawer", menuOpen && "toss-menu-drawer--open")}>
            <nav className="toss-menu-nav" aria-label="모바일 메뉴">
              {navItems.map(({ to, label }) => (
                <Link key={to} to={to} className="toss-menu-link" onClick={closeMenu}>
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        </>,
        document.body,
      )}
    </header>
  );
}
