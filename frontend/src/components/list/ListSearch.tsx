/**
 * 목록 검색 입력 (돋보기 아이콘, 지우기 버튼이 있는 알약 모양 입력)
 */
interface ListSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  /** 화면 낭독기용 이름. 없으면 placeholder를 쓴다 */
  label?: string;
}

export default function ListSearch({
  value,
  onChange,
  placeholder = "검색어를 입력하세요",
  className = "",
  label,
}: ListSearchProps) {
  return (
    <div className={`list-search-wrap ${className}`.trim()} role="search">
      <span className="list-search-icon" aria-hidden>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="7.5" />
          <path d="m20.5 20.5-4.2-4.2" />
        </svg>
      </span>
      <input
        type="search"
        className="list-search-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape" && value) onChange("");
        }}
        placeholder={placeholder}
        aria-label={label ?? placeholder}
        autoComplete="off"
        enterKeyHint="search"
      />
      {value && (
        <button type="button" className="list-search-clear" onClick={() => onChange("")} aria-label="검색어 지우기">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
