<template>
  <q-page class="admin-pricing-page q-pa-md">
    <!-- Header -->
    <div class="row items-center q-mb-lg">
      <div class="col">
        <h4 class="q-mb-xs">API Pricing Management</h4>
        <p class="text-grey-6">Manage service types, modifiers, and market areas in the database</p>
      </div>
      <div class="col-auto q-gutter-sm">
        <q-chip 
          :color="pricingStore.loading ? 'grey' : (pricingStore.error ? 'negative' : 'positive')"
          text-color="white"
          dense
        >
          {{ statusLabel }}
        </q-chip>
        <q-btn 
          color="primary" 
          icon="refresh" 
          label="Refresh" 
          @click="refreshData"
          :loading="pricingStore.loading"
        />
      </div>
    </div>

    <!-- Error Banner -->
    <q-banner v-if="pricingStore.error" class="bg-negative text-white q-mb-md" rounded>
      <template v-slot:avatar>
        <q-icon name="error" />
      </template>
      {{ pricingStore.error }}
      <template v-slot:action>
        <q-btn flat color="white" label="Retry" @click="refreshData" />
      </template>
    </q-banner>

    <!-- Tabs -->
    <q-tabs v-model="activeTab" class="text-primary q-mb-md" align="left" narrow-indicator>
      <q-tab name="services" icon="category" label="Service Types" />
      <q-tab name="modifiers" icon="tune" label="Modifiers" />
      <q-tab name="markets" icon="location_on" label="Market Areas" />
    </q-tabs>

    <q-tab-panels v-model="activeTab" animated class="bg-transparent">
      <!-- Service Types Tab -->
      <q-tab-panel name="services">
        <q-card>
          <q-card-section class="row items-center">
            <div class="text-h6">Service Types</div>
            <q-space />
            <q-btn color="primary" icon="add" label="Add Service Type" @click="showAddService = true" />
          </q-card-section>

          <q-separator />

          <q-card-section v-if="pricingStore.loading" class="text-center q-pa-lg">
            <q-spinner size="3em" color="primary" />
            <div class="q-mt-md">Loading service types...</div>
          </q-card-section>

          <q-list v-else separator>
            <q-item v-for="service in pricingStore.serviceTypes" :key="service.id">
              <q-item-section avatar>
                <q-icon 
                  :name="getCategoryIcon(service.category)" 
                  :color="getCategoryColor(service.category)"
                />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ service.label }}</q-item-label>
                <q-item-label caption>
                  {{ service.code }} · {{ service.category }}
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <div class="text-right">
                  <div class="text-body2">${{ service.basePrice?.toFixed(2) || '0.00' }}</div>
                  <div class="text-caption text-grey-6">
                    {{ service.minutesPerUnit }} min/unit
                  </div>
                </div>
              </q-item-section>
              <q-item-section side>
                <div class="q-gutter-xs">
                  <q-btn flat round dense icon="edit" @click="editService(service)" />
                  <q-btn flat round dense icon="delete" color="negative" @click="confirmDeleteService(service)" />
                </div>
              </q-item-section>
            </q-item>

            <q-item v-if="pricingStore.serviceTypes.length === 0">
              <q-item-section class="text-center text-grey-6 q-py-lg">
                No service types found. Add one to get started.
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </q-tab-panel>

      <!-- Modifiers Tab -->
      <q-tab-panel name="modifiers">
        <q-card>
          <q-card-section class="row items-center">
            <div class="text-h6">Price Modifiers</div>
            <q-space />
            <q-btn color="primary" icon="add" label="Add Modifier" @click="showAddModifier = true" />
          </q-card-section>

          <q-separator />

          <q-card-section v-if="pricingStore.loading" class="text-center q-pa-lg">
            <q-spinner size="3em" color="primary" />
            <div class="q-mt-md">Loading modifiers...</div>
          </q-card-section>

          <q-list v-else separator>
            <q-item v-for="modifier in pricingStore.modifiers" :key="modifier.id">
              <q-item-section avatar>
                <q-icon name="tune" color="orange" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ modifier.label }}</q-item-label>
                <q-item-label caption>
                  {{ modifier.code }} · {{ modifier.type }}
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <div class="text-right">
                  <div class="text-body2">
                    {{ formatModifierValue(modifier) }}
                  </div>
                  <div class="text-caption text-grey-6">
                    {{ modifier.appliesTo }}
                  </div>
                </div>
              </q-item-section>
              <q-item-section side>
                <div class="q-gutter-xs">
                  <q-btn flat round dense icon="edit" @click="editModifier(modifier)" />
                  <q-btn flat round dense icon="delete" color="negative" @click="confirmDeleteModifier(modifier)" />
                </div>
              </q-item-section>
            </q-item>

            <q-item v-if="pricingStore.modifiers.length === 0">
              <q-item-section class="text-center text-grey-6 q-py-lg">
                No modifiers found. Add one to get started.
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </q-tab-panel>

      <!-- Market Areas Tab -->
      <q-tab-panel name="markets">
        <q-card>
          <q-card-section class="row items-center">
            <div class="text-h6">Market Areas</div>
            <q-space />
            <q-btn color="primary" icon="add" label="Add Market Area" @click="showAddMarket = true" />
          </q-card-section>

          <q-separator />

          <q-card-section v-if="pricingStore.loading" class="text-center q-pa-lg">
            <q-spinner size="3em" color="primary" />
            <div class="q-mt-md">Loading market areas...</div>
          </q-card-section>

          <q-list v-else separator>
            <q-item v-for="market in pricingStore.marketAreas" :key="market.id">
              <q-item-section avatar>
                <q-icon name="location_on" color="green" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ market.label }}</q-item-label>
                <q-item-label caption>
                  {{ market.code }}
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <div class="text-right">
                  <div class="text-body2">
                    {{ (market.multiplier * 100).toFixed(0) }}%
                  </div>
                  <div class="text-caption text-grey-6">
                    price multiplier
                  </div>
                </div>
              </q-item-section>
              <q-item-section side>
                <div class="q-gutter-xs">
                  <q-btn flat round dense icon="edit" @click="editMarket(market)" />
                  <q-btn flat round dense icon="delete" color="negative" @click="confirmDeleteMarket(market)" />
                </div>
              </q-item-section>
            </q-item>

            <q-item v-if="pricingStore.marketAreas.length === 0">
              <q-item-section class="text-center text-grey-6 q-py-lg">
                No market areas found. Add one to get started.
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </q-tab-panel>
    </q-tab-panels>

    <!-- Add/Edit Service Dialog -->
    <q-dialog v-model="showAddService" persistent>
      <q-card style="min-width: 400px">
        <q-card-section class="row items-center">
          <div class="text-h6">{{ editingService ? 'Edit' : 'Add' }} Service Type</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-separator />

        <q-card-section class="q-gutter-md">
          <q-input v-model="serviceForm.code" label="Code" outlined hint="e.g., WINDOW_STANDARD" />
          <q-input v-model="serviceForm.label" label="Label" outlined hint="e.g., Standard Window" />
          <q-select 
            v-model="serviceForm.category" 
            :options="categoryOptions" 
            label="Category" 
            outlined 
            emit-value 
            map-options
          />
          <q-input 
            v-model.number="serviceForm.basePrice" 
            label="Base Price" 
            type="number" 
            prefix="$" 
            outlined 
          />
          <q-input 
            v-model.number="serviceForm.minutesPerUnit" 
            label="Minutes Per Unit" 
            type="number" 
            suffix="min" 
            outlined 
          />
        </q-card-section>

        <q-separator />

        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn 
            color="primary" 
            :label="editingService ? 'Update' : 'Create'" 
            @click="saveService"
            :loading="saving"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Add/Edit Modifier Dialog -->
    <q-dialog v-model="showAddModifier" persistent>
      <q-card style="min-width: 400px">
        <q-card-section class="row items-center">
          <div class="text-h6">{{ editingModifier ? 'Edit' : 'Add' }} Modifier</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-separator />

        <q-card-section class="q-gutter-md">
          <q-input v-model="modifierForm.code" label="Code" outlined hint="e.g., HIGH_REACH" />
          <q-input v-model="modifierForm.label" label="Label" outlined hint="e.g., High Reach" />
          <q-select 
            v-model="modifierForm.type" 
            :options="modifierTypeOptions" 
            label="Type" 
            outlined 
            emit-value 
            map-options
          />
          <q-input 
            v-model.number="modifierForm.value" 
            label="Value" 
            type="number" 
            :hint="modifierForm.type === 'PERCENTAGE' ? 'e.g., 40 for +40%' : 'Fixed amount'"
            outlined 
          />
          <q-select 
            v-model="modifierForm.appliesTo" 
            :options="appliesToOptions" 
            label="Applies To" 
            outlined 
            emit-value 
            map-options
          />
        </q-card-section>

        <q-separator />

        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn 
            color="primary" 
            :label="editingModifier ? 'Update' : 'Create'" 
            @click="saveModifier"
            :loading="saving"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Add/Edit Market Dialog -->
    <q-dialog v-model="showAddMarket" persistent>
      <q-card style="min-width: 400px">
        <q-card-section class="row items-center">
          <div class="text-h6">{{ editingMarket ? 'Edit' : 'Add' }} Market Area</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-separator />

        <q-card-section class="q-gutter-md">
          <q-input v-model="marketForm.code" label="Code" outlined hint="e.g., BRISBANE" />
          <q-input v-model="marketForm.label" label="Label" outlined hint="e.g., Brisbane Metro" />
          <q-input 
            v-model.number="marketForm.multiplier" 
            label="Multiplier" 
            type="number" 
            step="0.01"
            hint="e.g., 1.0 for 100%, 1.2 for 120%"
            outlined 
          />
        </q-card-section>

        <q-separator />

        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn 
            color="primary" 
            :label="editingMarket ? 'Update' : 'Create'" 
            @click="saveMarket"
            :loading="saving"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { usePricingStore, type ServiceType, type Modifier, type MarketArea } from '../stores/pricing';

const $q = useQuasar();
const pricingStore = usePricingStore();

const activeTab = ref('services');
const saving = ref(false);

// Dialog visibility
const showAddService = ref(false);
const showAddModifier = ref(false);
const showAddMarket = ref(false);

// Editing states
const editingService = ref<ServiceType | null>(null);
const editingModifier = ref<Modifier | null>(null);
const editingMarket = ref<MarketArea | null>(null);

// Form data
const serviceForm = ref({
  code: '',
  label: '',
  category: 'WINDOW',
  basePrice: 0,
  minutesPerUnit: 5,
});

const modifierForm = ref({
  code: '',
  label: '',
  type: 'PERCENTAGE',
  value: 0,
  appliesTo: 'ALL',
});

const marketForm = ref({
  code: '',
  label: '',
  multiplier: 1.0,
});

// Options
const categoryOptions = [
  { label: 'Window Cleaning', value: 'WINDOW' },
  { label: 'Pressure Cleaning', value: 'PRESSURE' },
];

const modifierTypeOptions = [
  { label: 'Percentage', value: 'PERCENTAGE' },
  { label: 'Fixed Amount', value: 'FIXED' },
  { label: 'Multiplier', value: 'MULTIPLIER' },
];

const appliesToOptions = [
  { label: 'All Services', value: 'ALL' },
  { label: 'Window Only', value: 'WINDOW' },
  { label: 'Pressure Only', value: 'PRESSURE' },
];

// Computed
const statusLabel = computed(() => {
  if (pricingStore.loading) return 'Loading...';
  if (pricingStore.error) return 'Error';
  return `${pricingStore.serviceTypes.length} services`;
});

// Helpers
function getCategoryIcon(category: string) {
  return category === 'WINDOW' ? 'window' : 'water_drop';
}

function getCategoryColor(category: string) {
  return category === 'WINDOW' ? 'blue' : 'cyan';
}

function formatModifierValue(modifier: Modifier) {
  if (modifier.type === 'PERCENTAGE') {
    return `+${modifier.value}%`;
  } else if (modifier.type === 'MULTIPLIER') {
    return `×${modifier.value}`;
  }
  return `$${modifier.value?.toFixed(2) || '0.00'}`;
}

// Load data on mount
onMounted(async () => {
  await refreshData();
});

async function refreshData() {
  await pricingStore.fetchPricing(true);
}

// Service CRUD
function editService(service: ServiceType) {
  editingService.value = service;
  serviceForm.value = {
    code: service.code,
    label: service.label,
    category: service.category,
    basePrice: service.basePrice || 0,
    minutesPerUnit: service.minutesPerUnit || 5,
  };
  showAddService.value = true;
}

async function saveService() {
  saving.value = true;
  try {
    const payload = {
      ...serviceForm.value,
      businessId: 'biz-925',
    };

    if (editingService.value) {
      // TODO: Implement update API
      $q.notify({
        type: 'info',
        message: 'Update API not yet implemented - requires backend endpoint',
      });
    } else {
      // TODO: Implement create API
      $q.notify({
        type: 'info',
        message: 'Create API not yet implemented - requires backend endpoint',
      });
    }

    showAddService.value = false;
    editingService.value = null;
    resetServiceForm();
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Failed to save service type',
    });
  } finally {
    saving.value = false;
  }
}

function confirmDeleteService(service: ServiceType) {
  $q.dialog({
    title: 'Delete Service Type',
    message: `Are you sure you want to delete "${service.label}"?`,
    cancel: true,
    persistent: true,
    color: 'negative',
  }).onOk(() => {
    // TODO: Implement delete API
    $q.notify({
      type: 'info',
      message: 'Delete API not yet implemented - requires backend endpoint',
    });
  });
}

function resetServiceForm() {
  serviceForm.value = {
    code: '',
    label: '',
    category: 'WINDOW',
    basePrice: 0,
    minutesPerUnit: 5,
  };
}

// Modifier CRUD
function editModifier(modifier: Modifier) {
  editingModifier.value = modifier;
  modifierForm.value = {
    code: modifier.code,
    label: modifier.label,
    type: modifier.type,
    value: modifier.value || 0,
    appliesTo: modifier.appliesTo || 'ALL',
  };
  showAddModifier.value = true;
}

async function saveModifier() {
  saving.value = true;
  try {
    if (editingModifier.value) {
      $q.notify({
        type: 'info',
        message: 'Update API not yet implemented - requires backend endpoint',
      });
    } else {
      $q.notify({
        type: 'info',
        message: 'Create API not yet implemented - requires backend endpoint',
      });
    }

    showAddModifier.value = false;
    editingModifier.value = null;
    resetModifierForm();
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Failed to save modifier',
    });
  } finally {
    saving.value = false;
  }
}

function confirmDeleteModifier(modifier: Modifier) {
  $q.dialog({
    title: 'Delete Modifier',
    message: `Are you sure you want to delete "${modifier.label}"?`,
    cancel: true,
    persistent: true,
    color: 'negative',
  }).onOk(() => {
    $q.notify({
      type: 'info',
      message: 'Delete API not yet implemented - requires backend endpoint',
    });
  });
}

function resetModifierForm() {
  modifierForm.value = {
    code: '',
    label: '',
    type: 'PERCENTAGE',
    value: 0,
    appliesTo: 'ALL',
  };
}

// Market Area CRUD
function editMarket(market: MarketArea) {
  editingMarket.value = market;
  marketForm.value = {
    code: market.code,
    label: market.label,
    multiplier: market.multiplier,
  };
  showAddMarket.value = true;
}

async function saveMarket() {
  saving.value = true;
  try {
    if (editingMarket.value) {
      $q.notify({
        type: 'info',
        message: 'Update API not yet implemented - requires backend endpoint',
      });
    } else {
      $q.notify({
        type: 'info',
        message: 'Create API not yet implemented - requires backend endpoint',
      });
    }

    showAddMarket.value = false;
    editingMarket.value = null;
    resetMarketForm();
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Failed to save market area',
    });
  } finally {
    saving.value = false;
  }
}

function confirmDeleteMarket(market: MarketArea) {
  $q.dialog({
    title: 'Delete Market Area',
    message: `Are you sure you want to delete "${market.label}"?`,
    cancel: true,
    persistent: true,
    color: 'negative',
  }).onOk(() => {
    $q.notify({
      type: 'info',
      message: 'Delete API not yet implemented - requires backend endpoint',
    });
  });
}

function resetMarketForm() {
  marketForm.value = {
    code: '',
    label: '',
    multiplier: 1.0,
  };
}
</script>

<style scoped>
.admin-pricing-page {
  max-width: 900px;
  margin: 0 auto;
}
</style>
