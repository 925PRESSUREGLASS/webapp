<template>
  <q-dialog v-model="isOpen" persistent>
    <q-card style="min-width: 350px; max-width: 500px;">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">
          {{ isReschedule ? 'Reschedule Job' : 'Schedule Job' }}
        </div>
        <q-space />
        <q-btn icon="close" flat round dense @click="handleClose" />
      </q-card-section>

      <q-card-section>
        <!-- Job Info -->
        <div v-if="job" class="q-mb-md">
          <div class="text-subtitle2 text-grey-8">{{ job.jobNumber }}</div>
          <div class="text-body2">{{ job.client.name }}</div>
          <div class="text-caption text-grey-6">{{ job.client.address }}</div>
        </div>

        <q-separator class="q-mb-md" />

        <!-- Date Selection -->
        <div class="q-mb-md">
          <div class="text-subtitle2 q-mb-sm">Date</div>
          <q-input
            v-model="selectedDate"
            type="date"
            outlined
            dense
            :min="minDate"
            :rules="[val => !!val || 'Date is required']"
          >
            <template #prepend>
              <q-icon name="event" />
            </template>
          </q-input>
        </div>

        <!-- Time Selection -->
        <div class="q-mb-md">
          <div class="text-subtitle2 q-mb-sm">Time</div>
          <q-input
            v-model="selectedTime"
            type="time"
            outlined
            dense
          >
            <template #prepend>
              <q-icon name="schedule" />
            </template>
          </q-input>
        </div>

        <!-- Duration Selection -->
        <div class="q-mb-md">
          <div class="text-subtitle2 q-mb-sm">Estimated Duration</div>
          <q-select
            v-model="selectedDuration"
            :options="durationOptions"
            outlined
            dense
            emit-value
            map-options
          >
            <template #prepend>
              <q-icon name="timelapse" />
            </template>
          </q-select>
        </div>

        <!-- Conflict Warning -->
        <q-banner
          v-if="hasConflict"
          class="bg-warning text-white q-mb-md"
          rounded
        >
          <template #avatar>
            <q-icon name="warning" />
          </template>
          <div class="text-subtitle2">Schedule Conflict</div>
          <div class="text-caption">
            There is another job scheduled for this time slot. 
            You can still schedule, but be aware of the overlap.
          </div>
        </q-banner>
      </q-card-section>

      <q-card-actions align="right" class="q-px-md q-pb-md">
        <q-btn
          flat
          label="Cancel"
          color="grey"
          @click="handleClose"
        />
        <q-btn
          :label="isReschedule ? 'Reschedule' : 'Schedule'"
          color="primary"
          :loading="loading"
          :disable="!isValid"
          @click="handleSave"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useCalendarStore } from '../../stores/calendar';
import { useJobStore } from '../../stores/jobs';
import type { Job } from '@tictacstick/calculation-engine';

// Props
const props = defineProps<{
  modelValue: boolean;
  jobId?: string;
  initialDate?: string;
  initialTime?: string;
}>();

// Emits
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'scheduled', data: { date: string; time?: string; duration: number }): void;
  (e: 'rescheduled', data: { date: string; time?: string; duration: number }): void;
}>();

// Stores
const calendarStore = useCalendarStore();
const jobStore = useJobStore();

// State
const loading = ref(false);
const selectedDate = ref('');
const selectedTime = ref('');
const selectedDuration = ref(120);

// Computed
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const job = computed((): Job | null => {
  if (!props.jobId) return null;
  return jobStore.getJob(props.jobId);
});

const isReschedule = computed(() => {
  return job.value?.status === 'scheduled';
});

const minDate = computed(() => {
  const today = new Date();
  return today.toISOString().split('T')[0];
});

const durationOptions = [
  { label: '30 minutes', value: 30 },
  { label: '1 hour', value: 60 },
  { label: '1.5 hours', value: 90 },
  { label: '2 hours', value: 120 },
  { label: '2.5 hours', value: 150 },
  { label: '3 hours', value: 180 },
  { label: '4 hours', value: 240 },
  { label: '5 hours', value: 300 },
  { label: '6 hours', value: 360 },
  { label: 'Full day (8 hours)', value: 480 },
];

const hasConflict = computed(() => {
  if (!selectedDate.value || !selectedTime.value) return false;
  return calendarStore.hasConflict(
    selectedDate.value,
    selectedTime.value,
    selectedDuration.value,
    job.value ? `job-${job.value.id}` : undefined,
  );
});

const isValid = computed(() => {
  return !!selectedDate.value;
});

// Watch for initial values
watch(() => props.modelValue, (opened) => {
  if (opened) {
    // Set initial values
    if (props.initialDate) {
      selectedDate.value = props.initialDate;
    } else if (job.value) {
      selectedDate.value = job.value.schedule.scheduledDate;
    } else {
      selectedDate.value = new Date().toISOString().split('T')[0];
    }

    if (props.initialTime) {
      selectedTime.value = props.initialTime;
    } else if (job.value?.schedule.scheduledTime) {
      selectedTime.value = job.value.schedule.scheduledTime;
    } else {
      selectedTime.value = '09:00';
    }

    if (job.value?.schedule.estimatedDuration) {
      selectedDuration.value = job.value.schedule.estimatedDuration;
    } else {
      selectedDuration.value = 120;
    }
  }
}, { immediate: true });

// Methods
function handleClose() {
  isOpen.value = false;
}

async function handleSave() {
  if (!isValid.value) return;

  loading.value = true;

  try {
    const data = {
      date: selectedDate.value,
      time: selectedTime.value || undefined,
      duration: selectedDuration.value,
    };

    if (isReschedule.value && job.value) {
      // Reschedule existing job
      const success = jobStore.rescheduleJob(
        job.value.id,
        data.date,
        data.time,
        data.duration,
      );
      
      if (success) {
        emit('rescheduled', data);
        isOpen.value = false;
      }
    } else {
      // New scheduling (emit for parent to handle)
      emit('scheduled', data);
      isOpen.value = false;
    }
  } finally {
    loading.value = false;
  }
}
</script>
