import { Wordmark } from "@/components/layout/Header";

/** 소셜 로그인 콜백처럼 잠시 기다리는 화면 */
export default function AuthPending({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-cream px-6 text-center" role="status">
      <span className="toss-logo">
        <Wordmark />
      </span>
      <span
        className="h-12 w-12 animate-spin rounded-full border-[3px] border-ink/10 border-t-terracotta motion-reduce:animate-none"
        aria-hidden
      />
      <div>
        <p className="break-keep font-display text-2xl text-ink">{message}</p>
        <p className="mt-2 text-sm text-ink-muted">잠시만 기다려 주세요. 곧 이동합니다.</p>
      </div>
    </div>
  );
}
