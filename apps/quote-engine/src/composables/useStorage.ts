import { ref, watch, toRaw } from 'vue';
import { LocalStorage, SessionStorage } from 'quasar';
import type { WindowLine, PressureLine, PricingConfig } from '@tictacstick/calculation-engine';

/**
 * Composable for local storage operations with sync capabilities
 * Provides typed access to local storage with automatic serialization
 */
export function useStorage<T>(key: string, defaultValue: T) {
  const data = ref<T>(defaultValue) as ReturnType<typeof ref<T>>;
  const isLoaded = ref(false);
  const error = ref<Error | null>(null);

  // Load from storage
  function load(): T {
    try {
      const stored = LocalStorage.getItem<T>(key);
      if (stored !== null) {
        data.value = stored;
      }
      isLoaded.value = true;
      error.value = null;
      return data.value;
    } catch (e) {
      error.value = e instanceof Error ? e : new Error(String(e));
      console.error(`[useStorage] Error loading ${key}:`, e);
      return defaultValue;
    }
  }

  // Save to storage
  function save(value?: T): boolean {
    try {
      const valueToSave = value !== undefined ? value : data.value;
      LocalStorage.set(key, valueToSave);
      if (value !== undefined) {
        data.value = value;
      }
      error.value = null;
      return true;
    } catch (e) {
      error.value = e instanceof Error ? e : new Error(String(e));
      console.error(`[useStorage] Error saving ${key}:`, e);
      return false;
    }
  }

  // Remove from storage
  function remove(): boolean {
    try {
      LocalStorage.remove(key);
      data.value = defaultValue;
      error.value = null;
      return true;
    } catch (e) {
      error.value = e instanceof Error ? e : new Error(String(e));
      console.error(`[useStorage] Error removing ${key}:`, e);
      return false;
    }
  }

  // Check if key exists
  function has(): boolean {
    return LocalStorage.has(key);
  }

  // Auto-save on data change
  watch(data, () => {
    save();
  }, { deep: true });

  // Initial load
  load();

  return {
    data,
    isLoaded,
    error,
    load,
    save,
    remove,
    has,
  };
}

/**
 * Session storage variant (clears when browser closes)
 */
export function useSessionStorage<T>(key: string, defaultValue: T) {
  const data = ref<T>(defaultValue) as ReturnType<typeof ref<T>>;
  const isLoaded = ref(false);
  const error = ref<Error | null>(null);

  function load(): T {
    try {
      const stored = SessionStorage.getItem<T>(key);
      if (stored !== null) {
        data.value = stored;
      }
      isLoaded.value = true;
      error.value = null;
      return data.value;
    } catch (e) {
      error.value = e instanceof Error ? e : new Error(String(e));
      return defaultValue;
    }
  }

  function save(value?: T): boolean {
    try {
      const valueToSave = value !== undefined ? value : data.value;
      SessionStorage.set(key, valueToSave);
      if (value !== undefined) {
        data.value = value;
      }
      error.value = null;
      return true;
    } catch (e) {
      error.value = e instanceof Error ? e : new Error(String(e));
      return false;
    }
  }

  function remove(): boolean {
    try {
      SessionStorage.remove(key);
      data.value = defaultValue;
      error.value = null;
      return true;
    } catch (e) {
      error.value = e instanceof Error ? e : new Error(String(e));
      return false;
    }
  }

  function has(): boolean {
    return SessionStorage.has(key);
  }

  watch(data, () => {
    save();
  }, { deep: true });

  load();

  return {
    data,
    isLoaded,
    error,
    load,
    save,
    remove,
    has,
  };
}

// ============================================================================
// Quote-specific storage types and functions
// ============================================================================

// Storage keys
const STORAGE_PREFIX = 'tictacstick_v2_';
const AUTOSAVE_KEY = `${STORAGE_PREFIX}autosave`;
const QUOTES_STORE = 'quotes';
const PRESETS_STORE = 'presets';

// Types
export interface SavedQuote {
  id: string;
  title: string;
  clientName: string;
  clientLocation: string;
  clientEmail: string;
  clientPhone: string;
  jobType: 'residential' | 'commercial';
  windowLines: WindowLine[];
  pressureLines: PressureLine[];
  pricingConfig: PricingConfig;
  subtotal: number;
  gst: number;
  total: number;
  estimatedMinutes: number;
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'sent' | 'accepted' | 'declined';
}

export interface QuotePreset {
  id: string;
  name: string;
  description: string;
  type: 'window' | 'pressure';
  config: Partial<WindowLine> | Partial<PressureLine>;
  createdAt: string;
}

export interface AutosaveData {
  clientName: string;
  clientLocation: string;
  clientEmail: string;
  clientPhone: string;
  quoteTitle: string;
  jobType: 'residential' | 'commercial';
  windowLines: WindowLine[];
  pressureLines: PressureLine[];
  pricingConfig: PricingConfig;
  savedAt: string;
}

// IndexedDB setup
const DB_NAME = 'TicTacStickDB';
const DB_VERSION = 1;

let dbInstance: IDBDatabase | null = null;

/**
 * Initialize IndexedDB
 */
async function initDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('[Storage] IndexedDB error:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Quotes store
      if (!db.objectStoreNames.contains(QUOTES_STORE)) {
        const quotesStore = db.createObjectStore(QUOTES_STORE, { keyPath: 'id' });
        quotesStore.createIndex('clientName', 'clientName', { unique: false });
        quotesStore.createIndex('createdAt', 'createdAt', { unique: false });
        quotesStore.createIndex('status', 'status', { unique: false });
      }

      // Presets store
      if (!db.objectStoreNames.contains(PRESETS_STORE)) {
        const presetsStore = db.createObjectStore(PRESETS_STORE, { keyPath: 'id' });
        presetsStore.createIndex('type', 'type', { unique: false });
        presetsStore.createIndex('name', 'name', { unique: false });
      }
    };
  });
}

/**
 * Composable for quote-specific storage operations
 * Uses IndexedDB for quotes/presets, localStorage for autosave
 */
export function useQuoteStorage() {
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // --- Autosave (localStorage for quick access) ---

  function saveAutosave(data: AutosaveData): boolean {
    try {
      const payload = {
        ...toRaw(data),
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(payload));
      return true;
    } catch (e) {
      console.error('[Storage] Autosave failed:', e);
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        error.value = 'Storage full! Please export and delete old data.';
      }
      return false;
    }
  }

  function loadAutosave(): AutosaveData | null {
    try {
      const raw = localStorage.getItem(AUTOSAVE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as AutosaveData;
    } catch (e) {
      console.error('[Storage] Load autosave failed:', e);
      return null;
    }
  }

  function clearAutosave(): void {
    try {
      localStorage.removeItem(AUTOSAVE_KEY);
    } catch (e) {
      console.error('[Storage] Clear autosave failed:', e);
    }
  }

  // --- Saved Quotes (IndexedDB) ---

  async function saveQuote(quote: SavedQuote): Promise<boolean> {
    isLoading.value = true;
    error.value = null;

    try {
      const db = await initDB();
      return new Promise((resolve) => {
        const transaction = db.transaction([QUOTES_STORE], 'readwrite');
        const store = transaction.objectStore(QUOTES_STORE);

        const data = {
          ...toRaw(quote),
          updatedAt: new Date().toISOString(),
        };

        const request = store.put(data);

        request.onsuccess = () => {
          isLoading.value = false;
          resolve(true);
        };

        request.onerror = () => {
          console.error('[Storage] Save quote failed:', request.error);
          error.value = 'Failed to save quote';
          isLoading.value = false;
          resolve(false);
        };
      });
    } catch (e) {
      console.error('[Storage] Save quote error:', e);
      error.value = 'Storage unavailable';
      isLoading.value = false;
      return false;
    }
  }

  async function loadQuote(id: string): Promise<SavedQuote | null> {
    isLoading.value = true;
    error.value = null;

    try {
      const db = await initDB();
      return new Promise((resolve) => {
        const transaction = db.transaction([QUOTES_STORE], 'readonly');
        const store = transaction.objectStore(QUOTES_STORE);
        const request = store.get(id);

        request.onsuccess = () => {
          isLoading.value = false;
          resolve(request.result || null);
        };

        request.onerror = () => {
          console.error('[Storage] Load quote failed:', request.error);
          error.value = 'Failed to load quote';
          isLoading.value = false;
          resolve(null);
        };
      });
    } catch (e) {
      console.error('[Storage] Load quote error:', e);
      error.value = 'Storage unavailable';
      isLoading.value = false;
      return null;
    }
  }

  async function loadAllQuotes(): Promise<SavedQuote[]> {
    isLoading.value = true;
    error.value = null;

    try {
      const db = await initDB();
      return new Promise((resolve) => {
        const transaction = db.transaction([QUOTES_STORE], 'readonly');
        const store = transaction.objectStore(QUOTES_STORE);
        const request = store.getAll();

        request.onsuccess = () => {
          isLoading.value = false;
          // Sort by updatedAt descending
          const quotes = (request.result || []).sort((a: SavedQuote, b: SavedQuote) => 
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
          resolve(quotes);
        };

        request.onerror = () => {
          console.error('[Storage] Load all quotes failed:', request.error);
          error.value = 'Failed to load quotes';
          isLoading.value = false;
          resolve([]);
        };
      });
    } catch (e) {
      console.error('[Storage] Load all quotes error:', e);
      error.value = 'Storage unavailable';
      isLoading.value = false;
      return [];
    }
  }

  async function deleteQuote(id: string): Promise<boolean> {
    isLoading.value = true;
    error.value = null;

    try {
      const db = await initDB();
      return new Promise((resolve) => {
        const transaction = db.transaction([QUOTES_STORE], 'readwrite');
        const store = transaction.objectStore(QUOTES_STORE);
        const request = store.delete(id);

        request.onsuccess = () => {
          isLoading.value = false;
          resolve(true);
        };

        request.onerror = () => {
          console.error('[Storage] Delete quote failed:', request.error);
          error.value = 'Failed to delete quote';
          isLoading.value = false;
          resolve(false);
        };
      });
    } catch (e) {
      console.error('[Storage] Delete quote error:', e);
      error.value = 'Storage unavailable';
      isLoading.value = false;
      return false;
    }
  }

  // --- Presets (IndexedDB) ---

  async function savePreset(preset: QuotePreset): Promise<boolean> {
    isLoading.value = true;
    error.value = null;

    try {
      const db = await initDB();
      return new Promise((resolve) => {
        const transaction = db.transaction([PRESETS_STORE], 'readwrite');
        const store = transaction.objectStore(PRESETS_STORE);
        const request = store.put(toRaw(preset));

        request.onsuccess = () => {
          isLoading.value = false;
          resolve(true);
        };

        request.onerror = () => {
          console.error('[Storage] Save preset failed:', request.error);
          error.value = 'Failed to save preset';
          isLoading.value = false;
          resolve(false);
        };
      });
    } catch (e) {
      console.error('[Storage] Save preset error:', e);
      error.value = 'Storage unavailable';
      isLoading.value = false;
      return false;
    }
  }

  async function loadAllPresets(): Promise<QuotePreset[]> {
    isLoading.value = true;
    error.value = null;

    try {
      const db = await initDB();
      return new Promise((resolve) => {
        const transaction = db.transaction([PRESETS_STORE], 'readonly');
        const store = transaction.objectStore(PRESETS_STORE);
        const request = store.getAll();

        request.onsuccess = () => {
          isLoading.value = false;
          resolve(request.result || []);
        };

        request.onerror = () => {
          console.error('[Storage] Load presets failed:', request.error);
          error.value = 'Failed to load presets';
          isLoading.value = false;
          resolve([]);
        };
      });
    } catch (e) {
      console.error('[Storage] Load presets error:', e);
      error.value = 'Storage unavailable';
      isLoading.value = false;
      return [];
    }
  }

  async function deletePreset(id: string): Promise<boolean> {
    isLoading.value = true;
    error.value = null;

    try {
      const db = await initDB();
      return new Promise((resolve) => {
        const transaction = db.transaction([PRESETS_STORE], 'readwrite');
        const store = transaction.objectStore(PRESETS_STORE);
        const request = store.delete(id);

        request.onsuccess = () => {
          isLoading.value = false;
          resolve(true);
        };

        request.onerror = () => {
          console.error('[Storage] Delete preset failed:', request.error);
          error.value = 'Failed to delete preset';
          isLoading.value = false;
          resolve(false);
        };
      });
    } catch (e) {
      console.error('[Storage] Delete preset error:', e);
      error.value = 'Storage unavailable';
      isLoading.value = false;
      return false;
    }
  }

  // --- Export/Import ---

  async function exportAllData(): Promise<string> {
    const quotes = await loadAllQuotes();
    const presets = await loadAllPresets();
    const autosave = loadAutosave();

    const exportData = {
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      quotes,
      presets,
      autosave,
    };

    return JSON.stringify(exportData, null, 2);
  }

  async function importData(jsonString: string): Promise<{ success: boolean; imported: { quotes: number; presets: number } }> {
    try {
      const data = JSON.parse(jsonString);

      let quotesImported = 0;
      let presetsImported = 0;

      // Import quotes
      if (Array.isArray(data.quotes)) {
        for (const quote of data.quotes) {
          if (await saveQuote(quote)) {
            quotesImported++;
          }
        }
      }

      // Import presets
      if (Array.isArray(data.presets)) {
        for (const preset of data.presets) {
          if (await savePreset(preset)) {
            presetsImported++;
          }
        }
      }

      return {
        success: true,
        imported: { quotes: quotesImported, presets: presetsImported },
      };
    } catch (e) {
      console.error('[Storage] Import failed:', e);
      return {
        success: false,
        imported: { quotes: 0, presets: 0 },
      };
    }
  }

  // --- Utilities ---

  function generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  async function getStorageStats(): Promise<{ quotesCount: number; presetsCount: number; estimatedSize: string }> {
    const quotes = await loadAllQuotes();
    const presets = await loadAllPresets();

    // Estimate size
    const dataString = JSON.stringify({ quotes, presets });
    const bytes = new Blob([dataString]).size;
    const kb = bytes / 1024;
    const mb = kb / 1024;

    return {
      quotesCount: quotes.length,
      presetsCount: presets.length,
      estimatedSize: mb >= 1 ? `${mb.toFixed(2)} MB` : `${kb.toFixed(2)} KB`,
    };
  }

  return {
    // State
    isLoading,
    error,

    // Autosave
    saveAutosave,
    loadAutosave,
    clearAutosave,

    // Quotes
    saveQuote,
    loadQuote,
    loadAllQuotes,
    deleteQuote,

    // Presets
    savePreset,
    loadAllPresets,
    deletePreset,

    // Export/Import
    exportAllData,
    importData,

    // Utilities
    generateId,
    getStorageStats,
  };
}
