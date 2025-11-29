import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { LocalStorage } from 'quasar';

/**
 * Auth store
 * Manages JWT authentication state and user profile
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://meta-api-78ow.onrender.com';
const STORAGE_KEY = 'tictacstick_auth';

interface User {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  organizationId: string | null;
  organization: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

interface AuthState {
  token: string | null;
  user: User | null;
  expiresAt: number | null;
}

interface LoginResponse {
  token: string;
  user: User;
  expiresIn: number;
}

interface RegisterPayload {
  email: string;
  password: string;
  name?: string;
  phone?: string;
  organizationName?: string;
}

interface LoginPayload {
  email: string;
  password: string;
}

export const useAuthStore = defineStore('auth', () => {
  // State
  const token = ref<string | null>(null);
  const user = ref<User | null>(null);
  const expiresAt = ref<number | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Computed
  const isAuthenticated = computed(() => {
    if (!token.value || !expiresAt.value) return false;
    // Check if token is expired (with 5 min buffer)
    return Date.now() < expiresAt.value - 5 * 60 * 1000;
  });

  const userName = computed(() => user.value?.name || user.value?.email || 'User');
  const userEmail = computed(() => user.value?.email || '');
  const organizationName = computed(() => user.value?.organization?.name || null);

  // Load auth state from storage
  function loadAuth() {
    const stored = LocalStorage.getItem<AuthState>(STORAGE_KEY);
    if (stored) {
      token.value = stored.token;
      user.value = stored.user;
      expiresAt.value = stored.expiresAt;
      
      // Auto-refresh if token is about to expire
      if (isAuthenticated.value) {
        scheduleRefresh();
      } else if (token.value) {
        // Token expired, clear it
        logout();
      }
    }
  }

  // Save auth state to storage
  function saveAuth() {
    LocalStorage.set(STORAGE_KEY, {
      token: token.value,
      user: user.value,
      expiresAt: expiresAt.value,
    });
  }

  // Clear auth state
  function clearAuth() {
    token.value = null;
    user.value = null;
    expiresAt.value = null;
    LocalStorage.remove(STORAGE_KEY);
  }

  // Schedule token refresh
  let refreshTimeout: ReturnType<typeof setTimeout> | null = null;
  
  function scheduleRefresh() {
    if (refreshTimeout) {
      clearTimeout(refreshTimeout);
    }
    
    if (!expiresAt.value) return;
    
    // Refresh 10 minutes before expiry
    const refreshIn = expiresAt.value - Date.now() - 10 * 60 * 1000;
    
    if (refreshIn > 0) {
      refreshTimeout = setTimeout(async () => {
        await refreshToken();
      }, refreshIn);
    }
  }

  // API helper
  async function authFetch<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{ data: T | null; error: string | null }> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...((options.headers as Record<string, string>) || {}),
      };

      if (token.value) {
        headers['Authorization'] = `Bearer ${token.value}`;
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return { data: null, error: data.error || `Error: ${response.status}` };
      }

      return { data: data as T, error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Network error';
      return { data: null, error: message };
    }
  }

  // Register new user
  async function register(payload: RegisterPayload): Promise<boolean> {
    isLoading.value = true;
    error.value = null;

    const { data, error: err } = await authFetch<LoginResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    isLoading.value = false;

    if (err || !data) {
      error.value = err || 'Registration failed';
      return false;
    }

    // Set auth state
    token.value = data.token;
    user.value = data.user;
    expiresAt.value = Date.now() + data.expiresIn * 1000;
    
    saveAuth();
    scheduleRefresh();

    return true;
  }

  // Login
  async function login(payload: LoginPayload): Promise<boolean> {
    isLoading.value = true;
    error.value = null;

    const { data, error: err } = await authFetch<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    isLoading.value = false;

    if (err || !data) {
      error.value = err || 'Login failed';
      return false;
    }

    // Set auth state
    token.value = data.token;
    user.value = data.user;
    expiresAt.value = Date.now() + data.expiresIn * 1000;
    
    saveAuth();
    scheduleRefresh();

    return true;
  }

  // Logout
  function logout() {
    if (refreshTimeout) {
      clearTimeout(refreshTimeout);
      refreshTimeout = null;
    }
    clearAuth();
  }

  // Refresh token
  async function refreshToken(): Promise<boolean> {
    if (!token.value) return false;

    const { data, error: err } = await authFetch<LoginResponse>('/auth/refresh', {
      method: 'POST',
    });

    if (err || !data) {
      // Token refresh failed, log out
      logout();
      return false;
    }

    token.value = data.token;
    user.value = data.user;
    expiresAt.value = Date.now() + data.expiresIn * 1000;
    
    saveAuth();
    scheduleRefresh();

    return true;
  }

  // Get current user profile
  async function fetchProfile(): Promise<boolean> {
    if (!token.value) return false;

    isLoading.value = true;
    const { data, error: err } = await authFetch<User>('/auth/me', {
      method: 'GET',
    });
    isLoading.value = false;

    if (err || !data) {
      error.value = err || 'Failed to fetch profile';
      return false;
    }

    user.value = data;
    saveAuth();

    return true;
  }

  // Update profile
  async function updateProfile(updates: { name?: string; phone?: string }): Promise<boolean> {
    if (!token.value) return false;

    isLoading.value = true;
    error.value = null;

    const { data, error: err } = await authFetch<{ user: User }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });

    isLoading.value = false;

    if (err || !data) {
      error.value = err || 'Failed to update profile';
      return false;
    }

    user.value = data.user;
    saveAuth();

    return true;
  }

  // Change password
  async function changePassword(currentPassword: string, newPassword: string): Promise<boolean> {
    if (!token.value) return false;

    isLoading.value = true;
    error.value = null;

    const { data, error: err } = await authFetch<{ message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    isLoading.value = false;

    if (err || !data) {
      error.value = err || 'Failed to change password';
      return false;
    }

    return true;
  }

  // Get auth header for other API calls
  function getAuthHeader(): Record<string, string> {
    if (!token.value || !isAuthenticated.value) {
      return {};
    }
    return { Authorization: `Bearer ${token.value}` };
  }

  // Initialize
  loadAuth();

  return {
    // State
    token,
    user,
    isLoading,
    error,
    
    // Computed
    isAuthenticated,
    userName,
    userEmail,
    organizationName,
    
    // Actions
    register,
    login,
    logout,
    refreshToken,
    fetchProfile,
    updateProfile,
    changePassword,
    getAuthHeader,
    loadAuth,
  };
});
