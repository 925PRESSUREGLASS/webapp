<template>
  <q-chip
    :color="isOnline ? 'positive' : 'warning'"
    :text-color="isOnline ? 'white' : 'dark'"
    dense
    icon-right
    :icon="isOnline ? 'cloud_done' : 'cloud_off'"
    size="sm"
    class="offline-indicator"
  >
    {{ isOnline ? 'Online' : 'Offline' }}
  </q-chip>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

/**
 * Offline Indicator Component
 * Shows online/offline status with automatic detection
 */

const isOnline = ref(navigator.onLine);

function updateOnlineStatus() {
  isOnline.value = navigator.onLine;
}

onMounted(() => {
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
});

onUnmounted(() => {
  window.removeEventListener('online', updateOnlineStatus);
  window.removeEventListener('offline', updateOnlineStatus);
});
</script>

<style scoped>
.offline-indicator {
  margin-right: 8px;
}
</style>
