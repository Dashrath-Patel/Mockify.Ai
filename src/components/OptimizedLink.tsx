/**
 * Optimized Link Component
 * Enhanced Next.js Link with intelligent prefetching
 */

'use client';

import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import { ReactNode, useRef, MouseEvent } from 'react';
import { cn } from '@/lib/utils';
import { navigationEvents } from '@/lib/navigation-events';

interface OptimizedLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  prefetch?: boolean;
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
  replace?: boolean;
  scroll?: boolean;
  shallow?: boolean;
}

/**
 * Optimized Link with instant navigation feel
 */
export function OptimizedLink({
  href,
  children,
  className,
  prefetch = true,
  onClick,
  replace = false,
  scroll = true,
  shallow = false,
  ...props
}: OptimizedLinkProps) {
  const router = useRouter();
  const prefetchedRef = useRef(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const handleMouseEnter = () => {
    if (!prefetchedRef.current && prefetch) {
      // Prefetch on hover with debounce
      hoverTimeoutRef.current = setTimeout(() => {
        router.prefetch(href);
        prefetchedRef.current = true;
      }, 50);
    }
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
  };

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    // Call custom onClick if provided
    onClick?.(e);

    // Don't interfere with browser default behavior
    if (
      e.defaultPrevented ||
      e.button !== 0 || // Not left click
      e.metaKey || // Cmd/Ctrl click
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey
    ) {
      return;
    }

    e.preventDefault();

    // Emit navigation start event IMMEDIATELY
    navigationEvents.start(href);

    // Use router for instant navigation
    if (replace) {
      router.replace(href);
    } else {
      router.push(href);
    }
  };

  return (
    <NextLink
      href={href}
      className={cn(className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      prefetch={prefetch}
      {...props}
    >
      {children}
    </NextLink>
  );
}

/**
 * Button-styled optimized link
 */
export function LinkButton({
  href,
  children,
  className,
  variant = 'default',
  ...props
}: OptimizedLinkProps & {
  variant?: 'default' | 'primary' | 'secondary' | 'ghost';
}) {
  const variantStyles = {
    default: 'bg-white dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700',
    primary: 'bg-linear-to-r from-violet-600 to-purple-600 text-white hover:from-violet-700 hover:to-purple-700',
    secondary: 'bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600',
    ghost: 'hover:bg-gray-100 dark:hover:bg-slate-800',
  };

  return (
    <OptimizedLink
      href={href}
      className={cn(
        'inline-flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-colors',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </OptimizedLink>
  );
}
