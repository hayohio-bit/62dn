import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/landing/HeroSection";
import UrgentAnimalsSection from "@/components/landing/UrgentAnimalsSection";
import StickyScrollSection from "@/components/landing/StickyScrollSection";
import SuccessStoriesSection from "@/components/landing/SuccessStoriesSection";
import FAQSection from "@/components/landing/FAQSection";
import CallToAction from "@/components/landing/CallToAction";

/**
 * 랜딩 페이지 흐름 (Toss 스타일 스토리텔링)
 * Hero (문제 제기) → Sticky Scroll (솔루션) → Feature (특징) → Success Stories (소셜 프루프) → FAQ → CTA
 */
export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main className="flex-1 relative w-full">
        <HeroSection />

        <UrgentAnimalsSection />

        <StickyScrollSection />

        <div className="bg-white">
          <SuccessStoriesSection />
        </div>

        <div className="bg-gray-50 py-20">
          <FAQSection />
        </div>

        <CallToAction />
        <Footer />
      </main>
    </div>
  );
}
