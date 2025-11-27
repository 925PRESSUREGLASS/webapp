<template>
  <q-page class="q-pa-md">
    <div class="row justify-center">
      <div class="col-12 col-lg-10">
        <!-- Header -->
        <div class="row items-center q-mb-lg">
          <div class="col">
            <h4 class="q-my-none">Client Database</h4>
            <div class="text-grey">
              {{ clientsStore.clientCount }} clients
            </div>
          </div>
          <div class="col-auto q-gutter-sm">
            <q-btn
              outline
              color="primary"
              icon="upload"
              label="Import"
              @click="showImportDialog"
            />
            <q-btn
              outline
              color="primary"
              icon="download"
              label="Export"
              @click="exportClients"
            />
            <q-btn
              color="primary"
              icon="add"
              label="Add Client"
              @click="showAddDialog"
            />
          </div>
        </div>

        <!-- Search and Filter Bar -->
        <q-card class="q-mb-md">
          <q-card-section>
            <div class="row q-col-gutter-md items-center">
              <div class="col-12 col-sm-6 col-md-5">
                <q-input
                  v-model="searchQuery"
                  outlined
                  dense
                  placeholder="Search clients..."
                  clearable
                  @update:model-value="clientsStore.setSearchQuery"
                >
                  <template #prepend>
                    <q-icon name="search" />
                  </template>
                </q-input>
              </div>
              <div class="col-auto">
                <q-btn-toggle
                  v-model="sortBy"
                  toggle-color="primary"
                  :options="sortOptions"
                  size="sm"
                  rounded
                  unelevated
                  @update:model-value="clientsStore.setSort"
                />
              </div>
            </div>
          </q-card-section>
        </q-card>

        <!-- Loading State -->
        <div v-if="clientsStore.isLoading" class="text-center q-pa-xl">
          <q-spinner size="lg" color="primary" />
          <div class="q-mt-md text-grey">Loading clients...</div>
        </div>

        <!-- Empty State -->
        <q-card v-else-if="clientsStore.filteredClients.length === 0" class="q-pa-xl text-center">
          <q-icon name="people" size="64px" color="grey" />
          <div class="text-h6 q-mt-md">No clients found</div>
          <div class="text-grey q-mb-md">
            {{ searchQuery 
              ? 'Try adjusting your search' 
              : 'Add your first client to get started' }}
          </div>
          <q-btn
            v-if="!searchQuery"
            color="primary"
            icon="add"
            label="Add Client"
            @click="showAddDialog"
          />
        </q-card>

        <!-- Clients Grid -->
        <div v-else class="row q-col-gutter-md">
          <div
            v-for="client in clientsStore.filteredClients"
            :key="client.id"
            class="col-12 col-sm-6 col-md-4"
          >
            <q-card class="client-card cursor-pointer" @click="showEditDialog(client)">
              <q-card-section>
                <div class="row items-start justify-between">
                  <div class="col">
                    <div class="text-h6 text-weight-medium">
                      {{ client.name }}
                    </div>
                    <div v-if="client.location" class="text-grey text-body2">
                      <q-icon name="location_on" size="xs" class="q-mr-xs" />
                      {{ client.location }}
                    </div>
                  </div>
                  <div class="col-auto">
                    <q-btn
                      flat
                      round
                      dense
                      icon="more_vert"
                      @click.stop
                    >
                      <q-menu>
                        <q-list style="min-width: 150px">
                          <q-item clickable v-close-popup @click="showEditDialog(client)">
                            <q-item-section avatar>
                              <q-icon name="edit" />
                            </q-item-section>
                            <q-item-section>Edit</q-item-section>
                          </q-item>
                          <q-item clickable v-close-popup @click="useClient(client)">
                            <q-item-section avatar>
                              <q-icon name="check" />
                            </q-item-section>
                            <q-item-section>Use in Quote</q-item-section>
                          </q-item>
                          <q-separator />
                          <q-item clickable v-close-popup @click="confirmDelete(client)">
                            <q-item-section avatar>
                              <q-icon name="delete" color="negative" />
                            </q-item-section>
                            <q-item-section class="text-negative">Delete</q-item-section>
                          </q-item>
                        </q-list>
                      </q-menu>
                    </q-btn>
                  </div>
                </div>

                <div class="q-mt-md">
                  <div v-if="client.email" class="text-body2 q-mb-xs">
                    <q-icon name="email" size="xs" class="q-mr-xs text-grey" />
                    <a :href="`mailto:${client.email}`" @click.stop>{{ client.email }}</a>
                  </div>
                  <div v-if="client.phone" class="text-body2 q-mb-xs">
                    <q-icon name="phone" size="xs" class="q-mr-xs text-grey" />
                    <a :href="`tel:${client.phone}`" @click.stop>{{ client.phone }}</a>
                  </div>
                </div>

                <div v-if="client.notes" class="q-mt-sm text-caption text-grey ellipsis-2-lines">
                  {{ client.notes }}
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </div>
    </div>

    <!-- Add/Edit Client Dialog -->
    <q-dialog v-model="showClientDialog" persistent>
      <q-card style="min-width: 400px; max-width: 500px">
        <q-card-section>
          <div class="text-h6">{{ editingClient ? 'Edit Client' : 'Add Client' }}</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-form @submit="saveClient" class="q-gutter-md">
            <q-input
              v-model="clientForm.name"
              label="Client Name *"
              outlined
              dense
              :rules="[val => !!val?.trim() || 'Name is required']"
            />

            <q-input
              v-model="clientForm.email"
              label="Email"
              type="email"
              outlined
              dense
            />

            <q-input
              v-model="clientForm.phone"
              label="Phone"
              type="tel"
              outlined
              dense
            />

            <q-input
              v-model="clientForm.location"
              label="Location"
              outlined
              dense
              hint="City or suburb"
            />

            <q-input
              v-model="clientForm.address"
              label="Full Address"
              type="textarea"
              outlined
              dense
              rows="2"
            />

            <q-input
              v-model="clientForm.notes"
              label="Notes"
              type="textarea"
              outlined
              dense
              rows="3"
            />

            <div class="row justify-end q-gutter-sm">
              <q-btn flat label="Cancel" color="grey" v-close-popup />
              <q-btn
                type="submit"
                :label="editingClient ? 'Update' : 'Add'"
                color="primary"
                :loading="isSaving"
              />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Import Dialog -->
    <q-dialog v-model="showImport" persistent>
      <q-card style="min-width: 400px; max-width: 500px">
        <q-card-section>
          <div class="text-h6">Import Clients</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-tabs v-model="importTab" class="q-mb-md">
            <q-tab name="csv" label="CSV" />
            <q-tab name="json" label="JSON" />
          </q-tabs>

          <q-tab-panels v-model="importTab" animated>
            <q-tab-panel name="csv">
              <p class="text-body2 text-grey">
                Upload a CSV file with columns: name, email, phone, location, address, notes.
                The first row should contain headers.
              </p>
              <q-file
                v-model="importFile"
                label="Select CSV file"
                outlined
                accept=".csv"
                @update:model-value="handleFileSelect"
              >
                <template #prepend>
                  <q-icon name="attach_file" />
                </template>
              </q-file>
            </q-tab-panel>

            <q-tab-panel name="json">
              <p class="text-body2 text-grey">
                Paste JSON data or upload a JSON file exported from TicTacStick.
              </p>
              <q-input
                v-model="importText"
                type="textarea"
                outlined
                placeholder="Paste JSON here..."
                rows="6"
              />
              <q-file
                v-model="importFile"
                label="Or select JSON file"
                outlined
                accept=".json"
                class="q-mt-sm"
                @update:model-value="handleFileSelect"
              >
                <template #prepend>
                  <q-icon name="attach_file" />
                </template>
              </q-file>
            </q-tab-panel>
          </q-tab-panels>

          <div class="row justify-end q-gutter-sm q-mt-md">
            <q-btn flat label="Cancel" color="grey" v-close-popup />
            <q-btn
              label="Import"
              color="primary"
              :loading="isImporting"
              @click="doImport"
            />
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar, exportFile } from 'quasar';
import { useClientsStore, type Client } from '../stores/clients';
import { useQuoteStore } from '../stores/quote';

const $q = useQuasar();
const router = useRouter();
const clientsStore = useClientsStore();
const quoteStore = useQuoteStore();

// Local state
const searchQuery = ref('');
const sortBy = ref<'name' | 'date' | 'recent'>('name');
const showClientDialog = ref(false);
const editingClient = ref<Client | null>(null);
const isSaving = ref(false);

const clientForm = reactive({
  name: '',
  email: '',
  phone: '',
  location: '',
  address: '',
  notes: '',
});

// Import state
const showImport = ref(false);
const importTab = ref<'csv' | 'json'>('csv');
const importFile = ref<File | null>(null);
const importText = ref('');
const isImporting = ref(false);

const sortOptions = [
  { label: 'Name', value: 'name' },
  { label: 'Newest', value: 'date' },
  { label: 'Recent', value: 'recent' },
];

function showAddDialog() {
  editingClient.value = null;
  Object.assign(clientForm, {
    name: '',
    email: '',
    phone: '',
    location: '',
    address: '',
    notes: '',
  });
  showClientDialog.value = true;
}

function showEditDialog(client: Client) {
  editingClient.value = client;
  Object.assign(clientForm, {
    name: client.name,
    email: client.email,
    phone: client.phone,
    location: client.location,
    address: client.address,
    notes: client.notes,
  });
  showClientDialog.value = true;
}

function saveClient() {
  isSaving.value = true;

  try {
    const clientData = {
      ...clientForm,
      id: editingClient.value?.id,
      createdAt: editingClient.value?.createdAt,
    };

    const saved = clientsStore.saveClient(clientData);

    if (saved) {
      showClientDialog.value = false;
      $q.notify({
        type: 'positive',
        message: editingClient.value ? 'Client updated' : 'Client added',
        position: 'top',
      });
    } else {
      $q.notify({
        type: 'negative',
        message: 'Failed to save client',
        position: 'top',
      });
    }
  } finally {
    isSaving.value = false;
  }
}

function confirmDelete(client: Client) {
  $q.dialog({
    title: 'Delete Client',
    message: `Are you sure you want to delete "${client.name}"? This will not delete their quotes.`,
    cancel: true,
    persistent: true,
  }).onOk(() => {
    const success = clientsStore.deleteClient(client.id);
    if (success) {
      $q.notify({
        type: 'positive',
        message: 'Client deleted',
        position: 'top',
      });
    }
  });
}

function useClient(client: Client) {
  quoteStore.clientName = client.name;
  quoteStore.clientLocation = client.location;
  quoteStore.clientEmail = client.email;
  quoteStore.clientPhone = client.phone;

  $q.notify({
    type: 'positive',
    message: `Selected: ${client.name}`,
    position: 'top',
  });

  router.push('/quote');
}

function showImportDialog() {
  importFile.value = null;
  importText.value = '';
  showImport.value = true;
}

async function handleFileSelect(file: File | null) {
  if (!file) return;

  try {
    const text = await file.text();
    if (importTab.value === 'json') {
      importText.value = text;
    } else {
      importText.value = text;
    }
  } catch (e) {
    $q.notify({
      type: 'negative',
      message: 'Failed to read file',
      position: 'top',
    });
  }
}

function doImport() {
  if (!importText.value?.trim()) {
    $q.notify({
      type: 'warning',
      message: 'Please provide data to import',
      position: 'top',
    });
    return;
  }

  isImporting.value = true;

  try {
    const result = importTab.value === 'csv'
      ? clientsStore.importFromCSV(importText.value)
      : clientsStore.importClients(importText.value);

    if (result.success) {
      showImport.value = false;
      $q.notify({
        type: 'positive',
        message: `Imported ${result.imported} clients`,
        position: 'top',
      });

      if (result.errors.length > 0) {
        console.warn('[Import] Warnings:', result.errors);
      }
    } else {
      $q.notify({
        type: 'negative',
        message: result.errors[0] || 'Import failed',
        position: 'top',
      });
    }
  } finally {
    isImporting.value = false;
  }
}

function exportClients() {
  const data = clientsStore.exportClients();
  const filename = `tictacstick-clients-${new Date().toISOString().split('T')[0]}.json`;

  const status = exportFile(filename, data, { mimeType: 'application/json' });

  if (status === true) {
    $q.notify({
      type: 'positive',
      message: 'Clients exported',
      position: 'top',
    });
  } else {
    $q.notify({
      type: 'negative',
      message: 'Export failed',
      position: 'top',
    });
  }
}
</script>

<style scoped>
.client-card {
  transition: transform 0.2s, box-shadow 0.2s;
  height: 100%;
}

.client-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.ellipsis-2-lines {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
