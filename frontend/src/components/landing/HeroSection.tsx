import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import AnimatedSection from "@/components/motion/AnimatedSection";
import AnimatedText from "@/components/motion/AnimatedText";

export default function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);

  // Hero 섹션을 벗어날 때 자연스럽게 투명해지는 패럴랙스 효과
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "center start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);

  return (
    <section
      ref={containerRef}
      className="relative w-full h-screen flex flex-col justify-center items-center bg-black overflow-hidden"
    >
      <motion.div
        style={{
          y: useTransform(scrollYProgress, [0, 1], ["0%", "20%"]),
          opacity,
        }}
        className="absolute inset-0 z-0"
      >
        <img
          src="/hero-one.webp"
          alt="희망의 번식장 구출 - 유기동물"
          className="object-cover w-full h-full opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black" />
      </motion.div>

      <motion.div
        style={{ opacity, y }}
        className="flex flex-col items-center justify-center text-center px-4 z-10"
      >
        <AnimatedSection animation="fadeUp" delay={0.2}>
          <p className="text-gray-300 text-lg md:text-xl font-medium mb-4 tracking-wide drop-shadow-md">
            유기동물 입양 의향
          </p>
        </AnimatedSection>

        <AnimatedSection animation="scale" delay={0.4}>
          <h1 
            className="text-7xl md:text-9xl font-extrabold text-white tracking-tighter mb-6 relative"
            style={{ textShadow: "0 4px 20px rgba(0,0,0,0.8)" }}
          >
            <AnimatedText text="61.6" stagger={false} />
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 1 }}
              className="text-4xl md:text-6xl text-gray-400 absolute top-2 md:top-4 -right-8 md:-right-12 drop-shadow-md"
            >
              %
            </motion.span>
          </h1>
        </AnimatedSection>

        <AnimatedSection animation="fadeUp" delay={1.4}>
          <p className="text-gray-200 text-xl md:text-2xl font-semibold mt-4 drop-shadow-lg">
            국민 10명 중 6명은
            <br />
            따뜻한 마음속 희망을 품고 있습니다.
          </p>
        </AnimatedSection>
      </motion.div>

      {/* Scroll Down Indicator */}
      <motion.div
        className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.5, duration: 1 }}
      >
        <span className="text-sm text-gray-300 mb-2 uppercase tracking-widest font-semibold drop-shadow">
          Scroll
        </span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          className="w-[1px] h-12 bg-gray-400"
        />
      </motion.div>
    </section>
  );
}
