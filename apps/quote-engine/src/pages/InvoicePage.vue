<template>
  <q-page class="q-pa-md">
    <div class="row justify-center">
      <div class="col-12 col-md-10 col-lg-8">
        <h4 class="q-my-md">Invoices</h4>

        <q-card>
          <q-card-section>
            <div class="text-h6">Invoice Management</div>
            <div class="text-body2 text-grey q-mt-sm">
              Invoice management coming in a future update. 
              This will include:
            </div>
            <q-list dense class="q-mt-md">
              <q-item>
                <q-item-section avatar>
                  <q-icon name="schedule" color="primary" />
                </q-item-section>
                <q-item-section>Create invoices from quotes</q-item-section>
              </q-item>
              <q-item>
                <q-item-section avatar>
                  <q-icon name="schedule" color="primary" />
                </q-item-section>
                <q-item-section>Track payment status</q-item-section>
              </q-item>
              <q-item>
                <q-item-section avatar>
                  <q-icon name="schedule" color="primary" />
                </q-item-section>
                <q-item-section>Email invoices to clients</q-item-section>
              </q-item>
              <q-item>
                <q-item-section avatar>
                  <q-icon name="schedule" color="primary" />
                </q-item-section>
                <q-item-section>Generate aging reports</q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
          <q-card-actions>
            <q-btn flat color="primary" to="/" label="Create New Quote" />
          </q-card-actions>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
/**
 * Invoice Page
 * Lists and manages invoices
 */
</script>
