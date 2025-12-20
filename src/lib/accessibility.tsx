"use client";

/**
 * Accessibility Utilities and Hooks
 * Improves keyboard navigation, ARIA labels, and screen reader support
 */

import { useEffect, useState, useCallback, useRef } from 'react';

/**
 * Detect if user prefers reduced motion
 */
export function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = () => {
      setPrefersReducedMotion(mediaQuery.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}

/**
 * Trap focus within a container (useful for modals)
 */
export function useFocusTrap(isActive: boolean = true) {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    // Focus first element on mount
    firstElement?.focus();

    container.addEventListener('keydown', handleTabKey as any);
    return () => container.removeEventListener('keydown', handleTabKey as any);
  }, [isActive]);

  return containerRef;
}

/**
 * Announce to screen readers
 */
export function announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Hook for managing announcements
 */
export function useAnnounce() {
  return useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    announce(message, priority);
  }, []);
}

/**
 * Keyboard navigation hook
 */
export function useKeyboardNavigation<T extends HTMLElement>(
  items: number,
  onSelect: (index: number) => void,
  options: {
    loop?: boolean;
    orientation?: 'vertical' | 'horizontal';
  } = {}
) {
  const { loop = true, orientation = 'vertical' } = options;
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<T>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const isVertical = orientation === 'vertical';
      const nextKey = isVertical ? 'ArrowDown' : 'ArrowRight';
      const prevKey = isVertical ? 'ArrowUp' : 'ArrowLeft';

      switch (e.key) {
        case nextKey:
          e.preventDefault();
          setActiveIndex(prev => {
            const next = prev + 1;
            if (next >= items) return loop ? 0 : prev;
            return next;
          });
          break;

        case prevKey:
          e.preventDefault();
          setActiveIndex(prev => {
            const next = prev - 1;
            if (next < 0) return loop ? items - 1 : prev;
            return next;
          });
          break;

        case 'Home':
          e.preventDefault();
          setActiveIndex(0);
          break;

        case 'End':
          e.preventDefault();
          setActiveIndex(items - 1);
          break;

        case 'Enter':
        case ' ':
          e.preventDefault();
          onSelect(activeIndex);
          break;

        case 'Escape':
          e.preventDefault();
          // Blur the container
          containerRef.current?.blur();
          break;
      }
    },
    [activeIndex, items, loop, orientation, onSelect]
  );

  return {
    containerRef,
    activeIndex,
    setActiveIndex,
    handleKeyDown,
  };
}

/**
 * Skip to content link for keyboard users
 */
export function SkipToContent({ contentId = 'main-content' }: { contentId?: string }) {
  return (
    <a
      href={`#${contentId}`}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 
        focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground 
        focus:rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
    >
      Skip to content
    </a>
  );
}

/**
 * Visually hidden component (for screen readers only)
 */
export function VisuallyHidden({ children }: { children: React.ReactNode }) {
  return <span className="sr-only">{children}</span>;
}

/**
 * ARIA live region component
 */
export function LiveRegion({
  children,
  priority = 'polite',
  atomic = true,
}: {
  children: React.ReactNode;
  priority?: 'polite' | 'assertive';
  atomic?: boolean;
}) {
  return (
    <div
      role="status"
      aria-live={priority}
      aria-atomic={atomic}
      className="sr-only"
    >
      {children}
    </div>
  );
}

/**
 * Generate unique IDs for ARIA relationships
 */
let idCounter = 0;

export function useId(prefix: string = 'id'): string {
  const [id] = useState(() => {
    idCounter += 1;
    return `${prefix}-${idCounter}`;
  });
  return id;
}

/**
 * Focus management utilities
 */
export function restoreFocus(element: HTMLElement | null) {
  if (element && document.contains(element)) {
    element.focus();
  }
}

export function saveFocus(): HTMLElement | null {
  return document.activeElement as HTMLElement;
}

/**
 * Roving tabindex hook (for toolbars, menus, etc.)
 */
export function useRovingTabIndex<T extends HTMLElement>(
  items: number,
  defaultIndex: number = 0
) {
  const [currentIndex, setCurrentIndex] = useState(defaultIndex);
  const itemRefs = useRef<(T | null)[]>([]);

  const getTabIndex = useCallback(
    (index: number) => (index === currentIndex ? 0 : -1),
    [currentIndex]
  );

  const setItemRef = useCallback((index: number) => {
    return (element: T | null) => {
      itemRefs.current[index] = element;
    };
  }, []);

  const focusItem = useCallback((index: number) => {
    setCurrentIndex(index);
    itemRefs.current[index]?.focus();
  }, []);

  return {
    getTabIndex,
    setItemRef,
    focusItem,
    currentIndex,
  };
}

/**
 * Accessible button props generator
 */
export function getAccessibleButtonProps(config: {
  label: string;
  description?: string;
  pressed?: boolean;
  expanded?: boolean;
  controls?: string;
  disabled?: boolean;
}) {
  const { label, description, pressed, expanded, controls, disabled } = config;

  return {
    'aria-label': label,
    ...(description && { 'aria-describedby': description }),
    ...(pressed !== undefined && { 'aria-pressed': pressed }),
    ...(expanded !== undefined && { 'aria-expanded': expanded }),
    ...(controls && { 'aria-controls': controls }),
    ...(disabled && { 'aria-disabled': true }),
  };
}

/**
 * Check if device is touch-enabled
 */
export function useIsTouchDevice(): boolean {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    setIsTouch(
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      // @ts-ignore
      navigator.msMaxTouchPoints > 0
    );
  }, []);

  return isTouch;
}

/**
 * Announce route changes to screen readers
 */
export function useRouteAnnouncement() {
  useEffect(() => {
    const handleRouteChange = () => {
      const title = document.title;
      announce(`Navigated to ${title}`, 'polite');
    };

    // Listen for title changes (Next.js changes title on navigation)
    const observer = new MutationObserver(handleRouteChange);
    observer.observe(document.querySelector('title')!, {
      childList: true,
    });

    return () => observer.disconnect();
  }, []);
}
