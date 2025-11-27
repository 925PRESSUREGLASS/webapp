import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useQuoteStorage, type SavedQuote } from '../composables/useStorage';

/**
 * Store for managing saved quotes list
 */
export const useSavedQuotesStore = defineStore('savedQuotes', () => {
  const storage = useQuoteStorage();
  
  // State
  const quotes = ref<SavedQuote[]>([]);
  const isLoading = ref(false);
  const searchQuery = ref('');
  const statusFilter = ref<SavedQuote['status'] | 'all'>('all');
  const sortBy = ref<'date' | 'client' | 'total'>('date');
  const sortDirection = ref<'asc' | 'desc'>('desc');

  // Filtered and sorted quotes
  const filteredQuotes = computed(() => {
    let result = [...quotes.value];

    // Apply search filter
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase();
      result = result.filter(q => 
        q.title.toLowerCase().includes(query) ||
        q.clientName.toLowerCase().includes(query) ||
        q.clientLocation.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter.value !== 'all') {
      result = result.filter(q => q.status === statusFilter.value);
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy.value) {
        case 'date':
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
        case 'client':
          comparison = a.clientName.localeCompare(b.clientName);
          break;
        case 'total':
          comparison = a.total - b.total;
          break;
      }
      return sortDirection.value === 'desc' ? -comparison : comparison;
    });

    return result;
  });

  // Statistics
  const stats = computed(() => {
    const total = quotes.value.length;
    const draft = quotes.value.filter(q => q.status === 'draft').length;
    const sent = quotes.value.filter(q => q.status === 'sent').length;
    const accepted = quotes.value.filter(q => q.status === 'accepted').length;
    const declined = quotes.value.filter(q => q.status === 'declined').length;
    const totalValue = quotes.value.reduce((sum, q) => sum + q.total, 0);
    const acceptedValue = quotes.value
      .filter(q => q.status === 'accepted')
      .reduce((sum, q) => sum + q.total, 0);

    return {
      total,
      draft,
      sent,
      accepted,
      declined,
      totalValue,
      acceptedValue,
    };
  });

  // Actions
  async function loadQuotes() {
    isLoading.value = true;
    try {
      quotes.value = await storage.loadAllQuotes();
    } finally {
      isLoading.value = false;
    }
  }

  async function saveQuote(quote: SavedQuote): Promise<boolean> {
    isLoading.value = true;
    try {
      const success = await storage.saveQuote(quote);
      if (success) {
        // Update local state
        const index = quotes.value.findIndex(q => q.id === quote.id);
        if (index >= 0) {
          quotes.value[index] = { ...quote, updatedAt: new Date().toISOString() };
        } else {
          quotes.value.unshift(quote);
        }
      }
      return success;
    } finally {
      isLoading.value = false;
    }
  }

  async function deleteQuote(id: string): Promise<boolean> {
    isLoading.value = true;
    try {
      const success = await storage.deleteQuote(id);
      if (success) {
        quotes.value = quotes.value.filter(q => q.id !== id);
      }
      return success;
    } finally {
      isLoading.value = false;
    }
  }

  async function duplicateQuote(id: string): Promise<SavedQuote | null> {
    const original = quotes.value.find(q => q.id === id);
    if (!original) return null;

    const duplicate: SavedQuote = {
      ...original,
      id: storage.generateId(),
      title: `${original.title} (Copy)`,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const success = await saveQuote(duplicate);
    return success ? duplicate : null;
  }

  async function updateQuoteStatus(id: string, status: SavedQuote['status']): Promise<boolean> {
    const quote = quotes.value.find(q => q.id === id);
    if (!quote) return false;

    const updated = { ...quote, status };
    return saveQuote(updated);
  }

  function setSearchQuery(query: string) {
    searchQuery.value = query;
  }

  function setStatusFilter(status: SavedQuote['status'] | 'all') {
    statusFilter.value = status;
  }

  function setSort(by: 'date' | 'client' | 'total', direction?: 'asc' | 'desc') {
    if (sortBy.value === by && !direction) {
      // Toggle direction if same sort field
      sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
    } else {
      sortBy.value = by;
      sortDirection.value = direction || 'desc';
    }
  }

  async function clearAll(): Promise<void> {
    for (const quote of quotes.value) {
      await storage.deleteQuote(quote.id);
    }
    quotes.value = [];
  }

  return {
    // State
    quotes,
    isLoading,
    searchQuery,
    statusFilter,
    sortBy,
    sortDirection,

    // Computed
    filteredQuotes,
    stats,

    // Actions
    loadQuotes,
    saveQuote,
    deleteQuote,
    duplicateQuote,
    updateQuoteStatus,
    setSearchQuery,
    setStatusFilter,
    setSort,
    clearAll,
  };
});
