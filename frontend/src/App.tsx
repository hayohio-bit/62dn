import { Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ErrorBoundary from "@/components/ErrorBoundary";
import ScrollRestoration from "@/components/ScrollRestoration";
import LandingPage from "@/pages/landing/LandingPage";
import { lazyPage } from "@/lib/lazyPage";

// 랜딩 외의 페이지는 처음 방문할 때 내려받는다 (첫 화면 번들 크기 축소)
const AnimalsPage = lazyPage(() => import("@/pages/animals/AnimalsPage"));
const AnimalDetailPage = lazyPage(
  () => import("@/pages/animals/AnimalDetailPage"),
);
const SupportPage = lazyPage(() => import("@/pages/support/SupportPage"));
const ShelterPage = lazyPage(() => import("@/pages/shelters/ShelterPage"));
const MyPage = lazyPage(() => import("@/pages/my/MyPage"));
const PreferencePage = lazyPage(() => import("@/pages/my/PreferencePage"));
const PlaceholderPage = lazyPage(() => import("@/pages/PlaceholderPage"));
const GuideAdoptionPage = lazyPage(
  () => import("@/pages/guide/GuideAdoptionPage"),
);
const GuideFosterPage = lazyPage(() => import("@/pages/guide/GuideFosterPage"));

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter
        basename={import.meta.env.BASE_URL}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <ScrollRestoration />
        <Suspense
          fallback={<div className="min-h-screen bg-cream" aria-busy="true" />}
        >
          <Routes>
            <Route path="/" element={<LandingPage />} />

            <Route path="/animals" element={<AnimalsPage />} />
            <Route path="/animals/:id" element={<AnimalDetailPage />} />
            {/* 절차 안내 */}
            <Route path="/guide/adoption" element={<GuideAdoptionPage />} />
            <Route path="/guide/foster" element={<GuideFosterPage />} />

            <Route path="/support" element={<SupportPage />} />
            <Route path="/shelters/:id" element={<ShelterPage />} />

            {/* 이 브라우저에 저장하는 관심 동물·선호 조건 */}
            <Route path="/mypage" element={<MyPage />} />
            <Route path="/mypage/preferences" element={<PreferencePage />} />

            {/* 약관 */}
            <Route path="/privacy" element={<PlaceholderPage />} />
            <Route path="/terms" element={<PlaceholderPage />} />

            {/* 정의되지 않은 주소: 빈 화면 대신 안내 페이지 표시 */}
            <Route path="*" element={<PlaceholderPage />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
