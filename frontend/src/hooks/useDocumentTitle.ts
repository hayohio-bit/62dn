import { useEffect } from "react";

const DEFAULT_TITLE = "62댕냥 · 유기동물 입양·임시보호";

/**
 * 브라우저 탭 제목을 "<페이지 제목> | 62댕냥"으로 바꾼다.
 * 제목이 없으면(랜딩, 불러오는 중) 기본 제목을 쓴다.
 * 방문 기록·북마크·공유한 링크에서 어떤 동물·글인지 구분할 수 있게 한다.
 */
export function useDocumentTitle(title?: string | null) {
  useEffect(() => {
    document.title = title ? `${title} | 62댕냥` : DEFAULT_TITLE;
  }, [title]);
}
