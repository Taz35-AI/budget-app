import type { Mortgage } from '@/types';

export interface MortgageState {
  /** Fixed monthly payment (principal + interest) */
  monthlyPayment: number;
  /** Number of payments made so far, based on start_date and today */
  paymentsMade: number;
  /** Total payments for the full term */
  totalPayments: number;
  /** Balance remaining today */
  balanceRemaining: number;
  /** Total interest paid to date */
  interestPaidToDate: number;
  /** Total principal paid to date */
  principalPaidToDate: number;
  /** Payoff date (YYYY-MM-DD) = start_date + term_months */
  payoffDate: string;
  /** Next payment breakdown (based on balance remaining) */
  nextInterestPortion: number;
  nextPrincipalPortion: number;
  /** Total interest over the life of the loan (reference value) */
  totalInterestLifetime: number;
}

/**
 * Computes the fixed monthly payment for a standard amortizing loan.
 * Returns 0 if the loan is degenerate (zero principal or term).
 */
export function computeMonthlyPayment(
  principal: number,
  annualRate: number,
  termMonths: number,
): number {
  if (principal <= 0 || termMonths <= 0) return 0;
  if (annualRate === 0) return principal / termMonths;
  const r = annualRate / 12;
  const factor = Math.pow(1 + r, termMonths);
  return (principal * r * factor) / (factor - 1);
}

/**
 * Balance remaining after k fixed payments, given principal P, monthly
 * rate r, and full term n. Closed-form avoids iterating the schedule.
 */
function balanceAfterPayments(
  principal: number,
  annualRate: number,
  termMonths: number,
  paymentsMade: number,
): number {
  if (paymentsMade <= 0) return principal;
  if (paymentsMade >= termMonths) return 0;
  if (annualRate === 0) {
    const perPayment = principal / termMonths;
    return Math.max(0, principal - perPayment * paymentsMade);
  }
  const r = annualRate / 12;
  const termFactor = Math.pow(1 + r, termMonths);
  const paidFactor = Math.pow(1 + r, paymentsMade);
  // B_k = P * [(1+r)^n - (1+r)^k] / [(1+r)^n - 1]
  return Math.max(0, (principal * (termFactor - paidFactor)) / (termFactor - 1));
}

/**
 * Number of whole monthly payments between start_date and today (capped at term).
 * A payment is considered "made" for each month that has fully elapsed since the
 * start date. Today at or before start_date → 0 payments.
 */
function paymentsElapsed(startDate: string, termMonths: number, today: Date): number {
  const start = new Date(`${startDate}T00:00:00`);
  if (Number.isNaN(start.getTime())) return 0;
  if (today < start) return 0;
  const years = today.getFullYear() - start.getFullYear();
  const months = today.getMonth() - start.getMonth();
  const dayDiff = today.getDate() - start.getDate();
  let k = years * 12 + months + (dayDiff >= 0 ? 1 : 0);
  if (k < 0) k = 0;
  if (k > termMonths) k = termMonths;
  return k;
}

/** Returns YYYY-MM-DD for start_date plus termMonths months. */
function payoffDateOf(startDate: string, termMonths: number): string {
  const d = new Date(`${startDate}T00:00:00`);
  if (Number.isNaN(d.getTime())) return startDate;
  d.setMonth(d.getMonth() + termMonths);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Computes the full current state of a mortgage from its static inputs.
 * Pure function — no I/O, safe to run client or server.
 */
export function computeMortgageState(
  mortgage: Pick<Mortgage, 'principal' | 'interest_rate' | 'term_months' | 'start_date'>,
  today: Date = new Date(),
): MortgageState {
  const { principal, interest_rate, term_months, start_date } = mortgage;
  const monthlyPayment = computeMonthlyPayment(principal, interest_rate, term_months);
  const paymentsMade = paymentsElapsed(start_date, term_months, today);
  const balanceRemaining = balanceAfterPayments(principal, interest_rate, term_months, paymentsMade);
  const principalPaidToDate = principal - balanceRemaining;
  const interestPaidToDate = paymentsMade * monthlyPayment - principalPaidToDate;
  const r = interest_rate / 12;
  const nextInterestPortion = balanceRemaining * r;
  const nextPrincipalPortion = Math.max(0, monthlyPayment - nextInterestPortion);
  const totalInterestLifetime = term_months * monthlyPayment - principal;

  return {
    monthlyPayment,
    paymentsMade,
    totalPayments: term_months,
    balanceRemaining,
    interestPaidToDate: Math.max(0, interestPaidToDate),
    principalPaidToDate,
    payoffDate: payoffDateOf(start_date, term_months),
    nextInterestPortion,
    nextPrincipalPortion,
    totalInterestLifetime,
  };
}
