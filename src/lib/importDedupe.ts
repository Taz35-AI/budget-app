/**
 * Duplicate detection for bulk imports.
 *
 * A bank CSV identifies a transaction only by what it shows: date, amount,
 * description, account. Re-importing the same statement must not double
 * everything up, so incoming rows are matched against what the household
 * already has.
 *
 * The match is by COUNT, not by presence. Two identical rows in one statement
 * (two coffees at the same place on the same day, two equal transfers) are two
 * real transactions. Treating the signature as a set, as this used to, kept
 * the first and silently dropped the rest as "duplicates". Here each existing
 * row cancels out at most one incoming row with the same signature:
 *
 *   existing: 0 coffees, incoming: 2  ->  import 2
 *   existing: 2 coffees, incoming: 2  ->  import 0   (same statement again)
 *   existing: 1 coffee,  incoming: 2  ->  import 1
 */

export interface ImportSignatureFields {
  type?: string | null;
  name?: string | null;
  amount?: number | string | null;
  date?: string | null;
  start_date?: string | null;
  frequency?: string | null;
  account_id?: string | null;
}

export function importSignature(r: ImportSignatureFields): string {
  const name = String(r.name ?? '').trim().toLowerCase();
  // Postgres returns NUMERIC as a number or a string depending on the client;
  // normalise both so "5", 5 and "5.00" compare equal.
  const numeric = Number(r.amount);
  const amount = Number.isFinite(numeric) ? numeric.toFixed(2) : String(r.amount ?? '');
  const acct = r.account_id ?? '';
  if (r.type === 'recurring') {
    return `recurring|${r.start_date ?? ''}|${amount}|${name}|${r.frequency ?? ''}|${acct}`;
  }
  return `one_off|${r.date ?? ''}|${amount}|${name}|${acct}`;
}

export interface DedupeResult<T> {
  /** Rows to insert, in their original order. */
  fresh: T[];
  /** How many incoming rows were already present. */
  duplicates: number;
}

export function dedupeAgainstExisting<T extends ImportSignatureFields>(
  existing: ImportSignatureFields[],
  incoming: T[],
): DedupeResult<T> {
  const remaining = new Map<string, number>();
  for (const row of existing) {
    const sig = importSignature(row);
    remaining.set(sig, (remaining.get(sig) ?? 0) + 1);
  }

  const fresh: T[] = [];
  let duplicates = 0;
  for (const row of incoming) {
    const sig = importSignature(row);
    const left = remaining.get(sig) ?? 0;
    if (left > 0) {
      remaining.set(sig, left - 1);
      duplicates += 1;
    } else {
      fresh.push(row);
    }
  }
  return { fresh, duplicates };
}
