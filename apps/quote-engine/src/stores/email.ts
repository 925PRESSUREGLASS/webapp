import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

const STORAGE_KEY = 'email-settings';

export interface EmailSettings {
  apiUrl: string;
  apiKey: string;
  defaultQuoteSubject: string;
  defaultQuoteBody: string;
  defaultInvoiceSubject: string;
  defaultInvoiceBody: string;
  senderName: string;
  replyTo: string;
}

const defaultSettings: EmailSettings = {
  apiUrl: '',
  apiKey: '',
  defaultQuoteSubject: 'Your Quote from 925 Pressure Glass',
  defaultQuoteBody: 'Thank you for your interest in our services. Please find your quote attached.\n\nIf you have any questions, please don\'t hesitate to contact us.\n\nBest regards,\n925 Pressure Glass',
  defaultInvoiceSubject: 'Invoice from 925 Pressure Glass',
  defaultInvoiceBody: 'Thank you for your business. Please find your invoice attached.\n\nPayment is due within 14 days.\n\nBest regards,\n925 Pressure Glass',
  senderName: '925 Pressure Glass',
  replyTo: '',
};

export const useEmailStore = defineStore('email', () => {
  // State
  const settings = ref<EmailSettings>(loadSettings());

  // Getters
  const isConfigured = computed(() => {
    return settings.value.apiUrl.length > 0;
  });

  const apiUrl = computed(() => settings.value.apiUrl);
  const apiKey = computed(() => settings.value.apiKey);
  const defaultQuoteSubject = computed(() => settings.value.defaultQuoteSubject);
  const defaultQuoteBody = computed(() => settings.value.defaultQuoteBody);
  const defaultInvoiceSubject = computed(() => settings.value.defaultInvoiceSubject);
  const defaultInvoiceBody = computed(() => settings.value.defaultInvoiceBody);
  const senderName = computed(() => settings.value.senderName);
  const replyTo = computed(() => settings.value.replyTo);

  // Actions
  function loadSettings(): EmailSettings {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...defaultSettings, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Failed to load email settings:', error);
    }
    return { ...defaultSettings };
  }

  function saveSettings(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings.value));
    } catch (error) {
      console.error('Failed to save email settings:', error);
    }
  }

  function updateSettings(updates: Partial<EmailSettings>): void {
    settings.value = { ...settings.value, ...updates };
    saveSettings();
  }

  function resetSettings(): void {
    settings.value = { ...defaultSettings };
    saveSettings();
  }

  function setApiUrl(url: string): void {
    settings.value.apiUrl = url;
    saveSettings();
  }

  function setApiKey(key: string): void {
    settings.value.apiKey = key;
    saveSettings();
  }

  function initialize(): void {
    settings.value = loadSettings();
  }

  return {
    // State
    settings,

    // Getters
    isConfigured,
    apiUrl,
    apiKey,
    defaultQuoteSubject,
    defaultQuoteBody,
    defaultInvoiceSubject,
    defaultInvoiceBody,
    senderName,
    replyTo,

    // Actions
    updateSettings,
    resetSettings,
    setApiUrl,
    setApiKey,
    initialize,
  };
});
