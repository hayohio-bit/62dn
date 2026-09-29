import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import clsx from "clsx";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Reveal from "@/components/motion/Reveal";
import { authApi } from "@/api/auth";
import { preferenceApi } from "@/api/preference";
import { favoriteApi } from "@/api/favorite";
import { useAuthStore } from "@/store/authStore";
import AnimalImageFallback from "@/components/animals/AnimalImageFallback";
import { NameAvatar } from "@/components/boards/BoardTypeBadge";
import { ddayTone, formatDday, genderLabels, sizeLabels, speciesLabels } from "@/constants/animalLabels";
import type { UserResponse } from "@/types/dto";
import type { Preference, Animal } from "@/types/entities";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

const roleLabels: Record<string, string> = {
  USER: "일반 회원",
  SUPER_ADMIN: "시스템 관리자",
};

const ddayToneClass = {
  urgent: "bg-terracotta text-white",
  soon: "bg-cream-50 text-terracotta-700",
  normal: "bg-cream-50/90 text-ink-soft",
} as const;

function FavoriteCard({ animal }: { animal: Animal }) {
  const [imageFailed, setImageFailed] = useState(false);
  const dday = formatDday(animal.daysUntilExpiry);
  const meta = [
    animal.breed || "품종 미상",
    animal.age != null ? `${animal.age}살` : null,
    genderLabels[animal.gender],
  ]
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
              ddayToneClass[ddayTone(animal.daysUntilExpiry)],
            )}
          >
            {dday}
          </span>
        )}
      </div>
      <p className="mt-3 truncate font-serif text-xl text-ink transition-colors group-hover:text-terracotta">
        {animal.name}
      </p>
      <p className="mt-0.5 truncate text-sm text-ink-soft">{meta}</p>
      {animal.shelterName && <p className="mt-0.5 truncate text-xs text-ink-muted">{animal.shelterName}</p>}
    </Link>
  );
}

function PreferenceSummary({ preference }: { preference: Preference }) {
  const rows: { label: string; value: string }[] = [];
  if (preference.species) rows.push({ label: "종류", value: speciesLabels[preference.species] ?? preference.species });
  if (preference.minAge != null || preference.maxAge != null) {
    rows.push({ label: "나이", value: `${preference.minAge ?? 0}살 ~ ${preference.maxAge ?? "제한 없음"}${preference.maxAge != null ? "살" : ""}` });
  }
  if (preference.size) rows.push({ label: "크기", value: sizeLabels[preference.size] ?? preference.size });

  if (rows.length === 0 && !preference.regions?.length) {
    return <p className="text-sm text-ink-muted">아직 고른 조건이 없어요.</p>;
  }

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

export default function MyPage() {
  useDocumentTitle("마이페이지");
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuthStore();
  const [me, setMe] = useState<UserResponse | null>(null);
  const [preference, setPreference] = useState<Preference | null | undefined>(undefined);
  const [favorites, setFavorites] = useState<Animal[]>([]);
  const [favoriteTotal, setFavoriteTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login", { replace: true, state: { from: "/mypage" } });
      return;
    }
    Promise.all([
      authApi.getMe().then((res) => res.data?.data ?? res.data),
      preferenceApi.getMy().catch(() => null),
      favoriteApi.getMyList(0, 20).catch(() => ({ content: [], totalElements: 0 })),
    ])
      .then(([userData, prefData, favData]) => {
        if (userData) setMe(userData);
        setPreference(prefData ?? null);
        const list = Array.isArray(favData) ? favData : (favData?.content ?? []);
        setFavorites(list);
        setFavoriteTotal(Array.isArray(favData) ? list.length : (favData?.totalElements ?? list.length));
      })
      .catch((err: unknown) => {
        // 인증 실패(만료·무효 토큰은 서버가 401/403으로 응답)일 때만 로그아웃한다.
        // 네트워크 오류나 서버 오류로 로그인 상태를 지우지 않는다.
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 401 || status === 403) {
          logout();
          navigate("/login", { replace: true });
          return;
        }
        setLoadError("내 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
      })
      .finally(() => setLoading(false));
  }, [isAuthenticated, navigate, logout]);

  const startEditProfile = () => {
    if (me) {
      setEditName(me.name ?? "");
      setEditEmail(me.email ?? "");
      setProfileError(null);
      setEditingProfile(true);
    }
  };

  const cancelEditProfile = () => {
    setEditingProfile(false);
    setProfileError(null);
  };

  const saveProfile = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!me) return;
    const name = editName?.trim() || undefined;
    const email = editEmail?.trim() || undefined;
    if (!name && !email) {
      setProfileError("이름 또는 이메일 중 하나 이상 입력해 주세요.");
      return;
    }
    setProfileSaving(true);
    setProfileError(null);
    try {
      const res = await authApi.updateMe({
        name: name || undefined,
        email: email || undefined,
      });
      const data = res.data?.data ?? res.data;
      if (data) setMe(data);
      setEditingProfile(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setProfileError(msg ?? "정보 수정에 실패했습니다.");
    } finally {
      setProfileSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <Header />
      <main className="flex-1">
        <Reveal className="dn-page-head">
          <p className="dn-eyebrow">My page</p>
          <h1 className="dn-page-title">{me?.name ? `${me.name}님의 공간` : "마이페이지"}</h1>
          <p className="dn-page-desc">찜한 아이들과 입양 선호 조건을 한곳에서 확인하고 관리하세요.</p>
        </Reveal>

        <div className="mx-auto grid max-w-[76rem] gap-10 px-6 pb-24 lg:grid-cols-12 lg:gap-12">
          <div className="space-y-6 lg:col-span-4">
            {/* 나의 정보 */}
            <section aria-labelledby="mypage-profile" className="rounded-[1.75rem] border border-ink/10 bg-cream-50 p-6 shadow-card md:p-8">
              <h2 id="mypage-profile" className="sr-only">
                나의 정보
              </h2>
              {loadError && <p className="toss-auth-error">{loadError}</p>}
              {loading && (
                <div className="flex animate-pulse items-center gap-4" aria-hidden>
                  <div className="h-16 w-16 rounded-full bg-ink/10" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 w-24 rounded bg-ink/10" />
                    <div className="h-4 w-40 rounded bg-ink/5" />
                  </div>
                </div>
              )}
              {me && !editingProfile && (
                <>
                  <div className="flex items-center gap-4">
                    <NameAvatar name={me.name} size="lg" />
                    <div className="min-w-0">
                      <p className="truncate font-serif text-2xl text-ink">{me.name}</p>
                      <p className="truncate text-sm text-ink-muted">{me.email}</p>
                    </div>
                  </div>
                  <div className="mt-6 flex items-center justify-between border-t border-ink/10 pt-5">
                    <span className="rounded-full border border-ink/15 px-3 py-1 text-xs font-semibold text-ink-soft">
                      {roleLabels[me.role] ?? me.role}
                    </span>
                    <button type="button" onClick={startEditProfile} className="toss-btn toss-btn-ghost !px-3 text-sm">
                      정보 수정
                    </button>
                  </div>
                </>
              )}
              {me && editingProfile && (
                <form onSubmit={saveProfile}>
                  <p className="mb-5 font-serif text-xl text-ink">정보 수정</p>
                  <div className="toss-auth-field">
                    <label htmlFor="mypage-name" className="toss-auth-label">
                      이름
                    </label>
                    <input
                      id="mypage-name"
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="toss-auth-input"
                      placeholder="이름"
                      maxLength={50}
                      autoComplete="name"
                    />
                  </div>
                  <div className="toss-auth-field">
                    <label htmlFor="mypage-email" className="toss-auth-label">
                      이메일
                    </label>
                    <input
                      id="mypage-email"
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="toss-auth-input"
                      placeholder="이메일"
                      maxLength={100}
                      autoComplete="email"
                    />
                  </div>
                  {profileError && (
                    <p className="toss-auth-error" role="alert">
                      {profileError}
                    </p>
                  )}
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={cancelEditProfile}
                      disabled={profileSaving}
                      className="toss-btn toss-btn-ghost"
                    >
                      취소
                    </button>
                    <button type="submit" disabled={profileSaving} className="toss-btn toss-btn-primary disabled:opacity-50">
                      {profileSaving ? "저장 중…" : "저장"}
                    </button>
                  </div>
                </form>
              )}
            </section>

            {/* 나의 선호도 */}
            <section aria-labelledby="mypage-pref" className="rounded-[1.75rem] border border-ink/10 bg-cream-50 p-6 shadow-card md:p-8">
              <div className="mb-5 flex items-baseline justify-between gap-3">
                <h2 id="mypage-pref" className="font-serif text-xl text-ink">
                  입양 선호 조건
                </h2>
                <Link to="/mypage/preferences" className="text-sm font-semibold text-terracotta hover:text-terracotta-700">
                  {preference ? "바꾸기" : "설정하기"} →
                </Link>
              </div>
              {preference === undefined ? (
                <div className="animate-pulse space-y-2" aria-hidden>
                  <div className="h-4 w-32 rounded bg-ink/10" />
                  <div className="h-4 w-24 rounded bg-ink/5" />
                </div>
              ) : preference ? (
                <PreferenceSummary preference={preference} />
              ) : (
                <p className="text-sm leading-relaxed text-ink-muted">
                  종류·나이·크기·지역을 골라 두면 원하는 아이를 더 빨리 찾을 수 있어요.
                </p>
              )}
            </section>
          </div>

          {/* 즐겨찾기(찜) */}
          <section aria-labelledby="mypage-fav" className="lg:col-span-8">
            <div className="flex items-end justify-between gap-4 border-b border-ink/15 pb-5">
              <h2 id="mypage-fav" className="font-serif text-3xl text-ink">
                찜한 아이들 {favoriteTotal > 0 && <span className="text-terracotta">{favoriteTotal}</span>}
              </h2>
              <Link to="/animals" className="border-b border-ink/30 pb-0.5 text-[0.9375rem] hover:border-ink">
                아이들 더 보기
              </Link>
            </div>

            {loading ? (
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
                <p className="font-serif text-2xl text-ink">아직 찜한 아이가 없어요</p>
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
                {favoriteTotal > favorites.length && (
                  <p className="mt-8 text-sm text-ink-muted">최근 찜한 {favorites.length}마리를 보여 드려요.</p>
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
