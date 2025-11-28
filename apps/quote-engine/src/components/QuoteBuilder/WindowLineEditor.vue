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

        <!-- High Reach Toggle -->\
        <div class="col-12 col-sm-6 col-md-3">
          <div class="text-caption text-grey q-mb-xs">High Reach Access</div>
          <div class="row q-gutter-sm items-center">
            <q-toggle
              v-model="localLine.highReach"
              label="High Reach"
              color="warning"
              @update:model-value="onHighReachToggle"
            />
          </div>
          <!-- Individual high reach pane count options - only show when highReach is enabled -->
          <div v-if="localLine.highReach" class="row q-gutter-sm q-mt-sm">
            <!-- Inside High Reach Pane Count -->
            <div v-if="localLine.inside" class="col-12 col-sm-6">
              <q-input
                v-model.number="localLine.insideHighReachCount"
                type="number"
                label="Inside HR Panes"
                :max="localLine.panes"
                min="0"
                dense
                outlined
                class="high-reach-input"
                @update:model-value="emitUpdate"
              >
                <template #prepend>
                  <q-icon name="elevator" color="orange" size="xs" />
                </template>
                <template #append>
                  <q-btn
                    flat
                    dense
                    size="sm"
                    color="orange"
                    label="All"
                    @click="setAllInsideHighReach"
                  />
                </template>
              </q-input>
              <div class="text-caption text-orange q-mt-xs">
                {{ localLine.insideHighReachCount || 0 }} of {{ localLine.panes }} panes (+70%)
              </div>
            </div>
            <!-- Outside High Reach Pane Count -->
            <div v-if="localLine.outside" class="col-12 col-sm-6">
              <q-input
                v-model.number="localLine.outsideHighReachCount"
                type="number"
                label="Outside HR Panes"
                :max="localLine.panes"
                min="0"
                dense
                outlined
                class="high-reach-input"
                @update:model-value="emitUpdate"
              >
                <template #prepend>
                  <q-icon name="elevator" color="orange" size="xs" />
                </template>
                <template #append>
                  <q-btn
                    flat
                    dense
                    size="sm"
                    color="orange"
                    label="All"
                    @click="setAllOutsideHighReach"
                  />
                </template>
              </q-input>
              <div class="text-caption text-orange q-mt-xs">
                {{ localLine.outsideHighReachCount || 0 }} of {{ localLine.panes }} panes (+70%)
              </div>
            </div>
          </div>
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

      <!-- Window Add-ons Section -->
      <q-expansion-item
        v-model="showAddons"
        icon="add_circle"
        label="Window Add-ons"
        caption="Fly screens, deep clean, bird poo removal, etc."
        class="q-mt-md"
        header-class="text-primary"
      >
        <q-card>
          <q-card-section class="q-pt-none">
            <!-- Add-on selector -->
            <div class="row q-gutter-sm q-mb-md">
              <q-select
                v-model="selectedAddonType"
                :options="addonTypeOptions"
                label="Add service"
                emit-value
                map-options
                dense
                outlined
                class="col-12 col-sm-6"
                @update:model-value="onAddonTypeSelected"
              >
                <template #option="{ itemProps, opt }">
                  <q-item v-bind="itemProps">
                    <q-item-section>
                      <q-item-label>{{ opt.label }}</q-item-label>
                      <q-item-label caption>
                        {{ formatCurrency(opt.basePrice) }}/pane base
                      </q-item-label>
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
            </div>

            <!-- Active add-ons list -->
            <div v-if="localLine.addons && localLine.addons.length > 0">
              <div
                v-for="(addon, index) in localLine.addons"
                :key="addon.id"
                class="addon-item q-pa-sm q-mb-sm rounded-borders"
              >
                <div class="row items-center q-gutter-sm">
                  <div class="col">
                    <div class="text-subtitle2">{{ addon.label }}</div>
                    <div class="text-caption text-grey">{{ addon.description }}</div>
                  </div>
                  <q-btn
                    flat
                    round
                    dense
                    size="sm"
                    color="negative"
                    icon="close"
                    @click="removeAddon(index)"
                  />
                </div>

                <div class="row q-gutter-sm q-mt-sm">
                  <!-- Inside count -->
                  <div v-if="localLine.inside" class="col-12 col-sm-4">
                    <q-input
                      v-model.number="addon.insideCount"
                      type="number"
                      label="Inside"
                      :max="localLine.panes"
                      min="0"
                      dense
                      outlined
                      @update:model-value="emitUpdate"
                    >
                      <template #append>
                        <q-btn
                          flat
                          dense
                          size="sm"
                          label="All"
                          @click="setAddonAllInside(index)"
                        />
                      </template>
                    </q-input>
                  </div>

                  <!-- Outside count -->
                  <div v-if="localLine.outside" class="col-12 col-sm-4">
                    <q-input
                      v-model.number="addon.outsideCount"
                      type="number"
                      label="Outside"
                      :max="localLine.panes"
                      min="0"
                      dense
                      outlined
                      @update:model-value="emitUpdate"
                    >
                      <template #append>
                        <q-btn
                          flat
                          dense
                          size="sm"
                          label="All"
                          @click="setAddonAllOutside(index)"
                        />
                      </template>
                    </q-input>
                  </div>

                  <!-- Severity -->
                  <div class="col-12 col-sm-4">
                    <q-select
                      v-model="addon.severity"
                      :options="severityOptions"
                      label="Severity"
                      emit-value
                      map-options
                      dense
                      outlined
                      @update:model-value="emitUpdate"
                    />
                  </div>
                </div>

                <!-- Addon cost preview -->
                <div class="text-right q-mt-xs">
                  <span class="text-caption text-grey">Add-on cost: </span>
                  <span class="text-subtitle2 text-positive">
                    {{ formatCurrency(calculateSingleAddonCost(addon)) }}
                  </span>
                </div>
              </div>
            </div>

            <div v-else class="text-grey text-center q-pa-md">
              No add-ons selected. Choose a service above to add.
            </div>
          </q-card-section>
        </q-card>
      </q-expansion-item>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { WindowLine, WindowAddon, WindowAddonSeverity } from '@tictacstick/calculation-engine';
import {
  CORE_WINDOW_TYPES,
  EXTENDED_WINDOW_TYPES,
  formatCurrency,
  WINDOW_ADDON_TYPES,
  createWindowAddon,
  calculateAddonCost,
} from '@tictacstick/calculation-engine';
import { useQuoteStore } from '../../stores/quote';
import {
  calculateWindowLineCost,
  useCalculations,
} from '../../composables/useCalculations';

const props = defineProps<{
  line: WindowLine;
}>();

const emit = defineEmits<{
  update: [line: WindowLine];
  remove: [id: string];
}>();

const quoteStore = useQuoteStore();
const { conditions, accessModifiers } = useCalculations();

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

// Condition options - using composable data
const conditionOptions = computed(() =>
  conditions.map(cond => ({
    value: cond.id,
    label: cond.label,
    timeMultiplier: cond.timeMultiplier,
    priceMultiplier: cond.priceMultiplier,
  }))
);

// Access options - using composable data
const accessOptions = computed(() =>
  accessModifiers.map(acc => ({
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

// Calculate line cost using composable helper
const lineCost = computed(() => {
  return calculateWindowLineCost(localLine.value, quoteStore.pricingConfig);
});

function emitUpdate() {
  emit('update', { ...localLine.value });
}

function onHighReachToggle(enabled: boolean) {
  if (!enabled) {
    // Reset high reach pane counts when main toggle is turned off
    localLine.value.insideHighReachCount = 0;
    localLine.value.outsideHighReachCount = 0;
  }
  emitUpdate();
}

function setAllInsideHighReach() {
  localLine.value.insideHighReachCount = localLine.value.panes || 0;
  emitUpdate();
}

function setAllOutsideHighReach() {
  localLine.value.outsideHighReachCount = localLine.value.panes || 0;
  emitUpdate();
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

// ========== ADD-ONS ==========
const showAddons = ref(false);
const selectedAddonType = ref<string | null>(null);

// Addon type options (filter out already added)
const addonTypeOptions = computed(() =>
  WINDOW_ADDON_TYPES.filter(type =>
    !localLine.value.addons?.some(a => a.id === type.id)
  ).map(type => ({
    value: type.id,
    label: `${type.label} (+${formatCurrency(type.basePrice)})`,
    type,
  }))
);

const severityOptions = [
  { value: 'light' as WindowAddonSeverity, label: 'Light (1.0x)' },
  { value: 'medium' as WindowAddonSeverity, label: 'Medium (1.5x)' },
  { value: 'heavy' as WindowAddonSeverity, label: 'Heavy (2.0x)' },
];

function onAddonTypeSelected(typeId: string | null) {
  if (!typeId) return;

  const addonType = WINDOW_ADDON_TYPES.find(t => t.id === typeId);
  if (!addonType) return;

  // Initialize addons array if needed
  if (!localLine.value.addons) {
    localLine.value.addons = [];
  }

  // Create and add the addon
  const newAddon = createWindowAddon(addonType);
  localLine.value.addons.push(newAddon);

  // Reset selection and emit update
  selectedAddonType.value = null;
  emitUpdate();
}

function removeAddon(index: number) {
  if (localLine.value.addons) {
    localLine.value.addons.splice(index, 1);
    emitUpdate();
  }
}

function setAddonAllInside(index: number) {
  if (localLine.value.addons?.[index]) {
    localLine.value.addons[index].insideCount = localLine.value.panes || 0;
    emitUpdate();
  }
}

function setAddonAllOutside(index: number) {
  if (localLine.value.addons?.[index]) {
    localLine.value.addons[index].outsideCount = localLine.value.panes || 0;
    emitUpdate();
  }
}

function calculateSingleAddonCost(addon: WindowAddon): number {
  return calculateAddonCost(addon);
}
</script>

<style scoped>
.line-editor {
  background: rgba(0, 0, 0, 0.02);
}

.body--dark .line-editor {
  background: rgba(255, 255, 255, 0.02);
}

.addon-item {
  background: rgba(0, 128, 0, 0.05);
  border: 1px solid rgba(0, 128, 0, 0.2);
}

.body--dark .addon-item {
  background: rgba(0, 200, 0, 0.08);
  border: 1px solid rgba(0, 200, 0, 0.2);
}

.high-reach-input {
  max-width: 180px;
}
</style>
