import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.lunaletsgo.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/auth/'],
      },
      // OpenAI / ChatGPT crawlers
      { userAgent: 'GPTBot',         allow: '/', disallow: ['/api/', '/auth/'] },
      { userAgent: 'ChatGPT-User',   allow: '/', disallow: ['/api/', '/auth/'] },
      { userAgent: 'OAI-SearchBot',  allow: '/', disallow: ['/api/', '/auth/'] },
      // Anthropic / Claude
      { userAgent: 'anthropic-ai',   allow: '/', disallow: ['/api/', '/auth/'] },
      { userAgent: 'Claude-Web',     allow: '/', disallow: ['/api/', '/auth/'] },
      { userAgent: 'ClaudeBot',      allow: '/', disallow: ['/api/', '/auth/'] },
      // Perplexity
      { userAgent: 'PerplexityBot',  allow: '/', disallow: ['/api/', '/auth/'] },
      // Google AI / Extended
      { userAgent: 'Google-Extended',allow: '/', disallow: ['/api/', '/auth/'] },
      { userAgent: 'Googlebot',      allow: '/', disallow: ['/api/', '/auth/'] },
      // Bing / Microsoft Copilot
      { userAgent: 'Bingbot',        allow: '/', disallow: ['/api/', '/auth/'] },
      { userAgent: 'msnbot',         allow: '/', disallow: ['/api/', '/auth/'] },
      // Common Crawl (base de treino de LLMs)
      { userAgent: 'CCBot',          allow: '/', disallow: ['/api/', '/auth/'] },
      // Meta AI
      { userAgent: 'FacebookBot',    allow: '/', disallow: ['/api/', '/auth/'] },
      { userAgent: 'facebookexternalhit', allow: '/' },
      // Apple
      { userAgent: 'Applebot',       allow: '/', disallow: ['/api/', '/auth/'] },
      // Cohere AI
      { userAgent: 'cohere-ai',      allow: '/', disallow: ['/api/', '/auth/'] },
      // You.com
      { userAgent: 'YouBot',         allow: '/', disallow: ['/api/', '/auth/'] },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
