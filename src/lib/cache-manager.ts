/**
 * Client-side Cache Manager
 * Manages client-side caching for faster subsequent loads
 */

type CacheEntry<T> = {
  data: T;
  timestamp: number;
  ttl: number;
};

class CacheManager {
  private cache: Map<string, CacheEntry<any>>;
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  /**
   * Set cache entry with TTL (time to live in ms)
   */
  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    // Evict oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Get cache entry if not expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Check if key exists and is valid
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete cache entry
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clear expired entries
   */
  clearExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }
}

// Singleton instance
export const clientCache = new CacheManager();

// Auto-clear expired entries every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    clientCache.clearExpired();
  }, 5 * 60 * 1000);
}

/**
 * Hook for using cache in React components
 */
export function useCachedData<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl?: number
): {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
} {
  const [data, setData] = React.useState<T | null>(clientCache.get(key));
  const [isLoading, setIsLoading] = React.useState(!data);
  const [error, setError] = React.useState<Error | null>(null);

  const fetchData = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await fetchFn();
      clientCache.set(key, result, ttl);
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [key, fetchFn, ttl]);

  React.useEffect(() => {
    if (!clientCache.has(key)) {
      fetchData();
    }
  }, [key, fetchData]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
  };
}

import React from 'react';
