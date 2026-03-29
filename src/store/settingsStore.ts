import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TAGS } from '@/lib/constants';
import type { CustomTag, RecurringTemplate, SavingsGoal, DateFormat, Account, TagBudget } from '@/types';
import { DEFAULT_NOTIFICATION_SETTINGS } from '@/lib/notificationScheduler';
import type { NotificationSettings } from '@/lib/notificationScheduler';

export type AppLanguage = 'en' | 'ro' | 'es';

interface SettingsState {
  customTags: CustomTag[];
  hiddenBuiltinTags: string[];
  templates: RecurringTemplate[];
  goals: SavingsGoal[];
  accounts: Account[];
  tagBudgets: TagBudget[];
  firstDayOfWeek: 0 | 1;
  dateFormat: DateFormat;
  hapticsEnabled: boolean;
  notificationSettings: NotificationSettings;
  language: AppLanguage;
  // Actions
  _hydrate: (data: Partial<Omit<SettingsState, '_hydrate'>>) => void;
  addCustomTag: (tag: Omit<CustomTag, 'id'>) => void;
  updateCustomTag: (id: string, patch: Partial<Omit<CustomTag, 'id'>>) => void;
  deleteCustomTag: (id: string) => void;
  overrideBuiltinTag: (id: string, patch: { label: string; color: string }) => void;
  hideBuiltinTag: (id: string) => void;
  unhideBuiltinTag: (id: string) => void;
  addTemplate: (tpl: Omit<RecurringTemplate, 'id'>) => void;
  deleteTemplate: (id: string) => void;
  addGoal: (goal: Omit<SavingsGoal, 'id'>) => void;
  updateGoal: (id: string, patch: Partial<Omit<SavingsGoal, 'id'>>) => void;
  deleteGoal: (id: string) => void;
  addAccount: (account: Omit<Account, 'id'>) => void;
  updateAccount: (id: string, patch: Partial<Omit<Account, 'id'>>) => void;
  deleteAccount: (id: string) => void;
  setTagBudget: (tagId: string, monthlyLimit: number | null) => void;
  setFirstDayOfWeek: (day: 0 | 1) => void;
  setDateFormat: (fmt: DateFormat) => void;
  setHapticsEnabled: (enabled: boolean) => void;
  setNotificationSettings: (patch: Partial<NotificationSettings>) => void;
  setLanguage: (lang: AppLanguage) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      customTags: [],
      hiddenBuiltinTags: [],
      templates: [],
      goals: [],
      accounts: [],
      tagBudgets: [],
      firstDayOfWeek: 1,
      dateFormat: 'DD/MM/YYYY',
      hapticsEnabled: true,
      notificationSettings: DEFAULT_NOTIFICATION_SETTINGS,
      language: 'en',

      _hydrate: (data) => set((s) => ({ ...s, ...data })),

      addCustomTag: (tag) =>
        set((s) => ({ customTags: [...s.customTags, { ...tag, id: crypto.randomUUID() }] })),
      updateCustomTag: (id, patch) =>
        set((s) => ({ customTags: s.customTags.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),
      deleteCustomTag: (id) =>
        set((s) => ({ customTags: s.customTags.filter((t) => t.id !== id) })),
      overrideBuiltinTag: (id, patch) =>
        set((s) => {
          const exists = s.customTags.some((t) => t.id === id);
          if (exists) {
            return { customTags: s.customTags.map((t) => (t.id === id ? { ...t, ...patch } : t)) };
          }
          const builtinCategory = TAGS[id]?.category ?? 'both';
          return { customTags: [...s.customTags, { id, category: builtinCategory, ...patch }] };
        }),
      hideBuiltinTag: (id) =>
        set((s) => ({
          hiddenBuiltinTags: s.hiddenBuiltinTags.includes(id)
            ? s.hiddenBuiltinTags
            : [...s.hiddenBuiltinTags, id],
        })),
      unhideBuiltinTag: (id) =>
        set((s) => ({ hiddenBuiltinTags: s.hiddenBuiltinTags.filter((i) => i !== id) })),

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

      addAccount: (account) =>
        set((s) => ({ accounts: [...s.accounts, { ...account, id: crypto.randomUUID() }] })),
      updateAccount: (id, patch) =>
        set((s) => ({ accounts: s.accounts.map((a) => (a.id === id ? { ...a, ...patch } : a)) })),
      deleteAccount: (id) =>
        set((s) => ({ accounts: s.accounts.filter((a) => a.id !== id) })),

      setTagBudget: (tagId, monthlyLimit) =>
        set((s) => {
          if (monthlyLimit === null || monthlyLimit <= 0) {
            return { tagBudgets: s.tagBudgets.filter((b) => b.tagId !== tagId) };
          }
          const exists = s.tagBudgets.some((b) => b.tagId === tagId);
          if (exists) {
            return { tagBudgets: s.tagBudgets.map((b) => (b.tagId === tagId ? { ...b, monthlyLimit } : b)) };
          }
          return { tagBudgets: [...s.tagBudgets, { tagId, monthlyLimit }] };
        }),

      setFirstDayOfWeek: (day) => set({ firstDayOfWeek: day }),
      setDateFormat: (fmt) => set({ dateFormat: fmt }),
      setHapticsEnabled: (enabled) => set({ hapticsEnabled: enabled }),
      setNotificationSettings: (patch) =>
        set((s) => ({ notificationSettings: { ...s.notificationSettings, ...patch } })),
      setLanguage: (lang) => set({ language: lang }),
    }),
    { name: 'budgetapp_settings' },
  ),
);
