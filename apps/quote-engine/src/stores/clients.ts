import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { LocalStorage } from 'quasar';

/**
 * Client data structure
 */
export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  address: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Client statistics from quotes
 */
export interface ClientStats {
  quoteCount: number;
  totalRevenue: number;
  averageQuote: number;
  acceptedCount: number;
  lastQuoteDate: string | null;
}

const STORAGE_KEY = 'tictacstick_v2_clients';

/**
 * Clients store - manages client database
 */
export const useClientsStore = defineStore('clients', () => {
  // State
  const clients = ref<Client[]>([]);
  const isLoading = ref(false);
  const searchQuery = ref('');
  const sortBy = ref<'name' | 'date' | 'recent'>('name');

  // Load clients from localStorage
  function loadClients(): void {
    isLoading.value = true;
    try {
      const stored = LocalStorage.getItem<Client[]>(STORAGE_KEY);
      clients.value = stored || [];
    } catch (e) {
      console.error('[Clients] Failed to load:', e);
      clients.value = [];
    } finally {
      isLoading.value = false;
    }
  }

  // Save clients to localStorage
  function saveClients(): boolean {
    try {
      LocalStorage.set(STORAGE_KEY, clients.value);
      return true;
    } catch (e) {
      console.error('[Clients] Failed to save:', e);
      return false;
    }
  }

  // Filtered and sorted clients
  const filteredClients = computed(() => {
    let result = [...clients.value];

    // Apply search filter
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase();
      result = result.filter(c =>
        c.name.toLowerCase().includes(query) ||
        c.email.toLowerCase().includes(query) ||
        c.phone.includes(query) ||
        c.location.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy.value) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'date':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'recent':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        default:
          return 0;
      }
    });

    return result;
  });

  // Client count
  const clientCount = computed(() => clients.value.length);

  // Generate unique ID
  function generateId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  // Add or update client
  function saveClient(clientData: Partial<Client>): Client | null {
    // Validate name
    if (!clientData.name?.trim()) {
      console.error('[Clients] Name is required');
      return null;
    }

    const now = new Date().toISOString();
    const isNew = !clientData.id;

    const client: Client = {
      id: clientData.id || generateId(),
      name: clientData.name.trim(),
      email: clientData.email?.trim() || '',
      phone: clientData.phone?.trim() || '',
      location: clientData.location?.trim() || '',
      address: clientData.address?.trim() || '',
      notes: clientData.notes?.trim() || '',
      createdAt: clientData.createdAt || now,
      updatedAt: now,
    };

    if (isNew) {
      clients.value.push(client);
    } else {
      const index = clients.value.findIndex(c => c.id === client.id);
      if (index >= 0) {
        clients.value[index] = client;
      } else {
        clients.value.push(client);
      }
    }

    saveClients();
    return client;
  }

  // Delete client
  function deleteClient(id: string): boolean {
    const index = clients.value.findIndex(c => c.id === id);
    if (index === -1) return false;

    clients.value.splice(index, 1);
    saveClients();
    return true;
  }

  // Get client by ID
  function getClient(id: string): Client | null {
    return clients.value.find(c => c.id === id) || null;
  }

  // Get client by name (case-insensitive)
  function getClientByName(name: string): Client | null {
    if (!name) return null;
    const searchName = name.toLowerCase().trim();
    return clients.value.find(c => c.name.toLowerCase() === searchName) || null;
  }

  // Search clients
  function search(query: string): Client[] {
    if (!query?.trim()) return [...clients.value];

    const searchQuery = query.toLowerCase().trim();
    return clients.value.filter(c =>
      c.name.toLowerCase().includes(searchQuery) ||
      c.email.toLowerCase().includes(searchQuery) ||
      c.phone.includes(searchQuery) ||
      c.location.toLowerCase().includes(searchQuery)
    );
  }

  // Get autocomplete suggestions
  function getAutocompleteSuggestions(query: string, limit = 10): Client[] {
    if (!query?.trim()) return [];
    
    const results = search(query);
    return results.slice(0, limit);
  }

  // Set search query
  function setSearchQuery(query: string): void {
    searchQuery.value = query;
  }

  // Set sort order
  function setSort(by: 'name' | 'date' | 'recent'): void {
    sortBy.value = by;
  }

  // Export clients as JSON
  function exportClients(): string {
    return JSON.stringify({
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      clients: clients.value,
    }, null, 2);
  }

  // Import clients from JSON
  function importClients(jsonString: string): { success: boolean; imported: number; errors: string[] } {
    const errors: string[] = [];
    let imported = 0;

    try {
      const data = JSON.parse(jsonString);
      const importList = Array.isArray(data) ? data : data.clients;

      if (!Array.isArray(importList)) {
        return { success: false, imported: 0, errors: ['Invalid format: expected array of clients'] };
      }

      for (const item of importList) {
        if (!item.name?.trim()) {
          errors.push(`Skipped client without name`);
          continue;
        }

        // Check for duplicate
        const existing = getClientByName(item.name);
        if (existing) {
          // Update existing
          saveClient({ ...existing, ...item, id: existing.id });
        } else {
          // Add new
          saveClient({
            ...item,
            id: undefined, // Generate new ID
          });
        }
        imported++;
      }

      return { success: true, imported, errors };
    } catch (e) {
      return { success: false, imported: 0, errors: ['Failed to parse JSON: ' + String(e)] };
    }
  }

  // Import from CSV
  function importFromCSV(csvText: string): { success: boolean; imported: number; errors: string[] } {
    const errors: string[] = [];
    let imported = 0;

    try {
      const lines = csvText.split(/\r?\n/).filter(line => line.trim());
      if (lines.length < 2) {
        return { success: false, imported: 0, errors: ['CSV must have header row and at least one data row'] };
      }

      // Parse header
      const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());
      
      // Map columns
      const nameIndex = headers.findIndex(h => ['name', 'client', 'client name', 'customer'].includes(h));
      const emailIndex = headers.findIndex(h => ['email', 'e-mail', 'email address'].includes(h));
      const phoneIndex = headers.findIndex(h => ['phone', 'telephone', 'mobile', 'cell'].includes(h));
      const locationIndex = headers.findIndex(h => ['location', 'city', 'suburb', 'area'].includes(h));
      const addressIndex = headers.findIndex(h => ['address', 'full address', 'street'].includes(h));
      const notesIndex = headers.findIndex(h => ['notes', 'comments', 'description'].includes(h));

      if (nameIndex === -1) {
        return { success: false, imported: 0, errors: ['CSV must have a "name" or "client" column'] };
      }

      // Parse data rows
      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        const name = values[nameIndex]?.trim();

        if (!name) {
          errors.push(`Row ${i + 1}: Skipped - no name`);
          continue;
        }

        const clientData: Partial<Client> = {
          name,
          email: emailIndex >= 0 ? values[emailIndex]?.trim() || '' : '',
          phone: phoneIndex >= 0 ? values[phoneIndex]?.trim() || '' : '',
          location: locationIndex >= 0 ? values[locationIndex]?.trim() || '' : '',
          address: addressIndex >= 0 ? values[addressIndex]?.trim() || '' : '',
          notes: notesIndex >= 0 ? values[notesIndex]?.trim() || '' : '',
        };

        // Check for duplicate
        const existing = getClientByName(name);
        if (existing) {
          saveClient({ ...existing, ...clientData, id: existing.id });
        } else {
          saveClient(clientData);
        }
        imported++;
      }

      return { success: true, imported, errors };
    } catch (e) {
      return { success: false, imported: 0, errors: ['Failed to parse CSV: ' + String(e)] };
    }
  }

  // Parse CSV line (handles quoted values)
  function parseCSVLine(line: string): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    values.push(current.trim());
    return values;
  }

  // Initialize
  loadClients();

  return {
    // State
    clients,
    isLoading,
    searchQuery,
    sortBy,

    // Computed
    filteredClients,
    clientCount,

    // Actions
    loadClients,
    saveClient,
    deleteClient,
    getClient,
    getClientByName,
    search,
    getAutocompleteSuggestions,
    setSearchQuery,
    setSort,
    exportClients,
    importClients,
    importFromCSV,
  };
});
