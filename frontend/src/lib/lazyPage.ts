import { lazy, type ComponentType } from "react";

const RELOAD_KEY = "dn:chunk-reload";

/**
 * 페이지 컴포넌트를 처음 방문할 때 내려받는 React.lazy 래퍼.
 * 배포는 이전 빌드 파일을 지우고 새 파일을 올리므로, 배포 전에 열어 둔 탭에서 아직 받지 않은 페이지로 이동하면
 * 이전 빌드의 파일을 찾지 못해 import가 실패한다. 이때 한 번만 새로고침해 새 빌드를 받는다.
 * 새로고침 뒤에도 실패하면(네트워크 끊김 등) 오류를 그대로 던져 ErrorBoundary가 안내 화면을 보여 준다.
 */
export function lazyPage<T extends ComponentType<object>>(
  load: () => Promise<{ default: T }>,
) {
  return lazy(() =>
    load().then(
      (module) => {
        sessionStorage.removeItem(RELOAD_KEY);
        return module;
      },
      (error: unknown) => {
        if (sessionStorage.getItem(RELOAD_KEY)) throw error;
        sessionStorage.setItem(RELOAD_KEY, "1");
        window.location.reload();
        // 새로고침이 끝날 때까지 Suspense 대기 화면을 유지한다
        return new Promise<never>(() => {});
      },
    ),
  );
}
