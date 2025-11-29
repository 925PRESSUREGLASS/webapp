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
          v-if="!hasApiKey"
          color="warning"
          text-color="white"
          dense
          icon="warning"
        >
          No API Key
        </q-chip>
        <q-chip 
          :color="isLoading ? 'grey' : (loadError ? 'negative' : 'positive')"
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
          :loading="isLoading"
        />
      </div>
    </div>

    <!-- API Key Warning -->
    <q-banner v-if="!hasApiKey" class="bg-warning text-white q-mb-md" rounded>
      <template v-slot:avatar>
        <q-icon name="warning" />
      </template>
      <strong>API Key not configured.</strong> 
      Set VITE_API_KEY environment variable to enable CRUD operations.
      <template v-slot:action>
        <q-btn flat color="white" label="Read-Only Mode" disabled />
      </template>
    </q-banner>

    <!-- Error Banner -->
    <q-banner v-if="loadError" class="bg-negative text-white q-mb-md" rounded>
      <template v-slot:avatar>
        <q-icon name="error" />
      </template>
      {{ loadError }}
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
            <q-btn 
              color="primary" 
              icon="add" 
              label="Add Service Type" 
              @click="openAddService"
              :disable="!hasApiKey"
            />
          </q-card-section>

          <q-separator />

          <q-card-section v-if="isLoading" class="text-center q-pa-lg">
            <q-spinner size="3em" color="primary" />
            <div class="q-mt-md">Loading service types...</div>
          </q-card-section>

          <q-list v-else separator>
            <q-item v-for="service in serviceTypes" :key="service.id">
              <q-item-section avatar>
                <q-icon 
                  :name="getServiceLineIcon(service.serviceLine?.code)" 
                  :color="getServiceLineColor(service.serviceLine?.code)"
                />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ service.name }}</q-item-label>
                <q-item-label caption>
                  {{ service.code }} · {{ service.serviceLine?.name || 'N/A' }}
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <div class="text-right">
                  <div class="text-body2">${{ service.basePrice?.toFixed(2) || '0.00' }}</div>
                  <div class="text-caption text-grey-6">
                    {{ service.baseTimeMinutes }} min base
                  </div>
                </div>
              </q-item-section>
              <q-item-section side>
                <div class="q-gutter-xs">
                  <q-btn 
                    flat round dense icon="edit" 
                    @click="editService(service)" 
                    :disable="!hasApiKey"
                  />
                  <q-btn 
                    flat round dense icon="delete" color="negative" 
                    @click="confirmDeleteService(service)" 
                    :disable="!hasApiKey"
                  />
                </div>
              </q-item-section>
            </q-item>

            <q-item v-if="serviceTypes.length === 0">
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
            <q-btn 
              color="primary" 
              icon="add" 
              label="Add Modifier" 
              @click="openAddModifier"
              :disable="!hasApiKey"
            />
          </q-card-section>

          <q-separator />

          <q-card-section v-if="isLoading" class="text-center q-pa-lg">
            <q-spinner size="3em" color="primary" />
            <div class="q-mt-md">Loading modifiers...</div>
          </q-card-section>

          <q-list v-else separator>
            <q-item v-for="modifier in modifiers" :key="modifier.id">
              <q-item-section avatar>
                <q-icon name="tune" color="orange" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ modifier.name }}</q-item-label>
                <q-item-label caption>
                  {{ modifier.code }} · {{ modifier.modifierType }}
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <div class="text-right">
                  <div class="text-body2">
                    {{ formatModifierValue(modifier) }}
                  </div>
                  <div class="text-caption text-grey-6">
                    {{ modifier.isActive ? 'Active' : 'Inactive' }}
                  </div>
                </div>
              </q-item-section>
              <q-item-section side>
                <div class="q-gutter-xs">
                  <q-btn 
                    flat round dense icon="edit" 
                    @click="editModifier(modifier)" 
                    :disable="!hasApiKey"
                  />
                  <q-btn 
                    flat round dense icon="delete" color="negative" 
                    @click="confirmDeleteModifier(modifier)" 
                    :disable="!hasApiKey"
                  />
                </div>
              </q-item-section>
            </q-item>

            <q-item v-if="modifiers.length === 0">
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
            <q-btn 
              color="primary" 
              icon="add" 
              label="Add Market Area" 
              @click="openAddMarket"
              :disable="!hasApiKey"
            />
          </q-card-section>

          <q-separator />

          <q-card-section v-if="isLoading" class="text-center q-pa-lg">
            <q-spinner size="3em" color="primary" />
            <div class="q-mt-md">Loading market areas...</div>
          </q-card-section>

          <q-list v-else separator>
            <q-item v-for="market in marketAreas" :key="market.id">
              <q-item-section avatar>
                <q-icon name="location_on" color="green" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ market.name }}</q-item-label>
                <q-item-label caption>
                  {{ market.description || 'No description' }}
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <div class="text-right">
                  <div class="text-body2">
                    {{ (market.priceMultiplier * 100).toFixed(0) }}%
                  </div>
                  <div class="text-caption text-grey-6">
                    price multiplier
                  </div>
                </div>
              </q-item-section>
              <q-item-section side>
                <div class="q-gutter-xs">
                  <q-btn 
                    flat round dense icon="edit" 
                    @click="editMarket(market)" 
                    :disable="!hasApiKey"
                  />
                  <q-btn 
                    flat round dense icon="delete" color="negative" 
                    @click="confirmDeleteMarket(market)" 
                    :disable="!hasApiKey"
                  />
                </div>
              </q-item-section>
            </q-item>

            <q-item v-if="marketAreas.length === 0">
              <q-item-section class="text-center text-grey-6 q-py-lg">
                No market areas found. Add one to get started.
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </q-tab-panel>
    </q-tab-panels>

    <!-- Add/Edit Service Dialog -->
    <q-dialog v-model="showServiceDialog" persistent>
      <q-card style="min-width: 400px">
        <q-card-section class="row items-center">
          <div class="text-h6">{{ editingService ? 'Edit' : 'Add' }} Service Type</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-separator />

        <q-card-section class="q-gutter-md">
          <q-input v-model="serviceForm.code" label="Code" outlined hint="e.g., WINDOW_STANDARD" />
          <q-input v-model="serviceForm.name" label="Name" outlined hint="e.g., Standard Window" />
          <q-input v-model="serviceForm.description" label="Description" outlined type="textarea" rows="2" />
          <q-select 
            v-model="serviceForm.serviceLineId" 
            :options="serviceLineOptions" 
            label="Service Line" 
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
            v-model.number="serviceForm.baseTimeMinutes" 
            label="Base Time (minutes)" 
            type="number" 
            suffix="min" 
            outlined 
          />
          <q-input 
            v-model.number="serviceForm.sqftPrice" 
            label="Sqft Price (optional)" 
            type="number" 
            prefix="$" 
            outlined 
          />
          <q-input 
            v-model.number="serviceForm.sqftTimeMinutes" 
            label="Sqft Time (optional)" 
            type="number" 
            suffix="min" 
            outlined 
          />
          <q-toggle v-model="serviceForm.isActive" label="Active" />
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
    <q-dialog v-model="showModifierDialog" persistent>
      <q-card style="min-width: 400px">
        <q-card-section class="row items-center">
          <div class="text-h6">{{ editingModifier ? 'Edit' : 'Add' }} Modifier</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-separator />

        <q-card-section class="q-gutter-md">
          <q-input v-model="modifierForm.code" label="Code" outlined hint="e.g., HIGH_REACH" />
          <q-input v-model="modifierForm.name" label="Name" outlined hint="e.g., High Reach Access" />
          <q-input v-model="modifierForm.description" label="Description" outlined type="textarea" rows="2" />
          <q-select 
            v-model="modifierForm.modifierType" 
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
            :hint="getModifierValueHint()"
            outlined 
          />
          <q-toggle v-model="modifierForm.isActive" label="Active" />
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
    <q-dialog v-model="showMarketDialog" persistent>
      <q-card style="min-width: 400px">
        <q-card-section class="row items-center">
          <div class="text-h6">{{ editingMarket ? 'Edit' : 'Add' }} Market Area</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-separator />

        <q-card-section class="q-gutter-md">
          <q-input v-model="marketForm.name" label="Name" outlined hint="e.g., Brisbane Metro" />
          <q-input v-model="marketForm.description" label="Description" outlined type="textarea" rows="2" />
          <q-input 
            v-model.number="marketForm.priceMultiplier" 
            label="Price Multiplier" 
            type="number" 
            step="0.01"
            hint="e.g., 1.0 for 100%, 1.2 for 120%"
            outlined 
          />
          <q-toggle v-model="marketForm.isActive" label="Active" />
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
import { 
  useAdminApi, 
  type ServiceType, 
  type Modifier, 
  type MarketArea,
  type ServiceLine,
} from '../composables/useAdminApi';

var $q = useQuasar();
var adminApi = useAdminApi();

var activeTab = ref('services');
var saving = ref(false);
var isLoading = ref(false);
var loadError = ref<string | null>(null);

// Data
var serviceTypes = ref<ServiceType[]>([]);
var modifiers = ref<Modifier[]>([]);
var marketAreas = ref<MarketArea[]>([]);
var serviceLines = ref<ServiceLine[]>([]);

// Dialog visibility
var showServiceDialog = ref(false);
var showModifierDialog = ref(false);
var showMarketDialog = ref(false);

// Editing states
var editingService = ref<ServiceType | null>(null);
var editingModifier = ref<Modifier | null>(null);
var editingMarket = ref<MarketArea | null>(null);

// Form data
var serviceForm = ref({
  code: '',
  name: '',
  description: '',
  serviceLineId: '',
  basePrice: 0,
  baseTimeMinutes: 5,
  sqftPrice: null as number | null,
  sqftTimeMinutes: null as number | null,
  unit: 'EACH',
  isActive: true,
});

var modifierForm = ref({
  code: '',
  name: '',
  description: '',
  modifierType: 'PERCENTAGE',
  value: 0,
  isActive: true,
});

var marketForm = ref({
  name: '',
  description: '',
  priceMultiplier: 1.0,
  isActive: true,
});

// Options
var modifierTypeOptions = [
  { label: 'Percentage', value: 'PERCENTAGE' },
  { label: 'Fixed Amount', value: 'FIXED' },
  { label: 'Multiplier', value: 'MULTIPLIER' },
];

// Computed
var hasApiKey = computed(function() {
  return adminApi.hasApiKey();
});

var serviceLineOptions = computed(function() {
  return serviceLines.value.map(function(sl) {
    return { label: sl.name, value: sl.id };
  });
});

var statusLabel = computed(function() {
  if (isLoading.value) return 'Loading...';
  if (loadError.value) return 'Error';
  return serviceTypes.value.length + ' services';
});

// Helpers
function getServiceLineIcon(code: string | undefined) {
  if (!code) return 'category';
  if (code.includes('WINDOW')) return 'window';
  if (code.includes('PRESSURE')) return 'water_drop';
  return 'category';
}

function getServiceLineColor(code: string | undefined) {
  if (!code) return 'grey';
  if (code.includes('WINDOW')) return 'blue';
  if (code.includes('PRESSURE')) return 'cyan';
  return 'grey';
}

function formatModifierValue(modifier: Modifier) {
  if (modifier.modifierType === 'PERCENTAGE') {
    return '+' + modifier.value + '%';
  } else if (modifier.modifierType === 'MULTIPLIER') {
    return '×' + modifier.value;
  }
  return '$' + (modifier.value?.toFixed(2) || '0.00');
}

function getModifierValueHint() {
  if (modifierForm.value.modifierType === 'PERCENTAGE') {
    return 'e.g., 40 for +40%';
  } else if (modifierForm.value.modifierType === 'MULTIPLIER') {
    return 'e.g., 1.5 for 150%';
  }
  return 'Fixed amount in dollars';
}

// Load data on mount
onMounted(async function() {
  await refreshData();
});

async function refreshData() {
  isLoading.value = true;
  loadError.value = null;

  try {
    // Fetch all data in parallel
    var results = await Promise.all([
      adminApi.getServiceTypes(),
      adminApi.getModifiers(),
      adminApi.getMarketAreas(),
      adminApi.getServiceLines(),
    ]);

    var stResult = results[0];
    var modResult = results[1];
    var maResult = results[2];
    var slResult = results[3];

    if (stResult.error) throw new Error('Service types: ' + stResult.error);
    if (modResult.error) throw new Error('Modifiers: ' + modResult.error);
    if (maResult.error) throw new Error('Market areas: ' + maResult.error);

    serviceTypes.value = stResult.data || [];
    modifiers.value = modResult.data || [];
    marketAreas.value = maResult.data || [];
    serviceLines.value = slResult.data || [];

    console.log('[AdminPricing] Loaded:', {
      serviceTypes: serviceTypes.value.length,
      modifiers: modifiers.value.length,
      marketAreas: marketAreas.value.length,
      serviceLines: serviceLines.value.length,
    });
  } catch (err) {
    loadError.value = err instanceof Error ? err.message : 'Unknown error';
    console.error('[AdminPricing] Load error:', err);
  } finally {
    isLoading.value = false;
  }
}

// ============ Service Type CRUD ============
function openAddService() {
  editingService.value = null;
  resetServiceForm();
  showServiceDialog.value = true;
}

function editService(service: ServiceType) {
  editingService.value = service;
  serviceForm.value = {
    code: service.code,
    name: service.name,
    description: service.description || '',
    serviceLineId: service.serviceLine?.id || (serviceLines.value[0]?.id || ''),
    basePrice: service.basePrice || 0,
    baseTimeMinutes: service.baseTimeMinutes || 5,
    sqftPrice: service.sqftPrice,
    sqftTimeMinutes: service.sqftTimeMinutes,
    unit: service.unit || 'EACH',
    isActive: service.isActive !== false,
  };
  showServiceDialog.value = true;
}

async function saveService() {
  saving.value = true;
  try {
    var payload = {
      code: serviceForm.value.code,
      name: serviceForm.value.name,
      description: serviceForm.value.description,
      serviceLineId: serviceForm.value.serviceLineId,
      basePrice: serviceForm.value.basePrice,
      baseTimeMinutes: serviceForm.value.baseTimeMinutes,
      sqftPrice: serviceForm.value.sqftPrice,
      sqftTimeMinutes: serviceForm.value.sqftTimeMinutes,
      unit: serviceForm.value.unit,
      isActive: serviceForm.value.isActive,
    };

    var result;
    if (editingService.value) {
      result = await adminApi.updateServiceType(editingService.value.id, payload);
    } else {
      result = await adminApi.createServiceType(payload);
    }

    if (result.error) {
      throw new Error(result.error);
    }

    $q.notify({
      type: 'positive',
      message: editingService.value ? 'Service type updated' : 'Service type created',
    });

    showServiceDialog.value = false;
    editingService.value = null;
    resetServiceForm();
    await refreshData();
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: 'Failed to save: ' + (err instanceof Error ? err.message : 'Unknown error'),
    });
  } finally {
    saving.value = false;
  }
}

function confirmDeleteService(service: ServiceType) {
  $q.dialog({
    title: 'Delete Service Type',
    message: 'Are you sure you want to delete "' + service.name + '"?',
    cancel: true,
    persistent: true,
    color: 'negative',
  }).onOk(async function() {
    try {
      var result = await adminApi.deleteServiceType(service.id);
      if (result.error) {
        throw new Error(result.error);
      }
      $q.notify({
        type: 'positive',
        message: 'Service type deleted',
      });
      await refreshData();
    } catch (err) {
      $q.notify({
        type: 'negative',
        message: 'Failed to delete: ' + (err instanceof Error ? err.message : 'Unknown error'),
      });
    }
  });
}

function resetServiceForm() {
  serviceForm.value = {
    code: '',
    name: '',
    description: '',
    serviceLineId: serviceLines.value[0]?.id || '',
    basePrice: 0,
    baseTimeMinutes: 5,
    sqftPrice: null,
    sqftTimeMinutes: null,
    unit: 'EACH',
    isActive: true,
  };
}

// ============ Modifier CRUD ============
function openAddModifier() {
  editingModifier.value = null;
  resetModifierForm();
  showModifierDialog.value = true;
}

function editModifier(modifier: Modifier) {
  editingModifier.value = modifier;
  modifierForm.value = {
    code: modifier.code,
    name: modifier.name,
    description: modifier.description || '',
    modifierType: modifier.modifierType,
    value: modifier.value || 0,
    isActive: modifier.isActive !== false,
  };
  showModifierDialog.value = true;
}

async function saveModifier() {
  saving.value = true;
  try {
    var payload = {
      code: modifierForm.value.code,
      name: modifierForm.value.name,
      description: modifierForm.value.description,
      modifierType: modifierForm.value.modifierType,
      value: modifierForm.value.value,
      isActive: modifierForm.value.isActive,
    };

    var result;
    if (editingModifier.value) {
      result = await adminApi.updateModifier(editingModifier.value.id, payload);
    } else {
      result = await adminApi.createModifier(payload);
    }

    if (result.error) {
      throw new Error(result.error);
    }

    $q.notify({
      type: 'positive',
      message: editingModifier.value ? 'Modifier updated' : 'Modifier created',
    });

    showModifierDialog.value = false;
    editingModifier.value = null;
    resetModifierForm();
    await refreshData();
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: 'Failed to save: ' + (err instanceof Error ? err.message : 'Unknown error'),
    });
  } finally {
    saving.value = false;
  }
}

function confirmDeleteModifier(modifier: Modifier) {
  $q.dialog({
    title: 'Delete Modifier',
    message: 'Are you sure you want to delete "' + modifier.name + '"?',
    cancel: true,
    persistent: true,
    color: 'negative',
  }).onOk(async function() {
    try {
      var result = await adminApi.deleteModifier(modifier.id);
      if (result.error) {
        throw new Error(result.error);
      }
      $q.notify({
        type: 'positive',
        message: 'Modifier deleted',
      });
      await refreshData();
    } catch (err) {
      $q.notify({
        type: 'negative',
        message: 'Failed to delete: ' + (err instanceof Error ? err.message : 'Unknown error'),
      });
    }
  });
}

function resetModifierForm() {
  modifierForm.value = {
    code: '',
    name: '',
    description: '',
    modifierType: 'PERCENTAGE',
    value: 0,
    isActive: true,
  };
}

// ============ Market Area CRUD ============
function openAddMarket() {
  editingMarket.value = null;
  resetMarketForm();
  showMarketDialog.value = true;
}

function editMarket(market: MarketArea) {
  editingMarket.value = market;
  marketForm.value = {
    name: market.name,
    description: market.description || '',
    priceMultiplier: market.priceMultiplier,
    isActive: market.isActive !== false,
  };
  showMarketDialog.value = true;
}

async function saveMarket() {
  saving.value = true;
  try {
    var payload = {
      name: marketForm.value.name,
      description: marketForm.value.description,
      priceMultiplier: marketForm.value.priceMultiplier,
      isActive: marketForm.value.isActive,
    };

    var result;
    if (editingMarket.value) {
      result = await adminApi.updateMarketArea(editingMarket.value.id, payload);
    } else {
      result = await adminApi.createMarketArea(payload);
    }

    if (result.error) {
      throw new Error(result.error);
    }

    $q.notify({
      type: 'positive',
      message: editingMarket.value ? 'Market area updated' : 'Market area created',
    });

    showMarketDialog.value = false;
    editingMarket.value = null;
    resetMarketForm();
    await refreshData();
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: 'Failed to save: ' + (err instanceof Error ? err.message : 'Unknown error'),
    });
  } finally {
    saving.value = false;
  }
}

function confirmDeleteMarket(market: MarketArea) {
  $q.dialog({
    title: 'Delete Market Area',
    message: 'Are you sure you want to delete "' + market.name + '"?',
    cancel: true,
    persistent: true,
    color: 'negative',
  }).onOk(async function() {
    try {
      var result = await adminApi.deleteMarketArea(market.id);
      if (result.error) {
        throw new Error(result.error);
      }
      $q.notify({
        type: 'positive',
        message: 'Market area deleted',
      });
      await refreshData();
    } catch (err) {
      $q.notify({
        type: 'negative',
        message: 'Failed to delete: ' + (err instanceof Error ? err.message : 'Unknown error'),
      });
    }
  });
}

function resetMarketForm() {
  marketForm.value = {
    name: '',
    description: '',
    priceMultiplier: 1.0,
    isActive: true,
  };
}
</script>

<style scoped>
.admin-pricing-page {
  max-width: 900px;
  margin: 0 auto;
}
</style>
