<template>
  <q-card class="line-editor q-mb-md" bordered flat>
    <q-card-section>
      <div class="row items-start q-col-gutter-md">
        <!-- Window Type Select -->
        <div class="col-12 col-sm-6 col-md-4">
          <q-select
            v-model="localLine.windowTypeId"
            :options="windowTypeOptions"
            label="Window Type"
            emit-value
            map-options
            dense
            outlined
            @update:model-value="emitUpdate"
          >
            <template #option="{ itemProps, opt }">
              <q-item v-bind="itemProps">
                <q-item-section avatar>
                  <q-icon :name="opt.icon" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ opt.label }}</q-item-label>
                  <q-item-label caption>{{ opt.description }}</q-item-label>
                </q-item-section>
              </q-item>
            </template>
          </q-select>
        </div>

        <!-- Pane Count -->
        <div class="col-12 col-sm-6 col-md-2">
          <q-input
            v-model.number="localLine.panes"
            type="number"
            label="Panes"
            min="1"
            max="100"
            dense
            outlined
            @update:model-value="emitUpdate"
          >
            <template #prepend>
              <q-icon name="grid_view" size="xs" />
            </template>
          </q-input>
        </div>

        <!-- Inside/Outside Toggles -->
        <div class="col-12 col-sm-6 col-md-3">
          <div class="text-caption text-grey q-mb-xs">Clean Sides</div>
          <div class="row q-gutter-sm">
            <q-chip
              v-model:selected="localLine.inside"
              clickable
              color="primary"
              text-color="white"
              icon="home"
              @update:selected="emitUpdate"
            >
              Inside
            </q-chip>
            <q-chip
              v-model:selected="localLine.outside"
              clickable
              color="secondary"
              text-color="white"
              icon="wb_sunny"
              @update:selected="emitUpdate"
            >
              Outside
            </q-chip>
          </div>
        </div>

        <!-- High Reach Toggle -->
        <div class="col-12 col-sm-6 col-md-2">
          <div class="text-caption text-grey q-mb-xs">Access</div>
          <q-toggle
            v-model="localLine.highReach"
            label="High Reach"
            color="warning"
            @update:model-value="emitUpdate"
          />
        </div>

        <!-- Remove Button -->
        <div class="col-auto self-center">
          <q-btn
            flat
            round
            dense
            color="negative"
            icon="close"
            @click="$emit('remove', localLine.id)"
          />
        </div>
      </div>

      <!-- Second Row: Condition Modifier -->
      <div class="row items-center q-col-gutter-md q-mt-sm">
        <div class="col-12 col-sm-6 col-md-4">
          <q-select
            v-model="selectedCondition"
            :options="conditionOptions"
            label="Window Condition"
            emit-value
            map-options
            clearable
            dense
            outlined
          >
            <template #option="{ itemProps, opt }">
              <q-item v-bind="itemProps">
                <q-item-section>
                  <q-item-label>{{ opt.label }}</q-item-label>
                  <q-item-label caption>
                    {{ formatMultiplier(opt.timeMultiplier) }}
                  </q-item-label>
                </q-item-section>
              </q-item>
            </template>
          </q-select>
        </div>

        <div class="col-12 col-sm-6 col-md-4">
          <q-select
            v-model="selectedAccess"
            :options="accessOptions"
            label="Access Type"
            emit-value
            map-options
            clearable
            dense
            outlined
          >
            <template #option="{ itemProps, opt }">
              <q-item v-bind="itemProps">
                <q-item-section>
                  <q-item-label>{{ opt.label }}</q-item-label>
                  <q-item-label caption>
                    {{ formatMultiplier(opt.timeMultiplier) }}
                  </q-item-label>
                </q-item-section>
              </q-item>
            </template>
          </q-select>
        </div>

        <!-- Line Cost Preview -->
        <div class="col-auto q-ml-auto">
          <div class="text-caption text-grey">Line Total</div>
          <div class="text-h6 text-primary">
            {{ formatCurrency(lineCost) }}
          </div>
        </div>
      </div>

      <!-- Notes -->
      <div class="row q-mt-sm">
        <div class="col-12">
          <q-input
            v-model="localLine.notes"
            label="Notes"
            dense
            outlined
            autogrow
            @update:model-value="emitUpdate"
          />
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { WindowLine } from '@tictacstick/calculation-engine';
import {
  CORE_WINDOW_TYPES,
  EXTENDED_WINDOW_TYPES,
  WINDOW_CONDITIONS,
  ACCESS_MODIFIERS,
  calculateWindowCost,
  formatCurrency,
  createWindowTypeMap,
} from '@tictacstick/calculation-engine';
import { useQuoteStore } from '../../stores/quote';

const props = defineProps<{
  line: WindowLine;
}>();

const emit = defineEmits<{
  update: [line: WindowLine];
  remove: [id: string];
}>();

const quoteStore = useQuoteStore();

// Create window type map for calculations
const windowTypeMap = createWindowTypeMap();

// Local copy of line for editing
const localLine = ref<WindowLine>({ ...props.line });

// Watch for external changes
watch(() => props.line, (newLine) => {
  localLine.value = { ...newLine };
}, { deep: true });

// All window types combined
const allWindowTypes = [...CORE_WINDOW_TYPES, ...EXTENDED_WINDOW_TYPES];

// Window type options for select
const windowTypeOptions = computed(() =>
  allWindowTypes.map(type => ({
    value: type.id,
    label: type.label,
    description: type.description || '',
    icon: getWindowIcon(type.id),
  }))
);

// Condition options
const conditionOptions = computed(() =>
  WINDOW_CONDITIONS.map(cond => ({
    value: cond.id,
    label: cond.label,
    timeMultiplier: cond.timeMultiplier,
    priceMultiplier: cond.priceMultiplier,
  }))
);

// Access options
const accessOptions = computed(() =>
  ACCESS_MODIFIERS.map(acc => ({
    value: acc.id,
    label: acc.label,
    timeMultiplier: acc.timeMultiplier,
    priceMultiplier: acc.priceMultiplier,
  }))
);

// Current selections - computed from line properties for reactivity
const selectedCondition = computed({
  get: () => localLine.value.conditionId || null,
  set: (value: string | null) => updateCondition(value),
});

const selectedAccess = computed({
  get: () => localLine.value.accessId || null,
  set: (value: string | null) => updateAccess(value),
});

// Multiplier lookup functions for condition and access
function getConditionMultiplier(id: string): number {
  const condition = WINDOW_CONDITIONS.find(c => c.id === id);
  return condition?.priceMultiplier ?? 1.0;
}

function getAccessMultiplier(id: string): number {
  const access = ACCESS_MODIFIERS.find(a => a.id === id);
  return access?.priceMultiplier ?? 1.0;
}

// Calculate line cost
const lineCost = computed(() => {
  return calculateWindowCost(localLine.value, quoteStore.pricingConfig, windowTypeMap, getConditionMultiplier, getAccessMultiplier);
});

function emitUpdate() {
  emit('update', { ...localLine.value });
}

function updateCondition(conditionId: string | null) {
  localLine.value.conditionId = conditionId || undefined;
  emitUpdate();
}

function updateAccess(accessId: string | null) {
  localLine.value.accessId = accessId || undefined;
  emitUpdate();
}

function formatMultiplier(mult: number): string {
  if (mult === 1) return 'No change';
  if (mult > 1) return `+${Math.round((mult - 1) * 100)}% time`;
  return `${Math.round((mult - 1) * 100)}% time`;
}

function getWindowIcon(typeId: string): string {
  const iconMap: Record<string, string> = {
    'standard': 'window',
    'double-hung': 'view_column',
    'casement': 'vertical_split',
    'awning': 'expand_more',
    'sliding': 'swap_horiz',
    'picture': 'crop_landscape',
    'bay': 'panorama_horizontal',
    'bow': 'panorama_wide_angle',
    'skylight': 'wb_sunny',
    'french-door': 'door_sliding',
    'bi-fold': 'menu_open',
    'louvre': 'view_week',
    'fixed': 'crop_square',
  };
  return iconMap[typeId] || 'window';
}
</script>

<style scoped>
.line-editor {
  background: rgba(0, 0, 0, 0.02);
}

.body--dark .line-editor {
  background: rgba(255, 255, 255, 0.02);
}
</style>
