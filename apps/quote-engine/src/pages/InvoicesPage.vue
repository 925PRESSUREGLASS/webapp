<template>
  <q-page class="invoices-page q-pa-md">
    <!-- Header with Stats -->
    <div class="row q-mb-md items-center">
      <div class="col">
        <h4 class="q-ma-none">Invoices</h4>
      </div>
      <div class="col-auto">
        <q-btn
          color="primary"
          icon="receipt"
          label="New Invoice"
          @click="showNewInvoiceDialog = true"
        />
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-6 col-sm-4 col-md-2">
        <q-card class="stat-card">
          <q-card-section class="text-center">
            <div class="text-h6 text-weight-bold">{{ invoiceStore.stats.total }}</div>
            <div class="text-caption text-grey">Total</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-6 col-sm-4 col-md-2">
        <q-card class="stat-card bg-grey-2">
          <q-card-section class="text-center">
            <div class="text-h6 text-weight-bold">{{ invoiceStore.stats.draft }}</div>
            <div class="text-caption text-grey">Draft</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-6 col-sm-4 col-md-2">
        <q-card class="stat-card bg-info text-white">
          <q-card-section class="text-center">
            <div class="text-h6 text-weight-bold">{{ invoiceStore.stats.sent }}</div>
            <div class="text-caption">Sent</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-6 col-sm-4 col-md-2">
        <q-card class="stat-card bg-positive text-white">
          <q-card-section class="text-center">
            <div class="text-h6 text-weight-bold">{{ invoiceStore.stats.paid }}</div>
            <div class="text-caption">Paid</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-6 col-sm-4 col-md-2">
        <q-card class="stat-card bg-negative text-white">
          <q-card-section class="text-center">
            <div class="text-h6 text-weight-bold">{{ invoiceStore.stats.overdue }}</div>
            <div class="text-caption">Overdue</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-6 col-sm-4 col-md-2">
        <q-card class="stat-card">
          <q-card-section class="text-center">
            <div class="text-h6 text-weight-bold text-positive">${{ formatMoney(invoiceStore.stats.totalPaid) }}</div>
            <div class="text-caption text-grey">Collected</div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Filters and Search -->
    <q-card class="q-mb-md">
      <q-card-section>
        <div class="row q-col-gutter-md items-center">
          <div class="col-12 col-sm-4">
            <q-input
              v-model="searchQuery"
              dense
              outlined
              placeholder="Search invoices..."
              clearable
            >
              <template #prepend>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>
          <div class="col-12 col-sm-3">
            <q-select
              v-model="statusFilter"
              :options="statusOptions"
              dense
              outlined
              emit-value
              map-options
              label="Status"
            />
          </div>
          <div class="col-12 col-sm-3">
            <q-select
              v-model="sortBy"
              :options="sortOptions"
              dense
              outlined
              emit-value
              map-options
              label="Sort by"
            />
          </div>
          <div class="col-auto">
            <q-btn-group flat>
              <q-btn
                :flat="viewMode !== 'list'"
                :outline="viewMode === 'list'"
                icon="view_list"
                @click="viewMode = 'list'"
              />
              <q-btn
                :flat="viewMode !== 'grid'"
                :outline="viewMode === 'grid'"
                icon="grid_view"
                @click="viewMode = 'grid'"
              />
            </q-btn-group>
          </div>
          <div class="col-auto">
            <q-btn flat icon="more_vert">
              <q-menu>
                <q-list>
                  <q-item clickable v-close-popup @click="showSettingsDialog = true">
                    <q-item-section avatar><q-icon name="settings" /></q-item-section>
                    <q-item-section>Settings</q-item-section>
                  </q-item>
                  <q-item clickable v-close-popup @click="checkOverdue">
                    <q-item-section avatar><q-icon name="update" /></q-item-section>
                    <q-item-section>Check Overdue</q-item-section>
                  </q-item>
                  <q-item clickable v-close-popup @click="showAgingReport = true">
                    <q-item-section avatar><q-icon name="assessment" /></q-item-section>
                    <q-item-section>Aging Report</q-item-section>
                  </q-item>
                  <q-separator />
                  <q-item clickable v-close-popup @click="exportAll">
                    <q-item-section avatar><q-icon name="file_download" /></q-item-section>
                    <q-item-section>Export All</q-item-section>
                  </q-item>
                  <q-item clickable v-close-popup @click="showImportDialog = true">
                    <q-item-section avatar><q-icon name="file_upload" /></q-item-section>
                    <q-item-section>Import</q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Invoice List -->
    <q-card v-if="filteredInvoices.length > 0">
      <!-- List View -->
      <q-list separator v-if="viewMode === 'list'">
        <q-item
          v-for="invoice in paginatedInvoices"
          :key="invoice.id"
          clickable
          @click="selectInvoice(invoice)"
        >
          <q-item-section avatar>
            <q-avatar :color="INVOICE_STATUSES[invoice.status].color" text-color="white" size="40px">
              <q-icon :name="INVOICE_STATUSES[invoice.status].icon" />
            </q-avatar>
          </q-item-section>

          <q-item-section>
            <q-item-label class="text-weight-medium">{{ invoice.invoiceNumber }}</q-item-label>
            <q-item-label caption>{{ invoice.clientName }}</q-item-label>
          </q-item-section>

          <q-item-section side>
            <q-item-label class="text-weight-bold">${{ formatMoney(invoice.total) }}</q-item-label>
            <q-item-label caption>
              Due: {{ formatDate(invoice.dueDate) }}
            </q-item-label>
          </q-item-section>

          <q-item-section side v-if="invoice.balance > 0">
            <q-badge :color="invoice.status === 'overdue' ? 'negative' : 'warning'">
              ${{ formatMoney(invoice.balance) }} due
            </q-badge>
          </q-item-section>

          <q-item-section side>
            <q-btn flat dense icon="more_vert" @click.stop>
              <q-menu>
                <q-list dense>
                  <q-item clickable v-close-popup @click="viewInvoice(invoice)">
                    <q-item-section>View</q-item-section>
                  </q-item>
                  <q-item clickable v-close-popup @click="editInvoice(invoice)">
                    <q-item-section>Edit</q-item-section>
                  </q-item>
                  <q-item clickable v-close-popup @click="showPaymentDialog(invoice)" v-if="invoice.balance > 0">
                    <q-item-section>Record Payment</q-item-section>
                  </q-item>
                  <q-separator />
                  <q-item clickable v-close-popup @click="printInvoice(invoice)">
                    <q-item-section>Print / PDF</q-item-section>
                  </q-item>
                  <q-item clickable v-close-popup @click="emailInvoice(invoice)">
                    <q-item-section>Email</q-item-section>
                  </q-item>
                  <q-separator />
                  <q-item clickable v-close-popup @click="confirmDelete(invoice)" class="text-negative">
                    <q-item-section>Delete</q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>
          </q-item-section>
        </q-item>
      </q-list>

      <!-- Grid View -->
      <div v-else class="row q-pa-md q-col-gutter-md">
        <div
          v-for="invoice in paginatedInvoices"
          :key="invoice.id"
          class="col-12 col-sm-6 col-md-4"
        >
          <q-card class="invoice-card cursor-pointer" @click="selectInvoice(invoice)">
            <q-card-section>
              <div class="row items-center justify-between q-mb-sm">
                <span class="text-h6">{{ invoice.invoiceNumber }}</span>
                <q-badge :color="INVOICE_STATUSES[invoice.status].color">
                  {{ INVOICE_STATUSES[invoice.status].label }}
                </q-badge>
              </div>
              <div class="text-subtitle2">{{ invoice.clientName }}</div>
              <div class="text-caption text-grey">{{ invoice.clientLocation }}</div>
            </q-card-section>
            <q-separator />
            <q-card-section>
              <div class="row justify-between">
                <div>
                  <div class="text-caption text-grey">Total</div>
                  <div class="text-h6 text-weight-bold">${{ formatMoney(invoice.total) }}</div>
                </div>
                <div class="text-right" v-if="invoice.balance > 0">
                  <div class="text-caption text-grey">Balance</div>
                  <div class="text-subtitle1 text-negative">${{ formatMoney(invoice.balance) }}</div>
                </div>
                <div class="text-right" v-else>
                  <div class="text-caption text-grey">Paid</div>
                  <div class="text-subtitle1 text-positive">Full</div>
                </div>
              </div>
            </q-card-section>
            <q-card-section class="q-pt-none">
              <div class="text-caption text-grey">
                Due: {{ formatDate(invoice.dueDate) }}
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Pagination -->
      <q-card-section v-if="totalPages > 1" class="flex flex-center">
        <q-pagination
          v-model="currentPage"
          :max="totalPages"
          direction-links
          boundary-links
        />
      </q-card-section>
    </q-card>

    <!-- Empty State -->
    <q-card v-else>
      <q-card-section class="text-center q-pa-xl">
        <q-icon name="receipt_long" size="64px" color="grey-4" />
        <div class="text-h6 text-grey q-mt-md">No invoices found</div>
        <div class="text-caption text-grey q-mb-md">
          {{ searchQuery || statusFilter !== 'all' ? 'Try adjusting your filters' : 'Create your first invoice' }}
        </div>
        <q-btn
          v-if="!searchQuery && statusFilter === 'all'"
          color="primary"
          icon="add"
          label="Create Invoice"
          @click="showNewInvoiceDialog = true"
        />
      </q-card-section>
    </q-card>

    <!-- Invoice Detail Dialog -->
    <q-dialog v-model="showDetailDialog" maximized>
      <q-card v-if="selectedInvoice">
        <q-toolbar class="bg-primary text-white">
          <q-btn flat round icon="arrow_back" @click="showDetailDialog = false" />
          <q-toolbar-title>{{ selectedInvoice.invoiceNumber }}</q-toolbar-title>
          <q-badge :color="INVOICE_STATUSES[selectedInvoice.status].color" class="q-mr-sm">
            {{ INVOICE_STATUSES[selectedInvoice.status].label }}
          </q-badge>
          <q-btn flat round icon="print" @click="printInvoice(selectedInvoice)" />
          <q-btn flat round icon="edit" @click="editInvoice(selectedInvoice)" />
        </q-toolbar>

        <q-card-section>
          <div class="row q-col-gutter-md">
            <!-- Client Info -->
            <div class="col-12 col-md-6">
              <h6 class="q-ma-none q-mb-sm">Client</h6>
              <div class="text-subtitle1">{{ selectedInvoice.clientName }}</div>
              <div class="text-body2" v-if="selectedInvoice.clientLocation">{{ selectedInvoice.clientLocation }}</div>
              <div class="text-body2" v-if="selectedInvoice.clientEmail">{{ selectedInvoice.clientEmail }}</div>
              <div class="text-body2" v-if="selectedInvoice.clientPhone">{{ selectedInvoice.clientPhone }}</div>
            </div>

            <!-- Invoice Info -->
            <div class="col-12 col-md-6">
              <h6 class="q-ma-none q-mb-sm">Invoice Details</h6>
              <div class="text-body2">
                <strong>Date:</strong> {{ formatDate(selectedInvoice.invoiceDate) }}
              </div>
              <div class="text-body2">
                <strong>Due:</strong> {{ formatDate(selectedInvoice.dueDate) }}
              </div>
              <div class="text-body2" v-if="selectedInvoice.quoteTitle">
                <strong>Quote:</strong> {{ selectedInvoice.quoteTitle }}
              </div>
            </div>
          </div>
        </q-card-section>

        <q-separator />

        <!-- Line Items -->
        <q-card-section>
          <h6 class="q-ma-none q-mb-md">Line Items</h6>
          <q-list separator>
            <q-item v-for="item in selectedInvoice.lineItems" :key="item.id">
              <q-item-section>
                <q-item-label>{{ item.description }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-item-label>${{ formatMoney(item.amount) }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>

        <q-separator />

        <!-- Totals -->
        <q-card-section>
          <div class="row justify-end">
            <div class="col-12 col-sm-6 col-md-4">
              <div class="row q-mb-xs">
                <div class="col">Subtotal</div>
                <div class="col-auto text-right">${{ formatMoney(selectedInvoice.subtotal) }}</div>
              </div>
              <div class="row q-mb-xs">
                <div class="col">GST (10%)</div>
                <div class="col-auto text-right">${{ formatMoney(selectedInvoice.gst) }}</div>
              </div>
              <q-separator class="q-my-sm" />
              <div class="row text-h6">
                <div class="col">Total</div>
                <div class="col-auto text-right">${{ formatMoney(selectedInvoice.total) }}</div>
              </div>
              <div class="row q-mt-sm" v-if="selectedInvoice.amountPaid > 0">
                <div class="col text-positive">Paid</div>
                <div class="col-auto text-right text-positive">${{ formatMoney(selectedInvoice.amountPaid) }}</div>
              </div>
              <div class="row" v-if="selectedInvoice.balance > 0">
                <div class="col text-negative text-weight-bold">Balance Due</div>
                <div class="col-auto text-right text-negative text-weight-bold">${{ formatMoney(selectedInvoice.balance) }}</div>
              </div>
            </div>
          </div>
        </q-card-section>

        <!-- Payments -->
        <q-card-section v-if="selectedInvoice.payments.length > 0">
          <h6 class="q-ma-none q-mb-md">Payments</h6>
          <q-list separator>
            <q-item v-for="payment in selectedInvoice.payments" :key="payment.id">
              <q-item-section avatar>
                <q-icon name="payment" color="positive" />
              </q-item-section>
              <q-item-section>
                <q-item-label>${{ formatMoney(payment.amount) }}</q-item-label>
                <q-item-label caption>
                  {{ formatDate(payment.date) }} - {{ payment.method }}
                  <span v-if="payment.reference"> ({{ payment.reference }})</span>
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-btn flat dense icon="delete" color="negative" @click="confirmRemovePayment(payment)" />
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>

        <!-- Actions -->
        <q-card-actions align="right" class="q-pa-md">
          <q-btn-dropdown
            color="grey"
            label="Change Status"
            v-if="selectedInvoice.status !== 'paid'"
          >
            <q-list>
              <q-item
                v-for="(status, key) in INVOICE_STATUSES"
                :key="key"
                clickable
                v-close-popup
                @click="changeStatus(key as InvoiceStatus)"
                :disable="key === selectedInvoice.status"
              >
                <q-item-section avatar>
                  <q-icon :name="status.icon" :color="status.color" />
                </q-item-section>
                <q-item-section>{{ status.label }}</q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>
          <q-btn
            color="primary"
            icon="payment"
            label="Record Payment"
            @click="showPaymentDialog(selectedInvoice)"
            v-if="selectedInvoice.balance > 0"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Payment Dialog -->
    <q-dialog v-model="showPayment" persistent>
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">Record Payment</div>
          <div class="text-caption text-grey" v-if="paymentInvoice">
            Invoice: {{ paymentInvoice.invoiceNumber }} | Balance: ${{ formatMoney(paymentInvoice.balance) }}
          </div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-input
            v-model.number="paymentForm.amount"
            type="number"
            label="Amount"
            prefix="$"
            outlined
            :rules="[val => val > 0 || 'Enter a positive amount']"
          />
          <q-select
            v-model="paymentForm.method"
            :options="paymentMethods"
            label="Payment Method"
            outlined
            emit-value
            map-options
            class="q-mt-md"
          />
          <q-input
            v-model="paymentForm.reference"
            label="Reference (optional)"
            outlined
            class="q-mt-md"
          />
          <q-input
            v-model="paymentForm.notes"
            label="Notes (optional)"
            outlined
            type="textarea"
            rows="2"
            class="q-mt-md"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" @click="showPayment = false" />
          <q-btn color="primary" label="Record" @click="savePayment" :disable="paymentForm.amount <= 0" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- New Invoice Dialog -->
    <q-dialog v-model="showNewInvoiceDialog" persistent>
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">New Invoice</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-input
            v-model="newInvoiceForm.clientName"
            label="Client Name"
            outlined
            class="q-mb-md"
          />
          <q-input
            v-model="newInvoiceForm.clientLocation"
            label="Location"
            outlined
            class="q-mb-md"
          />
          <q-input
            v-model="newInvoiceForm.clientEmail"
            label="Email"
            type="email"
            outlined
            class="q-mb-md"
          />
          <q-input
            v-model="newInvoiceForm.clientPhone"
            label="Phone"
            outlined
            class="q-mb-md"
          />
          <q-input
            v-model.number="newInvoiceForm.subtotal"
            label="Subtotal"
            type="number"
            prefix="$"
            outlined
          />
          <div class="text-caption text-grey q-mt-sm">
            GST (10%): ${{ formatMoney(newInvoiceForm.subtotal * 0.1) }} |
            Total: ${{ formatMoney(newInvoiceForm.subtotal * 1.1) }}
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" @click="showNewInvoiceDialog = false" />
          <q-btn color="primary" label="Create" @click="createNewInvoice" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Settings Dialog -->
    <q-dialog v-model="showSettingsDialog" persistent>
      <q-card style="min-width: 450px; max-width: 90vw;">
        <q-card-section>
          <div class="text-h6">Invoice Settings</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div class="row q-col-gutter-md">
            <div class="col-6">
              <q-input v-model="settingsForm.invoicePrefix" label="Invoice Prefix" outlined dense />
            </div>
            <div class="col-6">
              <q-input v-model.number="settingsForm.nextInvoiceNumber" label="Next Number" type="number" outlined dense />
            </div>
            <div class="col-12">
              <q-input v-model.number="settingsForm.paymentTermsDays" label="Payment Terms (days)" type="number" outlined dense />
            </div>
          </div>

          <q-separator class="q-my-md" />
          <div class="text-subtitle2 q-mb-sm">Business Details</div>

          <div class="row q-col-gutter-md">
            <div class="col-12">
              <q-input v-model="settingsForm.businessName" label="Business Name" outlined dense />
            </div>
            <div class="col-12">
              <q-input v-model="settingsForm.businessAddress" label="Address" outlined dense />
            </div>
            <div class="col-6">
              <q-input v-model="settingsForm.businessPhone" label="Phone" outlined dense />
            </div>
            <div class="col-6">
              <q-input v-model="settingsForm.businessEmail" label="Email" outlined dense />
            </div>
            <div class="col-12">
              <q-input v-model="settingsForm.abn" label="ABN" outlined dense />
            </div>
          </div>

          <q-separator class="q-my-md" />
          <div class="text-subtitle2 q-mb-sm">Bank Details (for invoices)</div>

          <div class="row q-col-gutter-md">
            <div class="col-12">
              <q-input v-model="settingsForm.bankName" label="Bank Name" outlined dense />
            </div>
            <div class="col-12">
              <q-input v-model="settingsForm.accountName" label="Account Name" outlined dense />
            </div>
            <div class="col-6">
              <q-input v-model="settingsForm.bsb" label="BSB" outlined dense />
            </div>
            <div class="col-6">
              <q-input v-model="settingsForm.accountNumber" label="Account Number" outlined dense />
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" @click="showSettingsDialog = false" />
          <q-btn color="primary" label="Save" @click="saveSettings" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Aging Report Dialog -->
    <q-dialog v-model="showAgingReport">
      <q-card style="min-width: 500px; max-width: 90vw;">
        <q-card-section>
          <div class="text-h6">Aging Report</div>
        </q-card-section>

        <q-card-section>
          <q-list separator>
            <q-item>
              <q-item-section>
                <q-item-label class="text-weight-medium">Current (Not Due)</q-item-label>
                <q-item-label caption>{{ agingReport.current.length }} invoices</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-item-label class="text-h6">${{ formatMoney(sumBalance(agingReport.current)) }}</q-item-label>
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section>
                <q-item-label class="text-weight-medium text-warning">1-30 Days Overdue</q-item-label>
                <q-item-label caption>{{ agingReport.days30.length }} invoices</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-item-label class="text-h6 text-warning">${{ formatMoney(sumBalance(agingReport.days30)) }}</q-item-label>
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section>
                <q-item-label class="text-weight-medium text-orange">31-60 Days Overdue</q-item-label>
                <q-item-label caption>{{ agingReport.days60.length }} invoices</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-item-label class="text-h6 text-orange">${{ formatMoney(sumBalance(agingReport.days60)) }}</q-item-label>
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section>
                <q-item-label class="text-weight-medium text-negative">90+ Days Overdue</q-item-label>
                <q-item-label caption>{{ agingReport.days90Plus.length }} invoices</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-item-label class="text-h6 text-negative">${{ formatMoney(sumBalance(agingReport.days90Plus)) }}</q-item-label>
              </q-item-section>
            </q-item>
            <q-separator />
            <q-item>
              <q-item-section>
                <q-item-label class="text-weight-bold">Total Outstanding</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-item-label class="text-h5 text-weight-bold">${{ formatMoney(invoiceStore.stats.totalOutstanding) }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Close" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Import Dialog -->
    <q-dialog v-model="showImportDialog">
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">Import Invoices</div>
        </q-card-section>

        <q-card-section>
          <q-file
            v-model="importFile"
            label="Select JSON file"
            outlined
            accept=".json"
          >
            <template #prepend>
              <q-icon name="attach_file" />
            </template>
          </q-file>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn color="primary" label="Import" @click="importData" :disable="!importFile" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Print Dialog -->
    <q-dialog v-model="showPrintDialog" maximized>
      <q-card v-if="printInvoiceData">
        <q-toolbar class="bg-grey-3">
          <q-btn flat round icon="arrow_back" @click="showPrintDialog = false" />
          <q-toolbar-title>Print Invoice</q-toolbar-title>
          <q-btn flat icon="print" label="Print" @click="doPrint" />
        </q-toolbar>
        <q-card-section class="print-container">
          <InvoicePrint :invoice="printInvoiceData" :settings="invoiceStore.getSettings()" />
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Edit Invoice Dialog -->
    <q-dialog v-model="showEditDialog" maximized>
      <q-card v-if="editInvoiceData">
        <q-toolbar class="bg-primary text-white">
          <q-btn flat round icon="close" @click="showEditDialog = false" />
          <q-toolbar-title>Edit Invoice {{ editInvoiceData.invoiceNumber }}</q-toolbar-title>
        </q-toolbar>
        <q-card-section class="edit-container">
          <InvoiceEditor
            :invoice="editInvoiceData"
            @save="handleEditSave"
            @cancel="showEditDialog = false"
          />
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue';
import { useQuasar } from 'quasar';
import {
  useInvoiceStore,
  INVOICE_STATUSES,
  type Invoice,
  type InvoiceSettings,
  type Payment,
} from '../stores/invoices';
import InvoicePrint from '../components/Invoice/InvoicePrint.vue';
import InvoiceEditor from '../components/Invoice/InvoiceEditor.vue';
import type { InvoiceStatus, PaymentMethod } from '@tictacstick/calculation-engine';

const $q = useQuasar();
const invoiceStore = useInvoiceStore();

// Initialize store
onMounted(() => {
  invoiceStore.initialize();
  invoiceStore.checkOverdueInvoices();
});

// View state
const viewMode = ref<'list' | 'grid'>('list');
const searchQuery = ref('');
const statusFilter = ref('all');
const sortBy = ref('date-desc');
const currentPage = ref(1);
const pageSize = 10;

// Dialogs
const showDetailDialog = ref(false);
const showPayment = ref(false);
const showNewInvoiceDialog = ref(false);
const showSettingsDialog = ref(false);
const showAgingReport = ref(false);
const showImportDialog = ref(false);
const showPrintDialog = ref(false);
const showEditDialog = ref(false);
const printInvoiceData = ref<Invoice | null>(null);
const editInvoiceData = ref<Invoice | null>(null);

// Selected items
const selectedInvoice = ref<Invoice | null>(null);
const paymentInvoice = ref<Invoice | null>(null);
const importFile = ref<File | null>(null);

// Forms
const paymentForm = reactive({
  amount: 0,
  method: 'cash' as PaymentMethod,
  reference: '',
  notes: '',
});

const newInvoiceForm = reactive({
  clientName: '',
  clientLocation: '',
  clientEmail: '',
  clientPhone: '',
  subtotal: 0,
});

const settingsForm = reactive<InvoiceSettings>({
  nextInvoiceNumber: 1001,
  invoicePrefix: 'INV-',
  paymentTermsDays: 7,
  bankName: '',
  accountName: '',
  bsb: '',
  accountNumber: '',
  abn: '',
  includeGST: true,
  businessName: '',
  businessAddress: '',
  businessPhone: '',
  businessEmail: '',
});

// Options
const statusOptions = [
  { label: 'All Statuses', value: 'all' },
  { label: 'Draft', value: 'draft' },
  { label: 'Sent', value: 'sent' },
  { label: 'Paid', value: 'paid' },
  { label: 'Overdue', value: 'overdue' },
  { label: 'Cancelled', value: 'cancelled' },
];

const sortOptions = [
  { label: 'Date (Newest)', value: 'date-desc' },
  { label: 'Date (Oldest)', value: 'date-asc' },
  { label: 'Amount (High)', value: 'amount-desc' },
  { label: 'Amount (Low)', value: 'amount-asc' },
  { label: 'Client Name', value: 'client' },
];

const paymentMethods = [
  { label: 'Cash', value: 'cash' },
  { label: 'Card', value: 'card' },
  { label: 'EFTPOS', value: 'eftpos' },
  { label: 'Bank Transfer', value: 'transfer' },
  { label: 'Other', value: 'other' },
];

// Computed
const filteredInvoices = computed(() => {
  let list = invoiceStore.getAll();

  // Search filter
  if (searchQuery.value) {
    list = invoiceStore.search(searchQuery.value);
  }

  // Status filter
  if (statusFilter.value !== 'all') {
    list = list.filter(inv => inv.status === statusFilter.value);
  }

  // Sort
  switch (sortBy.value) {
    case 'date-asc':
      list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      break;
    case 'amount-desc':
      list.sort((a, b) => b.total - a.total);
      break;
    case 'amount-asc':
      list.sort((a, b) => a.total - b.total);
      break;
    case 'client':
      list.sort((a, b) => a.clientName.localeCompare(b.clientName));
      break;
    default:
      // date-desc is default from getAll()
      break;
  }

  return list;
});

const totalPages = computed(() => Math.ceil(filteredInvoices.value.length / pageSize));

const paginatedInvoices = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return filteredInvoices.value.slice(start, start + pageSize);
});

const agingReport = computed(() => invoiceStore.getAgingReport());

// Methods
function formatMoney(value: number): string {
  return value.toFixed(2);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function sumBalance(invoices: Invoice[]): number {
  return invoices.reduce((sum, inv) => sum + inv.balance, 0);
}

function selectInvoice(invoice: Invoice) {
  selectedInvoice.value = invoice;
  showDetailDialog.value = true;
}

function viewInvoice(invoice: Invoice) {
  selectInvoice(invoice);
}

function editInvoice(invoice: Invoice) {
  editInvoiceData.value = invoice;
  showDetailDialog.value = false; // Close detail dialog if open
  showEditDialog.value = true;
}

function handleEditSave(data: Partial<Invoice>) {
  if (!editInvoiceData.value) return;
  
  invoiceStore.updateInvoice(editInvoiceData.value.id, data);
  
  $q.notify({ message: 'Invoice updated', type: 'positive' });
  showEditDialog.value = false;
  
  // Refresh selected invoice if it was the one edited
  if (selectedInvoice.value?.id === editInvoiceData.value.id) {
    selectedInvoice.value = invoiceStore.getInvoice(editInvoiceData.value.id);
  }
  
  editInvoiceData.value = null;
}

function showPaymentDialog(invoice: Invoice) {
  paymentInvoice.value = invoice;
  paymentForm.amount = invoice.balance;
  paymentForm.method = 'cash';
  paymentForm.reference = '';
  paymentForm.notes = '';
  showPayment.value = true;
}

function savePayment() {
  if (!paymentInvoice.value) return;

  invoiceStore.recordPayment(paymentInvoice.value.id, {
    amount: paymentForm.amount,
    method: paymentForm.method,
    reference: paymentForm.reference,
    notes: paymentForm.notes,
  });

  $q.notify({ message: 'Payment recorded', type: 'positive' });
  showPayment.value = false;

  // Refresh selected invoice if viewing
  if (selectedInvoice.value?.id === paymentInvoice.value.id) {
    selectedInvoice.value = invoiceStore.getInvoice(paymentInvoice.value.id);
  }
}

function confirmRemovePayment(payment: Payment) {
  if (!selectedInvoice.value) return;

  $q.dialog({
    title: 'Remove Payment',
    message: `Remove payment of $${formatMoney(payment.amount)}?`,
    cancel: true,
  }).onOk(() => {
    invoiceStore.removePayment(selectedInvoice.value!.id, payment.id);
    selectedInvoice.value = invoiceStore.getInvoice(selectedInvoice.value!.id);
    $q.notify({ message: 'Payment removed', type: 'warning' });
  });
}

function changeStatus(status: InvoiceStatus) {
  if (!selectedInvoice.value) return;

  invoiceStore.updateStatus(selectedInvoice.value.id, status);
  selectedInvoice.value = invoiceStore.getInvoice(selectedInvoice.value.id);
  $q.notify({ message: `Status changed to ${INVOICE_STATUSES[status].label}`, type: 'positive' });
}

function printInvoice(invoice: Invoice) {
  printInvoiceData.value = invoice;
  showPrintDialog.value = true;
}

function doPrint() {
  window.print();
}

function emailInvoice(invoice: Invoice) {
  if (invoice.clientEmail) {
    window.open(`mailto:${invoice.clientEmail}?subject=Invoice ${invoice.invoiceNumber}`);
  } else {
    $q.notify({ message: 'No email address on file', type: 'warning' });
  }
}

function confirmDelete(invoice: Invoice) {
  $q.dialog({
    title: 'Delete Invoice',
    message: `Delete invoice ${invoice.invoiceNumber}? This cannot be undone.`,
    cancel: true,
    color: 'negative',
  }).onOk(() => {
    invoiceStore.deleteInvoice(invoice.id);
    $q.notify({ message: 'Invoice deleted', type: 'warning' });
  });
}

function createNewInvoice() {
  const subtotal = newInvoiceForm.subtotal;
  const gst = subtotal * 0.1;
  const total = subtotal + gst;

  invoiceStore.createInvoice({
    clientName: newInvoiceForm.clientName || 'Unknown Client',
    clientLocation: newInvoiceForm.clientLocation,
    clientEmail: newInvoiceForm.clientEmail,
    clientPhone: newInvoiceForm.clientPhone,
    subtotal,
    gst,
    total,
    lineItems: [{
      id: `item_${Date.now()}`,
      description: 'Services rendered',
      quantity: 1,
      unitPrice: subtotal,
      amount: subtotal,
    }],
  });

  $q.notify({ message: 'Invoice created', type: 'positive' });
  showNewInvoiceDialog.value = false;

  // Reset form
  newInvoiceForm.clientName = '';
  newInvoiceForm.clientLocation = '';
  newInvoiceForm.clientEmail = '';
  newInvoiceForm.clientPhone = '';
  newInvoiceForm.subtotal = 0;
}

function checkOverdue() {
  const count = invoiceStore.checkOverdueInvoices();
  if (count > 0) {
    $q.notify({ message: `${count} invoice(s) marked overdue`, type: 'warning' });
  } else {
    $q.notify({ message: 'No overdue invoices found', type: 'positive' });
  }
}

function saveSettings() {
  invoiceStore.updateSettings(settingsForm);
  $q.notify({ message: 'Settings saved', type: 'positive' });
  showSettingsDialog.value = false;
}

function exportAll() {
  const data = invoiceStore.exportInvoices();
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `invoices-export-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  $q.notify({ message: 'Invoices exported', type: 'positive' });
}

async function importData() {
  if (!importFile.value) return;

  try {
    const text = await importFile.value.text();
    const result = invoiceStore.importInvoices(text);

    if (result.success) {
      $q.notify({ message: `Imported ${result.count} invoices`, type: 'positive' });
    } else {
      $q.notify({ message: result.error || 'Import failed', type: 'negative' });
    }
  } catch (e) {
    $q.notify({ message: 'Failed to read file', type: 'negative' });
  }

  showImportDialog.value = false;
  importFile.value = null;
}

// Load settings into form when dialog opens
function loadSettingsForm() {
  const current = invoiceStore.getSettings();
  Object.assign(settingsForm, current);
}

// Watch for settings dialog to load form
import { watch } from 'vue';
watch(showSettingsDialog, (val) => {
  if (val) loadSettingsForm();
});
</script>

<style scoped>
.invoices-page {
  max-width: 1200px;
  margin: 0 auto;
}

.stat-card {
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.invoice-card {
  transition: box-shadow 0.2s;
}

.invoice-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.print-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.edit-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}

@media print {
  .q-toolbar,
  .q-dialog__backdrop {
    display: none !important;
  }
  
  .print-container {
    padding: 0;
    max-width: 100%;
  }
}
</style>
