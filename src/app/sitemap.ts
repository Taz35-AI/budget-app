import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://spentum.com', lastModified: new Date(), changeFrequency: 'monthly', priority: 1 },
    { url: 'https://spentum.com/login', lastModified: new Date(), changeFrequency: 'yearly', priority: 0.5 },
    { url: 'https://spentum.com/signup', lastModified: new Date(), changeFrequency: 'yearly', priority: 0.8 },
    { url: 'https://spentum.com/terms', lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: 'https://spentum.com/privacy', lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ];
}
