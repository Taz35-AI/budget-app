'use client';

interface Props {
  onAddTransaction: () => void;
}

const STEPS = [
  {
    n: '1',
    title: 'Pick a day',
    desc: 'Click any date on the calendar to select it.',
  },
  {
    n: '2',
    title: 'Add a transaction',
    desc: 'Hit "Add transaction" and enter your income or expense.',
  },
  {
    n: '3',
    title: 'Watch your balance',
    desc: 'Your running balance projects across every day for 7 years.',
  },
];

export function OnboardingBanner({ onAddTransaction }: Props) {
  return (
    <div className="rounded-3xl overflow-hidden
      bg-white border border-slate-100 shadow-[0_2px_24px_rgba(0,0,0,0.06)]
      dark:bg-[#0d1629] dark:border-white/[0.05] dark:shadow-[0_4px_40px_rgba(0,0,0,0.5)]
      p-6 sm:p-8 flex flex-col items-center text-center gap-6">

      {/* Icon */}
      <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
        <svg className="w-7 h-7 text-indigo-500 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" />
        </svg>
      </div>

      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1.5">Welcome to BudgetTool</h2>
        <p className="text-sm text-slate-500 dark:text-white/40 max-w-xs">
          Your calendar is empty. Add your first transaction to start tracking your finances.
        </p>
      </div>

      {/* Steps */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full text-left">
        {STEPS.map((step) => (
          <div
            key={step.n}
            className="rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-100 dark:border-white/[0.06] p-4 flex flex-col gap-2"
          >
            <div className="w-6 h-6 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/15 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{step.n}</span>
            </div>
            <p className="text-sm font-semibold text-slate-800 dark:text-white/80">{step.title}</p>
            <p className="text-xs text-slate-500 dark:text-white/40 leading-relaxed">{step.desc}</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <button
        onClick={onAddTransaction}
        className="h-10 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors"
      >
        Add your first transaction
      </button>
    </div>
  );
}
