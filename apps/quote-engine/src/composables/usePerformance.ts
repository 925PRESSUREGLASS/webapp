/**
 * Performance Utilities Composable
 * Provides performance optimization helpers
 * 
 * Features:
 * - Debounce and throttle
 * - Lazy loading helpers
 * - Memory management
 * - Performance metrics
 * - Virtual scrolling helpers
 */

import { ref, computed, onUnmounted, shallowRef } from 'vue';

// ============================================
// Types
// ============================================

export interface PerformanceMetrics {
  loadTime: number;
  domContentLoaded: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;
  memoryUsage: number | null;
}

export interface VirtualScrollOptions<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

// ============================================
// Composable
// ============================================

export function usePerformance() {
  // Track cleanup functions
  const cleanupFunctions: (() => void)[] = [];

  // ============================================
  // Debounce
  // ============================================

  /**
   * Create a debounced function
   */
  function debounce<T extends (...args: any[]) => any>(
    fn: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const debouncedFn = (...args: Parameters<T>) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        fn(...args);
        timeoutId = null;
      }, delay);
    };

    // Add cleanup
    cleanupFunctions.push(() => {
      if (timeoutId) clearTimeout(timeoutId);
    });

    return debouncedFn;
  }

  /**
   * Create a debounced ref that updates after delay
   */
  function useDebouncedRef<T>(initialValue: T, delay: number) {
    const value = ref(initialValue);
    const debouncedValue = ref(initialValue);
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const updateDebounced = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        debouncedValue.value = value.value as any;
      }, delay);
    };

    cleanupFunctions.push(() => {
      if (timeoutId) clearTimeout(timeoutId);
    });

    return {
      value,
      debouncedValue: computed(() => debouncedValue.value),
      update: (newValue: T) => {
        value.value = newValue as any;
        updateDebounced();
      },
    };
  }

  // ============================================
  // Throttle
  // ============================================

  /**
   * Create a throttled function
   */
  function throttle<T extends (...args: any[]) => any>(
    fn: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let lastCall = 0;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const throttledFn = (...args: Parameters<T>) => {
      const now = Date.now();

      if (now - lastCall >= limit) {
        lastCall = now;
        fn(...args);
      } else {
        // Schedule for when limit is reached
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          lastCall = Date.now();
          fn(...args);
        }, limit - (now - lastCall));
      }
    };

    cleanupFunctions.push(() => {
      if (timeoutId) clearTimeout(timeoutId);
    });

    return throttledFn;
  }

  // ============================================
  // Lazy Loading
  // ============================================

  /**
   * Create a lazy-loaded ref that only computes when accessed
   */
  function useLazyRef<T>(factory: () => T) {
    let computed = false;
    let value: T;

    return {
      get value(): T {
        if (!computed) {
          value = factory();
          computed = true;
        }
        return value;
      },
      reset() {
        computed = false;
      },
    };
  }

  /**
   * Intersection Observer for lazy loading elements
   */
  function useLazyLoad(
    callback: (entry: IntersectionObserverEntry) => void,
    options: IntersectionObserverInit = {}
  ) {
    const isIntersecting = ref(false);
    let observer: IntersectionObserver | null = null;

    const observe = (element: HTMLElement) => {
      if (observer) {
        observer.disconnect();
      }

      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            isIntersecting.value = entry.isIntersecting;
            callback(entry);
          });
        },
        {
          rootMargin: '50px',
          threshold: 0.1,
          ...options,
        }
      );

      observer.observe(element);
    };

    const unobserve = () => {
      if (observer) {
        observer.disconnect();
        observer = null;
      }
    };

    cleanupFunctions.push(unobserve);

    return {
      isIntersecting: computed(() => isIntersecting.value),
      observe,
      unobserve,
    };
  }

  // ============================================
  // Virtual Scrolling
  // ============================================

  /**
   * Virtual scroll helper for large lists
   */
  function useVirtualScroll<T>(options: VirtualScrollOptions<T>) {
    const scrollTop = ref(0);
    const { items, itemHeight, containerHeight, overscan = 3 } = options;

    const visibleCount = computed(() => 
      Math.ceil(containerHeight / itemHeight) + overscan * 2
    );

    const startIndex = computed(() => 
      Math.max(0, Math.floor(scrollTop.value / itemHeight) - overscan)
    );

    const endIndex = computed(() => 
      Math.min(items.length, startIndex.value + visibleCount.value)
    );

    const visibleItems = computed(() => 
      items.slice(startIndex.value, endIndex.value)
    );

    const offsetY = computed(() => 
      startIndex.value * itemHeight
    );

    const totalHeight = computed(() => 
      items.length * itemHeight
    );

    const handleScroll = (event: Event) => {
      const target = event.target as HTMLElement;
      scrollTop.value = target.scrollTop;
    };

    return {
      scrollTop,
      visibleItems,
      startIndex,
      endIndex,
      offsetY,
      totalHeight,
      handleScroll,
    };
  }

  // ============================================
  // Performance Metrics
  // ============================================

  /**
   * Get performance metrics
   */
  function getPerformanceMetrics(): PerformanceMetrics {
    const metrics: PerformanceMetrics = {
      loadTime: 0,
      domContentLoaded: 0,
      firstContentfulPaint: 0,
      largestContentfulPaint: 0,
      firstInputDelay: 0,
      cumulativeLayoutShift: 0,
      memoryUsage: null,
    };

    if (typeof performance === 'undefined') {
      return metrics;
    }

    // Navigation timing
    const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navEntry) {
      metrics.loadTime = navEntry.loadEventEnd - navEntry.startTime;
      metrics.domContentLoaded = navEntry.domContentLoadedEventEnd - navEntry.startTime;
    }

    // Paint timing
    const paintEntries = performance.getEntriesByType('paint');
    const fcp = paintEntries.find(e => e.name === 'first-contentful-paint');
    if (fcp) {
      metrics.firstContentfulPaint = fcp.startTime;
    }

    // Memory usage (Chrome only)
    const memory = (performance as any).memory;
    if (memory) {
      metrics.memoryUsage = memory.usedJSHeapSize;
    }

    return metrics;
  }

  /**
   * Measure execution time of a function
   */
  async function measureTime<T>(
    name: string,
    fn: () => T | Promise<T>
  ): Promise<{ result: T; duration: number }> {
    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;

    console.log(`[PERF] ${name}: ${duration.toFixed(2)}ms`);

    return { result, duration };
  }

  // ============================================
  // Memory Management
  // ============================================

  /**
   * Create a cache with size limit
   */
  function createLRUCache<K, V>(maxSize: number) {
    const cache = new Map<K, V>();

    return {
      get(key: K): V | undefined {
        const value = cache.get(key);
        if (value !== undefined) {
          // Move to end (most recently used)
          cache.delete(key);
          cache.set(key, value);
        }
        return value;
      },

      set(key: K, value: V): void {
        if (cache.has(key)) {
          cache.delete(key);
        } else if (cache.size >= maxSize) {
          // Remove oldest entry
          const firstKey = cache.keys().next().value;
          cache.delete(firstKey);
        }
        cache.set(key, value);
      },

      has(key: K): boolean {
        return cache.has(key);
      },

      clear(): void {
        cache.clear();
      },

      get size(): number {
        return cache.size;
      },
    };
  }

  /**
   * Create a weak cache for objects
   */
  function createWeakCache<K extends object, V>() {
    const cache = new WeakMap<K, V>();

    return {
      get: (key: K) => cache.get(key),
      set: (key: K, value: V) => cache.set(key, value),
      has: (key: K) => cache.has(key),
      delete: (key: K) => cache.delete(key),
    };
  }

  // ============================================
  // Request Animation Frame
  // ============================================

  /**
   * Schedule a function to run on next animation frame
   */
  function scheduleFrame(callback: () => void): number {
    return requestAnimationFrame(callback);
  }

  /**
   * Cancel a scheduled frame
   */
  function cancelFrame(id: number): void {
    cancelAnimationFrame(id);
  }

  /**
   * Batch DOM updates to run in animation frame
   */
  function batchUpdates(updates: (() => void)[]): void {
    requestAnimationFrame(() => {
      updates.forEach(update => update());
    });
  }

  // ============================================
  // Idle Callback
  // ============================================

  /**
   * Run function when browser is idle
   */
  function runWhenIdle(
    callback: () => void,
    options: { timeout?: number } = {}
  ): number {
    if ('requestIdleCallback' in window) {
      return (window as any).requestIdleCallback(callback, options);
    } else {
      // Fallback to setTimeout
      return window.setTimeout(callback, 1);
    }
  }

  /**
   * Cancel idle callback
   */
  function cancelIdle(id: number): void {
    if ('cancelIdleCallback' in window) {
      (window as any).cancelIdleCallback(id);
    } else {
      clearTimeout(id);
    }
  }

  // ============================================
  // Cleanup
  // ============================================

  onUnmounted(() => {
    cleanupFunctions.forEach(cleanup => cleanup());
  });

  // ============================================
  // Return
  // ============================================

  return {
    // Debounce/Throttle
    debounce,
    throttle,
    useDebouncedRef,

    // Lazy loading
    useLazyRef,
    useLazyLoad,

    // Virtual scroll
    useVirtualScroll,

    // Performance metrics
    getPerformanceMetrics,
    measureTime,

    // Memory management
    createLRUCache,
    createWeakCache,

    // Animation frames
    scheduleFrame,
    cancelFrame,
    batchUpdates,

    // Idle callbacks
    runWhenIdle,
    cancelIdle,
  };
}
