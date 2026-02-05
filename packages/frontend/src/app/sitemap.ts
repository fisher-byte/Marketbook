import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: '/', lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: '/login', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  ];
}
