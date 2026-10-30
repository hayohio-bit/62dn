/**
 * 공고일·D-day 계산의 "오늘"은 한국 날짜(Asia/Seoul)로 고정한다.
 * 브라우저 시간대가 다르면 이미 마감된 공고가 D-Day로 보일 수 있어서다 (백엔드 KoreanDate와 같은 기준).
 * 날짜는 모두 "yyyy-MM-dd" 문자열로 다루고, 달력 계산은 UTC로 해서 시간대 영향을 받지 않게 한다.
 */

const DAY_MS = 86_400_000;

function toUtc(isoDate: string): number {
  const [y, m, d] = isoDate.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

export function koreanToday(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function addDays(isoDate: string, days: number): string {
  return new Date(toUtc(isoDate) + days * DAY_MS).toISOString().slice(0, 10);
}

/** Java LocalDate.plusYears와 같게 2월 29일은 평년에 2월 28일이 된다 */
export function addYears(isoDate: string, years: number): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const lastDay = new Date(Date.UTC(y + years, m, 0)).getUTCDate();
  return new Date(Date.UTC(y + years, m - 1, Math.min(d, lastDay))).toISOString().slice(0, 10);
}

/** from에서 to까지 일수. 같은 날이면 0, to가 과거면 음수 */
export function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((toUtc(toIso) - toUtc(fromIso)) / DAY_MS);
}
