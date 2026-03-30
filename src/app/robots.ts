import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: ['/', '/blog', '/blog/'], disallow: ['/dashboard', '/reports', '/budgets', '/settings', '/profile', '/api/'] },
    sitemap: 'https://spentum.com/sitemap.xml',
  };
}
