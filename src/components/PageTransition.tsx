/**
 * Page Transition Component
 * Provides smooth animations between page navigations
 */

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

// Optimized transition variants
const pageVariants = {
  initial: {
    opacity: 0,
    scale: 0.98,
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.2,
      ease: [0.22, 1, 0.36, 1] as any,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    transition: {
      duration: 0.15,
      ease: [0.22, 1, 0.36, 1] as any,
    },
  },
};

/**
 * PageTransition with View Transitions API fallback
 */
export function PageTransition({ children, className }: PageTransitionProps) {
  const pathname = usePathname();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Check if View Transitions API is supported
  const supportsViewTransitions = 
    typeof document !== 'undefined' && 
    'startViewTransition' in document;

  useEffect(() => {
    // Update children after transition
    if (isTransitioning) {
      const timer = setTimeout(() => {
        setDisplayChildren(children);
        setIsTransitioning(false);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isTransitioning, children]);

  useEffect(() => {
    setIsTransitioning(true);
  }, [pathname]);

  // Use View Transitions API if available
  if (supportsViewTransitions && typeof document !== 'undefined') {
    return (
      <div className={className} style={{ viewTransitionName: 'page-transition' }}>
        {children}
      </div>
    );
  }

  // Fallback to Framer Motion
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className={className}
      >
        {displayChildren}
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Instant transition for same-section navigation
 */
export function InstantTransition({ children, className }: PageTransitionProps) {
  return <div className={className}>{children}</div>;
}

/**
 * Fade transition - fastest option
 */
export function FadeTransition({ children, className }: PageTransitionProps) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.1 }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
