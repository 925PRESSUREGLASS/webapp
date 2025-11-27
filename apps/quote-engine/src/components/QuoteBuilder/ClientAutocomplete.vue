<template>
  <q-select
    v-model="selectedClient"
    :options="filteredClients"
    :option-label="(c: Client | null) => c?.name || ''"
    :option-value="(c: Client | null) => c?.id || null"
    use-input
    hide-selected
    fill-input
    input-debounce="200"
    outlined
    dense
    clearable
    :label="label"
    :placeholder="placeholder"
    @filter="filterClients"
    @update:model-value="handleSelect"
    @clear="handleClear"
    @input-value="handleInputValue"
  >
    <template #no-option>
      <q-item>
        <q-item-section class="text-grey">
          {{ searchValue ? 'No clients found' : 'Type to search clients...' }}
        </q-item-section>
      </q-item>
    </template>

    <template #option="{ itemProps, opt }">
      <q-item v-bind="itemProps">
        <q-item-section>
          <q-item-label>{{ opt.name }}</q-item-label>
          <q-item-label v-if="opt.location" caption>
            <q-icon name="location_on" size="xs" /> {{ opt.location }}
          </q-item-label>
        </q-item-section>
        <q-item-section v-if="opt.phone" side>
          <q-item-label caption>{{ opt.phone }}</q-item-label>
        </q-item-section>
      </q-item>
    </template>

    <template #append>
      <q-btn
        v-if="showManageButton"
        flat
        round
        dense
        icon="people"
        @click.stop="$emit('manage-clients')"
      >
        <q-tooltip>Manage Clients</q-tooltip>
      </q-btn>
    </template>
  </q-select>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useClientsStore, type Client } from '../../stores/clients';

const props = withDefaults(defineProps<{
  modelValue?: string;
  label?: string;
  placeholder?: string;
  showManageButton?: boolean;
}>(), {
  modelValue: '',
  label: 'Client Name',
  placeholder: 'Search or enter client name...',
  showManageButton: true,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'client-selected', client: Client): void;
  (e: 'manage-clients'): void;
}>();

const clientsStore = useClientsStore();

const selectedClient = ref<Client | null>(null);
const filteredClients = ref<Client[]>([]);
const searchValue = ref('');

// Initialize with existing value
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    const client = clientsStore.getClientByName(newValue);
    if (client && client.id !== selectedClient.value?.id) {
      selectedClient.value = client;
    }
  } else {
    selectedClient.value = null;
  }
}, { immediate: true });

function filterClients(
  val: string,
  update: (callback: () => void) => void,
  _abort: () => void
) {
  searchValue.value = val;

  update(() => {
    if (!val) {
      filteredClients.value = clientsStore.clients.slice(0, 10);
    } else {
      filteredClients.value = clientsStore.getAutocompleteSuggestions(val, 10);
    }
  });
}

function handleSelect(client: Client | null) {
  if (client) {
    emit('update:modelValue', client.name);
    emit('client-selected', client);
  }
}

function handleClear() {
  selectedClient.value = null;
  emit('update:modelValue', '');
}

function handleInputValue(val: string) {
  // Allow typing custom names (not just selecting from list)
  if (val && !selectedClient.value) {
    emit('update:modelValue', val);
  }
}
</script>
