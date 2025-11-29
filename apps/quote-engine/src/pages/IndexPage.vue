<template>
  <q-page class="q-pa-md">
    <div class="row justify-center">
      <div class="col-12 col-md-10 col-lg-8">
        <!-- Build: 2025-11-30T18:00 -->
        <h4 class="q-my-md">Welcome to TicTacStick v2.0</h4>
        
        <q-card class="q-mb-md">
          <q-card-section>
            <div class="text-h6">Quick Actions</div>
          </q-card-section>
          
          <q-card-actions align="around">
            <q-btn
              color="primary"
              label="New Quote"
              icon="add"
              to="/quote"
            />
            <q-btn
              color="secondary"
              label="View Invoices"
              icon="receipt"
              to="/invoices"
            />
          </q-card-actions>
        </q-card>

        <q-card class="q-mb-md">
          <q-card-section>
            <div class="text-h6">Recent Activity</div>
            <div class="text-body2 text-grey q-mt-sm">
              No recent activity. Start by creating a new quote!
            </div>
          </q-card-section>
        </q-card>

        <q-card>
          <q-card-section>
            <div class="text-h6">About v2.0</div>
            <div class="text-body2 q-mt-sm">
              TicTacStick v2.0 is a complete rebuild using modern web technologies:
            </div>
            <q-list dense>
              <q-item>
                <q-item-section avatar>
                  <q-icon name="check_circle" color="positive" />
                </q-item-section>
                <q-item-section>Vue 3 with Composition API</q-item-section>
              </q-item>
              <q-item>
                <q-item-section avatar>
                  <q-icon name="check_circle" color="positive" />
                </q-item-section>
                <q-item-section>Quasar Framework for mobile-first UI</q-item-section>
              </q-item>
              <q-item>
                <q-item-section avatar>
                  <q-icon name="check_circle" color="positive" />
                </q-item-section>
                <q-item-section>TypeScript for type safety</q-item-section>
              </q-item>
              <q-item>
                <q-item-section avatar>
                  <q-icon name="check_circle" color="positive" />
                </q-item-section>
                <q-item-section>PWA with offline support</q-item-section>
              </q-item>
              <q-item>
                <q-item-section avatar>
                  <q-icon name="check_circle" color="positive" />
                </q-item-section>
                <q-item-section>Capacitor for native app builds</q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
/**
 * Index Page
 * Landing page for the TicTacStick v2.0 application
 */
</script>
