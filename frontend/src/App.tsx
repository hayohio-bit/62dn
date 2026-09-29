import { Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ErrorBoundary from "@/components/ErrorBoundary";
import ScrollRestoration from "@/components/ScrollRestoration";
import { useProactiveRefresh } from "@/hooks/useProactiveRefresh";
import LandingPage from "@/pages/landing/LandingPage";
import { lazyPage } from "@/lib/lazyPage";

// 랜딩 외의 페이지는 처음 방문할 때 내려받는다 (첫 화면 번들 크기 축소)
const AnimalsPage = lazyPage(() => import("@/pages/animals/AnimalsPage"));
const AnimalDetailPage = lazyPage(
  () => import("@/pages/animals/AnimalDetailPage"),
);
const SupportPage = lazyPage(() => import("@/pages/support/SupportPage"));
const ShelterPage = lazyPage(() => import("@/pages/shelters/ShelterPage"));
const BoardsPage = lazyPage(() => import("@/pages/boards/BoardsPage"));
const BoardDetailPage = lazyPage(
  () => import("@/pages/boards/BoardDetailPage"),
);
const BoardWritePage = lazyPage(() => import("@/pages/boards/BoardWritePage"));
const LoginPage = lazyPage(() => import("@/pages/auth/LoginPage"));
const SignupPage = lazyPage(() => import("@/pages/auth/SignupPage"));
const FindEmailPage = lazyPage(() => import("@/pages/auth/FindEmailPage"));
const ResetPasswordPage = lazyPage(
  () => import("@/pages/auth/ResetPasswordPage"),
);
const KakaoCallback = lazyPage(() => import("@/pages/auth/KakaoCallback"));
const GoogleCallback = lazyPage(() => import("@/pages/auth/GoogleCallback"));
const MyPage = lazyPage(() => import("@/pages/auth/MyPage"));
const PreferencePage = lazyPage(() => import("@/pages/auth/PreferencePage"));
const AdminLoginPage = lazyPage(() => import("@/pages/admin/AdminLoginPage"));
const AdminSignupPage = lazyPage(() => import("@/pages/admin/AdminSignupPage"));
const AdminDashboardPage = lazyPage(
  () => import("@/pages/admin/AdminDashboardPage"),
);
const PlaceholderPage = lazyPage(() => import("@/pages/PlaceholderPage"));
const GuideAdoptionPage = lazyPage(
  () => import("@/pages/guide/GuideAdoptionPage"),
);
const GuideFosterPage = lazyPage(() => import("@/pages/guide/GuideFosterPage"));

// import ShelterSignupPage from '@/pages/auth/ShelterSignupPage';

function App() {
  useProactiveRefresh();
  return (
    <ErrorBoundary>
      <BrowserRouter
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

            {/* 게시판 */}
            <Route path="/boards" element={<BoardsPage />} />
            <Route path="/boards/write" element={<BoardWritePage />} />
            <Route path="/boards/:id/edit" element={<BoardWritePage />} />
            <Route path="/boards/:id" element={<BoardDetailPage />} />

            {/* 인증 */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/find-email" element={<FindEmailPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            {/* <Route path="/shelter-signup" element={<ShelterSignupPage />} /> */}
            <Route path="/oauth/kakao" element={<KakaoCallback />} />
            <Route path="/oauth/google" element={<GoogleCallback />} />
            <Route path="/mypage" element={<MyPage />} />
            <Route path="/mypage/preferences" element={<PreferencePage />} />
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin/signup" element={<AdminSignupPage />} />

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
