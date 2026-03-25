import type { Transaction, TransactionException } from '@/types';

export interface ResolvedTransaction extends Transaction {
  active: boolean;
}

/**
 * Given a recurring transaction and all exceptions for it,
 * returns the effective version of the transaction on date D.
 * If the transaction is deleted (via exception) on or before D, active = false.
 */
export function resolveTransactionOnDate(
  transaction: Transaction,
  exceptions: TransactionException[],
  date: string, // YYYY-MM-DD
): ResolvedTransaction {
  // Find exceptions for this transaction effective on or before date D
  const relevant = exceptions
    .filter(
      (e) =>
        e.transaction_id === transaction.id &&
        e.effective_from <= date,
    )
    .sort((a, b) => b.effective_from.localeCompare(a.effective_from));

  // The most recent exception wins
  const exception = relevant[0];

  if (!exception) {
    return { ...transaction, active: true };
  }

  if (exception.is_deleted) {
    return { ...transaction, active: false };
  }

  return {
    ...transaction,
    name: exception.name ?? transaction.name,
    amount: exception.amount ?? transaction.amount,
    end_date: exception.end_date !== undefined ? exception.end_date : transaction.end_date,
    active: true,
  };
}
