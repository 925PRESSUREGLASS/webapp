/**
 * Accessibility Composable
 * Provides accessibility utilities and helpers
 * 
 * Features:
 * - Screen reader announcements
 * - Focus management
 * - Reduced motion preferences
 * - High contrast mode detection
 * - ARIA live region management
 */

import { ref, computed, onMounted, onUnmounted, watch } from 'vue';

// ============================================
// Types
// ============================================

export type AriaLive = 'polite' | 'assertive' | 'off';

export interface A11yOptions {
  announceDelay?: number;
  focusTrapEnabled?: boolean;
}

// ============================================
// Composable
// ============================================

export function useAccessibility(options: A11yOptions = {}) {
  // State
  const prefersReducedMotion = ref(false);
  const prefersHighContrast = ref(false);
  const prefersColorScheme = ref<'light' | 'dark' | 'no-preference'>('no-preference');
  const screenReaderAnnouncement = ref('');
  const isFocusVisible = ref(false);

  // Media queries
  let reducedMotionQuery: MediaQueryList | null = null;
  let highContrastQuery: MediaQueryList | null = null;
  let colorSchemeQuery: MediaQueryList | null = null;

  // ============================================
  // Screen Reader Announcements
  // ============================================

  /**
   * Create a live region for announcements (call once in app setup)
   */
  function createLiveRegion(): HTMLElement {
    let region = document.getElementById('a11y-live-region');
    
    if (!region) {
      region = document.createElement('div');
      region.id = 'a11y-live-region';
      region.setAttribute('aria-live', 'polite');
      region.setAttribute('aria-atomic', 'true');
      region.className = 'sr-only'; // Screen reader only
      region.style.cssText = `
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      `;
      document.body.appendChild(region);
    }
    
    return region;
  }

  /**
   * Announce message to screen readers
   */
  function announce(message: string, priority: AriaLive = 'polite'): void {
    const region = createLiveRegion();
    region.setAttribute('aria-live', priority);
    
    // Clear and set with delay to ensure announcement
    region.textContent = '';
    setTimeout(() => {
      region.textContent = message;
      screenReaderAnnouncement.value = message;
    }, options.announceDelay || 100);
  }

  /**
   * Announce error to screen readers (assertive)
   */
  function announceError(message: string): void {
    announce(message, 'assertive');
  }

  /**
   * Announce success to screen readers
   */
  function announceSuccess(message: string): void {
    announce(message, 'polite');
  }

  // ============================================
  // Focus Management
  // ============================================

  /**
   * Focus an element by selector or ref
   */
  function focusElement(
    target: string | HTMLElement | null,
    options: { preventScroll?: boolean } = {}
  ): void {
    const element = typeof target === 'string' 
      ? document.querySelector<HTMLElement>(target)
      : target;
    
    if (element && typeof element.focus === 'function') {
      element.focus({ preventScroll: options.preventScroll });
    }
  }

  /**
   * Focus first focusable element within container
   */
  function focusFirstFocusable(container: HTMLElement | null): void {
    if (!container) return;
    
    const focusable = container.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusable) {
      focusable.focus();
    }
  }

  /**
   * Get all focusable elements within container
   */
  function getFocusableElements(container: HTMLElement): HTMLElement[] {
    return Array.from(container.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])'
    ));
  }

  /**
   * Trap focus within container
   */
  function createFocusTrap(container: HTMLElement): () => void {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      
      const focusable = getFocusableElements(container);
      if (focusable.length === 0) return;
      
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    
    container.addEventListener('keydown', handleKeyDown);
    
    // Return cleanup function
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }

  /**
   * Store and restore focus for modals/dialogs
   */
  let previouslyFocusedElement: HTMLElement | null = null;

  function saveFocus(): void {
    previouslyFocusedElement = document.activeElement as HTMLElement;
  }

  function restoreFocus(): void {
    if (previouslyFocusedElement && typeof previouslyFocusedElement.focus === 'function') {
      previouslyFocusedElement.focus();
      previouslyFocusedElement = null;
    }
  }

  // ============================================
  // Skip Links
  // ============================================

  /**
   * Create skip link for main content
   */
  function createSkipLink(targetId: string = 'main-content', label: string = 'Skip to main content'): void {
    let skipLink = document.getElementById('skip-link');
    
    if (!skipLink) {
      skipLink = document.createElement('a');
      skipLink.id = 'skip-link';
      skipLink.href = `#${targetId}`;
      skipLink.textContent = label;
      skipLink.className = 'skip-link';
      skipLink.style.cssText = `
        position: absolute;
        top: -40px;
        left: 0;
        background: #000;
        color: #fff;
        padding: 8px 16px;
        z-index: 10000;
        text-decoration: none;
        transition: top 0.3s;
      `;
      
      // Show on focus
      skipLink.addEventListener('focus', () => {
        skipLink!.style.top = '0';
      });
      
      skipLink.addEventListener('blur', () => {
        skipLink!.style.top = '-40px';
      });
      
      document.body.insertBefore(skipLink, document.body.firstChild);
    }
  }

  // ============================================
  // Preferences Detection
  // ============================================

  function initPreferencesDetection(): void {
    // Reduced motion
    if (window.matchMedia) {
      reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      prefersReducedMotion.value = reducedMotionQuery.matches;
      reducedMotionQuery.addEventListener('change', (e) => {
        prefersReducedMotion.value = e.matches;
      });
      
      // High contrast
      highContrastQuery = window.matchMedia('(prefers-contrast: more)');
      prefersHighContrast.value = highContrastQuery.matches;
      highContrastQuery.addEventListener('change', (e) => {
        prefersHighContrast.value = e.matches;
      });
      
      // Color scheme
      colorSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
      prefersColorScheme.value = colorSchemeQuery.matches ? 'dark' : 'light';
      colorSchemeQuery.addEventListener('change', (e) => {
        prefersColorScheme.value = e.matches ? 'dark' : 'light';
      });
    }
  }

  // ============================================
  // Focus Visible Detection
  // ============================================

  function initFocusVisibleDetection(): void {
    // Track keyboard vs mouse focus
    let hadKeyboardEvent = false;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        hadKeyboardEvent = true;
      }
    };
    
    const handleMouseDown = () => {
      hadKeyboardEvent = false;
    };
    
    const handleFocus = () => {
      isFocusVisible.value = hadKeyboardEvent;
    };
    
    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('mousedown', handleMouseDown, true);
    document.addEventListener('focusin', handleFocus, true);
  }

  // ============================================
  // ARIA Helpers
  // ============================================

  /**
   * Generate unique ID for ARIA relationships
   */
  function generateId(prefix: string = 'a11y'): string {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Set ARIA attributes on element
   */
  function setAriaAttributes(
    element: HTMLElement,
    attrs: Record<string, string | boolean | number>
  ): void {
    Object.entries(attrs).forEach(([key, value]) => {
      if (value === false || value === '') {
        element.removeAttribute(`aria-${key}`);
      } else {
        element.setAttribute(`aria-${key}`, String(value));
      }
    });
  }

  // ============================================
  // Keyboard Navigation Helpers
  // ============================================

  /**
   * Handle arrow key navigation in lists
   */
  function handleListNavigation(
    event: KeyboardEvent,
    items: HTMLElement[],
    options: { wrap?: boolean; orientation?: 'horizontal' | 'vertical' } = {}
  ): void {
    const { wrap = true, orientation = 'vertical' } = options;
    const currentIndex = items.findIndex(item => item === document.activeElement);
    
    if (currentIndex === -1) return;
    
    let nextIndex = currentIndex;
    
    const isNext = orientation === 'vertical' 
      ? event.key === 'ArrowDown' 
      : event.key === 'ArrowRight';
    const isPrev = orientation === 'vertical' 
      ? event.key === 'ArrowUp' 
      : event.key === 'ArrowLeft';
    
    if (isNext) {
      event.preventDefault();
      nextIndex = wrap 
        ? (currentIndex + 1) % items.length
        : Math.min(currentIndex + 1, items.length - 1);
    } else if (isPrev) {
      event.preventDefault();
      nextIndex = wrap 
        ? (currentIndex - 1 + items.length) % items.length
        : Math.max(currentIndex - 1, 0);
    } else if (event.key === 'Home') {
      event.preventDefault();
      nextIndex = 0;
    } else if (event.key === 'End') {
      event.preventDefault();
      nextIndex = items.length - 1;
    }
    
    if (nextIndex !== currentIndex) {
      items[nextIndex].focus();
    }
  }

  // ============================================
  // Initialization
  // ============================================

  function initialize(): void {
    createLiveRegion();
    initPreferencesDetection();
    initFocusVisibleDetection();
  }

  // ============================================
  // Return
  // ============================================

  return {
    // State
    prefersReducedMotion: computed(() => prefersReducedMotion.value),
    prefersHighContrast: computed(() => prefersHighContrast.value),
    prefersColorScheme: computed(() => prefersColorScheme.value),
    screenReaderAnnouncement: computed(() => screenReaderAnnouncement.value),
    isFocusVisible: computed(() => isFocusVisible.value),

    // Announcements
    announce,
    announceError,
    announceSuccess,

    // Focus management
    focusElement,
    focusFirstFocusable,
    getFocusableElements,
    createFocusTrap,
    saveFocus,
    restoreFocus,

    // Skip links
    createSkipLink,

    // ARIA helpers
    generateId,
    setAriaAttributes,

    // Keyboard navigation
    handleListNavigation,

    // Initialization
    initialize,
  };
}
