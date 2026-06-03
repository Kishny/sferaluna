import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://sferaluna.fr';
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/mon-compte',
          '/inscription',
          '/paiement',
          '/explorer',
          '/matches',
          '/messages',
          '/mode-fantome',
          '/circle',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
