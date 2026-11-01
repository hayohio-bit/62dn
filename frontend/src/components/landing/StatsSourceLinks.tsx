import { statsSources } from "@/constants/landingContent";

/**
 * 통계 출처 링크 목록. 원문(농림축산식품부 게시글)으로 연결한다.
 * 출처마다 한 줄씩 보여 주고, 게시일은 한 덩어리(nowrap)로 묶어 "(2026. 6. 29. 게시)"가 중간에 끊기지 않게 한다.
 */
export default function StatsSourceLinks() {
  return (
    <>
      <span className="block">출처</span>
      <ul className="mt-1 space-y-1">
        {statsSources.map((src) => (
          <li key={src.href}>
            <a href={src.href} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-ink">
              {src.label}
            </a>{" "}
            <span className="whitespace-nowrap">({src.published})</span>
          </li>
        ))}
      </ul>
      <span className="sr-only">링크는 새 창에서 열립니다.</span>
    </>
  );
}
