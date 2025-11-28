<template>
  <div class="job-timer" :class="timerClass">
    <q-icon :name="icon" size="sm" class="q-mr-xs" />
    <span class="timer-display">{{ formattedTime }}</span>
    <template v-if="showEstimate && estimatedMinutes && elapsed > 0">
      <span class="timer-estimate" :class="estimateClass">
        / {{ formattedEstimate }}
      </span>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';

const props = withDefaults(defineProps<{
  startTime?: string;
  endTime?: string;
  status: 'scheduled' | 'in-progress' | 'paused' | 'completed' | 'invoiced' | 'cancelled';
  estimatedMinutes?: number;
  showEstimate?: boolean;
}>(), {
  showEstimate: false,
});

const elapsed = ref(0);
let intervalId: ReturnType<typeof setInterval> | null = null;

const isRunning = computed(() => props.status === 'in-progress');
const isPaused = computed(() => props.status === 'paused');
const isComplete = computed(() => ['completed', 'invoiced'].includes(props.status));
const isOvertime = computed(() => 
  props.estimatedMinutes && elapsed.value > props.estimatedMinutes
);

const icon = computed(() => {
  if (isRunning.value) return 'timer';
  if (isPaused.value) return 'pause_circle';
  if (isComplete.value) return 'check_circle';
  return 'schedule';
});

const timerClass = computed(() => ({
  'timer-running': isRunning.value,
  'timer-paused': isPaused.value,
  'timer-complete': isComplete.value,
  'timer-overtime': isRunning.value && isOvertime.value,
}));

const estimateClass = computed(() => ({
  'text-positive': !isOvertime.value,
  'text-negative': isOvertime.value,
}));

const formattedTime = computed(() => {
  const totalMinutes = elapsed.value;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
});

const formattedEstimate = computed(() => {
  if (!props.estimatedMinutes) return '';
  const hours = Math.floor(props.estimatedMinutes / 60);
  const minutes = props.estimatedMinutes % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
});

function calculateElapsed() {
  if (!props.startTime) {
    elapsed.value = 0;
    return;
  }
  
  const start = new Date(props.startTime).getTime();
  const end = props.endTime 
    ? new Date(props.endTime).getTime() 
    : Date.now();
  
  elapsed.value = Math.max(0, Math.round((end - start) / 60000));
}

function startTimer() {
  if (intervalId) return;
  calculateElapsed();
  intervalId = setInterval(calculateElapsed, 60000); // Update every minute
}

function stopTimer() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

watch(() => props.status, (newStatus) => {
  if (newStatus === 'in-progress') {
    startTimer();
  } else {
    stopTimer();
    calculateElapsed();
  }
}, { immediate: true });

watch(() => props.startTime, calculateElapsed);
watch(() => props.endTime, calculateElapsed);

onMounted(() => {
  if (isRunning.value) {
    startTimer();
  } else {
    calculateElapsed();
  }
});

onUnmounted(() => {
  stopTimer();
});
</script>

<style scoped>
.job-timer {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 16px;
  font-weight: 600;
  font-size: 0.9rem;
  background: var(--q-grey-3);
  color: var(--q-grey-8);
}

.timer-running {
  background: rgba(76, 175, 80, 0.15);
  color: #2e7d32;
  animation: pulse 2s ease-in-out infinite;
}

.timer-paused {
  background: rgba(255, 152, 0, 0.15);
  color: #e65100;
}

.timer-complete {
  background: rgba(33, 150, 243, 0.15);
  color: #1565c0;
}

.timer-overtime {
  background: rgba(244, 67, 54, 0.15);
  color: #c62828;
}

.timer-display {
  font-variant-numeric: tabular-nums;
}

.timer-estimate {
  margin-left: 4px;
  font-weight: 500;
  opacity: 0.8;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
</style>
