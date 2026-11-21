import React, { useState } from 'react';

interface ClubLogoProps {
  logoUrl?: string;
  shortCode: string;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

const SIZE_CLASSES: Record<NonNullable<ClubLogoProps['size']>, string> = {
  xs: 'h-5 w-5 text-[9px]',
  sm: 'h-7 w-7 text-[10px]',
  md: 'h-9 w-9 text-xs',
  lg: 'h-11 w-11 text-sm',
  xl: 'h-14 w-14 text-base',
};

export const ClubLogo: React.FC<ClubLogoProps> = ({
  logoUrl,
  shortCode,
  name,
  size = 'sm',
}) => {
  const [imgFailed, setImgFailed] = useState(false);
  const dim = SIZE_CLASSES[size];

  if (logoUrl && !imgFailed) {
    return (
      <span
        className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-white dark:bg-[#171F2B] p-1 border border-[#DCE2EA] dark:border-[#1E2733] ${dim}`}
      >
        <img
          src={logoUrl}
          alt={`${name} emblemi`}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setImgFailed(true)}
          className="h-full w-full object-contain"
        />
      </span>
    );
  }

  const initials = (shortCode || name || 'FC').replace(/[^A-Za-z0-9ƏÖÜĞŞÇİı]/g, '').slice(0, 3).toUpperCase();

  return (
    <span
      aria-label={`${name} emblemi`}
      className={`inline-flex shrink-0 items-center justify-center rounded-full border border-[#CBD5E1] dark:border-[#263140] bg-[#EEF1F5] dark:bg-[#171F2B] font-display font-bold tracking-wider text-[#1E293B] dark:text-[#E2E8F0] ${dim}`}
    >
      {initials}
    </span>
  );
};
