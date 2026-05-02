'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';
import { resolveTagIcon } from '@/lib/tagIcons';

interface Props {
  /** Tag label — used to derive the icon when no explicit slug is given */
  label: string;
  /** Optional explicit slug (custom tags / overrides) */
  iconSlug?: string;
  /** Color used for the fallback circle when no icon resolves */
  color: string;
  /** Pixel size — applied to both width and height */
  size?: number;
  className?: string;
}

/**
 * Renders the tag's PNG icon if available, otherwise a colored circle with the
 * label's first letter. Always self-contained — drop it anywhere a tag chip lives.
 */
export function TagIcon({ label, iconSlug, color, size = 24, className }: Props) {
  const url = resolveTagIcon(label, iconSlug);

  if (url) {
    return (
      <Image
        src={url}
        alt={label}
        width={size}
        height={size}
        className={cn('flex-shrink-0 object-contain rounded-md', className)}
        unoptimized
      />
    );
  }

  const initial = label.charAt(0).toUpperCase();
  return (
    <span
      className={cn(
        'flex-shrink-0 inline-flex items-center justify-center rounded-full font-bold text-white',
        className,
      )}
      style={{ backgroundColor: color, width: size, height: size, fontSize: Math.max(10, size * 0.45) }}
      aria-hidden
    >
      {initial}
    </span>
  );
}
