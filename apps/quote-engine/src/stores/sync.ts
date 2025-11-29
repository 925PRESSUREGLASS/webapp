/**
 * Sync Store
 * Manages data synchronization between local storage and cloud API
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useAuthStore } from './auth';
import { useApi } from '../composables/useApi';

// Sync status types
type SyncStatus = 'idle' | 'syncing' | 'error' | 'success';
type EntityType = 'quotes' | 'jobs' | 'clients' | 'invoices';

interface SyncState {
  status: SyncStatus;
  lastSyncedAt: string | null;
  pendingChanges: number;
  error: string | null;
}

interface SyncQueueItem {
  id: string;
  entityType: EntityType;
  entityId: string;
  action: 'create' | 'update' | 'delete';
  data: any;
  createdAt: string;
  attempts: number;
}

export const useSyncStore = defineStore('sync', () => {
  const authStore = useAuthStore();
  const api = useApi();

  // State
  const status = ref<SyncStatus>('idle');
  const lastSyncedAt = ref<string | null>(localStorage.getItem('lastSyncedAt'));
  const error = ref<string | null>(null);
  const syncQueue = ref<SyncQueueItem[]>([]);
  const isSyncing = ref(false);

  // Entity-specific sync states
  const entityStates = ref<Record<EntityType, SyncState>>({
    quotes: { status: 'idle', lastSyncedAt: null, pendingChanges: 0, error: null },
    jobs: { status: 'idle', lastSyncedAt: null, pendingChanges: 0, error: null },
    clients: { status: 'idle', lastSyncedAt: null, pendingChanges: 0, error: null },
    invoices: { status: 'idle', lastSyncedAt: null, pendingChanges: 0, error: null },
  });

  // Computed
  const isAuthenticated = computed(() => authStore.isAuthenticated);
  const pendingChanges = computed(() => syncQueue.value.length);
  const canSync = computed(() => isAuthenticated.value && !isSyncing.value);

  // Load sync queue from localStorage
  function loadSyncQueue() {
    try {
      const stored = localStorage.getItem('syncQueue');
      if (stored) {
        syncQueue.value = JSON.parse(stored);
      }
    } catch (err) {
      console.error('[SYNC] Failed to load sync queue:', err);
      syncQueue.value = [];
    }
  }

  // Save sync queue to localStorage
  function saveSyncQueue() {
    try {
      localStorage.setItem('syncQueue', JSON.stringify(syncQueue.value));
    } catch (err) {
      console.error('[SYNC] Failed to save sync queue:', err);
    }
  }

  // Add item to sync queue (for offline changes)
  function queueChange(entityType: EntityType, entityId: string, action: 'create' | 'update' | 'delete', data: any) {
    // Check if there's already a pending change for this entity
    const existingIndex = syncQueue.value.findIndex(
      item => item.entityType === entityType && item.entityId === entityId
    );

    const newItem: SyncQueueItem = {
      id: `${entityType}-${entityId}-${Date.now()}`,
      entityType,
      entityId,
      action,
      data,
      createdAt: new Date().toISOString(),
      attempts: 0,
    };

    if (existingIndex >= 0) {
      // If deleting, just replace with delete action
      if (action === 'delete') {
        syncQueue.value[existingIndex] = newItem;
      } else if (syncQueue.value[existingIndex].action === 'create') {
        // If original was create and new is update, keep as create with new data
        syncQueue.value[existingIndex].data = data;
      } else {
        // Otherwise, replace with new action
        syncQueue.value[existingIndex] = newItem;
      }
    } else {
      syncQueue.value.push(newItem);
    }

    entityStates.value[entityType].pendingChanges = syncQueue.value.filter(
      item => item.entityType === entityType
    ).length;

    saveSyncQueue();

    // Try to sync if online and authenticated
    if (navigator.onLine && isAuthenticated.value) {
      processQueue();
    }
  }

  // Process sync queue (push pending changes to cloud)
  async function processQueue() {
    if (isSyncing.value || syncQueue.value.length === 0) return;
    if (!isAuthenticated.value) {
      console.log('[SYNC] Not authenticated, skipping queue processing');
      return;
    }

    isSyncing.value = true;
    status.value = 'syncing';

    const processedIds: string[] = [];

    for (const item of syncQueue.value) {
      try {
        if (item.action === 'delete') {
          await api.del(`/sync/${item.entityType}/${item.entityId}`);
        } else {
          await api.post(`/sync/${item.entityType}`, item.data);
        }
        processedIds.push(item.id);
      } catch (err: any) {
        console.error(`[SYNC] Failed to sync ${item.entityType}/${item.entityId}:`, err);
        item.attempts++;

        if (item.attempts >= 3) {
          // Mark as failed, will be retried on next full sync
          entityStates.value[item.entityType].error = err.message || 'Sync failed';
        }
      }
    }

    // Remove successfully processed items
    syncQueue.value = syncQueue.value.filter(item => !processedIds.includes(item.id));
    saveSyncQueue();

    // Update entity states
    for (const entityType of ['quotes', 'jobs', 'clients', 'invoices'] as EntityType[]) {
      entityStates.value[entityType].pendingChanges = syncQueue.value.filter(
        item => item.entityType === entityType
      ).length;
    }

    isSyncing.value = false;
    status.value = syncQueue.value.length > 0 ? 'error' : 'success';

    if (syncQueue.value.length === 0) {
      lastSyncedAt.value = new Date().toISOString();
      localStorage.setItem('lastSyncedAt', lastSyncedAt.value);
    }
  }

  // Pull data from cloud (initial sync or refresh)
  async function pullFromCloud() {
    if (!isAuthenticated.value) {
      throw new Error('Must be authenticated to sync');
    }

    isSyncing.value = true;
    status.value = 'syncing';
    error.value = null;

    try {
      const response = await api.get('/sync/all');
      
      // Store cloud data in localStorage for offline access
      if (response.quotes) {
        localStorage.setItem('cloudQuotes', JSON.stringify(response.quotes));
        entityStates.value.quotes.lastSyncedAt = new Date().toISOString();
        entityStates.value.quotes.status = 'success';
      }

      if (response.jobs) {
        localStorage.setItem('cloudJobs', JSON.stringify(response.jobs));
        entityStates.value.jobs.lastSyncedAt = new Date().toISOString();
        entityStates.value.jobs.status = 'success';
      }

      if (response.clients) {
        localStorage.setItem('cloudClients', JSON.stringify(response.clients));
        entityStates.value.clients.lastSyncedAt = new Date().toISOString();
        entityStates.value.clients.status = 'success';
      }

      if (response.invoices) {
        localStorage.setItem('cloudInvoices', JSON.stringify(response.invoices));
        entityStates.value.invoices.lastSyncedAt = new Date().toISOString();
        entityStates.value.invoices.status = 'success';
      }

      lastSyncedAt.value = response.syncedAt || new Date().toISOString();
      localStorage.setItem('lastSyncedAt', lastSyncedAt.value);
      status.value = 'success';

      return response;
    } catch (err: any) {
      error.value = err.message || 'Failed to sync from cloud';
      status.value = 'error';
      throw err;
    } finally {
      isSyncing.value = false;
    }
  }

  // Push all local data to cloud (bulk sync)
  async function pushToCloud(data: {
    quotes?: any[];
    jobs?: any[];
    clients?: any[];
    invoices?: any[];
  }) {
    if (!isAuthenticated.value) {
      throw new Error('Must be authenticated to sync');
    }

    isSyncing.value = true;
    status.value = 'syncing';
    error.value = null;

    try {
      const response = await api.post('/sync/bulk', data);

      // Update sync timestamps for successful entities
      const now = new Date().toISOString();
      
      if (response.quotes?.synced > 0) {
        entityStates.value.quotes.lastSyncedAt = now;
        entityStates.value.quotes.status = 'success';
      }
      if (response.jobs?.synced > 0) {
        entityStates.value.jobs.lastSyncedAt = now;
        entityStates.value.jobs.status = 'success';
      }
      if (response.clients?.synced > 0) {
        entityStates.value.clients.lastSyncedAt = now;
        entityStates.value.clients.status = 'success';
      }
      if (response.invoices?.synced > 0) {
        entityStates.value.invoices.lastSyncedAt = now;
        entityStates.value.invoices.status = 'success';
      }

      // Check for errors
      const allErrors = [
        ...(response.quotes?.errors || []),
        ...(response.jobs?.errors || []),
        ...(response.clients?.errors || []),
        ...(response.invoices?.errors || []),
      ];

      if (allErrors.length > 0) {
        error.value = allErrors.join('; ');
        status.value = 'error';
      } else {
        lastSyncedAt.value = now;
        localStorage.setItem('lastSyncedAt', lastSyncedAt.value);
        status.value = 'success';
      }

      return response;
    } catch (err: any) {
      error.value = err.message || 'Failed to sync to cloud';
      status.value = 'error';
      throw err;
    } finally {
      isSyncing.value = false;
    }
  }

  // Full sync: push pending changes, then pull latest
  async function fullSync() {
    if (!canSync.value) {
      throw new Error('Cannot sync: not authenticated or already syncing');
    }

    // First, process any pending queue items
    if (syncQueue.value.length > 0) {
      await processQueue();
    }

    // Then pull latest from cloud
    return pullFromCloud();
  }

  // Get cloud data for an entity type
  function getCloudData(entityType: EntityType): any[] {
    try {
      const key = `cloud${entityType.charAt(0).toUpperCase() + entityType.slice(1)}`;
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  // Clear all synced data (on logout)
  function clearSyncData() {
    syncQueue.value = [];
    lastSyncedAt.value = null;
    error.value = null;
    status.value = 'idle';

    // Clear cloud data caches
    localStorage.removeItem('cloudQuotes');
    localStorage.removeItem('cloudJobs');
    localStorage.removeItem('cloudClients');
    localStorage.removeItem('cloudInvoices');
    localStorage.removeItem('syncQueue');
    localStorage.removeItem('lastSyncedAt');

    // Reset entity states
    for (const entityType of ['quotes', 'jobs', 'clients', 'invoices'] as EntityType[]) {
      entityStates.value[entityType] = {
        status: 'idle',
        lastSyncedAt: null,
        pendingChanges: 0,
        error: null,
      };
    }
  }

  // Initialize: load queue and listen for online/offline events
  function init() {
    loadSyncQueue();

    // Auto-sync when coming back online
    window.addEventListener('online', () => {
      console.log('[SYNC] Back online, processing queue...');
      if (isAuthenticated.value && syncQueue.value.length > 0) {
        processQueue();
      }
    });

    // Periodic sync check (every 5 minutes)
    setInterval(() => {
      if (navigator.onLine && isAuthenticated.value && syncQueue.value.length > 0) {
        processQueue();
      }
    }, 5 * 60 * 1000);
  }

  return {
    // State
    status,
    lastSyncedAt,
    error,
    syncQueue,
    isSyncing,
    entityStates,

    // Computed
    isAuthenticated,
    pendingChanges,
    canSync,

    // Actions
    queueChange,
    processQueue,
    pullFromCloud,
    pushToCloud,
    fullSync,
    getCloudData,
    clearSyncData,
    init,
  };
});
