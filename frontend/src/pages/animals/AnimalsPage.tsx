import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import ListSearch from "@/components/list/ListSearch";
import Pagination from "@/components/list/Pagination";
import FilterBar from "@/components/list/FilterBar";
import PreferenceModal from "@/components/animals/PreferenceModal";
import FavoriteButton from "@/components/animals/FavoriteButton";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AnimalImageFallback from "@/components/animals/AnimalImageFallback";
import { REGION_SIDO_OPTIONS, SIGUNGU_BY_SIDO } from "@/constants/regions";
import { useAnimals } from "@/hooks/useAnimals";

const speciesLabels: Record<string, string> = { DOG: "강아지", CAT: "고양이" };
const sizeLabels: Record<string, string> = { SMALL: "소형", MEDIUM: "중형", LARGE: "대형" };
const genderLabels: Record<string, string> = { MALE: "수컷", FEMALE: "암컷" };
const PAGE_SIZE_OPTIONS = [8, 12, 20];

export default function AnimalsPage() {
  const { state, actions } = useAnimals();
  
  const {
    loading, error, viewMode, search, species, size, region, sigungu,
    page, pageSize, preference, showPreferenceModal, favoriteIds,
    animals, totalPages, apiTotalElements
  } = state;

  const {
    setViewMode, setSearch, setSpecies, setSize, setRegion, setSigungu,
    setPage, setPageSize, setShowPreferenceModal, setFavoriteIds, handleSavePreference, resetFilters
  } = actions;

  const renderContent = () => {
    if (error) {
      return (
        <div className="text-center py-12">
          <p className="text-red-600">{error}</p>
        </div>
      );
    }
    
    if (loading) {
      return (
        <div className="text-center py-20">
          <p className="text-gray-600">로딩 중...</p>
        </div>
      );
    }
    
    if (animals.length === 0) {
      return (
        <div className="text-center py-20 bg-white rounded-xl">
          <p className="text-gray-600">조건에 맞는 아이가 없습니다.</p>
          <button
            type="button"
            className="mt-3 text-green-600 font-medium hover:underline"
            onClick={resetFilters}
          >
            필터 초기화
          </button>
        </div>
      );
    }
    
    return (
      <>
        <div className="landing-pet-grid">
          {animals.map((animal) => (
            <Link
              key={animal.id}
              to={`/animals/${animal.id}`}
              className="landing-pet-card relative"
            >
              <div className="absolute top-3 right-3 z-10">
                <FavoriteButton
                  animalId={animal.id}
                  isFavorited={favoriteIds.includes(animal.id)}
                  onToggle={(added) => {
                    setFavoriteIds((prev) =>
                      added ? [...prev, animal.id] : prev.filter((id) => id !== animal.id)
                    );
                  }}
                  size="md"
                />
              </div>
              <div
                className="landing-pet-card-img relative overflow-hidden"
                style={{
                  backgroundImage: animal.imageUrl ? `url(${animal.imageUrl})` : "none",
                  backgroundColor: animal.imageUrl ? "transparent" : "#f3f4f6",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {!animal.imageUrl && <AnimalImageFallback />}
                
                {animal.daysUntilExpiry !== undefined && animal.daysUntilExpiry !== null && (
                  <div className="absolute top-3 left-3 z-10">
                    <span 
                      className={`inline-block px-2.5 py-1 text-xs font-bold rounded-lg shadow-sm border ${
                        animal.daysUntilExpiry < 0 
                          ? "bg-gray-800 text-white border-gray-900" 
                          : animal.daysUntilExpiry <= 3 
                            ? "bg-red-600 text-white border-red-700" 
                            : animal.daysUntilExpiry <= 7
                              ? "bg-orange-500 text-white border-orange-600"
                              : "bg-white text-gray-800 border-gray-200"
                      }`}
                    >
                      {animal.daysUntilExpiry < 0 
                        ? "공고 만료" 
                        : animal.daysUntilExpiry === 0 
                          ? "오늘 안락사 예정" 
                          : `D-${animal.daysUntilExpiry}`}
                    </span>
                  </div>
                )}
              </div>
              <div className="landing-pet-card-body">
                <p className="landing-pet-card-name">{animal.name}</p>
                <p className="landing-pet-card-meta">
                  {speciesLabels[animal.species] ?? ""} · {animal.age != null ? `${animal.age}세` : "나이미상"} · {sizeLabels[animal.size] ?? "크기미상"} · {genderLabels[animal.gender] ?? "성별미상"}
                </p>
                <p className="landing-pet-card-story">
                  {animal.breed ?? "품종미상"} · {animal.neutered ? "중성화 완료" : "미중성화"}
                </p>
                {animal.shelterName && (
                  <p className="text-xs text-gray-500 mt-1">{animal.shelterName}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
        <Pagination
          page={page}
          totalPages={totalPages}
          totalElements={apiTotalElements}
          size={pageSize}
          onPageChange={setPage}
          onSizeChange={(s) => {
            setPageSize(s);
            setPage(0);
          }}
          sizeOptions={PAGE_SIZE_OPTIONS}
        />
      </>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main className="flex-1" style={{ background: "var(--landing-gray-100)", paddingTop: "6.5rem" }}>
        <section className="landing-section">
          <div className="landing-inner">
            <div className="text-center mb-8">
              <h1 className="landing-section-title landing-section-title--center">입양 가능한 아이들</h1>
              <p className="landing-section-desc landing-section-desc--center">새로운 가족을 기다리는 아이들입니다.</p>
            </div>

            <div className="flex justify-center gap-2 mb-6">
              <button
                type="button"
                className={`px-6 py-2 rounded-full font-semibold transition ${viewMode === "all" ? "bg-green-600 text-white" : "bg-white border border-gray-300 text-gray-700 hover:border-green-600 hover:text-green-600"}`}
                onClick={() => setViewMode("all")}
              >
                전체
              </button>
              <button
                type="button"
                className={`px-6 py-2 rounded-full font-semibold transition ${viewMode === "recommended" ? "bg-green-600 text-white" : "bg-white border border-gray-300 text-gray-700 hover:border-green-600 hover:text-green-600"}`}
                onClick={() => {
                  if (!preference) setShowPreferenceModal(true);
                  else { setViewMode("recommended"); setPage(0); }
                }}
              >
                나를 위한 추천 {preference && "✓"}
              </button>
              {viewMode === "recommended" && (
                <button
                  type="button"
                  className="px-4 py-2 rounded-full border border-gray-300 text-gray-700 hover:border-gray-400 text-sm"
                  onClick={() => setShowPreferenceModal(true)}
                >
                  설정 변경
                </button>
              )}
            </div>

            <div className="list-toolbar mb-8">
              <ListSearch value={search} onChange={setSearch} placeholder="이름, 품종, 보호소로 검색" />
              {viewMode === "all" && (
                <FilterBar
                  groups={[
                    {
                      label: "종류",
                      options: [{ value: "", label: "전체" }, { value: "DOG", label: speciesLabels.DOG }, { value: "CAT", label: speciesLabels.CAT }],
                      value: species,
                      onChange: (v) => { setSpecies(v as any); setPage(0); },
                    },
                    {
                      label: "크기",
                      options: [{ value: "", label: "전체" }, { value: "SMALL", label: sizeLabels.SMALL }, { value: "MEDIUM", label: sizeLabels.MEDIUM }, { value: "LARGE", label: sizeLabels.LARGE }],
                      value: size,
                      onChange: (v) => { setSize(v as any); setPage(0); },
                    },
                    {
                      label: "시/도",
                      options: REGION_SIDO_OPTIONS, value: region,
                      onChange: (v) => { setRegion(v); setSigungu(""); setPage(0); },
                    },
                    ...(region ? [{
                      label: "시/군/구",
                      options: SIGUNGU_BY_SIDO[region] ?? [{ value: "", label: "전체" }], value: sigungu,
                      onChange: (v: string) => { setSigungu(v); setPage(0); },
                    }] : []),
                  ]}
                  onReset={resetFilters}
                />
              )}
            </div>

            {viewMode === "recommended" && preference && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 max-w-3xl mx-auto">
                <p className="text-green-800 text-sm font-medium">
                  <span className="font-bold">선호도 기준:</span>{" "}
                  {preference.species ? speciesLabels[preference.species] : "종류 무관"} ·{" "}
                  {preference.minAge !== undefined || preference.maxAge !== undefined ? `${preference.minAge ?? 0}~${preference.maxAge ?? "제한없음"}세` : "나이 무관"} ·{" "}
                  {preference.size ? sizeLabels[preference.size] : "크기 무관"}
                  {preference.regions?.length ? ` · ${preference.regions.join(", ")}` : " · 지역 무관"}
                </p>
              </div>
            )}

            {renderContent()}

          </div>
        </section>
      </main>
      <Footer />

      {showPreferenceModal &&
        createPortal(
          <PreferenceModal currentPreference={preference || undefined} onSave={handleSavePreference} onClose={() => setShowPreferenceModal(false)} />,
          document.body
        )}
    </div>
  );
}
