import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';

const SITE = 'https://www.spentum.com';
const OG_IMAGE = '/og-image.png';
const DESCRIPTION =
  'Track expenses, forecast your balance, and share one budget with your whole household. Up to 10 accounts each, unlimited members, CSV bank import. Free during beta.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: 'Spentum | Shared Household Budget App',
  description: DESCRIPTION,
  applicationName: 'Spentum',
  authors: [{ name: 'Spentum', url: SITE }],
  creator: 'Spentum',
  publisher: 'Spentum',
  category: 'finance',
  keywords: [
    'spentum', 'household budget app', 'shared budget app', 'family budget app',
    'personal finance tracker', 'expense tracker', 'budget planner', 'couples budget',
    'csv bank import', 'recurring transactions', 'balance forecast', 'household finance',
    'money management app', 'savings goals tracker', 'subscription tracker',
  ],
  alternates: { canonical: '/' },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  openGraph: {
    type: 'website',
    url: SITE,
    siteName: 'Spentum',
    locale: 'en_GB',
    title: 'Spentum | Shared Household Budget App',
    description: DESCRIPTION,
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: 'Spentum shared household budget app', type: 'image/png' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Spentum | Shared Household Budget App',
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
};

const FAQS = [
  { q: 'Is Spentum really free?', a: 'Yes, free during our beta period. No card required to sign up, and no hidden upsells.' },
  { q: 'Do you connect to my bank?', a: 'No. You never share your bank login with us. You either import CSV statements or add transactions manually, so your credentials always stay with your bank.' },
  { q: 'How many accounts and household members can I add?', a: 'Up to 10 accounts per person and unlimited household members. Everyone sees the same shared budget and transactions in real time.' },
  { q: 'Is there a mobile app?', a: 'Yes. Spentum runs as a Progressive Web App in any browser, and has native Android and iOS builds.' },
  { q: 'Can I import from my bank?', a: 'Yes. Drag and drop a CSV export from any bank. Spentum auto-detects columns, deduplicates transactions, spots recurring subscriptions, and can auto-tag using AI.' },
  { q: 'Who owns my data?', a: 'You do. Export all your transactions to CSV at any time, and delete your account with a single click.' },
];

const FEATURE_LIST = [
  'Shared household budget with unlimited members',
  'Up to 10 accounts per person',
  'Bank statement CSV import with auto-tagging',
  'Recurring transactions',
  'Balance forecast',
  'Detailed reports, budgets, goals and subscriptions',
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE}/#organization`,
      name: 'Spentum',
      url: SITE,
      logo: { '@type': 'ImageObject', url: `${SITE}${OG_IMAGE}`, width: 1200, height: 400 },
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE}/#website`,
      url: SITE,
      name: 'Spentum',
      description: DESCRIPTION,
      publisher: { '@id': `${SITE}/#organization` },
      inLanguage: 'en-GB',
    },
    {
      '@type': 'SoftwareApplication',
      '@id': `${SITE}/#software`,
      name: 'Spentum',
      applicationCategory: 'FinanceApplication',
      applicationSubCategory: 'Budgeting',
      operatingSystem: 'Web, Android, iOS',
      url: SITE,
      description: 'Shared household budget app with up to 10 accounts per person, unlimited household members, bank CSV import, recurring transactions, and detailed reports.',
      featureList: FEATURE_LIST,
      screenshot: `${SITE}${OG_IMAGE}`,
      inLanguage: 'en-GB',
      publisher: { '@id': `${SITE}/#organization` },
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'GBP', availability: 'https://schema.org/InStock' },
      aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.8', reviewCount: '47', bestRating: '5', worstRating: '1' },
    },
    {
      '@type': 'FAQPage',
      '@id': `${SITE}/#faq`,
      mainEntity: FAQS.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    },
  ],
};

type Icon = 'members' | 'cards' | 'import' | 'recurring' | 'reports' | 'goals';

const ICONS: Record<Icon, React.ReactNode> = {
  members: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 20v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1" /><circle cx="9" cy="8" r="3.2" />
      <path d="M22 20v-1a4 4 0 0 0-3-3.87" /><path d="M16.3 4.2a3.2 3.2 0 0 1 0 6.1" />
    </svg>
  ),
  cards: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2.5" y="7.5" width="15" height="11" rx="2.5" /><path d="M2.5 11.5h15" />
      <path d="M6.5 7.5V6a2 2 0 0 1 2-2h10.5a2 2 0 0 1 2 2v8.3a2 2 0 0 1-1.4 1.9" />
    </svg>
  ),
  import: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3.5v9.5" /><path d="m8 9 4 4 4-4" />
      <path d="M4 15.5v2A2.5 2.5 0 0 0 6.5 20h11a2.5 2.5 0 0 0 2.5-2.5v-2" />
    </svg>
  ),
  recurring: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.5 12a8.5 8.5 0 0 1 14.2-6.3L21 8" /><path d="M21 3.5V8h-4.5" />
      <path d="M20.5 12a8.5 8.5 0 0 1-14.2 6.3L3 16" /><path d="M3 20.5V16h4.5" />
    </svg>
  ),
  reports: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.5 3.5v17h17" /><path d="M7.5 16v-3.5" /><path d="M12 16V8.5" /><path d="M16.5 16v-6" />
    </svg>
  ),
  goals: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.6" />
      <circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  ),
};

const FEATURES: { icon: Icon; title: string; body: string }[] = [
  { icon: 'members', title: 'Unlimited household members', body: 'Invite your partner, flatmates, or family. Everyone sees the same shared budget, transactions, and accounts, updating in real time.' },
  { icon: 'cards', title: 'Up to 10 accounts per person', body: 'Track debit cards, savings, and credit cards separately. Each account keeps its own balance, with a combined household view on top.' },
  { icon: 'import', title: 'Bank CSV import', body: 'Drop in any bank statement CSV. Spentum auto-detects columns, spots recurring subscriptions, deduplicates, and suggests tags.' },
  { icon: 'recurring', title: 'Recurring transactions', body: 'Daily, weekly, monthly, or annual. Set a recurring once and it flows into every forecast, budget, and report automatically.' },
  { icon: 'reports', title: 'Detailed reports', body: 'Monthly overviews, annual trends, a spending heatmap, category drill-downs, and savings-rate charts. See where every pound goes.' },
  { icon: 'goals', title: 'Budgets, goals & subscriptions', body: 'Set monthly caps per category, track savings goals with progress rings, and see every subscription in one place.' },
];

const CATEGORIES = [
  { f: 'groceries', l: 'Groceries' }, { f: 'salary', l: 'Salary' }, { f: 'housing', l: 'Housing' },
  { f: 'mortgage', l: 'Mortgage' }, { f: 'transport', l: 'Transport' }, { f: 'dining-out', l: 'Dining Out' },
  { f: 'subscriptions', l: 'Subscriptions' }, { f: 'utilities', l: 'Utilities' }, { f: 'health', l: 'Health' },
  { f: 'travel', l: 'Travel' }, { f: 'entertainment', l: 'Entertainment' }, { f: 'shopping', l: 'Shopping' },
  { f: 'investment', l: 'Investment' }, { f: 'freelance', l: 'Freelance' }, { f: 'gym-fitness', l: 'Gym & Fitness' },
  { f: 'insurance', l: 'Insurance' }, { f: 'education', l: 'Education' }, { f: 'pets', l: 'Pets' },
  { f: 'childcare', l: 'Childcare' }, { f: 'cashback', l: 'Cashback' }, { f: 'gifts', l: 'Gifts' },
  { f: 'bonus', l: 'Bonus' }, { f: 'charity-donations', l: 'Charity' }, { f: 'taxes', l: 'Taxes' },
];

const STATS = [
  { k: '10', v: 'accounts per person' },
  { k: 'Unlimited', v: 'household members' },
  { k: '6', v: 'languages built in' },
  { k: 'Free', v: 'during beta' },
];

const STEPS = [
  { title: 'Sign up free', body: 'No card, no bank login. Just an email, and it takes about fifteen seconds.' },
  { title: 'Add your accounts', body: 'Add them manually or import a CSV from your bank. Tag a transaction once and the tag remembers.' },
  { title: 'Invite your household', body: 'Share one link and everyone budgets from the same live view, instantly.' },
];

const CAL: { d: number; dot?: string; amt?: string; today?: boolean }[] = [
  { d: 21 }, { d: 22, dot: '#F59E0B', amt: '−£42' }, { d: 23 }, { d: 24, dot: '#0D9488', amt: '+£1,900' },
  { d: 25, today: true }, { d: 26, dot: '#8b5cf6', amt: '−£13' }, { d: 27 },
];

const AVATARS = [
  { i: 'A', c: '#0D9488' }, { i: 'M', c: '#F59E0B' }, { i: 'J', c: '#0F766E' }, { i: 'R', c: '#5EEAD4' },
];

const css = `
.lp {
  --primary:#0D9488; --secondary:#0F766E; --deep:#064E48; --deepest:#03302D;
  --text:#042F2E; --muted:#4b6b68; --bg:#F4FDFB; --card:#fff;
  --accent:#F59E0B; --teal50:#F0FDFA; --teal100:#CCFBF1; --teal200:#99F6E4; --teal400:#5EEAD4;
  --ring:rgba(13,148,136,0.12); --ringStrong:rgba(13,148,136,0.22);
  font-family:var(--font-inter),system-ui,-apple-system,"Segoe UI",sans-serif;
  color:var(--text); background:var(--bg); min-height:100vh; overflow-x:hidden;
  -webkit-font-smoothing:antialiased;
}
.lp *{box-sizing:border-box;}
.lp-display{font-family:var(--font-space),var(--font-inter),system-ui,sans-serif;}

.lp-nav{position:sticky;top:0;z-index:100;background:rgba(244,253,251,0.72);backdrop-filter:saturate(180%) blur(14px);-webkit-backdrop-filter:saturate(180%) blur(14px);border-bottom:1px solid var(--ring);}
.lp-nav-in{max-width:1140px;margin:0 auto;padding:14px 24px;display:flex;align-items:center;justify-content:space-between;gap:12px;}
.lp-nav-links{display:flex;align-items:center;gap:4px;}
.lp-link{font-size:14px;color:var(--muted);padding:8px 14px;border-radius:9px;text-decoration:none;font-weight:500;transition:color .15s,background .15s;}
.lp-link:hover{color:var(--text);background:rgba(13,148,136,0.07);}
.lp-btn{display:inline-flex;align-items:center;gap:7px;font-weight:600;text-decoration:none;border-radius:12px;transition:transform .18s cubic-bezier(.2,.7,.2,1),box-shadow .18s,filter .18s;}
.lp-btn-primary{background:linear-gradient(180deg,#12b3a3,var(--primary));color:#fff;padding:11px 20px;font-size:14.5px;box-shadow:0 1px 1px rgba(4,47,46,.15),0 8px 20px rgba(13,148,136,.28),inset 0 1px 0 rgba(255,255,255,.25);}
.lp-btn-primary:hover{transform:translateY(-1.5px);box-shadow:0 2px 3px rgba(4,47,46,.15),0 14px 30px rgba(13,148,136,.36),inset 0 1px 0 rgba(255,255,255,.3);filter:brightness(1.03);}
.lp-btn-ghost{background:var(--card);color:var(--text);padding:12px 22px;font-size:15px;border:1px solid var(--ring);box-shadow:0 1px 2px rgba(4,47,46,.05);}
.lp-btn-ghost:hover{transform:translateY(-1.5px);border-color:var(--ringStrong);box-shadow:0 8px 20px rgba(13,148,136,.1);}
.lp-btn-lg{padding:15px 30px;font-size:15.5px;border-radius:14px;}

.lp-hero{position:relative;max-width:1180px;margin:0 auto;padding:88px 24px 40px;display:grid;grid-template-columns:1.04fr .96fr;gap:48px;align-items:center;}
.lp-aurora{position:absolute;inset:-10% -20% auto;height:640px;z-index:0;pointer-events:none;filter:blur(8px);}
.lp-blob{position:absolute;border-radius:50%;filter:blur(64px);opacity:.55;}
.lp-b1{width:520px;height:520px;left:-60px;top:-120px;background:radial-gradient(circle at 30% 30%,#5EEAD4,transparent 70%);}
.lp-b2{width:460px;height:460px;right:-40px;top:-60px;background:radial-gradient(circle at 60% 40%,#99F6E4,transparent 70%);opacity:.5;}
.lp-b3{width:420px;height:420px;left:38%;top:120px;background:radial-gradient(circle at 50% 50%,#CCFBF1,transparent 70%);opacity:.6;}
.lp-hero-copy{position:relative;z-index:1;min-width:0;}
.lp-eyebrow{display:inline-flex;align-items:center;gap:8px;background:rgba(255,255,255,.7);border:1px solid var(--ring);border-radius:100px;padding:6px 14px 6px 10px;font-size:12.5px;color:var(--secondary);font-weight:600;margin-bottom:24px;box-shadow:0 2px 10px rgba(13,148,136,.06);backdrop-filter:blur(4px);}
.lp-dot{width:7px;height:7px;border-radius:50%;background:var(--primary);box-shadow:0 0 0 3px rgba(13,148,136,.18);animation:lp-pulse 2.4s ease-in-out infinite;}
.lp-h1{font-size:clamp(40px,5.6vw,66px);font-weight:600;line-height:1.03;letter-spacing:-2px;margin:0 0 20px;}
.lp-grad{background:linear-gradient(102deg,#0D9488 0%,#0F766E 45%,#0b8f83 70%,#12b3a3 100%);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:transparent;}
.lp-sub{font-size:clamp(16px,1.6vw,19px);color:var(--muted);max-width:520px;line-height:1.6;margin:0 0 30px;}
.lp-cta-row{display:flex;gap:12px;flex-wrap:wrap;align-items:center;margin-bottom:26px;}
.lp-trust{display:flex;align-items:center;gap:14px;flex-wrap:wrap;}
.lp-avatars{display:flex;}
.lp-av{width:30px;height:30px;border-radius:50%;border:2px solid var(--bg);margin-left:-9px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:700;}
.lp-av:first-child{margin-left:0;}
.lp-trust-txt{font-size:13px;color:var(--muted);line-height:1.35;}
.lp-stars{color:var(--accent);letter-spacing:1px;font-size:12px;}
.lp-note{font-size:12.5px;color:var(--muted);opacity:.85;margin:18px 0 0;}
.lp-check{color:var(--primary);font-weight:700;}

.lp-visual{position:relative;z-index:1;justify-self:center;width:100%;max-width:460px;min-width:0;animation:lp-rise .9s cubic-bezier(.2,.7,.2,1) both;}
.lp-window{position:relative;background:var(--card);border:1px solid var(--ring);border-radius:20px;box-shadow:0 2px 4px rgba(4,47,46,.04),0 30px 60px -20px rgba(13,148,136,.32),0 12px 24px -12px rgba(4,47,46,.12);overflow:hidden;}
.lp-winbar{display:flex;align-items:center;gap:8px;padding:12px 16px;border-bottom:1px solid var(--ring);background:linear-gradient(180deg,#fff,#f7fdfc);}
.lp-tl{width:10px;height:10px;border-radius:50%;}
.lp-winurl{margin-left:8px;font-size:11px;color:var(--muted);background:var(--teal50);border:1px solid var(--ring);border-radius:7px;padding:3px 10px;}
.lp-winbody{padding:20px;}
.lp-bal-label{font-size:11px;font-weight:700;letter-spacing:.14em;color:var(--muted);text-transform:uppercase;}
.lp-bal-row{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;margin-top:4px;}
.lp-bal{font-size:34px;font-weight:600;letter-spacing:-1px;}
.lp-chip{display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:700;padding:5px 10px;border-radius:100px;}
.lp-chip-pos{color:#0a7d5a;background:rgba(22,163,74,.1);border:1px solid rgba(22,163,74,.2);}
.lp-cal{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;margin-top:20px;}
.lp-cell{aspect-ratio:.82;border:1px solid var(--ring);border-radius:9px;padding:6px 5px;display:flex;flex-direction:column;justify-content:space-between;background:#fff;}
.lp-cell-today{border-color:var(--primary);box-shadow:0 0 0 2px rgba(13,148,136,.14);background:var(--teal50);}
.lp-cell-d{font-size:11px;font-weight:600;color:var(--muted);}
.lp-cell-amt{font-size:8.5px;font-weight:700;line-height:1.1;}
.lp-cdot{width:5px;height:5px;border-radius:50%;align-self:flex-start;}
.lp-fore{margin-top:18px;padding:14px;border:1px solid var(--ring);border-radius:12px;background:linear-gradient(180deg,#fbfffe,var(--teal50));}
.lp-fore-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;}
.lp-fore-l{font-size:10.5px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);}
.lp-fore-v{font-size:12px;font-weight:700;color:var(--secondary);}
.lp-float{position:absolute;background:#fff;border:1px solid var(--ring);border-radius:14px;box-shadow:0 16px 30px -12px rgba(4,47,46,.24);padding:11px 13px;display:flex;align-items:center;gap:10px;}
.lp-f1{left:-34px;bottom:34px;animation:lp-floaty 6s ease-in-out infinite;}
.lp-f2{right:-30px;top:150px;animation:lp-floaty 6s ease-in-out infinite 1.6s;}
.lp-f-ic{width:30px;height:30px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:15px;}
.lp-f-t{font-size:12px;font-weight:700;line-height:1.2;}
.lp-f-s{font-size:10.5px;color:var(--muted);}
.lp-ring{position:relative;width:34px;height:34px;}

.lp-stats{max-width:1080px;margin:36px auto 0;padding:0 24px;}
.lp-stats-in{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;background:linear-gradient(180deg,#fff,#fbfffe);border:1px solid var(--ring);border-radius:18px;padding:26px 20px;box-shadow:0 1px 2px rgba(4,47,46,.04),0 18px 40px -28px rgba(13,148,136,.3);}
.lp-stat{text-align:center;position:relative;}
.lp-stat+.lp-stat::before{content:"";position:absolute;left:-7px;top:12%;height:76%;width:1px;background:var(--ring);}
.lp-stat-k{font-size:clamp(22px,2.4vw,30px);font-weight:600;letter-spacing:-.5px;color:var(--secondary);}
.lp-stat-v{font-size:12.5px;color:var(--muted);margin-top:2px;}

.lp-sec{max-width:1120px;margin:0 auto;padding:88px 24px;}
.lp-kicker{font-size:12px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--primary);text-align:center;}
.lp-h2{font-size:clamp(28px,3.6vw,42px);font-weight:600;letter-spacing:-1px;text-align:center;margin:10px 0 12px;}
.lp-lead{font-size:16.5px;color:var(--muted);text-align:center;max-width:560px;margin:0 auto 52px;line-height:1.55;}

.lp-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;}
.lp-fcard{position:relative;background:var(--card);border:1px solid var(--ring);border-radius:18px;padding:26px 24px;transition:transform .22s cubic-bezier(.2,.7,.2,1),box-shadow .22s,border-color .22s;overflow:hidden;}
.lp-fcard::after{content:"";position:absolute;inset:0;border-radius:18px;padding:1px;background:linear-gradient(140deg,rgba(94,234,212,.5),transparent 40%);-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;opacity:0;transition:opacity .22s;}
.lp-fcard:hover{transform:translateY(-4px);border-color:transparent;box-shadow:0 2px 4px rgba(4,47,46,.04),0 22px 44px -22px rgba(13,148,136,.4);}
.lp-fcard:hover::after{opacity:1;}
.lp-fic{width:46px;height:46px;border-radius:13px;display:flex;align-items:center;justify-content:center;color:var(--secondary);margin-bottom:16px;background:linear-gradient(160deg,var(--teal100),var(--teal50));border:1px solid rgba(13,148,136,.12);box-shadow:inset 0 1px 0 rgba(255,255,255,.6);}
.lp-fic svg{width:23px;height:23px;}
.lp-fcard h3{font-size:16.5px;font-weight:700;margin:0 0 7px;letter-spacing:-.2px;}
.lp-fcard p{font-size:14px;color:var(--muted);line-height:1.6;margin:0;}

.lp-cats-wrap{background:linear-gradient(180deg,#fbfffe,#eefbf8);border-top:1px solid var(--ring);border-bottom:1px solid var(--ring);}
.lp-cats{display:flex;flex-wrap:wrap;justify-content:center;gap:10px;max-width:820px;margin:0 auto;}
.lp-cat{display:inline-flex;align-items:center;gap:9px;background:var(--card);border:1px solid var(--ring);border-radius:100px;padding:7px 17px 7px 9px;font-size:13.5px;font-weight:600;color:var(--text);transition:transform .18s cubic-bezier(.2,.7,.2,1),box-shadow .18s,border-color .18s;}
.lp-cat:hover{transform:translateY(-2px);border-color:var(--ringStrong);box-shadow:0 12px 24px -16px rgba(13,148,136,.5);}
.lp-cat img{width:24px;height:24px;flex:none;}

.lp-steps-wrap{background:linear-gradient(180deg,#ffffff,#f6fdfb);border-top:1px solid var(--ring);border-bottom:1px solid var(--ring);}
.lp-steps{display:grid;grid-template-columns:repeat(3,1fr);gap:28px;position:relative;}
.lp-step{position:relative;padding-top:6px;}
.lp-step-n{width:44px;height:44px;border-radius:14px;background:linear-gradient(180deg,#12b3a3,var(--primary));color:#fff;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;font-family:var(--font-space);margin-bottom:16px;box-shadow:0 8px 18px rgba(13,148,136,.3),inset 0 1px 0 rgba(255,255,255,.3);}
.lp-step h3{font-size:18px;font-weight:700;margin:0 0 7px;letter-spacing:-.3px;}
.lp-step p{font-size:14.5px;color:var(--muted);line-height:1.6;margin:0;}
.lp-step-line{position:absolute;top:28px;left:calc(50% + 30px);right:calc(-50% + 30px);height:2px;background:linear-gradient(90deg,var(--teal200),transparent);}

.lp-faq{max-width:760px;margin:0 auto;display:flex;flex-direction:column;gap:10px;}
.lp-q{background:var(--card);border:1px solid var(--ring);border-radius:14px;padding:4px 20px;transition:border-color .18s,box-shadow .18s;}
.lp-q[open]{border-color:var(--ringStrong);box-shadow:0 10px 30px -18px rgba(13,148,136,.4);}
.lp-q summary{display:flex;align-items:center;justify-content:space-between;gap:14px;font-size:15.5px;font-weight:600;cursor:pointer;list-style:none;padding:16px 0;}
.lp-q summary::-webkit-details-marker{display:none;}
.lp-plus{flex:none;width:22px;height:22px;position:relative;transition:transform .22s;}
.lp-plus::before,.lp-plus::after{content:"";position:absolute;background:var(--primary);border-radius:2px;}
.lp-plus::before{left:0;right:0;top:10px;height:2px;}
.lp-plus::after{top:0;bottom:0;left:10px;width:2px;transition:opacity .22s;}
.lp-q[open] .lp-plus{transform:rotate(90deg);}
.lp-q[open] .lp-plus::after{opacity:0;}
.lp-q p{font-size:14.5px;color:var(--muted);line-height:1.65;margin:0;padding:0 0 18px;max-width:640px;}

.lp-cta{max-width:1000px;margin:0 auto;padding:0 24px 96px;}
.lp-cta-card{position:relative;overflow:hidden;border-radius:26px;padding:64px 40px;text-align:center;background:linear-gradient(160deg,#0F766E 0%,#0b5c55 55%,#064E48 100%);box-shadow:0 30px 60px -24px rgba(6,78,72,.6);}
.lp-cta-card::before{content:"";position:absolute;width:520px;height:520px;border-radius:50%;top:-260px;right:-120px;background:radial-gradient(circle,rgba(94,234,212,.35),transparent 70%);}
.lp-cta-card::after{content:"";position:absolute;width:420px;height:420px;border-radius:50%;bottom:-240px;left:-100px;background:radial-gradient(circle,rgba(13,148,136,.5),transparent 70%);}
.lp-cta-in{position:relative;z-index:1;}
.lp-cta-card h2{font-size:clamp(28px,3.4vw,40px);font-weight:600;letter-spacing:-1px;color:#fff;margin:0 0 12px;}
.lp-cta-card p{font-size:16px;color:rgba(226,255,250,.85);margin:0 auto 28px;max-width:440px;line-height:1.55;}
.lp-btn-white{background:#fff;color:var(--secondary);padding:15px 32px;font-size:15.5px;border-radius:14px;box-shadow:0 10px 30px rgba(0,0,0,.18);}
.lp-btn-white:hover{transform:translateY(-2px);box-shadow:0 16px 40px rgba(0,0,0,.24);}
.lp-cta-note{font-size:13px;color:rgba(226,255,250,.7);margin-top:18px;}

.lp-foot{border-top:1px solid var(--ring);}
.lp-foot-in{max-width:1140px;margin:0 auto;padding:34px 24px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;}
.lp-foot p{font-size:13px;color:var(--muted);margin:0;}
.lp-foot-links{display:flex;gap:8px;}

@keyframes lp-rise{from{opacity:0;transform:translateY(22px) scale(.985);}to{opacity:1;transform:none;}}
@keyframes lp-floaty{0%,100%{transform:translateY(0);}50%{transform:translateY(-9px);}}
@keyframes lp-pulse{0%,100%{box-shadow:0 0 0 3px rgba(13,148,136,.18);}50%{box-shadow:0 0 0 5px rgba(13,148,136,.06);}}

@media (max-width:900px){
  .lp-hero{grid-template-columns:1fr;padding-top:56px;gap:44px;text-align:center;}
  .lp-hero-copy{display:flex;flex-direction:column;align-items:center;}
  .lp-sub{margin-inline:auto;}
  .lp-cta-row,.lp-trust{justify-content:center;}
  .lp-grid{grid-template-columns:repeat(2,1fr);}
  .lp-steps{grid-template-columns:1fr;gap:22px;}
  .lp-step-line{display:none;}
  .lp-stats-in{grid-template-columns:repeat(2,1fr);gap:24px 14px;}
  .lp-stat:nth-child(3)::before{display:none;}
}
@media (max-width:560px){
  .lp-nav-links .lp-hide{display:none;}
  .lp-grid{grid-template-columns:1fr;}
  .lp-stats-in{grid-template-columns:repeat(2,1fr);}
  .lp-sec{padding:64px 22px;}
  .lp-float{display:none;}
  .lp-h1{letter-spacing:-1px;}
}
@media (prefers-reduced-motion:reduce){
  .lp *{animation:none !important;transition:none !important;}
}
`;

export default function HomePage() {
  const year = new Date().getFullYear();
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <div className="lp">
        {/* ── Nav ── */}
        <header className="lp-nav">
          <nav className="lp-nav-in" aria-label="Primary">
            <Link href="/" aria-label="Spentum home" style={{ display: 'flex', alignItems: 'center' }}>
              <Image src="/spentum.png" alt="Spentum" width={360} height={120} style={{ height: 44, width: 'auto' }} priority />
            </Link>
            <div className="lp-nav-links">
              <Link href="/blog" className="lp-link lp-hide">Blog</Link>
              <Link href="/login" className="lp-link">Sign in</Link>
              <Link href="/signup" className="lp-btn lp-btn-primary">Get started</Link>
            </div>
          </nav>
        </header>

        <main>
          {/* ── Hero ── */}
          <section className="lp-hero" aria-labelledby="hero-h">
            <div className="lp-aurora" aria-hidden="true">
              <span className="lp-blob lp-b1" /><span className="lp-blob lp-b2" /><span className="lp-blob lp-b3" />
            </div>

            <div className="lp-hero-copy">
              <span className="lp-eyebrow"><span className="lp-dot" /> New · one budget for your whole household</span>
              <h1 id="hero-h" className="lp-h1 lp-display">One budget for the <span className="lp-grad">whole household.</span></h1>
              <p className="lp-sub">
                Track expenses, forecast your balance months ahead, and share everything with your
                partner, flatmates, or family. Up to 10 accounts each, unlimited members, all in real time.
              </p>
              <div className="lp-cta-row">
                <Link href="/signup" className="lp-btn lp-btn-primary lp-btn-lg">Get started free →</Link>
                <Link href="/login" className="lp-btn lp-btn-ghost lp-btn-lg">Sign in</Link>
              </div>
              <div className="lp-trust">
                <div className="lp-avatars" aria-hidden="true">
                  {AVATARS.map((a) => (
                    <span key={a.i} className="lp-av" style={{ background: a.c }}>{a.i}</span>
                  ))}
                </div>
                <div className="lp-trust-txt">
                  <div className="lp-stars" aria-hidden="true">★★★★★</div>
                  Rated 4.8 / 5 by early households
                </div>
              </div>
              <p className="lp-note"><span className="lp-check">✓</span> Free during beta &nbsp; <span className="lp-check">✓</span> No bank login &nbsp; <span className="lp-check">✓</span> No card required</p>
            </div>

            {/* Product mockup (decorative) */}
            <div className="lp-visual" aria-hidden="true">
              <div className="lp-window">
                <div className="lp-winbar">
                  <span className="lp-tl" style={{ background: '#ff5f57' }} />
                  <span className="lp-tl" style={{ background: '#febc2e' }} />
                  <span className="lp-tl" style={{ background: '#28c840' }} />
                  <span className="lp-winurl">spentum.com/dashboard</span>
                </div>
                <div className="lp-winbody">
                  <div className="lp-bal-label">Balance today</div>
                  <div className="lp-bal-row">
                    <div className="lp-bal lp-display">£4,820.50</div>
                    <span className="lp-chip lp-chip-pos">▲ £255 this month</span>
                  </div>

                  <div className="lp-cal">
                    {CAL.map((c) => (
                      <div key={c.d} className={`lp-cell${c.today ? ' lp-cell-today' : ''}`}>
                        <span className="lp-cell-d">{c.d}</span>
                        {c.dot ? <span className="lp-cdot" style={{ background: c.dot }} /> : <span />}
                        {c.amt
                          ? <span className="lp-cell-amt" style={{ color: c.amt.startsWith('+') ? '#0a7d5a' : '#b45309' }}>{c.amt}</span>
                          : <span />}
                      </div>
                    ))}
                  </div>

                  <div className="lp-fore">
                    <div className="lp-fore-top">
                      <span className="lp-fore-l">6-month forecast</span>
                      <span className="lp-fore-v">▲ +£6,140</span>
                    </div>
                    <svg viewBox="0 0 300 56" preserveAspectRatio="none" style={{ width: '100%', height: 46, display: 'block' }}>
                      <defs>
                        <linearGradient id="lpArea" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0" stopColor="#0D9488" stopOpacity="0.28" />
                          <stop offset="1" stopColor="#0D9488" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path d="M0 44 L50 40 L100 42 L150 30 L200 24 L250 14 L300 8 L300 56 L0 56 Z" fill="url(#lpArea)" />
                      <path d="M0 44 L50 40 L100 42 L150 30 L200 24 L250 14 L300 8" fill="none" stroke="#0D9488" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="300" cy="8" r="3.6" fill="#0D9488" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="lp-float lp-f1">
                <span className="lp-f-ic" style={{ background: 'rgba(124,58,237,.12)' }}>🎬</span>
                <span><span className="lp-f-t">Netflix</span><br /><span className="lp-f-s">−£12.99 · monthly</span></span>
              </div>
              <div className="lp-float lp-f2">
                <span className="lp-ring">
                  <svg viewBox="0 0 36 36" width="34" height="34">
                    <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(13,148,136,.15)" strokeWidth="4" />
                    <circle cx="18" cy="18" r="15" fill="none" stroke="#0D9488" strokeWidth="4" strokeLinecap="round"
                      strokeDasharray="94.2" strokeDashoffset="30" transform="rotate(-90 18 18)" />
                  </svg>
                </span>
                <span><span className="lp-f-t">Holiday goal</span><br /><span className="lp-f-s">68% saved</span></span>
              </div>
            </div>
          </section>

          {/* ── Stat band ── */}
          <div className="lp-stats">
            <div className="lp-stats-in">
              {STATS.map((s) => (
                <div key={s.v} className="lp-stat">
                  <div className="lp-stat-k lp-display">{s.k}</div>
                  <div className="lp-stat-v">{s.v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Features ── */}
          <section className="lp-sec" aria-labelledby="features-h">
            <p className="lp-kicker">Everything in one place</p>
            <h2 id="features-h" className="lp-h2 lp-display">Everything a household needs</h2>
            <p className="lp-lead">Built for real households: shared accounts, one budget, the same live view for everyone.</p>
            <div className="lp-grid">
              {FEATURES.map((f) => (
                <article key={f.title} className="lp-fcard">
                  <div className="lp-fic" aria-hidden="true">{ICONS[f.icon]}</div>
                  <h3>{f.title}</h3>
                  <p>{f.body}</p>
                </article>
              ))}
            </div>
          </section>

          {/* ── Category icons showcase ── */}
          <div className="lp-cats-wrap">
            <section className="lp-sec" aria-labelledby="categories-h">
              <p className="lp-kicker">Organised automatically</p>
              <h2 id="categories-h" className="lp-h2 lp-display">More than 50 categories, built in</h2>
              <p className="lp-lead">Every income and expense type is covered out of the box, with the option to add your own. Tag a transaction once and Spentum remembers it.</p>
              <div className="lp-cats">
                {CATEGORIES.map((c) => (
                  <span key={c.f} className="lp-cat">
                    <Image src={`/tag-icons/${c.f}.webp`} alt="" width={24} height={24} loading="lazy" />
                    {c.l}
                  </span>
                ))}
              </div>
            </section>
          </div>

          {/* ── How it works ── */}
          <div className="lp-steps-wrap">
            <section className="lp-sec" aria-labelledby="steps-h">
              <p className="lp-kicker">Get going in a minute</p>
              <h2 id="steps-h" className="lp-h2 lp-display">Three steps. One minute.</h2>
              <p className="lp-lead">No bank connection, no setup call. Sign up and you are budgeting together the same day.</p>
              <div className="lp-steps">
                {STEPS.map((s, i) => (
                  <div key={s.title} className="lp-step">
                    {i < STEPS.length - 1 && <span className="lp-step-line" aria-hidden="true" />}
                    <div className="lp-step-n" aria-hidden="true">{i + 1}</div>
                    <h3>{s.title}</h3>
                    <p>{s.body}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* ── FAQ ── */}
          <section className="lp-sec" aria-labelledby="faq-h">
            <p className="lp-kicker">Good to know</p>
            <h2 id="faq-h" className="lp-h2 lp-display">Questions, answered</h2>
            <div className="lp-faq">
              {FAQS.map((q) => (
                <details key={q.q} className="lp-q">
                  <summary>{q.q}<span className="lp-plus" aria-hidden="true" /></summary>
                  <p>{q.a}</p>
                </details>
              ))}
            </div>
          </section>

          {/* ── CTA ── */}
          <div className="lp-cta">
            <section className="lp-cta-card" aria-labelledby="cta-h">
              <div className="lp-cta-in">
                <h2 id="cta-h" className="lp-display">Start budgeting together</h2>
                <p>Free during beta. Your first transaction takes less than a minute, and your whole household is one link away.</p>
                <Link href="/signup" className="lp-btn lp-btn-white lp-btn-lg">Create free account →</Link>
                <div className="lp-cta-note">No card · No bank login · Cancel anytime</div>
              </div>
            </section>
          </div>
        </main>

        {/* ── Footer ── */}
        <footer className="lp-foot">
          <div className="lp-foot-in">
            <p>© {year} Spentum. All rights reserved.</p>
            <nav className="lp-foot-links" aria-label="Footer">
              <Link href="/privacy" className="lp-link">Privacy</Link>
              <Link href="/terms" className="lp-link">Terms</Link>
              <Link href="/blog" className="lp-link">Blog</Link>
            </nav>
          </div>
        </footer>
      </div>
    </>
  );
}
