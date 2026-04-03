'use client';

import { useState } from 'react';
import Image from 'next/image';

interface SpentumLogoProps {
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
  priority?: boolean;
}

export function SpentumLogo({ width = 200, height = 200, className, style, priority }: SpentumLogoProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span
        className={className}
        style={{
          display: 'flex',
          alignItems: 'center',
          fontFamily: "'DM Sans', system-ui, sans-serif",
          fontWeight: 800,
          fontSize: '1.4rem',
          color: '#0D9488',
          letterSpacing: '-0.03em',
          ...style,
        }}
      >
        Spentum
      </span>
    );
  }

  return (
    <Image
      src="/spentum.png"
      alt="Spentum"
      width={width}
      height={height}
      className={className}
      style={style}
      priority={priority}
      onError={() => setFailed(true)}
    />
  );
}
