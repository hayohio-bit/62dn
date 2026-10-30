import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";
import Reveal from "@/components/motion/Reveal";
import { faqs } from "@/constants/landingContent";

/** 자주 묻는 질문 (한 번에 하나씩 펼치는 아코디언) */
export default function FAQSection() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="mx-auto grid max-w-[76rem] scroll-mt-24 gap-12 px-6 pb-24 md:grid-cols-12 md:pb-32">
      <Reveal className="md:col-span-4">
        <p className="dn-eyebrow">FAQ</p>
        <h2 className="mt-4 font-display text-4xl leading-tight md:text-5xl">
          자주 묻는
          <br />
          질문
        </h2>
      </Reveal>

      <div className="border-t border-ink/15 md:col-span-8">
        {faqs.map((f, i) => {
          const isOpen = open === i;
          return (
            <div key={f.q} className="border-b border-ink/15">
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-6 py-6 text-left"
              >
                <span className={clsx("font-display text-xl transition-colors md:text-2xl", isOpen && "text-terracotta")}>
                  {f.q}
                </span>
                <span
                  aria-hidden
                  className={clsx(
                    "grid h-9 w-9 shrink-0 place-items-center rounded-full border border-ink/20 text-lg transition-transform duration-300",
                    isOpen && "rotate-45 border-terracotta bg-terracotta text-white",
                  )}
                >
                  +
                </span>
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
                    className="overflow-hidden"
                  >
                    <p className="max-w-2xl pb-7 leading-relaxed text-ink-soft">{f.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
}
