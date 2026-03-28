import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Budget App | Personal Finance Tracker and Expense Manager',
  description:
    'Budget App is a personal finance tracker that forecasts your balance up to 7 years ahead, tracks recurring income and expenses, and helps you manage multiple accounts in one place.',
  keywords: [
    'budget app',
    'personal finance tracker',
    'expense tracker',
    'income tracker',
    'budget planner',
    'money manager',
    'expense manager',
    'personal budgeting',
    'finance app',
    'balance forecast',
    'recurring expense tracker',
    'monthly budget planner',
    'financial planning tool',
    'spending tracker',
    'household budget',
  ],
  alternates: { canonical: 'https://budget-app.com' },
  openGraph: {
    type: 'website',
    url: 'https://budget-app.com',
    title: 'Budget App | Personal Finance Tracker and Expense Manager',
    description:
      'Track income and expenses, forecast your balance up to 7 years ahead, and manage your personal finances across multiple accounts.',
    siteName: 'Budget App',
    images: [{ url: 'https://budget-app.com/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Budget App | Personal Finance Tracker and Expense Manager',
    description:
      'Track income and expenses, forecast your balance up to 7 years ahead, and manage your personal finances across multiple accounts.',
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
    'Budget App is a personal finance tracker and budget planner that helps you forecast your balance, track recurring expenses, and manage multiple accounts from one dashboard.',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};

const FEATURES = [
  {
    title: '7-Year Balance Forecast',
    body: 'See your projected balance day by day, months or years into the future. Budget App calculates the impact of every recurring income and expense automatically.',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
      </svg>
    ),
  },
  {
    title: 'Recurring Transaction Tracker',
    body: 'Set up salaries, rent, subscriptions, loan repayments and any repeating payment once. Budget App handles daily, weekly, monthly, quarterly and annual schedules.',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
      </svg>
    ),
  },
  {
    title: 'Multiple Account Management',
    body: 'Manage current accounts, savings, credit cards and investment accounts in one place. Track each account separately or view a combined overview.',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 21z" />
      </svg>
    ),
  },
  {
    title: 'Budget Planning by Category',
    body: 'Set monthly spending limits for any category. Track progress in real time and get alerted before you overspend. Personal budgeting made visual and simple.',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    title: 'Income and Expense Reports',
    body: 'Understand your spending habits with monthly reports. Compare income versus expenses, analyse by category, and find exactly where your money goes each month.',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
  },
  {
    title: 'Private and Secure',
    body: 'Your financial data is encrypted in transit and at rest. Budget App never sells or shares your data. No advertising, no tracking, no third-party access.',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
      </svg>
    ),
  },
];

const FAQS = [
  {
    q: 'How far ahead can Budget App forecast my balance?',
    a: 'Budget App projects your balance up to 7 years into the future, day by day, based on all your recurring income and expenses.',
  },
  {
    q: 'Can I track multiple bank accounts?',
    a: 'Yes. Add as many accounts as you need, including current accounts, savings, credit cards and more. View each one separately or see a combined balance across all accounts.',
  },
  {
    q: 'What types of recurring transactions are supported?',
    a: 'Budget App supports daily, weekly, bi-weekly, monthly, quarterly, semi-annual and annual recurring transactions. You can also edit or delete a single occurrence without affecting the rest of the series.',
  },
  {
    q: 'Is my financial data secure?',
    a: 'Yes. All data is encrypted in transit and at rest, stored on secure infrastructure. Budget App never sells or shares your data with any third party.',
  },
  {
    q: 'Does Budget App work on mobile?',
    a: 'Yes. Budget App is fully responsive and works on any device. On mobile and tablet you can swipe the calendar to navigate between months.',
  },
  {
    q: 'Do I need to connect my bank account?',
    a: 'No. Budget App does not connect to your bank. You enter your transactions manually, which keeps your banking credentials completely private.',
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

        {/* Nav */}
        <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0C1F1E]/95 backdrop-blur-sm">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <Link href="/" className="flex-shrink-0">
              <Image src="/budget-tool.png" alt="Budget App" width={130} height={52} className="h-8 w-auto" priority />
            </Link>
            <nav className="flex items-center gap-2">
              <Link href="/login" className="text-sm text-white/50 hover:text-white transition-colors px-3 py-1.5">
                Sign in
              </Link>
              <Link
                href="/signup"
                className="text-sm font-semibold bg-[#3B7A78] hover:bg-[#4a9491] text-white rounded-xl px-4 py-1.5 transition-colors"
              >
                Get started
              </Link>
            </nav>
          </div>
        </header>

        {/* Hero */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-20 pb-20 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight mb-5">
            The personal finance tracker<br className="hidden sm:block" />
            <span className="text-[#3B7A78]"> built around your future</span>
          </h1>

          <p className="text-lg sm:text-xl text-white/55 leading-relaxed max-w-2xl mx-auto mb-10">
            Budget App tracks your income and expenses, forecasts your balance up to
            <strong className="text-white/80 font-semibold"> 7 years ahead</strong>, and gives you
            a clear picture of your finances across every account you own.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#3B7A78] hover:bg-[#4a9491] text-white font-semibold text-base rounded-2xl px-8 py-3.5 transition-colors shadow-[0_4px_24px_rgba(59,122,120,0.35)]"
            >
              Start tracking your budget
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
            <Link href="/login" className="w-full sm:w-auto text-base text-white/45 hover:text-white transition-colors px-4 py-3.5 text-center">
              Already have an account? Sign in
            </Link>
          </div>
        </section>

        {/* Trust signals */}
        <section className="border-y border-white/[0.06] bg-[#122928]/60 py-5">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-white/30 text-sm font-medium">
              {[
                'No bank connection required',
                'Bank-grade encryption',
                'No ads or tracking',
                'Works on any device',
                'Data stays yours',
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

        {/* Features */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 py-20">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              A complete personal finance toolkit
            </h2>
            <p className="text-white/50 text-lg max-w-xl mx-auto">
              Everything you need to plan, track and manage your money in one budget app.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="bg-[#122928] border border-white/[0.07] rounded-2xl p-6 hover:border-[#3B7A78]/40 transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-[#3B7A78]/15 text-[#3B7A78] flex items-center justify-center mb-4">
                  {f.icon}
                </div>
                <h3 className="text-white font-semibold mb-2 text-[15px]">{f.title}</h3>
                <p className="text-white/45 text-sm leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="border-t border-white/[0.06] bg-[#122928]/40 py-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Up and running in minutes</h2>
              <p className="text-white/50 text-lg max-w-xl mx-auto">
                No complicated setup. No bank connection. Just you and your budget.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { n: '01', title: 'Create your account', body: 'Sign up with your email address. No credit card needed.' },
                { n: '02', title: 'Add your accounts', body: 'Create your bank accounts, savings pots or credit cards to track.' },
                { n: '03', title: 'Enter your transactions', body: 'Add one-off or recurring income and expenses. Salary, rent, subscriptions and more.' },
                { n: '04', title: 'See your financial future', body: 'Watch your projected balance grow across months and years. Know exactly where you stand.' },
              ].map((s) => (
                <div key={s.n} className="flex flex-col gap-3">
                  <div className="text-4xl font-bold text-[#3B7A78]/25 font-mono leading-none">{s.n}</div>
                  <h3 className="text-white font-semibold text-lg leading-snug">{s.title}</h3>
                  <p className="text-white/45 text-sm leading-relaxed">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 py-20">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Frequently asked questions</h2>
          </div>

          <div className="flex flex-col divide-y divide-white/[0.07]">
            {FAQS.map((faq) => (
              <div key={faq.q} className="py-6">
                <h3 className="text-white font-semibold mb-2">{faq.q}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-white/[0.06] bg-[#122928]/40 py-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
            <Image src="/budget-tool.png" alt="Budget App" width={160} height={64} className="h-12 w-auto mx-auto mb-8" />
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Take control of your money today
            </h2>
            <p className="text-white/50 text-lg mb-10 max-w-lg mx-auto">
              Join people who use Budget App to plan their finances, track their spending, and hit their savings goals.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 bg-[#3B7A78] hover:bg-[#4a9491] text-white font-semibold text-base rounded-2xl px-10 py-4 transition-colors shadow-[0_4px_24px_rgba(59,122,120,0.35)]"
            >
              Create your account
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/[0.06] py-10">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Image src="/budget-tool.png" alt="Budget App" width={90} height={36} className="h-5 w-auto opacity-35" />
              <span className="text-white/20 text-xs">&copy; {new Date().getFullYear()} Budget App</span>
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
