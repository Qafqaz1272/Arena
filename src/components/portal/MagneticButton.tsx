import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';

interface MagneticButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  children: React.ReactNode;
}

export const MagneticButton: React.FC<MagneticButtonProps> = ({
  variant = 'primary',
  className = '',
  children,
  onClick,
  type = 'button',
  ...rest
}) => {
  const ref = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springX = useSpring(x, { stiffness: 280, damping: 18, mass: 0.4 });
  const springY = useSpring(y, { stiffness: 280, damping: 18, mass: 0.4 });

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const relX = e.clientX - (rect.left + rect.width / 2);
    const relY = e.clientY - (rect.top + rect.height / 2);
    x.set(relX * 0.16);
    y.set(relY * 0.16);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const variantStyles =
    variant === 'primary'
      ? 'bg-[#00F58C] text-[#05110C] hover:bg-[#19ff9d] shadow-[0_0_28px_rgba(0,245,140,0.32)] hover:shadow-[0_0_38px_rgba(0,245,140,0.5)] font-semibold'
      : variant === 'secondary'
      ? 'bg-white/10 dark:bg-white/10 text-white border border-white/25 hover:bg-white/20 backdrop-blur-md font-medium'
      : 'bg-slate-900/5 dark:bg-white/5 text-slate-900 dark:text-slate-100 border border-slate-300/70 dark:border-white/15 hover:border-[#00F58C]/60 font-medium';

  return (
    <motion.button
      ref={ref}
      type={type}
      style={{ x: springX, y: springY }}
      whileTap={{ scale: 0.97 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm tracking-wide transition-colors whitespace-nowrap shrink-0 cursor-pointer ${variantStyles} ${className}`}
      {...(rest as Record<string, unknown>)}
    >
      {children}
    </motion.button>
  );
};
