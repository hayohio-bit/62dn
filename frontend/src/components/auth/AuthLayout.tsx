import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import Wordmark from "@/components/layout/Wordmark";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

interface AuthLayoutProps {
  eyebrow: string;
  title: string;
  description?: ReactNode;
  /** 데스크톱 왼쪽 사진 패널 */
  image: string;
  imageAlt: string;
  quote: string;
  quoteCaption: string;
  children: ReactNode;
  /** 폼 카드 아래 보조 영역 (회원가입 안내 등) */
  footer?: ReactNode;
}

const ease = [0.2, 0.8, 0.2, 1] as const;

/**
 * 인증 화면 공통 레이아웃.
 * 데스크톱은 왼쪽에 사진과 인용문, 오른쪽에 폼을 두는 분할 화면이고, 모바일은 폼만 보여 준다.
 */
export default function AuthLayout({
  eyebrow,
  title,
  description,
  image,
  imageAlt,
  quote,
  quoteCaption,
  children,
  footer,
}: AuthLayoutProps) {
  const reduce = useReducedMotion();
  useDocumentTitle(title);

  return (
    <div className="min-h-screen bg-cream lg:grid lg:grid-cols-2">
      <aside className="relative hidden lg:block">
        <div className="sticky top-0 h-screen p-4">
          <motion.div
            initial={reduce ? false : { opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease }}
            className="relative h-full overflow-hidden rounded-[2rem] bg-cream-200"
          >
            <img src={image} alt={imageAlt} className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/15 to-ink/40" aria-hidden />
            <Link
              to="/"
              className="absolute left-8 top-7 font-display text-2xl font-bold text-cream-50"
              aria-label="62댕냥 홈"
            >
              <Wordmark tone="dark" />
            </Link>
            <figure className="absolute inset-x-0 bottom-0 p-10 xl:p-14">
              <motion.blockquote
                initial={reduce ? false : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 0.25, ease }}
                className="max-w-lg break-keep font-display text-3xl leading-snug text-cream-50 xl:text-[2.5rem] xl:leading-[1.3]"
              >
                “{quote}”
              </motion.blockquote>
              <figcaption className="mt-6 flex items-center gap-3 text-sm text-cream-50/75">
                <span className="h-px w-8 bg-cream-50/50" aria-hidden />
                {quoteCaption}
              </figcaption>
            </figure>
          </motion.div>
        </div>
      </aside>

      <main className="flex min-h-screen flex-col px-6 pb-10 pt-5 sm:px-10 lg:px-16">
        <div className="flex items-center justify-between">
          <Link to="/" className="toss-logo lg:invisible" aria-label="62댕냥 홈">
            <Wordmark />
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-ink-muted transition-colors hover:bg-ink/5 hover:text-ink"
          >
            <span aria-hidden>←</span> 홈으로
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center py-10 lg:py-8">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease }}
            className="w-full max-w-[26rem]"
          >
            <div className="toss-auth-head">
              <p className="dn-eyebrow">{eyebrow}</p>
              <h1 className="toss-auth-title">{title}</h1>
              {description && <p className="toss-auth-desc">{description}</p>}
            </div>
            {children}
            {footer && <div className="mt-8 space-y-2 text-center text-sm text-ink-muted">{footer}</div>}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
