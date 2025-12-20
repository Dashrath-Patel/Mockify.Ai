/**
 * Optimized Component Loader
 * Dynamically imports components with loading states
 */

import dynamic from 'next/dynamic';
import { ComponentType, ReactElement } from 'react';
import Loader from '@/components/ui/aceternity/loader';

// Minimal loading component for instant feedback
export function ComponentLoader() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-32 h-32">
          <Loader />
        </div>
        <p className="text-sm text-black font-medium">Loading...</p>
      </div>
    </div>
  );
}

// Skeleton loader for cards
export function CardSkeleton() {
  return (
    <div className="rounded-2xl bg-white dark:bg-slate-800/50 border-2 border-gray-200 dark:border-slate-700 p-6 animate-pulse">
      <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/4 mb-4" />
      <div className="space-y-2">
        <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded" />
        <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-5/6" />
      </div>
    </div>
  );
}

// Skeleton loader for lists
export function ListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="h-16 bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-lg animate-pulse"
        />
      ))}
    </div>
  );
}

// Page skeleton loader
export function PageSkeleton() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      <div className="h-8 bg-gray-200 dark:bg-slate-700 rounded w-1/3" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
      <div className="h-64 bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-2xl" />
    </div>
  );
}

/**
 * Dynamic import with optimized loading
 */
export function loadComponent<P = {}>(
  importFunc: () => Promise<{ default: ComponentType<P> }>,
  LoadingComponent: ComponentType = ComponentLoader
) {
  return dynamic(importFunc, {
    loading: () => <LoadingComponent />,
    ssr: true,
  });
}

/**
 * Preload a component
 */
export async function preloadComponent<P = {}>(
  importFunc: () => Promise<{ default: ComponentType<P> }>
) {
  try {
    await importFunc();
  } catch (error) {
    console.warn('Failed to preload component:', error);
  }
}

/**
 * Create lazy component with custom loader
 */
export function lazyWithPreload<P = {}>(
  factory: () => Promise<{ default: ComponentType<P> }>,
  LoadingFallback?: ReactElement
) {
  const Component = dynamic(factory, {
    loading: () => LoadingFallback || <ComponentLoader />,
    ssr: true,
  });

  // Add preload function to component
  (Component as any).preload = factory;

  return Component;
}
