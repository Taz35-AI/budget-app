import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog | Personal Finance Tips & Guides | Spentum',
  description: 'Practical guides on saving money, paying off debt, budgeting, and taking control of your personal finances. Written clearly, no jargon.',
  keywords: ['personal finance blog', 'budgeting tips', 'save money', 'debt advice', 'money management', 'financial planning'],
  alternates: { canonical: 'https://www.spentum.com/blog' },
  openGraph: {
    type: 'website',
    url: 'https://www.spentum.com/blog',
    title: 'Blog | Personal Finance Tips & Guides | Spentum',
    description: 'Practical guides on saving money, paying off debt, budgeting, and taking control of your personal finances.',
    siteName: 'Spentum',
    images: [{ url: 'https://www.spentum.com/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blog | Personal Finance Tips & Guides | Spentum',
    description: 'Practical guides on saving money, paying off debt, budgeting, and taking control of your personal finances.',
    images: ['https://www.spentum.com/og-image.png'],
  },
};

const serif = { fontFamily: "'Space Grotesk', Georgia, serif" } as const;
const sans  = { fontFamily: "'DM Sans', system-ui, sans-serif" } as const;

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Blog',
  name: 'Spentum Blog',
  description: 'Practical guides on saving money, paying off debt, and managing your personal finances.',
  url: 'https://www.spentum.com/blog',
  publisher: {
    '@type': 'Organization',
    name: 'Spentum',
    logo: { '@type': 'ImageObject', url: 'https://www.spentum.com/spentum.png' },
  },
};

const posts = [
  {
    slug: 'budgeting-is-not-restriction-its-control',
    category: 'Mindset',
    date: 'April 5, 2026',
    dateIso: '2026-04-05',
    readTime: '7 min read',
    title: 'Budgeting Is Not Restriction. It Is Control.',
    excerpt: 'Most of us think a budget is a cage. The research says the opposite. Here is why money anxiety is so common, what actually reduces it, and the mindset shift that makes budgeting feel like freedom instead of punishment.',
    tags: ['Mindset', 'Financial Anxiety', 'Psychology', 'Budgeting'],
  },
  {
    slug: 'stop-guessing-where-your-money-goes',
    category: 'Personal Finance',
    date: 'April 2, 2026',
    dateIso: '2026-04-02',
    readTime: '15 min read',
    title: 'Stop Guessing Where Your Money Goes and Start Building Wealth',
    excerpt: 'Most people earn a reasonable salary and still arrive at the end of the month wondering where it all went. Not because they spent on anything crazy. Just because they never actually looked. This is how to fix that and do something useful with what you find.',
    tags: ['Expense Tracking', 'Building Wealth', 'Investing', 'Personal Finance'],
  },
  {
    slug: 'oil-prices-inflation-budget',
    category: 'Personal Finance',
    date: 'March 31, 2026',
    dateIso: '2026-03-31',
    readTime: '14 min read',
    title: 'Oil Prices Are Rising Again. Here Is What It Means for Your Budget',
    excerpt: 'Tensions in the Strait of Hormuz are pushing oil up, and that rise reaches your wallet through fuel, food, energy bills and rising interest rates all at once. Here is why it happens and what you can actually do about it.',
    tags: ['Inflation', 'Oil Prices', 'Cost of Living', 'Budgeting'],
  },
  {
    slug: 'how-to-save-money-and-tackle-debt',
    category: 'Personal Finance',
    date: 'March 30, 2026',
    dateIso: '2026-03-30',
    readTime: '12 min read',
    title: 'How to Actually Save Money (And What to Do About Debt)',
    excerpt: 'Nobody talks about how messy the early stages really are. You set a budget, break it within two weeks, feel guilty, and give up. This guide skips the motivation speeches and gets into what actually works.',
    tags: ['Saving Money', 'Debt Repayment', 'Budgeting'],
  },
];

export default function BlogIndexPage() {
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
            <Link href="/blog" style={{ fontSize: 14, color: '#0D9488', padding: '6px 14px', borderRadius: 8, textDecoration: 'none', fontWeight: 500 }}>Blog</Link>
            <Link href="/login" style={{ fontSize: 14, color: '#475569', padding: '6px 14px', borderRadius: 8, textDecoration: 'none' }}>Sign in</Link>
            <Link href="/signup" style={{ fontSize: 14, fontWeight: 500, background: '#0D9488', color: '#fff', padding: '7px 18px', borderRadius: 10, textDecoration: 'none' }}>Get started free</Link>
          </div>
        </nav>

        {/* HEADER */}
        <header style={{ maxWidth: 860, margin: '0 auto', padding: '72px 24px 48px' }}>
          <h1 style={{ ...serif, fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 400, color: '#042F2E', lineHeight: 1.1, letterSpacing: -0.5, marginBottom: 16 }}>
            Personal Finance Guides
          </h1>
          <p style={{ fontSize: 18, color: '#475569', lineHeight: 1.6, maxWidth: 520, fontWeight: 300 }}>
            Clear, practical articles on saving money, paying off debt, and getting a grip on your finances. No jargon, no fluff.
          </p>
        </header>

        {/* POSTS */}
        <main style={{ maxWidth: 860, margin: '0 auto', padding: '0 24px 100px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {posts.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
                <article style={{ background: 'rgba(13, 148, 136, 0.03)', border: '1px solid rgba(13, 148, 136, 0.25)', borderRadius: 16, padding: '32px 36px', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#0D9488', background: 'rgba(13, 148, 136, 0.08)', border: '1px solid rgba(13, 148, 136, 0.25)', borderRadius: 100, padding: '3px 10px' }}>
                      {post.category}
                    </span>
                    <time dateTime={post.dateIso} style={{ fontSize: 13, color: '#94a3b8' }}>{post.date}</time>
                    <span style={{ fontSize: 13, color: '#94a3b8' }}>{post.readTime}</span>
                  </div>

                  <h2 style={{ ...serif, fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 400, color: '#042F2E', lineHeight: 1.2, marginBottom: 12 }}>
                    {post.title}
                  </h2>

                  <p style={{ fontSize: 15, color: '#475569', lineHeight: 1.65, marginBottom: 20 }}>
                    {post.excerpt}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {post.tags.map((tag) => (
                        <span key={tag} style={{ fontSize: 12, color: '#94a3b8', background: 'rgba(13, 148, 136, 0.03)', border: '1px solid rgba(13, 148, 136, 0.12)', borderRadius: 100, padding: '3px 10px' }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                    <span style={{ fontSize: 14, color: '#0D9488', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 5 }}>
                      Read article
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                    </span>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </main>

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
