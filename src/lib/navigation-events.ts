/**
 * Navigation Events
 * Custom event system for navigation state management
 */

type NavigationEventListener = (href: string) => void;

class NavigationEvents {
  private listeners: Set<NavigationEventListener> = new Set();

  /**
   * Emit navigation start event
   */
  public start(href: string) {
    this.listeners.forEach(listener => listener(href));
  }

  /**
   * Subscribe to navigation start events
   */
  public onStart(listener: NavigationEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

export const navigationEvents = new NavigationEvents();
