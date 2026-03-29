import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Budget App — Personal Finance Tracker & Balance Forecast',
  description: 'Track income and expenses, forecast your future balance day by day, manage multiple accounts and set savings goals. Free personal finance app for web and mobile.',
  keywords: [
    'budget app', 'personal finance tracker', 'balance forecast', 'expense tracker',
    'income tracker', 'budget planner', 'money manager', 'recurring expense tracker',
    'savings goals', 'monthly budget', 'financial planning', 'spending tracker',
  ],
  alternates: { canonical: 'https://budget-app.com' },
  openGraph: {
    type: 'website',
    url: 'https://budget-app.com',
    title: 'Budget App — Personal Finance Tracker & Balance Forecast',
    description: 'See your financial future day by day. Track income, expenses and savings goals across multiple accounts — free for web and mobile.',
    siteName: 'Budget App',
    images: [{ url: 'https://budget-app.com/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Budget App — Personal Finance Tracker & Balance Forecast',
    description: 'See your financial future day by day. Track income, expenses and savings goals across multiple accounts — free for web and mobile.',
    images: ['https://budget-app.com/og-image.png'],
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Budget App',
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'Web, Android, iOS',
  url: 'https://budget-app.com',
  description: 'Personal finance tracker that forecasts your future balance day by day, tracks recurring income and expenses, and helps you manage multiple accounts with savings goals.',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  featureList: [
    'Long-term balance forecast',
    'Recurring transaction tracking',
    'Multiple account management',
    'Savings goals',
    'Budget planning by category',
    'Income and expense reports',
    'CSV export',
    'Android and iOS app',
    'Dark mode',
    'Multi-language support',
  ],
};

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
          <div className="px-4 sm:px-6 h-14 flex items-center justify-between">
            <Link href="/" className="flex-shrink-0">
              <Image src="/budget-tool.png" alt="Budget App" width={390} height={156} className="h-24 w-auto" priority />
            </Link>
            <nav className="flex items-center gap-2">
              <Link href="/login" className="text-sm text-white/50 hover:text-white transition-colors px-3 py-1.5">
                Sign in
              </Link>
              <Link href="/signup" className="text-sm font-semibold bg-[#3B7A78] hover:bg-[#4a9491] text-white rounded-xl px-4 py-1.5 transition-colors">
                Get started free
              </Link>
            </nav>
          </div>
        </header>

        {/* Hero */}
        <section className="px-4 sm:px-6 pt-20 pb-16 text-center">
          <div className="inline-flex items-center gap-2 bg-[#3B7A78]/15 border border-[#3B7A78]/30 rounded-full px-4 py-1.5 text-sm text-[#3B7A78] font-medium mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3B7A78] animate-pulse"></span>
            Free during beta — early users keep free access forever
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight mb-6">
            See your financial future<br className="hidden sm:block" />
            <span className="text-[#3B7A78]"> before it happens</span>
          </h1>

          <p className="text-lg sm:text-xl text-white/55 leading-relaxed max-w-2xl mx-auto mb-10">
            Budget App tracks every penny you earn and spend, then forecasts your exact balance
            <strong className="text-white/80 font-semibold"> months and years ahead</strong> — day by day, account by account.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
            <Link
              href="/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#3B7A78] hover:bg-[#4a9491] text-white font-semibold text-base rounded-2xl px-8 py-3.5 transition-colors shadow-[0_4px_24px_rgba(59,122,120,0.35)]"
            >
              Start for free
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
            <Link href="/login" className="w-full sm:w-auto text-base text-white/40 hover:text-white transition-colors px-4 py-3.5 text-center">
              Already have an account? Sign in →
            </Link>
          </div>

          <p className="text-xs text-white/25">No credit card. No bank connection. No nonsense.</p>
        </section>

        {/* Trust bar */}
        <section className="border-y border-white/[0.06] bg-[#122928]/60 py-4">
          <div className="px-4 sm:px-6">
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-white/30 text-sm font-medium">
              {['Web + Android + iOS', 'No bank connection', 'Dark & light mode', 'Multi-language', 'Data encrypted at rest', 'Free forever for early users'].map((item) => (
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
        <section className="px-4 sm:px-6 py-20">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Everything your finances need</h2>
            <p className="text-white/50 text-lg max-w-xl mx-auto">Built for people who want real control — not just a pretty chart.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                title: 'Long-Term Balance Forecast',
                body: 'See your exact balance every single day, months and years into the future. Know the impact of every financial decision before you make it.',
                icon: <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />,
              },
              {
                title: 'Recurring Transactions',
                body: 'Add salary, rent, subscriptions, loan repayments once. Daily, weekly, monthly, annual — Budget App handles every schedule automatically.',
                icon: <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />,
              },
              {
                title: 'Multiple Accounts',
                body: 'Current account, savings, credit cards, investments — manage them all in one place with a combined or per-account view.',
                icon: <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 21z" />,
              },
              {
                title: 'Savings Goals',
                body: 'Set a target, link it to a tag, and watch your progress in real time. Budget App tells you exactly when you\'ll hit your goal.',
                icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />,
              },
              {
                title: 'Spending Reports',
                body: 'Monthly breakdowns by category, income vs expenses, top transactions. Understand exactly where your money goes every month.',
                icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />,
              },
              {
                title: 'Mobile App',
                body: 'Native Android and iOS app with haptic feedback, offline-ready, and the full desktop experience in your pocket.',
                icon: <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 8.25h3" />,
              },
            ].map((f) => (
              <div key={f.title} className="bg-[#122928] border border-white/[0.07] rounded-2xl p-6 hover:border-[#3B7A78]/40 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-[#3B7A78]/15 text-[#3B7A78] flex items-center justify-center mb-4">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>{f.icon}</svg>
                </div>
                <h3 className="text-white font-semibold mb-2 text-[15px]">{f.title}</h3>
                <p className="text-white/45 text-sm leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="border-t border-white/[0.06] bg-[#122928]/40 py-20">
          <div className="px-4 sm:px-6">
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Up and running in 3 minutes</h2>
              <p className="text-white/50 text-lg max-w-xl mx-auto">No bank connection. No complicated setup. Just your numbers.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {[
                { n: '01', title: 'Create your account', body: 'Sign up free with email or Google. No credit card required.' },
                { n: '02', title: 'Add accounts & transactions', body: 'Set up your bank accounts, then add recurring and one-off income and expenses.' },
                { n: '03', title: 'See your future balance', body: 'Instantly see your projected balance day by day — weeks, months, even years ahead.' },
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
        <section className="px-4 sm:px-6 py-20">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Common questions</h2>
          </div>

          <div className="flex flex-col divide-y divide-white/[0.07]">
            {[
              { q: 'Is Budget App really free?', a: 'Yes — completely free during beta. Sign up now and keep free access forever. We may introduce a paid plan for new users in the future, but early users are never charged.' },
              { q: 'Do I need to connect my bank account?', a: 'No. Budget App never connects to your bank. You enter transactions manually, keeping your banking credentials completely private.' },
              { q: 'How far ahead can it forecast my balance?', a: 'Months and years ahead, day by day. Every recurring income and expense is calculated automatically so you always know where your balance is heading.' },
              { q: 'Does it work on mobile?', a: 'Yes — there\'s a native Android and iOS app, plus the full web version works on any browser or device.' },
              { q: 'What currencies and languages are supported?', a: 'Budget App supports multiple currencies and is available in English, Romanian and Spanish. More languages coming.' },
              { q: 'Is my data safe?', a: 'All data is encrypted in transit and at rest. We never sell or share your data with anyone.' },
            ].map((faq) => (
              <div key={faq.q} className="py-6">
                <h3 className="text-white font-semibold mb-2">{faq.q}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-white/[0.06] bg-[#122928]/40 py-20">
          <div className="px-4 sm:px-6 text-center">
            <Image src="/budget-tool.png" alt="Budget App" width={160} height={64} className="h-12 w-auto mx-auto mb-8" />
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Stop guessing. Start knowing.</h2>
            <p className="text-white/50 text-lg mb-3 max-w-lg mx-auto">
              Join people using Budget App to track their finances and see their financial future clearly.
            </p>
            <p className="text-sm text-[#3B7A78] font-medium mb-10">Free during beta — early users keep free access forever.</p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 bg-[#3B7A78] hover:bg-[#4a9491] text-white font-semibold text-base rounded-2xl px-10 py-4 transition-colors shadow-[0_4px_24px_rgba(59,122,120,0.35)]"
            >
              Create your free account
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/[0.06] py-10">
          <div className="px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
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
