'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSettings } from '@/hooks/useSettings';
import { AppLayout } from '@/components/layout/AppLayout';
import { NavMenuButton } from '@/components/layout/NavSidebar';
import { TAGS, FREQUENCIES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { Frequency, CustomTag, RecurringTemplate } from '@/types';

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
    <div className="rounded-3xl overflow-hidden bg-white border border-slate-100 shadow-[0_2px_24px_rgba(0,0,0,0.06)] dark:bg-[#0d1629] dark:border-white/[0.05] dark:shadow-[0_4px_40px_rgba(0,0,0,0.5)]">
      <div className={cn('h-[3px] w-full', accent)} />
      <div className="px-6 pt-5 pb-3">
        <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">{title}</h2>
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
          className="w-7 h-7 rounded-full flex items-center justify-center transition-transform hover:scale-110 ring-2 ring-offset-2 ring-offset-white dark:ring-offset-[#0d1629]"
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
      className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
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
        'flex items-center gap-2 w-full h-10 px-3 rounded-xl border border-dashed border-slate-200 dark:border-white/10 text-sm text-slate-500 dark:text-white/40 transition-colors',
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
  const { customTags, addCustomTag, updateCustomTag, deleteCustomTag } = useSettings();
  const [showAdd, setShowAdd] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newColor, setNewColor] = useState(PRESET_COLORS[9]);
  const [editId, setEditId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editColor, setEditColor] = useState('');

  const handleAdd = () => {
    if (!newLabel.trim()) return;
    addCustomTag({ label: newLabel.trim(), color: newColor });
    setNewLabel('');
    setNewColor(PRESET_COLORS[9]);
    setShowAdd(false);
  };

  const startEdit = (tag: CustomTag) => {
    setEditId(tag.id);
    setEditLabel(tag.label);
    setEditColor(tag.color);
  };

  const saveEdit = () => {
    if (!editId || !editLabel.trim()) return;
    updateCustomTag(editId, { label: editLabel.trim(), color: editColor });
    setEditId(null);
  };

  return (
    <SettingsCard
      title="Tags & Categories"
      subtitle="Custom tags appear alongside built-in ones when adding transactions"
      accent="bg-gradient-to-r from-violet-500 to-indigo-500"
    >
      {/* Built-in */}
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-white/30 mb-2">
        Built-in (read-only)
      </p>
      <div className="flex flex-wrap gap-1.5 mb-5">
        {Object.entries(TAGS).map(([key, { label, color }]) => (
          <span key={key} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: color }}>
            {label}
          </span>
        ))}
      </div>

      {/* Custom */}
      {customTags.length > 0 && (
        <>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-white/30 mb-2">Custom</p>
          <div className="flex flex-col gap-2 mb-4">
            {customTags.map((tag) => (
              <div key={tag.id}>
                {editId === tag.id ? (
                  <div className="flex flex-col gap-3 p-4 rounded-xl border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50/40 dark:bg-indigo-900/10">
                    <input
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm text-slate-800 dark:text-white outline-none focus:border-indigo-400"
                    />
                    <ColorPicker value={editColor} onChange={setEditColor} />
                    <div className="flex gap-2">
                      <button type="button" onClick={saveEdit} className="flex-1 h-9 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold transition-colors">Save</button>
                      <button type="button" onClick={() => setEditId(null)} className="px-4 h-9 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/60 text-sm font-semibold transition-colors">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-slate-100 dark:border-white/[0.05] hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors group">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: tag.color }} />
                    <span className="flex-1 text-sm font-medium text-slate-700 dark:text-white/80">{tag.label}</span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => startEdit(tag)}
                        className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-white/70 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <TrashBtn onClick={() => deleteCustomTag(tag.id)} />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Add new */}
      {showAdd ? (
        <div className="flex flex-col gap-3 p-4 rounded-xl border border-dashed border-indigo-300 dark:border-indigo-500/30 bg-indigo-50/40 dark:bg-indigo-900/10">
          <input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Tag name (e.g. Groceries)"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            className="w-full h-9 px-3 rounded-lg bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 outline-none focus:border-indigo-400"
          />
          <ColorPicker value={newColor} onChange={setNewColor} />
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: newColor }}>
              {newLabel || 'Preview'}
            </span>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={handleAdd} className="flex-1 h-9 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold transition-colors">
              Add tag
            </button>
            <button type="button" onClick={() => setShowAdd(false)} className="px-4 h-9 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/60 text-sm font-semibold transition-colors">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <AddRowBtn
          label="Add custom tag"
          accentHover="hover:border-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-400"
          onClick={() => setShowAdd(true)}
        />
      )}
    </SettingsCard>
  );
}

// ─── Templates section ────────────────────────────────────────────────────────

function TemplatesSection() {
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
      title="Quick Templates"
      subtitle="One-tap to pre-fill the transaction form with saved details"
      accent="bg-gradient-to-r from-sky-400 to-cyan-500"
    >
      {templates.length === 0 && !showAdd && (
        <p className="text-sm text-slate-400 dark:text-white/30 mb-4">No templates yet.</p>
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
                  {tmpl.tag && allTags[tmpl.tag] ? ` · ${allTags[tmpl.tag].label}` : ''}
                </p>
              </div>
              <TrashBtn onClick={() => deleteTemplate(tmpl.id)} />
            </div>
          ))}
        </div>
      )}

      {showAdd ? (
        <div className="flex flex-col gap-3 p-4 rounded-xl border border-dashed border-sky-300 dark:border-sky-500/30 bg-sky-50/40 dark:bg-sky-900/10">
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
            className="w-full h-9 px-3 rounded-lg bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 outline-none focus:border-sky-400" />
          <input type="number" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            placeholder="Amount" min="0" step="0.01"
            className="w-full h-9 px-3 rounded-lg bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 outline-none focus:border-sky-400" />
          {form.type === 'recurring' && (
            <select value={form.frequency} onChange={(e) => setForm((f) => ({ ...f, frequency: e.target.value as Frequency }))}
              className="w-full h-9 px-3 rounded-lg bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm text-slate-800 dark:text-white outline-none focus:border-sky-400">
              {Object.entries(FREQUENCIES).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
            </select>
          )}
          {/* Tag picker */}
          <div className="flex flex-wrap gap-1.5">
            <button type="button" onClick={() => setForm((f) => ({ ...f, tag: '' }))}
              className={cn('px-2.5 py-1 rounded-lg text-xs font-medium border transition-all',
                !form.tag ? 'bg-slate-800 text-white border-slate-800 dark:bg-white dark:text-slate-900 dark:border-white' : 'border-slate-200 dark:border-white/10 text-slate-500 dark:text-white/40 bg-white dark:bg-white/5',
              )}>
              None
            </button>
            {Object.entries(allTags).map(([key, { label, color }]) => (
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
            <button type="button" onClick={handleAdd} className="flex-1 h-9 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold transition-colors">Save template</button>
            <button type="button" onClick={() => setShowAdd(false)} className="px-4 h-9 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/60 text-sm font-semibold transition-colors">Cancel</button>
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
  const { firstDayOfWeek, dateFormat, setFirstDayOfWeek, setDateFormat } = useSettings();

  return (
    <SettingsCard
      title="Preferences"
      subtitle="Calendar layout and date display settings"
      accent="bg-gradient-to-r from-amber-400 to-orange-400"
    >
      <div className="flex flex-col gap-5 mt-1">
        {/* First day of week */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-700 dark:text-white/80">Week starts on</p>
            <p className="text-xs text-slate-400 dark:text-white/35 mt-0.5">First column in the calendar grid</p>
          </div>
          <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 flex-shrink-0">
            {([{ label: 'Mon', value: 1 as const }, { label: 'Sun', value: 0 as const }]).map(({ label, value }) => (
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
            <p className="text-sm font-semibold text-slate-700 dark:text-white/80">Date format</p>
            <p className="text-xs text-slate-400 dark:text-white/35 mt-0.5">How dates appear in the app</p>
          </div>
          <select
            value={dateFormat}
            onChange={(e) => setDateFormat(e.target.value as 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD')}
            className="h-9 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm text-slate-700 dark:text-white/80 outline-none focus:border-indigo-400 flex-shrink-0"
          >
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
          </select>
        </div>
      </div>
    </SettingsCard>
  );
}

// ─── Savings Goals section ────────────────────────────────────────────────────

function GoalsSection() {
  const { goals, addGoal, updateGoal, deleteGoal } = useSettings();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', target: '', currentSaved: '', deadline: '' });
  const [editId, setEditId] = useState<string | null>(null);
  const [editSaved, setEditSaved] = useState('');

  const handleAdd = () => {
    const target = Number(form.target);
    if (!form.name.trim() || !target || target <= 0) return;
    addGoal({ name: form.name.trim(), targetAmount: target, currentSaved: Number(form.currentSaved) || 0, deadline: form.deadline || undefined });
    setForm({ name: '', target: '', currentSaved: '', deadline: '' });
    setShowAdd(false);
  };

  const handleUpdateSaved = (id: string) => {
    updateGoal(id, { currentSaved: Number(editSaved) || 0 });
    setEditId(null);
  };

  return (
    <SettingsCard
      title="Savings Goals"
      subtitle="Set targets and track progress towards your financial goals"
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
                <div className="flex justify-between text-xs text-slate-500 dark:text-white/40 mb-3">
                  <span>{Math.round(pct * 100)}% · {goal.currentSaved.toLocaleString()} / {goal.targetAmount.toLocaleString()}</span>
                  {pct < 1 && <span>{remaining.toLocaleString()} remaining</span>}
                </div>
                {editId === goal.id ? (
                  <div className="flex gap-2">
                    <input type="number" value={editSaved} onChange={(e) => setEditSaved(e.target.value)}
                      placeholder="Amount saved so far" autoFocus
                      className="flex-1 h-8 px-2 rounded-lg bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 outline-none focus:border-emerald-400" />
                    <button type="button" onClick={() => handleUpdateSaved(goal.id)} className="px-3 h-8 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold transition-colors">Save</button>
                    <button type="button" onClick={() => setEditId(null)} className="px-2 h-8 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-white/50 text-xs transition-colors">✕</button>
                  </div>
                ) : (
                  <button type="button" onClick={() => { setEditId(goal.id); setEditSaved(goal.currentSaved.toString()); }}
                    className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
                    Update saved amount
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showAdd ? (
        <div className="flex flex-col gap-3 p-4 rounded-xl border border-dashed border-emerald-300 dark:border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-900/10">
          <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Goal name (e.g. Holiday fund)" autoFocus
            className="w-full h-9 px-3 rounded-lg bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 outline-none focus:border-emerald-400" />
          <input type="number" value={form.target} onChange={(e) => setForm((f) => ({ ...f, target: e.target.value }))}
            placeholder="Target amount" min="0"
            className="w-full h-9 px-3 rounded-lg bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 outline-none focus:border-emerald-400" />
          <input type="number" value={form.currentSaved} onChange={(e) => setForm((f) => ({ ...f, currentSaved: e.target.value }))}
            placeholder="Already saved (optional)" min="0"
            className="w-full h-9 px-3 rounded-lg bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 outline-none focus:border-emerald-400" />
          <div>
            <p className="text-xs text-slate-500 dark:text-white/40 mb-1">Deadline (optional)</p>
            <input type="date" value={form.deadline} onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
              className="w-full h-9 px-3 rounded-lg bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm text-slate-800 dark:text-white outline-none focus:border-emerald-400" />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={handleAdd} className="flex-1 h-9 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold transition-colors">Add goal</button>
            <button type="button" onClick={() => setShowAdd(false)} className="px-4 h-9 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/60 text-sm font-semibold transition-colors">Cancel</button>
          </div>
        </div>
      ) : (
        <AddRowBtn label="Add savings goal" accentHover="hover:border-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-400" onClick={() => setShowAdd(true)} />
      )}
    </SettingsCard>
  );
}

// ─── Shell ────────────────────────────────────────────────────────────────────

export function SettingsShell() {
  return (
    <AppLayout>
    <div className="min-h-screen bg-[#edf1f9] dark:bg-[#050911]">
      {/* Ambient glow */}
      <div className="fixed top-0 inset-x-0 h-[480px] bg-gradient-to-b from-indigo-100/60 via-violet-50/20 to-transparent dark:from-indigo-950/25 dark:via-transparent dark:to-transparent pointer-events-none -z-10" />

      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/90 dark:bg-[#050911]/85 backdrop-blur-2xl border-b border-slate-200/70 dark:border-white/[0.05] shadow-[0_1px_0_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.03)]">
        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 dark:via-indigo-400/40 to-transparent" />
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-3">
          {/* Hamburger — mobile only */}
          <NavMenuButton />

          {/* Page title — mobile only */}
          <h1 className="lg:hidden text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">Settings</h1>
          {/* Page title — desktop only */}
          <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">Settings</h1>
          </div>
          {/* Back button — mobile only (desktop uses sidebar) */}
          <Link
            href="/dashboard"
            className="lg:hidden flex items-center gap-1.5 h-9 px-4 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm font-semibold text-slate-600 dark:text-white/60 hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-800 dark:hover:text-white transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Dashboard
          </Link>
        </div>
      </header>

      {/* Content — 2 columns on lg+ */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-2 gap-5">
        <TagsSection />
        <TemplatesSection />
        <PreferencesSection />
        <GoalsSection />
      </div>
    </div>
    </AppLayout>
  );
}
