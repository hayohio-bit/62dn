import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";
import { REGION_SIDO_OPTIONS } from "@/constants/regions";

const speciesOptions = [
  { value: "", label: "전체" },
  { value: "DOG", label: "강아지" },
  { value: "CAT", label: "고양이" },
] as const;

/**
 * 랜딩 첫 화면의 빠른 찾기: 종류와 지역을 고르면 그 조건이 걸린 동물 목록으로 이동한다.
 * 목록 화면은 같은 이름의 URL 파라미터(species, region)를 읽는다.
 */
export default function QuickFind() {
  const navigate = useNavigate();
  const [species, setSpecies] = useState("");
  const [region, setRegion] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (species) params.set("species", species);
    if (region) params.set("region", region);
    const query = params.toString();
    navigate(query ? `/animals?${query}` : "/animals");
  };

  return (
    <form
      onSubmit={submit}
      aria-label="아이들 빠르게 찾기"
      className="flex max-w-lg flex-col gap-3 rounded-[1.75rem] border border-ink/10 bg-cream-50/90 p-3 shadow-card backdrop-blur sm:flex-row sm:items-center"
    >
      <div className="flex rounded-full bg-ink/[0.06] p-1" role="radiogroup" aria-label="종류">
        {speciesOptions.map((opt) => (
          <button
            key={opt.value || "all"}
            type="button"
            role="radio"
            aria-checked={species === opt.value}
            onClick={() => setSpecies(opt.value)}
            className={clsx(
              "h-10 flex-1 rounded-full px-3.5 text-sm font-semibold transition sm:flex-none",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta",
              species === opt.value ? "bg-ink text-cream" : "text-ink-soft hover:text-ink",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <label className="sr-only" htmlFor="quick-region">
        지역
      </label>
      <select
        id="quick-region"
        value={region}
        onChange={(e) => setRegion(e.target.value)}
        className="list-filter-select !h-12 !rounded-full sm:!h-10 sm:flex-1"
      >
        {REGION_SIDO_OPTIONS.map((opt) => (
          <option key={opt.value || "all"} value={opt.value}>
            {opt.value ? opt.label : "전국"}
          </option>
        ))}
      </select>
      <button type="submit" className="toss-btn toss-btn-accent h-12 shrink-0 !px-5 text-[0.9375rem] sm:h-10">
        찾기 <span aria-hidden>→</span>
      </button>
    </form>
  );
}
