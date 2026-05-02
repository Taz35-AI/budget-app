'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { AVAILABLE_TAG_ICONS, getIconUrlFromSlug } from '@/lib/tagIcons';

interface Props {
  /** Currently selected slug, or undefined for "no icon" */
  value?: string;
  onChange: (slug: string | undefined) => void;
  /** Number of grid columns; defaults to 8 on mobile, 10 desktop via responsive class */
  className?: string;
}

/**
 * Searchable grid picker over the 59 PNGs in /public/tag-icons/.
 * First tile is a clear-selection button; remaining tiles are filtered icons.
 */
export function TagIconPicker({ value, onChange, className }: Props) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return AVAILABLE_TAG_ICONS;
    return AVAILABLE_TAG_ICONS.filter((slug) => slug.replace(/-/g, ' ').includes(q));
  }, [search]);

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <input
        type="text"
        placeholder="Search icons…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="h-8 px-2.5 rounded-lg bg-white/70 dark:bg-white/[0.04] border border-brand-primary/[0.08] dark:border-white/[0.08] text-xs text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 outline-none focus:border-indigo-400"
      />
      <div className="grid grid-cols-8 sm:grid-cols-10 gap-1 max-h-[180px] overflow-y-auto p-1 rounded-lg bg-slate-50/50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.06]">
        <button
          type="button"
          onClick={() => onChange(undefined)}
          title="No icon"
          className={cn(
            'aspect-square rounded-md flex items-center justify-center text-[14px] font-bold transition-all',
            !value
              ? 'bg-indigo-500 text-white ring-2 ring-indigo-300'
              : 'bg-white dark:bg-white/5 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10',
          )}
        >
          ✕
        </button>
        {filtered.map((slug) => {
          const url = getIconUrlFromSlug(slug);
          if (!url) return null;
          return (
            <button
              key={slug}
              type="button"
              onClick={() => onChange(slug)}
              title={slug.replace(/-/g, ' ')}
              className={cn(
                'aspect-square rounded-md flex items-center justify-center p-0.5 transition-all',
                value === slug
                  ? 'bg-indigo-500/15 ring-2 ring-indigo-400'
                  : 'bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10',
              )}
            >
              <Image src={url} alt={slug} width={28} height={28} className="object-contain" unoptimized />
            </button>
          );
        })}
        {filtered.length === 0 && (
          <p className="col-span-full text-center text-xs text-slate-400 dark:text-white/30 italic py-3">
            No icons match
          </p>
        )}
      </div>
    </div>
  );
}
