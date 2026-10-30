import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import clsx from "clsx";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Reveal from "@/components/motion/Reveal";
import { usePreference } from "@/hooks/usePreference";
import { REGION_SIDO_OPTIONS } from "@/constants/regions";
import type { PreferenceRequest } from "@/types/dto";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

const SPECIES_OPTIONS: { value: "" | "DOG" | "CAT"; label: string }[] = [
  { value: "", label: "상관없음" },
  { value: "DOG", label: "강아지" },
  { value: "CAT", label: "고양이" },
];

const SIZE_OPTIONS: {
  value: "" | "SMALL" | "MEDIUM" | "LARGE";
  label: string;
}[] = [
  { value: "", label: "상관없음" },
  { value: "SMALL", label: "소형" },
  { value: "MEDIUM", label: "중형" },
  { value: "LARGE", label: "대형" },
];

const REGIONS = REGION_SIDO_OPTIONS.filter((o) => o.value !== "");

const chipClass = (active: boolean) =>
  clsx(
    "rounded-full border px-4 py-2 text-[0.9375rem] font-medium transition-colors has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-terracotta/20",
    active ? "border-ink bg-ink text-cream" : "border-ink/15 bg-white text-ink-soft hover:border-ink/40",
  );

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  const titleId = useId();
  return (
    <fieldset
      aria-labelledby={titleId}
      className="grid gap-4 border-b border-ink/10 py-8 first:pt-0 md:grid-cols-12 md:gap-8"
    >
      <div className="md:col-span-4">
        <p id={titleId} className="font-display text-xl text-ink">
          {title}
        </p>
        {hint && <p className="mt-1 text-sm leading-relaxed text-ink-muted">{hint}</p>}
      </div>
      <div className="md:col-span-8">{children}</div>
    </fieldset>
  );
}

/** 하나만 고르는 알약형 선택지 */
function ChoiceGroup<T extends string>({
  name,
  options,
  value,
  onChange,
}: {
  name: string;
  options: { value: T; label: string }[];
  value: string;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <label key={opt.value || "none"} className={clsx("cursor-pointer", chipClass(value === opt.value))}>
          <input
            type="radio"
            name={name}
            value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
            className="sr-only"
          />
          {opt.label}
        </label>
      ))}
    </div>
  );
}

export default function PreferencePage() {
  useDocumentTitle("입양 선호 조건");
  const navigate = useNavigate();
  const { preference, savePreference } = usePreference();
  const [species, setSpecies] = useState<string>(preference?.species ?? "");
  const [minAge, setMinAge] = useState<string>(preference?.minAge != null ? String(preference.minAge) : "");
  const [maxAge, setMaxAge] = useState<string>(preference?.maxAge != null ? String(preference.maxAge) : "");
  const [size, setSize] = useState<string>(preference?.size ?? "");
  const [regions, setRegions] = useState<string[]>(preference?.regions ?? []);
  const [error, setError] = useState("");
  const errorRef = useRef<HTMLDivElement>(null);

  // 저장 버튼은 폼 아래에 있으므로 오류 문구가 폼 위에 나타나면 화면을 그쪽으로 옮긴다
  useEffect(() => {
    if (error) errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [error]);

  const toggleRegion = (value: string) => {
    setRegions((prev) => (prev.includes(value) ? prev.filter((r) => r !== value) : [...prev, value]));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const min = minAge.trim() ? parseInt(minAge, 10) : undefined;
    const max = maxAge.trim() ? parseInt(maxAge, 10) : undefined;
    // 최소 나이가 최대 나이보다 크면 어떤 아이도 조건에 맞지 않으므로 저장 전에 알린다
    if (min != null && max != null && !Number.isNaN(min) && !Number.isNaN(max) && min > max) {
      setError("최소 나이가 최대 나이보다 클 수 없습니다.");
      return;
    }
    const payload: PreferenceRequest = {};
    if (species === "DOG" || species === "CAT") payload.species = species;
    if (min != null && !Number.isNaN(min)) payload.minAge = min;
    if (max != null && !Number.isNaN(max)) payload.maxAge = max;
    if (size === "SMALL" || size === "MEDIUM" || size === "LARGE") payload.size = size;
    if (regions.length > 0) payload.regions = regions;
    savePreference(payload);
    navigate("/mypage");
  };

  const ageInputClass =
    "h-12 w-20 rounded-full border border-ink/15 bg-white px-4 text-center text-ink transition placeholder:text-ink-faint focus:border-terracotta focus:outline-none focus:ring-4 focus:ring-terracotta/15 sm:w-24";

  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-6 pb-24 pt-[calc(var(--header-height)+3rem)]">
          <Link
            to="/mypage"
            className="inline-flex items-center gap-2 text-sm font-medium text-ink-muted transition-colors hover:text-ink"
          >
            <span aria-hidden>←</span> 마이페이지
          </Link>

          <Reveal className="mt-10">
            <p className="dn-eyebrow">Preferences</p>
            <h1 className="dn-page-title">입양 선호 조건</h1>
            <p className="dn-page-desc">
              만나고 싶은 아이의 조건을 골라 두세요. 모두 선택 사항이고, 언제든 바꿀 수 있어요.
            </p>
          </Reveal>

            <form
              onSubmit={handleSubmit}
              className="mt-10 rounded-[1.75rem] border border-ink/10 bg-cream-50 p-6 shadow-card md:p-10"
            >
              {error && (
                <div ref={errorRef} className="toss-auth-error" role="alert">
                  {error}
                </div>
              )}

              <Section title="종류">
                <ChoiceGroup name="pref-species" options={SPECIES_OPTIONS} value={species} onChange={setSpecies} />
              </Section>

              <Section title="나이" hint="비워 두면 나이를 따지지 않아요.">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <label htmlFor="pref-min-age" className="sr-only">
                    최소 나이
                  </label>
                  <input
                    id="pref-min-age"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={30}
                    className={ageInputClass}
                    value={minAge}
                    onChange={(e) => setMinAge(e.target.value)}
                    placeholder="0"
                  />
                  <span className="text-ink-muted">살부터</span>
                  <label htmlFor="pref-max-age" className="sr-only">
                    최대 나이
                  </label>
                  <input
                    id="pref-max-age"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={30}
                    className={ageInputClass}
                    value={maxAge}
                    onChange={(e) => setMaxAge(e.target.value)}
                    placeholder="30"
                  />
                  <span className="text-ink-muted">살까지</span>
                </div>
              </Section>

              <Section title="크기">
                <ChoiceGroup name="pref-size" options={SIZE_OPTIONS} value={size} onChange={setSize} />
              </Section>

              <Section title="지역" hint="시·도 단위로 여러 곳을 고를 수 있어요.">
                <div className="flex flex-wrap gap-2">
                  {REGIONS.map(({ value, label }) => {
                    const selected = regions.includes(value);
                    return (
                      <button
                        key={value}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => toggleRegion(value)}
                        className={clsx(
                          "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                          selected
                            ? "border-sage bg-sage text-white"
                            : "border-ink/15 bg-white text-ink-soft hover:border-ink/40",
                        )}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-3 flex items-center gap-3 text-sm text-ink-muted">
                  <span>{regions.length > 0 ? `${regions.length}곳 선택` : "선택 안 함 (전국)"}</span>
                  {regions.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setRegions([])}
                      className="font-semibold text-ink-soft underline-offset-4 hover:text-ink hover:underline"
                    >
                      모두 해제
                    </button>
                  )}
                </div>
              </Section>

              <div className="flex flex-col-reverse gap-3 pt-8 sm:flex-row sm:justify-end">
                <Link to="/mypage" className="toss-btn toss-btn-outline">
                  취소
                </Link>
                <button type="submit" className="toss-btn toss-btn-accent">
                  조건 저장하기
                </button>
              </div>
            </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
