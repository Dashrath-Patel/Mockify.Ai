/**
 * SEO Metadata Utilities
 * Generates comprehensive metadata for improved search engine visibility
 */

import { Metadata } from 'next';
import { getBaseUrl } from './env';

/**
 * Default site configuration
 */
const siteConfig = {
  name: 'MockifyAI',
  description:
    'AI-powered mock test generator for students. Upload your study materials and get personalized practice questions instantly.',
  url: getBaseUrl(),
  ogImage: '/og-image.png',
  links: {
    twitter: 'https://twitter.com/mockifyai',
    github: 'https://github.com/yourusername/mockify-ai',
  },
};

/**
 * Page metadata configuration
 */
export type PageMetadata = {
  title: string;
  description: string;
  image?: string;
  canonical?: string;
  noindex?: boolean;
  keywords?: string[];
  type?: 'website' | 'article' | 'profile';
  publishedTime?: string;
  modifiedTime?: string;
  authors?: string[];
};

/**
 * Generate comprehensive metadata for a page
 */
export function generateMetadata(config: PageMetadata): Metadata {
  const {
    title,
    description,
    image = siteConfig.ogImage,
    canonical,
    noindex = false,
    keywords = [],
    type = 'website',
    publishedTime,
    modifiedTime,
    authors,
  } = config;

  const url = canonical || siteConfig.url;
  const fullTitle = `${title} | ${siteConfig.name}`;
  const imageUrl = image.startsWith('http') ? image : `${siteConfig.url}${image}`;

  return {
    title: fullTitle,
    description,
    keywords: [
      'AI mock tests',
      'study materials',
      'practice questions',
      'exam preparation',
      'educational technology',
      ...keywords,
    ],
    authors: authors ? authors.map(name => ({ name })) : [{ name: 'MockifyAI Team' }],
    creator: 'MockifyAI',
    publisher: 'MockifyAI',
    
    // Robots
    robots: {
      index: !noindex,
      follow: !noindex,
      googleBot: {
        index: !noindex,
        follow: !noindex,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },

    // Open Graph
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: siteConfig.name,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: 'en_US',
      type,
      ...(publishedTime && { publishedTime }),
      ...(modifiedTime && { modifiedTime }),
    },

    // Twitter
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [imageUrl],
      creator: '@mockifyai',
      site: '@mockifyai',
    },

    // Canonical URL
    alternates: {
      canonical: url,
    },

    // Additional metadata
    other: {
      'application-name': siteConfig.name,
    },
  };
}

/**
 * Home page metadata
 */
export const homeMetadata: Metadata = generateMetadata({
  title: 'AI-Powered Mock Test Generator',
  description:
    'Transform your study materials into personalized practice questions with AI. Upload PDFs, images, or text and get instant mock tests tailored to your learning needs.',
  keywords: [
    'AI test generator',
    'study assistant',
    'personalized learning',
    'exam prep',
    'automated questions',
  ],
});

/**
 * Dashboard metadata
 */
export const dashboardMetadata: Metadata = generateMetadata({
  title: 'Dashboard',
  description: 'Track your learning progress and access your study materials.',
  noindex: true, // Private page
});

/**
 * Upload page metadata
 */
export const uploadMetadata: Metadata = generateMetadata({
  title: 'Upload Study Materials',
  description:
    'Upload your study materials in PDF, image, or text format. Our AI will analyze and generate practice questions.',
  keywords: ['upload materials', 'PDF upload', 'study documents'],
});

/**
 * Generate page metadata
 */
export const generateQuestionsMetadata: Metadata = generateMetadata({
  title: 'Generate Questions',
  description:
    'Generate personalized mock test questions from your study materials using advanced AI.',
  keywords: ['question generation', 'AI questions', 'practice tests'],
});

/**
 * Analytics page metadata
 */
export const analyticsMetadata: Metadata = generateMetadata({
  title: 'Analytics',
  description: 'View detailed analytics about your test performance and learning progress.',
  noindex: true, // Private page
});

/**
 * Settings page metadata
 */
export const settingsMetadata: Metadata = generateMetadata({
  title: 'Settings',
  description: 'Manage your account settings and preferences.',
  noindex: true, // Private page
});

/**
 * Login page metadata
 */
export const loginMetadata: Metadata = generateMetadata({
  title: 'Login',
  description: 'Sign in to your MockifyAI account to access your study materials and tests.',
  keywords: ['login', 'sign in', 'authentication'],
});

/**
 * Signup page metadata
 */
export const signupMetadata: Metadata = generateMetadata({
  title: 'Sign Up',
  description:
    'Create your free MockifyAI account and start generating personalized practice questions.',
  keywords: ['sign up', 'register', 'create account', 'free trial'],
});

/**
 * Generate dynamic test metadata
 */
export function generateTestMetadata(testTitle: string, testId: string): Metadata {
  return generateMetadata({
    title: testTitle,
    description: `Take the ${testTitle} mock test and track your performance.`,
    canonical: `${siteConfig.url}/test/${testId}`,
    noindex: true, // Private content
    type: 'article',
  });
}

/**
 * JSON-LD structured data for homepage
 */
export const homeStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: siteConfig.name,
  description: siteConfig.description,
  url: siteConfig.url,
  applicationCategory: 'EducationalApplication',
  operatingSystem: 'Web Browser',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    ratingCount: '1250',
  },
  creator: {
    '@type': 'Organization',
    name: siteConfig.name,
    url: siteConfig.url,
  },
};

/**
 * JSON-LD for breadcrumbs
 */
export function generateBreadcrumbStructuredData(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * JSON-LD for FAQ
 */
export function generateFAQStructuredData(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}
