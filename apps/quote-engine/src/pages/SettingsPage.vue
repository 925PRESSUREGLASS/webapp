<template>
  <q-page class="settings-page q-pa-md">
    <!-- Header -->
    <div class="row items-center q-mb-lg">
      <div class="col">
        <h4 class="q-mb-xs">Settings</h4>
        <p class="text-grey-6">Configure your business and application preferences</p>
      </div>
      <div class="col-auto">
        <q-btn color="primary" icon="save" label="Save All" @click="saveAll" />
      </div>
    </div>

    <!-- Settings Tabs -->
    <q-tabs v-model="activeTab" class="text-primary q-mb-md" align="left" narrow-indicator>
      <q-tab name="business" icon="business" label="Business" />
      <q-tab name="pricing" icon="attach_money" label="Pricing" />
      <q-tab name="invoice" icon="receipt" label="Invoice" />
      <q-tab name="appearance" icon="palette" label="Appearance" />
      <q-tab name="data" icon="storage" label="Data" />
    </q-tabs>

    <q-tab-panels v-model="activeTab" animated class="bg-transparent">
      <!-- Business Settings -->
      <q-tab-panel name="business">
        <q-card>
          <q-card-section>
            <div class="text-h6 q-mb-md">Business Information</div>

            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-6">
                <q-input
                  v-model="settings.businessName"
                  label="Business Name"
                  outlined
                  hint="Appears on quotes and invoices"
                />
              </div>
              <div class="col-12 col-md-6">
                <q-input
                  v-model="settings.businessABN"
                  label="ABN"
                  outlined
                  mask="## ### ### ###"
                  hint="Australian Business Number"
                />
              </div>
              <div class="col-12 col-md-6">
                <q-input
                  v-model="settings.businessPhone"
                  label="Phone"
                  outlined
                  type="tel"
                />
              </div>
              <div class="col-12 col-md-6">
                <q-input
                  v-model="settings.businessEmail"
                  label="Email"
                  outlined
                  type="email"
                />
              </div>
              <div class="col-12">
                <q-input
                  v-model="settings.businessAddress"
                  label="Address"
                  outlined
                  type="textarea"
                  rows="2"
                />
              </div>
            </div>
          </q-card-section>
        </q-card>
      </q-tab-panel>

      <!-- Pricing Settings -->
      <q-tab-panel name="pricing">
        <q-card>
          <q-card-section>
            <div class="text-h6 q-mb-md">Default Pricing</div>

            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-6">
                <q-input
                  v-model.number="settings.defaultHourlyRate"
                  label="Hourly Rate (Window Cleaning)"
                  outlined
                  type="number"
                  prefix="$"
                  suffix="/hr"
                  hint="Default hourly rate for window cleaning"
                />
              </div>
              <div class="col-12 col-md-6">
                <q-input
                  v-model.number="settings.defaultPressureRate"
                  label="Hourly Rate (Pressure Cleaning)"
                  outlined
                  type="number"
                  prefix="$"
                  suffix="/hr"
                  hint="Default hourly rate for pressure cleaning"
                />
              </div>
              <div class="col-12 col-md-6">
                <q-input
                  v-model.number="settings.defaultMinimumJob"
                  label="Minimum Job Charge"
                  outlined
                  type="number"
                  prefix="$"
                  hint="Minimum charge for any job"
                />
              </div>
              <div class="col-12 col-md-6">
                <q-input
                  v-model.number="settings.defaultBaseFee"
                  label="Base Callout Fee"
                  outlined
                  type="number"
                  prefix="$"
                  hint="Fixed fee added to every job"
                />
              </div>
            </div>
          </q-card-section>
        </q-card>
      </q-tab-panel>

      <!-- Invoice Settings -->
      <q-tab-panel name="invoice">
        <q-card class="q-mb-md">
          <q-card-section>
            <div class="text-h6 q-mb-md">Invoice Settings</div>

            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-6">
                <q-input
                  v-model="settings.invoicePrefix"
                  label="Invoice Number Prefix"
                  outlined
                  hint="e.g., INV-, TTS-"
                />
              </div>
              <div class="col-12 col-md-6">
                <q-input
                  v-model.number="settings.nextInvoiceNumber"
                  label="Next Invoice Number"
                  outlined
                  type="number"
                  hint="The next invoice will use this number"
                />
              </div>
              <div class="col-12 col-md-6">
                <q-input
                  v-model.number="settings.paymentTermsDays"
                  label="Payment Terms (Days)"
                  outlined
                  type="number"
                  suffix="days"
                  hint="Default due date is invoice date + this many days"
                />
              </div>
            </div>
          </q-card-section>
        </q-card>

        <q-card>
          <q-card-section>
            <div class="text-h6 q-mb-md">Bank Details (for Invoices)</div>

            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-6">
                <q-input
                  v-model="settings.bankName"
                  label="Bank Name"
                  outlined
                />
              </div>
              <div class="col-12 col-md-6">
                <q-input
                  v-model="settings.accountName"
                  label="Account Name"
                  outlined
                />
              </div>
              <div class="col-12 col-md-6">
                <q-input
                  v-model="settings.bsb"
                  label="BSB"
                  outlined
                  mask="###-###"
                />
              </div>
              <div class="col-12 col-md-6">
                <q-input
                  v-model="settings.accountNumber"
                  label="Account Number"
                  outlined
                />
              </div>
            </div>
          </q-card-section>
        </q-card>
      </q-tab-panel>

      <!-- Appearance Settings -->
      <q-tab-panel name="appearance">
        <q-card>
          <q-card-section>
            <div class="text-h6 q-mb-md">Theme & Appearance</div>

            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-6">
                <q-select
                  v-model="settings.theme"
                  :options="themeOptions"
                  label="Theme"
                  outlined
                  emit-value
                  map-options
                />
              </div>
              <div class="col-12 col-md-6">
                <q-input
                  v-model="settings.primaryColor"
                  label="Primary Color"
                  outlined
                >
                  <template #append>
                    <q-icon name="colorize" class="cursor-pointer">
                      <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                        <q-color v-model="settings.primaryColor" />
                      </q-popup-proxy>
                    </q-icon>
                  </template>
                </q-input>
              </div>
              <div class="col-12">
                <q-toggle
                  v-model="settings.compactMode"
                  label="Compact Mode"
                />
                <div class="text-caption text-grey-6">
                  Use smaller spacing and font sizes for more information density
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>

        <q-card class="q-mt-md">
          <q-card-section>
            <div class="text-h6 q-mb-md">Keyboard Shortcuts</div>
            <p class="text-grey-6 q-mb-md">
              Press <kbd>Shift</kbd> + <kbd>?</kbd> anywhere to see all shortcuts
            </p>

            <q-btn
              color="primary"
              outline
              icon="keyboard"
              label="View All Shortcuts"
              @click="showShortcuts = true"
            />
          </q-card-section>
        </q-card>
      </q-tab-panel>

      <!-- Data Settings -->
      <q-tab-panel name="data">
        <q-card class="q-mb-md">
          <q-card-section>
            <div class="text-h6 q-mb-md">Export Data</div>
            <p class="text-grey-6 q-mb-md">
              Download a backup of all your data including quotes, invoices, and clients.
            </p>

            <div class="row q-gutter-sm">
              <q-btn color="primary" icon="download" label="Export All Data" @click="exportAllData" />
              <q-btn color="secondary" outline icon="content_copy" label="Export Quotes Only" @click="exportQuotes" />
              <q-btn color="secondary" outline icon="receipt" label="Export Invoices Only" @click="exportInvoices" />
              <q-btn color="secondary" outline icon="people" label="Export Clients Only" @click="exportClients" />
            </div>
          </q-card-section>
        </q-card>

        <q-card class="q-mb-md">
          <q-card-section>
            <div class="text-h6 q-mb-md">Import Data</div>
            <p class="text-grey-6 q-mb-md">
              Restore data from a backup file. This will merge with existing data.
            </p>

            <q-file
              v-model="importFile"
              label="Select backup file"
              outlined
              accept=".json"
              @update:model-value="handleImport"
            >
              <template #prepend>
                <q-icon name="attach_file" />
              </template>
            </q-file>
          </q-card-section>
        </q-card>

        <q-card class="bg-negative text-white">
          <q-card-section>
            <div class="text-h6 q-mb-md">Danger Zone</div>
            <p class="q-mb-md">
              These actions are irreversible. Please export your data first.
            </p>

            <div class="row q-gutter-sm">
              <q-btn color="white" text-color="negative" icon="delete_forever" label="Clear All Quotes" @click="confirmClearQuotes" />
              <q-btn color="white" text-color="negative" icon="delete_forever" label="Clear All Invoices" @click="confirmClearInvoices" />
              <q-btn color="white" text-color="negative" icon="delete_forever" label="Clear All Data" @click="confirmClearAll" />
            </div>
          </q-card-section>
        </q-card>
      </q-tab-panel>
    </q-tab-panels>

    <!-- Keyboard Shortcuts Dialog -->
    <q-dialog v-model="showShortcuts">
      <q-card style="min-width: 400px; max-width: 600px;">
        <q-card-section class="row items-center">
          <div class="text-h6">Keyboard Shortcuts</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div v-for="(shortcuts, category) in shortcutsByCategory" :key="category" class="q-mb-md">
            <div class="text-subtitle2 text-grey-7 q-mb-sm text-capitalize">{{ category }}</div>
            <q-list dense>
              <q-item v-for="shortcut in shortcuts" :key="shortcut.id">
                <q-item-section>
                  <q-item-label>{{ shortcut.description }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <kbd class="shortcut-key">{{ formatShortcut(shortcut) }}</kbd>
                </q-item-section>
              </q-item>
            </q-list>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useQuasar } from 'quasar';
import { useSettingsStore } from '../stores/settings';
import { useSavedQuotesStore } from '../stores/savedQuotes';
import { useInvoiceStore } from '../stores/invoices';
import { useClientsStore } from '../stores/clients';
import { useKeyboardShortcuts } from '../composables/useKeyboardShortcuts';

const $q = useQuasar();
const settings = useSettingsStore();
const savedQuotes = useSavedQuotesStore();
const invoices = useInvoiceStore();
const clients = useClientsStore();
const { getShortcutsByCategory, formatShortcut } = useKeyboardShortcuts();

const activeTab = ref('business');
const showShortcuts = ref(false);
const importFile = ref<File | null>(null);

const themeOptions = [
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
  { label: 'System Default', value: 'auto' },
];

const shortcutsByCategory = computed(() => getShortcutsByCategory());

// Save all settings
function saveAll() {
  settings.saveSettings();
  $q.notify({
    type: 'positive',
    message: 'Settings saved',
    position: 'bottom',
  });
}

// Export all data
function exportAllData() {
  const data = {
    version: '2.0',
    exportedAt: new Date().toISOString(),
    settings: {
      businessName: settings.businessName,
      businessABN: settings.businessABN,
      businessPhone: settings.businessPhone,
      businessEmail: settings.businessEmail,
      businessAddress: settings.businessAddress,
      defaultHourlyRate: settings.defaultHourlyRate,
      defaultPressureRate: settings.defaultPressureRate,
      defaultMinimumJob: settings.defaultMinimumJob,
      defaultBaseFee: settings.defaultBaseFee,
      invoicePrefix: settings.invoicePrefix,
      nextInvoiceNumber: settings.nextInvoiceNumber,
      paymentTermsDays: settings.paymentTermsDays,
      bankName: settings.bankName,
      accountName: settings.accountName,
      bsb: settings.bsb,
      accountNumber: settings.accountNumber,
    },
    quotes: savedQuotes.quotes,
    invoices: invoices.invoices,
    clients: clients.clients,
  };

  downloadJson(data, `tictacstick-backup-${formatDate(new Date())}.json`);

  $q.notify({
    type: 'positive',
    message: 'All data exported',
    position: 'bottom',
  });
}

function exportQuotes() {
  const data = {
    version: '2.0',
    exportedAt: new Date().toISOString(),
    quotes: savedQuotes.quotes,
  };
  downloadJson(data, `tictacstick-quotes-${formatDate(new Date())}.json`);
}

function exportInvoices() {
  const data = {
    version: '2.0',
    exportedAt: new Date().toISOString(),
    invoices: invoices.invoices,
  };
  downloadJson(data, `tictacstick-invoices-${formatDate(new Date())}.json`);
}

function exportClients() {
  const data = {
    version: '2.0',
    exportedAt: new Date().toISOString(),
    clients: clients.clients,
  };
  downloadJson(data, `tictacstick-clients-${formatDate(new Date())}.json`);
}

function downloadJson(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Import data
async function handleImport(file: File | null) {
  if (!file) return;

  try {
    const text = await file.text();
    const data = JSON.parse(text);

    // Validate data
    if (!data.version) {
      throw new Error('Invalid backup file format');
    }

    // Confirm import
    $q.dialog({
      title: 'Import Data',
      message: `This will import data from the backup file. Existing data will be merged. Continue?`,
      cancel: true,
      persistent: true,
    }).onOk(() => {
      // Import quotes
      if (data.quotes && Array.isArray(data.quotes)) {
        for (const quote of data.quotes) {
          savedQuotes.saveQuote(quote);
        }
      }

      // Import invoices
      if (data.invoices && Array.isArray(data.invoices)) {
        for (const invoice of data.invoices) {
          invoices.saveInvoice(invoice);
        }
      }

      // Import clients
      if (data.clients && Array.isArray(data.clients)) {
        for (const client of data.clients) {
          clients.addClient(client);
        }
      }

      $q.notify({
        type: 'positive',
        message: 'Data imported successfully',
        position: 'bottom',
      });
    });
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Failed to import: ' + (error instanceof Error ? error.message : 'Unknown error'),
      position: 'bottom',
    });
  }

  importFile.value = null;
}

// Clear data
function confirmClearQuotes() {
  $q.dialog({
    title: 'Clear All Quotes',
    message: 'This will permanently delete all saved quotes. This cannot be undone. Are you sure?',
    cancel: true,
    persistent: true,
    color: 'negative',
  }).onOk(() => {
    savedQuotes.clearAll();
    $q.notify({
      type: 'warning',
      message: 'All quotes deleted',
      position: 'bottom',
    });
  });
}

function confirmClearInvoices() {
  $q.dialog({
    title: 'Clear All Invoices',
    message: 'This will permanently delete all invoices. This cannot be undone. Are you sure?',
    cancel: true,
    persistent: true,
    color: 'negative',
  }).onOk(() => {
    invoices.clearAll();
    $q.notify({
      type: 'warning',
      message: 'All invoices deleted',
      position: 'bottom',
    });
  });
}

function confirmClearAll() {
  $q.dialog({
    title: 'Clear ALL Data',
    message: 'This will permanently delete ALL data including quotes, invoices, and clients. This cannot be undone. Type "DELETE" to confirm.',
    prompt: {
      model: '',
      type: 'text',
    },
    cancel: true,
    persistent: true,
    color: 'negative',
  }).onOk((val: string) => {
    if (val === 'DELETE') {
      savedQuotes.clearAll();
      invoices.clearAll();
      clients.clearAll();
      $q.notify({
        type: 'warning',
        message: 'All data deleted',
        position: 'bottom',
      });
    } else {
      $q.notify({
        type: 'info',
        message: 'Deletion cancelled - confirmation text did not match',
        position: 'bottom',
      });
    }
  });
}
</script>

<style scoped>
.settings-page {
  max-width: 900px;
  margin: 0 auto;
}

kbd {
  background-color: #f5f5f5;
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 2px 6px;
  font-family: monospace;
  font-size: 0.9em;
}

.body--dark kbd {
  background-color: #333;
  border-color: #555;
}

.shortcut-key {
  min-width: 80px;
  text-align: center;
}
</style>
