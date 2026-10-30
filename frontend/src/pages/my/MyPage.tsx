import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import clsx from "clsx";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Reveal from "@/components/motion/Reveal";
import { animalApi } from "@/api/animal";
import AnimalImageFallback from "@/components/animals/AnimalImageFallback";
import {
  ageLabel,
  ddayBadgeClass,
  formatDday,
  genderLabels,
  isTemporaryName,
  sizeLabels,
  speciesLabels,
} from "@/constants/animalLabels";
import TemporaryNameBadge from "@/components/animals/TemporaryNameBadge";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useFavoriteIds } from "@/hooks/useFavoriteIds";
import { usePreference } from "@/hooks/usePreference";
import type { PreferenceRequest } from "@/types/dto";
import type { Animal } from "@/types/entities";

function FavoriteCard({ animal }: { animal: Animal }) {
  const [imageFailed, setImageFailed] = useState(false);
  const dday = formatDday(animal.daysUntilExpiry);
  const meta = [animal.breed || "품종 미상", ageLabel(animal.age), animal.gender && genderLabels[animal.gender]]
    .filter(Boolean)
    .join(" · ");

  return (
    <Link to={`/animals/${animal.id}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden rounded-[1.25rem] bg-cream-200">
        {animal.imageUrl && !imageFailed ? (
          <img
            src={animal.imageUrl}
            alt={`${animal.name} 사진`}
            loading="lazy"
            onError={() => setImageFailed(true)}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <AnimalImageFallback />
        )}
        {dday && (
          <span
            className={clsx(
              "absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-bold shadow-sm",
              ddayBadgeClass(animal.daysUntilExpiry),
            )}
          >
            {dday}
          </span>
        )}
      </div>
      <p className="mt-3 flex min-w-0 items-center gap-2 font-display text-xl text-ink transition-colors group-hover:text-terracotta">
        <span className="truncate">{animal.name || "이름 없음"}</span>
        {isTemporaryName(animal) && <TemporaryNameBadge className="text-ink-muted" />}
      </p>
      <p className="mt-0.5 truncate text-sm text-ink-soft">{meta}</p>
      {animal.shelterName && <p className="mt-0.5 truncate text-xs text-ink-muted">{animal.shelterName}</p>}
    </Link>
  );
}

function PreferenceSummary({ preference }: { preference: PreferenceRequest }) {
  const rows: { label: string; value: string }[] = [];
  if (preference.species) rows.push({ label: "종류", value: speciesLabels[preference.species] ?? preference.species });
  if (preference.minAge != null || preference.maxAge != null) {
    rows.push({
      label: "나이",
      value: `${preference.minAge ?? 0}살 ~ ${preference.maxAge ?? "제한 없음"}${preference.maxAge != null ? "살" : ""}`,
    });
  }
  if (preference.size) rows.push({ label: "크기", value: sizeLabels[preference.size] ?? preference.size });

  return (
    <dl className="space-y-3 text-sm">
      {rows.map((r) => (
        <div key={r.label} className="flex gap-4">
          <dt className="w-10 shrink-0 text-ink-muted">{r.label}</dt>
          <dd className="text-ink">{r.value}</dd>
        </div>
      ))}
      {preference.regions?.length ? (
        <div className="flex gap-4">
          <dt className="w-10 shrink-0 pt-1 text-ink-muted">지역</dt>
          <dd className="flex flex-wrap gap-1.5">
            {preference.regions.map((r) => (
              <span key={r} className="rounded-full bg-sage-50 px-2.5 py-1 text-xs font-medium text-sage-600">
                {r}
              </span>
            ))}
          </dd>
        </div>
      ) : null}
    </dl>
  );
}

/** 이 브라우저에 저장한 찜과 선호 조건. 로그인이 없어서 기기마다 따로 저장된다 */
export default function MyPage() {
  useDocumentTitle("찜한 아이들");
  const { favoriteIds } = useFavoriteIds();
  const { preference } = usePreference();
  const [favorites, setFavorites] = useState<Animal[]>([]);
  const [missing, setMissing] = useState(0);
  const [loading, setLoading] = useState(favoriteIds.length > 0);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (favoriteIds.length === 0) {
      setFavorites([]);
      setMissing(0);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoadError(null);
    // 최근에 찜한 아이가 먼저 오도록 저장 순서의 반대로 보여 준다
    animalApi
      .getByIds([...favoriteIds].reverse())
      .then(({ animals, missing: gone }) => {
        if (cancelled) return;
        setFavorites(animals);
        setMissing(gone);
      })
      .catch(() => {
        if (!cancelled) setLoadError("찜한 아이들을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [favoriteIds]);

  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <Header />
      <main className="flex-1">
        <Reveal className="dn-page-head">
          <p className="dn-eyebrow">My page</p>
          <h1 className="dn-page-title">찜한 아이들</h1>
          <p className="dn-page-desc">
            찜한 아이들과 입양 선호 조건은 이 브라우저에 저장돼요. 로그인이 없어서 다른 기기와는 공유되지 않아요.
          </p>
        </Reveal>

        <div className="mx-auto grid max-w-[76rem] gap-10 px-6 pb-24 lg:grid-cols-12 lg:gap-12">
          <div className="space-y-6 lg:col-span-4">
            <section
              aria-labelledby="mypage-pref"
              className="rounded-[1.75rem] border border-ink/10 bg-cream-50 p-6 shadow-card md:p-8"
            >
              <div className="mb-5 flex items-baseline justify-between gap-3">
                <h2 id="mypage-pref" className="font-display text-xl text-ink">
                  입양 선호 조건
                </h2>
                <Link to="/mypage/preferences" className="text-sm font-semibold text-terracotta hover:text-terracotta-700">
                  {preference ? "바꾸기" : "설정하기"} →
                </Link>
              </div>
              {preference ? (
                <PreferenceSummary preference={preference} />
              ) : (
                <p className="text-sm leading-relaxed text-ink-muted">
                  종류·나이·크기·지역을 골라 두면 &lsquo;나를 위한 추천&rsquo;에서 맞는 아이를 모아 보여 드려요.
                </p>
              )}
            </section>
          </div>

          <section aria-labelledby="mypage-fav" className="lg:col-span-8">
            <div className="flex items-end justify-between gap-4 border-b border-ink/15 pb-5">
              <h2 id="mypage-fav" className="font-display text-3xl text-ink">
                찜한 아이들 {favorites.length > 0 && <span className="text-terracotta">{favorites.length}</span>}
              </h2>
              <Link to="/animals" className="border-b border-ink/30 pb-0.5 text-[0.9375rem] hover:border-ink">
                아이들 더 보기
              </Link>
            </div>

            {loadError ? (
              <p className="mt-8 rounded-3xl border border-terracotta/25 bg-terracotta-50 px-6 py-10 text-center text-ink-soft" role="alert">
                {loadError}
              </p>
            ) : loading ? (
              <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3" aria-hidden>
                {Array.from({ length: 3 }, (_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="aspect-[4/5] rounded-[1.25rem] bg-ink/10" />
                    <div className="mt-3 h-5 w-20 rounded bg-ink/10" />
                  </div>
                ))}
              </div>
            ) : favorites.length === 0 ? (
              <div className="mt-8 rounded-[1.75rem] border border-dashed border-ink/20 px-6 py-16 text-center">
                <p className="font-display text-2xl text-ink">
                  {missing > 0 ? "찜한 아이들의 공고가 모두 끝났어요" : "아직 찜한 아이가 없어요"}
                </p>
                <p className="mx-auto mt-3 max-w-sm leading-relaxed text-ink-muted">
                  공고를 둘러보다 마음이 가는 아이의 하트를 눌러 두면 여기에서 다시 볼 수 있어요.
                </p>
                <Link to="/animals" className="toss-btn toss-btn-accent mt-7">
                  아이들 만나러 가기 <span aria-hidden>→</span>
                </Link>
              </div>
            ) : (
              <>
                <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:gap-x-6">
                  {favorites.map((a) => (
                    <li key={a.id}>
                      <FavoriteCard animal={a} />
                    </li>
                  ))}
                </ul>
                {missing > 0 && (
                  <p className="mt-8 text-sm text-ink-muted">공고가 끝난 {missing}마리는 목록에서 뺐어요.</p>
                )}
              </>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
