<template>
  <q-dialog v-model="isOpen">
    <q-card style="min-width: 400px; max-width: 500px;">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Calendar Settings</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section>
        <!-- Default View -->
        <div class="q-mb-lg">
          <div class="text-subtitle2 q-mb-sm">Default View</div>
          <q-btn-toggle
            v-model="localSettings.defaultView"
            toggle-color="primary"
            :options="[
              { label: 'Month', value: 'month' },
              { label: 'Week', value: 'week' },
              { label: 'Day', value: 'day' },
            ]"
            spread
          />
        </div>

        <!-- First Day of Week -->
        <div class="q-mb-lg">
          <div class="text-subtitle2 q-mb-sm">First Day of Week</div>
          <q-select
            v-model="localSettings.firstDayOfWeek"
            :options="firstDayOptions"
            outlined
            dense
            emit-value
            map-options
          />
        </div>

        <!-- Working Hours -->
        <div class="q-mb-lg">
          <div class="text-subtitle2 q-mb-sm">Working Hours</div>
          <div class="row q-gutter-md">
            <div class="col">
              <q-select
                v-model="localSettings.workingHoursStart"
                :options="hourOptions"
                label="Start"
                outlined
                dense
                emit-value
                map-options
              />
            </div>
            <div class="col">
              <q-select
                v-model="localSettings.workingHoursEnd"
                :options="hourOptions"
                label="End"
                outlined
                dense
                emit-value
                map-options
              />
            </div>
          </div>
        </div>

        <!-- Slot Duration -->
        <div class="q-mb-lg">
          <div class="text-subtitle2 q-mb-sm">Time Slot Duration</div>
          <q-select
            v-model="localSettings.slotDuration"
            :options="slotOptions"
            outlined
            dense
            emit-value
            map-options
          />
        </div>

        <!-- Show Week Numbers -->
        <div class="q-mb-md">
          <q-toggle
            v-model="localSettings.showWeekNumbers"
            label="Show Week Numbers"
          />
        </div>
      </q-card-section>

      <q-card-actions align="right" class="q-px-md q-pb-md">
        <q-btn
          flat
          label="Reset to Defaults"
          color="grey"
          @click="resetToDefaults"
        />
        <q-btn
          label="Save"
          color="primary"
          @click="handleSave"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useCalendarStore } from '../../stores/calendar';
import type { CalendarSettings, CalendarView } from '../../types/calendar';

// Props
const props = defineProps<{
  modelValue: boolean;
}>();

// Emits
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'saved'): void;
}>();

// Stores
const calendarStore = useCalendarStore();

// State
const localSettings = ref<CalendarSettings>({
  defaultView: 'month',
  firstDayOfWeek: 0,
  workingHoursStart: 7,
  workingHoursEnd: 19,
  slotDuration: 30,
  showWeekNumbers: false,
});

// Computed
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

// Options
const firstDayOptions = [
  { label: 'Sunday', value: 0 },
  { label: 'Monday', value: 1 },
  { label: 'Saturday', value: 6 },
];

const hourOptions = Array.from({ length: 24 }, (_, i) => ({
  label: formatHour(i),
  value: i,
}));

const slotOptions = [
  { label: '15 minutes', value: 15 },
  { label: '30 minutes', value: 30 },
  { label: '1 hour', value: 60 },
];

// Watch for dialog open
watch(() => props.modelValue, (opened) => {
  if (opened) {
    // Load current settings
    localSettings.value = { ...calendarStore.settings };
  }
});

// Methods
function formatHour(hour: number): string {
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h = hour % 12 || 12;
  return `${h}:00 ${ampm}`;
}

function resetToDefaults() {
  localSettings.value = {
    defaultView: 'month' as CalendarView,
    firstDayOfWeek: 0,
    workingHoursStart: 7,
    workingHoursEnd: 19,
    slotDuration: 30,
    showWeekNumbers: false,
  };
}

function handleSave() {
  // Validate working hours
  if (localSettings.value.workingHoursStart >= localSettings.value.workingHoursEnd) {
    return; // Invalid range
  }
  
  calendarStore.updateSettings(localSettings.value);
  emit('saved');
  isOpen.value = false;
}
</script>
