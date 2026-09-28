/**
 * 입양 선호도 설정 모달
 * 종류, 나이 범위, 크기, 지역(시·도 복수)을 설정해 맞춤 추천 받기
 */
import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { PreferenceRequest } from "@/types/dto";
import { REGION_SIDO_OPTIONS } from "@/constants/regions";
import { sizeLabels, speciesLabels } from "@/constants/animalLabels";

/** 시·도 옵션 중 값이 있는 것만 (전체 제외) */
const REGION_OPTIONS = REGION_SIDO_OPTIONS.filter((o) => o.value !== "");

interface PreferenceModalProps {
  currentPreference?: PreferenceRequest;
  onSave: (pref: PreferenceRequest) => void;
  onClose: () => void;
}

const speciesOptions: { value: "" | NonNullable<PreferenceRequest["species"]>; label: string }[] = [
  { value: "", label: "상관없음" },
  { value: "DOG", label: speciesLabels.DOG },
  { value: "CAT", label: speciesLabels.CAT },
];

const sizeOptions: { value: "" | NonNullable<PreferenceRequest["size"]>; label: string }[] = [
  { value: "", label: "상관없음" },
  { value: "SMALL", label: sizeLabels.SMALL },
  { value: "MEDIUM", label: sizeLabels.MEDIUM },
  { value: "LARGE", label: sizeLabels.LARGE },
];

const inputClass =
  "h-11 w-full rounded-full border border-ink/15 bg-white px-4 text-[0.9375rem] text-ink placeholder:text-ink-faint transition focus:border-terracotta focus:outline-none focus:ring-4 focus:ring-terracotta/15";

function Field({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-3 text-sm font-semibold text-ink">{title}</legend>
      {children}
      {hint && <p className="mt-2 text-xs text-ink-muted">{hint}</p>}
    </fieldset>
  );
}

export default function PreferenceModal({ currentPreference, onSave, onClose }: PreferenceModalProps) {
  const reduce = useReducedMotion();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [formData, setFormData] = useState<PreferenceRequest>({
    species: currentPreference?.species || undefined,
    // 0세도 유효한 값이므로 ||가 아니라 ??로 기본값을 정한다
    minAge: currentPreference?.minAge ?? undefined,
    maxAge: currentPreference?.maxAge ?? undefined,
    size: currentPreference?.size || undefined,
    regions: currentPreference?.regions ?? [],
  });
  const [ageError, setAgeError] = useState<string | null>(null);
  // 부모가 다시 렌더링되며 onClose가 새로 만들어져도 아래 effect가 다시 실행되지 않도록 ref로 참조한다
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // ESC로 닫기, 배경 스크롤 잠금, 열릴 때 제목으로 초점 이동
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    titleRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.minAge !== undefined && formData.maxAge !== undefined && formData.minAge > formData.maxAge) {
      setAgeError("최소 나이가 최대 나이보다 클 수 없어요.");
      return;
    }
    onSave(formData);
  };

  const setAge = (key: "minAge" | "maxAge", raw: string) => {
    setAgeError(null);
    setFormData({ ...formData, [key]: raw === "" ? undefined : Number(raw) });
  };

  const regions = formData.regions ?? [];
  const toggleRegion = (value: string) => {
    const next = regions.includes(value) ? regions.filter((r) => r !== value) : [...regions, value];
    setFormData({ ...formData, regions: next });
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="preference-modal-title"
    >
      <motion.div
        className="absolute inset-0 bg-ink/50 backdrop-blur-sm"
        onClick={onClose}
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        aria-hidden
      />
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
        className="relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-4xl bg-cream-50 shadow-lift sm:rounded-4xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-ink/10 px-6 pb-5 pt-7 sm:px-8">
          <div>
            <p className="dn-eyebrow">For you</p>
            <h2
              id="preference-modal-title"
              ref={titleRef}
              tabIndex={-1}
              className="mt-2 font-serif text-3xl leading-tight text-ink focus:outline-none"
            >
              어떤 아이를 찾고 계세요?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">조건을 고르면 맞는 아이들을 먼저 보여 드려요.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-ink/15 text-ink-soft transition hover:border-ink hover:text-ink"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-7 overflow-y-auto px-6 py-6 sm:px-8">
            <Field title="동물 종류">
              <div className="list-filter-row">
                {speciesOptions.map(({ value, label }) => {
                  const active = formData.species === (value || undefined);
                  return (
                    <button
                      key={value || "none"}
                      type="button"
                      aria-pressed={active}
                      className={`list-filter-chip ${active ? "is-active" : ""}`}
                      onClick={() => setFormData({ ...formData, species: value || undefined })}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </Field>

            <Field title="크기">
              <div className="list-filter-row">
                {sizeOptions.map(({ value, label }) => {
                  const active = formData.size === (value || undefined);
                  return (
                    <button
                      key={value || "none"}
                      type="button"
                      aria-pressed={active}
                      className={`list-filter-chip ${active ? "is-active" : ""}`}
                      onClick={() => setFormData({ ...formData, size: value || undefined })}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </Field>

            <Field title="나이 (살)" hint="비워 두면 나이와 상관없이 추천해요.">
              <div className="flex items-center gap-3">
                <label htmlFor="minAge" className="sr-only">
                  최소 나이
                </label>
                <input
                  id="minAge"
                  type="number"
                  inputMode="numeric"
                  className={inputClass}
                  value={formData.minAge ?? ""}
                  onChange={(e) => setAge("minAge", e.target.value)}
                  min="0"
                  max="20"
                  placeholder="최소 (예: 0)"
                />
                <span className="text-ink-faint" aria-hidden>
                  –
                </span>
                <label htmlFor="maxAge" className="sr-only">
                  최대 나이
                </label>
                <input
                  id="maxAge"
                  type="number"
                  inputMode="numeric"
                  className={inputClass}
                  value={formData.maxAge ?? ""}
                  onChange={(e) => setAge("maxAge", e.target.value)}
                  min="0"
                  max="20"
                  placeholder="최대 (예: 10)"
                  aria-invalid={!!ageError}
                  aria-describedby={ageError ? "age-error" : undefined}
                />
              </div>
              {ageError && (
                <p id="age-error" role="alert" className="mt-2 text-sm text-terracotta-600">
                  {ageError}
                </p>
              )}
            </Field>

            <Field title="지역 (여러 곳 선택 가능)" hint="선택한 지역 보호소의 아이들만 추천해요. 비워 두면 전국에서 찾아요.">
              <div className="flex flex-wrap gap-1.5">
                {REGION_OPTIONS.map(({ value, label }) => {
                  const active = regions.includes(value);
                  return (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={active}
                      onClick={() => toggleRegion(value)}
                      className={`list-filter-chip !h-9 !px-3.5 ${active ? "is-active" : ""}`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </Field>
          </div>

          <div className="flex gap-3 border-t border-ink/10 bg-cream-50 px-6 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-8">
            <button type="button" onClick={onClose} className="toss-btn toss-btn-outline flex-1">
              취소
            </button>
            <button type="submit" className="toss-btn toss-btn-accent flex-[2]">
              저장하고 추천 보기
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
