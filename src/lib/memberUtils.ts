import type { BudgetAccount, HouseholdMember } from '@/types';

const COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316',
  '#eab308', '#22c55e', '#14b8a6', '#3b82f6', '#a855f7',
];

export function memberColor(uid: string): string {
  let h = 0;
  for (let i = 0; i < uid.length; i++) h = ((h << 5) - h + uid.charCodeAt(i)) | 0;
  return COLORS[Math.abs(h) % COLORS.length];
}

export function accountDisplayName(
  account: BudgetAccount,
  myUserId: string | null | undefined,
  members: HouseholdMember[] | undefined,
): string {
  if (!myUserId || !members || members.length <= 1) return account.name;
  if (account.user_id === myUserId) return `Me \u00b7 ${account.name}`;
  const m = members.find((m) => m.user_id === account.user_id);
  const initial = (m?.display_name ?? m?.email ?? '?')[0].toUpperCase();
  return `${initial} \u00b7 ${account.name}`;
}
