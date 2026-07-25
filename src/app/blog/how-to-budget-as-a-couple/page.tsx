import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';

const POST_URL = 'https://www.spentum.com/blog/how-to-budget-as-a-couple';
const DESC = 'A practical guide to budgeting as a couple: how to split bills fairly, choose joint or separate accounts, build a shared budget, and stop arguing about money.';

export const metadata: Metadata = {
  title: 'How to Budget as a Couple Without Arguing About Money | Spentum',
  description: DESC,
  keywords: [
    'how to budget as a couple',
    'budgeting for couples',
    'managing money as a couple',
    'joint vs separate accounts',
    'how to split bills with your partner',
    'couples finances',
    'money and relationships',
    'shared budget',
    'household budget',
    'budgeting together',
    'splitting expenses proportional to income',
  ],
  alternates: { canonical: POST_URL },
  openGraph: {
    type: 'article',
    url: POST_URL,
    title: 'How to Budget as a Couple Without Arguing About Money',
    description: DESC,
    siteName: 'Spentum',
    locale: 'en_GB',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Spentum shared household budget app', type: 'image/png' }],
    publishedTime: '2026-07-25T00:00:00.000Z',
    authors: ['Spentum'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'How to Budget as a Couple Without Arguing About Money',
    description: DESC,
    images: ['/og-image.png'],
  },
};

const serif = { fontFamily: "'Space Grotesk', Georgia, serif" } as const;
const sans  = { fontFamily: "'DM Sans', system-ui, sans-serif" } as const;
const link  = { color: '#0D9488', textDecoration: 'none', fontWeight: 500 } as const;

const FAQ = [
  {
    q: 'Should couples combine their finances?',
    a: 'There is no rule that says you must. Fully joint, fully separate, and a hybrid of the two all work. Most couples who argue least about money use the hybrid: shared accounts for joint costs, and personal accounts for individual spending.',
  },
  {
    q: 'Is it better to have joint or separate bank accounts?',
    a: 'Both have trade offs. Joint accounts make shared life simple and transparent. Separate accounts protect independence. A joint account for bills plus separate personal accounts tends to give couples the best of both.',
  },
  {
    q: 'How should a couple split the bills?',
    a: 'Two fair approaches work well: an even fifty fifty split when incomes are similar, or a split proportional to income when one person earns more. The proportional method usually feels fairer when there is a real income gap.',
  },
  {
    q: 'How often should couples talk about money?',
    a: 'A short monthly check in works well for most couples. It keeps both people informed, catches problems early, and means money conversations happen calmly rather than in the heat of an argument.',
  },
  {
    q: 'What is the best way to budget as a couple?',
    a: 'Agree how you will structure your accounts, split shared costs fairly, give each person a no questions asked amount, and track one shared budget that both of you can see. A shared, forward looking budget removes the guesswork that causes most money arguments.',
  },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'BlogPosting',
      headline: 'How to Budget as a Couple Without Arguing About Money',
      description: DESC,
      url: POST_URL,
      datePublished: '2026-07-25',
      dateModified: '2026-07-25',
      author: { '@type': 'Organization', name: 'Spentum', url: 'https://www.spentum.com' },
      publisher: {
        '@type': 'Organization',
        name: 'Spentum',
        logo: { '@type': 'ImageObject', url: 'https://www.spentum.com/spentum.png' },
      },
      image: 'https://www.spentum.com/og-image.png',
      mainEntityOfPage: { '@type': 'WebPage', '@id': POST_URL },
      keywords: 'budgeting as a couple, joint vs separate accounts, splitting bills, shared budget, money and relationships, household budget',
      articleSection: 'Money & Relationships',
      inLanguage: 'en-GB',
      wordCount: 1950,
    },
    {
      '@type': 'FAQPage',
      mainEntity: FAQ.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.spentum.com' },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://www.spentum.com/blog' },
        { '@type': 'ListItem', position: 3, name: 'How to Budget as a Couple', item: POST_URL },
      ],
    },
  ],
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
              <li style={{ color: '#475569' }}>How to budget as a couple</li>
            </ol>
          </nav>

          {/* Category + date */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#0D9488', background: 'rgba(13, 148, 136, 0.08)', border: '1px solid rgba(13, 148, 136, 0.25)', borderRadius: 100, padding: '3px 10px' }}>Money &amp; Relationships</span>
            <time dateTime="2026-07-25" style={{ fontSize: 13, color: '#94a3b8' }}>July 25, 2026</time>
            <span style={{ fontSize: 13, color: '#94a3b8' }}>13 min read</span>
          </div>

          {/* Title */}
          <h1 style={{ ...serif, fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 400, color: '#042F2E', lineHeight: 1.1, letterSpacing: -0.5, marginBottom: 20 }}>
            How to Budget as a Couple Without Arguing About Money
          </h1>

          <p style={{ fontSize: 19, color: '#475569', lineHeight: 1.6, marginBottom: 48, fontWeight: 300 }}>
            Money is one of the most common things couples argue about, and study after study puts it near the top of the reasons relationships fall apart. Here is the part that gets missed: the arguments are almost never about the money itself. This is a practical, judgement free guide to building a shared budget, splitting the bills in a way that feels fair, and planning a future together without the tension.
          </p>

          <hr style={{ border: 'none', borderTop: '1px solid rgba(13, 148, 136, 0.12)', marginBottom: 48 }} />

          {/* CONTENT */}
          <div style={{ fontSize: 16, lineHeight: 1.8, color: '#042F2E' }}>

            <h2 style={{ ...serif, fontSize: 28, fontWeight: 400, color: '#042F2E', marginBottom: 16, marginTop: 8 }}>
              Money arguments are rarely about money
            </h2>
            <p>When a couple argues about a purchase, the number on the receipt is usually not the real issue. Underneath it sits something bigger. A feeling of not being consulted. A difference in what each person thinks money is even for. An old fear carried in from how each of you grew up.</p>
            <p style={{ marginTop: 16 }}>One of you might see savings as safety. The other might see spending as living. Neither is wrong. The trouble starts when those two views collide without anyone naming them out loud.</p>
            <p style={{ marginTop: 16 }}>So the first job is not a spreadsheet. It is understanding that you are managing two money histories, not one, and that a good system makes room for both of them.</p>

            <h2 style={{ ...serif, fontSize: 28, fontWeight: 400, color: '#042F2E', marginBottom: 16, marginTop: 48 }}>
              Start with one honest conversation
            </h2>
            <p>Before any budgeting app or joint account, sit down together and talk about money properly. Not in the middle of an argument about a specific purchase. On purpose, calmly, with time set aside for it.</p>
            <p style={{ marginTop: 16 }}>A few questions worth asking each other:</p>
            <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
              <li>What did money feel like in the home you grew up in?</li>
              <li>What does financial security actually mean to you?</li>
              <li>What are you each saving for, if anything?</li>
              <li>What debts or commitments should the other person know about?</li>
              <li>What do you want your money to make possible in the next five years?</li>
            </ul>
            <p style={{ marginTop: 16 }}>Keep it a conversation, not an audit. The goal is to understand each other, not to score points. Many couples find it helps to make this a regular thing, a short money check in once a month, rather than one dramatic sit down that never happens again.</p>

            <h2 style={{ ...serif, fontSize: 28, fontWeight: 400, color: '#042F2E', marginBottom: 16, marginTop: 48 }}>
              Choose how you will structure your money
            </h2>
            <p>There is no single correct way for a couple to organise their money. There are three common models, and the best one is simply the one you both feel comfortable with.</p>

            <h3 style={{ fontSize: 18, fontWeight: 600, color: '#042F2E', marginBottom: 12, marginTop: 32 }}>1. Fully joint</h3>
            <p>All income goes into shared accounts, and all spending comes out of them. It is simple, transparent, and reinforces the idea that you are a team. The downside is that there is no private space, and it can feel unfair if your incomes are very different or one person spends far more than the other.</p>

            <h3 style={{ fontSize: 18, fontWeight: 600, color: '#042F2E', marginBottom: 12, marginTop: 32 }}>2. Fully separate</h3>
            <p>You each keep your own accounts and split the shared costs between you. This suits couples who value independence, or who came together later in life with settled finances. The risk is that you lose sight of the shared picture, splitting every bill gets tedious, and big goals are harder to plan when nobody owns the whole view.</p>

            <h3 style={{ fontSize: 18, fontWeight: 600, color: '#042F2E', marginBottom: 12, marginTop: 32 }}>3. Yours, mine, and ours</h3>
            <p>This is the hybrid, and it is the one most financial advisers point couples toward. You each keep a personal account, and you also have a shared account that both of you pay into for joint costs. You plan and pay for shared life together, while each keeping a personal amount that is nobody else&rsquo;s business.</p>
            <p style={{ marginTop: 16 }}>Most couples who fight less about money land here. It gives you a shared budget without erasing the individual, which is usually the sweet spot.</p>

            <div style={{ background: 'rgba(13, 148, 136, 0.06)', border: '1px solid rgba(13, 148, 136, 0.2)', borderRadius: 12, padding: '20px 24px', margin: '32px 0' }}>
              <p style={{ margin: 0, color: '#475569', fontStyle: 'italic' }}>
                &ldquo;The healthiest setup for most couples is a shared account for joint life, plus a personal account each. Together for the big things, independent for the small ones.&rdquo;
              </p>
            </div>

            <h2 style={{ ...serif, fontSize: 28, fontWeight: 400, color: '#042F2E', marginBottom: 16, marginTop: 48 }}>
              Split the bills in a way that feels fair
            </h2>
            <p>Once you have a shared pot for joint costs, the question becomes how much each person puts in. There are two fair ways to do it.</p>

            <h3 style={{ fontSize: 18, fontWeight: 600, color: '#042F2E', marginBottom: 12, marginTop: 32 }}>Fifty fifty</h3>
            <p>You each pay half of the shared costs. Simple, and it works well when your incomes are similar. The problem shows up when one person earns a lot more than the other. Splitting the rent down the middle can leave the lower earner with almost nothing left over, while the higher earner barely notices. Technically equal, but it does not feel fair.</p>

            <h3 style={{ fontSize: 18, fontWeight: 600, color: '#042F2E', marginBottom: 12, marginTop: 32 }}>Proportional to income</h3>
            <p>You each contribute the same percentage of your income, rather than the same amount. This keeps the balance fair when there is a gap in what you earn.</p>

            <div style={{ background: 'rgba(13, 148, 136, 0.03)', border: '1px solid rgba(13, 148, 136, 0.12)', borderRadius: 12, padding: '24px', margin: '32px 0' }}>
              <p style={{ margin: 0, fontWeight: 600, color: '#042F2E', marginBottom: 12 }}>A quick example</p>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7 }}>Say one partner earns 2,000 a month and the other earns 3,000. Together that is 5,000, so one earns 40 percent of the household income and the other earns 60 percent. If the shared costs come to 2,000 a month, the first partner pays 800 (40 percent) and the second pays 1,200 (60 percent). Each of them is left with the same share of their own income to spend. That tends to feel fair to both people, because it is.</p>
            </div>

            <p>There is no rule that says you must pick one method forever. What matters is that you both agree it is fair, and that you can say so out loud without resentment building underneath.</p>

            <h2 style={{ ...serif, fontSize: 28, fontWeight: 400, color: '#042F2E', marginBottom: 16, marginTop: 48 }}>
              Build one budget you can both see
            </h2>
            <p>Here is where most couples quietly come undone. They agree on a plan, then each track it in their own head, or in two separate apps, or not at all. Within a month the shared picture is gone and you are both back to guessing.</p>
            <p style={{ marginTop: 16 }}>The fix is to have one budget that both of you can see, updating in real time. When the same numbers are in front of both people, there is very little left to argue about. You are looking at the same reality instead of two different memories of it.</p>
            <p style={{ marginTop: 16 }}>That is exactly what we built <Link href="/" style={link}>Spentum</Link> to do. You share one household budget with your partner, add your accounts and recurring bills once, and both of you see the same transactions, the same balance, and the same forecast. Nobody has to be the person who chases the other for receipts.</p>
            <p style={{ marginTop: 16 }}>If you have never actually tracked your spending as a couple, start there. Our guide on <Link href="/blog/stop-guessing-where-your-money-goes" style={link}>how to stop guessing where your money goes</Link> walks through it step by step.</p>

            <h2 style={{ ...serif, fontSize: 28, fontWeight: 400, color: '#042F2E', marginBottom: 16, marginTop: 48 }}>
              Give each person a no questions asked amount
            </h2>
            <p>This is the small rule that saves a surprising number of relationships from money tension. Inside your shared budget, agree an amount each month that each of you can spend on whatever you like, with no explanation required.</p>
            <p style={{ marginTop: 16 }}>It does not need to be large. The point is not the amount, it is the freedom. One of you can buy the fancy coffee, the other can buy the hobby thing, and neither has to justify it to the other.</p>
            <p style={{ marginTop: 16 }}>Couples who skip this often end up quietly policing each other&rsquo;s small purchases, and that is corrosive over time. A no questions asked amount removes the pettiness in one move.</p>

            <h2 style={{ ...serif, fontSize: 28, fontWeight: 400, color: '#042F2E', marginBottom: 16, marginTop: 48 }}>
              When one of you earns more, or spends more
            </h2>
            <p>Income gaps and spending gaps are two of the most common flashpoints, so it helps to name them directly.</p>
            <p style={{ marginTop: 16 }}>If one of you earns significantly more, the proportional split above usually keeps the money fair. What matters more is the attitude around it. The higher earner should not use money as leverage, and the lower earner should not feel like a guest in their own life. Shared decisions stay shared, regardless of who funded them.</p>
            <p style={{ marginTop: 16 }}>If one of you is a natural spender and the other a natural saver, do not try to convert each other. You will both be miserable. Instead, build a budget that gives the saver the security of a healthy savings transfer every payday, and gives the spender a generous no questions asked amount. Both needs met, no conversion required.</p>

            <h2 style={{ ...serif, fontSize: 28, fontWeight: 400, color: '#042F2E', marginBottom: 16, marginTop: 48 }}>
              Deal with debt as a team
            </h2>
            <p>If either of you brought debt into the relationship, get it on the table early. Hiding it does not make it smaller, and finding out later damages trust far more than the debt itself ever could.</p>
            <p style={{ marginTop: 16 }}>Decide together whether you tackle it jointly or individually. Many couples treat serious debt as a shared problem to solve as a team, because clearing it faster benefits both of you. Our guide on <Link href="/blog/how-to-save-money-and-tackle-debt" style={link}>how to save money and tackle debt</Link> covers the snowball and avalanche methods if you need a plan to follow.</p>
            <p style={{ marginTop: 16 }}>Whatever you decide, put the repayment into the shared budget so it is visible and automatic, not a monthly source of stress you both have to remember.</p>

            <h2 style={{ ...serif, fontSize: 28, fontWeight: 400, color: '#042F2E', marginBottom: 16, marginTop: 48 }}>
              Plan the future together
            </h2>
            <p>The best part of budgeting as a couple is not the bills. It is the future. A holiday, a home deposit, a wedding, a child, an earlier retirement. These are all far easier to reach when you can both see the path to them.</p>
            <p style={{ marginTop: 16 }}>Set one or two shared goals and make them concrete. Not &ldquo;save more&rdquo; but &ldquo;12,000 for a deposit by next September.&rdquo; Then track toward it together, month by month.</p>
            <p style={{ marginTop: 16 }}>This is where a forward looking budget earns its keep. Instead of only seeing today&rsquo;s balance, you can both see where you will be in six months or two years if you keep going the way you are. When you can watch the goal getting closer, staying on track stops feeling like restriction and starts feeling like <Link href="/blog/budgeting-is-not-restriction-its-control" style={link}>progress you chose</Link>.</p>

            <div style={{ background: 'rgba(13, 148, 136, 0.06)', border: '1px solid rgba(13, 148, 136, 0.2)', borderRadius: 16, padding: '28px 28px', margin: '40px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#042F2E' }}>Budget together with Spentum</p>
              <p style={{ margin: 0, fontSize: 15, color: '#475569', lineHeight: 1.6 }}>Share one household budget with your partner. Add your accounts and recurring bills once, and you both see the same transactions, balance, and forecast in real time. Free during beta, no bank login needed.</p>
              <div>
                <Link href="/signup" style={{ display: 'inline-block', background: '#0D9488', color: '#fff', fontSize: 14, fontWeight: 600, padding: '11px 22px', borderRadius: 10, textDecoration: 'none' }}>
                  Start your shared budget
                </Link>
              </div>
            </div>

            <h2 style={{ ...serif, fontSize: 28, fontWeight: 400, color: '#042F2E', marginBottom: 16, marginTop: 48 }}>
              Mistakes to avoid
            </h2>
            <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <li><strong style={{ color: '#042F2E' }}>Merging everything overnight.</strong> Ease into shared finances. You do not have to combine every account on day one.</li>
              <li><strong style={{ color: '#042F2E' }}>Keeping money secrets.</strong> A hidden account or an undisclosed debt does more damage than almost any purchase ever could.</li>
              <li><strong style={{ color: '#042F2E' }}>Only talking about money when something goes wrong.</strong> Regular, calm check ins prevent the blow ups.</li>
              <li><strong style={{ color: '#042F2E' }}>Copying another couple&rsquo;s system.</strong> What works for your friends may not fit your incomes or your temperaments.</li>
              <li><strong style={{ color: '#042F2E' }}>Trying to change your partner&rsquo;s money personality.</strong> Build a system that fits both of you instead.</li>
            </ul>

            <h2 style={{ ...serif, fontSize: 28, fontWeight: 400, color: '#042F2E', marginBottom: 16, marginTop: 48 }}>
              Frequently asked questions
            </h2>
            {FAQ.map((f) => (
              <div key={f.q} style={{ marginTop: 28 }}>
                <h3 style={{ fontSize: 18, fontWeight: 600, color: '#042F2E', marginBottom: 10 }}>{f.q}</h3>
                <p>{f.a}</p>
              </div>
            ))}

            <h2 style={{ ...serif, fontSize: 28, fontWeight: 400, color: '#042F2E', marginBottom: 16, marginTop: 48 }}>
              The honest summary
            </h2>
            <p>Budgeting as a couple is not really about spreadsheets. It is about turning two money histories into one shared plan that respects both of you. Talk openly, structure your accounts in a way that feels fair, keep a little personal freedom each, and look at the same numbers together.</p>
            <p style={{ marginTop: 16 }}>Do that, and money stops being the thing you fight about and becomes the thing you build with.</p>

          </div>

          {/* TAGS */}
          <div style={{ marginTop: 56, paddingTop: 32, borderTop: '1px solid rgba(13, 148, 136, 0.12)', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {['Couples & Money', 'Shared Budget', 'Joint Accounts', 'Splitting Bills', 'Household Finance', 'Money & Relationships', 'Budgeting'].map((tag) => (
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
