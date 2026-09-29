import { Component, type ErrorInfo, type ReactNode } from "react";
import Wordmark from "@/components/layout/Wordmark";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * 렌더 중 에러 시 빈 화면 대신 fallback UI 표시
 * 라우터 바깥에서 렌더되므로 Link 대신 일반 링크를 쓴다.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex min-h-screen items-center bg-cream px-6 py-16" role="alert">
          <div className="mx-auto w-full max-w-xl">
            <a href="/" className="toss-logo" aria-label="62댕냥 홈">
              <Wordmark />
            </a>
            <div className="mt-14">
              <p className="dn-eyebrow">Something went wrong</p>
            </div>
            <h1 className="dn-page-title">잠시 문제가 생겼어요</h1>
            <p className="dn-page-desc">
              화면을 그리는 중에 오류가 발생했습니다. 다시 시도해도 같은 화면이 나오면 홈으로 이동해 주세요.
            </p>
            {this.state.error.message && (
              <p className="mt-6 break-words rounded-2xl border border-ink/10 bg-cream-50 px-4 py-3 font-mono text-xs leading-relaxed text-ink-muted">
                {this.state.error.message}
              </p>
            )}
            <div className="mt-10 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => this.setState({ hasError: false, error: null })}
                className="toss-btn toss-btn-accent"
              >
                다시 시도
              </button>
              <a href="/" className="toss-btn toss-btn-outline">
                홈으로 가기
              </a>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
