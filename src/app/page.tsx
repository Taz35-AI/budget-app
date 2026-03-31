import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Spentum — Budget Smarter. No Bank Login Required.',
  description: 'Track income, expenses & account transfers. Forecast your balance 7 years ahead — without giving anyone your banking password. Free during beta.',
  keywords: ['spentum', 'personal finance tracker', 'balance forecast', 'expense tracker', 'income tracker', 'budget planner', 'money manager'],
  alternates: { canonical: 'https://www.spentum.com' },
  openGraph: {
    type: 'website',
    url: 'https://www.spentum.com',
    title: 'Spentum — Budget Smarter. No Bank Login Required.',
    description: 'Track income, expenses & account transfers. Forecast your balance 7 years ahead — without giving anyone your banking password. Free during beta.',
    siteName: 'Spentum',
    images: [{ url: 'https://www.spentum.com/spentum.png', width: 1200, height: 400 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Spentum — Budget Smarter. No Bank Login Required.',
    description: 'Track income, expenses & account transfers. Forecast your balance 7 years ahead — without giving anyone your banking password. Free during beta.',
    images: ['https://www.spentum.com/spentum.png'],
  },
};

const serif = { fontFamily: "'Instrument Serif', Georgia, serif" } as const;
const sans  = { fontFamily: "'DM Sans', system-ui, sans-serif" } as const;

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Spentum',
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'Web, Android, iOS',
  url: 'https://www.spentum.com',
  description: 'Personal finance tracker that forecasts your future balance day by day, tracks recurring income and expenses, and helps you manage multiple accounts with savings goals.',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};

export default function LandingPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <style>{`
        @keyframes pulse-dot { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        .badge-dot { animation: pulse-dot 2s infinite; }
        .steps-line::before { content:''; position:absolute; top:28px; left:calc(16.67% + 16px); right:calc(16.67% + 16px); height:1px; background:rgba(255,255,255,0.07); z-index:0; }
        .m-phone-preview { display: none; }
        @media (max-width: 768px) {
          .m-nav { height: auto !important; min-height: 64px !important; padding: 0 16px !important; }
          .m-nav-logo img { height: 56px !important; }
          .m-nav-blog { display: none !important; }
          .m-nav-signin { display: none !important; }
          .m-hero { padding: 48px 20px 40px !important; }
          .m-sec-wrap { padding: 0 16px !important; }
          .m-sec-inner { flex-direction: column !important; padding: 20px !important; gap: 16px !important; }
          .m-sec-icon { display: none !important; }
          .m-trust { padding: 12px 16px !important; }
          .m-compare-wrap { padding: 60px 20px !important; }
          .m-compare-grid { grid-template-columns: 1fr !important; }
          .m-preview-wrap { padding: 0 20px 60px !important; }
          .m-desktop-preview { display: none !important; }
          .m-phone-preview { display: flex !important; justify-content: center; }
          .m-features-wrap { padding: 0 20px 60px !important; }
          .m-feature-grid { grid-template-columns: 1fr !important; }
          .m-span2 { grid-column: span 1 !important; }
          .m-steps-wrap { padding: 60px 20px !important; }
          .m-steps-grid { grid-template-columns: 1fr !important; gap: 20px !important; }
          .steps-line::before { display: none !important; }
          .m-step-circle { margin: 0 0 12px !important; }
          .m-faq-wrap { padding: 60px 20px !important; }
          .m-cta-wrap { padding: 60px 20px !important; }
          .m-footer { padding: 24px 20px !important; }
          .m-cta-btn { font-size: 15px !important; padding: 13px 24px !important; }
          .m-h1 { letter-spacing: -0.5px !important; }
          .m-trust-items { gap: 12px !important; }
        }
      `}</style>

      <div style={{ background: '#0A1A1A', color: 'rgba(255,255,255,0.80)', ...sans }}>

        {/* ── NAV ── */}
        <nav className="m-nav" style={{ position:'sticky', top:0, zIndex:100, background:'rgba(10,26,26,0.92)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(255,255,255,0.07)', height:108, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 40px' }}>
          <Link href="/" className="m-nav-logo" style={{ display:'flex', alignItems:'center', gap:10, textDecoration:'none' }}>
            <Image src="/spentum.png" alt="Spentum" width={360} height={120} style={{ height:108, width:'auto' }} priority />
          </Link>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <Link href="/blog" className="m-nav-blog" style={{ fontSize:14, color:'rgba(255,255,255,0.55)', padding:'6px 14px', borderRadius:8, textDecoration:'none' }}>Blog</Link>
            <Link href="/login" className="m-nav-signin" style={{ fontSize:14, color:'rgba(255,255,255,0.55)', padding:'6px 14px', borderRadius:8, textDecoration:'none' }}>Sign in</Link>
            <Link href="/signup" style={{ fontSize:14, fontWeight:500, background:'#3B7A78', color:'#fff', padding:'7px 18px', borderRadius:10, textDecoration:'none', whiteSpace:'nowrap' }}>Get started free</Link>
          </div>
        </nav>

        {/* ── HERO ── */}
        <section className="m-hero" style={{ padding:'90px 40px 80px', textAlign:'center', maxWidth:860, margin:'0 auto' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:7, background:'rgba(59,122,120,0.12)', border:'1px solid rgba(59,122,120,0.3)', borderRadius:100, padding:'5px 14px', fontSize:13, color:'#4E9E9B', fontWeight:500, marginBottom:32 }}>
            <span className="badge-dot" style={{ width:6, height:6, background:'#4E9E9B', borderRadius:'50%', display:'inline-block' }} />
            Free during beta · No credit card needed
          </div>
          <h1 className="m-h1" style={{ ...serif, fontSize:'clamp(38px, 6vw, 68px)', fontWeight:400, color:'#fff', lineHeight:1.08, letterSpacing:-1, marginBottom:12 }}>
            Know your financial future.<br /><em style={{ fontStyle:'italic', color:'#4E9E9B' }}>Zero bank access</em> needed.
          </h1>
          <p style={{ fontSize:'clamp(16px, 2vw, 19px)', color:'rgba(255,255,255,0.55)', maxWidth:540, margin:'0 auto 40px', lineHeight:1.55, fontWeight:300 }}>
            Balance forecasts, recurring transactions, transfers between accounts — all without ever handing over your banking password.
          </p>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:12, flexWrap:'wrap', marginBottom:24 }}>
            <Link href="/signup" style={{ background:'#3B7A78', color:'#fff', fontSize:15, fontWeight:600, padding:'13px 28px', borderRadius:12, textDecoration:'none', display:'inline-flex', alignItems:'center', gap:8 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              Start for free
            </Link>
            <Link href="/login" style={{ background:'rgba(255,255,255,0.07)', color:'rgba(255,255,255,0.80)', fontSize:15, fontWeight:500, padding:'13px 24px', borderRadius:12, border:'1px solid rgba(255,255,255,0.12)', textDecoration:'none' }}>
              Sign in →
            </Link>
          </div>
          <p style={{ fontSize:12, color:'rgba(255,255,255,0.30)' }}>No bank login. No open banking. Your credentials stay yours.</p>
        </section>

        {/* ── SECURITY BANNER ── */}
        <div className="m-sec-wrap" style={{ maxWidth:1100, margin:'0 auto 0', padding:'0 40px' }}>
          <div className="m-sec-inner" style={{ background:'linear-gradient(135deg, rgba(59,122,120,0.14) 0%, rgba(59,122,120,0.06) 100%)', border:'1px solid rgba(59,122,120,0.3)', borderRadius:18, padding:'32px 40px', display:'flex', alignItems:'center', gap:32, flexWrap:'wrap' }}>
            <div className="m-sec-icon" style={{ flexShrink:0, width:64, height:64, background:'rgba(59,122,120,0.12)', border:'1px solid rgba(59,122,120,0.3)', borderRadius:18, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4E9E9B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <div style={{ flex:1, minWidth:260 }}>
              <h2 style={{ ...serif, fontSize:'clamp(20px, 3vw, 26px)', color:'#fff', fontWeight:400, marginBottom:6 }}>
                Your banking password is <em style={{ fontStyle:'italic', color:'#4E9E9B' }}>none of our business.</em>
              </h2>
              <p style={{ fontSize:14, color:'rgba(255,255,255,0.55)', lineHeight:1.5, maxWidth:520 }}>
                Most budgeting apps demand bank access or open-banking connections. Spentum never does. You enter your numbers; we do the forecasting. Your banking credentials stay in your head, not our database.
              </p>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:14 }}>
                {['✓ No bank sync required','✓ No OAuth tokens stored','✓ Data encrypted at rest','✓ Zero credential exposure'].map(p => (
                  <span key={p} style={{ fontSize:12, fontWeight:500, background:'rgba(59,122,120,0.12)', border:'1px solid rgba(59,122,120,0.3)', color:'#4E9E9B', padding:'4px 12px', borderRadius:100 }}>{p}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── TRUST BAR ── */}
        <div className="m-trust" style={{ borderTop:'1px solid rgba(255,255,255,0.07)', borderBottom:'1px solid rgba(255,255,255,0.07)', background:'rgba(255,255,255,0.04)', padding:'14px 40px', marginTop:40 }}>
          <div className="m-trust-items" style={{ display:'flex', flexWrap:'wrap', justifyContent:'center', gap:24 }}>
            {['Web app · Android & iOS coming','Multi-currency & multi-language','Dark & light mode','CSV export & backup','Free forever for early users'].map(item => (
              <div key={item} style={{ display:'flex', alignItems:'center', gap:7, fontSize:13, color:'rgba(255,255,255,0.30)' }}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M13.5 4l-7 7L3 7.5" stroke="#3B7A78" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* ── COMPARE ── */}
        <section className="m-compare-wrap" style={{ padding:'80px 40px', maxWidth:1100, margin:'0 auto' }}>
          <p style={{ fontSize:12, fontWeight:600, letterSpacing:'1.5px', color:'#3B7A78', textTransform:'uppercase', marginBottom:14 }}>Why Spentum</p>
          <h2 style={{ ...serif, fontSize:'clamp(28px, 4vw, 44px)', color:'#fff', fontWeight:400, lineHeight:1.15, marginBottom:48 }}>
            Other apps want your passwords.<br />We just want to help you budget.
          </h2>
          <div className="m-compare-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
            <div style={{ borderRadius:16, overflow:'hidden' }}>
              <div style={{ padding:'14px 20px', fontSize:13, fontWeight:600, background:'rgba(229,83,75,0.12)', color:'#E5534B', border:'1px solid rgba(229,83,75,0.2)', borderBottom:'none', borderRadius:'16px 16px 0 0' }}>❌ &nbsp;What other apps do</div>
              <div style={{ border:'1px solid rgba(229,83,75,0.15)', borderTop:'none', borderRadius:'0 0 16px 16px', overflow:'hidden' }}>
                {[
                  ['Demand your banking password', ', or open-banking login to sync transactions.'],
                  ['Miscategorise 20–30% of transactions', ', forcing you to fix errors instead of budgeting.'],
                  ['Break bank connections for months', ', leaving your data stale and budget useless.'],
                  ['Charge $15–$18/month', ' with locked free tiers and aggressive upsells.'],
                  ['No balance forecast', ' — they show what you spent, never where you\'re heading.'],
                ].map(([bold, rest]) => (
                  <div key={bold} style={{ display:'flex', alignItems:'flex-start', gap:12, padding:'13px 18px', borderBottom:'1px solid rgba(255,255,255,0.04)', background:'rgba(229,83,75,0.04)' }}>
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink:0, marginTop:1 }}><circle cx="9" cy="9" r="8" stroke="#E5534B" strokeWidth="1.5"/><path d="M6 6l6 6M12 6l-6 6" stroke="#E5534B" strokeWidth="1.5" strokeLinecap="round"/></svg>
                    <span style={{ fontSize:13, lineHeight:1.45, color:'rgba(255,255,255,0.55)' }}><strong style={{ color:'rgba(255,255,255,0.80)', fontWeight:500 }}>{bold}</strong>{rest}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ borderRadius:16, overflow:'hidden' }}>
              <div style={{ padding:'14px 20px', fontSize:13, fontWeight:600, background:'rgba(59,122,120,0.12)', color:'#4E9E9B', border:'1px solid rgba(59,122,120,0.3)', borderBottom:'none', borderRadius:'16px 16px 0 0' }}>✓ &nbsp;How Spentum does it</div>
              <div style={{ border:'1px solid rgba(59,122,120,0.3)', borderTop:'none', borderRadius:'0 0 16px 16px', overflow:'hidden' }}>
                {[
                  ['Zero bank access needed.', ' You log your own transactions — complete privacy, total control.'],
                  ['You own your categories.', ' Full custom tags, zero AI guesswork, zero corrections needed.'],
                  ['Always accurate.', ' Your data is what you entered — no broken APIs, no duplicates.'],
                  ['Free during beta,', ' with early-user pricing locked in forever. No surprise charges.'],
                  ['7-year day-by-day balance forecast.', ' Know exactly where you\'ll be on any future date.'],
                ].map(([bold, rest]) => (
                  <div key={bold} style={{ display:'flex', alignItems:'flex-start', gap:12, padding:'13px 18px', borderBottom:'1px solid rgba(255,255,255,0.04)', background:'rgba(59,122,120,0.08)' }}>
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink:0, marginTop:1 }}><circle cx="9" cy="9" r="8" stroke="#4E9E9B" strokeWidth="1.5"/><path d="M5 9l3 3 5-5" stroke="#4E9E9B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    <span style={{ fontSize:13, lineHeight:1.45, color:'rgba(255,255,255,0.55)' }}><strong style={{ color:'rgba(255,255,255,0.80)', fontWeight:500 }}>{bold}</strong>{rest}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── APP PREVIEW ── */}
        <section className="m-preview-wrap" style={{ padding:'0 40px 80px', maxWidth:1180, margin:'0 auto' }}>
          <p style={{ fontSize:12, fontWeight:600, letterSpacing:'1.5px', color:'#3B7A78', textTransform:'uppercase', marginBottom:14 }}>App preview</p>
          <h2 style={{ ...serif, fontSize:'clamp(26px, 3.5vw, 40px)', color:'#fff', fontWeight:400, lineHeight:1.15, marginBottom:28 }}>
            Your finances, at a glance.
          </h2>

          {/* ── DESKTOP: browser chrome mockup ── */}
          <div className="m-desktop-preview" style={{ background:'#0D1F1E', border:'1px solid rgba(255,255,255,0.09)', borderRadius:18, overflow:'hidden', boxShadow:'0 24px 80px rgba(0,0,0,0.5)' }}>
            <div style={{ height:38, background:'#142d2c', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', padding:'0 16px', gap:7 }}>
              <span style={{ width:10, height:10, borderRadius:'50%', background:'rgba(229,83,75,0.5)', display:'inline-block' }} />
              <span style={{ width:10, height:10, borderRadius:'50%', background:'rgba(240,160,75,0.5)', display:'inline-block' }} />
              <span style={{ width:10, height:10, borderRadius:'50%', background:'rgba(62,201,122,0.5)', display:'inline-block' }} />
              <div style={{ flex:1, background:'rgba(255,255,255,0.07)', borderRadius:6, height:22, margin:'0 16px', display:'flex', alignItems:'center', padding:'0 12px', fontSize:11, color:'rgba(255,255,255,0.30)', fontFamily:'monospace' }}>
                🔒 &nbsp;spentum.com/dashboard
              </div>
            </div>
            <div style={{ display:'flex', height:480 }}>
              <div style={{ width:200, background:'#1e3a38', borderRight:'1px solid rgba(255,255,255,0.06)', flexShrink:0, display:'flex', flexDirection:'column', padding:'16px 0' }}>
                <div style={{ padding:'0 16px 14px', borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
                  <Image src="/spentum.png" alt="Spentum" width={120} height={40} style={{ height:32, width:'auto' }} />
                </div>
                <div style={{ padding:'14px 10px 6px', fontSize:'9px', fontWeight:700, letterSpacing:'0.18em', textTransform:'uppercase', color:'rgba(255,255,255,0.2)' }}>Menu</div>
                {[
                  { label:'Dashboard', active:true,  icon:'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
                  { label:'Reports',   active:false, icon:'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
                  { label:'Accounts',  active:false, icon:'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
                  { label:'Budgets',   active:false, icon:'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
                  { label:'Settings',  active:false, icon:'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
                ].map(item => (
                  <div key={item.label} style={{ display:'flex', alignItems:'center', gap:10, margin:'1px 10px', padding:'8px 12px', borderRadius:10, background: item.active ? '#3B7A78' : 'transparent', color: item.active ? '#fff' : 'rgba(255,255,255,0.38)', fontSize:13, fontWeight:600 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={item.icon}/></svg>
                    {item.label}
                    {item.active && <div style={{ marginLeft:'auto', width:6, height:6, borderRadius:'50%', background:'rgba(255,255,255,0.5)' }} />}
                  </div>
                ))}
              </div>
              <div style={{ flex:1, overflowY:'auto', background:'#0D1F1E', padding:20 }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
                  <div>
                    <div style={{ fontSize:18, fontWeight:700, color:'#fff', letterSpacing:-0.3 }}>April 2025</div>
                    <div style={{ fontSize:12, color:'rgba(255,255,255,0.35)', marginTop:2 }}>Personal finances overview</div>
                  </div>
                  <div style={{ display:'flex', gap:8 }}>
                    <div style={{ background:'rgba(59,122,120,0.15)', border:'1px solid rgba(59,122,120,0.3)', borderRadius:8, padding:'5px 12px', fontSize:12, color:'#4E9E9B', fontWeight:500 }}>+ Add transaction</div>
                    <div style={{ background:'rgba(59,122,120,0.15)', border:'1px solid rgba(59,122,120,0.3)', borderRadius:8, padding:'5px 12px', fontSize:12, color:'#4E9E9B', fontWeight:500 }}>⇄ Transfer</div>
                  </div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:16 }}>
                  {[
                    { label:'Balance today', value:'£4,820', sub:'Current account', pos:true },
                    { label:'Forecast · 3 months', value:'£6,140', sub:'Recurring projected', pos:false },
                    { label:'April spend', value:'−£1,248', sub:'vs £1,400 budget', neg:true },
                    { label:'Savings rate', value:'34%', sub:'This month', pos:true },
                  ].map(s => (
                    <div key={s.label} style={{ background:'rgba(255,255,255,0.04)', borderRadius:10, padding:'12px 14px', border:'1px solid rgba(255,255,255,0.07)' }}>
                      <div style={{ fontSize:10, color:'rgba(255,255,255,0.30)', marginBottom:5 }}>{s.label}</div>
                      <div style={{ fontSize:20, fontWeight:700, letterSpacing:-0.5, color: s.pos ? '#3EC97A' : s.neg ? '#E5534B' : '#fff' }}>{s.value}</div>
                      <div style={{ fontSize:10, color:'rgba(255,255,255,0.25)', marginTop:2 }}>{s.sub}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 240px', gap:10 }}>
                  <div style={{ background:'rgba(255,255,255,0.04)', borderRadius:10, border:'1px solid rgba(255,255,255,0.07)', display:'flex', flexDirection:'column', overflow:'hidden' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6, padding:'10px 12px 9px', borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
                      <div style={{ display:'flex', gap:4, flex:1 }}>
                        {(['Combined','Current','Savings'] as string[]).map((tab, i) => (
                          <span key={tab} style={{ fontSize:9, fontWeight:700, padding:'3px 8px', borderRadius:6, border:'1px solid', background: i===0 ? '#3B7A78' : 'rgba(255,255,255,0.05)', color: i===0 ? '#fff' : 'rgba(255,255,255,0.35)', borderColor: i===0 ? '#3B7A78' : 'rgba(255,255,255,0.10)' }}>{tab}</span>
                        ))}
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 19l-7-7 7-7"/></svg>
                        <span style={{ fontSize:11, fontWeight:700, color:'#fff' }}>April 2025</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5l7 7-7 7"/></svg>
                      </div>
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2, padding:'6px 8px 2px', background:'rgba(0,0,0,0.12)' }}>
                      {(['M','T','W','T','F','S','S'] as string[]).map((d, i) => (
                        <div key={i} style={{ textAlign:'center', fontSize:9, fontWeight:700, color:'rgba(255,255,255,0.25)', padding:'2px 0' }}>{d}</div>
                      ))}
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2, padding:'2px 8px 8px', flex:1 }}>
                      {(([
                        {d:'31',grey:true,bal:null,txs:[]},
                        {d:'1', grey:false,bal:'£4,820',pos:true, txs:[{n:'Salary',inc:true},{n:'Rent',inc:false}]},
                        {d:'2', grey:false,bal:'£4,820',pos:true, txs:[]},
                        {d:'3', grey:false,bal:'£4,820',pos:true, txs:[]},
                        {d:'4', grey:false,bal:'£4,820',pos:true, txs:[]},
                        {d:'5', grey:false,bal:'£4,803',pos:true, txs:[{n:'Netflix',inc:false}]},
                        {d:'6', grey:false,bal:'£4,803',pos:true, txs:[]},
                        {d:'7', grey:false,bal:'£4,803',pos:true, txs:[]},
                        {d:'8', grey:false,bal:'£4,803',pos:true, txs:[]},
                        {d:'9', grey:false,bal:'£4,803',pos:true, txs:[]},
                        {d:'10',grey:false,bal:'£4,303',pos:true, txs:[{n:'→ Savings',inc:false}]},
                        {d:'11',grey:false,bal:'£4,303',pos:true, txs:[]},
                        {d:'12',grey:false,bal:'£4,303',pos:true, txs:[]},
                        {d:'13',grey:false,bal:'£4,303',pos:true, txs:[]},
                        {d:'14',grey:false,bal:'£4,216',pos:true,today:true,sel:true,txs:[{n:'Groceries',inc:false}]},
                        {d:'15',grey:false,bal:'£4,216',pos:true, txs:[]},
                        {d:'16',grey:false,bal:'£4,216',pos:true, txs:[]},
                        {d:'17',grey:false,bal:'£4,216',pos:true, txs:[]},
                        {d:'18',grey:false,bal:'£4,216',pos:true, txs:[]},
                        {d:'19',grey:false,bal:'£4,216',pos:true, txs:[]},
                        {d:'20',grey:false,bal:'£4,216',pos:true, txs:[]},
                        {d:'21',grey:false,bal:'£4,216',pos:true, txs:[]},
                        {d:'22',grey:false,bal:'£4,216',pos:true, txs:[]},
                        {d:'23',grey:false,bal:'£4,216',pos:true, txs:[]},
                        {d:'24',grey:false,bal:'£4,216',pos:true, txs:[]},
                        {d:'25',grey:false,bal:'£4,216',pos:true, txs:[]},
                        {d:'26',grey:false,bal:'£4,216',pos:true, txs:[]},
                        {d:'27',grey:false,bal:'£4,216',pos:true, txs:[]},
                        {d:'28',grey:false,bal:'£4,096',pos:true, txs:[{n:'Insurance',inc:false}]},
                        {d:'29',grey:false,bal:'£4,096',pos:true, txs:[]},
                        {d:'30',grey:false,bal:'£4,096',pos:true, txs:[]},
                        {d:'1', grey:true, bal:null,txs:[]},
                        {d:'2', grey:true, bal:null,txs:[]},
                        {d:'3', grey:true, bal:null,txs:[]},
                        {d:'4', grey:true, bal:null,txs:[]},
                      ] as Array<{d:string;grey?:boolean;bal?:string|null;pos?:boolean;today?:boolean;sel?:boolean;txs:Array<{n:string;inc:boolean}>}>)).map((cell, i) => (
                        <div key={i} style={{ borderRadius:6, padding:'4px 4px 3px', position:'relative', overflow:'hidden', display:'flex', flexDirection:'column', minHeight:38, border:'1px solid', background: cell.grey ? 'rgba(255,255,255,0.02)' : cell.sel ? 'rgba(59,122,120,0.12)' : cell.pos ? 'rgba(59,122,120,0.07)' : 'rgba(255,255,255,0.04)', borderColor: cell.grey ? 'rgba(255,255,255,0.04)' : cell.sel ? 'rgba(59,122,120,0.50)' : cell.today ? 'rgba(59,122,120,0.30)' : 'rgba(255,255,255,0.06)' }}>
                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                            <span style={{ fontSize:9, fontWeight:700, lineHeight:1, width:14, height:14, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:'50%', background: cell.today ? '#3B7A78' : 'transparent', color: cell.grey ? 'rgba(255,255,255,0.15)' : cell.today ? '#fff' : cell.sel ? '#4E9E9B' : 'rgba(255,255,255,0.30)' }}>{cell.d}</span>
                            {cell.txs && cell.txs.length > 0 && (
                              <span style={{ fontSize:7, fontWeight:700, padding:'1px 3px', borderRadius:3, background: cell.pos ? 'rgba(59,122,120,0.2)' : 'rgba(229,83,75,0.2)', color: cell.pos ? '#4E9E9B' : '#E5534B' }}>{cell.txs.length}</span>
                            )}
                          </div>
                          {cell.txs && cell.txs.length > 0 && (
                            <div style={{ marginTop:2 }}>
                              {cell.txs.slice(0,1).map((tx, j) => (
                                <div key={j} style={{ display:'flex', alignItems:'center', gap:2 }}>
                                  <div style={{ width:2, height:2, borderRadius:'50%', background: tx.inc ? '#3EC97A' : '#E5534B', flexShrink:0 }} />
                                  <span style={{ fontSize:7, color:'rgba(255,255,255,0.30)', overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis', maxWidth:36 }}>{tx.n}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          {cell.bal && <span style={{ marginTop:'auto', fontSize:7, fontWeight:800, color: cell.pos ? '#4E9E9B' : '#E5534B', lineHeight:1 }}>{cell.bal}</span>}
                          {cell.bal && !cell.sel && <div style={{ position:'absolute', bottom:0, left:0, right:0, height:2, borderRadius:'0 0 6px 6px', background: cell.pos ? 'linear-gradient(90deg,rgba(59,122,120,0.5),transparent)' : 'linear-gradient(90deg,rgba(229,83,75,0.5),transparent)' }} />}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ background:'rgba(255,255,255,0.04)', borderRadius:10, padding:14, border:'1px solid rgba(255,255,255,0.07)' }}>
                    <div style={{ fontSize:11, color:'rgba(255,255,255,0.40)', marginBottom:10, fontWeight:500 }}>Recent transactions</div>
                    {[
                      { name:'Salary',              tag:'Income',   date:'1 Apr', amt:'+£3,200', c:'#3EC97A', dot:'#3B7A78' },
                      { name:'Rent',                tag:'Housing',  date:'1 Apr', amt:'−£950',   c:'#E5534B', dot:'#E5534B' },
                      { name:'→ Transfer · Savings',tag:'Transfer', date:'31 Mar',amt:'−£500',   c:'rgba(255,255,255,0.45)', dot:'#4E9E9B' },
                      { name:'Groceries',           tag:'Food',     date:'30 Mar',amt:'−£87',    c:'#E5534B', dot:'#F0A04B' },
                      { name:'Netflix',             tag:'Subs',     date:'28 Mar',amt:'−£17',    c:'#E5534B', dot:'#E5534B' },
                      { name:'Freelance',           tag:'Income',   date:'27 Mar',amt:'+£450',   c:'#3EC97A', dot:'#3B7A78' },
                    ].map(tx => (
                      <div key={tx.name} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                        <span style={{ width:7, height:7, borderRadius:'50%', background:tx.dot, flexShrink:0, display:'inline-block' }} />
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:11, color:'rgba(255,255,255,0.80)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{tx.name}</div>
                          <div style={{ fontSize:9, color:'rgba(255,255,255,0.25)' }}>{tx.tag}</div>
                        </div>
                        <div style={{ textAlign:'right', flexShrink:0 }}>
                          <div style={{ fontSize:11, fontWeight:600, color:tx.c }}>{tx.amt}</div>
                          <div style={{ fontSize:9, color:'rgba(255,255,255,0.25)' }}>{tx.date}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── MOBILE: phone frame mockup ── */}
          <div className="m-phone-preview">
            <div style={{ width:300, borderRadius:40, overflow:'hidden', border:'3px solid rgba(255,255,255,0.12)', boxShadow:'0 32px 80px rgba(0,0,0,0.7)', background:'#0D1F1E' }}>
              {/* Status bar */}
              <div style={{ height:32, background:'#142d2c', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 20px', fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.6)' }}>
                <span>9:41</span>
                <div style={{ display:'flex', gap:5, alignItems:'center' }}>
                  <svg width="14" height="10" viewBox="0 0 14 10" fill="none"><rect x="0" y="3" width="2.5" height="7" rx="1" fill="rgba(255,255,255,0.5)"/><rect x="3.5" y="2" width="2.5" height="8" rx="1" fill="rgba(255,255,255,0.6)"/><rect x="7" y="0.5" width="2.5" height="9.5" rx="1" fill="rgba(255,255,255,0.8)"/><rect x="10.5" y="0" width="2.5" height="10" rx="1" fill="white"/></svg>
                  <svg width="14" height="10" viewBox="0 0 14 10" fill="white"><path d="M7 2.5C9.2 2.5 11.1 3.5 12.4 5L13.5 3.8C11.9 2 9.6 1 7 1s-4.9 1-6.5 2.8L1.6 5C2.9 3.5 4.8 2.5 7 2.5zM7 5.5c1.3 0 2.5.6 3.3 1.5L11.6 5.7C10.4 4.4 8.8 3.6 7 3.6s-3.4.8-4.6 2.1L3.7 7C4.5 6.1 5.7 5.5 7 5.5zM7 8.5c.7 0 1.3.3 1.7.8L7 11 5.3 9.3C5.7 8.8 6.3 8.5 7 8.5z"/></svg>
                  <div style={{ width:22, height:11, border:'1.5px solid rgba(255,255,255,0.5)', borderRadius:3, display:'flex', alignItems:'center', padding:'0 1.5px', gap:1 }}>
                    <div style={{ width:14, height:7, background:'#3EC97A', borderRadius:2 }} />
                    <div style={{ width:3, height:5, background:'rgba(255,255,255,0.3)', borderRadius:1 }} />
                  </div>
                </div>
              </div>

              {/* App content */}
              <div style={{ padding:'16px 16px 0', background:'#0D1F1E' }}>
                {/* Header */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                  <div>
                    <div style={{ fontSize:18, fontWeight:700, color:'#fff', letterSpacing:-0.3 }}>April 2025</div>
                    <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)' }}>Personal finances</div>
                  </div>
                  <div style={{ width:32, height:32, borderRadius:10, background:'rgba(59,122,120,0.15)', border:'1px solid rgba(59,122,120,0.3)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4E9E9B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                  </div>
                </div>

                {/* Balance cards */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:16 }}>
                  <div style={{ background:'rgba(59,122,120,0.12)', border:'1px solid rgba(59,122,120,0.3)', borderRadius:12, padding:'12px 14px' }}>
                    <div style={{ fontSize:9, color:'rgba(255,255,255,0.4)', marginBottom:4 }}>Balance today</div>
                    <div style={{ fontSize:20, fontWeight:700, color:'#fff', letterSpacing:-0.5 }}>£4,820</div>
                    <div style={{ fontSize:10, color:'#4E9E9B', marginTop:2 }}>↑ Forecast £6,140</div>
                  </div>
                  <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:'12px 14px' }}>
                    <div style={{ fontSize:9, color:'rgba(255,255,255,0.4)', marginBottom:4 }}>April spend</div>
                    <div style={{ fontSize:20, fontWeight:700, color:'#E5534B', letterSpacing:-0.5 }}>£1,248</div>
                    <div style={{ fontSize:10, color:'rgba(255,255,255,0.3)', marginTop:2 }}>of £1,400 budget</div>
                  </div>
                </div>

                {/* Today section */}
                <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'rgba(255,255,255,0.3)', marginBottom:8 }}>Today · 14 April</div>

                {/* Transaction items */}
                {[
                  { name:'Groceries',  tag:'Food',   amt:'−£87',    c:'#E5534B', dot:'#F0A04B' },
                  { name:'Salary',     tag:'Income', amt:'+£3,200', c:'#3EC97A', dot:'#3B7A78' },
                  { name:'Rent',       tag:'Housing',amt:'−£950',   c:'#E5534B', dot:'#E5534B' },
                  { name:'Netflix',    tag:'Subs',   amt:'−£17',    c:'#E5534B', dot:'#E5534B' },
                  { name:'Freelance',  tag:'Income', amt:'+£450',   c:'#3EC97A', dot:'#3B7A78' },
                ].map((tx, i) => (
                  <div key={tx.name} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 0', borderBottom: i < 4 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                    <div style={{ width:32, height:32, borderRadius:10, background:'rgba(255,255,255,0.05)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <div style={{ width:8, height:8, borderRadius:'50%', background:tx.dot }} />
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:500, color:'rgba(255,255,255,0.85)' }}>{tx.name}</div>
                      <div style={{ fontSize:11, color:'rgba(255,255,255,0.30)' }}>{tx.tag}</div>
                    </div>
                    <div style={{ fontSize:13, fontWeight:700, color:tx.c }}>{tx.amt}</div>
                  </div>
                ))}
              </div>

              {/* Bottom nav */}
              <div style={{ height:60, background:'#142d2c', borderTop:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', justifyContent:'space-around', padding:'0 8px' }}>
                {[
                  { label:'Home',     active:true,  icon:'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
                  { label:'Reports',  active:false, icon:'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
                  { label:'Accounts', active:false, icon:'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
                  { label:'Budgets',  active:false, icon:'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
                  { label:'Settings', active:false, icon:'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
                ].map(item => (
                  <div key={item.label} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, flex:1, padding:'4px 0' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={item.active ? '#4E9E9B' : 'rgba(255,255,255,0.25)'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={item.icon}/></svg>
                    <span style={{ fontSize:9, fontWeight:600, color: item.active ? '#4E9E9B' : 'rgba(255,255,255,0.25)' }}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section className="m-features-wrap" style={{ padding:'0 40px 80px', maxWidth:1100, margin:'0 auto' }}>
          <p style={{ fontSize:12, fontWeight:600, letterSpacing:'1.5px', color:'#3B7A78', textTransform:'uppercase', marginBottom:14 }}>Features</p>
          <h2 style={{ ...serif, fontSize:'clamp(28px, 4vw, 44px)', color:'#fff', fontWeight:400, lineHeight:1.15, marginBottom:40 }}>Everything you need. Nothing you don&apos;t.</h2>
          <div className="m-feature-grid" style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:16 }}>
            <div className="m-span2" style={{ background:'#0F2222', border:'1px solid rgba(255,255,255,0.07)', borderRadius:16, padding:24, gridColumn:'span 2' }}>
              <div style={{ width:40, height:40, background:'rgba(59,122,120,0.12)', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:16 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4E9E9B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941"/></svg>
              </div>
              <div style={{ fontSize:15, fontWeight:600, color:'#fff', marginBottom:8 }}>7-year balance forecast, day by day</div>
              <div style={{ fontSize:13, color:'rgba(255,255,255,0.55)', lineHeight:1.55 }}>See your exact account balance on any date in the future. Every recurring salary, rent, subscription and loan repayment is projected automatically. Know whether you can afford that holiday before booking it.</div>
              <span style={{ display:'inline-block', fontSize:11, fontWeight:600, background:'rgba(59,122,120,0.12)', color:'#4E9E9B', padding:'3px 9px', borderRadius:100, marginTop:12, border:'1px solid rgba(59,122,120,0.3)' }}>Core feature</span>
            </div>
            {[
              { icon:<path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3"/>, title:'Recurring transactions', body:'Add any schedule once — daily, weekly, fortnightly, monthly, annual. Spentum handles the rest forever.' },
              { icon:<path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"/>, title:'Spending reports & charts', body:'Monthly breakdowns by tag, income vs expenses, top transactions, annual savings rate. All rendered beautifully.' },
              { icon:<path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 21z"/>, title:'Multiple accounts', body:'Current account, savings, credit cards, cash. See combined or per-account balances and forecasts side by side.' },
              { icon:<path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4"/>, title:'Transfer between accounts', body:'Move money between accounts in one tap. Expense on the source, income on the destination — always accurate.' },
              { icon:<path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/>, title:'Savings goals', body:'Set a target amount and a deadline. Spentum tracks your progress and tells you exactly when you\'ll hit it.' },
            ].map(f => (
              <div key={f.title} style={{ background:'#0F2222', border:'1px solid rgba(255,255,255,0.07)', borderRadius:16, padding:24 }}>
                <div style={{ width:40, height:40, background:'rgba(59,122,120,0.12)', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:16 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4E9E9B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{f.icon}</svg>
                </div>
                <div style={{ fontSize:15, fontWeight:600, color:'#fff', marginBottom:8 }}>{f.title}</div>
                <div style={{ fontSize:13, color:'rgba(255,255,255,0.55)', lineHeight:1.55 }}>{f.body}</div>
              </div>
            ))}
            <div className="m-span2" style={{ background:'rgba(59,122,120,0.10)', border:'1px solid rgba(59,122,120,0.3)', borderRadius:16, padding:24, gridColumn:'span 2' }}>
              <div style={{ fontSize:17, fontWeight:600, color:'#fff', marginBottom:10 }}>📲 &nbsp;Native mobile apps — coming soon</div>
              <div style={{ fontSize:13, color:'rgba(255,255,255,0.55)', lineHeight:1.55 }}>Full Spentum experience on Android and iOS. Haptic feedback, offline support, push notifications for bills due. Sign up now to be first on the waitlist.</div>
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section className="m-steps-wrap" style={{ padding:'80px 40px', maxWidth:900, margin:'0 auto', textAlign:'center', borderTop:'1px solid rgba(255,255,255,0.07)' }}>
          <p style={{ fontSize:12, fontWeight:600, letterSpacing:'1.5px', color:'#3B7A78', textTransform:'uppercase', marginBottom:14 }}>How it works</p>
          <h2 style={{ ...serif, fontSize:'clamp(28px, 4vw, 44px)', color:'#fff', fontWeight:400, marginBottom:12 }}>Up and running in 3 minutes</h2>
          <p style={{ color:'rgba(255,255,255,0.55)', fontSize:16, marginBottom:48, fontWeight:300 }}>No bank connection. No complicated setup. Just your numbers.</p>
          <div className="steps-line m-steps-grid" style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:32, position:'relative' }}>
            {[
              { n:'1', title:'Create your account', body:'Sign up free with email. No credit card, no bank login. Takes 30 seconds.' },
              { n:'2', title:'Add accounts & transactions', body:'Set up accounts, then add recurring income and expenses. Enter once, tracked forever.' },
              { n:'3', title:'See your financial future', body:'Instantly see your projected balance day by day, weeks, months and years ahead.' },
            ].map(s => (
              <div key={s.n} style={{ position:'relative', textAlign:'left' }}>
                <div className="m-step-circle" style={{ width:56, height:56, borderRadius:'50%', background:'rgba(59,122,120,0.12)', border:'1px solid rgba(59,122,120,0.3)', display:'flex', alignItems:'center', justifyContent:'center', ...serif, fontSize:22, color:'#4E9E9B', margin:'0 auto 18px', position:'relative', zIndex:1 }}>{s.n}</div>
                <div style={{ fontSize:15, fontWeight:600, color:'#fff', marginBottom:8 }}>{s.title}</div>
                <div style={{ fontSize:13, color:'rgba(255,255,255,0.55)', lineHeight:1.55 }}>{s.body}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="m-faq-wrap" style={{ padding:'80px 40px', maxWidth:780, margin:'0 auto' }}>
          <p style={{ fontSize:12, fontWeight:600, letterSpacing:'1.5px', color:'#3B7A78', textTransform:'uppercase', marginBottom:14, textAlign:'center' }}>Common questions</p>
          <h2 style={{ ...serif, fontSize:'clamp(28px, 4vw, 44px)', color:'#fff', fontWeight:400, marginBottom:32, textAlign:'center' }}>Still not sure? We&apos;ve heard it all.</h2>
          {[
            { q:"Why don't you connect to my bank automatically?", a:"Because your banking credentials are yours. Automatic bank sync means handing credentials or OAuth tokens to a third party. When that third party gets hacked or sells data, your financial life is exposed. Manual entry takes an extra minute; it keeps your banking passwords out of any database except your bank's." },
            { q:"Isn't manual entry a lot of work?", a:"For one-off transactions, yes — but most people's finances are 80% recurring. Add your salary, rent, utilities and subscriptions once. Spentum projects them automatically forever. Daily logging is just the few discretionary things you actually bought." },
            { q:"Is Spentum really free?", a:"Completely free during beta. Sign up now and your free access is locked in forever. We may introduce a paid tier for new users later, but early adopters are never charged." },
            { q:"What currencies and languages are supported?", a:"Spentum supports multiple currencies and ships in English, Romanian, Spanish, French, German and Polish. More languages are coming." },
            { q:"How far ahead can it forecast my balance?", a:"Seven full years, day by day. Every recurring income and expense is calculated automatically so you always know precisely where your balance is heading." },
          ].map(faq => (
            <div key={faq.q} style={{ padding:'22px 0', borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ fontSize:15, fontWeight:500, color:'#fff', marginBottom:8, display:'flex', alignItems:'flex-start', gap:12 }}>
                <span style={{ width:20, height:20, background:'rgba(59,122,120,0.12)', borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, color:'#4E9E9B', flexShrink:0, marginTop:1, fontWeight:600 }}>?</span>
                {faq.q}
              </div>
              <div style={{ fontSize:14, color:'rgba(255,255,255,0.55)', lineHeight:1.6, paddingLeft:32 }}>{faq.a}</div>
            </div>
          ))}
        </section>

        {/* ── CTA ── */}
        <section className="m-cta-wrap" style={{ padding:'80px 40px', textAlign:'center', borderTop:'1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ maxWidth:600, margin:'0 auto' }}>
            <h2 style={{ ...serif, fontSize:'clamp(32px, 5vw, 52px)', color:'#fff', fontWeight:400, marginBottom:14, lineHeight:1.1 }}>
              Stop guessing.<br /><em style={{ fontStyle:'italic', color:'#4E9E9B' }}>Start knowing.</em>
            </h2>
            <p style={{ fontSize:16, color:'rgba(255,255,255,0.55)', marginBottom:36, fontWeight:300 }}>
              Join people using Spentum to see their financial future clearly — without handing their bank password to anyone.
            </p>
            <Link href="/signup" className="m-cta-btn" style={{ background:'#3B7A78', color:'#fff', fontSize:16, fontWeight:600, padding:'15px 34px', borderRadius:12, textDecoration:'none', display:'inline-flex', alignItems:'center', gap:8 }}>
              Create free account
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
            <p style={{ marginTop:18, fontSize:12, color:'rgba(255,255,255,0.30)' }}>No credit card. No bank connection. No nonsense. Free during beta.</p>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="m-footer" style={{ borderTop:'1px solid rgba(255,255,255,0.07)', padding:'28px 40px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
          <span style={{ fontSize:13, color:'rgba(255,255,255,0.30)' }}>© {new Date().getFullYear()} Spentum · spentum.com</span>
          <div style={{ display:'flex', gap:20 }}>
            <Link href="/blog" style={{ fontSize:13, color:'rgba(255,255,255,0.30)', textDecoration:'none' }}>Blog</Link>
            <Link href="/privacy" style={{ fontSize:13, color:'rgba(255,255,255,0.30)', textDecoration:'none' }}>Privacy</Link>
            <Link href="/terms" style={{ fontSize:13, color:'rgba(255,255,255,0.30)', textDecoration:'none' }}>Terms</Link>
            <Link href="/login" style={{ fontSize:13, color:'rgba(255,255,255,0.30)', textDecoration:'none' }}>Sign in</Link>
          </div>
        </footer>

      </div>
    </>
  );
}
