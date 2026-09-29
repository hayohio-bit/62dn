import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import axios from "axios";
import clsx from "clsx";
import { animalApi, shelterApi } from "@/api";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Reveal from "@/components/motion/Reveal";
import KakaoMap from "@/components/map/KakaoMap";
import Pagination from "@/components/list/Pagination";
import AnimalCard, { AnimalCardSkeletonGrid } from "@/components/animals/AnimalCard";
import { speciesLabels } from "@/constants/animalLabels";
import { useFavoriteIds } from "@/hooks/useFavoriteIds";
import type { Animal, PublicShelterResponse, Species } from "@/types/entities";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

const PAGE_SIZE = 8;

const telHref = (phone: string) => `tel:${phone.replace(/[^0-9+]/g, "")}`;

const speciesOptions: { value: Species | ""; label: string }[] = [
  { value: "", label: "전체" },
  { value: "DOG", label: speciesLabels.DOG },
  { value: "CAT", label: speciesLabels.CAT },
];

/** 보호소 페이지: 보호소 정보와 연락처, 그 보호소에서 공고 중인 동물 목록 */
export default function ShelterPage() {
  const { id } = useParams<{ id: string }>();
  const shelterId = Number(id);
  const [shelter, setShelter] = useState<PublicShelterResponse | null>(null);
  const [shelterState, setShelterState] = useState<"loading" | "ready" | "notFound" | "error">("loading");
  // 종류 필터와 페이지는 URL에 두어, 동물 상세에서 뒤로 돌아와도 보던 목록이 유지되게 한다
  const [searchParams, setSearchParams] = useSearchParams();
  const speciesParam = searchParams.get("species");
  const species: Species | "" = speciesParam === "DOG" || speciesParam === "CAT" ? speciesParam : "";
  const page = Math.max(0, Number(searchParams.get("page")) || 0);
  const updateList = (next: { species?: Species | ""; page: number }) =>
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev);
        const nextSpecies = next.species ?? species;
        if (nextSpecies) params.set("species", nextSpecies);
        else params.delete("species");
        if (next.page > 0) params.set("page", String(next.page));
        else params.delete("page");
        return params;
      },
      { replace: true },
    );
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [total, setTotal] = useState(0);
  const [animalsLoading, setAnimalsLoading] = useState(true);
  const [animalsError, setAnimalsError] = useState(false);
  const { favoriteIds, toggle } = useFavoriteIds();
  useDocumentTitle(shelterState === "notFound" ? "보호소를 찾을 수 없음" : shelter?.name);

  useEffect(() => {
    if (!Number.isInteger(shelterId) || shelterId <= 0) {
      setShelterState("notFound");
      return;
    }
    let cancelled = false;
    setShelterState("loading");
    shelterApi
      .getPublicShelter(shelterId)
      .then((data) => {
        if (cancelled) return;
        setShelter(data);
        setShelterState("ready");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const notFound = axios.isAxiosError(err) && err.response?.status === 404;
        setShelterState(notFound ? "notFound" : "error");
      });
    return () => {
      cancelled = true;
    };
  }, [shelterId]);

  useEffect(() => {
    if (shelterState !== "ready") return;
    let cancelled = false;
    setAnimalsLoading(true);
    setAnimalsError(false);
    animalApi
      // 목록 화면·랜딩 현황과 같은 기준으로 보호 중(공고 중)인 동물만 보여 준다
      .getAll({ shelterId, status: "PROTECTED", species: species || undefined, page, sizeParam: PAGE_SIZE })
      .then((data) => {
        if (cancelled) return;
        setAnimals(data?.content ?? []);
        setTotal(data?.totalElements ?? 0);
      })
      .catch(() => {
        if (cancelled) return;
        setAnimals([]);
        setTotal(0);
        setAnimalsError(true);
      })
      .finally(() => !cancelled && setAnimalsLoading(false));
    return () => {
      cancelled = true;
    };
  }, [shelterId, shelterState, species, page]);

  if (shelterState === "notFound" || shelterState === "error") {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 items-center">
          <Reveal className="dn-page-head w-full pb-24">
            <p className="dn-eyebrow">Shelter</p>
            <h1 className="dn-page-title">
              {shelterState === "notFound" ? "보호소를 찾을 수 없어요" : "보호소 정보를 불러오지 못했어요"}
            </h1>
            <p className="dn-page-desc">
              {shelterState === "notFound"
                ? "주소가 바뀌었거나 더 이상 공고가 없는 보호소예요."
                : "잠시 후 다시 시도해 주세요. 서버에 연결할 수 없으면 이 화면이 보일 수 있어요."}
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link to="/animals" className="toss-btn toss-btn-accent">
                아이들 만나러 가기
              </Link>
              <Link to="/support" className="toss-btn toss-btn-outline">
                보호소 찾기
              </Link>
            </div>
          </Reveal>
        </main>
        <Footer />
      </div>
    );
  }

  const region = shelter ? [shelter.regionSido, shelter.regionSigungu].filter(Boolean).join(" ") : "";
  const hasCoords = shelter?.latitude != null && shelter?.longitude != null;
  const directionsUrl = shelter
    ? hasCoords
      ? `https://map.kakao.com/link/to/${encodeURIComponent(shelter.name)},${shelter.latitude},${shelter.longitude}`
      : `https://map.kakao.com/link/search/${encodeURIComponent(shelter.address)}`
    : "";
  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 pb-24 md:pb-32" aria-busy={shelterState === "loading"}>
        {shelterState === "loading" || !shelter ? (
          <div className="dn-page-head animate-pulse" aria-hidden>
            <div className="h-4 w-24 rounded-full bg-cream-200" />
            <div className="mt-5 h-12 w-2/3 rounded-full bg-cream-200" />
            <div className="mt-4 h-4 w-1/2 rounded-full bg-cream-200/70" />
          </div>
        ) : (
          <>
            <header className="dn-page-head !pb-10 md:!pb-14">
              <div className="grid gap-8 md:grid-cols-12 md:items-end">
                <Reveal className="md:col-span-8">
                  <p className="dn-eyebrow">Shelter{region && ` · ${region}`}</p>
                  <h1 className="dn-page-title break-keep">{shelter.name}</h1>
                  <p className="dn-page-desc">{shelter.address}</p>
                  <div className="mt-7 flex flex-wrap gap-2">
                    {shelter.phone && (
                      <a href={telHref(shelter.phone)} className="toss-btn toss-btn-accent !px-5 !py-3 text-[0.9375rem]">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                          <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" />
                        </svg>
                        {shelter.phone}
                      </a>
                    )}
                    <a
                      href={directionsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="toss-btn toss-btn-outline !px-5 !py-3 text-[0.9375rem]"
                    >
                      카카오맵 길찾기 <span aria-hidden>↗</span>
                      <span className="sr-only">(새 창)</span>
                    </a>
                    {shelter.email && (
                      <a href={`mailto:${shelter.email}`} className="toss-btn toss-btn-outline !px-5 !py-3 text-[0.9375rem]">
                        이메일 보내기
                      </a>
                    )}
                  </div>
                </Reveal>
                {!animalsLoading && !animalsError && species === "" && (
                  <Reveal delay={0.1} className="md:col-span-4 md:text-right">
                    <p className="font-display font-display-strong text-5xl leading-none text-ink md:text-6xl">
                      {total.toLocaleString()}
                      <span className="ml-1 text-2xl md:text-3xl">마리</span>
                    </p>
                    <p className="mt-2 text-sm text-ink-muted">이 보호소에서 가족을 기다리는 아이들</p>
                  </Reveal>
                )}
              </div>
            </header>

            <div className="mx-auto max-w-[76rem] px-6">
              <section aria-labelledby="shelter-animals" aria-busy={animalsLoading}>
                <div className="flex flex-wrap items-center justify-between gap-4 border-y border-ink/10 py-5">
                  <h2 id="shelter-animals" className="font-display text-2xl text-ink md:text-3xl">
                    공고 중인 아이들
                  </h2>
                  <div className="list-filter-row" role="group" aria-label="종류">
                    {speciesOptions.map((opt) => (
                      <button
                        key={opt.value || "all"}
                        type="button"
                        className={clsx("list-filter-chip", species === opt.value && "is-active")}
                        aria-pressed={species === opt.value}
                        onClick={() => updateList({ species: opt.value, page: 0 })}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-10 md:mt-12">
                  {animalsError ? (
                    <div className="rounded-3xl border border-terracotta/25 bg-terracotta-50 px-6 py-14 text-center" role="alert">
                      <p className="font-display text-2xl text-ink">목록을 불러오지 못했어요</p>
                      <p className="mt-2 text-sm text-ink-soft">잠시 후 다시 시도해 주세요.</p>
                    </div>
                  ) : animalsLoading ? (
                    <AnimalCardSkeletonGrid count={4} />
                  ) : animals.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-ink/20 px-6 py-16 text-center">
                      <p className="font-display text-2xl text-ink">
                        {species ? `공고 중인 ${speciesLabels[species]}가 없어요` : "지금은 공고 중인 아이가 없어요"}
                      </p>
                      <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-ink-soft">
                        봉사나 물품 후원은 공고와 상관없이 언제든 보호소에 문의할 수 있어요.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-9 md:grid-cols-3 md:gap-x-6 md:gap-y-14 lg:grid-cols-4">
                        {animals.map((animal, i) => (
                          <AnimalCard
                            key={animal.id}
                            animal={animal}
                            index={i}
                            favorited={favoriteIds.includes(animal.id)}
                            onFavoriteToggle={(added) => toggle(animal.id, added)}
                          />
                        ))}
                      </div>
                      {totalPages > 1 && (
                        <Pagination
                          page={page}
                          totalPages={totalPages}
                          totalElements={total}
                          size={PAGE_SIZE}
                          onPageChange={(p) => updateList({ page: p })}
                          unit="마리"
                        />
                      )}
                    </>
                  )}
                </div>
              </section>

              <Reveal className="mt-20 grid gap-10 border-t border-ink/15 pt-12 md:mt-28 md:grid-cols-12 md:pt-16 lg:gap-16">
                <div className="md:col-span-5">
                  <p className="dn-eyebrow">Visit & Support</p>
                  <h2 className="mt-3 font-display text-3xl leading-tight text-ink md:text-4xl">방문과 봉사·후원</h2>
                  <p className="mt-5 leading-relaxed text-ink-soft">
                    입양 상담, 봉사 일정, 필요한 후원 물품은 보호소마다 달라요. 방문하거나 물품을 보내기 전에 먼저
                    전화로 확인해 주세요.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-2">
                    <Link to="/guide/adoption" className="toss-btn toss-btn-outline !px-4 !py-2.5 text-sm">
                      입양 절차 안내
                    </Link>
                    <Link to="/guide/foster" className="toss-btn toss-btn-outline !px-4 !py-2.5 text-sm">
                      임시보호 절차 안내
                    </Link>
                  </div>
                </div>
                <div className="md:col-span-7">
                  <KakaoMap
                    address={shelter.address}
                    latitude={shelter.latitude ?? undefined}
                    longitude={shelter.longitude ?? undefined}
                    height={320}
                    className="w-full"
                  />
                </div>
              </Reveal>
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
