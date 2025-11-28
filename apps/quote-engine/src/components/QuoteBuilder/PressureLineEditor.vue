<template>
  <q-card flat bordered class="pressure-line-editor q-mb-sm">
    <q-card-section class="q-pa-md">
      <!-- Header with type and remove -->
      <div class="row items-center q-mb-md">
        <q-icon name="water_drop" color="secondary" size="sm" class="q-mr-sm" />
        <span class="text-subtitle2">Pressure Line</span>
        <q-space />
        <q-btn
          flat
          round
          dense
          color="negative"
          icon="close"
          size="sm"
          @click="$emit('remove', localLine.id)"
        />
      </div>

      <!-- Surface Type Selector -->
      <div class="row q-gutter-sm q-mb-md">
        <q-select
          v-model="localLine.surfaceId"
          :options="surfaceTypeOptions"
          label="Surface Type"
          outlined
          dense
          emit-value
          map-options
          class="col"
          @update:model-value="emitUpdate"
        >
          <template #option="scope">
            <q-item v-bind="scope.itemProps">
              <q-item-section avatar>
                <q-icon :name="getSurfaceIcon(scope.opt.value)" color="secondary" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ scope.opt.label }}</q-item-label>
                <q-item-label caption>{{ getSurfaceNotes(scope.opt.value) }}</q-item-label>
              </q-item-section>
            </q-item>
          </template>
        </q-select>
      </div>

      <!-- Area Input with Quick Presets -->
      <div class="row items-center q-gutter-sm q-mb-md">
        <q-input
          v-model.number="localLine.areaSqm"
          type="number"
          label="Area (m²)"
          outlined
          dense
          class="col-4"
          min="1"
          @update:model-value="emitUpdate"
        />
        
        <q-btn-group flat>
          <q-btn
            v-for="preset in areaPresets"
            :key="preset.value"
            :label="preset.label"
            :color="localLine.areaSqm === preset.value ? 'primary' : 'grey'"
            :flat="localLine.areaSqm !== preset.value"
            dense
            size="sm"
            @click="setArea(preset.value)"
          />
        </q-btn-group>
      </div>

      <!-- Condition and Access -->
      <div class="row q-gutter-sm q-mb-md">
        <q-select
          v-model="localLine.soilLevel"
          :options="soilLevelOptions"
          label="Condition"
          outlined
          dense
          emit-value
          map-options
          class="col"
          @update:model-value="emitUpdate"
        >
          <template #option="scope">
            <q-item v-bind="scope.itemProps">
              <q-item-section>
                <q-item-label>{{ scope.opt.label }}</q-item-label>
                <q-item-label caption>{{ scope.opt.description }}</q-item-label>
              </q-item-section>
            </q-item>
          </template>
        </q-select>
        
        <q-select
          v-model="localLine.access"
          :options="accessOptions"
          label="Access"
          outlined
          dense
          emit-value
          map-options
          class="col"
          @update:model-value="emitUpdate"
        />
      </div>

      <!-- Extras -->
      <div class="row items-center q-gutter-sm">
        <q-toggle
          v-model="localLine.includeSealing"
          label="Include Sealing"
          color="info"
          @update:model-value="emitUpdate"
        />
      </div>

      <!-- Notes -->
      <q-input
        v-model="localLine.notes"
        label="Notes"
        outlined
        dense
        class="q-mt-sm"
        @update:model-value="emitUpdate"
      />

      <!-- Pressure Add-ons Section -->
      <q-expansion-item
        class="q-mt-md"
        icon="add_circle"
        label="Surface Add-ons"
        :caption="activeAddons.length > 0 ? `${activeAddons.length} add-on${activeAddons.length !== 1 ? 's' : ''} • ${formatCurrency(totalAddonCost)}` : 'Oil stains, mold treatment, sealer...'"
        header-class="text-secondary"
      >
        <q-card flat>
          <q-card-section class="q-pt-none">
            <!-- Add-on Selector -->
            <q-select
              v-model="selectedAddonType"
              :options="availableAddonOptions"
              label="Add a service"
              outlined
              dense
              emit-value
              map-options
              clearable
              class="q-mb-sm"
              @update:model-value="addAddon"
            >
              <template #option="scope">
                <q-item v-bind="scope.itemProps">
                  <q-item-section>
                    <q-item-label>{{ scope.opt.label }}</q-item-label>
                    <q-item-label caption>
                      {{ scope.opt.description }} •
                      {{ scope.opt.isPerSqm ? `$${scope.opt.basePrice}/m²` : `$${scope.opt.basePrice} flat` }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>

            <!-- Active Add-ons List -->
            <div v-if="activeAddons.length > 0" class="q-gutter-sm">
              <div
                v-for="(addon, index) in activeAddons"
                :key="addon.id"
                class="addon-item row items-center q-pa-sm"
              >
                <div class="col">
                  <div class="text-weight-medium">{{ addon.label }}</div>
                  <div class="text-caption text-grey">
                    {{ getAddonTypeById(addon.id)?.isPerSqm ? 'Per m²' : 'Flat fee' }}
                  </div>
                </div>

                <!-- Area input for per-sqm add-ons -->
                <div v-if="getAddonTypeById(addon.id)?.isPerSqm" class="col-auto q-mx-sm">
                  <q-input
                    v-model.number="addon.areaSqm"
                    type="number"
                    label="Area (m²)"
                    outlined
                    dense
                    style="width: 100px"
                    min="1"
                    @update:model-value="emitUpdate"
                  />
                  <q-btn
                    flat
                    dense
                    size="xs"
                    label="Use Full"
                    color="secondary"
                    class="q-mt-xs"
                    @click="addon.areaSqm = localLine.areaSqm; emitUpdate()"
                  />
                </div>

                <!-- Severity selector for add-ons with severity -->
                <div v-if="getAddonTypeById(addon.id)?.hasSeverity" class="col-auto q-mx-sm">
                  <q-btn-toggle
                    v-model="addon.severity"
                    toggle-color="secondary"
                    size="sm"
                    :options="[
                      { label: 'Light', value: 'light' },
                      { label: 'Med', value: 'medium' },
                      { label: 'Heavy', value: 'heavy' },
                    ]"
                    @update:model-value="emitUpdate"
                  />
                </div>

                <!-- Addon cost preview -->
                <div class="col-auto text-right q-mx-sm">
                  <div class="text-weight-medium text-secondary">
                    {{ formatCurrency(calculateSingleAddonCost(addon)) }}
                  </div>
                </div>

                <!-- Remove button -->
                <div class="col-auto">
                  <q-btn
                    flat
                    round
                    dense
                    icon="close"
                    color="negative"
                    size="sm"
                    @click="removeAddon(index)"
                  />
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </q-expansion-item>

      <!-- Price Preview -->
      <div class="row items-center justify-between q-mt-md">
        <div class="text-caption text-grey">
          {{ formatTime(estimatedMinutes) }} estimated
        </div>
        <div class="text-subtitle1 text-weight-medium">
          Est: {{ formatCurrency(estimatedPrice) }}
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import type { PressureLine, PressureAddon } from '@tictacstick/calculation-engine';
import {
  CORE_PRESSURE_SURFACES,
  EXTENDED_PRESSURE_SURFACES,
  PRESSURE_ADDON_TYPES,
  createPressureAddon,
  calculatePressureAddonCost,
  formatCurrency,
} from '@tictacstick/calculation-engine';
import { useQuoteStore } from '../../stores/quote';
import { calculatePressureLineCost } from '../../composables/useCalculations';

const props = defineProps<{
  line: PressureLine;
}>();

const emit = defineEmits<{
  update: [line: PressureLine];
  remove: [id: string];
}>();

const quoteStore = useQuoteStore();

// Local copy for editing
const localLine = ref<PressureLine>({ ...props.line });

// Add-on state
const selectedAddonType = ref<string | null>(null);

// Computed: active add-ons
const activeAddons = computed(() => localLine.value.addons || []);

// Computed: available add-on options (filter out already-added ones)
const availableAddonOptions = computed(() => {
  const addedIds = new Set(activeAddons.value.map(a => a.id));
  return PRESSURE_ADDON_TYPES.filter(t => !addedIds.has(t.id)).map(t => ({
    label: t.label,
    value: t.id,
    description: t.description,
    basePrice: t.basePrice,
    isPerSqm: t.isPerSqm,
  }));
});

// Get addon type by id
function getAddonTypeById(id: string) {
  return PRESSURE_ADDON_TYPES.find(t => t.id === id);
}

// Add an add-on
function addAddon(addonId: string | null) {
  if (!addonId) return;

  const addonType = getAddonTypeById(addonId);
  if (!addonType) return;

  const newAddon = createPressureAddon(
    addonType,
    addonType.isPerSqm ? localLine.value.areaSqm || 10 : undefined,
    addonType.hasSeverity ? 'medium' : undefined
  );

  if (!localLine.value.addons) {
    localLine.value.addons = [];
  }
  localLine.value.addons.push(newAddon);
  selectedAddonType.value = null;
  emitUpdate();
}

// Remove an add-on
function removeAddon(index: number) {
  if (localLine.value.addons) {
    localLine.value.addons.splice(index, 1);
    emitUpdate();
  }
}

// Calculate cost for a single add-on
function calculateSingleAddonCost(addon: PressureAddon): number {
  return calculatePressureAddonCost(addon);
}

// Total add-on cost
const totalAddonCost = computed(() => {
  return activeAddons.value.reduce((sum, addon) => sum + calculateSingleAddonCost(addon), 0);
});

// Watch for external changes
watch(() => props.line, (newLine) => {
  localLine.value = { ...newLine };
}, { deep: true });

// Surface type options
const surfaceTypeOptions = computed(() => {
  const core = CORE_PRESSURE_SURFACES.map(s => ({
    label: s.label,
    value: s.id,
  }));
  const extended = EXTENDED_PRESSURE_SURFACES.map(s => ({
    label: s.label,
    value: s.id,
  }));
  return [...core, ...extended];
});

// Area presets for quick selection
const areaPresets = [
  { label: '20m²', value: 20 },
  { label: '40m²', value: 40 },
  { label: '60m²', value: 60 },
  { label: '100m²', value: 100 },
];

// Soil level options
const soilLevelOptions = [
  { label: 'Light', value: 'light', description: 'Minimal staining, quick clean' },
  { label: 'Medium', value: 'medium', description: 'Standard residential condition' },
  { label: 'Heavy', value: 'heavy', description: 'Significant buildup, oil stains' },
];

// Access options
const accessOptions = [
  { label: 'Easy Access', value: 'easy' },
  { label: 'Ladder Required', value: 'ladder' },
  { label: 'High Reach', value: 'highReach' },
];

// Surface icon helper
function getSurfaceIcon(surfaceId: string): string {
  const iconMap: Record<string, string> = {
    driveway: 'directions_car',
    paving: 'view_module',
    limestone: 'layers',
    deck: 'deck',
    patio: 'weekend',
    pool: 'pool',
    roof: 'roofing',
    wall: 'dashboard',
    path: 'timeline',
    garage: 'garage',
    carpark: 'local_parking',
    factory: 'factory',
    tennis: 'sports_tennis',
    fence: 'fence',
  };
  
  // Check prefix match
  for (const [prefix, icon] of Object.entries(iconMap)) {
    if (surfaceId.includes(prefix)) return icon;
  }
  return 'water_drop';
}

// Surface notes helper
function getSurfaceNotes(surfaceId: string): string {
  const allSurfaces = [...CORE_PRESSURE_SURFACES, ...EXTENDED_PRESSURE_SURFACES];
  const surface = allSurfaces.find(s => s.id === surfaceId);
  return surface?.notes || '';
}

// Set area from preset
function setArea(area: number) {
  localLine.value.areaSqm = area;
  emitUpdate();
}

// Estimated time calculation
const estimatedMinutes = computed(() => {
  const allSurfaces = [...CORE_PRESSURE_SURFACES, ...EXTENDED_PRESSURE_SURFACES];
  const surface = allSurfaces.find(s => s.id === localLine.value.surfaceId);
  if (!surface) return 0;
  
  const baseMinutes = surface.minutesPerSqm * (localLine.value.areaSqm || 0);
  let multiplier = 1;
  
  if (localLine.value.soilLevel === 'medium') multiplier = 1.25;
  if (localLine.value.soilLevel === 'heavy') multiplier = 1.5;
  if (localLine.value.access === 'ladder') multiplier *= 1.2;
  if (localLine.value.access === 'highReach') multiplier *= 1.35;
  
  return baseMinutes * multiplier;
});

// Estimated price calculation - using shared composable function
const estimatedPrice = computed(() => {
  return calculatePressureLineCost(localLine.value, quoteStore.pricingConfig);
});

// Format time helper
function formatTime(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

// Emit update to parent
function emitUpdate() {
  emit('update', { ...localLine.value });
}

onMounted(() => {
  // Set defaults if not set and emit to update the store
  let needsEmit = false;
  if (!localLine.value.soilLevel) {
    localLine.value.soilLevel = 'medium';
    needsEmit = true;
  }
  if (!localLine.value.access) {
    localLine.value.access = 'easy';
    needsEmit = true;
  }
  if (needsEmit) {
    emitUpdate();
  }
});
</script>

<style scoped>
.pressure-line-editor {
  background: rgba(var(--q-secondary-rgb), 0.02);
  border-color: rgba(var(--q-secondary-rgb), 0.2);
}

.body--dark .pressure-line-editor {
  background: rgba(255, 255, 255, 0.02);
}

.addon-item {
  background: rgba(var(--q-secondary-rgb), 0.05);
  border-radius: 8px;
  border: 1px solid rgba(var(--q-secondary-rgb), 0.15);
}

.body--dark .addon-item {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
}
</style>
