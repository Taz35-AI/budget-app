/**
 * tagIcons.ts
 *
 * Maps tag labels (or explicit slugs) to WebP icons stored in /public/tag-icons/.
 * Filenames are slug-cased (e.g. "Food & Drink" → "food-drink.webp"), 128×128,
 * quality 85 — average ~3KB each (down from ~80KB PNG sources in /assets/).
 *
 * For built-in tags the slug is derived from the English label automatically;
 * custom tags store an explicit `iconSlug` field on CustomTag.
 */

/** Every slug that has a matching PNG in /public/tag-icons/ */
export const AVAILABLE_TAG_ICONS = [
  'bank-fees', 'beauty-hair', 'benefits', 'bonus', 'business',
  'cashback', 'charity-donations', 'child-benefit', 'childcare',
  'clothing', 'commission', 'credit-card', 'crypto-gains',
  'dining-out', 'dividends', 'education', 'entertainment',
  'food-drink', 'freelance', 'gift-received', 'gifts',
  'government-grant', 'groceries', 'gym-fitness', 'health',
  'hobbies', 'home-maintenance', 'housing', 'inheritance',
  'insurance', 'insurance-payout', 'interest', 'investment',
  'loan-received', 'loan-repayment', 'maternity-paternity-pay',
  'mortgage', 'overtime-pay', 'parking-tolls', 'pension',
  'personal-care', 'pets', 'redundancy-pay', 'reimbursement',
  'rental-income', 'salary', 'scholarship', 'selling-items',
  'shopping', 'side-hustle', 'stock-options', 'subscriptions',
  'tax-refund', 'taxes', 'tech-gadgets', 'tips-gratuities',
  'transport', 'travel', 'utilities',
] as const;

export type TagIconSlug = typeof AVAILABLE_TAG_ICONS[number];

const ICON_SET: ReadonlySet<string> = new Set(AVAILABLE_TAG_ICONS);

/** "Food & Drink" → "food-drink"; "Maternity/Paternity Pay" → "maternity-paternity-pay" */
export function slugifyLabel(label: string): string {
  return label
    .toLowerCase()
    .replace(/ & /g, '-')
    .replace(/[\/\s]/g, '-')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Returns /public/tag-icons URL or null when no PNG matches */
export function getIconUrlFromSlug(slug: string | undefined | null): string | null {
  if (!slug) return null;
  return ICON_SET.has(slug) ? `/tag-icons/${slug}.webp` : null;
}

/** Resolves an icon URL for a tag.
 *  Priority: explicit slug → derived from label → null (caller falls back). */
export function resolveTagIcon(label: string, iconSlug?: string): string | null {
  return getIconUrlFromSlug(iconSlug) ?? getIconUrlFromSlug(slugifyLabel(label));
}
