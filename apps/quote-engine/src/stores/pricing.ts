import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { LocalStorage } from 'quasar';
import { useApi, type PricingData } from '../composables/useApi';

const CACHE_KEY = 'tictacstick_pricing_cache';
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

interface CachedPricing {
  data: PricingData;
  cachedAt: number;
}

/**
 * Pricing store
 * Fetches and caches pricing data from meta-api
 */
export const usePricingStore = defineStore('pricing', () => {
  const api = useApi();

  // State
  const serviceTypes = ref<PricingData['serviceTypes']>([]);
  const modifiers = ref<PricingData['modifiers']>([]);
  const marketAreas = ref<PricingData['marketAreas']>([]);
  const lastUpdated = ref<string | null>(null);
  const isLoaded = ref(false);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Computed maps for quick lookup
  const serviceTypeById = computed(() => {
    const map = new Map<string, PricingData['serviceTypes'][0]>();
    serviceTypes.value.forEach(st => map.set(st.id, st));
    return map;
  });

  const serviceTypeByCode = computed(() => {
    const map = new Map<string, PricingData['serviceTypes'][0]>();
    serviceTypes.value.forEach(st => map.set(st.code, st));
    return map;
  });

  const modifierByCode = computed(() => {
    const map = new Map<string, PricingData['modifiers'][0]>();
    modifiers.value.forEach(m => map.set(m.code, m));
    return map;
  });

  // Load from cache
  function loadFromCache(): boolean {
    const cached = LocalStorage.getItem<CachedPricing>(CACHE_KEY);
    if (!cached) return false;

    const age = Date.now() - cached.cachedAt;
    if (age > CACHE_TTL_MS) {
      console.log('[Pricing] Cache expired, will fetch fresh data');
      return false;
    }

    serviceTypes.value = cached.data.serviceTypes;
    modifiers.value = cached.data.modifiers;
    marketAreas.value = cached.data.marketAreas;
    lastUpdated.value = cached.data.updatedAt;
    isLoaded.value = true;
    console.log('[Pricing] Loaded from cache');
    return true;
  }

  // Save to cache
  function saveToCache(data: PricingData) {
    LocalStorage.set(CACHE_KEY, {
      data,
      cachedAt: Date.now(),
    });
  }

  // Fetch from API
  async function fetchPricing(force = false): Promise<boolean> {
    // If already loaded and not forcing, skip
    if (isLoaded.value && !force) {
      return true;
    }

    // Try cache first (unless forcing refresh)
    if (!force && loadFromCache()) {
      return true;
    }

    isLoading.value = true;
    error.value = null;

    try {
      const data = await api.fetchPricing();
      
      if (!data) {
        // API failed - try cache as fallback
        if (loadFromCache()) {
          error.value = 'Using cached data (API unavailable)';
          return true;
        }
        throw new Error('Failed to fetch pricing data and no cache available');
      }

      serviceTypes.value = data.serviceTypes;
      modifiers.value = data.modifiers;
      marketAreas.value = data.marketAreas;
      lastUpdated.value = data.updatedAt;
      isLoaded.value = true;

      // Cache the fresh data
      saveToCache(data);
      console.log('[Pricing] Fetched and cached from API');
      
      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error';
      console.error('[Pricing] Error:', err);
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  // Get window type info from service types
  function getWindowTypeInfo(code: string) {
    const st = serviceTypeByCode.value.get(code);
    if (!st) return null;
    return {
      basePrice: st.basePrice,
      baseTimeMinutes: st.baseTimeMinutes,
      sqftPrice: st.sqftPrice,
      sqftTimeMinutes: st.sqftTimeMinutes,
    };
  }

  // Get modifier info
  function getModifierValue(code: string): number {
    const mod = modifierByCode.value.get(code);
    return mod ? mod.value : 0;
  }

  // Get market area multiplier
  function getMarketAreaMultiplier(areaId: string): number {
    const area = marketAreas.value.find(a => a.id === areaId);
    return area ? area.priceMultiplier : 1.0;
  }

  // Clear cache
  function clearCache() {
    LocalStorage.remove(CACHE_KEY);
    isLoaded.value = false;
  }

  return {
    // State
    serviceTypes,
    modifiers,
    marketAreas,
    lastUpdated,
    isLoaded,
    isLoading,
    error,
    
    // Computed
    serviceTypeById,
    serviceTypeByCode,
    modifierByCode,
    
    // Actions
    fetchPricing,
    loadFromCache,
    clearCache,
    getWindowTypeInfo,
    getModifierValue,
    getMarketAreaMultiplier,
  };
});
