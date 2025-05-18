/**
 * SEO Configuration (JavaScript version)
 *
 * This file contains the centralized SEO configuration for the AI Sports Edge application.
 * It defines base URLs, language variants, and other SEO-related settings.
 */

// SEO Configuration
const seoConfig = {
  // Base URL for the website (without trailing slash)
  baseUrl: process.env.SEO_BASE_URL || 'https://aisportsedge.app',

  // Default metadata
  defaultTitle: 'AI Sports Edge - Sports Betting Insights',
  defaultDescription:
    'Get AI-powered sports betting insights and odds comparison for smarter betting decisions.',
  defaultImage: '/images/og-default.jpg',

  // Supported languages
  languages: [
    {
      code: 'en',
      hreflang: 'en',
      name: 'English',
      default: true,
    },
    {
      code: 'es',
      hreflang: 'es',
      name: 'Español',
    },
    {
      code: 'es-US',
      hreflang: 'es-US',
      name: 'Español (Estados Unidos)',
      region: 'US',
    },
    {
      code: 'es-MX',
      hreflang: 'es-MX',
      name: 'Español (México)',
      region: 'MX',
    },
    {
      code: 'es-ES',
      hreflang: 'es-ES',
      name: 'Español (España)',
      region: 'ES',
    },
  ],

  // Social media handles
  social: {
    twitter: {
      handle: '@AISportsEdge',
      site: '@AISportsEdge',
      cardType: 'summary_large_image',
    },
  },

  // Sitemap settings
  sitemap: {
    excludePaths: ['/admin', '/login', '/signup', '/account'],
    changefreq: 'daily',
    priority: 0.7,
  },
};

module.exports = seoConfig;
