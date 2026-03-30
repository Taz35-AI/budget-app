export type TransactionCategory = 'income' | 'expense';
export type TransactionType = 'recurring' | 'one_off';
export type Frequency =
  | 'daily'
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'quarterly'
  | 'semiannual'
  | 'annual';

export type CurrencyCode =
  | 'GBP'
  | 'USD'
  | 'EUR'
  | 'CHF'
  | 'SEK'
  | 'NOK'
  | 'DKK'
  | 'PLN'
  | 'CZK'
  | 'HUF'
  | 'RON'
  | 'BGN'
  | 'HRK';

export interface Transaction {
  id: string;
  user_id: string;
  account_id?: string | null;
  parent_id?: string | null;
  transfer_id?: string | null;
  name: string;
  amount: number;
  category: TransactionCategory;
  type: TransactionType;
  tag?: string | null;
  // one_off
  date?: string | null;
  // recurring
  start_date?: string | null;
  end_date?: string | null;
  frequency?: Frequency | null;
  created_at: string;
  updated_at: string;
}

export interface TransactionException {
  id: string;
  transaction_id: string;
  effective_from: string;
  name?: string | null;
  amount?: number | null;
  end_date?: string | null;
  is_deleted: boolean;
  created_at: string;
}

export interface BalanceReset {
  id: string;
  user_id: string;
  reset_date: string;
  created_at: string;
}

export interface DailyBalanceCache {
  user_id: string;
  date: string;
  balance: number;
  computed_at: string;
}

// Resolved transaction for display on a specific day
export interface DayTransaction {
  id: string;
  transaction_id: string;
  account_id?: string | null;
  parent_id?: string | null;
  name: string;
  amount: number;
  category: TransactionCategory;
  type: TransactionType;
  tag?: string | null;
  frequency?: Frequency | null;
  is_exception: boolean;
  start_date?: string | null;
  end_date?: string | null;
}

export interface DayData {
  date: string; // YYYY-MM-DD
  balance: number;
  transactions: DayTransaction[];
  netChange: number;
}

export interface TransactionFormValues {
  name: string;
  amount: string;
  category: TransactionCategory;
  type: TransactionType;
  tag?: string;
  date?: string;
  start_date?: string;
  end_date?: string;
  frequency?: Frequency;
  account_id?: string | null;
  // Used only for recurring date-change edits (all_future split / this_only move)
  newDate?: string;
}

// ─── Settings types ───────────────────────────────────────────────────────────

export type DateFormat = 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
export type TagCategory = 'income' | 'expense' | 'both';

export interface CustomTag {
  id: string;             // stored as tag value on transactions
  label: string;
  color: string;
  category: TagCategory;  // determines which transaction types this tag appears on
}

export interface RecurringTemplate {
  id: string;
  name: string;
  amount: number;
  category: TransactionCategory;
  type: TransactionType;
  tag?: string;
  frequency?: Frequency;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentSaved: number;
  deadline?: string;     // YYYY-MM-DD
  linkedTagId?: string;  // when set, progress is computed from matching income transactions
}

export type AccountType = 'checking' | 'savings' | 'credit';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  note?: string;
}

// Supabase-backed account for multi-account dashboard support
export interface BudgetAccount {
  id: string;
  user_id: string;
  name: string;
  type: AccountType;
  credit_limit?: number | null;
  created_at: string;
  updated_at: string;
}

export interface TagBudget {
  tagId: string;
  monthlyLimit: number;
}
