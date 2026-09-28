import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useAnimationFrame, useMotionValue, useSpring, useTransform } from "framer-motion";
import { animalApi } from "@/api";
import type { AnimalResponse } from "@/types/dto";
import AnimalImageFallback from "@/components/animals/AnimalImageFallback";

export default function UrgentAnimalsSection() {
  const [animals, setAnimals] = useState<AnimalResponse[]>([]);
  const [loading, setLoading] = useState(true);

  // 애니메이션 제어를 위한 Motion Values
  const baseSpeed = 0.008; // 기본 흐름 속도 (한 마리당 약 5초 소요되도록 조정)
  const speed = useMotionValue(baseSpeed);
  const springSpeed = useSpring(speed, { stiffness: 60, damping: 20 });
  const xPercentage = useMotionValue(0);
  const x = useTransform(xPercentage, (val) => `${val}%`);

  useEffect(() => {
    const fetchUrgentAnimals = async () => {
      try {
        const data = await animalApi.getUrgentAnimals(20);
        setAnimals(data);
      } catch (error) {
        console.error("긴급 구호 동물 정보를 불러오지 못했습니다.", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUrgentAnimals();
  }, []);

  // 매 프레임마다 위치 업데이트 (부드러운 감속/가속 포함)
  useAnimationFrame((_time, delta) => {
    // delta를 활용하여 프레임 레이트와 관계없이 일정한 속도 유지
    const moveBy = springSpeed.get() * (delta / 16);
    let nextX = xPercentage.get() - moveBy;

    // -50% 지점(복제본 시작점)에 도달하면 0으로 리셋하여 무한 루프 구현
    if (nextX <= -50) {
      nextX = 0;
    }
    xPercentage.set(nextX);
  });

  if (loading || animals.length === 0) {
    return null;
  }

  const duplicatedAnimals = [...animals, ...animals];

  return (
    <section className="bg-zinc-900 py-12 border-y border-zinc-800 relative overflow-hidden">
      {/* 백그라운드 효과 */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-red-900 opacity-20 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 rounded-full bg-orange-900 opacity-10 blur-3xl pointer-events-none" />
      
      <div className="landing-inner relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 px-4 md:px-0">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <span className="text-xl">🚨</span> 가족을 애타게 기다리고 있어요
            </h2>
            <p className="text-red-400 font-medium mt-2">
              안락사가 머지않은 아이들입니다. 당신의 도움이 절실합니다.
            </p>
          </div>
          <Link
            to="/animals?sort=noticeEndDate,asc"
            className="flex items-center text-sm font-semibold text-zinc-400 hover:text-white group transition-colors"
          >
            전체 보기
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1 transform group-hover:translate-x-1 transition-transform">
              <path d="m9 18 6-6-6-6"/>
            </svg>
          </Link>
        </div>
      </div>

      {/* 무한 루프 전광판 영역 (화면 전체 너비 확장 및 가장자리 페이드 효과) */}
      <div 
        className="relative w-full z-10" 
        style={{ 
          maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)', 
          WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)' 
        }}
        onMouseEnter={() => speed.set(0)}
        onMouseLeave={() => speed.set(baseSpeed)}
      >
        <motion.div 
          className="flex gap-5 w-max py-8 px-4 will-change-transform"
          style={{ x }}
        >
          {duplicatedAnimals.map((animal, index) => (
            <Link
              key={`${animal.id}-${index}`}
              to={`/animals/${animal.id}`}
              className="group flex-none w-64 md:w-72 bg-zinc-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden relative border border-zinc-700 hover:border-red-900/50 hover:-translate-y-1 block"
            >
              {/* 긴급 배지 */}
              {animal.daysUntilExpiry !== undefined && animal.daysUntilExpiry !== null && (
                <div className="absolute top-3 left-3 z-10">
                  <span 
                    className={`inline-block px-3 py-1.5 text-xs font-bold rounded-lg shadow-md border ${
                      animal.daysUntilExpiry < 0 
                        ? "bg-zinc-900 text-zinc-300 border-zinc-800" 
                        : animal.daysUntilExpiry <= 3 
                          ? "bg-red-600 text-white border-red-700 animate-pulse" 
                          : animal.daysUntilExpiry <= 7
                            ? "bg-orange-600 text-white border-orange-700"
                            : "bg-zinc-700 text-zinc-200 border-zinc-600"
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
              
              <div 
                className="w-full h-48 md:h-56 relative overflow-hidden bg-zinc-900 flex items-center justify-center"
              >
                {animal.imageUrl ? (
                  <img 
                    src={animal.imageUrl} 
                    alt={animal.name}
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-all duration-1000 ease-out opacity-80 group-hover:opacity-100"
                    loading="lazy"
                  />
                ) : (
                  <div className="opacity-50"><AnimalImageFallback /></div>
                )}
              </div>
              
              <div className="p-5">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-white text-lg truncate pr-2">{animal.name}</h3>
                  <span className="text-xs font-medium text-zinc-300 bg-zinc-700 border-zinc-600 border px-2 py-1 rounded shrink-0">
                    {animal.species === "DOG" ? "강아지" : "고양이"}
                  </span>
                </div>
                <div className="flex items-center text-sm text-zinc-400 mt-2 gap-2">
                  <span className="truncate flex-1" title={animal.breed}>{animal.breed || "품종미상"}</span>
                </div>
                <div className="flex flex-wrap items-center mt-3 gap-y-2">
                   <span className="text-xs text-zinc-400 border border-zinc-700 rounded px-2 py-0.5 mr-2">
                    {animal.age != null ? `${animal.age}세` : "나이미상"}
                   </span>
                   <span className="text-xs text-zinc-400 border border-zinc-700 rounded px-2 py-0.5">
                    {animal.gender === "MALE" ? "수컷" : animal.gender === "FEMALE" ? "암컷" : "성별미상"}
                   </span>
                </div>
              </div>
            </Link>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
