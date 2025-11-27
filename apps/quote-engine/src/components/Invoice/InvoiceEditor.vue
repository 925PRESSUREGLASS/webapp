<template>
  <q-card class="invoice-editor">
    <q-card-section>
      <div class="text-h6">{{ isNew ? 'New Invoice' : 'Edit Invoice' }}</div>
    </q-card-section>

    <q-separator />

    <q-card-section>
      <q-form @submit.prevent="save" ref="formRef">
        <!-- Client Information -->
        <div class="text-subtitle2 q-mb-sm">Client Information</div>
        <div class="row q-col-gutter-md q-mb-md">
          <div class="col-12 col-sm-6">
            <q-input
              v-model="form.clientName"
              label="Client Name *"
              outlined
              dense
              :rules="[val => !!val || 'Client name is required']"
            />
          </div>
          <div class="col-12 col-sm-6">
            <q-input
              v-model="form.clientLocation"
              label="Location"
              outlined
              dense
            />
          </div>
          <div class="col-12 col-sm-6">
            <q-input
              v-model="form.clientEmail"
              label="Email"
              type="email"
              outlined
              dense
              :rules="[val => !val || isValidEmail(val) || 'Invalid email format']"
            />
          </div>
          <div class="col-12 col-sm-6">
            <q-input
              v-model="form.clientPhone"
              label="Phone"
              outlined
              dense
            />
          </div>
        </div>

        <!-- Invoice Details -->
        <div class="text-subtitle2 q-mb-sm">Invoice Details</div>
        <div class="row q-col-gutter-md q-mb-md">
          <div class="col-12 col-sm-4">
            <q-input
              v-model="form.invoiceNumber"
              label="Invoice Number"
              outlined
              dense
              readonly
              hint="Auto-generated"
            />
          </div>
          <div class="col-12 col-sm-4">
            <q-input
              v-model="form.invoiceDate"
              label="Invoice Date"
              type="date"
              outlined
              dense
            />
          </div>
          <div class="col-12 col-sm-4">
            <q-input
              v-model="form.dueDate"
              label="Due Date"
              type="date"
              outlined
              dense
            />
          </div>
        </div>

        <!-- Line Items -->
        <div class="text-subtitle2 q-mb-sm">
          Line Items
          <q-btn
            flat
            dense
            size="sm"
            icon="add"
            color="primary"
            label="Add Item"
            class="q-ml-sm"
            @click="addLineItem"
          />
        </div>

        <q-list separator class="q-mb-md">
          <q-item v-for="(item, index) in form.lineItems" :key="item.id" class="q-pa-none">
            <q-item-section>
              <div class="row q-col-gutter-sm items-center">
                <div class="col-12 col-sm-5">
                  <q-input
                    v-model="item.description"
                    label="Description"
                    outlined
                    dense
                    :rules="[val => !!val || 'Description required']"
                  />
                </div>
                <div class="col-4 col-sm-2">
                  <q-input
                    v-model.number="item.quantity"
                    label="Qty"
                    type="number"
                    outlined
                    dense
                    min="1"
                    @update:model-value="updateLineItemAmount(item)"
                  />
                </div>
                <div class="col-4 col-sm-2">
                  <q-input
                    v-model.number="item.unitPrice"
                    label="Unit Price"
                    type="number"
                    prefix="$"
                    outlined
                    dense
                    @update:model-value="updateLineItemAmount(item)"
                  />
                </div>
                <div class="col-3 col-sm-2">
                  <q-input
                    :model-value="item.amount.toFixed(2)"
                    label="Amount"
                    prefix="$"
                    outlined
                    dense
                    readonly
                    class="text-right"
                  />
                </div>
                <div class="col-1">
                  <q-btn
                    flat
                    dense
                    icon="delete"
                    color="negative"
                    size="sm"
                    @click="removeLineItem(index)"
                    :disable="form.lineItems.length <= 1"
                  />
                </div>
              </div>
            </q-item-section>
          </q-item>
        </q-list>

        <!-- Totals -->
        <div class="row justify-end q-mb-md">
          <div class="col-12 col-sm-6 col-md-4">
            <div class="row q-mb-xs">
              <div class="col">Subtotal</div>
              <div class="col-auto text-right">${{ subtotal.toFixed(2) }}</div>
            </div>
            <div class="row q-mb-xs">
              <div class="col">
                GST (10%)
                <q-toggle
                  v-model="form.includeGST"
                  dense
                  size="xs"
                  class="q-ml-xs"
                />
              </div>
              <div class="col-auto text-right">${{ gst.toFixed(2) }}</div>
            </div>
            <q-separator class="q-my-sm" />
            <div class="row text-h6">
              <div class="col">Total</div>
              <div class="col-auto text-right">${{ total.toFixed(2) }}</div>
            </div>
          </div>
        </div>

        <!-- Notes -->
        <div class="text-subtitle2 q-mb-sm">Notes</div>
        <q-input
          v-model="form.notes"
          type="textarea"
          outlined
          dense
          rows="3"
          placeholder="Additional notes for the invoice..."
          class="q-mb-md"
        />

        <!-- Validation Errors -->
        <q-banner v-if="validationErrors.length > 0" class="bg-negative text-white q-mb-md">
          <template #avatar>
            <q-icon name="error" />
          </template>
          <div v-for="error in validationErrors" :key="error">{{ error }}</div>
        </q-banner>

        <!-- Validation Warnings -->
        <q-banner v-if="validationWarnings.length > 0" class="bg-warning text-dark q-mb-md">
          <template #avatar>
            <q-icon name="warning" />
          </template>
          <div v-for="warning in validationWarnings" :key="warning">{{ warning }}</div>
        </q-banner>
      </q-form>
    </q-card-section>

    <q-separator />

    <q-card-actions align="right">
      <q-btn flat label="Cancel" @click="$emit('cancel')" />
      <q-btn
        color="primary"
        :label="isNew ? 'Create Invoice' : 'Save Changes'"
        @click="save"
        :disable="!isValid"
      />
    </q-card-actions>
  </q-card>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import type { Invoice, InvoiceLineItem } from '../../stores/invoices';

interface LineItemForm {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

interface InvoiceForm {
  clientName: string;
  clientLocation: string;
  clientEmail: string;
  clientPhone: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  lineItems: LineItemForm[];
  includeGST: boolean;
  notes: string;
}

const props = defineProps<{
  invoice?: Invoice | null;
  invoiceNumber?: string;
}>();

const emit = defineEmits<{
  (e: 'save', data: Partial<Invoice>): void;
  (e: 'cancel'): void;
}>();

const formRef = ref();
const isNew = computed(() => !props.invoice);

// Form state
const form = ref<InvoiceForm>({
  clientName: '',
  clientLocation: '',
  clientEmail: '',
  clientPhone: '',
  invoiceNumber: '',
  invoiceDate: new Date().toISOString().slice(0, 10),
  dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  lineItems: [],
  includeGST: true,
  notes: '',
});

// Initialize form from invoice prop
onMounted(() => {
  if (props.invoice) {
    form.value = {
      clientName: props.invoice.clientName,
      clientLocation: props.invoice.clientLocation || '',
      clientEmail: props.invoice.clientEmail || '',
      clientPhone: props.invoice.clientPhone || '',
      invoiceNumber: props.invoice.invoiceNumber,
      invoiceDate: props.invoice.invoiceDate.slice(0, 10),
      dueDate: props.invoice.dueDate.slice(0, 10),
      lineItems: props.invoice.lineItems.map(item => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        amount: item.amount,
      })),
      includeGST: props.invoice.gst > 0,
      notes: props.invoice.notes || '',
    };
  } else {
    // New invoice
    form.value.invoiceNumber = props.invoiceNumber || 'TBD';
    addLineItem();
  }
});

// Computed totals
const subtotal = computed(() => {
  return form.value.lineItems.reduce((sum, item) => sum + item.amount, 0);
});

const gst = computed(() => {
  return form.value.includeGST ? subtotal.value * 0.1 : 0;
});

const total = computed(() => {
  return subtotal.value + gst.value;
});

// Validation
const validationErrors = computed(() => {
  const errors: string[] = [];
  
  if (!form.value.clientName.trim()) {
    errors.push('Client name is required');
  }
  
  if (form.value.lineItems.length === 0) {
    errors.push('At least one line item is required');
  }
  
  const hasEmptyDescription = form.value.lineItems.some(item => !item.description.trim());
  if (hasEmptyDescription) {
    errors.push('All line items must have a description');
  }
  
  const hasZeroAmount = form.value.lineItems.some(item => item.amount <= 0);
  if (hasZeroAmount) {
    errors.push('All line items must have a positive amount');
  }
  
  if (form.value.clientEmail && !isValidEmail(form.value.clientEmail)) {
    errors.push('Invalid email format');
  }
  
  return errors;
});

const validationWarnings = computed(() => {
  const warnings: string[] = [];
  
  const dueDate = new Date(form.value.dueDate);
  const invoiceDate = new Date(form.value.invoiceDate);
  
  if (dueDate < invoiceDate) {
    warnings.push('Due date is before invoice date');
  }
  
  if (dueDate < new Date()) {
    warnings.push('Due date is in the past');
  }
  
  if (subtotal.value === 0) {
    warnings.push('Invoice total is $0.00');
  }
  
  if (!form.value.clientEmail) {
    warnings.push('No email address - invoice cannot be emailed');
  }
  
  return warnings;
});

const isValid = computed(() => validationErrors.value.length === 0);

// Helpers
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function generateItemId(): string {
  return `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function addLineItem() {
  form.value.lineItems.push({
    id: generateItemId(),
    description: '',
    quantity: 1,
    unitPrice: 0,
    amount: 0,
  });
}

function removeLineItem(index: number) {
  if (form.value.lineItems.length > 1) {
    form.value.lineItems.splice(index, 1);
  }
}

function updateLineItemAmount(item: LineItemForm) {
  item.amount = item.quantity * item.unitPrice;
}

async function save() {
  if (!isValid.value) return;
  
  const invoiceData: Partial<Invoice> = {
    clientName: form.value.clientName.trim(),
    clientLocation: form.value.clientLocation.trim() || undefined,
    clientEmail: form.value.clientEmail.trim() || undefined,
    clientPhone: form.value.clientPhone.trim() || undefined,
    invoiceDate: form.value.invoiceDate,
    dueDate: form.value.dueDate,
    lineItems: form.value.lineItems.map(item => ({
      id: item.id,
      description: item.description.trim(),
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      amount: item.amount,
    })),
    subtotal: subtotal.value,
    gst: gst.value,
    total: total.value,
    notes: form.value.notes.trim() || undefined,
  };
  
  emit('save', invoiceData);
}
</script>

<style scoped>
.invoice-editor {
  max-width: 800px;
  margin: 0 auto;
}
</style>
