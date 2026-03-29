import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://budget-app.com', lastModified: new Date(), changeFrequency: 'monthly', priority: 1 },
    { url: 'https://budget-app.com/login', lastModified: new Date(), changeFrequency: 'yearly', priority: 0.5 },
    { url: 'https://budget-app.com/signup', lastModified: new Date(), changeFrequency: 'yearly', priority: 0.8 },
    { url: 'https://budget-app.com/terms', lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: 'https://budget-app.com/privacy', lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ];
}
