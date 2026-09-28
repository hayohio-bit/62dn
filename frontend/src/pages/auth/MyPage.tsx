import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { authApi } from "@/api/auth";
import { preferenceApi } from "@/api/preference";
import { favoriteApi } from "@/api/favorite";
import { useAuthStore } from "@/store/authStore";
import AnimalImageFallback from "@/components/animals/AnimalImageFallback";
import type { UserResponse } from "@/types/dto";
import type { Preference, Animal } from "@/types/entities";

export default function MyPage() {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuthStore();
  const [me, setMe] = useState<UserResponse | null>(null);
  const [preference, setPreference] = useState<Preference | null | undefined>(
    undefined,
  );
  const [favorites, setFavorites] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login", { replace: true });
      return;
    }
    Promise.all([
      authApi.getMe().then((res) => res.data?.data ?? res.data),
      preferenceApi.getMy().catch(() => null),
      favoriteApi.getMyList(0, 20).catch(() => ({ content: [] })),
    ])
      .then(([userData, prefData, favData]) => {
        if (userData) setMe(userData);
        setPreference(prefData ?? null);
        setFavorites(
          Array.isArray(favData) ? favData : (favData?.content ?? []),
        );
      })
      .catch((err: unknown) => {
        // 인증 실패(만료·무효 토큰은 서버가 401/403으로 응답)일 때만 로그아웃한다.
        // 네트워크 오류나 서버 오류로 로그인 상태를 지우지 않는다.
        const status = (err as { response?: { status?: number } })?.response
          ?.status;
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

  const saveProfile = async () => {
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
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      setProfileError(msg ?? "정보 수정에 실패했습니다.");
    } finally {
      setProfileSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">로딩 중...</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--toss-gray-100)]">
      <Header />
      <main className="flex-1 toss-section">
        <div className="toss-section-inner">
          <h1 className="toss-section-title">마이페이지</h1>

          {/* 나의 정보 */}
          <section className="toss-auth-card mb-8">
            <h2 className="text-lg font-semibold text-[var(--toss-black)] mb-4">
              나의 정보
            </h2>
            {loadError && (
              <p className="text-sm text-red-600 mb-4">{loadError}</p>
            )}
            {me && !editingProfile && (
              <>
                <ul className="space-y-2 text-[var(--toss-text-caption)] text-[var(--toss-gray-700)]">
                  <li>
                    <span className="font-medium text-[var(--toss-gray-900)]">
                      이메일
                    </span>{" "}
                    {me.email}
                  </li>
                  <li>
                    <span className="font-medium text-[var(--toss-gray-900)]">
                      이름
                    </span>{" "}
                    {me.name}
                  </li>
                  <li>
                    <span className="font-medium text-[var(--toss-gray-900)]">
                      권한
                    </span>{" "}
                    {me.role}
                  </li>
                </ul>
                <button
                  type="button"
                  onClick={startEditProfile}
                  className="toss-btn toss-btn-ghost mt-4"
                >
                  정보 수정
                </button>
              </>
            )}
            {me && editingProfile && (
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="mypage-name"
                    className="block text-sm font-medium text-[var(--toss-gray-700)] mb-1"
                  >
                    이름
                  </label>
                  <input
                    id="mypage-name"
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="toss-auth-input w-full"
                    placeholder="이름"
                    maxLength={50}
                  />
                </div>
                <div>
                  <label
                    htmlFor="mypage-email"
                    className="block text-sm font-medium text-[var(--toss-gray-700)] mb-1"
                  >
                    이메일
                  </label>
                  <input
                    id="mypage-email"
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="toss-auth-input w-full"
                    placeholder="이메일"
                    maxLength={100}
                  />
                </div>
                {profileError && (
                  <p className="text-sm text-red-600">{profileError}</p>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={saveProfile}
                    disabled={profileSaving}
                    className="toss-btn toss-btn-primary"
                  >
                    {profileSaving ? "저장 중…" : "저장"}
                  </button>
                  <button
                    type="button"
                    onClick={cancelEditProfile}
                    disabled={profileSaving}
                    className="toss-btn toss-btn-ghost"
                  >
                    취소
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* 즐겨찾기(찜) */}
          <section className="toss-auth-card mb-8">
            <h2 className="text-lg font-semibold text-[var(--toss-black)] mb-4">
              즐겨찾기
            </h2>
            {favorites.length === 0 ? (
              <p className="text-[var(--toss-gray-500)] text-sm">
                찜한 동물이 없습니다.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {favorites.map((a) => (
                  <Link
                    key={a.id}
                    to={`/animals/${a.id}`}
                    className="block rounded-xl overflow-hidden border border-[var(--toss-gray-100)] hover:border-[var(--toss-blue)] transition-colors"
                  >
                    <div
                      className="aspect-square bg-[var(--toss-gray-100)] relative overflow-hidden"
                      style={{
                        backgroundImage: a.imageUrl
                          ? `url(${JSON.stringify(a.imageUrl)})`
                          : "none",
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    >
                      {!a.imageUrl && <AnimalImageFallback />}
                    </div>
                    <div className="p-3">
                      <p className="font-semibold text-sm text-[var(--toss-gray-900)] truncate">
                        {a.name}
                      </p>
                      <p className="text-xs text-[var(--toss-gray-500)] truncate">
                        {a.breed ?? "품종미상"} · {a.shelterName ?? ""}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            <Link
              to="/animals"
              className="inline-block mt-3 text-sm font-semibold text-[var(--toss-blue)] hover:text-[var(--toss-blue-hover)]"
            >
              입양 목록 보기 →
            </Link>
          </section>

          {/* 나의 선호도 */}
          <section className="toss-auth-card mb-8">
            <h2 className="text-lg font-semibold text-[var(--toss-black)] mb-4">
              나의 선호도
            </h2>
            {preference === undefined ? (
              <p className="text-[var(--toss-gray-500)] text-sm">
                불러오는 중...
              </p>
            ) : preference ? (
              <ul className="space-y-1 text-sm text-[var(--toss-gray-700)]">
                {preference.species && (
                  <li>
                    종류: {preference.species === "DOG" ? "강아지" : "고양이"}
                  </li>
                )}
                {(preference.minAge != null || preference.maxAge != null) && (
                  <li>
                    나이: {preference.minAge ?? "-"} ~{" "}
                    {preference.maxAge ?? "-"}세
                  </li>
                )}
                {preference.size && <li>크기: {preference.size}</li>}
                {preference.regions?.length ? (
                  <li>지역: {preference.regions.join(", ")}</li>
                ) : null}
              </ul>
            ) : (
              <p className="text-[var(--toss-gray-500)] text-sm">
                설정된 선호도가 없습니다.
              </p>
            )}
            <Link
              to="/mypage/preferences"
              className="inline-block mt-3 text-sm font-semibold text-[var(--toss-blue)] hover:text-[var(--toss-blue-hover)]"
            >
              선호도 설정하기 →
            </Link>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
