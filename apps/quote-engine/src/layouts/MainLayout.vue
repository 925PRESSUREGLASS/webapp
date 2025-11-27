<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />

        <q-toolbar-title>
          TicTacStick
        </q-toolbar-title>

        <OfflineIndicator />

        <q-btn flat round dense icon="more_vert">
          <q-menu>
            <q-list>
              <q-item clickable v-close-popup to="/">
                <q-item-section>New Quote</q-item-section>
              </q-item>
              <q-item clickable v-close-popup to="/quotes">
                <q-item-section>Saved Quotes</q-item-section>
              </q-item>
              <q-item clickable v-close-popup to="/clients">
                <q-item-section>Clients</q-item-section>
              </q-item>
              <q-item clickable v-close-popup to="/invoices">
                <q-item-section>Invoices</q-item-section>
              </q-item>
              <q-item clickable v-close-popup to="/analytics">
                <q-item-section>Analytics</q-item-section>
              </q-item>
              <q-item clickable v-close-popup to="/settings">
                <q-item-section>Settings</q-item-section>
              </q-item>
              <q-separator />
              <q-item clickable v-close-popup @click="toggleDarkMode">
                <q-item-section>
                  {{ $q.dark.isActive ? 'Light Mode' : 'Dark Mode' }}
                </q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      bordered
    >
      <q-list>
        <q-item-label header>
          Navigation
        </q-item-label>

        <q-item clickable v-ripple to="/">
          <q-item-section avatar>
            <q-icon name="add_circle" />
          </q-item-section>
          <q-item-section>New Quote</q-item-section>
        </q-item>

        <q-item clickable v-ripple to="/quotes">
          <q-item-section avatar>
            <q-icon name="description" />
          </q-item-section>
          <q-item-section>Saved Quotes</q-item-section>
        </q-item>

        <q-item clickable v-ripple to="/invoices">
          <q-item-section avatar>
            <q-icon name="receipt" />
          </q-item-section>
          <q-item-section>Invoices</q-item-section>
        </q-item>

        <q-separator />

        <q-item-label header>
          Tools
        </q-item-label>

        <q-item clickable v-ripple to="/clients">
          <q-item-section avatar>
            <q-icon name="people" />
          </q-item-section>
          <q-item-section>Clients</q-item-section>
        </q-item>

        <q-item clickable v-ripple to="/analytics">
          <q-item-section avatar>
            <q-icon name="analytics" />
          </q-item-section>
          <q-item-section>Analytics</q-item-section>
        </q-item>

        <q-separator />

        <q-item clickable v-ripple to="/settings">
          <q-item-section avatar>
            <q-icon name="settings" />
          </q-item-section>
          <q-item-section>Settings</q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>

    <q-footer elevated class="bg-dark text-white q-pa-sm">
      <div class="text-center text-caption">
        TicTacStick v2.0 · © 2025 925 Pressure Glass
      </div>
    </q-footer>
  </q-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useQuasar } from 'quasar';
import OfflineIndicator from '../components/QuoteBuilder/OfflineIndicator.vue';

const $q = useQuasar();
const leftDrawerOpen = ref(false);

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}

function toggleDarkMode() {
  $q.dark.toggle();
}
</script>
