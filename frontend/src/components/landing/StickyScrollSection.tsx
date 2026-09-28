import { motion } from "framer-motion";
import { Link } from "react-router-dom";

// 공통 whileInView 프리셋
const fadeUp = {
  initial: { opacity: 0, y: 60 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 } as const, // 한 번만 실행되도록 변경 및 트리거 시점 조정
  transition: { duration: 0.8, ease: "easeOut" as const },
};

const fadeUpDelay = (delay: number) => ({
  ...fadeUp,
  transition: { ...fadeUp.transition, delay },
});

const scaleIn = {
  initial: { opacity: 0, scale: 0.85 },
  whileInView: { opacity: 1, scale: 1 },
  viewport: { once: true, amount: 0.2 } as const, // 한 번만 실행되도록 변경
  transition: { duration: 1.0, ease: "easeOut" as const },
};

export default function StickyScrollSection() {
  return (
    <section className="w-full">
      {/* ─── Beat 1: 하지만 현실은... (다크 + 풀너비 이미지 배경 + 오버레이 텍스트) ─── */}
      <div className="relative w-full min-h-[80vh] md:min-h-screen flex items-center overflow-hidden">
        {/* 풀너비 배경 이미지 */}
        <img
          src="/hero-three-left-behind.webp"
          alt="도움이 필요한 유기동물들"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* 어두운 오버레이 */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />

        {/* 텍스트 */}
        <motion.div
          {...fadeUp}
          className="relative z-10 max-w-6xl mx-auto px-10 md:px-20 flex flex-col gap-6 md:max-w-[50%] md:ml-[12%]"
        >
          <p className="text-lg md:text-xl font-medium text-gray-300 tracking-wide">
            하지만 현실은
          </p>
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight text-white">
            집으로 돌아가지 못한
            <br />또 다른 <span className="text-red-500">62%</span>
          </h2>
          <p className="text-lg text-gray-200 leading-relaxed max-w-lg">
            2024년 구조된 10만 마리 중, 절반에 가까운 46%가 자연사 혹은
            안락사되었습니다. "좋은 마음"이 행동으로 이어지지 못하면 숫자는
            비극으로 남습니다.
          </p>
        </motion.div>
      </div>

      {/* ─── Beat 2: 통계 강조 (다크 + 우 이미지/숫자, 좌 텍스트) ─── */}
      <div className="bg-[#111] text-white py-24 md:py-32 overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
          {/* 좌: 텍스트 (모바일에서는 두 번째) */}
          <motion.div
            {...fadeUp}
            className="flex flex-col gap-6 md:order-1 order-2"
          >
            <p className="text-lg md:text-xl font-medium text-gray-400 tracking-wide">
              숫자로 보는 현실
            </p>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">
              구조되어도
              <br />
              <span className="text-red-400">절반은</span> 돌아가지 못합니다
            </h2>
            <p className="text-lg text-gray-300 leading-relaxed max-w-lg">
              매년 10만 마리 이상의 유기동물이 보호소에 들어옵니다. 이 중
              입양으로 새로운 시작을 맞이하는 비율은 채 30%가 되지 않습니다.
              나머지는 보호소에서 생을 마감하게 됩니다.
            </p>
          </motion.div>

          {/* 우: 숫자 강조 카드 (모바일에서는 첫 번째) */}
          <motion.div {...scaleIn} className="md:order-2 order-1">
            <div className="bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-3xl p-10 md:p-14 shadow-2xl border border-zinc-700/50">
              <div className="space-y-8">
                <div>
                  <motion.span
                    {...fadeUpDelay(0.2)}
                    className="text-6xl md:text-8xl font-extrabold text-white block"
                  >
                    46%
                  </motion.span>
                  <p className="text-gray-400 text-lg mt-2">
                    자연사 또는 안락사
                  </p>
                </div>
                <div className="h-px bg-zinc-700" />
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <motion.span
                      {...fadeUpDelay(0.4)}
                      className="text-3xl md:text-4xl font-bold text-white block"
                    >
                      10만+
                    </motion.span>
                    <p className="text-gray-400 text-sm mt-1">연간 구조 수</p>
                  </div>
                  <div>
                    <motion.span
                      {...fadeUpDelay(0.6)}
                      className="text-3xl md:text-4xl font-bold text-red-400 block"
                    >
                      27%
                    </motion.span>
                    <p className="text-gray-400 text-sm mt-1">입양률</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ─── Beat 3: 가장 확실한 방법 (다크 배경 + 이미지 확장) ─── */}
      <div className="bg-[#0a0a0a] text-white py-24 md:py-32 overflow-hidden">
        <div className="max-w-6xl mx-auto px-6">
          {/* 상단: 제목/설명 (중앙) */}
          <motion.div
            {...fadeUp}
            className="text-center mb-16 max-w-3xl mx-auto"
          >
            <p className="text-lg md:text-xl font-medium text-gray-400 mb-4 tracking-wide">
              그래서 우리가 시작했습니다
            </p>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight mb-6">
              그 숫자를 가장 확실하게
              <br />
              바꿀 수 있는 방법
            </h2>
            <p className="text-xl text-gray-400 leading-relaxed">
              마음속 62%를 지금 행동으로 옮겨주세요.
              <br />
              이제 그 안타까운{" "}
              <span className="text-white font-semibold">
                "숫자를 바꿀 시간"
              </span>
              입니다.
            </p>
          </motion.div>
        </div>

        {/* 하단: 이미지 확장 연출 (좁음 → 진짜 풀너비) + CTA 버튼을 이미지 위에 오버레이 */}
        <div className="relative overflow-hidden">
          <motion.div
            initial={{ scale: 0.9, borderRadius: "1.5rem" }}
            whileInView={{ scale: 1, borderRadius: "0rem" }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="mx-auto overflow-hidden shadow-2xl will-change-transform" // will-change-transform 추가 및 width 대신 scale 사용
          >
            <img
              src="/hero-two-hope-hearts.webp"
              alt="새로운 가족을 만나는 동물들"
              className="w-full h-auto object-cover aspect-[16/9]"
            />
            {/* 이미지 하단 그라데이션 (버튼 가독성용) */}
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
          </motion.div>

          {/* CTA 버튼 (이미지 하단 위에 겹침) */}
          <motion.div
            {...fadeUpDelay(0.3)}
            className="absolute bottom-8 md:bottom-12 left-0 right-0 flex flex-wrap gap-4 justify-center z-10"
          >
            <Link
              to="/animals"
              className="px-8 py-4 bg-white text-black font-bold rounded-full hover:bg-gray-100 transition-colors shadow-xl"
            >
              가족을 기다리는 아이들
            </Link>
            <Link
              to="/support"
              className="px-8 py-4 bg-white/20 backdrop-blur-sm text-white font-bold rounded-full hover:bg-white/30 transition-colors border border-white/40"
            >
              후원 및 봉사
            </Link>
          </motion.div>
        </div>
      </div>

      {/* ─── Beat 4: 이 아이를 만나주세요 (다크 + 강아지 집중 + 감성 텍스트) ─── */}
      <div className="bg-[#0a0a0a] text-white py-24 md:py-40 overflow-hidden">
        <div className="max-w-4xl mx-auto px-6 flex flex-col items-center">
          {/* 강아지 위 감동 문구 */}
          <motion.p
            {...fadeUp}
            className="text-xl md:text-2xl text-gray-300 font-medium tracking-wide mb-12 text-center leading-relaxed"
          >
            그들은 사랑받기 위해 태어난 존재라는 걸,
            <br />
            <span className="text-[#03c75a]">알고 계셨나요?</span>
          </motion.p>

          {/* 강아지 이미지 + 글로우 */}
          <motion.div {...scaleIn} className="relative mb-12 will-change-transform"> 
            {/* 배경 글로우 - 하드웨어 가속 추가 */}
            <div className="absolute inset-0 blur-3xl opacity-20 bg-zinc-700 rounded-full scale-150 will-change-[filter,transform]" />
            <div className="relative w-[80vw] md:w-[50vw] max-w-[550px]">
              <img
                src="/images/puppy.webp"
                alt="당신을 기다리는 강아지"
                className="w-full h-auto object-contain drop-shadow-2xl relative z-10"
              />
            </div>
          </motion.div>

          {/* 감성 텍스트 */}
          <motion.div {...fadeUp} className="text-center max-w-2xl">
            <h3 className="text-3xl md:text-5xl font-bold tracking-tight leading-tight mb-6">
              이 눈을 마주칠 수 있다면,
              <br />
              당신은 이미 <span className="text-[#03c75a]">준비된 사람</span>
              입니다.
            </h3>
            <p className="text-lg md:text-xl text-gray-400 leading-relaxed">
              매일 보호소에서 가족을 기다리는 아이들이 있습니다.
              <br />
              작은 관심 하나가 한 생명의 운명을 바꿉니다.
            </p>
          </motion.div>
        </div>
      </div>

      {/* ─── Beat 5: 숫자를 바꿀 시간 (풀 CTA) ─── */}
      <div className="bg-gradient-to-b from-[#0a0a0a] to-zinc-900 text-white py-24 md:py-32 overflow-hidden">
        <motion.div {...fadeUp} className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-7xl font-bold tracking-tight mb-8 leading-tight">
            이제 그 안타까운 숫자를,
            <br />
            <span className="text-[#03c75a]">바꿀 시간</span>입니다.
          </h2>
          <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            입양, 임시보호, 후원, 봉사.
            <br />
            어떤 방법이든 하나의 행동이 하나의 기적을 만듭니다.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              to="/animals"
              className="px-10 py-5 bg-white text-black text-xl font-bold rounded-full hover:scale-105 transition-transform shadow-xl"
            >
              첫 인연 찾아보기
            </Link>
            <Link
              to="/guide/adoption"
              className="px-10 py-5 bg-transparent border border-white text-white text-xl font-bold rounded-full hover:scale-105 hover:bg-white hover:text-black transition-all"
            >
              입양 절차 알아보기
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
