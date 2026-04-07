import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Oil Prices Are Rising Again. Here Is What It Means for Your Budget | Spentum',
  description: 'Tensions in the Strait of Hormuz are pushing oil prices up. Here is why that happens, how it hits your wallet through fuel, food and energy, and what you can actually do about it.',
  keywords: [
    'oil prices rising 2026',
    'Strait of Hormuz oil supply',
    'inflation personal finance',
    'how to save money during inflation',
    'oil price impact on household budget',
    'fuel costs rising',
    'energy bills inflation',
    'protect your finances from inflation',
    'cost of living crisis budget tips',
    'oil barrel price explained',
  ],
  alternates: { canonical: 'https://www.spentum.com/blog/oil-prices-inflation-budget' },
  openGraph: {
    type: 'article',
    url: 'https://www.spentum.com/blog/oil-prices-inflation-budget',
    title: 'Oil Prices Are Rising Again. Here Is What It Means for Your Budget',
    description: 'Tensions in the Strait of Hormuz are pushing oil prices up. Here is why, how it reaches your wallet, and what you can do.',
    siteName: 'Spentum',
    images: [{ url: 'https://www.spentum.com/og-image.png', width: 1200, height: 630 }],
    publishedTime: '2026-03-31T00:00:00.000Z',
    authors: ['Spentum'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Oil Prices Are Rising Again. Here Is What It Means for Your Budget',
    description: 'Tensions in the Strait of Hormuz are pushing oil prices up. Here is why, how it hits your wallet, and what to do.',
    images: ['https://www.spentum.com/og-image.png'],
  },
};

const serif = { fontFamily: "'Space Grotesk', Georgia, serif" } as const;
const sans  = { fontFamily: "'DM Sans', system-ui, sans-serif" } as const;

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: 'Oil Prices Are Rising Again. Here Is What It Means for Your Budget',
  description: 'Tensions in the Strait of Hormuz are pushing oil prices up. Here is why that happens, how it hits your wallet through fuel, food and energy, and what you can actually do about it.',
  url: 'https://www.spentum.com/blog/oil-prices-inflation-budget',
  datePublished: '2026-03-31',
  dateModified: '2026-03-31',
  author: { '@type': 'Organization', name: 'Spentum', url: 'https://www.spentum.com' },
  publisher: {
    '@type': 'Organization',
    name: 'Spentum',
    logo: { '@type': 'ImageObject', url: 'https://www.spentum.com/spentum.png' },
  },
  image: 'https://www.spentum.com/og-image.png',
  mainEntityOfPage: { '@type': 'WebPage', '@id': 'https://www.spentum.com/blog/oil-prices-inflation-budget' },
  keywords: 'oil prices, Strait of Hormuz, inflation, personal finance, household budget, fuel costs, energy bills',
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
              <li style={{ color: '#475569' }}>Oil prices, inflation and your budget</li>
            </ol>
          </nav>

          {/* Category + date */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#0D9488', background: 'rgba(13, 148, 136, 0.08)', border: '1px solid rgba(13, 148, 136, 0.25)', borderRadius: 100, padding: '3px 10px' }}>Personal Finance</span>
            <time dateTime="2026-03-31" style={{ fontSize: 13, color: '#94a3b8' }}>March 31, 2026</time>
            <span style={{ fontSize: 13, color: '#94a3b8' }}>14 min read</span>
          </div>

          {/* Title */}
          <h1 style={{ ...serif, fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 400, color: '#042F2E', lineHeight: 1.1, letterSpacing: -0.5, marginBottom: 20 }}>
            Oil Prices Are Rising Again. Here Is What It Means for Your Budget
          </h1>

          <p style={{ fontSize: 19, color: '#475569', lineHeight: 1.6, marginBottom: 48, fontWeight: 300 }}>
            You have probably noticed it at the petrol station. Or in your energy bill. Or at the supermarket, where the price of things that have nothing obvious to do with oil somehow keeps creeping up anyway. There is a reason for all of it, and it starts with a narrow strip of water you may not think about very often.
          </p>

          <hr style={{ border: 'none', borderTop: '1px solid rgba(13, 148, 136, 0.12)', marginBottom: 48 }} />

          {/* CONTENT */}
          <div style={{ fontSize: 16, lineHeight: 1.8, color: '#042F2E' }}>

            <h2 style={{ ...serif, fontSize: 28, fontWeight: 400, color: '#042F2E', marginBottom: 16, marginTop: 48 }}>
              What is the Strait of Hormuz and why does it matter so much
            </h2>
            <p>The Strait of Hormuz is a channel of water roughly 33 kilometres wide at its narrowest point, sitting between the Omani coast and the southern coast of Iran. On a map it looks almost insignificant. In practice it is one of the most consequential pieces of geography on earth.</p>
            <p style={{ marginTop: 16 }}>Around 20 percent of the world's oil supply passes through it every single day. That includes the vast majority of what comes out of Saudi Arabia, the UAE, Kuwait, Iraq and Qatar. These countries have no other viable way to get their oil to international markets. The strait is their only exit.</p>
            <p style={{ marginTop: 16 }}>Iran sits on one side of that channel and has, over decades of tension with the West and its regional neighbours, repeatedly made clear that it considers the strait a pressure point it can exploit. In periods of heightened conflict or threatened sanctions, Iranian officials have openly discussed the possibility of closing or disrupting access to the waterway. They have mined it before, attacked tankers before, and seized vessels before. None of this is hypothetical.</p>
            <p style={{ marginTop: 16 }}>When tensions rise, as they have been doing again through late 2025 and into 2026, oil markets respond immediately. Not because the strait has actually been closed, but because traders are pricing in the risk that it might be disrupted. The oil market is fundamentally a futures market. People are not just buying oil that exists today, they are making bets about what will be available in three, six, twelve months. Fear of a supply shock gets baked into the price long before anything actually happens.</p>

            <div style={{ background: 'rgba(13, 148, 136, 0.06)', border: '1px solid rgba(13, 148, 136, 0.2)', borderRadius: 12, padding: '20px 24px', margin: '32px 0' }}>
              <p style={{ margin: 0, color: '#475569', fontStyle: 'italic' }}>
                "About one fifth of all the oil traded globally every day passes through a channel barely wider than a medium-sized city. That single fact explains most of why energy markets are so sensitive to Middle Eastern politics."
              </p>
            </div>

            <h2 style={{ ...serif, fontSize: 28, fontWeight: 400, color: '#042F2E', marginBottom: 16, marginTop: 48 }}>
              Why the price of a barrel goes up even when nothing has happened yet
            </h2>
            <p>This is the part that confuses people. They see oil at 95 dollars a barrel and think: but nothing has actually been disrupted. No tankers have been blocked. The pipeline is still flowing. Why is the price up?</p>
            <p style={{ marginTop: 16 }}>The answer is that oil is priced on expectations, not just current supply. When a conflict escalates, when there are reports of naval movements in the Gulf, when diplomatic talks collapse, the market recalculates the probability that supply will be constrained in the future. Even a modest increase in that probability is enough to move the price significantly, because the consequences of a real disruption would be so severe.</p>
            <p style={{ marginTop: 16 }}>Think of it like insurance. The premium goes up not when your house burns down, but when the risk of fire increases. The oil market works similarly. The barrel price reflects what traders collectively believe about the future availability of the commodity. Right now they believe it is less certain than it was, so they are paying more for it today.</p>
            <p style={{ marginTop: 16 }}>There is also an amplification effect through currency. Oil is priced in US dollars globally. When the dollar strengthens, as it tends to do during geopolitical stress when investors seek safety in American assets, oil becomes more expensive in every other currency. So if you are paying in pounds, euros or Romanian lei, you are getting hit twice: once by the barrel price rising, and once by your currency buying fewer dollars than it used to.</p>

            <h2 style={{ ...serif, fontSize: 28, fontWeight: 400, color: '#042F2E', marginBottom: 16, marginTop: 48 }}>
              The journey from an oil barrel to your shopping trolley
            </h2>
            <p>Most people understand intuitively that oil going up means petrol going up. That connection is obvious. What is less obvious is how deeply oil is embedded in almost everything else you buy.</p>
            <p style={{ marginTop: 16 }}>Electricity generation in many countries still relies heavily on natural gas, which is priced in close correlation with oil. When oil rises, your energy bill tends to follow, often with a lag of a few months as contracts roll over and suppliers adjust their pricing.</p>
            <p style={{ marginTop: 16 }}>Food is more dependent on oil than most people realise. Fertilisers are largely derived from natural gas. Agricultural machinery runs on diesel. Refrigerated lorries that bring food from farms to distribution centres run on diesel. The packaging that wraps most food is made from petrochemicals. When oil costs more, every link in that chain costs more, and eventually the cost lands on the shelf price you pay at the supermarket.</p>
            <p style={{ marginTop: 16 }}>Manufacturing and logistics follow the same pattern. The cost of shipping a container from a factory in Southeast Asia to a port in Europe has direct exposure to fuel prices. When freight costs rise, the price of electronics, clothing, furniture and basically anything that crosses an ocean goes up too. It does not happen overnight. But it accumulates.</p>
            <p style={{ marginTop: 16 }}>Airlines price their tickets with fuel as one of the biggest cost variables. A sustained period of high oil tends to flow through into airfare prices within a couple of booking cycles. If you are planning to travel later this year and wondering whether to book now or wait, the answer during a period of rising oil is almost always to book now.</p>

            <div style={{ background: 'rgba(13, 148, 136, 0.06)', border: '1px solid rgba(13, 148, 136, 0.2)', borderRadius: 12, padding: '20px 24px', margin: '32px 0' }}>
              <p style={{ margin: 0, color: '#475569', fontStyle: 'italic' }}>
                "Oil is not just what you put in a car. It is embedded in the fertiliser that grew your food, the lorry that delivered it, the plastic that wrapped it and the electricity that kept it cold. A rise in oil is a tax on almost everything."
              </p>
            </div>

            <h2 style={{ ...serif, fontSize: 28, fontWeight: 400, color: '#042F2E', marginBottom: 16, marginTop: 48 }}>
              How inflation compounds the damage over time
            </h2>
            <p>A single month of higher prices is annoying but manageable. What makes oil-driven inflation genuinely painful is the way it compounds. Once prices rise in one part of the economy, businesses in adjacent parts adjust their own pricing to protect their margins. Workers ask for higher wages to cover their own increased costs. Wage rises feed back into the cost of services. The initial oil shock ripples outward in ways that can sustain inflation long after the original cause has stabilised.</p>
            <p style={{ marginTop: 16 }}>Central banks respond to this by raising interest rates, which is their primary tool for cooling inflation. Higher rates slow borrowing and spending, which takes heat out of the economy, which eventually brings prices down. But the transmission takes time, often 12 to 18 months, and in the meantime those higher rates are also making your mortgage, car loan and credit card debt more expensive.</p>
            <p style={{ marginTop: 16 }}>So you end up in a situation where oil is up, which raises your fuel, food and energy costs, and simultaneously the policy response to that rise is raising the cost of any debt you carry. Both things hit your monthly budget at once.</p>
            <p style={{ marginTop: 16 }}>This is not theoretical right now. It is the environment a lot of households are actually navigating. The question is what you can do about it practically, given that you cannot control where oil trades or what a central bank decides at its next meeting.</p>

            <h2 style={{ ...serif, fontSize: 28, fontWeight: 400, color: '#042F2E', marginBottom: 16, marginTop: 48 }}>
              Start by understanding exactly where you are exposed
            </h2>
            <p>Before you can do anything useful, you need to know which parts of your spending are most sensitive to what is happening. Pull up your last three months of bank statements and look honestly at the categories where inflation is showing up.</p>
            <p style={{ marginTop: 16 }}>Fuel is the most direct exposure. If you drive regularly, your fuel spend has almost certainly increased as a percentage of your income compared to two years ago. The same is true for energy bills. Look at what you paid last winter versus this one.</p>
            <p style={{ marginTop: 16 }}>Food is trickier to spot because the increases tend to be gradual and spread across many items rather than one big visible jump. But if you track your grocery spending over several months you will usually see a clear upward trend that is not explained by buying more things.</p>
            <p style={{ marginTop: 16 }}>Interest costs are the third category to check. If you have a variable rate mortgage, a car loan taken out before rates rose, or credit card debt you carry from month to month, all of those are likely costing you more than they were 18 months ago.</p>
            <p style={{ marginTop: 16 }}>Once you have mapped your exposure clearly, you can prioritise where to act. Trying to cut everywhere at once rarely works. Knowing your biggest pressure points means you can make targeted decisions rather than just generally feeling stressed about money.</p>

            <h2 style={{ ...serif, fontSize: 28, fontWeight: 400, color: '#042F2E', marginBottom: 16, marginTop: 48 }}>
              Fuel: what you can actually control
            </h2>
            <p>You cannot control the price at the pump, but you can control how much of it you buy. The obvious version of this advice is to drive less, which is useful but not always realistic depending on your life. The less obvious version is to change how you drive.</p>
            <p style={{ marginTop: 16 }}>Fuel consumption increases sharply at higher speeds. On a motorway the difference between driving at 110 km/h and 130 km/h is roughly 20 to 25 percent more fuel. Smooth acceleration and braking rather than aggressive driving makes a meaningful difference on shorter journeys. These are not dramatic lifestyle changes. They are small adjustments that compound over a year of driving.</p>
            <p style={{ marginTop: 16 }}>If you use a car for commuting, this is a good moment to honestly evaluate whether there is a cheaper alternative for some days of the week, not necessarily all of them. Even replacing two commutes a week with public transport can noticeably reduce your monthly fuel bill over time.</p>
            <p style={{ marginTop: 16 }}>Fuel comparison apps and websites are worth using consistently rather than just filling up at whatever station is nearest. Price variation between stations in the same area can be 5 to 8 cents per litre, which over a full tank and a whole year adds up to a real number.</p>

            <h2 style={{ ...serif, fontSize: 28, fontWeight: 400, color: '#042F2E', marginBottom: 16, marginTop: 48 }}>
              Energy bills: the decisions that actually move the needle
            </h2>
            <p>If you are on a variable energy tariff, you are fully exposed to every movement in wholesale gas and electricity prices. Switching to a fixed tariff locks in a rate for a defined period, which removes the uncertainty from that part of your budget. Whether a fixed deal makes financial sense depends on what rate you can get versus where the market is heading, and no one can predict that perfectly. But for people who need predictability in their monthly outgoings more than they need to optimise for the absolute lowest possible cost, fixing provides genuine value independent of where prices end up.</p>
            <p style={{ marginTop: 16 }}>On the consumption side, the single most impactful thing in most homes is heating. Turning the thermostat down by one or two degrees and adding a layer of clothing sounds trivial, but in a cold climate during a long winter it can meaningfully reduce your bill. Programmable or smart thermostats that heat the house only when people are actually present typically reduce heating consumption by 15 to 20 percent compared to leaving the heating at a constant temperature all day.</p>
            <p style={{ marginTop: 16 }}>Draught exclusion is cheap and underrated. Cold air coming in under doors and around window frames forces your heating system to work harder than it needs to. Basic draught excluders cost a few pounds or euros and pay for themselves within weeks during a cold period.</p>
            <p style={{ marginTop: 16 }}>Appliances matter more than people think. A washing machine run on a 30 degree cycle uses roughly 60 percent less energy than a 60 degree cycle for most loads. Tumble dryers are among the most expensive appliances to run. Air fryers use significantly less energy than conventional ovens for smaller meals. None of these individually is transformative, but together across a year they reduce a bill that is already under pressure.</p>

            <h2 style={{ ...serif, fontSize: 28, fontWeight: 400, color: '#042F2E', marginBottom: 16, marginTop: 48 }}>
              Food: where the inflation is most insidious and what to do
            </h2>
            <p>Food inflation is politically and psychologically distinct from other kinds of inflation because food is something people buy constantly, in small amounts, and it goes off. You cannot really stockpile in the way you might with other goods, and every trip to the supermarket is a reminder of how much things cost.</p>
            <p style={{ marginTop: 16 }}>The most effective strategy against food inflation, consistently, is meal planning. Not in a complicated or time-consuming way, but in a basic sense: knowing what you are going to cook before you go to the shop means you buy what you need and not what catches your eye. Food waste is expensive. The average household throws away a significant amount of food every week, and at inflated prices that waste costs more than it used to.</p>
            <p style={{ marginTop: 16 }}>Protein is usually where food budgets take the biggest hit during inflationary periods, because it tends to be the most expensive category and the one people feel most reluctant to compromise on. Legumes, lentils, eggs and tinned fish are all high-protein and have barely moved in price relative to meat. Shifting even one or two meals a week toward these alternatives reduces spending without requiring any sacrifice in nutrition.</p>
            <p style={{ marginTop: 16 }}>Supermarket own-brand products in most categories are manufactured by the same suppliers as the branded equivalents and differ primarily in packaging and marketing cost. The price difference is rarely proportional to any quality difference. In staple categories like pasta, tinned tomatoes, oil, flour and most dairy products, the own-brand version is simply the rational choice during a period of elevated food prices.</p>
            <p style={{ marginTop: 16 }}>One thing worth watching is the difference between price increases on items you regularly buy versus items you occasionally buy. Inflation averages tell you very little about your specific situation. Your personal inflation rate depends entirely on what you actually spend money on. If you drive a lot and eat a lot of meat, your effective inflation is probably higher than the headline figure. If you mostly eat plant-based food and use public transport, it is probably lower. Knowing your own number matters more than knowing the national average.</p>

            <div style={{ background: 'rgba(13, 148, 136, 0.06)', border: '1px solid rgba(13, 148, 136, 0.2)', borderRadius: 12, padding: '20px 24px', margin: '32px 0' }}>
              <p style={{ margin: 0, color: '#475569', fontStyle: 'italic' }}>
                "The headline inflation figure is an average. Your inflation figure is personal. It depends entirely on what you buy, where you live and how you travel. Most people who feel like inflation is hitting them harder than the numbers suggest are probably right."
              </p>
            </div>

            <h2 style={{ ...serif, fontSize: 28, fontWeight: 400, color: '#042F2E', marginBottom: 16, marginTop: 48 }}>
              Debt: the part that gets worse when rates rise
            </h2>
            <p>If inflation is the problem, rising interest rates are the medicine with unpleasant side effects. Central banks raise rates to cool demand and bring prices down. But higher rates also mean the cost of carrying debt increases, which puts additional pressure on household budgets precisely at the moment they are already squeezed by higher prices.</p>
            <p style={{ marginTop: 16 }}>Variable rate debt is the most dangerous position to be in during a rate-rising cycle. If your mortgage has a variable or tracker rate, your monthly payment has been going up as rates have risen. If you have credit card balances you carry from month to month, the interest being charged on those has also increased. This is money leaving your budget every month that is doing nothing productive for you.</p>
            <p style={{ marginTop: 16 }}>The priority with debt during an inflationary period is to eliminate variable-rate consumer debt as fast as possible. This means credit cards, overdrafts and any high-interest personal loans. The interest rates on these products are almost always higher than anything you could earn by saving the same money, so paying them off is effectively the highest-return investment available to most people.</p>
            <p style={{ marginTop: 16 }}>If you have multiple debts, the mathematically optimal approach is to pay the minimum on everything and direct any extra money toward the debt with the highest interest rate. Once that one is gone, redirect that payment to the next highest. This is the debt avalanche method, and it minimises the total interest you pay over time.</p>
            <p style={{ marginTop: 16 }}>For mortgages, if you are coming off a fixed term in the next 12 months, you should be aware of what the market looks like now and start researching your options early rather than waiting until the last moment. Mortgage offers typically remain valid for several months, so you can often secure a rate in advance before your current deal expires.</p>

            <h2 style={{ ...serif, fontSize: 28, fontWeight: 400, color: '#042F2E', marginBottom: 16, marginTop: 48 }}>
              Savings: how to stop inflation quietly eating them
            </h2>
            <p>If you have money sitting in a current account or a basic savings account earning next to nothing, inflation is reducing the real value of it every month. This is not a dramatic loss that you see on a statement. It is quiet and gradual, which makes it easy to ignore. But it is real.</p>
            <p style={{ marginTop: 16 }}>During periods when central bank rates are elevated, which is the environment we are currently in, high-yield savings accounts and money market funds typically offer meaningfully better returns than standard accounts. The difference between 0.5 percent and 4 percent on a savings balance of 10,000 euros is 350 euros a year. That is not life-changing, but it is not nothing, and you have to do very little to capture it.</p>
            <p style={{ marginTop: 16 }}>Government bonds or treasury bills, in the UK, US, Europe and elsewhere, are also currently offering rates that, while not always beating inflation entirely, are much closer to doing so than they were a few years ago. They are also extremely low risk. For money you will not need for six to twelve months, they are worth considering.</p>
            <p style={{ marginTop: 16 }}>The goal is not to generate spectacular returns. The goal is to not lose purchasing power quietly while you are focused on managing your monthly expenses. Moving your savings to a better-rate account costs you nothing and takes about twenty minutes. If you have not done it recently, it is probably the single highest return on time available to you this week.</p>

            <h2 style={{ ...serif, fontSize: 28, fontWeight: 400, color: '#042F2E', marginBottom: 16, marginTop: 48 }}>
              Discretionary spending: where to cut without making life miserable
            </h2>
            <p>There is a version of inflation advice that essentially tells you to stop enjoying things until prices come down. Do not eat out, do not travel, cancel every subscription, live a grey and joyless financial existence until the macroeconomic situation improves. This advice is technically sound and practically useless because most people will not follow it and will feel like failures when they inevitably do not.</p>
            <p style={{ marginTop: 16 }}>A more realistic approach is to identify the discretionary spending that gives you genuine value versus the spending that happens by default without much thought or pleasure. Subscriptions are the clearest example. Most people have more active subscriptions than they are aware of, and a meaningful proportion of those are services they barely use. Going through a bank statement and cancelling subscriptions you forgot about or rarely use is painless. It does not feel like deprivation because you were not really enjoying those things anyway.</p>
            <p style={{ marginTop: 16 }}>Eating out is worth approaching with a bit of intentionality rather than just cutting entirely. The expensive meal with people you genuinely enjoy is worth the cost. The habitual lunch out because you did not bring anything from home is not providing much value relative to its price. The distinction matters because one is a deliberate choice you would make again and one is a default behaviour that could be changed without any real loss of enjoyment.</p>
            <p style={{ marginTop: 16 }}>The goal in an inflationary period is not to reduce your spending on everything equally. It is to find the places where money is leaving your account without much conscious decision-making and redirect it toward the things that are actually putting pressure on you, or into savings that will protect you if the situation gets worse.</p>

            <h2 style={{ ...serif, fontSize: 28, fontWeight: 400, color: '#042F2E', marginBottom: 16, marginTop: 48 }}>
              What tracking your spending actually shows you during inflationary periods
            </h2>
            <p>One thing that becomes very clear when you track spending in a period like this is how inflation tends to hide itself. Your total monthly spend looks roughly similar to what it was, so you do not feel like anything has changed dramatically. But when you look at the categories, you start to see that food is up, fuel is up, energy is up, and the money to cover those increases has come from somewhere. Usually from savings that did not happen, or from spending less in categories you did not consciously choose to cut.</p>
            <p style={{ marginTop: 16 }}>This matters because it means the damage is not always visible in how much pain you feel day to day. It shows up in the savings rate you are achieving, or not achieving. It shows up in the buffer you are not building. It shows up in the debt that is not going down as fast as you expected it to.</p>
            <p style={{ marginTop: 16 }}>Tracking monthly gives you visibility into this before it becomes a real problem. You can see which categories are rising faster than your income, you can see where the discretionary flexibility is, and you can make deliberate decisions rather than just watching your balance slowly drift in the wrong direction and wondering vaguely what is happening.</p>
            <p style={{ marginTop: 16 }}>The Strait of Hormuz may be 5,000 kilometres away from where you live. But what happens there is already in the price of the petrol in your car, the gas heating your home and the food in your fridge. You did not cause the situation, and you cannot fix it. What you can do is see it clearly, respond deliberately, and make sure that the things you cannot control do not prevent you from managing the things you can.</p>

            {/* Tags */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 56, paddingTop: 32, borderTop: '1px solid rgba(13, 148, 136, 0.12)' }}>
              {['Oil Prices', 'Inflation', 'Personal Finance', 'Budgeting', 'Cost of Living', 'Energy Bills', 'Debt'].map((tag) => (
                <span key={tag} style={{ fontSize: 12, color: '#94a3b8', background: 'rgba(13, 148, 136, 0.03)', border: '1px solid rgba(13, 148, 136, 0.12)', borderRadius: 100, padding: '4px 12px' }}>
                  {tag}
                </span>
              ))}
            </div>

            {/* CTA */}
            <div style={{ marginTop: 56, background: 'rgba(13, 148, 136, 0.06)', border: '1px solid rgba(13, 148, 136, 0.2)', borderRadius: 16, padding: '32px 36px' }}>
              <p style={{ ...serif, fontSize: 24, color: '#042F2E', fontWeight: 400, marginBottom: 12 }}>Know exactly where your money is going</p>
              <p style={{ fontSize: 15, color: '#475569', lineHeight: 1.65, marginBottom: 24 }}>
                The best defence against rising prices is knowing your actual spending, not guessing it. Spentum is a free budget tracker that shows you exactly where your money goes, so you can see your own inflation rate, not just the national average.
              </p>
              <Link href="/signup" style={{ display: 'inline-block', background: '#0D9488', color: '#fff', fontSize: 14, fontWeight: 600, padding: '12px 24px', borderRadius: 10, textDecoration: 'none' }}>
                Start tracking for free
              </Link>
            </div>

            {/* Back to blog */}
            <div style={{ marginTop: 48 }}>
              <Link href="/blog" style={{ fontSize: 14, color: '#0D9488', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                Back to all articles
              </Link>
            </div>

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
