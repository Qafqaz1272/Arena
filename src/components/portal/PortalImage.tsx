import React, { useState } from 'react';
import { PORTAL_ASSETS, type PortalAssetKey } from './portalAssets';

interface PortalImageProps {
  assetKey: PortalAssetKey;
  alt: string;
  className?: string;
  priority?: boolean;
}

export const PortalImage: React.FC<PortalImageProps> = ({
  assetKey,
  alt,
  className = '',
  priority = false,
}) => {
  const [failed, setFailed] = useState(false);
  const src = PORTAL_ASSETS[assetKey];

  if (failed || !src) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex items-center justify-center bg-gradient-to-br from-[#0B172A] via-[#0F2744] to-[#063829] text-xs font-medium text-emerald-300/80 ${className}`}
      >
        <span>ARENA AZ</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
};
