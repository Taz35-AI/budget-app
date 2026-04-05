import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'How to Actually Save Money (And What to Do About Debt) | Spentum',
  description: 'Practical, honest advice on building savings habits and paying off debt faster. No fluff, no gimmicks. Just what actually works when money is tight.',
  keywords: [
    'how to save money',
    'pay off debt',
    'budgeting tips',
    'debt repayment strategy',
    'snowball vs avalanche method',
    'emergency fund',
    '50 30 20 rule',
    'personal finance tips',
    'save money fast',
    'get out of debt',
  ],
  alternates: { canonical: 'https://www.spentum.com/blog/how-to-save-money-and-tackle-debt' },
  openGraph: {
    type: 'article',
    url: 'https://www.spentum.com/blog/how-to-save-money-and-tackle-debt',
    title: 'How to Actually Save Money (And What to Do About Debt)',
    description: 'Practical, honest advice on building savings habits and paying off debt faster. No fluff, no gimmicks.',
    siteName: 'Spentum',
    images: [{ url: 'https://www.spentum.com/og-image.png', width: 1200, height: 630 }],
    publishedTime: '2026-03-30T00:00:00.000Z',
    authors: ['Spentum'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'How to Actually Save Money (And What to Do About Debt)',
    description: 'Practical, honest advice on building savings habits and paying off debt faster.',
    images: ['https://www.spentum.com/og-image.png'],
  },
};

const serif = { fontFamily: "'Instrument Serif', Georgia, serif" } as const;
const sans  = { fontFamily: "'DM Sans', system-ui, sans-serif" } as const;

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: 'How to Actually Save Money (And What to Do About Debt)',
  description: 'Practical, honest advice on building savings habits and paying off debt faster. No fluff, no gimmicks. Just what actually works when money is tight.',
  url: 'https://www.spentum.com/blog/how-to-save-money-and-tackle-debt',
  datePublished: '2026-03-30',
  dateModified: '2026-03-30',
  author: { '@type': 'Organization', name: 'Spentum', url: 'https://www.spentum.com' },
  publisher: {
    '@type': 'Organization',
    name: 'Spentum',
    logo: { '@type': 'ImageObject', url: 'https://www.spentum.com/spentum.png' },
  },
  image: 'https://www.spentum.com/og-image.png',
  mainEntityOfPage: { '@type': 'WebPage', '@id': 'https://www.spentum.com/blog/how-to-save-money-and-tackle-debt' },
  keywords: 'save money, pay off debt, budgeting, emergency fund, debt repayment, personal finance',
  articleSection: 'Personal Finance',
  inLanguage: 'en-US',
};

export default function BlogPostPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div style={{ background: '#F4FDFB', color: '#042F2E', ...sans, minHeight: '100vh' }}>

        {/* NAV */}
        <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(244, 253, 251, 0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(13, 148, 136, 0.12)', height: 108, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <Image src="/spentum.png" alt="Spentum" width={360} height={120} style={{ height: 108, width: 'auto' }} priority />
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Link href="/blog" style={{ fontSize: 14, color: '#475569', padding: '6px 14px', borderRadius: 8, textDecoration: 'none' }}>Blog</Link>
            <Link href="/login" style={{ fontSize: 14, color: '#475569', padding: '6px 14px', borderRadius: 8, textDecoration: 'none' }}>Sign in</Link>
            <Link href="/signup" style={{ fontSize: 14, fontWeight: 500, background: '#0D9488', color: '#fff', padding: '7px 18px', borderRadius: 10, textDecoration: 'none' }}>Get started free</Link>
          </div>
        </nav>

        {/* ARTICLE */}
        <article style={{ maxWidth: 720, margin: '0 auto', padding: '60px 24px 100px' }}>

          {/* Breadcrumb */}
          <nav aria-label="breadcrumb" style={{ marginBottom: 36 }}>
            <ol style={{ display: 'flex', gap: 8, fontSize: 13, color: '#94a3b8', listStyle: 'none', padding: 0, margin: 0, alignItems: 'center' }}>
              <li><Link href="/" style={{ color: '#94a3b8', textDecoration: 'none' }}>Home</Link></li>
              <li style={{ opacity: 0.4 }}>/</li>
              <li><Link href="/blog" style={{ color: '#94a3b8', textDecoration: 'none' }}>Blog</Link></li>
              <li style={{ opacity: 0.4 }}>/</li>
              <li style={{ color: '#475569' }}>How to save money and tackle debt</li>
            </ol>
          </nav>

          {/* Category + date */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#0D9488', background: 'rgba(13, 148, 136, 0.08)', border: '1px solid rgba(13, 148, 136, 0.25)', borderRadius: 100, padding: '3px 10px' }}>Personal Finance</span>
            <time dateTime="2026-03-30" style={{ fontSize: 13, color: '#94a3b8' }}>March 30, 2026</time>
            <span style={{ fontSize: 13, color: '#94a3b8' }}>12 min read</span>
          </div>

          {/* Title */}
          <h1 style={{ ...serif, fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 400, color: '#042F2E', lineHeight: 1.1, letterSpacing: -0.5, marginBottom: 20 }}>
            How to Actually Save Money (And What to Do About Debt)
          </h1>

          <p style={{ fontSize: 19, color: '#475569', lineHeight: 1.6, marginBottom: 48, fontWeight: 300 }}>
            Nobody talks about how messy the early stages really are. You set a budget, break it within two weeks, feel guilty, and give up. Then you do it again next January. This guide skips the motivation speeches and gets into what actually works.
          </p>

          <hr style={{ border: 'none', borderTop: '1px solid rgba(13, 148, 136, 0.12)', marginBottom: 48 }} />

          {/* CONTENT */}
          <div style={{ fontSize: 16, lineHeight: 1.8, color: '#042F2E' }}>

            <h2 style={{ ...serif, fontSize: 28, fontWeight: 400, color: '#042F2E', marginBottom: 16, marginTop: 48 }}>
              Start by looking at what you actually spend
            </h2>
            <p>Most people guess their monthly spending and get it badly wrong. They know the big things like rent and car payments, but the daily stuff adds up quietly. Coffees, subscriptions you forgot about, takeaways three times a week. None of it feels like much on its own.</p>
            <p style={{ marginTop: 16 }}>The only way to know where your money goes is to track it. Not in your head. Actually write it down or use an app for a full month. No judgment, no changes yet. Just look at the numbers.</p>
            <p style={{ marginTop: 16 }}>What you find will probably surprise you. It always does. And once you see it clearly, you can decide what matters and what does not.</p>

            <h2 style={{ ...serif, fontSize: 28, fontWeight: 400, color: '#042F2E', marginBottom: 16, marginTop: 48 }}>
              Build an emergency fund before anything else
            </h2>
            <p>Before you attack debt, before you invest, before you do anything clever with your money, you need a buffer. A small one is fine to start. Even 500 to 1000 euros or dollars set aside changes everything.</p>
            <p style={{ marginTop: 16 }}>Why? Because without it, every unexpected cost goes on a credit card. Car needs a repair, you borrow. Boiler breaks, you borrow. The debt never shrinks because something always comes up.</p>
            <p style={{ marginTop: 16 }}>With a buffer in place, you pay for the unexpected thing and move on. You do not spiral. That is the point of it.</p>
            <p style={{ marginTop: 16 }}>Once you have that first layer saved, you can work toward three to six months of living expenses. That is the proper target, but do not wait for it before doing anything else. Start with the small buffer and build from there.</p>

            <div style={{ background: 'rgba(13, 148, 136, 0.06)', border: '1px solid rgba(13, 148, 136, 0.2)', borderRadius: 12, padding: '20px 24px', margin: '32px 0' }}>
              <p style={{ margin: 0, color: '#475569', fontStyle: 'italic' }}>
                "The emergency fund is not a savings goal. It is a firewall between you and more debt."
              </p>
            </div>

            <h2 style={{ ...serif, fontSize: 28, fontWeight: 400, color: '#042F2E', marginBottom: 16, marginTop: 48 }}>
              The 50/30/20 rule, and why it does not always fit
            </h2>
            <p>You have probably heard of this one. Fifty percent of your take-home pay goes to needs, thirty to wants, twenty to savings and debt repayment. It is a decent starting framework.</p>
            <p style={{ marginTop: 16 }}>The problem is that for a lot of people, especially in expensive cities or on lower incomes, the math does not work. Rent alone can eat sixty or seventy percent. So the rule becomes useless because the numbers feel unachievable.</p>
            <p style={{ marginTop: 16 }}>Instead of forcing the percentages, use the structure. The idea is simply that you split your income into three buckets: what you must pay, what you choose to spend, and what you keep. The specific percentages are just a target, not a rule carved in stone.</p>
            <p style={{ marginTop: 16 }}>If you can only save five percent right now, save five percent. That is better than saving nothing while waiting until you can hit twenty.</p>

            <h3 style={{ fontSize: 18, fontWeight: 600, color: '#042F2E', marginBottom: 12, marginTop: 32 }}>A version that works on a tight budget</h3>
            <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <li><strong style={{ color: '#042F2E' }}>Needs first.</strong> Housing, groceries, utilities, transport, minimum debt payments. These come out before anything else.</li>
              <li><strong style={{ color: '#042F2E' }}>Save a fixed amount on payday.</strong> Not what is left at the end of the month. Set up an automatic transfer on the day your pay arrives.</li>
              <li><strong style={{ color: '#042F2E' }}>Spend what is left.</strong> Whatever remains after needs and savings is yours to use without guilt.</li>
            </ul>
            <p style={{ marginTop: 16 }}>This approach works because you stop trying to save from what is left. Saving becomes the second thing that happens, not the last.</p>

            <h2 style={{ ...serif, fontSize: 28, fontWeight: 400, color: '#042F2E', marginBottom: 16, marginTop: 48 }}>
              How to actually pay off debt
            </h2>
            <p>There are two main methods people use, and both work. The choice depends on your personality more than the math.</p>

            <h3 style={{ fontSize: 18, fontWeight: 600, color: '#042F2E', marginBottom: 12, marginTop: 32 }}>The avalanche method</h3>
            <p>List all your debts. Pay the minimum on everything. Put any extra money toward the debt with the highest interest rate first.</p>
            <p style={{ marginTop: 16 }}>Once that one is paid off, move the money you were putting into it onto the next highest rate. You keep rolling the payments forward as each debt disappears.</p>
            <p style={{ marginTop: 16 }}>This is the cheapest way to pay off debt. You pay less interest overall because you kill the expensive ones first.</p>

            <h3 style={{ fontSize: 18, fontWeight: 600, color: '#042F2E', marginBottom: 12, marginTop: 32 }}>The snowball method</h3>
            <p>Same idea, but instead of targeting the highest interest rate, you target the smallest balance first. Pay minimums everywhere else, attack the smallest debt with everything you have.</p>
            <p style={{ marginTop: 16 }}>When it is gone, that is a real win. You feel it. You take the money and point it at the next smallest. The momentum builds.</p>
            <p style={{ marginTop: 16 }}>Research actually shows that people stick with the snowball method better. The early wins keep you going. If you have tried the avalanche before and lost motivation, try this instead. The best debt strategy is the one you will actually follow through on.</p>

            <div style={{ background: 'rgba(13, 148, 136, 0.03)', border: '1px solid rgba(13, 148, 136, 0.12)', borderRadius: 12, padding: '24px', margin: '32px 0' }}>
              <p style={{ margin: 0, fontWeight: 600, color: '#042F2E', marginBottom: 12 }}>Quick example: snowball vs avalanche</p>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7 }}>Say you have three debts: a 200 credit card at 28% interest, a 1,500 personal loan at 12%, and a 4,000 car loan at 7%. The avalanche says attack the credit card first. The snowball says attack the credit card first too, because it is also the smallest balance. In this case they are the same. Once that is gone, avalanche goes to the personal loan, snowball goes there too. They diverge more on larger, more spread out debts. But both methods move you forward.</p>
            </div>

            <h2 style={{ ...serif, fontSize: 28, fontWeight: 400, color: '#042F2E', marginBottom: 16, marginTop: 48 }}>
              Small spending cuts that actually add up
            </h2>
            <p>Cutting back on lattes is not going to make you rich. But the principle behind it matters. Spending on things you do not really want, out of habit or convenience, is money that could be working somewhere else.</p>
            <p style={{ marginTop: 16 }}>Go through your bank statements and highlight every recurring charge. Subscriptions especially. Most people are paying for at least two or three things they barely use. Cancel them today, not later.</p>
            <p style={{ marginTop: 16 }}>Then look at the categories where you overspend most. For a lot of people it is food. Groceries get wasted, takeaway fills the gaps. Fixing this one area often frees up 100 to 300 a month without feeling like a sacrifice, because you were not getting value from the spending anyway.</p>

            <h3 style={{ fontSize: 18, fontWeight: 600, color: '#042F2E', marginBottom: 12, marginTop: 32 }}>Areas worth reviewing</h3>
            <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <li><strong style={{ color: '#042F2E' }}>Subscriptions.</strong> Streaming, software, apps, magazines. List them all. Cancel anything you have not used in the past 30 days.</li>
              <li><strong style={{ color: '#042F2E' }}>Takeaway and food delivery.</strong> Set a realistic weekly limit rather than trying to eliminate it. The limit is more sustainable than a ban.</li>
              <li><strong style={{ color: '#042F2E' }}>Impulse buys online.</strong> Add to cart, wait 48 hours. If you still want it, you can decide then. Most times you forget about it.</li>
              <li><strong style={{ color: '#042F2E' }}>Insurance and utilities.</strong> These feel fixed but rarely are. A 20-minute call to your providers once a year can save you hundreds.</li>
              <li><strong style={{ color: '#042F2E' }}>Unused gym memberships.</strong> Classic. Be honest with yourself about what you actually use.</li>
            </ul>

            <h2 style={{ ...serif, fontSize: 28, fontWeight: 400, color: '#042F2E', marginBottom: 16, marginTop: 48 }}>
              Automate saving so willpower is not involved
            </h2>
            <p>Relying on willpower to save money does not work long term. You have to make the decision once and take it out of your hands.</p>
            <p style={{ marginTop: 16 }}>Set up an automatic transfer to your savings account on the day you get paid. Before you see the money in your current account. Before you can spend it on something else.</p>
            <p style={{ marginTop: 16 }}>Even if the amount feels small, 50 a month, do it. The habit is more valuable than the amount at first. You adjust to living on the remainder, and you can increase it later when you find more room.</p>
            <p style={{ marginTop: 16 }}>The same works for debt repayment. Automate the extra payment. If you wait until the end of the month to see what is left, there will never be anything left. Money that sits in your current account gets spent.</p>

            <h2 style={{ ...serif, fontSize: 28, fontWeight: 400, color: '#042F2E', marginBottom: 16, marginTop: 48 }}>
              What to do when it feels impossible
            </h2>
            <p>Sometimes the numbers genuinely do not add up. Income is too low, costs are too high, and the margin is not there. That is a real situation and it is not solved by cutting more lattes.</p>
            <p style={{ marginTop: 16 }}>In that case, the income side needs attention. That might mean asking for a raise, picking up extra work, selling things you do not need, or looking at whether your current job is actually competitive for what you do.</p>
            <p style={{ marginTop: 16 }}>On the debt side, if repayment feels impossible, look into whether you qualify for any debt consolidation or, in more serious situations, speak to a free debt advice service. In the UK, StepChange is free and does not judge. In the US, the NFCC has certified counselors. In most countries there is something similar.</p>
            <p style={{ marginTop: 16 }}>Ignoring debt does not make it smaller. Interest keeps running. Talking to someone about it, even if it feels embarrassing, usually reveals more options than you thought you had.</p>

            <h2 style={{ ...serif, fontSize: 28, fontWeight: 400, color: '#042F2E', marginBottom: 16, marginTop: 48 }}>
              Track where you stand and what is coming
            </h2>
            <p>One of the most underrated things you can do for your finances is look at your future balance. Not just today's number, but where you will be in three, six, twelve months if you keep spending and saving the way you are now.</p>
            <p style={{ marginTop: 16 }}>When you can see that you are heading for trouble in four months, you have time to do something about it. When you can see that your savings will hit a target by August, you have something to stay motivated for.</p>
            <p style={{ marginTop: 16 }}>This is exactly what we built Spentum for. You log your recurring income and expenses, set up your accounts, and the app shows you your projected balance day by day, up to seven years ahead. No bank login required. Your data stays yours.</p>

            <div style={{ background: 'rgba(13, 148, 136, 0.06)', border: '1px solid rgba(13, 148, 136, 0.2)', borderRadius: 16, padding: '28px 28px', margin: '40px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#042F2E' }}>Start tracking with Spentum</p>
              <p style={{ margin: 0, fontSize: 15, color: '#475569', lineHeight: 1.6 }}>See your future balance, track recurring income and expenses, and stop guessing where your money goes. Free during beta, no bank login needed.</p>
              <div>
                <Link href="/signup" style={{ display: 'inline-block', background: '#0D9488', color: '#fff', fontSize: 14, fontWeight: 600, padding: '11px 22px', borderRadius: 10, textDecoration: 'none' }}>
                  Try Spentum free
                </Link>
              </div>
            </div>

            <h2 style={{ ...serif, fontSize: 28, fontWeight: 400, color: '#042F2E', marginBottom: 16, marginTop: 48 }}>
              The honest summary
            </h2>
            <p>Saving money and paying off debt are not complicated. They are just uncomfortable. You have to look at things you would rather ignore, make tradeoffs you would rather not make, and do it consistently for longer than feels motivating.</p>
            <p style={{ marginTop: 16 }}>But the basics actually work. Track your spending. Build a small buffer. Pay yourself first by saving on payday. Attack one debt at a time. Automate what you can so you stop relying on discipline alone.</p>
            <p style={{ marginTop: 16 }}>You do not need to be perfect. Missing a month does not undo progress. You just pick it back up and keep going.</p>
            <p style={{ marginTop: 16 }}>The people who get ahead financially are not smarter or higher earners. They are the ones who stayed consistent long enough for it to matter.</p>

          </div>

          {/* TAGS */}
          <div style={{ marginTop: 56, paddingTop: 32, borderTop: '1px solid rgba(13, 148, 136, 0.12)', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {['Saving Money', 'Debt Repayment', 'Budgeting', 'Emergency Fund', 'Personal Finance', 'Snowball Method', 'Avalanche Method'].map((tag) => (
              <span key={tag} style={{ fontSize: 13, color: '#64748b', background: 'rgba(13, 148, 136, 0.04)', border: '1px solid rgba(13, 148, 136, 0.12)', borderRadius: 100, padding: '4px 12px' }}>
                {tag}
              </span>
            ))}
          </div>

          {/* BACK LINK */}
          <div style={{ marginTop: 48 }}>
            <Link href="/blog" style={{ fontSize: 14, color: '#0D9488', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
              Back to blog
            </Link>
          </div>

        </article>

        {/* FOOTER */}
        <footer style={{ borderTop: '1px solid rgba(13, 148, 136, 0.12)', padding: '32px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <span style={{ fontSize: 13, color: '#94a3b8' }}>© {new Date().getFullYear()} Spentum. All rights reserved.</span>
          <div style={{ display: 'flex', gap: 20 }}>
            <Link href="/privacy" style={{ fontSize: 13, color: '#94a3b8', textDecoration: 'none' }}>Privacy</Link>
            <Link href="/terms" style={{ fontSize: 13, color: '#94a3b8', textDecoration: 'none' }}>Terms</Link>
            <Link href="/blog" style={{ fontSize: 13, color: '#94a3b8', textDecoration: 'none' }}>Blog</Link>
          </div>
        </footer>

      </div>
    </>
  );
}
