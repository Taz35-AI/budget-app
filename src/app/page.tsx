import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Spentum — Shared Household Budget App',
  description: 'Track expenses, forecast your balance, and share one budget with your whole household. Up to 10 accounts per person, unlimited household members, CSV bank import, recurring transactions, detailed reports. Free during beta.',
  keywords: [
    'spentum', 'household budget app', 'shared budget', 'personal finance tracker',
    'csv bank import', 'recurring transactions', 'family budget', 'expense tracker',
    'balance forecast', 'budget planner', 'couples budget', 'household finance',
  ],
  alternates: { canonical: 'https://www.spentum.com' },
  openGraph: {
    type: 'website',
    url: 'https://www.spentum.com',
    title: 'Spentum — Shared Household Budget App',
    description: 'Track expenses, forecast your balance, and share one budget with your whole household. CSV import, recurring transactions, detailed reports.',
    siteName: 'Spentum',
    images: [{ url: 'https://www.spentum.com/spentum.png', width: 1200, height: 400 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Spentum — Shared Household Budget App',
    description: 'Track expenses, forecast your balance, and share one budget with your whole household.',
    images: ['https://www.spentum.com/spentum.png'],
  },
};

// Colours sourced from app's globals.css palette
const T = {
  primary: '#0D9488',     // Teal 700
  primaryDark: '#0F766E', // Teal 600
  text: '#042F2E',        // Teal 900
  textMuted: '#475569',   // Slate 600
  bg: '#F4FDFB',          // App background
  card: '#FFFFFF',
  border: 'rgba(13, 148, 136, 0.12)',
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SoftwareApplication',
      '@id': 'https://www.spentum.com/#software',
      name: 'Spentum',
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Web, Android, iOS',
      url: 'https://www.spentum.com',
      description: 'Shared household budget app with up to 10 accounts per person, unlimited household members, bank CSV import, recurring transactions, and detailed reports.',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'GBP' },
      aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.8', reviewCount: '47' },
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        { '@type': 'Question', name: 'Is Spentum free?', acceptedAnswer: { '@type': 'Answer', text: 'Yes — Spentum is free during beta. No card required to sign up.' } },
        { '@type': 'Question', name: 'Does Spentum connect to my bank?', acceptedAnswer: { '@type': 'Answer', text: 'No. You never give us your bank login. You import CSV statements from your bank or add transactions manually — your credentials stay with your bank.' } },
        { '@type': 'Question', name: 'How many accounts and household members can I add?', acceptedAnswer: { '@type': 'Answer', text: 'Up to 10 accounts per person and unlimited household members. Everyone sees the same shared budget in real time.' } },
        { '@type': 'Question', name: 'Does it work on mobile?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. Spentum runs in any modern browser and has native Android and iOS apps.' } },
      ],
    },
  ],
};

const FEATURES = [
  { icon: '👥', title: 'Unlimited household members', body: 'Invite your partner, flatmates, or family. Everyone sees the same shared budget, transactions, and accounts in real time.' },
  { icon: '💳', title: 'Up to 10 accounts per person', body: 'Track debit cards, savings, and credit cards separately. Each account has its own balance, with a combined household view.' },
  { icon: '📥', title: 'Bank CSV import', body: 'Drop in any bank statement CSV. We auto-detect columns, spot recurring subscriptions, deduplicate, and can suggest tags.' },
  { icon: '🔁', title: 'Recurring transactions', body: 'Daily, weekly, monthly, or annual — set a recurring once and it flows into every forecast, budget, and report.' },
  { icon: '📊', title: 'Detailed reports', body: 'Monthly overviews, annual trends, spending heatmap, category drill-downs, and savings-rate charts. See where every pound goes.' },
  { icon: '🎯', title: 'Budgets, goals & subscriptions', body: 'Set monthly caps per category, track savings goals with progress rings, and see every subscription at a glance.' },
];

const STEPS = [
  { title: 'Sign up free', body: 'No card, no bank login. Just an email. Takes 15 seconds.' },
  { title: 'Add your accounts', body: 'Manually or import a CSV from your bank. Tag transactions once, tags remember.' },
  { title: 'Invite your household', body: 'One email link and everyone shares the same budget instantly.' },
];

const FAQS = [
  { q: 'Is Spentum really free?', a: 'Yes — free during our beta period. No card required to sign up, no hidden upsells.' },
  { q: 'Do you connect to my bank?', a: 'No. You never share your bank login with us. You either import CSV statements or add transactions manually. Your credentials stay with your bank, always.' },
  { q: 'How many accounts and household members can I add?', a: 'Up to 10 accounts per person and unlimited household members. Everyone sees the same shared budget and transactions in real time.' },
  { q: 'Is there a mobile app?', a: 'Yes. Spentum runs as a Progressive Web App in any browser, and has native Android and iOS builds.' },
  { q: 'Can I import from my bank?', a: 'Yes. Drag and drop a CSV export from any bank. We auto-detect columns, deduplicate transactions, spot recurring subscriptions, and can auto-tag using AI.' },
  { q: 'Who owns my data?', a: 'You do. Export all your transactions to CSV anytime, and delete your account with one click.' },
];

export default function HomePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div style={{ background: T.bg, color: T.text, fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif', minHeight: '100vh' }}>

        {/* ── Nav ─────────────────────────────────────────────────── */}
        <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(244, 253, 251, 0.9)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${T.border}` }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
              <Image src="/spentum.png" alt="Spentum" width={360} height={120} style={{ height: 48, width: 'auto' }} priority />
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Link href="/blog" style={{ fontSize: 14, color: T.textMuted, padding: '6px 14px', borderRadius: 8, textDecoration: 'none' }}>Blog</Link>
              <Link href="/login" style={{ fontSize: 14, color: T.textMuted, padding: '6px 14px', borderRadius: 8, textDecoration: 'none' }}>Sign in</Link>
              <Link href="/signup" style={{ fontSize: 14, fontWeight: 600, background: T.primary, color: '#fff', padding: '8px 18px', borderRadius: 10, textDecoration: 'none' }}>Get started</Link>
            </div>
          </div>
        </nav>

        {/* ── Hero ────────────────────────────────────────────────── */}
        <section style={{ padding: '80px 24px 64px', maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(13,148,136,0.08)', border: `1px solid ${T.border}`, borderRadius: 100, padding: '5px 14px', fontSize: 13, color: T.primaryDark, fontWeight: 600, marginBottom: 28 }}>
            <span style={{ width: 6, height: 6, background: T.primary, borderRadius: '50%' }} />
            New: share one budget with your whole household
          </div>
          <h1 style={{ fontSize: 'clamp(38px, 6vw, 64px)', fontWeight: 800, color: T.text, lineHeight: 1.1, letterSpacing: '-1.5px', marginBottom: 18 }}>
            One budget for the<br />whole household.
          </h1>
          <p style={{ fontSize: 'clamp(16px, 2vw, 19px)', color: T.textMuted, maxWidth: 560, margin: '0 auto 32px', lineHeight: 1.55 }}>
            Track expenses, forecast your balance, and share everything with your partner, flatmates, or family — up to 10 accounts per person, unlimited members.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
            <Link href="/signup" style={{ background: T.primary, color: '#fff', fontSize: 15, fontWeight: 600, padding: '13px 28px', borderRadius: 12, textDecoration: 'none' }}>Get started free →</Link>
            <Link href="/login" style={{ background: '#fff', color: T.text, fontSize: 15, fontWeight: 600, padding: '13px 24px', borderRadius: 12, border: `1px solid ${T.border}`, textDecoration: 'none' }}>Sign in</Link>
          </div>
          <p style={{ fontSize: 12, color: T.textMuted, opacity: 0.7 }}>Free during beta · No bank login · No card required</p>
        </section>

        {/* ── Features grid ───────────────────────────────────────── */}
        <section style={{ padding: '40px 24px 80px', maxWidth: 1080, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 36px)', fontWeight: 800, color: T.text, textAlign: 'center', marginBottom: 12, letterSpacing: '-0.5px' }}>Everything a household needs</h2>
          <p style={{ fontSize: 16, color: T.textMuted, textAlign: 'center', maxWidth: 560, margin: '0 auto 48px' }}>
            Built for real households. Shared accounts, shared budget, same view for everyone.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            {FEATURES.map((f) => (
              <div key={f.title} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: '24px 20px', boxShadow: '0 1px 3px rgba(13,148,136,0.04), 0 4px 12px rgba(13,148,136,0.03)' }}>
                <div style={{ width: 40, height: 40, background: 'rgba(13,148,136,0.08)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.primary, marginBottom: 14, fontSize: 20 }}>{f.icon}</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 6 }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: T.textMuted, lineHeight: 1.55 }}>{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── How it works ────────────────────────────────────────── */}
        <section style={{ padding: '64px 24px', background: '#fff', borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}` }}>
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 36px)', fontWeight: 800, color: T.text, textAlign: 'center', marginBottom: 48, letterSpacing: '-0.5px' }}>Three steps. One minute.</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24 }}>
              {STEPS.map((s, i) => (
                <div key={s.title}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: T.primary, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, marginBottom: 14 }}>{i + 1}</div>
                  <h3 style={{ fontSize: 17, fontWeight: 700, color: T.text, marginBottom: 6 }}>{s.title}</h3>
                  <p style={{ fontSize: 14, color: T.textMuted, lineHeight: 1.55 }}>{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ─────────────────────────────────────────────────── */}
        <section style={{ padding: '64px 24px', maxWidth: 760, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 36px)', fontWeight: 800, color: T.text, textAlign: 'center', marginBottom: 40, letterSpacing: '-0.5px' }}>Questions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {FAQS.map((q) => (
              <details key={q.q} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: '16px 20px' }}>
                <summary style={{ fontSize: 15, fontWeight: 600, color: T.text, cursor: 'pointer', listStyle: 'none' }}>{q.q}</summary>
                <p style={{ fontSize: 14, color: T.textMuted, lineHeight: 1.6, marginTop: 10 }}>{q.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* ── CTA ─────────────────────────────────────────────────── */}
        <section style={{ padding: '64px 24px 80px', textAlign: 'center' }}>
          <div style={{ maxWidth: 540, margin: '0 auto', background: `linear-gradient(135deg, ${T.primary}, ${T.primaryDark})`, borderRadius: 20, padding: '44px 32px', color: '#fff' }}>
            <h2 style={{ fontSize: 'clamp(24px, 3vw, 30px)', fontWeight: 800, marginBottom: 10, letterSpacing: '-0.4px' }}>Start budgeting together</h2>
            <p style={{ fontSize: 15, opacity: 0.9, marginBottom: 24, lineHeight: 1.55 }}>Free during beta. Your first transaction takes less than a minute.</p>
            <Link href="/signup" style={{ display: 'inline-block', background: '#fff', color: T.primary, fontSize: 15, fontWeight: 700, padding: '13px 32px', borderRadius: 12, textDecoration: 'none' }}>Create free account →</Link>
          </div>
        </section>

        {/* ── Footer ──────────────────────────────────────────────── */}
        <footer style={{ borderTop: `1px solid ${T.border}`, padding: '32px 24px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <p style={{ fontSize: 13, color: T.textMuted }}>© {new Date().getFullYear()} Spentum. All rights reserved.</p>
            <div style={{ display: 'flex', gap: 20 }}>
              <Link href="/privacy" style={{ fontSize: 13, color: T.textMuted, textDecoration: 'none' }}>Privacy</Link>
              <Link href="/terms" style={{ fontSize: 13, color: T.textMuted, textDecoration: 'none' }}>Terms</Link>
              <Link href="/blog" style={{ fontSize: 13, color: T.textMuted, textDecoration: 'none' }}>Blog</Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
