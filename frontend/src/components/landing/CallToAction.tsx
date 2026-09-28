import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Link } from "react-router-dom";

export default function CallToAction() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end end"],
  });

  const scale = useTransform(scrollYProgress, [0, 1], [0.8, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0, 0.5, 1]);

  return (
    <section
      ref={ref}
      className="w-full h-[80vh] bg-black text-white flex items-center justify-center relative overflow-hidden"
    >
      <motion.div
        style={{ scale, opacity }}
        className="flex flex-col items-center justify-center text-center px-4 z-10"
      >
        <h2 className="text-5xl md:text-7xl font-bold tracking-tight mb-8">
          <motion.span
            animate={{ color: ["#ef4444", "#03c75a", "#03c75a", "#ef4444"] }}
            transition={{
              duration: 10,
              repeat: Infinity,
              times: [0, 0.4, 0.8, 1],
              ease: "easeInOut",
            }}
          >
            숫자
          </motion.span>
          를 바꿀 시간,
          <br />
          지금 시작해 볼까요?
        </h2>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link
            to="/animals"
            className="px-10 py-5 bg-white text-black text-xl font-bold rounded-full hover:scale-105 transition-transform"
          >
            첫 인연 찾아보기
          </Link>
          <Link
            to="/support"
            className="px-10 py-5 bg-transparent border border-white text-white text-xl font-bold rounded-full hover:scale-105 hover:bg-white hover:text-black transition-all"
          >
            1%의 후원하기
          </Link>
        </div>
      </motion.div>

      {/* Background Gradient Ornaments */}
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-zinc-900 to-black pointer-events-none" />
    </section>
  );
}
