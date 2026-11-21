import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { HelpCircle } from 'lucide-react';

/**
 * Custom editorial probability bar with hairline 25/50/75% tick marks.
 * Uses flat pitch-green (#2BD576), amber (#F5A524), or neutral slate — zero gradients.
 */
interface TickProbabilityBarProps {
  value: number; // 0..95
  tone?: 'accent' | 'amber' | 'neutral' | 'danger';
  height?: 'sm' | 'md';
  animate?: boolean;
  className?: string;
}

export const TickProbabilityBar: React.FC<TickProbabilityBarProps> = ({
  value,
  tone = 'accent',
  height = 'sm',
  animate = true,
  className = '',
}) => {
  const clamped = Math.max(0, Math.min(95, value));
  const fillColor =
    tone === 'accent'
      ? 'bg-[#168A4A] dark:bg-[#2BD576]'
      : tone === 'amber'
      ? 'bg-[#D9880F] dark:bg-[#F5A524]'
      : tone === 'danger'
      ? 'bg-[#DC3B40] dark:bg-[#E5484D]'
      : 'bg-[#64748B] dark:bg-[#64748B]';

  const trackHeight = height === 'md' ? 'h-2' : 'h-1.5';

  return (
    <div
      className={`relative w-full overflow-hidden rounded-[2px] bg-[#E2E7EE] dark:bg-[#1E2733] ${trackHeight} ${className}`}
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      {animate ? (
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${clamped}%` }}
          transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          className={`h-full rounded-[2px] ${fillColor}`}
        />
      ) : (
        <div style={{ width: `${clamped}%` }} className={`h-full rounded-[2px] ${fillColor}`} />
      )}
      {/* Hairline quarter tick marks */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-0 bottom-0 left-1/4 w-px bg-[#F6F7F9]/70 dark:bg-[#0B0F14]/70"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-0 bottom-0 left-1/2 w-px bg-[#F6F7F9]/80 dark:bg-[#0B0F14]/80"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-0 bottom-0 left-3/4 w-px bg-[#F6F7F9]/70 dark:bg-[#0B0F14]/70"
      />
    </div>
  );
};

/**
 * Tiny SVG form sparkline + W/D/L markers (last 5 matches).
 * W = top (2), D = middle (9), L = bottom (16).
 */
interface FormSparklineProps {
  form: Array<'W' | 'D' | 'L'>;
  showLetters?: boolean;
  className?: string;
}

export const FormSparkline: React.FC<FormSparklineProps> = ({
  form,
  showLetters = false,
  className = '',
}) => {
  const seq: Array<'W' | 'D' | 'L'> =
    form.length > 0 ? form.slice(-5) : ['D', 'D', 'D', 'D', 'D'];

  const coords = seq.map((res, idx) => {
    const x = seq.length === 1 ? 26 : 4 + (idx / (seq.length - 1)) * 44;
    const y = res === 'W' ? 4 : res === 'D' ? 11 : 18;
    return { x, y, res };
  });

  const polyline = coords.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <svg
        viewBox="0 0 52 22"
        className="h-[22px] w-[52px] shrink-0 overflow-visible"
        aria-label={`Son ${seq.length} oyun forması: ${seq
          .map((r) => (r === 'W' ? 'Q' : r === 'D' ? 'H' : 'M'))
          .join('-')}`}
      >
        <line
          x1="2"
          y1="11"
          x2="50"
          y2="11"
          className="stroke-[#DCE2EA] dark:stroke-[#1E2733]"
          strokeWidth="1"
          strokeDasharray="2 2"
        />
        <polyline
          fill="none"
          points={polyline}
          className="stroke-[#64748B] dark:stroke-[#64748B]"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {coords.map((pt, i) => (
          <circle
            key={i}
            cx={pt.x}
            cy={pt.y}
            r="2.4"
            className={
              pt.res === 'W'
                ? 'fill-[#168A4A] dark:fill-[#2BD576]'
                : pt.res === 'D'
                ? 'fill-[#D9880F] dark:fill-[#F5A524]'
                : 'fill-[#64748B] dark:fill-[#475569]'
            }
          />
        ))}
      </svg>

      {showLetters && (
        <div className="flex items-center gap-1">
          {seq.map((r, i) => (
            <span
              key={i}
              title={r === 'W' ? 'Qələbə' : r === 'D' ? 'Heç-heçə' : 'Məğlubiyyət'}
              className={`inline-flex h-5 w-5 items-center justify-center rounded-[4px] font-mono text-[10px] font-semibold tabular-nums ${
                r === 'W'
                  ? 'bg-[#2BD576]/15 text-[#147A42] dark:text-[#2BD576] border border-[#2BD576]/30'
                  : r === 'D'
                  ? 'bg-[#F5A524]/15 text-[#A5620A] dark:text-[#F5A524] border border-[#F5A524]/30'
                  : 'bg-[#EEF1F5] dark:bg-[#1A222E] text-[#64748B] border border-[#DCE2EA] dark:border-[#1E2733]'
              }`}
            >
              {r === 'W' ? 'Q' : r === 'D' ? 'H' : 'M'}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Minimal architectural football pitch diagram (1px line work)
 * visualizing home vs away xG attacking pressure balance.
 */
interface MinimalPitchDiagramProps {
  homeShort: string;
  awayShort: string;
  homeXg: number;
  awayXg: number;
  className?: string;
}

export const MinimalPitchDiagram: React.FC<MinimalPitchDiagramProps> = ({
  homeShort,
  awayShort,
  homeXg,
  awayXg,
  className = '',
}) => {
  const total = Math.max(0.2, homeXg + awayXg);
  const homeShare = Math.max(18, Math.min(82, (homeXg / total) * 100));
  const dividerX = 12 + (homeShare / 100) * 296;

  return (
    <div
      className={`rounded-lg border border-[#DCE2EA] dark:border-[#1E2733] bg-[#F6F7F9] dark:bg-[#0B0F14] p-3 ${className}`}
    >
      <div className="mb-2 flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.12em] text-[#64748B] dark:text-[#8A97A8]">
        <span className="font-semibold text-[#111827] dark:text-[#F3F6FA]">
          {homeShort} · xG <span className="text-[#168A4A] dark:text-[#2BD576] tabular-nums">{homeXg.toFixed(2)}</span>
        </span>
        <span>Hücum Təzyiqi Balansı</span>
        <span className="font-semibold text-[#111827] dark:text-[#F3F6FA]">
          xG <span className="tabular-nums">{awayXg.toFixed(2)}</span> · {awayShort}
        </span>
      </div>

      <svg
        viewBox="0 0 320 96"
        className="w-full h-[84px]"
        role="img"
        aria-label={`${homeShort} xG ${homeXg.toFixed(2)}, ${awayShort} xG ${awayXg.toFixed(2)} meydança təzyiq xəritəsi`}
      >
        {/* Home territory subtle tint */}
        <rect
          x="12"
          y="8"
          width={Math.max(0, dividerX - 12)}
          height="80"
          className="fill-[#2BD576]/[0.09] dark:fill-[#2BD576]/[0.08]"
        />
        {/* Away territory subtle tint */}
        <rect
          x={dividerX}
          y="8"
          width={Math.max(0, 308 - dividerX)}
          height="80"
          className="fill-[#64748B]/[0.06] dark:fill-[#94A3B8]/[0.05]"
        />

        {/* Outer pitch perimeter */}
        <rect
          x="12"
          y="8"
          width="296"
          height="80"
          fill="none"
          className="stroke-[#CBD5E1] dark:stroke-[#263140]"
          strokeWidth="1"
        />
        {/* Halfway line & center circle */}
        <line
          x1="160"
          y1="8"
          x2="160"
          y2="88"
          className="stroke-[#CBD5E1] dark:stroke-[#263140]"
          strokeWidth="1"
        />
        <circle
          cx="160"
          cy="48"
          r="14"
          fill="none"
          className="stroke-[#CBD5E1] dark:stroke-[#263140]"
          strokeWidth="1"
        />
        <circle cx="160" cy="48" r="1.5" className="fill-[#94A3B8] dark:fill-[#475569]" />

        {/* Left penalty box */}
        <rect
          x="12"
          y="24"
          width="34"
          height="48"
          fill="none"
          className="stroke-[#CBD5E1] dark:stroke-[#263140]"
          strokeWidth="1"
        />
        <rect
          x="12"
          y="36"
          width="12"
          height="24"
          fill="none"
          className="stroke-[#CBD5E1] dark:stroke-[#263140]"
          strokeWidth="1"
        />

        {/* Right penalty box */}
        <rect
          x="274"
          y="24"
          width="34"
          height="48"
          fill="none"
          className="stroke-[#CBD5E1] dark:stroke-[#263140]"
          strokeWidth="1"
        />
        <rect
          x="296"
          y="36"
          width="12"
          height="24"
          fill="none"
          className="stroke-[#CBD5E1] dark:stroke-[#263140]"
          strokeWidth="1"
        />

        {/* Equilibrium line showing xG dominance shift */}
        <line
          x1={dividerX}
          y1="4"
          x2={dividerX}
          y2="92"
          className="stroke-[#168A4A] dark:stroke-[#2BD576]"
          strokeWidth="1.5"
        />
        <circle
          cx={dividerX}
          cy="48"
          r="3.5"
          className="fill-[#168A4A] dark:fill-[#2BD576]"
        />
      </svg>
    </div>
  );
};

/**
 * Restrained one-shot count-up number on mount (220ms ease-out).
 */
interface CountUpNumberProps {
  value: number;
  suffix?: string;
  decimals?: number;
  className?: string;
}

export const CountUpNumber: React.FC<CountUpNumberProps> = ({
  value,
  suffix = '',
  decimals = 0,
  className = '',
}) => {
  const [display, setDisplay] = useState<number>(value);
  const animatedOnceRef = useRef(false);

  useEffect(() => {
    if (value <= 0) {
      setDisplay(value);
      return;
    }
    if (animatedOnceRef.current) {
      setDisplay(value);
      return;
    }
    animatedOnceRef.current = true;
    const start = performance.now();
    const duration = 220;
    let raf = 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(value * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
      else setDisplay(value);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return (
    <span className={`tabular-nums ${className}`}>
      {decimals > 0 ? display.toFixed(decimals) : Math.round(display)}
      {suffix}
    </span>
  );
};

/**
 * Accessible keyboard & hover tooltip for sports analytics terms (xG, Etibarlılıq, Ədalətli əmsal).
 */
interface TermTooltipProps {
  term: string;
  explanation: string;
}

export const TermTooltip: React.FC<TermTooltipProps> = ({ term, explanation }) => {
  const [open, setOpen] = useState(false);

  return (
    <span className="relative inline-flex items-center">
      <button
        type="button"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((v) => !v)}
        aria-label={`${term} izahı`}
        className="inline-flex items-center gap-1 text-[#64748B] hover:text-[#111827] dark:text-[#8A97A8] dark:hover:text-[#F3F6FA] transition-colors cursor-pointer"
      >
        <span>{term}</span>
        <HelpCircle className="h-3 w-3" strokeWidth={1.5} />
      </button>
      {open && (
        <span
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-56 -translate-x-1/2 rounded-lg border border-[#DCE2EA] dark:border-[#1E2733] bg-white dark:bg-[#121821] px-2.5 py-2 text-[11px] font-normal normal-case tracking-normal leading-snug text-[#334155] dark:text-[#CBD5E1] shadow-md"
        >
          {explanation}
        </span>
      )}
    </span>
  );
};
