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
import type { PressureLine } from '@tictacstick/calculation-engine';
import {
  CORE_PRESSURE_SURFACES,
  EXTENDED_PRESSURE_SURFACES,
  formatCurrency,
} from '@tictacstick/calculation-engine';

const props = defineProps<{
  line: PressureLine;
}>();

const emit = defineEmits<{
  update: [line: PressureLine];
  remove: [id: string];
}>();

// Local copy for editing
const localLine = ref<PressureLine>({ ...props.line });

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

// Estimated price calculation - matches the store's calculation logic
const estimatedPrice = computed(() => {
  const allSurfaces = [...CORE_PRESSURE_SURFACES, ...EXTENDED_PRESSURE_SURFACES];
  const surface = allSurfaces.find(s => s.id === localLine.value.surfaceId);
  if (!surface) return 0;
  
  // Use the same calculation as the store: time-based pricing
  const mps = surface.minutesPerSqm || 0;
  const area = localLine.value.areaSqm || 0;
  const pressureHourlyRate = 80; // Default rate from quote store
  
  // Soil factor (same as calculatePressureCost)
  let soilFactor = 1.0;
  if (localLine.value.soilLevel === 'medium') soilFactor = 1.25;
  else if (localLine.value.soilLevel === 'heavy') soilFactor = 1.5;
  
  // Access factor (same as calculatePressureCost)
  let accessFactor = 1.0;
  if (localLine.value.access === 'ladder') accessFactor = 1.2;
  else if (localLine.value.access === 'highReach') accessFactor = 1.35;
  
  const minutes = mps * area * soilFactor * accessFactor;
  const hours = minutes / 60;
  let cost = hours * pressureHourlyRate;
  
  // Sealing is an add-on multiplier (kept from original)
  if (localLine.value.includeSealing) cost *= 1.8;
  
  return Math.round(cost * 100) / 100; // Round to 2 decimal places
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
</style>
