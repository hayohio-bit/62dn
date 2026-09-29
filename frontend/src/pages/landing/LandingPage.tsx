import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/landing/HeroSection";
import UrgentStrip from "@/components/landing/UrgentStrip";
import WaysSection from "@/components/landing/WaysSection";
import RealitySection from "@/components/landing/RealitySection";
import StoriesSection from "@/components/landing/StoriesSection";
import FAQSection from "@/components/landing/FAQSection";
import FinalCTA from "@/components/landing/FinalCTA";
import { animalApi } from "@/api";
import type { AnimalResponse } from "@/types/dto";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

/**
 * 랜딩 흐름: 첫인사(히어로) → 마감 임박 아이들 → 함께하는 방법 → 보호소의 현실 → 입양 후기 → FAQ → 행동 유도
 */
export default function LandingPage() {
  useDocumentTitle();
  const [urgent, setUrgent] = useState<AnimalResponse[]>([]);

  useEffect(() => {
    let cancelled = false;
    animalApi
      .getUrgentAnimals(12)
      .then((data) => {
        if (!cancelled) setUrgent(data ?? []);
      })
      .catch(() => {
        // 마감 임박 목록이 없어도 랜딩은 그대로 보여 준다
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <HeroSection featured={urgent[0]} urgentCount={urgent.length} />
        <UrgentStrip animals={urgent} />
        <WaysSection />
        <RealitySection />
        <StoriesSection />
        <FAQSection />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
