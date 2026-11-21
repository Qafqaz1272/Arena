import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';

interface CustomFootballCursorProps {
  enabled: boolean;
}

export const CustomFootballCursor: React.FC<CustomFootballCursorProps> = ({ enabled }) => {
  const [visible, setVisible] = useState(false);
  const [hoveringAction, setHoveringAction] = useState(false);

  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);
  const smoothX = useSpring(mouseX, { stiffness: 520, damping: 32, mass: 0.25 });
  const smoothY = useSpring(mouseY, { stiffness: 520, damping: 32, mass: 0.25 });

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;
    const finePointer = window.matchMedia('(pointer: fine)').matches;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!finePointer || reducedMotion) return;

    const onMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      setVisible(true);

      const target = e.target as HTMLElement | null;
      const interactive = Boolean(target?.closest('button, a, input, select, [role="tab"]'));
      setHoveringAction(interactive);
    };

    const onLeave = () => setVisible(false);

    window.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('mouseleave', onLeave);
    return () => {
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
    };
  }, [enabled, mouseX, mouseY]);

  if (!enabled || !visible) return null;

  return (
    <motion.div
      aria-hidden="true"
      style={{ x: smoothX, y: smoothY }}
      className="pointer-events-none fixed left-0 top-0 z-[90] -translate-x-1/2 -translate-y-1/2 hidden md:flex items-center justify-center"
    >
      <motion.div
        animate={{
          scale: hoveringAction ? 1.38 : 1,
          borderColor: hoveringAction ? 'rgba(0, 245, 140, 0.9)' : 'rgba(14, 165, 233, 0.55)',
        }}
        transition={{ duration: 0.16 }}
        className="flex h-8 w-8 items-center justify-center rounded-full border bg-[#070B14]/30 backdrop-blur-[1px]"
      >
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-[#00F58C]" fill="none">
          <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="1.8" />
          <polygon
            points="12,7 15.8,9.8 14.3,14.2 9.7,14.2 8.2,9.8"
            fill="currentColor"
            opacity="0.9"
          />
        </svg>
      </motion.div>
    </motion.div>
  );
};
