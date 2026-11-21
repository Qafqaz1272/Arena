import React from 'react';
import { AnimatePresence, motion } from 'motion/react';

interface FlipScoreDigitProps {
  value: number | null;
  flash?: boolean;
  className?: string;
}

export const FlipScoreDigit: React.FC<FlipScoreDigitProps> = ({
  value,
  flash = false,
  className = '',
}) => {
  const display = value === null ? '–' : String(value);

  return (
    <span
      className={`relative inline-flex items-center justify-center overflow-hidden tabular-nums font-score ${className}`}
      style={{ perspective: 400 }}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={display}
          initial={{ rotateX: -90, opacity: 0, y: -6 }}
          animate={{ rotateX: 0, opacity: 1, y: 0 }}
          exit={{ rotateX: 90, opacity: 0, y: 6 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className={`inline-block ${
            flash ? 'text-[#D9880F] dark:text-[#F5A524]' : ''
          }`}
        >
          {display}
        </motion.span>
      </AnimatePresence>
    </span>
  );
};
