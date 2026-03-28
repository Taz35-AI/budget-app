import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Budget App — Personal Finance Tracker & Expense Manager',
  description:
    'Budget App is the personal finance tracker that lets you forecast your balance up to 7 years, manage recurring income and expenses, and take full control of your money — for free.',
  keywords: [
    'budget app',
    'personal finance tracker',
    'expense tracker',
    'income tracker',
    'budget planner',
    'money manager',
    'expense manager',
    'budget tool',
    'finance app',
    'balance forecast',
    'recurring expenses',
    'personal budgeting',
  ],
  authors: [{ name: 'Budget App' }],
  alternates: {
    canonical: 'https://budget-app.com',
  },
  openGraph: {
    type: 'website',
    url: 'https://budget-app.com',
    title: 'Budget App — Personal Finance Tracker & Expense Manager',
    description:
      'Track income and expenses, forecast your balance across 7 years, and take control of your personal finances — beautifully simple.',
    siteName: 'Budget App',
    images: [
      {
        url: 'https://budget-app.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Budget App — Personal Finance Tracker',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Budget App — Personal Finance Tracker & Expense Manager',
    description:
      'Track income and expenses, forecast your balance across 7 years, and take control of your personal finances — beautifully simple.',
    images: ['https://budget-app.com/og-image.png'],
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Budget App',
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'Web',
  url: 'https://budget-app.com',
  description:
    'Budget App is a personal finance tracker and expense manager that helps you plan, forecast, and control your finances across multiple accounts with a beautiful calendar-based dashboard.',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  featureList: [
    '7-year balance forecast',
    'Recurring income and expense tracking',
    'Multiple accounts support',
    'Calendar-based transaction view',
    'Budget planning',
    'Spending reports and analytics',
  ],
};

const FEATURES = [
  {
    title: '7-Year Balance Forecast',
    description:
      'See exactly where your money will be in months or years. Budget App projects your balance day-by-day based on all your recurring income and expenses.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
      </svg>
    ),
  },
  {
    title: 'Recurring Transactions',
    description:
      'Set up salaries, rent, subscriptions, and any repeating payment once. Budget App handles daily, weekly, monthly, quarterly, or annual frequencies automatically.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
      </svg>
    ),
  },
  {
    title: 'Multiple Accounts',
    description:
      'Manage current accounts, savings, credit cards, or any financial account in one place. Track balances independently and get the full picture at a glance.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 21z" />
      </svg>
    ),
  },
  {
    title: 'Reports & Analytics',
    description:
      'Understand your spending patterns with detailed reports. See income vs expenses by month, track categories, and spot where your money is really going.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
  },
  {
    title: 'Budget Planning',
    description:
      'Set monthly budgets for any spending category. Budget App tracks your progress in real time and alerts you before you overspend — giving you control, not just data.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    title: 'Private & Secure',
    description:
      "Your financial data is stored securely with bank-grade encryption. Budget App never sells or shares your data. What's yours stays yours.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
      </svg>
    ),
  },
];

const STEPS = [
  {
    step: '01',
    title: 'Create your free account',
    description: 'Sign up with just your email address. No credit card required, no hidden fees.',
  },
  {
    step: '02',
    title: 'Add your accounts',
    description: 'Create your bank accounts, savings pots, or credit cards — whatever you want to track.',
  },
  {
    step: '03',
    title: 'Enter your income & expenses',
    description: 'Add one-off transactions or set up recurring ones. Salary, rent, subscriptions — Budget App handles it all.',
  },
  {
    step: '04',
    title: 'See your financial future',
    description: "Watch your projected balance unfold across months and years. Know when you'll hit your goals — and when to cut back.",
  },
];

const FAQS = [
  {
    q: 'Is Budget App free to use?',
    a: 'Yes, Budget App is completely free. There are no subscriptions, no premium tiers, and no hidden charges.',
  },
  {
    q: 'How far ahead can I forecast my balance?',
    a: 'Budget App projects your balance up to 7 years into the future, day by day, based on all your recurring income and expenses.',
  },
  {
    q: 'Can I track multiple bank accounts?',
    a: 'Yes. You can add as many accounts as you need — current accounts, savings, credit cards, or anything else — and manage them all in one dashboard.',
  },
  {
    q: 'Is my financial data safe?',
    a: 'Absolutely. Your data is encrypted in transit and at rest, stored securely on Supabase infrastructure. We never sell or share your data with third parties.',
  },
  {
    q: 'Can I set up recurring transactions?',
    a: 'Yes. Budget App supports daily, weekly, bi-weekly, monthly, quarterly, semi-annual, and annual recurring transactions. You can also edit or delete just one occurrence or the entire series.',
  },
  {
    q: 'Does Budget App work on mobile?',
    a: 'Yes. Budget App is fully responsive and works beautifully on any device — phone, tablet, or desktop.',
  },
];

export default function LandingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen bg-[#0C1F1E] text-white">

        {/* ── Nav ─────────────────────────────────────────────────── */}
        <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0C1F1E]/95 backdrop-blur-sm">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <Link href="/" className="flex-shrink-0">
              <Image
                src="/budget-tool.png"
                alt="Budget App"
                width={140}
                height={56}
                className="h-8 w-auto"
                priority
              />
            </Link>
            <nav className="flex items-center gap-2">
              <Link
                href="/login"
                className="text-sm text-white/50 hover:text-white transition-colors px-3 py-1.5"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="text-sm font-semibold bg-[#3B7A78] hover:bg-[#4a9491] text-white rounded-xl px-4 py-1.5 transition-colors"
              >
                Get started free
              </Link>
            </nav>
          </div>
        </header>

        {/* ── Hero ────────────────────────────────────────────────── */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-20 pb-16 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#3B7A78]/40 bg-[#3B7A78]/10 text-[#5FAF6B] text-xs font-semibold tracking-wide mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-[#5FAF6B] animate-pulse" />
            Free personal finance tracker
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight mb-6">
            Know exactly where<br />
            <span className="text-[#3B7A78]">your money is going</span>
          </h1>

          <p className="text-lg sm:text-xl text-white/55 leading-relaxed max-w-2xl mx-auto mb-10">
            Budget App is the personal finance tracker that forecasts your balance up to{' '}
            <strong className="text-white/80 font-semibold">7 years ahead</strong>, tracks every recurring
            payment, and gives you a clear picture of your finances — all in one beautiful dashboard.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16">
            <Link
              href="/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#3B7A78] hover:bg-[#4a9491] text-white font-semibold text-base rounded-2xl px-8 py-3.5 transition-colors shadow-[0_4px_24px_rgba(59,122,120,0.35)]"
            >
              Start budgeting for free
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center text-base text-white/50 hover:text-white transition-colors px-4 py-3.5"
            >
              Already have an account? Sign in
            </Link>
          </div>

          {/* Hero visual */}
          <div className="relative rounded-2xl overflow-hidden border border-white/[0.07] shadow-[0_32px_64px_rgba(0,0,0,0.5)] bg-[#122928]">
            <div className="p-6 sm:p-10">
              <div className="flex flex-col gap-4">
                {/* Mock stat cards */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Monthly Income', value: '£4,200', color: '#5FAF6B' },
                    { label: 'Monthly Expenses', value: '£2,847', color: '#C65A5A' },
                    { label: 'Net This Month', value: '+£1,353', color: '#3B7A78' },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-[#0C1F1E]/70 rounded-xl border border-white/[0.07] px-3 py-3 text-left">
                      <p className="text-[10px] text-white/30 font-medium uppercase tracking-wider mb-1">{stat.label}</p>
                      <p className="text-lg sm:text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
                    </div>
                  ))}
                </div>
                {/* Mock balance chart */}
                <div className="bg-[#0C1F1E]/70 rounded-xl border border-white/[0.07] px-4 py-4">
                  <p className="text-xs text-white/30 font-medium mb-4">Projected balance — next 12 months</p>
                  <div className="flex items-end gap-1.5 h-20">
                    {[55, 62, 58, 70, 74, 68, 80, 85, 78, 90, 95, 100].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-sm opacity-80"
                        style={{
                          height: `${h}%`,
                          backgroundColor: i < 6 ? '#3B7A78' : '#5FAF6B',
                        }}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between mt-2">
                    {['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'].map((m) => (
                      <span key={m} className="text-[9px] text-white/20 flex-1 text-center">{m}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Trust bar ───────────────────────────────────────────── */}
        <section className="border-y border-white/[0.06] bg-white/[0.02] py-6">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-white/30 text-sm font-medium">
              {[
                'No credit card required',
                'Free forever',
                'Bank-grade encryption',
                'No ads, no tracking',
                'Works on any device',
              ].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 text-[#3B7A78] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                  </svg>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Features ────────────────────────────────────────────── */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 py-20">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Everything you need to manage your money
            </h2>
            <p className="text-white/50 text-lg max-w-xl mx-auto">
              A complete personal finance toolkit — without the complexity or the price tag.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="bg-[#122928] border border-white/[0.07] rounded-2xl p-6 hover:border-[#3B7A78]/40 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-[#3B7A78]/15 text-[#3B7A78] flex items-center justify-center mb-4">
                  {f.icon}
                </div>
                <h3 className="text-white font-semibold mb-2">{f.title}</h3>
                <p className="text-white/45 text-sm leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── How it works ────────────────────────────────────────── */}
        <section className="border-t border-white/[0.06] bg-white/[0.02] py-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Up and running in minutes
              </h2>
              <p className="text-white/50 text-lg max-w-xl mx-auto">
                No complicated setup. No bank connections required. Just you and your budget.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {STEPS.map((s) => (
                <div key={s.step} className="flex flex-col gap-3">
                  <div className="text-4xl font-bold text-[#3B7A78]/30 font-mono leading-none">{s.step}</div>
                  <h3 className="text-white font-semibold text-lg leading-snug">{s.title}</h3>
                  <p className="text-white/45 text-sm leading-relaxed">{s.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Privacy / Trust ─────────────────────────────────────── */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 py-20">
          <div className="bg-[#122928] border border-[#3B7A78]/20 rounded-3xl px-8 sm:px-12 py-12 flex flex-col lg:flex-row items-center gap-8">
            <div className="w-16 h-16 rounded-2xl bg-[#3B7A78]/15 flex items-center justify-center flex-shrink-0">
              <svg className="w-8 h-8 text-[#3B7A78]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Your data is yours. Full stop.</h2>
              <p className="text-white/50 leading-relaxed max-w-2xl">
                Budget App does not connect to your bank, does not sell your data, and does not run ads.
                Everything you enter is stored with bank-grade encryption on secure infrastructure.
                You can export or delete your data at any time, no questions asked.
              </p>
            </div>
          </div>
        </section>

        {/* ── FAQ ─────────────────────────────────────────────────── */}
        <section className="border-t border-white/[0.06] bg-white/[0.02] py-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Frequently asked questions
              </h2>
            </div>

            <div className="flex flex-col divide-y divide-white/[0.07]">
              {FAQS.map((faq) => (
                <div key={faq.q} className="py-6">
                  <h3 className="text-white font-semibold mb-2">{faq.q}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ─────────────────────────────────────────────────── */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 py-20">
          <div className="text-center">
            <div className="inline-flex flex-col items-center">
              <Image
                src="/budget-tool.png"
                alt="Budget App"
                width={180}
                height={72}
                className="h-14 w-auto mb-8"
              />
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Start your financial journey today
              </h2>
              <p className="text-white/50 text-lg mb-10 max-w-lg mx-auto">
                Join thousands of people who use Budget App to plan their finances, hit their savings goals, and stop wondering where their money went.
              </p>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 bg-[#3B7A78] hover:bg-[#4a9491] text-white font-semibold text-base rounded-2xl px-10 py-4 transition-colors shadow-[0_4px_24px_rgba(59,122,120,0.35)]"
              >
                Create your free account
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
              <p className="text-white/25 text-sm mt-4">Free forever. No credit card required.</p>
            </div>
          </div>
        </section>

        {/* ── Footer ──────────────────────────────────────────────── */}
        <footer className="border-t border-white/[0.06] py-10">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Image
                src="/budget-tool.png"
                alt="Budget App"
                width={100}
                height={40}
                className="h-6 w-auto opacity-40"
              />
              <span className="text-white/20 text-xs">© {new Date().getFullYear()} Budget App</span>
            </div>
            <nav className="flex items-center gap-5 text-xs text-white/30">
              <Link href="/terms" className="hover:text-white/60 transition-colors">Terms of Service</Link>
              <Link href="/privacy" className="hover:text-white/60 transition-colors">Privacy Policy</Link>
              <Link href="/login" className="hover:text-white/60 transition-colors">Sign in</Link>
            </nav>
          </div>
        </footer>

      </div>
    </>
  );
}
