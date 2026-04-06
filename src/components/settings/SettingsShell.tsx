'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useSettings } from '@/hooks/useSettings';
import { useHaptics } from '@/hooks/useHaptics';
import { useCallback } from 'react';
import {
  requestNotificationPermission,
  checkNotificationPermission,
} from '@/lib/notificationScheduler';
import type { NotifPermission } from '@/lib/notificationScheduler';
import { useAccounts, useCreateAccount, useUpdateAccount, useDeleteAccount } from '@/hooks/useAccounts';
import { useHouseholdMembers, useHouseholdInvites, useCreateInvite, useRevokeInvite, useRemoveMember } from '@/hooks/useHousehold';
import { memberColor, groupAccountsByOwner, memberShortName } from '@/lib/memberUtils';
import { createClient } from '@/lib/supabase/client';
import { useSettingsStore } from '@/store/settingsStore';
import { AppLayout } from '@/components/layout/AppLayout';
import { NavMenuButton, MobileLogo } from '@/components/layout/NavSidebar';
import { LogoutButton } from '@/components/dashboard/LogoutButton';
import { ResetAllButton } from '@/components/dashboard/ResetAllButton';
import { UserBadge } from '@/components/layout/UserBadge';
import { TAGS, FREQUENCIES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { Frequency, CustomTag, RecurringTemplate, TagCategory, AccountType } from '@/types';
import type { CreateAccountPayload, UpdateAccountPayload } from '@/hooks/useAccounts';

// ─── Preset colour palette ────────────────────────────────────────────────────

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
  '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#3b82f6',
  '#6366f1', '#8b5cf6', '#a855f7', '#ec4899', '#f43f5e',
  '#64748b', '#78716c', '#0ea5e9', '#d97706', '#7c3aed',
];

// ─── Shared card wrapper ──────────────────────────────────────────────────────

function SettingsCard({ title, subtitle, accent, children }: {
  title: string;
  subtitle?: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl overflow-hidden bg-brand-card dark:bg-[#042F2E] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_1px_6px_rgba(25,27,47,0.05)]">
      <div className={cn('h-[3px] w-full', accent)} />
      <div className="px-6 pt-5 pb-3">
        <h2 className="text-base font-extrabold text-brand-text dark:text-white tracking-tight">{title}</h2>
        {subtitle && <p className="text-xs text-slate-400 dark:text-white/35 mt-0.5">{subtitle}</p>}
      </div>
      <div className="px-6 pb-6">{children}</div>
    </div>
  );
}

// ─── Colour picker grid ───────────────────────────────────────────────────────

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {PRESET_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className="w-7 h-7 rounded-full flex items-center justify-center transition-transform hover:scale-110 active:scale-[0.85] ring-2 ring-offset-2 ring-offset-white dark:ring-offset-[#0d1629]"
          style={{ backgroundColor: c, ['--tw-ring-color']: value === c ? c : 'transparent' } as React.CSSProperties}
        >
          {value === c && (
            <svg className="w-3.5 h-3.5 text-white drop-shadow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
      ))}
    </div>
  );
}

// ─── Trash icon ───────────────────────────────────────────────────────────────

function TrashBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-500 dark:hover:text-red-400 active:scale-[0.96] transition-all duration-100 opacity-0 group-hover:opacity-100 flex-shrink-0"
    >
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    </button>
  );
}

function AddRowBtn({ label, accentHover, onClick }: { label: string; accentHover: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 w-full h-10 px-3 rounded-2xl border border-dashed border-slate-200 dark:border-white/10 text-sm text-slate-500 dark:text-white/40 active:scale-[0.96] transition-all duration-100',
        accentHover,
      )}
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
      {label}
    </button>
  );
}

// ─── Tags section ─────────────────────────────────────────────────────────────

function TagsSection() {
  const t = useTranslations('settings');
  const tc = useTranslations('common');
  const tTags = useTranslations('tags');

  const {
    customTags,
    hiddenBuiltinTags,
    addCustomTag,
    updateCustomTag,
    deleteCustomTag,
    overrideBuiltinTag,
    hideBuiltinTag,
    unhideBuiltinTag,
  } = useSettings();

  const [showAdd, setShowAdd] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newColor, setNewColor] = useState(PRESET_COLORS[9]);
  const [newCategory, setNewCategory] = useState<TagCategory>('expense');
  // editId is either a built-in key (e.g. 'food') or a custom tag UUID
  const [editId, setEditId] = useState<string | null>(null);
  const [editIsBuiltin, setEditIsBuiltin] = useState(false);
  const [editLabel, setEditLabel] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editCategory, setEditCategory] = useState<TagCategory>('expense');

  const handleAdd = () => {
    if (!newLabel.trim()) return;
    addCustomTag({ label: newLabel.trim(), color: newColor, category: newCategory });
    setNewLabel('');
    setNewColor(PRESET_COLORS[9]);
    setNewCategory('expense');
    setShowAdd(false);
  };

  const startEdit = (id: string, label: string, color: string, category: TagCategory, isBuiltin: boolean) => {
    setEditId(id);
    setEditIsBuiltin(isBuiltin);
    setEditLabel(label);
    setEditColor(color);
    setEditCategory(category);
  };

  const saveEdit = () => {
    if (!editId || !editLabel.trim()) return;
    if (editIsBuiltin) {
      overrideBuiltinTag(editId, { label: editLabel.trim(), color: editColor });
    } else {
      updateCustomTag(editId, { label: editLabel.trim(), color: editColor, category: editCategory });
    }
    setEditId(null);
  };

  // Built-in tags enriched with any user overrides
  const builtinEntries = Object.entries(TAGS).map(([key, defaults]) => {
    const override = customTags.find((t) => t.id === key);
    return {
      key,
      label: override?.label ?? (TAGS[key] ? tTags(key as never) : defaults.label),
      color: override?.color ?? defaults.color,
      isOverridden: !!override,
      isHidden: hiddenBuiltinTags.includes(key),
      category: defaults.category as TagCategory,
    };
  });

  const pureCustomTags = customTags.filter((t) => !TAGS[t.id]);
  const activeBuiltins = builtinEntries.filter((t) => !t.isHidden);
  const hiddenBuiltins = builtinEntries.filter((t) => t.isHidden);

  // Group by category
  const expenseBuiltins = activeBuiltins.filter((e) => e.category === 'expense');
  const incomeBuiltins  = activeBuiltins.filter((e) => e.category === 'income');
  const bothBuiltins    = activeBuiltins.filter((e) => e.category === 'both');
  const expenseCustom   = pureCustomTags.filter((t) => (t.category ?? 'expense') === 'expense');
  const incomeCustom    = pureCustomTags.filter((t) => (t.category ?? 'expense') === 'income');
  const bothCustom      = pureCustomTags.filter((t) => (t.category ?? 'expense') === 'both');

  // Which section does the currently-edited tag belong to?
  const editSection: TagCategory | null = editId
    ? (editIsBuiltin ? (TAGS[editId]?.category ?? 'both') : editCategory)
    : null;

  // Accordion open state + per-section search
  const [openSection, setOpenSection] = useState<TagCategory | null>(null);
  const [searches, setSearches] = useState<Record<string, string>>({});
  const setSearch = (sec: string, val: string) => setSearches((s) => ({ ...s, [sec]: val }));

  const toggle = (sec: TagCategory) => setOpenSection((prev) => (prev === sec ? null : sec));

  // Auto-open section when edit starts
  const startEditWithOpen = (id: string, label: string, color: string, category: TagCategory, isBuiltin: boolean) => {
    startEdit(id, label, color, category, isBuiltin);
    setOpenSection(category);
  };

  // Shared row renderer
  const TagRow = ({ id, label, color, isBuiltin, isOverridden, category: rowCat }: {
    id: string; label: string; color: string; isBuiltin: boolean; isOverridden?: boolean; category: TagCategory;
  }) => (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-xl border transition-colors group',
        editId === id
          ? 'border-indigo-300 dark:border-indigo-500/40 bg-indigo-50/60 dark:bg-indigo-900/15'
          : 'border-slate-100 dark:border-white/[0.05] hover:bg-slate-50 dark:hover:bg-white/[0.03]',
      )}
    >
      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
      <span className="flex-1 text-xs font-medium text-slate-700 dark:text-white/80 truncate">{label}</span>
      {isOverridden && <span className="text-[8px] font-bold text-indigo-400 flex-shrink-0">•</span>}
      {!isBuiltin && (
        <span className={cn('text-[8px] font-bold flex-shrink-0 mr-0.5',
          rowCat === 'income' ? 'text-emerald-400' : rowCat === 'expense' ? 'text-red-400' : 'text-slate-400',
        )}>
          {rowCat === 'both' ? '±' : rowCat === 'income' ? '+' : '−'}
        </span>
      )}
      <div className="flex gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 flex-shrink-0 transition-opacity">
        <button
          type="button"
          aria-label={tc('edit')}
          onClick={() => startEditWithOpen(id, label, color, isBuiltin ? (TAGS[id]?.category ?? 'both') : rowCat, isBuiltin)}
          className="p-1 rounded hover:bg-slate-200 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
        </button>
        {isBuiltin ? (
          <button type="button" aria-label={t('hideAriaLabel')} onClick={() => hideBuiltinTag(id)} className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-500 transition-colors">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" /></svg>
          </button>
        ) : (
          <button type="button" aria-label={tc('delete')} onClick={() => deleteCustomTag(id)} className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-500 transition-colors">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        )}
      </div>
    </div>
  );

  // Edit form (shown inside the active section)
  const EditForm = ({ isBuiltin }: { isBuiltin: boolean }) => {
    if (!editId) return null;
    const entry = isBuiltin ? activeBuiltins.find((e) => e.key === editId) : pureCustomTags.find((t) => t.id === editId);
    if (!entry) return null;
    return (
      <div className="flex flex-col gap-2.5 p-3 rounded-2xl border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50/40 dark:bg-indigo-900/10 mb-2">
        <div className="flex gap-2 items-center">
          <input value={editLabel} onChange={(e) => setEditLabel(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && saveEdit()} autoFocus
            className="flex-1 h-8 px-2.5 rounded-lg bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-800 dark:text-white outline-none focus:border-indigo-400" />
          <span className="flex items-center px-2 py-0.5 rounded-lg text-[10px] font-semibold text-white flex-shrink-0" style={{ backgroundColor: editColor }}>
            {editLabel || 'Preview'}
          </span>
        </div>
        <ColorPicker value={editColor} onChange={setEditColor} />
        {!isBuiltin && (
          <div className="flex rounded-lg overflow-hidden border border-slate-200 dark:border-white/10">
            {(['income', 'expense', 'both'] as TagCategory[]).map((cat) => (
              <button key={cat} type="button" onClick={() => setEditCategory(cat)}
                className={cn('flex-1 h-7 text-[10px] font-medium transition-all',
                  editCategory === cat
                    ? cat === 'income' ? 'bg-emerald-500 text-white' : cat === 'expense' ? 'bg-red-500 text-white' : 'bg-indigo-500 text-white'
                    : 'bg-white dark:bg-transparent text-slate-500 dark:text-white/40 hover:bg-slate-50 dark:hover:bg-white/5',
                )}>
                {cat === 'income' ? tc('income') : cat === 'expense' ? tc('expense') : tc('both')}
              </button>
            ))}
          </div>
        )}
        <div className="flex gap-1.5">
          <button type="button" onClick={saveEdit} className="flex-1 h-8 rounded-2xl bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold active:scale-[0.96] transition-all duration-100 shadow-[0_1px_3px_rgba(0,0,0,0.1)]">{tc('save')}</button>
          {isBuiltin && (entry as typeof activeBuiltins[0]).isOverridden && (
            <button type="button" onClick={() => { deleteCustomTag(editId); setEditId(null); }} className="px-2.5 h-8 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-white/50 text-xs font-bold hover:bg-red-50 hover:text-red-500 active:scale-[0.96] transition-all duration-100">{tc('reset')}</button>
          )}
          <button type="button" onClick={() => setEditId(null)} className="px-2.5 h-8 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/60 text-xs font-semibold active:scale-[0.96] transition-all duration-100">{tc('cancel')}</button>
        </div>
      </div>
    );
  };

  // Renders a collapsible section
  const renderSection = (
    sec: TagCategory,
    label: string,
    accentClass: string,
    builtins: typeof expenseBuiltins,
    customs: typeof expenseCustom,
  ) => {
    const isOpen = openSection === sec;
    const q = (searches[sec] ?? '').toLowerCase();
    const filteredBuiltins = q ? builtins.filter((e) => e.label.toLowerCase().includes(q)) : builtins;
    const filteredCustoms  = q ? customs.filter((t) => t.label.toLowerCase().includes(q)) : customs;
    const total = builtins.length + customs.length;
    const hasEdit = editId && editSection === sec;

    return (
      <div key={sec} className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] overflow-hidden mb-2">
        {/* Accordion header */}
        <button
          type="button"
          onClick={() => toggle(sec)}
          className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-white/[0.03] active:bg-black/[0.03] dark:active:bg-white/[0.04] rounded-2xl transition-all duration-100"
        >
          <span className={cn('w-2 h-2 rounded-full flex-shrink-0', accentClass)} />
          <span className="flex-1 text-left text-xs font-semibold text-slate-700 dark:text-white/80">{label}</span>
          <span className="text-[10px] text-slate-400 dark:text-white/30 mr-1">{total}</span>
          <svg className={cn('w-3.5 h-3.5 text-slate-400 dark:text-white/25 transition-transform flex-shrink-0', isOpen && 'rotate-180')}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div className="border-t border-slate-100 dark:border-white/[0.05] px-3 pb-3 pt-2">
            {/* Edit form for the active tag in this section */}
            {hasEdit && <EditForm isBuiltin={!!editIsBuiltin} />}

            {/* Search */}
            <div className="relative mb-2">
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 dark:text-white/25" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searches[sec] ?? ''}
                onChange={(e) => setSearch(sec, e.target.value)}
                placeholder={`Search ${label.toLowerCase()}…`}
                className="w-full h-7 pl-7 pr-2 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/25 outline-none focus:border-indigo-300 dark:focus:border-indigo-500/50"
              />
            </div>

            {/* List */}
            <div className="flex flex-col gap-1">
              {filteredBuiltins.length === 0 && filteredCustoms.length === 0 && (
                <p className="text-xs text-slate-400 dark:text-white/30 italic py-2 text-center">{t('noTagsMatch')}</p>
              )}
              {filteredBuiltins.map((e) => (
                <TagRow key={e.key} id={e.key} label={e.label} color={e.color}
                  isBuiltin category={e.category} isOverridden={e.isOverridden} />
              ))}
              {filteredCustoms.map((t) => (
                <TagRow key={t.id} id={t.id} label={t.label} color={t.color}
                  isBuiltin={false} category={t.category ?? 'expense'} />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <SettingsCard
      title={t('tags')}
      subtitle={t('tagsDescription')}
      accent="bg-gradient-to-r from-violet-500 to-indigo-500"
    >
      {renderSection('expense', t('expenseTags'), 'bg-red-400', expenseBuiltins, expenseCustom)}
      {renderSection('income',  t('incomeTags'),  'bg-emerald-400', incomeBuiltins, incomeCustom)}
      {(bothBuiltins.length > 0 || bothCustom.length > 0) &&
        renderSection('both', t('bothTags'), 'bg-indigo-400', bothBuiltins, bothCustom)}

      {/* Hidden built-ins — tap to restore */}
      {hiddenBuiltins.length > 0 && (
        <div className="mb-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-white/30 mb-2">
            Hidden ({hiddenBuiltins.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {hiddenBuiltins.map(({ key, label, color }) => (
              <button key={key} type="button" onClick={() => unhideBuiltinTag(key)} title="Tap to restore"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border border-dashed border-slate-200 dark:border-white/10 text-slate-400 dark:text-white/30 hover:border-slate-300 hover:text-slate-500 dark:hover:text-white/50 transition-colors">
                <div className="w-2 h-2 rounded-full opacity-50" style={{ backgroundColor: color }} />
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Add custom tag */}
      {showAdd ? (
        <div className="flex flex-col gap-3 p-4 rounded-2xl border border-dashed border-indigo-300 dark:border-indigo-500/30 bg-indigo-50/40 dark:bg-indigo-900/10">
          <div className="flex gap-2 items-center">
            <input value={newLabel} onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Tag name" autoFocus onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              className="flex-1 h-11 px-3 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 outline-none focus:border-indigo-400 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)]" />
            <span className="flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold text-white flex-shrink-0" style={{ backgroundColor: newColor }}>
              {newLabel || 'Preview'}
            </span>
          </div>
          <ColorPicker value={newColor} onChange={setNewColor} />
          <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-white/10">
            {(['income', 'expense', 'both'] as TagCategory[]).map((cat) => (
              <button key={cat} type="button" onClick={() => setNewCategory(cat)}
                className={cn('flex-1 h-8 text-xs font-medium transition-all',
                  newCategory === cat
                    ? cat === 'income' ? 'bg-emerald-500 text-white' : cat === 'expense' ? 'bg-red-500 text-white' : 'bg-indigo-500 text-white'
                    : 'bg-white dark:bg-transparent text-slate-500 dark:text-white/40 hover:bg-slate-50 dark:hover:bg-white/5',
                )}>
                {cat === 'income' ? tc('income') : cat === 'expense' ? tc('expense') : tc('both')}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={handleAdd} className="flex-1 h-10 rounded-2xl bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-bold active:scale-[0.96] transition-all duration-100 shadow-[0_1px_3px_rgba(0,0,0,0.1)]">{tc('add')}</button>
            <button type="button" onClick={() => setShowAdd(false)} className="px-4 h-10 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/60 text-sm font-semibold active:scale-[0.96] transition-all duration-100">{tc('cancel')}</button>
          </div>
        </div>
      ) : (
        <AddRowBtn label={t('customTags')} accentHover="hover:border-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-400" onClick={() => setShowAdd(true)} />
      )}
    </SettingsCard>
  );
}

// ─── Templates section ────────────────────────────────────────────────────────

function TemplatesSection() {
  const t = useTranslations('settings');
  const tTags = useTranslations('tags');
  const { templates, allTags, addTemplate, deleteTemplate } = useSettings();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<{
    name: string; amount: string;
    category: 'income' | 'expense'; type: 'recurring' | 'one_off';
    tag: string; frequency: Frequency;
  }>({ name: '', amount: '', category: 'expense', type: 'one_off', tag: '', frequency: 'monthly' });

  const handleAdd = () => {
    const amt = Number(form.amount);
    if (!form.name.trim() || !amt || amt <= 0) return;
    addTemplate({
      name: form.name.trim(),
      amount: amt,
      category: form.category,
      type: form.type,
      tag: form.tag || undefined,
      frequency: form.type === 'recurring' ? form.frequency : undefined,
    } as Omit<RecurringTemplate, 'id'>);
    setForm({ name: '', amount: '', category: 'expense', type: 'one_off', tag: '', frequency: 'monthly' });
    setShowAdd(false);
  };

  return (
    <SettingsCard
      title={t('quickTemplates')}
      subtitle={t('quickTemplatesDesc')}
      accent="bg-gradient-to-r from-sky-400 to-cyan-500"
    >
      {templates.length === 0 && !showAdd && (
        <p className="text-sm text-slate-400 dark:text-white/30 mb-4">{t('noTemplates')}</p>
      )}

      {templates.length > 0 && (
        <div className="flex flex-col gap-2 mb-4">
          {templates.map((tmpl) => (
            <div key={tmpl.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-slate-100 dark:border-white/[0.05] hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors group">
              <div className={cn('w-[3px] self-stretch rounded-full flex-shrink-0 min-h-[1.5rem]', tmpl.category === 'income' ? 'bg-emerald-400' : 'bg-red-400')} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 dark:text-white/90 truncate">{tmpl.name}</p>
                <p className="text-xs text-slate-400 dark:text-white/35 mt-0.5">
                  {tmpl.category === 'income' ? '+' : '−'}{tmpl.amount}
                  {tmpl.type === 'recurring' && tmpl.frequency ? ` · ${FREQUENCIES[tmpl.frequency]}` : ' · One-off'}
                  {tmpl.tag && allTags[tmpl.tag] ? ` · ${TAGS[tmpl.tag] ? tTags(tmpl.tag as never) : allTags[tmpl.tag].label}` : ''}
                </p>
              </div>
              <TrashBtn onClick={() => deleteTemplate(tmpl.id)} />
            </div>
          ))}
        </div>
      )}

      {showAdd ? (
        <div className="flex flex-col gap-3 p-4 rounded-2xl border border-dashed border-sky-300 dark:border-sky-500/30 bg-sky-50/40 dark:bg-sky-900/10">
          {/* Category */}
          <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-white/10">
            {(['income', 'expense'] as const).map((cat) => (
              <button key={cat} type="button" onClick={() => setForm((f) => ({ ...f, category: cat }))}
                className={cn('flex-1 h-9 text-sm font-medium transition-all',
                  form.category === cat
                    ? cat === 'income' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                    : 'bg-white dark:bg-transparent text-slate-500 dark:text-white/40 hover:bg-slate-50 dark:hover:bg-white/5',
                )}>
                {cat === 'income' ? '+ Income' : '− Expense'}
              </button>
            ))}
          </div>
          {/* Type */}
          <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-white/10">
            {(['one_off', 'recurring'] as const).map((t) => (
              <button key={t} type="button" onClick={() => setForm((f) => ({ ...f, type: t }))}
                className={cn('flex-1 h-9 text-sm font-medium transition-all',
                  form.type === t ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'bg-white dark:bg-transparent text-slate-500 dark:text-white/40 hover:bg-slate-50 dark:hover:bg-white/5',
                )}>
                {t === 'one_off' ? 'One-off' : 'Recurring'}
              </button>
            ))}
          </div>
          <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Template name (e.g. Monthly Rent)" autoFocus
            className="w-full h-11 px-3 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 outline-none focus:border-sky-400 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)]" />
          <input type="number" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            placeholder="Amount" min="0" step="0.01"
            className="w-full h-11 px-3 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 outline-none focus:border-sky-400 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)]" />
          {form.type === 'recurring' && (
            <select value={form.frequency} onChange={(e) => setForm((f) => ({ ...f, frequency: e.target.value as Frequency }))}
              className="w-full h-11 px-3 rounded-2xl bg-white dark:bg-[#042F2E] border border-slate-200 dark:border-white/10 text-sm text-slate-800 dark:text-white outline-none focus:border-sky-400 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)] [&>option]:bg-white [&>option]:text-brand-text dark:[&>option]:bg-[#042F2E] dark:[&>option]:text-white">
              {Object.entries(FREQUENCIES).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
            </select>
          )}
          {/* Tag picker — filtered to match the template's income/expense */}
          <div className="flex flex-wrap gap-1.5">
            <button type="button" onClick={() => setForm((f) => ({ ...f, tag: '' }))}
              className={cn('px-2.5 py-1 rounded-lg text-xs font-medium border transition-all',
                !form.tag ? 'bg-slate-800 text-white border-slate-800 dark:bg-white dark:text-slate-900 dark:border-white' : 'border-slate-200 dark:border-white/10 text-slate-500 dark:text-white/40 bg-white dark:bg-white/5',
              )}>
              None
            </button>
            {Object.entries(allTags)
              .filter(([, t]) => t.category === form.category || t.category === 'both')
              .map(([key, { label, color }]) => (
                <button key={key} type="button" onClick={() => setForm((f) => ({ ...f, tag: f.tag === key ? '' : key }))}
                  className={cn('flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all',
                    form.tag === key ? 'text-white border-transparent' : 'border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-600 dark:text-white/60',
                  )}
                  style={form.tag === key ? { backgroundColor: color } : undefined}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                  {label}
                </button>
              ))}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={handleAdd} className="flex-1 h-10 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white text-sm font-bold active:scale-[0.96] transition-all duration-100 shadow-[0_1px_3px_rgba(0,0,0,0.1)]">Save template</button>
            <button type="button" onClick={() => setShowAdd(false)} className="px-4 h-10 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/60 text-sm font-semibold active:scale-[0.96] transition-all duration-100">Cancel</button>
          </div>
        </div>
      ) : (
        <AddRowBtn label="Add template" accentHover="hover:border-sky-400 hover:text-sky-500 dark:hover:text-sky-400" onClick={() => setShowAdd(true)} />
      )}
    </SettingsCard>
  );
}

// ─── Preferences section ──────────────────────────────────────────────────────

function PreferencesSection() {
  const t = useTranslations('settings');
  const { firstDayOfWeek, dateFormat, hapticsEnabled, setFirstDayOfWeek, setDateFormat, setHapticsEnabled } = useSettings();
  const { impact } = useHaptics();

  return (
    <SettingsCard
      title={t('preferences')}
      subtitle={t('preferencesDesc')}
      accent="bg-gradient-to-r from-amber-400 to-orange-400"
    >
      <div className="flex flex-col gap-5 mt-1">
        {/* First day of week */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-700 dark:text-white/80">{t('firstDayOfWeek')}</p>
            <p className="text-xs text-slate-400 dark:text-white/35 mt-0.5">{t('firstDayOfWeekDesc')}</p>
          </div>
          <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 flex-shrink-0">
            {([{ label: t('monday'), value: 1 as const }, { label: t('sunday'), value: 0 as const }]).map(({ label, value }) => (
              <button key={value} type="button" onClick={() => setFirstDayOfWeek(value)}
                className={cn('px-5 h-9 text-sm font-semibold transition-all',
                  firstDayOfWeek === value
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'bg-white dark:bg-transparent text-slate-500 dark:text-white/40 hover:bg-slate-50 dark:hover:bg-white/5',
                )}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Date format */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-700 dark:text-white/80">{t('dateFormat')}</p>
            <p className="text-xs text-slate-400 dark:text-white/35 mt-0.5">{t('dateFormatDesc')}</p>
          </div>
          <select
            value={dateFormat}
            onChange={(e) => setDateFormat(e.target.value as 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD')}
            className="h-11 px-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#042F2E] text-sm text-slate-700 dark:text-white/80 outline-none focus:border-indigo-400 flex-shrink-0 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)] [&>option]:bg-white [&>option]:text-brand-text dark:[&>option]:bg-[#042F2E] dark:[&>option]:text-white"
          >
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
          </select>
        </div>

        {/* Haptic feedback */}
        <div className="native-row rounded-2xl flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-700 dark:text-white/80">{t('hapticFeedback')}</p>
            <p className="text-xs text-slate-400 dark:text-white/35 mt-0.5">{t('hapticFeedbackDesc')}</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={hapticsEnabled}
            onClick={() => {
              const next = !hapticsEnabled;
              setHapticsEnabled(next);
              // Pass forceEnabled=true so the haptic fires even though the store
              // hasn't propagated yet — lets the user feel confirmation when turning it on
              if (next) impact('light', true);
            }}
            className={cn(
              'relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200',
              hapticsEnabled
                ? 'bg-brand-primary'
                : 'bg-slate-200 dark:bg-white/10',
            )}
          >
            <span
              className={cn(
                'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200',
                hapticsEnabled ? 'translate-x-5' : 'translate-x-0',
              )}
            />
          </button>
        </div>
      </div>
    </SettingsCard>
  );
}

// ─── Savings Goals section ────────────────────────────────────────────────────

function GoalsSection() {
  const t = useTranslations('settings');
  const tTags = useTranslations('tags');
  const { goals, allTags, addGoal, updateGoal, deleteGoal } = useSettings();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', target: '', currentSaved: '', deadline: '', linkedTagId: '' });
  const [editId, setEditId] = useState<string | null>(null);
  const [editSaved, setEditSaved] = useState('');
  // which goal is showing the "pick a tag to link" picker
  const [linkingGoalId, setLinkingGoalId] = useState<string | null>(null);

  const handleAdd = () => {
    const target = Number(form.target);
    if (!form.name.trim() || !target || target <= 0) return;
    addGoal({
      name: form.name.trim(),
      targetAmount: target,
      currentSaved: form.linkedTagId ? 0 : (Number(form.currentSaved) || 0),
      deadline: form.deadline || undefined,
      linkedTagId: form.linkedTagId || undefined,
    });
    setForm({ name: '', target: '', currentSaved: '', deadline: '', linkedTagId: '' });
    setShowAdd(false);
  };

  const handleUpdateSaved = (id: string) => {
    updateGoal(id, { currentSaved: Number(editSaved) || 0 });
    setEditId(null);
  };

  return (
    <SettingsCard
      title={t('savingsGoals')}
      subtitle="Set targets and track progress. Link a tag so transactions auto-update progress."
      accent="bg-gradient-to-r from-emerald-400 to-teal-500"
    >
      {goals.length === 0 && !showAdd && (
        <p className="text-sm text-slate-400 dark:text-white/30 mb-4">No goals yet. Set a target to stay motivated.</p>
      )}

      {goals.length > 0 && (
        <div className="flex flex-col gap-3 mb-4">
          {goals.map((goal) => {
            const pct = goal.targetAmount > 0 ? Math.min(goal.currentSaved / goal.targetAmount, 1) : 0;
            const remaining = Math.max(0, goal.targetAmount - goal.currentSaved);
            const daysLeft = goal.deadline
              ? Math.max(0, Math.ceil((new Date(goal.deadline + 'T12:00:00').getTime() - Date.now()) / 86_400_000))
              : null;
            const linkedTag = goal.linkedTagId ? allTags[goal.linkedTagId] : null;

            return (
              <div key={goal.id} className="p-4 rounded-xl border border-slate-100 dark:border-white/[0.05] bg-slate-50/50 dark:bg-white/[0.02]">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-white/90 truncate">{goal.name}</p>
                    {goal.deadline && (
                      <p className="text-xs text-slate-400 dark:text-white/35 mt-0.5">
                        {new Date(goal.deadline + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {daysLeft !== null ? (daysLeft > 0 ? ` · ${daysLeft} days left` : ' · Deadline passed') : ''}
                      </p>
                    )}
                  </div>
                  <button type="button" onClick={() => deleteGoal(goal.id)}
                    className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-500 transition-colors flex-shrink-0">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

                {/* Progress bar */}
                <div className="h-2 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden mb-1.5">
                  <div
                    className={cn('h-full rounded-full transition-all duration-700', pct >= 1 ? 'bg-emerald-400' : 'bg-gradient-to-r from-emerald-400 to-teal-400')}
                    style={{ width: `${pct * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-slate-500 dark:text-white/40 mb-2">
                  <span>{Math.round(pct * 100)}% · {goal.currentSaved.toLocaleString()} / {goal.targetAmount.toLocaleString()}</span>
                  {pct < 1 && <span>{remaining.toLocaleString()} remaining</span>}
                </div>

                {/* Linked tag or manual controls */}
                {linkingGoalId === goal.id ? (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {Object.entries(allTags).map(([key, { label, color }]) => (
                      <button key={key} type="button"
                        onClick={() => { updateGoal(goal.id, { linkedTagId: key, currentSaved: 0 }); setLinkingGoalId(null); }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-600 dark:text-white/60 hover:border-emerald-400 hover:text-emerald-600 transition-colors">
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                        {TAGS[key] ? tTags(key as never) : label}
                      </button>
                    ))}
                    <button type="button" onClick={() => setLinkingGoalId(null)}
                      className="px-2.5 py-1 rounded-lg text-xs border border-slate-200 dark:border-white/10 text-slate-400 dark:text-white/30">
                      Cancel
                    </button>
                  </div>
                ) : linkedTag ? (
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: linkedTag.color }} />
                      <span className="text-xs text-slate-500 dark:text-white/40">
                        Auto-tracked via <span className="font-medium text-slate-600 dark:text-white/60">{goal.linkedTagId && TAGS[goal.linkedTagId] ? tTags(goal.linkedTagId as never) : linkedTag.label}</span>
                      </span>
                    </div>
                    <button type="button"
                      onClick={() => updateGoal(goal.id, { linkedTagId: undefined })}
                      className="text-[11px] text-slate-400 dark:text-white/25 hover:text-red-400 transition-colors">
                      Unlink
                    </button>
                  </div>
                ) : editId === goal.id ? (
                  <div className="flex gap-2">
                    <input type="number" value={editSaved} onChange={(e) => setEditSaved(e.target.value)}
                      placeholder="Amount saved so far" autoFocus
                      className="flex-1 h-8 px-2 rounded-lg bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 outline-none focus:border-emerald-400" />
                    <button type="button" onClick={() => handleUpdateSaved(goal.id)} className="px-3 h-10 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold active:scale-[0.96] transition-all duration-100 shadow-[0_1px_3px_rgba(0,0,0,0.1)]">Save</button>
                    <button type="button" onClick={() => setEditId(null)} className="px-2 h-10 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-white/50 text-xs active:scale-[0.96] transition-all duration-100">✕</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => { setEditId(goal.id); setEditSaved(goal.currentSaved.toString()); }}
                      className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
                      Update amount
                    </button>
                    <span className="text-slate-300 dark:text-white/10 text-xs">·</span>
                    <button type="button" onClick={() => { setLinkingGoalId(goal.id); setEditId(null); }}
                      className="text-xs text-slate-400 dark:text-white/30 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors">
                      Link to tag
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showAdd ? (
        <div className="flex flex-col gap-3 p-4 rounded-2xl border border-dashed border-emerald-300 dark:border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-900/10">
          <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Goal name (e.g. Holiday fund)" autoFocus
            className="w-full h-11 px-3 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 outline-none focus:border-emerald-400 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)]" />
          <input type="number" value={form.target} onChange={(e) => setForm((f) => ({ ...f, target: e.target.value }))}
            placeholder="Target amount" min="0"
            className="w-full h-11 px-3 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 outline-none focus:border-emerald-400 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)]" />
          {!form.linkedTagId && (
            <input type="number" value={form.currentSaved} onChange={(e) => setForm((f) => ({ ...f, currentSaved: e.target.value }))}
              placeholder="Already saved (optional)" min="0"
              className="w-full h-11 px-3 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 outline-none focus:border-emerald-400 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)]" />
          )}
          <div>
            <p className="text-xs text-slate-500 dark:text-white/40 mb-1">Deadline (optional)</p>
            <input type="date" value={form.deadline} onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
              className="w-full h-11 px-3 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm text-slate-800 dark:text-white outline-none focus:border-emerald-400 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)]" />
          </div>
          {/* Tag link picker */}
          <div>
            <p className="text-xs text-slate-500 dark:text-white/40 mb-1.5">
              Link to tag — income transactions with this tag will count toward the goal
            </p>
            <div className="flex flex-wrap gap-1.5">
              <button type="button" onClick={() => setForm((f) => ({ ...f, linkedTagId: '' }))}
                className={cn('px-2.5 py-1 rounded-lg text-xs font-medium border transition-all',
                  !form.linkedTagId
                    ? 'bg-slate-800 text-white border-slate-800 dark:bg-white dark:text-slate-900 dark:border-white'
                    : 'border-slate-200 dark:border-white/10 text-slate-500 dark:text-white/40 bg-white dark:bg-white/5',
                )}>
                Manual
              </button>
              {Object.entries(allTags).map(([key, { label, color }]) => (
                <button key={key} type="button"
                  onClick={() => setForm((f) => ({ ...f, linkedTagId: f.linkedTagId === key ? '' : key }))}
                  className={cn('flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all',
                    form.linkedTagId === key
                      ? 'text-white border-transparent'
                      : 'border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-600 dark:text-white/60',
                  )}
                  style={form.linkedTagId === key ? { backgroundColor: color } : undefined}>
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                  {TAGS[key] ? tTags(key as never) : label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={handleAdd} className="flex-1 h-10 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold active:scale-[0.96] transition-all duration-100 shadow-[0_1px_3px_rgba(0,0,0,0.1)]">Add goal</button>
            <button type="button" onClick={() => setShowAdd(false)} className="px-4 h-10 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/60 text-sm font-semibold active:scale-[0.96] transition-all duration-100">Cancel</button>
          </div>
        </div>
      ) : (
        <AddRowBtn label="Add savings goal" accentHover="hover:border-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-400" onClick={() => setShowAdd(true)} />
      )}
    </SettingsCard>
  );
}

// ─── Account type selector ────────────────────────────────────────────────────

const ACCOUNT_TYPES: AccountType[] = ['checking', 'savings', 'credit'];

function AccountTypeSelector({ value, onChange }: { value: AccountType; onChange: (v: AccountType) => void }) {
  const t = useTranslations('accounts');
  return (
    <div className="flex gap-1">
      {ACCOUNT_TYPES.map((type) => (
        <button
          key={type}
          type="button"
          onClick={() => onChange(type)}
          className={cn(
            'flex-1 h-8 rounded-lg text-xs font-semibold border transition-all',
            value === type
              ? 'bg-teal-500 text-white border-teal-500'
              : 'bg-white dark:bg-white/5 text-slate-500 dark:text-white/40 border-slate-200 dark:border-white/10 hover:border-teal-400',
          )}
        >
          {t(`type${type.charAt(0).toUpperCase() + type.slice(1)}` as 'typeChecking')}
        </button>
      ))}
    </div>
  );
}

// ─── Accounts section ─────────────────────────────────────────────────────────

function AccountsSection() {
  const t = useTranslations('settings');
  const ta = useTranslations('accounts');
  const tc = useTranslations('common');
  const { data: accounts, isLoading } = useAccounts();
  const { data: hhData } = useHouseholdMembers();
  const members = hhData?.members;
  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();
  const deleteAccount = useDeleteAccount();

  const [myUserId, setMyUserId] = useState<string | null>(null);
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setMyUserId(data.user.id);
    });
  }, []);

  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState<AccountType>('checking');
  const [editLimit, setEditLimit] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<AccountType>('checking');
  const [newLimit, setNewLimit] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const startEdit = (id: string, name: string, type: AccountType, creditLimit?: number | null) => {
    setEditId(id);
    setEditName(name);
    setEditType(type ?? 'checking');
    setEditLimit(creditLimit ? String(creditLimit) : '');
    setError('');
  };

  const saveEdit = () => {
    if (!editId || !editName.trim()) return;
    const payload: UpdateAccountPayload = {
      id: editId,
      name: editName.trim(),
      type: editType,
      credit_limit: editType === 'credit' && editLimit ? Number(editLimit) : null,
    };
    updateAccount.mutate(payload, {
      onSuccess: () => { setEditId(null); setError(''); },
      onError: (e: Error) => setError(e.message),
    });
  };

  const handleAdd = () => {
    if (!newName.trim()) return;
    const payload: CreateAccountPayload = {
      name: newName.trim(),
      type: newType,
      credit_limit: newType === 'credit' && newLimit ? Number(newLimit) : null,
    };
    createAccount.mutate(payload, {
      onSuccess: () => { setNewName(''); setNewType('checking'); setNewLimit(''); setShowAdd(false); setError(''); },
      onError: (e: Error) => setError(e.message),
    });
  };

  const handleDelete = (id: string) => {
    deleteAccount.mutate(id, {
      onSuccess: () => { setDeleteConfirmId(null); setError(''); },
      onError: (e: Error) => { setError(e.message); setDeleteConfirmId(null); },
    });
  };

  const inputCls = 'flex-1 min-w-0 h-11 px-2.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm text-slate-800 dark:text-white outline-none focus:border-teal-400 placeholder:text-slate-400 dark:placeholder:text-white/30 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)]';

  return (
    <SettingsCard
      title={t('accountsSection')}
      subtitle={t('accountsDesc')}
      accent="bg-gradient-to-r from-cyan-500 to-teal-500"
    >
      {isLoading && (
        <div className="flex flex-col gap-2 mb-3">
          {[1, 2].map((i) => <div key={i} className="h-10 rounded-xl bg-slate-100 dark:bg-white/5 animate-pulse" />)}
        </div>
      )}

      {error && (
        <p className="text-xs text-red-500 mb-2">{error}</p>
      )}

      {(() => {
        const groups = groupAccountsByOwner(accounts ?? [], myUserId, members);
        const showHeaders = (members?.length ?? 0) > 1 && groups.some((g) => !g.isMine);
        const rowsForGroup = (group: typeof groups[number]) => group.items.map((acct) => (
          <div key={acct.id} className="group rounded-xl border border-slate-100 dark:border-white/[0.06] bg-slate-50/50 dark:bg-white/[0.02] overflow-hidden">
            {editId === acct.id ? (
              <div className="p-2.5 flex flex-col gap-2">
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Escape') setEditId(null); }}
                  autoFocus
                  className={inputCls}
                  style={{ flex: 'none', width: '100%' }}
                />
                <AccountTypeSelector value={editType} onChange={setEditType} />
                {editType === 'credit' && (
                  <input
                    type="number"
                    min="0"
                    value={editLimit}
                    onChange={(e) => setEditLimit(e.target.value)}
                    placeholder={ta('creditLimitPlaceholder')}
                    className={inputCls}
                    style={{ flex: 'none', width: '100%' }}
                  />
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={saveEdit}
                    disabled={updateAccount.isPending}
                    className="h-10 px-3 rounded-2xl bg-teal-500 text-white text-xs font-bold hover:bg-teal-600 active:scale-[0.96] transition-all duration-100 shadow-[0_1px_3px_rgba(0,0,0,0.1)] disabled:opacity-50"
                  >
                    {tc('save')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditId(null)}
                    className="h-10 px-2 rounded-2xl text-slate-400 dark:text-white/40 hover:text-slate-600 dark:hover:text-white text-xs active:scale-[0.96] transition-all duration-100"
                  >
                    {tc('cancel')}
                  </button>
                </div>
              </div>
            ) : deleteConfirmId === acct.id ? (
              <div className="flex items-center gap-2 p-2.5">
                <p className="flex-1 text-xs font-medium text-red-600 dark:text-red-400">{t('deleteAccountConfirm', { name: acct.name })}</p>
                <button
                  type="button"
                  onClick={() => handleDelete(acct.id)}
                  disabled={deleteAccount.isPending}
                  className="h-10 px-2.5 rounded-2xl bg-red-500 text-white text-xs font-bold hover:bg-red-600 active:scale-[0.96] transition-all duration-100 disabled:opacity-50"
                >
                  {deleteAccount.isPending ? '…' : tc('delete')}
                </button>
                <button type="button" onClick={() => setDeleteConfirmId(null)} className="text-slate-400 dark:text-white/40 hover:text-slate-600 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-2.5">
                <div className={cn(
                  'w-2 h-2 rounded-full flex-shrink-0',
                  acct.type === 'credit' ? 'bg-purple-400' : acct.type === 'savings' ? 'bg-emerald-400' : 'bg-teal-400',
                )} />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-slate-800 dark:text-white/90 truncate block">{acct.name}</span>
                  <span className="text-[10px] text-slate-400 dark:text-white/30">
                    {ta(`type${((acct.type ?? 'checking').charAt(0).toUpperCase() + (acct.type ?? 'checking').slice(1))}` as 'typeChecking')}
                    {acct.type === 'credit' && acct.credit_limit != null && ` · ${ta('creditLimit')} set`}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => startEdit(acct.id, acct.name, acct.type ?? 'checking', acct.credit_limit)}
                  className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 text-slate-400 dark:text-white/30 hover:text-slate-600 dark:hover:text-white opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all flex-shrink-0"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                {(accounts?.length ?? 0) > 1 && (
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmId(acct.id)}
                    className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-500 dark:hover:text-red-400 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all flex-shrink-0"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>
        ));
        return showHeaders ? (
          <div className="flex flex-col gap-4 mb-3">
            {groups.map((group) => (
              <div key={group.userId || 'mine'} className="flex flex-col gap-1.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-white/40 px-1">
                  {group.isMine ? ta('groupMine') : ta('groupOwner', { name: memberShortName(group.userId, members) ?? '—' })}
                </p>
                <div className="flex flex-col gap-2">
                  {rowsForGroup(group)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2 mb-3">
            {groups.flatMap((g) => rowsForGroup(g))}
          </div>
        );
      })()}

      {showAdd ? (
        <div className="flex flex-col gap-2 p-3 rounded-2xl border border-teal-400/30 bg-teal-50/30 dark:bg-teal-900/10">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Escape') { setShowAdd(false); setNewName(''); setNewType('checking'); setNewLimit(''); } }}
            placeholder={ta('namePlaceholder')}
            autoFocus
            className={inputCls}
            style={{ flex: 'none', width: '100%' }}
          />
          <AccountTypeSelector value={newType} onChange={setNewType} />
          {newType === 'credit' && (
            <input
              type="number"
              min="0"
              value={newLimit}
              onChange={(e) => setNewLimit(e.target.value)}
              placeholder={ta('creditLimitPlaceholder')}
              className={inputCls}
              style={{ flex: 'none', width: '100%' }}
            />
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleAdd}
              disabled={createAccount.isPending || !newName.trim()}
              className="h-10 px-4 rounded-2xl bg-teal-500 text-white text-sm font-bold hover:bg-teal-600 active:scale-[0.96] transition-all duration-100 shadow-[0_1px_3px_rgba(0,0,0,0.1)] disabled:opacity-50"
            >
              {createAccount.isPending ? '…' : tc('add')}
            </button>
            <button type="button" onClick={() => { setShowAdd(false); setNewName(''); setNewType('checking'); setNewLimit(''); }} className="h-10 px-3 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-white/40 text-sm font-medium hover:bg-slate-200 dark:hover:bg-white/10 active:scale-[0.96] transition-all duration-100">
              {tc('cancel')}
            </button>
          </div>
        </div>
      ) : (accounts?.length ?? 0) < 10 ? (
        <AddRowBtn
          label={t('addAccount')}
          accentHover="hover:border-teal-400/60 hover:text-teal-600 dark:hover:text-teal-400"
          onClick={() => { setShowAdd(true); setError(''); }}
        />
      ) : (
        <p className="text-xs text-slate-400 dark:text-white/30 text-center">{t('maxAccountsReached')}</p>
      )}
    </SettingsCard>
  );
}

// ─── Household sharing section ────────────────────────────────────────────────

function HouseholdSharingSection() {
  const t = useTranslations('sharing');
  const tc = useTranslations('common');
  const { data: hhData, isLoading: membersLoading } = useHouseholdMembers();
  const { data: invites, isLoading: invitesLoading } = useHouseholdInvites();
  const createInvite = useCreateInvite();
  const revokeInvite = useRevokeInvite();
  const removeMember = useRemoveMember();

  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [removeConfirmId, setRemoveConfirmId] = useState<string | null>(null);

  const members = hhData?.members ?? [];
  const ownerRole = members.find((m) => m.role === 'owner');

  const handleInvite = () => {
    if (!email.trim()) return;
    createInvite.mutate(
      { email: email.trim(), displayName: displayName.trim() || undefined },
      {
        onSuccess: () => {
          setEmail('');
          setDisplayName('');
        },
      },
    );
  };

  const pendingInvites = (invites ?? []).filter((inv) => inv.status === 'pending');

  return (
    <SettingsCard
      title={t('shareTitle')}
      subtitle={t('shareDesc')}
      accent="bg-gradient-to-r from-violet-500 to-purple-400"
    >
      {/* Members list */}
      <div className="mb-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-white/30 mb-2">{t('members')}</p>
        {membersLoading ? (
          <div className="h-8 rounded-xl bg-slate-100 dark:bg-white/[0.05] animate-pulse" />
        ) : members.length <= 1 ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <img
              src="/shared-household.svg"
              alt=""
              aria-hidden
              className="w-full max-w-[260px] h-auto"
            />
            <p className="text-xs text-slate-500 dark:text-white/40">{t('noMembers')}</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {members.map((m) => (
              <li key={m.user_id} className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-100 dark:border-white/[0.06]">
                <span
                  className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white"
                  style={{ backgroundColor: memberColor(m.user_id) }}
                >
                  {(m.display_name ?? m.email ?? '?')[0].toUpperCase()}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-brand-text dark:text-white truncate">
                    {m.display_name ?? m.email}
                    {m.user_id === ownerRole?.user_id && (
                      <span className="ml-1.5 text-[9px] font-bold uppercase tracking-wider text-violet-500">{t('roleOwner')}</span>
                    )}
                  </p>
                  {m.display_name && m.email && (
                    <p className="text-[10px] text-slate-400 dark:text-white/30 truncate">{m.email}</p>
                  )}
                </div>
                {/* Remove button (owner can remove others) */}
                {ownerRole && m.user_id !== ownerRole.user_id && (
                  removeConfirmId === m.user_id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => removeMember.mutate(m.user_id, { onSuccess: () => setRemoveConfirmId(null) })}
                        className="text-[10px] font-semibold text-red-500 hover:text-red-600 px-2 py-0.5 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30"
                      >
                        {t('removeMember')}
                      </button>
                      <button
                        onClick={() => setRemoveConfirmId(null)}
                        className="text-[10px] text-slate-400 hover:text-slate-600 px-1.5"
                      >
                        {tc('cancel')}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setRemoveConfirmId(m.user_id)}
                      className="text-[10px] font-medium text-slate-400 dark:text-white/30 hover:text-red-500 dark:hover:text-red-400 transition-colors px-2 py-0.5"
                    >
                      {t('removeMember')}
                    </button>
                  )
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Invite form */}
      <div className="mb-4 pb-4 border-b border-slate-100 dark:border-white/[0.07]">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('inviteEmailPlaceholder')}
            className="flex-1 h-9 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-sm text-brand-text dark:text-white placeholder:text-slate-300 dark:placeholder:text-white/20 outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary/40"
          />
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder={t('nicknamePlaceholder')}
            className="sm:w-36 h-9 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-sm text-brand-text dark:text-white placeholder:text-slate-300 dark:placeholder:text-white/20 outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary/40"
          />
          <button
            onClick={handleInvite}
            disabled={createInvite.isPending || !email.trim()}
            className={cn(
              'h-9 px-4 rounded-xl text-sm font-semibold text-white transition-all',
              createInvite.isPending || !email.trim()
                ? 'bg-brand-primary/40 cursor-not-allowed'
                : 'bg-brand-primary hover:bg-brand-primary/90 active:scale-[0.97]',
            )}
          >
            {createInvite.isPending ? '...' : t('invite')}
          </button>
        </div>
        {createInvite.isError && (
          <p className="mt-2 text-xs text-red-500">{(createInvite.error as Error)?.message}</p>
        )}
        {createInvite.isSuccess && (
          <p className="mt-2 text-xs text-emerald-500 font-medium">{t('inviteSent')}</p>
        )}
      </div>

      {/* Pending invitations */}
      {pendingInvites.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-white/30 mb-2">{t('pendingInvitations')}</p>
          <ul className="flex flex-col gap-1.5">
            {pendingInvites.map((inv) => (
              <li key={inv.id} className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-amber-50/60 dark:bg-amber-900/10 border border-amber-200/60 dark:border-amber-500/20">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-brand-text dark:text-white truncate">{inv.invited_email}</p>
                  {inv.display_name && (
                    <p className="text-[10px] text-slate-400 dark:text-white/30">{inv.display_name}</p>
                  )}
                </div>
                <button
                  onClick={() => revokeInvite.mutate(inv.id)}
                  disabled={revokeInvite.isPending}
                  className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 hover:text-red-500 dark:hover:text-red-400 transition-colors px-2 py-0.5"
                >
                  {t('revoke')}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </SettingsCard>
  );
}

// ─── Notifications section ───────────────────────────────────────────────────

function BackupSection() {
  const t = useTranslations('settings');
  const [restoreState, setRestoreState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [restoreError, setRestoreError] = useState('');
  const [downloadState, setDownloadState] = useState<'idle' | 'loading' | 'error'>('idle');

  const handleDownload = async () => {
    setDownloadState('loading');
    try {
      const res = await fetch('/api/backup');
      if (!res.ok) throw new Error('Download failed');
      const text = await res.text();
      const today = new Date().toISOString().slice(0, 10);
      const filename = `budget-backup-${today}.json`;

      // Capacitor native (Android/iOS)
      if (typeof window !== 'undefined') {
        const { Capacitor } = await import('@capacitor/core');
        if (Capacitor.isNativePlatform()) {
          const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem');
          const { Share } = await import('@capacitor/share');
          const writeResult = await Filesystem.writeFile({
            path: filename,
            data: text,
            directory: Directory.Cache,
            encoding: Encoding.UTF8,
          });
          await Share.share({
            title: 'Budget Backup',
            url: writeResult.uri,
            dialogTitle: 'Save your backup',
          }).catch(() => {/* dismissed */});
          setDownloadState('idle');
          return;
        }
      }

      // Web fallback
      const blob = new Blob([text], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 200);
      setDownloadState('idle');
    } catch {
      setDownloadState('error');
    }
  };

  const handleRestore = async (file: File) => {
    setRestoreState('loading');
    setRestoreError('');
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const res = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Restore failed');
      }
      setRestoreState('success');
      setTimeout(() => setRestoreState('idle'), 4000);
    } catch (err) {
      setRestoreError(err instanceof Error ? err.message : 'Restore failed');
      setRestoreState('error');
      setTimeout(() => setRestoreState('idle'), 5000);
    }
  };

  return (
    <SettingsCard
      title={t('backup')}
      subtitle="Download all your data or restore from a previous backup"
      accent="bg-gradient-to-r from-violet-500 to-indigo-500"
    >
      <div className="flex flex-col gap-3 mt-2">
        {/* Download */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.08]">
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-white">{t('downloadBackup')}</p>
            <p className="text-xs text-slate-400 dark:text-white/35 mt-0.5">Saves all transactions as a JSON file</p>
          </div>
          <button
            onClick={handleDownload}
            disabled={downloadState === 'loading'}
            className={cn(
              'flex items-center gap-1.5 h-10 px-3 rounded-2xl text-xs font-bold active:scale-[0.96] transition-all duration-100 border shadow-[0_1px_3px_rgba(0,0,0,0.1)]',
              downloadState === 'error'
                ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-500/30'
                : 'bg-violet-600 text-white border-transparent hover:bg-violet-700',
              downloadState === 'loading' && 'opacity-60 cursor-wait',
            )}
          >
            {downloadState === 'loading' ? (
              <span className="w-3 h-3 rounded-full border border-white/30 border-t-white animate-spin" />
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            )}
            {downloadState === 'error' ? 'Failed' : 'Download'}
          </button>
        </div>

        {/* Restore */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.08]">
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-white">{t('restoreBackup')}</p>
            <p className="text-xs text-slate-400 dark:text-white/35 mt-0.5">Upload a previously downloaded JSON file</p>
          </div>
          <label
            className={cn(
              'flex items-center gap-1.5 h-10 px-3 rounded-2xl text-xs font-bold active:scale-[0.96] transition-all duration-100 border cursor-pointer shadow-[0_1px_3px_rgba(0,0,0,0.1)]',
              restoreState === 'success'
                ? 'bg-emerald-500 text-white border-transparent'
                : restoreState === 'error'
                ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-500/30'
                : 'bg-slate-800 text-white border-transparent hover:bg-slate-700 dark:bg-white/10 dark:hover:bg-white/15',
              restoreState === 'loading' && 'opacity-60 cursor-wait pointer-events-none',
            )}
          >
            <input
              type="file"
              accept=".json,application/json"
              className="sr-only"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleRestore(f); e.target.value = ''; }}
              disabled={restoreState === 'loading'}
            />
            {restoreState === 'loading' ? (
              <span className="w-3 h-3 rounded-full border border-white/30 border-t-white animate-spin" />
            ) : restoreState === 'success' ? (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            )}
            {restoreState === 'success' ? 'Restored!' : restoreState === 'error' ? 'Failed' : 'Upload'}
          </label>
        </div>

        {restoreState === 'error' && restoreError && (
          <p className="text-xs text-red-500 dark:text-red-400 px-1">{restoreError}</p>
        )}
        <p className="text-[11px] text-slate-400 dark:text-white/25 px-1 leading-relaxed">
          Restoring merges the backup with your existing data — existing transactions are overwritten if IDs match, new ones are added.
        </p>
      </div>
    </SettingsCard>
  );
}

function NotificationsSection() {
  const t = useTranslations('settings');
  const { notificationSettings, setNotificationSettings } = useSettings();
  const { impact } = useHaptics();
  const [permState, setPermState] = useState<NotifPermission | 'unknown'>('unknown');
  const [checking, setChecking] = useState(false);

  // Check permission on mount
  useEffect(() => {
    checkNotificationPermission().then(setPermState);
  }, []);

  const handleRequestPermission = useCallback(async () => {
    setChecking(true);
    const state = await requestNotificationPermission();
    setPermState(state);
    setChecking(false);
  }, []);

  function toggle(key: keyof typeof notificationSettings) {
    if (typeof notificationSettings[key] !== 'boolean') return;
    impact('light');
    setNotificationSettings({ [key]: !notificationSettings[key] });
  }

  const rows: { key: keyof typeof notificationSettings; label: string; desc: string }[] = [
    { key: 'dailyReminder',  label: t('dailyReminderLabel'),  desc: t('dailyReminderDesc') },
    { key: 'billReminders',  label: t('billRemindersLabel'),  desc: t('billRemindersDesc') },
    { key: 'monthlyRecap',   label: t('monthlyRecapLabel'),   desc: t('monthlyRecapDesc') },
    { key: 'weeklyDigest',   label: t('weeklyDigestLabel'),   desc: t('weeklyDigestDesc') },
    { key: 'budgetWarnings', label: t('budgetWarningsLabel'), desc: t('budgetWarningsDesc') },
  ];

  return (
    <SettingsCard
      title={t('notifications')}
      subtitle={t('notificationsDesc')}
      accent="bg-gradient-to-r from-sky-400 to-blue-500"
    >
      <div className="flex flex-col gap-5 mt-1">

        {/* Permission status */}
        {permState !== 'granted' && (
          <div className="flex items-center justify-between gap-4 p-3 rounded-2xl bg-sky-50 dark:bg-sky-900/20 border border-sky-200/60 dark:border-sky-400/15">
            <div>
              <p className="text-sm font-semibold text-sky-700 dark:text-sky-300">
                {permState === 'denied' ? t('notifBlocked') : t('notifRequired')}
              </p>
              <p className="text-xs text-sky-600/70 dark:text-sky-300/60 mt-0.5">
                {permState === 'denied'
                  ? t('notifBlockedDesc')
                  : t('notifRequiredDesc')}
              </p>
            </div>
            {permState !== 'denied' && (
              <button
                type="button"
                onClick={handleRequestPermission}
                disabled={checking}
                className="flex-shrink-0 h-10 px-3 rounded-2xl bg-sky-500 text-white text-xs font-bold hover:bg-sky-600 active:scale-[0.96] transition-all duration-100 shadow-[0_1px_3px_rgba(0,0,0,0.1)] disabled:opacity-50"
              >
                {checking ? '…' : t('notifAllow')}
              </button>
            )}
          </div>
        )}

        {/* Toggle rows */}
        {rows.map(({ key, label, desc }) => (
          <div key={key} className="native-row rounded-2xl flex items-center justify-between gap-4">
            <div>
              <p className={cn('text-sm font-semibold', permState !== 'granted' ? 'text-slate-400 dark:text-white/30' : 'text-slate-700 dark:text-white/80')}>
                {label}
              </p>
              <p className="text-xs text-slate-400 dark:text-white/35 mt-0.5">{desc}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={!!notificationSettings[key as keyof typeof notificationSettings]}
              disabled={permState !== 'granted'}
              onClick={() => toggle(key)}
              className={cn(
                'relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200',
                permState !== 'granted' ? 'opacity-40 cursor-not-allowed' : '',
                notificationSettings[key as keyof typeof notificationSettings]
                  ? 'bg-brand-primary'
                  : 'bg-slate-200 dark:bg-white/10',
              )}
            >
              <span
                className={cn(
                  'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200',
                  notificationSettings[key as keyof typeof notificationSettings] ? 'translate-x-5' : 'translate-x-0',
                )}
              />
            </button>
          </div>
        ))}

        {/* Daily reminder time picker — only shown when daily reminder is on */}
        {notificationSettings.dailyReminder && permState === 'granted' && (
          <div className="flex items-center justify-between gap-4 pl-1 border-l-2 border-brand-primary/30">
            <div>
              <p className="text-sm font-semibold text-slate-700 dark:text-white/80">{t('reminderTime')}</p>
              <p className="text-xs text-slate-400 dark:text-white/35 mt-0.5">{t('reminderTimeDesc')}</p>
            </div>
            <input
              type="time"
              value={`${String(notificationSettings.dailyHour).padStart(2, '0')}:${String(notificationSettings.dailyMinute).padStart(2, '0')}`}
              onChange={(e) => {
                const [h, m] = e.target.value.split(':').map(Number);
                if (!isNaN(h) && !isNaN(m)) {
                  setNotificationSettings({ dailyHour: h, dailyMinute: m });
                }
              }}
              className="h-11 px-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm text-slate-700 dark:text-white/80 outline-none focus:border-sky-400 flex-shrink-0 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)]"
            />
          </div>
        )}

      </div>
    </SettingsCard>
  );
}

// ─── Shell ────────────────────────────────────────────────────────────────────

type SettingsTab = 'general' | 'accounts' | 'household' | 'tags' | 'notifications' | 'data' | 'profile';

export function SettingsShell() {
  const t = useTranslations('settings');
  const { language, setLanguage } = useSettingsStore();
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');

  const tabs: { id: SettingsTab; label: string }[] = [
    { id: 'general',       label: t('tabGeneral') },
    { id: 'accounts',      label: t('tabAccounts') },
    { id: 'household',     label: t('tabHousehold') },
    { id: 'tags',          label: t('tabTags') },
    { id: 'notifications', label: t('tabNotifications') },
    { id: 'data',          label: t('tabData') },
    { id: 'profile',       label: t('tabProfile') },
  ];

  return (
    <AppLayout>
    <div className="min-h-screen bg-[#F4FDFB] dark:bg-[#011817]">
      {/* Ambient glow */}
      <div className="fixed top-0 inset-x-0 h-[480px] bg-gradient-to-b from-brand-primary/[0.06] via-brand-primary/[0.02] to-transparent dark:from-brand-primary/[0.08] dark:via-transparent dark:to-transparent pointer-events-none -z-10" />

      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/90 dark:bg-[#011817]/85 backdrop-blur-2xl border-b border-slate-200/70 dark:border-white/[0.05] shadow-[0_1px_0_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.03)]">
        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-brand-primary/40 dark:via-brand-primary/30 to-transparent" />

        {/* Title row */}
        <div className="px-4 sm:px-6 h-16 sm:h-14 flex items-center gap-3">
          <NavMenuButton />
          <MobileLogo />
          <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">{t('title')}</h1>
          </div>
          <Link
            href="/dashboard"
            className="lg:hidden ml-auto flex items-center gap-1.5 h-10 px-4 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm font-semibold text-slate-600 dark:text-white/60 hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-800 dark:hover:text-white active:scale-[0.96] transition-all duration-100"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Dashboard
          </Link>
        </div>

        {/* Tab bar */}
        <div className="overflow-x-auto scrollbar-none px-4 sm:px-6 pb-2.5">
          <div className="inline-flex gap-0.5 bg-black/[0.04] dark:bg-white/[0.06] rounded-2xl p-0.5">
            {tabs.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={cn(
                  'flex-shrink-0 h-8 px-4 rounded-xl text-xs select-none active:scale-[0.96] transition-all duration-100 whitespace-nowrap',
                  activeTab === id
                    ? 'bg-white dark:bg-white/15 text-brand-text dark:text-white font-bold shadow-[0_1px_3px_rgba(0,0,0,0.1)]'
                    : 'bg-transparent text-brand-text/50 dark:text-white/40 font-semibold',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-2 gap-5">

        {activeTab === 'general' && (
          <>
            <PreferencesSection />
            {/* Language */}
            <div className="rounded-3xl overflow-hidden bg-brand-card dark:bg-[#042F2E] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_1px_6px_rgba(25,27,47,0.05)]">
              <div className="h-[3px] w-full bg-gradient-to-r from-brand-primary to-teal-400" />
              <div className="px-6 pt-5 pb-3">
                <h2 className="text-base font-extrabold text-brand-text dark:text-white tracking-tight">{t('language')}</h2>
                <p className="text-xs text-slate-400 dark:text-white/35 mt-0.5">{t('languageDescription')}</p>
              </div>
              <div className="px-6 pb-6">
                <div className="flex flex-wrap gap-2">
                  {([
                    { lang: 'en', label: t('english') },
                    { lang: 'ro', label: t('romanian') },
                    { lang: 'es', label: t('spanish') },
                    { lang: 'fr', label: t('french') },
                    { lang: 'de', label: t('german') },
                    { lang: 'pl', label: t('polish') },
                  ] as const).map(({ lang, label }) => (
                    <button
                      key={lang}
                      onClick={() => setLanguage(lang)}
                      className={cn(
                        'h-10 px-4 rounded-2xl text-sm font-semibold border active:scale-[0.96] transition-all duration-100',
                        language === lang
                          ? 'bg-brand-primary text-white border-brand-primary shadow-sm'
                          : 'bg-white dark:bg-white/5 text-brand-text/55 dark:text-white/45 border-brand-primary/15 dark:border-white/10 hover:border-brand-primary/30',
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'accounts' && <AccountsSection />}

        {activeTab === 'household' && <HouseholdSharingSection />}

        {activeTab === 'tags' && <TagsSection />}

        {activeTab === 'notifications' && <NotificationsSection />}

        {activeTab === 'data' && (
          <>
            <TemplatesSection />
            <BackupSection />
          </>
        )}

        {activeTab === 'profile' && (
          <div className="lg:col-span-2 space-y-5">
            {/* Account info */}
            <div className="rounded-3xl overflow-hidden bg-brand-card dark:bg-[#042F2E] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_1px_6px_rgba(25,27,47,0.05)]">
              <div className="h-[3px] w-full bg-gradient-to-r from-brand-primary to-teal-400" />
              <div className="px-6 pt-5 pb-3">
                <h2 className="text-base font-extrabold text-brand-text dark:text-white tracking-tight">{t('tabProfile')}</h2>
              </div>
              <div className="px-6 pb-6">
                <UserBadge />
              </div>
            </div>

            {/* Danger zone */}
            <div className="rounded-3xl overflow-hidden bg-brand-card dark:bg-[#042F2E] border border-red-200 dark:border-red-900/40 shadow-[0_1px_6px_rgba(25,27,47,0.05)]">
              <div className="h-[3px] w-full bg-gradient-to-r from-red-500 to-rose-400" />
              <div className="px-6 pt-5 pb-3">
                <h2 className="text-base font-extrabold text-brand-text dark:text-white tracking-tight">{t('dangerZone')}</h2>
                <p className="text-xs text-slate-400 dark:text-white/35 mt-0.5">{t('dangerZoneDescription')}</p>
              </div>
              <div className="px-6 pb-6 flex flex-col gap-3">
                <div className="[&>div]:w-full [&>button]:w-full">
                  <ResetAllButton />
                </div>
                <div className="[&>button]:w-full">
                  <LogoutButton />
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
    </AppLayout>
  );
}
