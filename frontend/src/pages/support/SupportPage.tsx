import { useEffect, useState, useCallback } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ListSearch from "@/components/list/ListSearch";
import FilterBar from "@/components/list/FilterBar";
import Pagination from "@/components/list/Pagination";
import { shelterApi } from "@/api";
import type { PublicShelterResponse } from "@/types/entities";
import ShelterDetailModal from "@/components/support/ShelterDetailModal";

const PAGE_SIZE_OPTIONS = [5, 10, 20];
const REGION_OPTIONS = [
  { value: "", label: "전국" },
  { value: "서울", label: "서울" },
  { value: "경기", label: "경기" },
  { value: "인천", label: "인천" },
  { value: "강원", label: "강원" },
  { value: "대전", label: "대전" },
  { value: "세종", label: "세종" },
  { value: "충남", label: "충남" },
  { value: "충북", label: "충북" },
  { value: "부산", label: "부산" },
  { value: "대구", label: "대구" },
  { value: "울산", label: "울산" },
  { value: "경북", label: "경북" },
  { value: "경남", label: "경남" },
  { value: "광주", label: "광주" },
  { value: "전남", label: "전남" },
  { value: "전북", label: "전북" },
  { value: "제주", label: "제주" },
];

export default function SupportPage() {
  const [search, setSearch] = useState("");
  const [regionFilter, setRegionFilter] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const [shelters, setShelters] = useState<PublicShelterResponse[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);

  // 모달용 선택 보호소
  const [selectedShelter, setSelectedShelter] =
    useState<PublicShelterResponse | null>(null);

  // isCancelled: 조건이 바뀐 뒤 늦게 도착한 이전 요청의 응답을 버리기 위한 확인 함수
  const fetchShelters = useCallback(
    async (isCancelled: () => boolean) => {
      setLoading(true);
      try {
        const qSelectedRegion = regionFilter || undefined;
        const qKeyword = search.trim() || undefined;
        const res = await shelterApi.getPublicShelters(
          qSelectedRegion,
          qKeyword,
          page,
          pageSize,
        );
        if (isCancelled()) return;
        setShelters(res.content);
        setTotalPages(res.totalPages || 1);
        setTotalElements(res.totalElements || 0);
      } catch (e) {
        if (isCancelled()) return;
        console.error(e);
        setShelters([]);
      } finally {
        if (!isCancelled()) setLoading(false);
      }
    },
    [regionFilter, search, page, pageSize],
  );

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      fetchShelters(() => cancelled);
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [fetchShelters]);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main className="flex-1 bg-[var(--landing-gray-100)] pt-24 pb-16">
        <section className="landing-section">
          <div className="landing-inner space-y-8">
            {/* 상단 안내 매뉴얼 영역 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-8 overflow-hidden">
              <div className="bg-[var(--landing-primary)]/10 px-8 py-10 text-center">
                <h1 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">
                  근처 유기동물 보호소에 봉사·기부 전화 신청하기
                </h1>
                <p className="text-gray-700 text-lg">
                  공공데이터에 등록된 전국 동물보호센터 정보를 기반으로,{" "}
                  <br className="hidden md:block" />각 센터에 직접 전화해
                  봉사·기부를 신청할 수 있는 안내 페이지입니다.
                </p>
              </div>

              <div className="p-8">
                {/* 절차 안내 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                  <div className="bg-blue-50/50 rounded-2xl p-6 border border-blue-100">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xl shrink-0">
                        🤝
                      </div>
                      <h3 className="font-bold text-xl text-gray-900">
                        봉사 기본절차
                      </h3>
                    </div>
                    <ol className="text-gray-700 space-y-3 list-decimal list-inside ml-1">
                      <li>
                        아래 검색창에서 <strong>방문 가능한 보호소</strong> 찾기
                      </li>
                      <li>
                        보호소에 <strong>직접 전화</strong>하여 자원봉사 일정 및
                        가능 여부 문의
                      </li>
                      <li>
                        안내받은 날짜와 시간에 맞춰{" "}
                        <strong>보호소 방문 및 자원봉사 진행</strong>
                      </li>
                    </ol>
                  </div>

                  <div className="bg-green-50/50 rounded-2xl p-6 border border-green-100">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xl shrink-0">
                        🎁
                      </div>
                      <h3 className="font-bold text-xl text-gray-900">
                        기부 기본절차
                      </h3>
                    </div>
                    <ol className="text-gray-700 space-y-3 list-decimal list-inside ml-1">
                      <li>
                        아래 검색창에서 <strong>기부할 보호소</strong> 찾기
                      </li>
                      <li>
                        보호소에 <strong>직접 전화</strong>하여 현재 필요한 기부
                        물품 여부 문의
                      </li>
                      <li>
                        안내받은 방법(택배 발송 또는 방문)으로{" "}
                        <strong>물품 기부 진행</strong>
                      </li>
                    </ol>
                  </div>
                </div>

                {/* 주의사항 */}
                <div className="bg-orange-50/50 rounded-2xl p-6 border border-orange-100">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-orange-500 font-bold text-lg">
                      ⚠️
                    </span>
                    <h3 className="font-bold text-lg text-gray-900">
                      활동 진행 전 주의사항
                    </h3>
                  </div>
                  <ul className="list-disc list-inside text-gray-700 space-y-2 ml-1">
                    <li>
                      보호소 상황에 따라 외부 인력의 출입이 제한되거나 봉사
                      일정이 조기 마감될 수 있습니다.
                    </li>
                    <li>
                      필요 없는 물품이나 부패하기 쉬운 음식물을 예고 없이 보내는
                      행위는 지양해 주시기 바랍니다.
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 하단 보호소 검색 영역 */}
            <div className="bg-white rounded-2xl shadow-sm p-4 md:p-8 border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 px-1">
                보호소 찾기
              </h2>
              <div className="list-toolbar mb-8">
                <ListSearch
                  value={search}
                  onChange={(v) => {
                    setSearch(v);
                    setPage(0);
                  }}
                  placeholder="보호소 이름, 주소 검색"
                />
                <FilterBar
                  groups={[
                    {
                      label: "지역",
                      options: REGION_OPTIONS,
                      value: regionFilter,
                      onChange: (v) => {
                        setRegionFilter(v);
                        setPage(0);
                      },
                    },
                  ]}
                  onReset={
                    regionFilter
                      ? () => {
                          setRegionFilter("");
                          setPage(0);
                        }
                      : undefined
                  }
                />
              </div>

              {loading && shelters.length === 0 ? (
                <div className="py-20 text-center text-gray-500">
                  목록을 불러오는 중입니다...
                </div>
              ) : shelters.length === 0 ? (
                <div className="py-20 text-center text-gray-500">
                  조건에 맞는 보호소가 없습니다.
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                    {shelters.map((shelter) => (
                      <div
                        key={shelter.id}
                        className="p-5 border border-gray-200 rounded-xl hover:shadow-md transition bg-gray-50/30 cursor-pointer"
                        onClick={() => setSelectedShelter(shelter)}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="text-lg font-bold text-gray-900">
                            {shelter.name}
                          </h3>
                          {shelter.regionSido && (
                            <span className="bg-orange-100 text-orange-700 text-xs px-2.5 py-1 rounded-full font-medium shrink-0">
                              {shelter.regionSido} {shelter.regionSigungu}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 space-y-2">
                          <p className="flex items-start gap-2">
                            <span className="shrink-0">📍</span>
                            <span>{shelter.address}</span>
                          </p>
                          {shelter.phone && (
                            <p className="flex items-start gap-2">
                              <span className="shrink-0">📞</span>
                              <span className="text-blue-600">
                                {shelter.phone}
                              </span>
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8">
                    <Pagination
                      page={page}
                      totalPages={totalPages}
                      totalElements={totalElements}
                      size={pageSize}
                      onPageChange={setPage}
                      onSizeChange={(size) => {
                        setPageSize(size);
                        setPage(0);
                      }}
                      sizeOptions={PAGE_SIZE_OPTIONS}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />

      {/* 보호소 상세보기 모달 */}
      {selectedShelter && (
        <ShelterDetailModal
          shelter={selectedShelter}
          onClose={() => setSelectedShelter(null)}
        />
      )}
    </div>
  );
}
