/**
 * 공유하기 버튼
 * 모바일 브라우저처럼 Web Share API를 지원하면 기기의 공유 시트(카카오톡, 메시지 등)를 열고,
 * 지원하지 않으면 현재 페이지 주소를 클립보드에 복사한다.
 */
import { useEffect, useState } from "react";
import clsx from "clsx";

interface ShareButtonProps {
  title: string;
  text: string;
  /** 공유할 주소. 기본값은 현재 페이지 주소 */
  url?: string;
  className?: string;
}

type ShareState = "idle" | "copied" | "failed";

export default function ShareButton({ title, text, url, className = "" }: ShareButtonProps) {
  const [state, setState] = useState<ShareState>("idle");

  useEffect(() => {
    if (state === "idle") return;
    const id = setTimeout(() => setState("idle"), 2500);
    return () => clearTimeout(id);
  }, [state]);

  const share = async () => {
    const shareUrl = url ?? window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url: shareUrl });
        return;
      } catch (err) {
        // 사용자가 공유 시트를 닫은 경우는 실패로 알리지 않는다
        if (err instanceof DOMException && err.name === "AbortError") return;
      }
    }
    // http 환경 등 클립보드 API를 쓸 수 없는 브라우저에서는 실패를 알린다
    if (!navigator.clipboard) {
      setState("failed");
      return;
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setState("copied");
    } catch {
      setState("failed");
    }
  };

  return (
    <div className={clsx("relative", className)}>
      <button
        type="button"
        onClick={share}
        aria-label="공유하기"
        title="공유하기"
        className={clsx(
          "grid h-12 w-12 shrink-0 place-items-center rounded-full border border-ink/10 bg-cream-50/85 text-ink shadow-card backdrop-blur transition duration-200",
          "hover:bg-white hover:text-terracotta active:scale-95",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta",
        )}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M12 3v12M7.5 7.5 12 3l4.5 4.5" />
          <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
        </svg>
      </button>
      <p
        role="status"
        className={clsx(
          "pointer-events-none absolute right-0 top-full z-10 mt-2 whitespace-nowrap rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-cream shadow-card transition",
          state === "idle" ? "opacity-0" : "opacity-100",
        )}
      >
        {state === "copied" ? "링크를 복사했어요" : state === "failed" ? "복사하지 못했어요. 주소창의 링크를 복사해 주세요" : ""}
      </p>
    </div>
  );
}
