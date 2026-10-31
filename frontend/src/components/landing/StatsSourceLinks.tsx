import { statsSources } from "@/constants/landingContent";

/** 통계 출처 링크 목록. 원문(농림축산식품부 게시글)으로 연결한다 */
export default function StatsSourceLinks() {
  return (
    <>
      출처:{" "}
      {statsSources.map((src, i) => (
        <span key={src.href}>
          {i > 0 && ", "}
          <a href={src.href} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-ink">
            {src.label}
          </a>
        </span>
      ))}
      <span className="sr-only"> (새 창)</span>
    </>
  );
}
