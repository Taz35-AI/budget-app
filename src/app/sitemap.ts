import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://www.spentum.com', lastModified: new Date(), changeFrequency: 'monthly', priority: 1 },
    { url: 'https://www.spentum.com/login', lastModified: new Date(), changeFrequency: 'yearly', priority: 0.5 },
    { url: 'https://www.spentum.com/signup', lastModified: new Date(), changeFrequency: 'yearly', priority: 0.8 },
    { url: 'https://www.spentum.com/terms', lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: 'https://www.spentum.com/privacy', lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: 'https://www.spentum.com/blog', lastModified: new Date('2026-03-30'), changeFrequency: 'weekly', priority: 0.8 },
    { url: 'https://www.spentum.com/blog/how-to-save-money-and-tackle-debt', lastModified: new Date('2026-03-30'), changeFrequency: 'monthly', priority: 0.9 },
  ];
}
