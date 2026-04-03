'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

type Rect = { top: number; left: number; width: number; height: number };

interface Props {
  step: number; // 2..7
  onNext: () => void;
  onDone: () => void;
}

const PAD = 8;

export function TourSpotlight({ step, onNext, onDone }: Props) {
  const t = useTranslations('tour');
  const stepIdx = step - 2; // 0..5
  const [rect, setRect] = useState<Rect | null>(null);

  const STEPS: Array<{
    targetId: string | null;
    title: string;
    content: string;
    link?: string;
    linkLabel?: string;
  }> = [
    // ── 1. Adjust Balance — most important, shown first ──────────────────────
    { targetId: 'tour-adjust', title: t('step2Title'), content: t('step2Content') },
    // ── 2. Live stats ────────────────────────────────────────────────────────
    { targetId: 'tour-stats',  title: t('step1Title'), content: t('step1Content') },
    // ── 3. Budget limit ──────────────────────────────────────────────────────
    { targetId: 'tour-budget', title: t('step3Title'), content: t('step3Content') },
    // ── 4. Import CSV (info card) ─────────────────────────────────────────────
    { targetId: null, title: t('step5Title'), content: t('step5Content'), link: '/import',  linkLabel: t('goToImport')  },
    // ── 5. Reports (info card) ───────────────────────────────────────────────
    { targetId: null, title: t('step6Title'), content: t('step6Content'), link: '/reports', linkLabel: t('goToReports') },
    // ── 6. All set ───────────────────────────────────────────────────────────
    { targetId: null, title: t('step4Title'), content: t('step4Content') },
  ];

  const isLast  = stepIdx === STEPS.length - 1;
  const current = STEPS[stepIdx];

  const measure = useCallback(() => {
    if (!current?.targetId) { setRect(null); return; }
    const el = document.getElementById(current.targetId);
    if (!el) return;
    const r = el.getBoundingClientRect();
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, [current?.targetId]);

  useEffect(() => {
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [measure]);

  if (!current) return null;

  // Spotlight hole coords (with padding)
  const holeTop    = rect ? rect.top    - PAD : 0;
  const holeLeft   = rect ? rect.left   - PAD : 0;
  const holeWidth  = rect ? rect.width  + PAD * 2 : 0;
  const holeHeight = rect ? rect.height + PAD * 2 : 0;
  const holeRadius = 14;

  // Tooltip card: below the spotlight hole, or centred if no target
  const cardStyle: React.CSSProperties = rect
    ? {
        position: 'fixed',
        top: holeTop + holeHeight + 12,
        left: Math.max(12, Math.min(holeLeft, window.innerWidth - 300 - 12)),
        width: 280,
        zIndex: 110,
      }
    : {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 300,
        zIndex: 110,
      };

  const stepLabel = t('stepOf', { current: stepIdx + 1, total: STEPS.length });

  return (
    <>
      {/* SVG overlay with spotlight hole */}
      <svg
        className="fixed inset-0 z-[100] pointer-events-none"
        style={{ width: '100vw', height: '100vh' }}
      >
        <defs>
          <mask id="tour-mask">
            <rect width="100%" height="100%" fill="white" />
            {rect && (
              <rect
                x={holeLeft}
                y={holeTop}
                width={holeWidth}
                height={holeHeight}
                rx={holeRadius}
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(5, 9, 17, 0.72)"
          mask="url(#tour-mask)"
        />
        {/* Glow ring around the hole */}
        {rect && (
          <rect
            x={holeLeft - 1}
            y={holeTop - 1}
            width={holeWidth + 2}
            height={holeHeight + 2}
            rx={holeRadius + 1}
            fill="none"
            stroke="#6366f1"
            strokeWidth="2"
            opacity="0.8"
          />
        )}
      </svg>

      {/* Tooltip card */}
      <div style={cardStyle} className="pointer-events-auto">
        {/* Arrow up toward spotlight */}
        {rect && (
          <div className="ml-4 mb-[-1px] w-0 h-0
            border-l-[7px] border-r-[7px] border-b-[8px]
            border-l-transparent border-r-transparent border-b-[#042F2E]" />
        )}
        <div className="rounded-2xl bg-[#042F2E] border border-white/10 shadow-2xl p-4 flex flex-col gap-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">{stepLabel}</span>
            <button
              onClick={onDone}
              className="text-white/30 hover:text-white/60 transition-colors text-xs"
            >
              {t('skip')}
            </button>
          </div>

          {/* Content */}
          <div>
            <p className="text-sm font-bold text-white mb-1">{current.title}</p>
            <p className="text-xs text-white/55 leading-relaxed">{current.content}</p>
          </div>

          {/* CTA */}
          {isLast ? (
            <div className="flex gap-2">
              <button
                onClick={onDone}
                className="flex-1 h-8 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
              >
                {t('done')}
              </button>
              <Link
                href="/settings"
                onClick={onDone}
                className="flex-1 h-8 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium transition-colors flex items-center justify-center"
              >
                {t('goToSettings')}
              </Link>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={onNext}
                className="flex-1 h-8 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
              >
                {t('next')}
              </button>
              {current.link && current.linkLabel && (
                <Link
                  href={current.link}
                  onClick={onDone}
                  className="flex-1 h-8 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium transition-colors flex items-center justify-center"
                >
                  {current.linkLabel}
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
