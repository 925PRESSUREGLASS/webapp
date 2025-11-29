import { ref } from 'vue';
import { useAuthStore } from '../stores/auth';

/**
 * API client composable for meta-api communication
 * Handles fetching pricing data from the backend API
 * Supports authenticated and public endpoints
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://meta-api-78ow.onrender.com';

interface ServiceType {
  id: string;
  name: string;
  code: string;
  description: string;
  basePrice: number;
  baseTimeMinutes: number;
  sqftPrice: number | null;
  sqftTimeMinutes: number | null;
  unit: string;
  isActive: boolean;
  serviceLine: {
    id: string;
    name: string;
    code: string;
  };
}

interface Modifier {
  id: string;
  name: string;
  code: string;
  description: string;
  modifierType: string;
  value: number;
  isActive: boolean;
}

interface MarketArea {
  id: string;
  name: string;
  description: string;
  priceMultiplier: number;
  isActive: boolean;
}

interface ServiceLine {
  id: string;
  name: string;
  code: string;
  description: string;
  displayOrder: number;
  isActive: boolean;
  serviceTypes: ServiceType[];
}

interface Package {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  priceBook: {
    id: string;
    name: string;
    isDefault: boolean;
  };
  serviceTypes: ServiceType[];
}

export interface PricingData {
  serviceTypes: ServiceType[];
  modifiers: Modifier[];
  marketAreas: MarketArea[];
  updatedAt: string;
}

export function useApi() {
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const isOffline = ref(!navigator.onLine);

  // Track online/offline status
  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => { isOffline.value = false; });
    window.addEventListener('offline', () => { isOffline.value = true; });
  }

  async function fetchJson<T>(endpoint: string): Promise<T | null> {
    if (isOffline.value) {
      error.value = 'You are offline. Using cached data.';
      return null;
    }

    isLoading.value = true;
    error.value = null;

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data as T;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error';
      console.error(`[API] Error fetching ${endpoint}:`, err);
      return null;
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchPricing(): Promise<PricingData | null> {
    return fetchJson<PricingData>('/api/public/pricing');
  }

  async function fetchServiceLines(): Promise<ServiceLine[] | null> {
    return fetchJson<ServiceLine[]>('/api/public/service-lines');
  }

  async function fetchPackages(): Promise<Package[] | null> {
    return fetchJson<Package[]>('/api/public/packages');
  }

  async function checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Authenticated API request helper
   * Automatically includes JWT token if available
   */
  async function authFetch<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{ data: T | null; error: string | null }> {
    if (isOffline.value) {
      return { data: null, error: 'You are offline' };
    }

    isLoading.value = true;
    error.value = null;

    try {
      const authStore = useAuthStore();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...authStore.getAuthHeader(),
        ...((options.headers as Record<string, string>) || {}),
      };

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.error || `Error: ${response.status}`;
        error.value = errorMessage;
        return { data: null, error: errorMessage };
      }

      return { data: data as T, error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Network error';
      error.value = message;
      return { data: null, error: message };
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * GET request with auth
   */
  async function get<T>(endpoint: string): Promise<{ data: T | null; error: string | null }> {
    return authFetch<T>(endpoint, { method: 'GET' });
  }

  /**
   * POST request with auth
   */
  async function post<T>(endpoint: string, body: unknown): Promise<{ data: T | null; error: string | null }> {
    return authFetch<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  /**
   * PUT request with auth
   */
  async function put<T>(endpoint: string, body: unknown): Promise<{ data: T | null; error: string | null }> {
    return authFetch<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  /**
   * DELETE request with auth
   */
  async function del<T>(endpoint: string): Promise<{ data: T | null; error: string | null }> {
    return authFetch<T>(endpoint, { method: 'DELETE' });
  }

  return {
    isLoading,
    error,
    isOffline,
    // Public endpoints
    fetchPricing,
    fetchServiceLines,
    fetchPackages,
    checkHealth,
    // Authenticated endpoints
    authFetch,
    get,
    post,
    put,
    del,
    // Constants
    API_BASE_URL,
  };
}
