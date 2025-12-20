/**
 * Route Prefetching Utility
 * Intelligently prefetches routes based on user behavior and viewport visibility
 */

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

// Routes that should be prefetched on initial load
export const CRITICAL_ROUTES = [
  '/dashboard',
  '/upload',
  '/analytics',
] as const;

// Routes to prefetch based on current page
export const ROUTE_PREFETCH_MAP: Record<string, string[]> = {
  '/': ['/login', '/signup'],
  '/login': ['/dashboard'],
  '/signup': ['/dashboard'],
  '/dashboard': ['/upload', '/analytics', '/dashboard/tests', '/community'],
  '/upload': ['/dashboard', '/generate'],
  '/analytics': ['/dashboard', '/dashboard/tests'],
  '/dashboard/tests': ['/test', '/dashboard'],
  '/community': ['/dashboard'],
  '/dashboard/settings': ['/dashboard'],
};

/**
 * Hook to prefetch routes when component mounts or becomes visible
 */
export function usePrefetchRoutes(routes: string[]) {
  const router = useRouter();
  const prefetchedRef = useRef(new Set<string>());

  useEffect(() => {
    // Prefetch routes that haven't been prefetched yet
    routes.forEach((route) => {
      if (!prefetchedRef.current.has(route)) {
        router.prefetch(route);
        prefetchedRef.current.add(route);
      }
    });
  }, [routes, router]);
}

/**
 * Hook to prefetch a route when element is in viewport
 */
export function usePrefetchOnHover(route: string) {
  const router = useRouter();
  const prefetchedRef = useRef(false);

  const handleMouseEnter = () => {
    if (!prefetchedRef.current) {
      router.prefetch(route);
      prefetchedRef.current = true;
    }
  };

  return { onMouseEnter: handleMouseEnter };
}

/**
 * Hook to prefetch routes based on intersection observer
 */
export function usePrefetchOnVisible(routes: string[]) {
  const router = useRouter();
  const prefetchedRef = useRef(new Set<string>());
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            routes.forEach((route) => {
              if (!prefetchedRef.current.has(route)) {
                router.prefetch(route);
                prefetchedRef.current.add(route);
              }
            });
          }
        });
      },
      { threshold: 0.1 }
    );

    return () => {
      observerRef.current?.disconnect();
    };
  }, [routes, router]);

  return observerRef;
}

/**
 * Prefetch routes based on user's navigation pattern
 */
export function prefetchSmartRoutes(currentPath: string, router: any) {
  const routesToPrefetch = ROUTE_PREFETCH_MAP[currentPath] || [];
  
  // Use requestIdleCallback if available, otherwise use setTimeout
  const scheduleTask = (callback: () => void) => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(callback, { timeout: 2000 });
    } else {
      setTimeout(callback, 100);
    }
  };

  scheduleTask(() => {
    routesToPrefetch.forEach((route) => {
      router.prefetch(route);
    });
  });
}
