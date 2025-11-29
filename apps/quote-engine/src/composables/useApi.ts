import { ref } from 'vue';

/**
 * API client composable for meta-api communication
 * Handles fetching pricing data from the backend API
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

  return {
    isLoading,
    error,
    isOffline,
    fetchPricing,
    fetchServiceLines,
    fetchPackages,
    checkHealth,
    API_BASE_URL,
  };
}
