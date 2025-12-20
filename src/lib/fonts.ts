/**
 * Optimized Font Loading with next/font
 * Preloads fonts, enables font swapping, and reduces CLS
 */

import { Inter, Roboto_Mono, Poppins } from 'next/font/google';

/**
 * Primary font - Inter for body text
 * Features: Variable font, automatic subsetting, display swap
 */
export const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
  fallback: [
    'system-ui',
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'Roboto',
    'sans-serif',
  ],
});

/**
 * Monospace font for code - Roboto Mono
 * Used in code blocks, technical displays
 */
export const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
  variable: '--font-mono',
  preload: true,
  fallback: [
    'ui-monospace',
    'SFMono-Regular',
    'Menlo',
    'Monaco',
    'Consolas',
    'monospace',
  ],
});

/**
 * Heading font - Poppins
 * Used for headings and display text
 */
export const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-poppins',
  preload: true,
  fallback: [
    'system-ui',
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'Roboto',
    'sans-serif',
  ],
});

/**
 * Combined font classes for easy application
 */
export const fontClasses = `${inter.variable} ${robotoMono.variable} ${poppins.variable}`;

/**
 * Font utility classes for Tailwind
 * Usage in tailwind.config.ts:
 * 
 * theme: {
 *   extend: {
 *     fontFamily: {
 *       sans: ['var(--font-inter)'],
 *       mono: ['var(--font-mono)'],
 *       display: ['var(--font-poppins)'],
 *     }
 *   }
 * }
 */

/**
 * Type-safe font configuration
 */
export type FontConfig = {
  className: string;
  style: React.CSSProperties;
};

export const getFontConfig = (fontType: 'sans' | 'mono' | 'display'): FontConfig => {
  const fonts = {
    sans: inter,
    mono: robotoMono,
    display: poppins,
  };

  const font = fonts[fontType];
  return {
    className: font.className,
    style: font.style,
  };
};
