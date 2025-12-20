"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import LoadingScreen from "@/components/loading-screen";
import { motion, AnimatePresence } from "framer-motion";
import { navigationEvents } from "@/lib/navigation-events";

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
  '/dashboard/test-history': 'Loading test history...',
  '/dashboard/settings': 'Loading settings...',
};

export default function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Loading...");
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const previousPathname = useRef(pathname);
  const loadingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const safetyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Subscribe to navigation events
  useEffect(() => {
    const unsubscribe = navigationEvents.onStart((href) => {
      // Clear any existing timers
      if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current);
      if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
      
      setLoadingMessage(routeMessages[href] || "Loading page...");
      setIsLoading(true);
      
      // Safety timeout: force hide loading after 3 seconds max
      safetyTimeoutRef.current = setTimeout(() => {
        setIsLoading(false);
      }, 3000);
    });

    return unsubscribe;
  }, []);

  // Handle link clicks
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');
      
      if (link && link.href && !link.target && !link.download) {
        try {
          const url = new URL(link.href);
          if (url.origin === window.location.origin && url.pathname !== pathname) {
            // Clear any existing timers
            if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current);
            if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
            
            setLoadingMessage(routeMessages[url.pathname] || "Loading page...");
            setIsLoading(true);
            
            // Safety timeout
            safetyTimeoutRef.current = setTimeout(() => {
              setIsLoading(false);
            }, 3000);
          }
        } catch {
          // Invalid URL, ignore
        }
      }
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [pathname]);

  // Hide loading when pathname changes
  useEffect(() => {
    if (previousPathname.current !== pathname) {
      // Clear safety timeout
      if (safetyTimeoutRef.current) {
        clearTimeout(safetyTimeoutRef.current);
        safetyTimeoutRef.current = null;
      }
      
      // Small delay before hiding to ensure smooth transition
      loadingTimerRef.current = setTimeout(() => {
        setIsLoading(false);
      }, 100);
      
      previousPathname.current = pathname;
    }
    
    return () => {
      if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
      if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current);
    };
  }, [pathname, searchParams]);

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
