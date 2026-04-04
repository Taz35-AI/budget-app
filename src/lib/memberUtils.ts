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

/**
 * Display format for an account in a shared household.
 * - Solo household, or the caller's own account: just "Barclays"
 * - Another member's account: "Barclays - Taz's account"
 */
export function accountDisplayName(
  account: BudgetAccount,
  myUserId: string | null | undefined,
  members: HouseholdMember[] | undefined,
): string {
  if (!myUserId || !members || members.length <= 1) return account.name;
  if (account.user_id === myUserId) return account.name;
  const m = members.find((m) => m.user_id === account.user_id);
  const name = m?.display_name ?? m?.email?.split('@')[0] ?? null;
  if (!name) return account.name;
  const possessive = name.endsWith('s') ? `${name}'` : `${name}'s`;
  return `${account.name} - ${possessive} account`;
}

/** Short display name for a member ("Taz" / "ana"). Null if unknown. */
export function memberShortName(
  userId: string,
  members: HouseholdMember[] | undefined,
): string | null {
  const m = members?.find((m) => m.user_id === userId);
  return m?.display_name ?? m?.email?.split('@')[0] ?? null;
}

/**
 * Groups a list of accounts by user_id. Returns groups ordered: caller's
 * own accounts first (key "__mine__"), then other members ordered by the
 * order they appear in `members`. Returns a single ungrouped entry in
 * solo households.
 */
export function groupAccountsByOwner<T extends { user_id: string }>(
  items: T[],
  myUserId: string | null | undefined,
  members: HouseholdMember[] | undefined,
): Array<{ userId: string; isMine: boolean; items: T[] }> {
  const hasHousehold = (members?.length ?? 0) > 1;
  if (!hasHousehold || !myUserId) {
    return items.length === 0 ? [] : [{ userId: myUserId ?? '', isMine: true, items }];
  }
  const mine: T[] = [];
  const othersByUser = new Map<string, T[]>();
  for (const it of items) {
    if (it.user_id === myUserId) {
      mine.push(it);
    } else {
      const arr = othersByUser.get(it.user_id) ?? [];
      arr.push(it);
      othersByUser.set(it.user_id, arr);
    }
  }
  const groups: Array<{ userId: string; isMine: boolean; items: T[] }> = [];
  if (mine.length > 0) groups.push({ userId: myUserId, isMine: true, items: mine });
  // Preserve household_members order for stable group ordering
  for (const m of members ?? []) {
    if (m.user_id === myUserId) continue;
    const g = othersByUser.get(m.user_id);
    if (g && g.length > 0) groups.push({ userId: m.user_id, isMine: false, items: g });
  }
  return groups;
}
