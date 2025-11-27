import { ref, watch } from 'vue';
import { LocalStorage, SessionStorage } from 'quasar';

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
