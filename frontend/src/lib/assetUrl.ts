/**
 * public/ 아래 정적 파일의 주소. Vite base(GitHub Pages에서는 /62dn/)를 앞에 붙인다.
 * 코드에서 "/images/..." 처럼 루트 기준으로 쓰면 하위 경로 배포에서 파일을 찾지 못한다.
 */
export function assetUrl(path: string): string {
  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, "")}`;
}
