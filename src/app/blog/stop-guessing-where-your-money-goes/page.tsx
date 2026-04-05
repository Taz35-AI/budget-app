import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Stop Guessing Where Your Money Goes and Start Building Wealth | Spentum',
  description: 'Most people earn decent money and still end up with nothing by month end. This is the honest, practical guide to understanding your spending, closing the leaks, and actually starting to build wealth.',
  keywords: [
    'track expenses',
    'where does my money go',
    'how to build wealth',
    'start investing',
    'stop overspending',
    'personal finance for beginners',
    'money management tips',
    'financial independence',
    'build wealth on a normal salary',
    'expense tracking guide',
    'net worth',
    'pay yourself first',
  ],
  alternates: { canonical: 'https://www.spentum.com/blog/stop-guessing-where-your-money-goes' },
  openGraph: {
    type: 'article',
    url: 'https://www.spentum.com/blog/stop-guessing-where-your-money-goes',
    title: 'Stop Guessing Where Your Money Goes and Start Building Wealth',
    description: 'Most people earn decent money and still end up with nothing by month end. The honest guide to tracking expenses and actually building wealth.',
    siteName: 'Spentum',
    images: [{ url: 'https://www.spentum.com/og-image.png', width: 1200, height: 630 }],
    publishedTime: '2026-04-02T00:00:00.000Z',
    authors: ['Spentum'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Stop Guessing Where Your Money Goes and Start Building Wealth',
    description: 'Most people earn decent money and still end up with nothing by month end. The honest guide.',
    images: ['https://www.spentum.com/og-image.png'],
  },
};

const serif = { fontFamily: "'Instrument Serif', Georgia, serif" } as const;
const sans  = { fontFamily: "'DM Sans', system-ui, sans-serif" } as const;

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: 'Stop Guessing Where Your Money Goes and Start Building Wealth',
  description: 'Most people earn decent money and still end up with nothing by month end. This is the honest, practical guide to understanding your spending, closing the leaks, and actually starting to build wealth.',
  url: 'https://www.spentum.com/blog/stop-guessing-where-your-money-goes',
  datePublished: '2026-04-02',
  dateModified: '2026-04-02',
  author: { '@type': 'Organization', name: 'Spentum', url: 'https://www.spentum.com' },
  publisher: {
    '@type': 'Organization',
    name: 'Spentum',
    logo: { '@type': 'ImageObject', url: 'https://www.spentum.com/spentum.png' },
  },
  image: 'https://www.spentum.com/og-image.png',
  mainEntityOfPage: { '@type': 'WebPage', '@id': 'https://www.spentum.com/blog/stop-guessing-where-your-money-goes' },
  keywords: 'track expenses, build wealth, personal finance, investing, net worth, financial independence',
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
              <li style={{ color: '#475569' }}>Stop guessing where your money goes</li>
            </ol>
          </nav>

          {/* Category + date */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#0D9488', background: 'rgba(13, 148, 136, 0.08)', border: '1px solid rgba(13, 148, 136, 0.25)', borderRadius: 100, padding: '3px 10px' }}>Personal Finance</span>
            <time dateTime="2026-04-02" style={{ fontSize: 13, color: '#94a3b8' }}>April 2, 2026</time>
            <span style={{ fontSize: 13, color: '#94a3b8' }}>15 min read</span>
          </div>

          {/* Title */}
          <h1 style={{ ...serif, fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 400, color: '#042F2E', lineHeight: 1.1, letterSpacing: -0.5, marginBottom: 20 }}>
            Stop Guessing Where Your Money Goes and Start Building Wealth
          </h1>

          <p style={{ fontSize: 19, color: '#475569', lineHeight: 1.6, marginBottom: 48, fontWeight: 300 }}>
            Most people who earn a reasonable salary still arrive at the end of the month wondering where it all went. Not because they spent on anything crazy. Just because they never actually looked. This guide is about fixing that, and then doing something useful with what you find.
          </p>

          <hr style={{ border: 'none', borderTop: '1px solid rgba(13, 148, 136, 0.12)', marginBottom: 48 }} />

          {/* CONTENT */}
          <div style={{ fontSize: 16, lineHeight: 1.8, color: '#042F2E' }}>

            <h2 style={{ ...serif, fontSize: 28, fontWeight: 400, color: '#042F2E', marginBottom: 16, marginTop: 48 }}>
              The uncomfortable truth about spending
            </h2>
            <p>Here is something most financial advice skips over. The problem is rarely that people spend on big, obvious luxuries. Most of us are not blowing money on yachts or designer wardrobes. The problem is the slow, invisible drain. The things that each feel small but add up to hundreds every month without ever triggering a conscious decision.</p>
            <p style={{ marginTop: 16 }}>A subscription renews and you do not notice. You grab lunch out four days instead of two because you were busy. You upgraded your phone plan because a salesperson made it sound sensible. You kept the gym membership through winter. None of these feel like mistakes at the time. Together they can quietly eat 400 or 600 pounds or dollars a month that you thought you had.</p>
            <p style={{ marginTop: 16 }}>The first job is not to cut anything. The first job is to see it. Clearly, honestly, without flinching.</p>

            <h2 style={{ ...serif, fontSize: 28, fontWeight: 400, color: '#042F2E', marginBottom: 16, marginTop: 48 }}>
              How to actually track your spending (and why most people get it wrong)
            </h2>
            <p>The standard advice is to use a budgeting app. That is fine, but the way most people use them does not work. They set it up enthusiastically in January, categorise a few transactions, and then abandon it by February when it stops feeling new.</p>
            <p style={{ marginTop: 16 }}>The reason tracking fails for most people is that they try to do too much at once. They want a perfect budget with spending limits for every category before they have any real data about how they actually live. That is backwards.</p>
            <p style={{ marginTop: 16 }}>The right order is this: track first, judge later. Spend one full month just recording what you actually do. No restrictions, no guilt, no changes. At the end of the month you look at the numbers and you will know things about yourself that you did not know before.</p>

            <div style={{ background: 'rgba(13, 148, 136, 0.06)', border: '1px solid rgba(13, 148, 136, 0.2)', borderRadius: 12, padding: '20px 24px', margin: '32px 0' }}>
              <p style={{ margin: 0, color: '#475569', fontStyle: 'italic' }}>
                "You cannot manage what you cannot see. Before you plan anything, spend a month just watching."
              </p>
            </div>

            <p>When you review that first month, look for three things. First, the things that surprised you. The categories where you spent more than you thought. Second, the things you paid for and got genuine value from. And third, the things you paid for and cannot really account for. That third category is where the money is hiding.</p>

            <h3 style={{ fontSize: 18, fontWeight: 600, color: '#042F2E', marginBottom: 12, marginTop: 32 }}>The categories worth examining closely</h3>
            <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <li><strong style={{ color: '#042F2E' }}>Subscriptions.</strong> Go through your bank statement and highlight every recurring charge. Not just Netflix and Spotify. Software tools, cloud storage, news sites, fitness apps, delivery passes, insurance add-ons you forgot about. Most people find two to five subscriptions they had genuinely forgotten were running.</li>
              <li><strong style={{ color: '#042F2E' }}>Food and drink outside the home.</strong> This is the category that almost always shocks people. Coffees, lunches, quick dinners, delivery apps. Add them up. For many people this is 300 to 600 a month without feeling like they eat particularly extravagantly.</li>
              <li><strong style={{ color: '#042F2E' }}>Convenience spending.</strong> The taxis you took instead of waiting for the bus. The ready meals you bought because you were tired. The things you bought at the petrol station because you needed them right now. Convenience has a consistent premium attached to it.</li>
              <li><strong style={{ color: '#042F2E' }}>One-off purchases that happen every month.</strong> There is no such thing as a truly one-off purchase. Something unexpected always comes up. The question is whether you plan for it or react to it.</li>
            </ul>

            <h2 style={{ ...serif, fontSize: 28, fontWeight: 400, color: '#042F2E', marginBottom: 16, marginTop: 48 }}>
              The difference between spending and leaking
            </h2>
            <p>There is spending that brings you real value and there is money that leaks out. The goal is not to spend less on everything. The goal is to identify where you are leaking and redirect that money somewhere intentional.</p>
            <p style={{ marginTop: 16 }}>Spending 80 pounds a month eating out with people you care about is a choice you are making. Spending 80 pounds on lunches you ate alone at your desk because you did not have time to plan anything better is a leak. The number is the same but the relationship to it is completely different.</p>
            <p style={{ marginTop: 16 }}>When you can separate the two, the conversation changes. You are not cutting things you love. You are recovering money that was disappearing without doing anything for you.</p>

            <h2 style={{ ...serif, fontSize: 28, fontWeight: 400, color: '#042F2E', marginBottom: 16, marginTop: 48 }}>
              What to do with the money you recover
            </h2>
            <p>Once you have found 100 or 200 or 400 a month that was leaking, the question is what to do with it. And this is where the conversation shifts from budgeting to wealth building, which are two very different things.</p>
            <p style={{ marginTop: 16 }}>Budgeting is about not running out of money. Wealth building is about making your money generate more money over time. You need both, but most financial advice stops at the first one.</p>

            <h3 style={{ fontSize: 18, fontWeight: 600, color: '#042F2E', marginBottom: 12, marginTop: 32 }}>Step one: stop the bleeding</h3>
            <p>Before anything else, any high interest debt needs to be eliminated as fast as possible. Credit card debt at 20 or 25 percent interest is destroying wealth faster than almost any investment can create it. You cannot out-invest a 25 percent interest rate. Paying off that debt is the best guaranteed return you will ever find.</p>
            <p style={{ marginTop: 16 }}>If you have multiple debts, the approach that tends to work best psychologically is starting with the smallest balance regardless of interest rate. Clearing one debt completely gives you momentum. That momentum is worth something. Then take the money you were paying on the first debt and add it to the payments on the next one. The payments compound as you clear each one.</p>

            <h3 style={{ fontSize: 18, fontWeight: 600, color: '#042F2E', marginBottom: 12, marginTop: 32 }}>Step two: build a floor</h3>
            <p>An emergency fund is not a savings goal. It is a shock absorber. Without one, every unexpected expense either goes on a credit card or wipes out your progress. Your boiler breaks, your car fails its MOT, you lose a client unexpectedly. These things happen to everyone and they will happen to you.</p>
            <p style={{ marginTop: 16 }}>Start with a small target. One month of essential expenses, roughly what you need to cover rent, food, utilities and transport. Get that sitting somewhere separate from your current account before you do anything else. Then build it to three months. Eventually six months is the proper target, but do not wait until you have six months saved before you start investing. Get the one-month buffer first and move.</p>

            <div style={{ background: 'rgba(13, 148, 136, 0.03)', border: '1px solid rgba(13, 148, 136, 0.12)', borderRadius: 12, padding: '24px', margin: '32px 0' }}>
              <p style={{ margin: 0, fontWeight: 600, color: '#042F2E', marginBottom: 12 }}>A practical order of operations</p>
              <ol style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 10, margin: 0, fontSize: 15 }}>
                <li>Track spending for one full month without changing anything</li>
                <li>Cancel every subscription you cannot name a reason to keep</li>
                <li>Pay off any high interest consumer debt aggressively</li>
                <li>Build one month of expenses as an emergency buffer</li>
                <li>Contribute enough to your pension or 401k to get any employer match (this is free money)</li>
                <li>Build emergency fund to three months</li>
                <li>Start investing the recovered leak money regularly</li>
              </ol>
            </div>

            <h3 style={{ fontSize: 18, fontWeight: 600, color: '#042F2E', marginBottom: 12, marginTop: 32 }}>Step three: actually invest</h3>
            <p>This is where most budgeting guides stop giving advice, which is a shame because it is the part that actually builds wealth. Saving money is necessary but on its own it is not enough. Inflation erodes cash sitting in a savings account. Money needs to be working.</p>
            <p style={{ marginTop: 16 }}>For most people, the most practical approach to investing is simple index funds through a tax-advantaged account. In the UK that means an ISA. In the US, a Roth IRA or 401k. In most European countries there are equivalent wrappers. These accounts let your investments grow without paying tax on the gains every year, which compounds significantly over time.</p>
            <p style={{ marginTop: 16 }}>An index fund holds a slice of every company in a given market. When you buy a global index fund you own a tiny piece of thousands of companies across dozens of countries. When the market grows over time, so does your investment. You do not need to pick stocks, follow news, or make judgement calls. You just keep putting money in regularly.</p>
            <p style={{ marginTop: 16 }}>The key word is regularly. Investing 200 a month for twenty years beats a lump sum invested perfectly at the ideal moment, because almost nobody finds the ideal moment and almost everyone who tries ends up waiting too long.</p>

            <h2 style={{ ...serif, fontSize: 28, fontWeight: 400, color: '#042F2E', marginBottom: 16, marginTop: 48 }}>
              Why time matters more than amount
            </h2>
            <p>The single most important variable in building wealth is not how much you earn, how clever your investment choices are, or how perfectly you budget. It is how long you stay invested.</p>
            <p style={{ marginTop: 16 }}>If you invest 200 a month from age 25 to 65 at a 7 percent annual return, you end up with roughly 525,000. If you wait until 35 and invest 400 a month for the same period, you end up with about 485,000. You put in twice as much money per month and ended up with less, because you started ten years later.</p>
            <p style={{ marginTop: 16 }}>This is not magic. It is compound growth, which Einstein famously called the eighth wonder of the world. The returns from your returns generate their own returns. The longer this process runs, the more dramatic the effect becomes.</p>
            <p style={{ marginTop: 16 }}>Starting is more important than starting well. Even 50 a month invested now, while you figure out the rest, is worth more in the long run than 500 a month started three years from now.</p>

            <div style={{ background: 'rgba(13, 148, 136, 0.06)', border: '1px solid rgba(13, 148, 136, 0.2)', borderRadius: 12, padding: '20px 24px', margin: '32px 0' }}>
              <p style={{ margin: 0, color: '#475569', fontStyle: 'italic' }}>
                "Starting with 50 a month beats waiting to start with 500. The clock is the most expensive thing you can waste."
              </p>
            </div>

            <h2 style={{ ...serif, fontSize: 28, fontWeight: 400, color: '#042F2E', marginBottom: 16, marginTop: 48 }}>
              The pay yourself first rule, and why most people do it backwards
            </h2>
            <p>Most people save what is left at the end of the month. This does not work because there is never anything left. The month absorbs whatever space you give it. Money sitting in your current account gets spent, not because you are irresponsible, but because decisions are made from what you can see.</p>
            <p style={{ marginTop: 16 }}>The correct approach is the opposite. On payday, before you do anything else, money moves automatically. A fixed amount goes to savings. A fixed amount goes to investing. A fixed amount goes to debt repayment if you have it. What is left is yours to spend without guilt or tracking, because the important things already happened.</p>
            <p style={{ marginTop: 16 }}>This works for three reasons. You adjust your spending to what is available in your current account, which shrinks automatically. You remove the willpower requirement. And you never have to make the decision about whether to save this month because the decision was already made when you set it up.</p>
            <p style={{ marginTop: 16 }}>Set up automatic transfers on payday. Not a day later, not at the end of the month. The day the money arrives. This single habit, done consistently for years, does more for your financial position than any amount of clever optimisation.</p>

            <h2 style={{ ...serif, fontSize: 28, fontWeight: 400, color: '#042F2E', marginBottom: 16, marginTop: 48 }}>
              Net worth is the number that actually matters
            </h2>
            <p>Most people think about their finances in terms of income and monthly cash flow. How much do I earn, how much do I spend, what is left. This is useful but it misses the bigger picture.</p>
            <p style={{ marginTop: 16 }}>Net worth is what you actually own minus what you actually owe. Assets like savings, investments, property, pension value, minus liabilities like mortgage balance, car finance, credit card debt, student loans. This number is a far better measure of your financial health than your monthly surplus, because it accounts for all of it.</p>
            <p style={{ marginTop: 16 }}>Calculate yours now if you have not. Add up everything you own that has monetary value. Subtract everything you owe. The resulting number, whether positive or negative, is your real starting point.</p>
            <p style={{ marginTop: 16 }}>Then track it quarterly. Not monthly, quarterly. Month to month it does not change much and watching it closely does not help. But if your net worth is growing by 5,000 or 10,000 or 20,000 a year, you will see it clearly when you check every three months. That number rising is the most motivating thing you can watch. It makes the small daily decisions feel connected to something real.</p>

            <h3 style={{ fontSize: 18, fontWeight: 600, color: '#042F2E', marginBottom: 12, marginTop: 32 }}>What moves net worth upward</h3>
            <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <li><strong style={{ color: '#042F2E' }}>Investments growing.</strong> Every month you stay invested, market returns add to the value without you doing anything.</li>
              <li><strong style={{ color: '#042F2E' }}>Debt shrinking.</strong> Each loan payment reduces what you owe. For a mortgage, even in the early years, some of each payment goes to reducing the balance.</li>
              <li><strong style={{ color: '#042F2E' }}>Saving regularly.</strong> Cash savings add directly to assets, though they grow slowly compared to investments.</li>
              <li><strong style={{ color: '#042F2E' }}>Avoiding new consumer debt.</strong> Taking on new debt immediately moves net worth in the wrong direction. Every time you borrow to buy something that depreciates, you make yourself poorer.</li>
            </ul>

            <h2 style={{ ...serif, fontSize: 28, fontWeight: 400, color: '#042F2E', marginBottom: 16, marginTop: 48 }}>
              The emotional side that nobody talks about
            </h2>
            <p>Money stress is real and it affects decision making in measurable ways. When people feel financially anxious, they tend to make short-term decisions that make the long-term worse. They avoid looking at statements. They take on expensive debt to avoid the discomfort of not having something. They make purchases to feel better in the moment.</p>
            <p style={{ marginTop: 16 }}>Tracking your spending regularly, even when the numbers are not good, reduces that anxiety over time. Not immediately. At first, seeing the numbers clearly can feel worse before it feels better. But clarity is less stressful than uncertainty. Knowing exactly where you stand, even if you do not like it, is less exhausting than the vague background dread of not knowing.</p>
            <p style={{ marginTop: 16 }}>There is also something worth saying about the relationship between spending and identity. A lot of overspending is not about wanting the thing. It is about signalling something, to yourself or others. The nicer car, the restaurant you cannot really afford, the clothes that make you look more successful than you feel. None of this is moral judgement. It is just worth recognising, because the spending that comes from that place never delivers what it promises.</p>
            <p style={{ marginTop: 16 }}>The people who build wealth steadily tend to have a relatively low correlation between their spending and their self-image. They do not need their purchases to reflect who they are or where they want to be. They are comfortable driving an ordinary car and living in an ordinary house while their investments grow quietly in the background. That psychological shift, spending on what you value rather than on what you want to project, is worth more than any investment strategy.</p>

            <h2 style={{ ...serif, fontSize: 28, fontWeight: 400, color: '#042F2E', marginBottom: 16, marginTop: 48 }}>
              A realistic picture of what progress looks like
            </h2>
            <p>Building wealth on a normal income takes years. Not weeks, not months. Years. And the early stages feel slow because the numbers are still small. You have been saving for six months and your investments are worth 2,400. That does not feel like much. It does not look like much either.</p>
            <p style={{ marginTop: 16 }}>But something changes around the three to five year mark for most people. The numbers start to move noticeably. Your portfolio is large enough that a good year adds more to it than your contributions did. Your debts are nearly gone. You have a buffer that means a car repair or an unexpected bill does not derail your plans.</p>
            <p style={{ marginTop: 16 }}>And then at ten years, if you have stayed consistent, you have something that starts to feel genuinely significant. Not retire-at-40 significant for most people, but meaningful. A safety net. Options you did not used to have. The ability to take a risk on a job you actually want rather than staying put because you need the security.</p>
            <p style={{ marginTop: 16 }}>That is what wealth actually buys for most people at normal income levels. Not yachts. Options. The freedom to make choices that are not purely driven by financial pressure. It is worth the years of boring consistency it takes to get there.</p>

            <h2 style={{ ...serif, fontSize: 28, fontWeight: 400, color: '#042F2E', marginBottom: 16, marginTop: 48 }}>
              Knowing your future balance changes your behaviour
            </h2>
            <p>One of the most underused tools in personal finance is projecting your balance forward. Not just your savings target, but your actual month-by-month balance given your current income, your recurring bills, your debt payments, and your savings rate.</p>
            <p style={{ marginTop: 16 }}>When you can see that in four months your balance will drop to almost nothing because your car insurance, annual subscriptions and a holiday deposit all land in the same week, you can plan for it now. Move some money across early. Reduce spending the month before. It is obvious once you can see it.</p>
            <p style={{ marginTop: 16 }}>When you can see that your savings will hit your emergency fund target by September, you have a real date to look forward to. And after September you can redirect that same transfer to investments and watch the next milestone approach.</p>
            <p style={{ marginTop: 16 }}>This is what Spentum is built to do. You put in your recurring income, your bills and subscriptions, your one-off expected costs, and the app shows you your balance day by day up to seven years ahead. You can see the gaps before they arrive and plan around them. No bank login, your data stays with you, works across all your accounts.</p>

            <div style={{ background: 'rgba(13, 148, 136, 0.06)', border: '1px solid rgba(13, 148, 136, 0.2)', borderRadius: 16, padding: '28px 28px', margin: '40px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#042F2E' }}>See your financial future before it arrives</p>
              <p style={{ margin: 0, fontSize: 15, color: '#475569', lineHeight: 1.6 }}>Spentum shows your projected balance day by day, up to seven years ahead. Spot the gaps, plan around them, and watch your net worth grow in real time. Free during beta, no bank login required.</p>
              <div>
                <Link href="/signup" style={{ display: 'inline-block', background: '#0D9488', color: '#fff', fontSize: 14, fontWeight: 600, padding: '11px 22px', borderRadius: 10, textDecoration: 'none' }}>
                  Try Spentum free
                </Link>
              </div>
            </div>

            <h2 style={{ ...serif, fontSize: 28, fontWeight: 400, color: '#042F2E', marginBottom: 16, marginTop: 48 }}>
              The short version
            </h2>
            <p>Track your spending for one month without judging yourself. You will find money you did not know you were losing. Cancel the things that are not earning their cost. Then take that recovered money and put it to work in a deliberate order: kill expensive debt, build a buffer, then invest regularly and automatically for as long as you can.</p>
            <p style={{ marginTop: 16 }}>Calculate your net worth now and check it every three months. Watch the number move. That is the feedback loop that keeps you going when the day to day feels slow.</p>
            <p style={{ marginTop: 16 }}>Do not wait until you have it all figured out to start. Do not wait for a raise, a windfall, or a better moment. The best time to start was ten years ago. The second best time is now, with whatever you have, even if it is not much.</p>
            <p style={{ marginTop: 16 }}>The people who end up financially secure are not the ones who earned the most. They are the ones who started, kept going, and did not stop when it felt slow. That is genuinely all it takes.</p>

          </div>

          {/* TAGS */}
          <div style={{ marginTop: 56, paddingTop: 32, borderTop: '1px solid rgba(13, 148, 136, 0.12)', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {['Expense Tracking', 'Building Wealth', 'Investing', 'Net Worth', 'Personal Finance', 'Pay Yourself First', 'Index Funds', 'Financial Independence'].map((tag) => (
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
