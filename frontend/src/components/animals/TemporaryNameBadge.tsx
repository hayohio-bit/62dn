/** 공공데이터 동물에 붙인 임시 이름임을 알리는 표시 */
export default function TemporaryNameBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border border-current/20 px-2 py-0.5 align-middle font-sans text-[0.6875rem] font-medium leading-none opacity-80 ${className}`.trim()}
      title="공고에 이름이 없어 털색·크기·나이 등을 보고 임시로 붙인 이름이에요"
    >
      임시 이름
    </span>
  );
}
