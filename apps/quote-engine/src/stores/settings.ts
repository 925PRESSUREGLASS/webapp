import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import { LocalStorage } from 'quasar';

/**
 * Settings store
 * Manages application settings and preferences
 */
export const useSettingsStore = defineStore('settings', () => {
  // Business settings
  const businessName = ref('925 Pressure Glass');
  const businessABN = ref('');
  const businessPhone = ref('');
  const businessEmail = ref('');
  const businessAddress = ref('');

  // Default pricing
  const defaultHourlyRate = ref(60);
  const defaultPressureRate = ref(80);
  const defaultMinimumJob = ref(80);
  const defaultBaseFee = ref(0);

  // Invoice settings
  const invoicePrefix = ref('INV-');
  const nextInvoiceNumber = ref(1001);
  const paymentTermsDays = ref(7);
  const bankName = ref('');
  const accountName = ref('');
  const bsb = ref('');
  const accountNumber = ref('');

  // UI preferences
  const theme = ref<'dark' | 'light' | 'auto'>('auto');
  const primaryColor = ref('#7c3aed');
  const compactMode = ref(false);

  // Storage key
  const STORAGE_KEY = 'tictacstick_settings_v2';

  // Load settings from storage
  function loadSettings() {
    const stored = LocalStorage.getItem<Record<string, unknown>>(STORAGE_KEY);
    if (stored) {
      businessName.value = (stored.businessName as string) || businessName.value;
      businessABN.value = (stored.businessABN as string) || businessABN.value;
      businessPhone.value = (stored.businessPhone as string) || businessPhone.value;
      businessEmail.value = (stored.businessEmail as string) || businessEmail.value;
      businessAddress.value = (stored.businessAddress as string) || businessAddress.value;
      defaultHourlyRate.value = (stored.defaultHourlyRate as number) || defaultHourlyRate.value;
      defaultPressureRate.value = (stored.defaultPressureRate as number) || defaultPressureRate.value;
      defaultMinimumJob.value = (stored.defaultMinimumJob as number) || defaultMinimumJob.value;
      defaultBaseFee.value = (stored.defaultBaseFee as number) || defaultBaseFee.value;
      invoicePrefix.value = (stored.invoicePrefix as string) || invoicePrefix.value;
      nextInvoiceNumber.value = (stored.nextInvoiceNumber as number) || nextInvoiceNumber.value;
      paymentTermsDays.value = (stored.paymentTermsDays as number) || paymentTermsDays.value;
      bankName.value = (stored.bankName as string) || bankName.value;
      accountName.value = (stored.accountName as string) || accountName.value;
      bsb.value = (stored.bsb as string) || bsb.value;
      accountNumber.value = (stored.accountNumber as string) || accountNumber.value;
      theme.value = (stored.theme as 'dark' | 'light' | 'auto') || theme.value;
      primaryColor.value = (stored.primaryColor as string) || primaryColor.value;
      compactMode.value = (stored.compactMode as boolean) ?? compactMode.value;
    }
  }

  // Save settings to storage
  function saveSettings() {
    LocalStorage.set(STORAGE_KEY, {
      businessName: businessName.value,
      businessABN: businessABN.value,
      businessPhone: businessPhone.value,
      businessEmail: businessEmail.value,
      businessAddress: businessAddress.value,
      defaultHourlyRate: defaultHourlyRate.value,
      defaultPressureRate: defaultPressureRate.value,
      defaultMinimumJob: defaultMinimumJob.value,
      defaultBaseFee: defaultBaseFee.value,
      invoicePrefix: invoicePrefix.value,
      nextInvoiceNumber: nextInvoiceNumber.value,
      paymentTermsDays: paymentTermsDays.value,
      bankName: bankName.value,
      accountName: accountName.value,
      bsb: bsb.value,
      accountNumber: accountNumber.value,
      theme: theme.value,
      primaryColor: primaryColor.value,
      compactMode: compactMode.value,
    });
  }

  // Get next invoice number and increment
  function getNextInvoiceNumber(): string {
    const num = nextInvoiceNumber.value;
    nextInvoiceNumber.value++;
    saveSettings();
    return `${invoicePrefix.value}${num}`;
  }

  // Auto-save on changes
  watch(
    [
      businessName, businessABN, businessPhone, businessEmail, businessAddress,
      defaultHourlyRate, defaultPressureRate, defaultMinimumJob, defaultBaseFee,
      invoicePrefix, nextInvoiceNumber, paymentTermsDays,
      bankName, accountName, bsb, accountNumber,
      theme, primaryColor, compactMode,
    ],
    () => {
      saveSettings();
    },
    { deep: true }
  );

  // Initialize
  loadSettings();

  return {
    // Business
    businessName,
    businessABN,
    businessPhone,
    businessEmail,
    businessAddress,
    
    // Pricing defaults
    defaultHourlyRate,
    defaultPressureRate,
    defaultMinimumJob,
    defaultBaseFee,
    
    // Invoice
    invoicePrefix,
    nextInvoiceNumber,
    paymentTermsDays,
    bankName,
    accountName,
    bsb,
    accountNumber,
    
    // UI
    theme,
    primaryColor,
    compactMode,
    
    // Actions
    loadSettings,
    saveSettings,
    getNextInvoiceNumber,
  };
});
