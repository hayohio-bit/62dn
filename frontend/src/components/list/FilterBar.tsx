/**
 * 재사용 가능한 필터 바
 * 그룹마다 드롭다운(select, 기본) 또는 알약 모양 칩(chips) 중 하나로 표시한다.
 * 선택지가 적은 그룹(종류, 크기)은 칩, 많은 그룹(지역)은 드롭다운이 알맞다.
 */

export interface FilterGroupOption {
  value: string;
  label: string;
}

export interface FilterGroup {
  label: string;
  options: FilterGroupOption[];
  value: string;
  onChange: (value: string) => void;
  /** 표시 방식. 기본값은 "select" */
  type?: "select" | "chips";
}

export interface FilterBarProps {
  groups: FilterGroup[];
  onReset?: () => void;
  className?: string;
}

export default function FilterBar({ groups, onReset, className = "" }: FilterBarProps) {
  return (
    <div className={`list-filter-bar list-filter-bar--dropdown ${className}`.trim()}>
      <div className="list-filter-groups">
        {groups.map((group) =>
          group.type === "chips" ? (
            <div key={group.label} className="list-filter-group" role="group" aria-label={group.label}>
              <span className="list-filter-group-label" aria-hidden>
                {group.label}
              </span>
              <div className="list-filter-row">
                {group.options.map((opt) => {
                  const active = group.value === opt.value;
                  return (
                    <button
                      key={opt.value || `all-${group.label}`}
                      type="button"
                      className={`list-filter-chip ${active ? "is-active" : ""}`}
                      aria-pressed={active}
                      onClick={() => group.onChange(opt.value)}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div key={group.label} className="list-filter-group">
              <label htmlFor={`filter-${group.label}`} className="list-filter-group-label">
                {group.label}
              </label>
              <select
                id={`filter-${group.label}`}
                className="list-filter-select"
                value={group.value}
                onChange={(e) => group.onChange(e.target.value)}
              >
                {group.options.map((opt) => (
                  <option key={opt.value || `all-${group.label}`} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          ),
        )}
      </div>
      {onReset && (
        <button type="button" className="list-filter-reset" onClick={onReset}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M3 12a9 9 0 1 0 3-6.7" />
            <path d="M3 4v5h5" />
          </svg>
          필터 초기화
        </button>
      )}
    </div>
  );
}
