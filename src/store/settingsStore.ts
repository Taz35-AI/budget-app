import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CustomTag, RecurringTemplate, SavingsGoal, DateFormat } from '@/types';

interface SettingsState {
  customTags: CustomTag[];
  templates: RecurringTemplate[];
  goals: SavingsGoal[];
  firstDayOfWeek: 0 | 1;
  dateFormat: DateFormat;
  // Actions
  _hydrate: (data: Partial<Omit<SettingsState, '_hydrate'>>) => void;
  addCustomTag: (tag: Omit<CustomTag, 'id'>) => void;
  updateCustomTag: (id: string, patch: Partial<Omit<CustomTag, 'id'>>) => void;
  deleteCustomTag: (id: string) => void;
  addTemplate: (tpl: Omit<RecurringTemplate, 'id'>) => void;
  deleteTemplate: (id: string) => void;
  addGoal: (goal: Omit<SavingsGoal, 'id'>) => void;
  updateGoal: (id: string, patch: Partial<Omit<SavingsGoal, 'id'>>) => void;
  deleteGoal: (id: string) => void;
  setFirstDayOfWeek: (day: 0 | 1) => void;
  setDateFormat: (fmt: DateFormat) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      customTags: [],
      templates: [],
      goals: [],
      firstDayOfWeek: 1,
      dateFormat: 'DD/MM/YYYY',

      _hydrate: (data) => set((s) => ({ ...s, ...data })),

      addCustomTag: (tag) =>
        set((s) => ({ customTags: [...s.customTags, { ...tag, id: crypto.randomUUID() }] })),
      updateCustomTag: (id, patch) =>
        set((s) => ({ customTags: s.customTags.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),
      deleteCustomTag: (id) =>
        set((s) => ({ customTags: s.customTags.filter((t) => t.id !== id) })),

      addTemplate: (tpl) =>
        set((s) => ({ templates: [...s.templates, { ...tpl, id: crypto.randomUUID() }] })),
      deleteTemplate: (id) =>
        set((s) => ({ templates: s.templates.filter((t) => t.id !== id) })),

      addGoal: (goal) =>
        set((s) => ({ goals: [...s.goals, { ...goal, id: crypto.randomUUID() }] })),
      updateGoal: (id, patch) =>
        set((s) => ({ goals: s.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)) })),
      deleteGoal: (id) =>
        set((s) => ({ goals: s.goals.filter((g) => g.id !== id) })),

      setFirstDayOfWeek: (day) => set({ firstDayOfWeek: day }),
      setDateFormat: (fmt) => set({ dateFormat: fmt }),
    }),
    { name: 'budgettool_settings' },
  ),
);
