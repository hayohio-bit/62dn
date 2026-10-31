/**
 * 동물 상세 하단의 "다음으로 볼 아이들"
 * 같은 보호소의 다른 동물을 먼저 보여 주고, 없으면 같은 종류 중 공고 마감이 가까운 동물을 보여 준다.
 * 같은 보호소의 동물은 한 번 방문이나 전화로 함께 문의할 수 있다.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { animalApi } from "@/api";
import AnimalCard from "@/components/animals/AnimalCard";
import Reveal from "@/components/motion/Reveal";
import { speciesLabels } from "@/constants/animalLabels";
import type { Animal } from "@/types/entities";

const MAX_CARDS = 4;

interface MoreAnimalsProps {
  animal: Animal;
}

export default function MoreAnimals({ animal }: MoreAnimalsProps) {
  const [result, setResult] = useState<{ source: "shelter" | "species"; animals: Animal[] } | null>(null);
  const { id, shelterId, species } = animal;

  useEffect(() => {
    // 다른 동물로 이동하면 이전 동물 기준의 목록을 지우고, 늦게 도착한 이전 응답은 버린다
    setResult(null);
    let cancelled = false;
    const others = (list: Animal[] | undefined) => (list ?? []).filter((a) => a.id !== id).slice(0, MAX_CARDS);
    const load = async () => {
      try {
        // 현재 동물이 목록에 포함될 수 있으므로 하나 더 받아 둔다
        const sameShelter = await animalApi.getAll({ shelterId, status: "PROTECTED", sizeParam: MAX_CARDS + 1 });
        if (cancelled) return;
        const fromShelter = others(sameShelter?.content);
        if (fromShelter.length > 0) {
          setResult({ source: "shelter", animals: fromShelter });
          return;
        }
        // 마감일이 지났지만 아직 정리되지 않은 동물이 마감 임박순 맨 앞에 올 수 있으므로 넉넉히 받아 거른다
        const sameSpecies = await animalApi.getAll({ species, status: "PROTECTED", sizeParam: 12 });
        if (cancelled) return;
        const open = (sameSpecies?.content ?? []).filter((a) => a.daysUntilExpiry == null || a.daysUntilExpiry >= 0);
        setResult({ source: "species", animals: others(open) });
      } catch {
        // 추가 목록은 부가 정보이므로 실패하면 영역을 숨긴다
        if (!cancelled) setResult(null);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [id, shelterId, species]);

  if (!result || result.animals.length === 0) return null;

  const fromShelter = result.source === "shelter";

  return (
    <section aria-labelledby="more-animals" className="mt-20 border-t border-ink/15 pt-12 md:mt-28 md:pt-16">
      <Reveal className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="dn-eyebrow">{fromShelter ? "Same shelter" : "Waiting now"}</p>
          <h2 id="more-animals" className="mt-3 font-display text-3xl leading-tight text-ink md:text-4xl">
            {fromShelter ? "같은 보호소의 다른 아이들" : `공고 기간이 짧게 남은 다른 ${speciesLabels[species] ?? "아이"}들`}
          </h2>
          {fromShelter && (
            <p className="mt-2 text-sm text-ink-soft">한 번의 방문이나 전화로 함께 문의할 수 있어요.</p>
          )}
        </div>
        <Link
          to={fromShelter ? `/shelters/${shelterId}` : `/animals?species=${species}`}
          className="group inline-flex items-center gap-1.5 text-sm font-semibold text-terracotta underline-offset-4 hover:underline"
        >
          모두 보기
          <span aria-hidden className="transition group-hover:translate-x-0.5">
            →
          </span>
        </Link>
      </Reveal>
      <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-9 md:mt-10 md:grid-cols-4 md:gap-x-6">
        {result.animals.map((a, i) => (
          <AnimalCard
            key={a.id}
            animal={a}
            index={i}
            fromList={false}
          />
        ))}
      </div>
    </section>
  );
}
