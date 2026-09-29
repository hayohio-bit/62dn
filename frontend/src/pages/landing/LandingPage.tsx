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
import type { AnimalResponse, AnimalStatsResponse } from "@/types/dto";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

/**
 * 랜딩 흐름: 첫인사(히어로) → 마감 임박 아이들 → 함께하는 방법 → 보호소의 현실 → 입양 후기 → FAQ → 행동 유도
 */
export default function LandingPage() {
  useDocumentTitle();
  const [urgent, setUrgent] = useState<AnimalResponse[]>([]);
  const [stats, setStats] = useState<AnimalStatsResponse | null>(null);

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
    animalApi
      .getStats()
      .then((data) => {
        if (!cancelled) setStats(data ?? null);
      })
      .catch(() => {
        // 현황을 불러오지 못하면 숫자 없는 문구를 보여 준다
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <HeroSection featured={urgent[0]} stats={stats} />
        <UrgentStrip animals={urgent} stats={stats} />
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
