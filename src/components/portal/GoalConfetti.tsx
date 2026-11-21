import React, { useMemo } from 'react';
import { AnimatePresence, motion } from 'motion/react';

interface GoalConfettiProps {
  burstKey: number;
  label?: string;
}

const COLORS = ['#00F58C', '#FF5A1F', '#0EA5E9', '#FACC15', '#FFFFFF'];

export const GoalConfetti: React.FC<GoalConfettiProps> = ({ burstKey, label }) => {
  const particles = useMemo(
    () =>
      Array.from({ length: 28 }, (_, idx) => {
        const angle = (idx / 28) * Math.PI * 2 + (idx % 3) * 0.14;
        const distance = 90 + (idx % 5) * 44;
        return {
          id: idx,
          dx: Math.cos(angle) * distance,
          dy: Math.sin(angle) * distance - 55,
          rotate: (idx % 2 === 0 ? 1 : -1) * (180 + idx * 14),
          color: COLORS[idx % COLORS.length],
          size: idx % 3 === 0 ? 10 : 7,
        };
      }),
    []
  );

  return (
    <AnimatePresence>
      {burstKey > 0 && (
        <div
          key={burstKey}
          className="pointer-events-none fixed inset-0 z-[70] flex items-end justify-center pb-8 px-4 overflow-hidden"
          aria-live="polite"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 14 }}
            transition={{ duration: 0.3 }}
            className="relative flex items-center gap-3 rounded-xl border border-[#FF5A1F]/70 bg-[#070B14]/94 px-5 py-3 text-white shadow-[0_0_42px_rgba(255,90,31,0.5)] backdrop-blur-md"
          >
            <span className="h-2.5 w-2.5 rounded-full bg-[#FF5A1F] animate-ping" />
            <span className="font-display text-2xl font-extrabold tracking-wider text-[#FF5A1F]">
              QOOOL!
            </span>
            {label && <span className="text-sm font-medium text-slate-100">{label}</span>}

            <div className="absolute left-1/2 top-1/2">
              {particles.map((p) => (
                <motion.span
                  key={p.id}
                  initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 1 }}
                  animate={{
                    x: p.dx,
                    y: p.dy - 95,
                    opacity: 0,
                    rotate: p.rotate,
                    scale: 0.45,
                  }}
                  transition={{ duration: 1.15, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    backgroundColor: p.color,
                    width: p.size,
                    height: p.size * 0.65,
                  }}
                  className="absolute block rounded-[2px]"
                />
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
