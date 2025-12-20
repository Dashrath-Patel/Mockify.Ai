"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import LoadingScreen from "@/components/loading-screen";
import { motion, AnimatePresence } from "framer-motion";
import { navigationEvents } from "@/lib/navigation-events";

export default function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Loading...");
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const previousPathname = useRef(pathname);
  const loadingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const showLoading = useCallback((targetPath?: string) => {
    const routeMessages: Record<string, string> = {
      // Auth pages
      '/login': 'Loading login...',
      '/signup': 'Loading signup...',
      '/onboarding': 'Setting up your account...',
      
      // Main pages
      '/': 'Loading...',
      '/dashboard': 'Loading dashboard...',
      '/upload': 'Preparing upload...',
      '/generate': 'Loading generator...',
      
      // Dashboard sub-pages
      '/dashboard/analytics': 'Loading analytics...',
      '/dashboard/materials': 'Loading materials...',
      '/dashboard/tests': 'Loading tests...',
      '/dashboard/settings': 'Loading settings...',
    };
    
    const path = targetPath || pathname;
    setLoadingMessage(routeMessages[path] || "Loading page...");
    setIsLoading(true);
  }, [pathname]);

  const hideLoading = useCallback(() => {
    // Clear any existing timer
    if (loadingTimerRef.current) {
      clearTimeout(loadingTimerRef.current);
    }
    
    // Minimum display time of 200ms to ensure visibility
    loadingTimerRef.current = setTimeout(() => {
      setIsLoading(false);
    }, 200);
  }, []);

  useEffect(() => {
    // Subscribe to navigation events from OptimizedLink
    const unsubscribe = navigationEvents.onStart((href) => {
      showLoading(href);
    });

    return unsubscribe;
  }, [showLoading]);

  useEffect(() => {
    // Fallback: Listen for any link clicks to show loader immediately
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');
      
      if (link && link.href && !link.target && !link.download) {
        const url = new URL(link.href);
        // Only show loading for internal navigation
        if (url.origin === window.location.origin && url.pathname !== pathname) {
          showLoading(url.pathname);
        }
      }
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [pathname, showLoading]);

  useEffect(() => {
    // Detect when pathname actually changes
    if (previousPathname.current !== pathname) {
      // If not already loading, show it now
      if (!isLoading) {
        showLoading(pathname);
      }
      
      // Hide loading after navigation completes
      hideLoading();
      previousPathname.current = pathname;
    }
    
    return () => {
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
      }
    };
  }, [pathname, searchParams, isLoading, showLoading, hideLoading]);

  return (
    <>
      <AnimatePresence mode="wait">
        {isLoading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <LoadingScreen message={loadingMessage} />
          </motion.div>
        )}
      </AnimatePresence>
      
      {!isLoading && children}
    </>
  );
}
