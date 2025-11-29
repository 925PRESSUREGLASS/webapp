import { ref } from 'vue';

/**
 * Admin API client for authenticated CRUD operations
 * Requires API key for modifying pricing data
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://meta-api-78ow.onrender.com';
const API_KEY = import.meta.env.VITE_API_KEY || '';

export interface ServiceTypeInput {
  name: string;
  code: string;
  description?: string;
  basePrice: number;
  baseTimeMinutes: number;
  sqftPrice?: number | null;
  sqftTimeMinutes?: number | null;
  unit?: string;
  isActive?: boolean;
  serviceLineId: string;
}

export interface ModifierInput {
  name: string;
  code: string;
  description?: string;
  modifierType: string;
  value: number;
  isActive?: boolean;
}

export interface MarketAreaInput {
  name: string;
  description?: string;
  priceMultiplier: number;
  isActive?: boolean;
}

export interface ServiceType extends ServiceTypeInput {
  id: string;
  serviceLine: {
    id: string;
    name: string;
    code: string;
  };
}

export interface Modifier extends ModifierInput {
  id: string;
}

export interface MarketArea extends MarketAreaInput {
  id: string;
}

export interface ServiceLine {
  id: string;
  name: string;
  code: string;
  description: string;
  displayOrder: number;
  isActive: boolean;
}

export function useAdminApi() {
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  function getHeaders(): HeadersInit {
    var headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (API_KEY) {
      headers['x-api-key'] = API_KEY;
    }
    return headers;
  }

  async function request<T>(
    method: string,
    endpoint: string,
    body?: unknown
  ): Promise<{ data: T | null; error: string | null }> {
    isLoading.value = true;
    error.value = null;

    try {
      var options: RequestInit = {
        method: method,
        headers: getHeaders(),
      };
      
      if (body) {
        options.body = JSON.stringify(body);
      }

      var response = await fetch(API_BASE_URL + endpoint, options);

      if (!response.ok) {
        var errorData = await response.json().catch(function() { return {}; });
        var errorMsg = errorData.message || errorData.error || response.status + ' ' + response.statusText;
        throw new Error(errorMsg);
      }

      var data = await response.json();
      return { data: data as T, error: null };
    } catch (err) {
      var msg = err instanceof Error ? err.message : 'Unknown error';
      error.value = msg;
      console.error('[AdminAPI] Error:', method, endpoint, err);
      return { data: null, error: msg };
    } finally {
      isLoading.value = false;
    }
  }

  // ============ Service Types ============
  async function getServiceTypes(): Promise<{ data: ServiceType[] | null; error: string | null }> {
    return request<ServiceType[]>('GET', '/service-types');
  }

  async function createServiceType(input: ServiceTypeInput): Promise<{ data: ServiceType | null; error: string | null }> {
    return request<ServiceType>('POST', '/service-types', input);
  }

  async function updateServiceType(id: string, input: Partial<ServiceTypeInput>): Promise<{ data: ServiceType | null; error: string | null }> {
    return request<ServiceType>('PUT', '/service-types/' + id, input);
  }

  async function deleteServiceType(id: string): Promise<{ data: unknown | null; error: string | null }> {
    return request<unknown>('DELETE', '/service-types/' + id);
  }

  // ============ Modifiers ============
  async function getModifiers(): Promise<{ data: Modifier[] | null; error: string | null }> {
    return request<Modifier[]>('GET', '/modifiers');
  }

  async function createModifier(input: ModifierInput): Promise<{ data: Modifier | null; error: string | null }> {
    return request<Modifier>('POST', '/modifiers', input);
  }

  async function updateModifier(id: string, input: Partial<ModifierInput>): Promise<{ data: Modifier | null; error: string | null }> {
    return request<Modifier>('PUT', '/modifiers/' + id, input);
  }

  async function deleteModifier(id: string): Promise<{ data: unknown | null; error: string | null }> {
    return request<unknown>('DELETE', '/modifiers/' + id);
  }

  // ============ Market Areas ============
  async function getMarketAreas(): Promise<{ data: MarketArea[] | null; error: string | null }> {
    return request<MarketArea[]>('GET', '/market-areas');
  }

  async function createMarketArea(input: MarketAreaInput): Promise<{ data: MarketArea | null; error: string | null }> {
    return request<MarketArea>('POST', '/market-areas', input);
  }

  async function updateMarketArea(id: string, input: Partial<MarketAreaInput>): Promise<{ data: MarketArea | null; error: string | null }> {
    return request<MarketArea>('PUT', '/market-areas/' + id, input);
  }

  async function deleteMarketArea(id: string): Promise<{ data: unknown | null; error: string | null }> {
    return request<unknown>('DELETE', '/market-areas/' + id);
  }

  // ============ Service Lines (read-only for now) ============
  async function getServiceLines(): Promise<{ data: ServiceLine[] | null; error: string | null }> {
    return request<ServiceLine[]>('GET', '/api/public/service-lines');
  }

  // Check if API key is configured
  function hasApiKey(): boolean {
    return !!API_KEY;
  }

  return {
    isLoading,
    error,
    hasApiKey,
    // Service Types
    getServiceTypes,
    createServiceType,
    updateServiceType,
    deleteServiceType,
    // Modifiers
    getModifiers,
    createModifier,
    updateModifier,
    deleteModifier,
    // Market Areas
    getMarketAreas,
    createMarketArea,
    updateMarketArea,
    deleteMarketArea,
    // Service Lines
    getServiceLines,
  };
}
