<template>
  <div class="print-invoice">
    <div class="invoice-header">
      <div class="business-info">
        <h1 class="business-name">{{ settings.businessName || 'TicTacStick' }}</h1>
        <div v-if="settings.businessAddress">{{ settings.businessAddress }}</div>
        <div v-if="settings.businessPhone">{{ settings.businessPhone }}</div>
        <div v-if="settings.businessEmail">{{ settings.businessEmail }}</div>
        <div v-if="settings.abn">ABN: {{ settings.abn }}</div>
      </div>
      <div class="invoice-info">
        <h2>TAX INVOICE</h2>
        <div class="invoice-number">{{ invoice.invoiceNumber }}</div>
        <div>Date: {{ formatDate(invoice.invoiceDate) }}</div>
        <div>Due: {{ formatDate(invoice.dueDate) }}</div>
      </div>
    </div>

    <div class="client-section">
      <h3>Bill To:</h3>
      <div class="client-name">{{ invoice.clientName }}</div>
      <div v-if="invoice.clientLocation">{{ invoice.clientLocation }}</div>
      <div v-if="invoice.clientEmail">{{ invoice.clientEmail }}</div>
      <div v-if="invoice.clientPhone">{{ invoice.clientPhone }}</div>
    </div>

    <table class="line-items">
      <thead>
        <tr>
          <th>Description</th>
          <th class="text-right">Qty</th>
          <th class="text-right">Unit Price</th>
          <th class="text-right">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in invoice.lineItems" :key="item.id">
          <td>{{ item.description }}</td>
          <td class="text-right">{{ item.quantity }}</td>
          <td class="text-right">${{ formatMoney(item.unitPrice) }}</td>
          <td class="text-right">${{ formatMoney(item.amount) }}</td>
        </tr>
      </tbody>
    </table>

    <div class="totals-section">
      <div class="total-row">
        <span>Subtotal:</span>
        <span>${{ formatMoney(invoice.subtotal) }}</span>
      </div>
      <div class="total-row">
        <span>GST (10%):</span>
        <span>${{ formatMoney(invoice.gst) }}</span>
      </div>
      <div class="total-row grand-total">
        <span>Total:</span>
        <span>${{ formatMoney(invoice.total) }}</span>
      </div>
      <div v-if="invoice.amountPaid > 0" class="total-row paid">
        <span>Amount Paid:</span>
        <span>${{ formatMoney(invoice.amountPaid) }}</span>
      </div>
      <div v-if="invoice.balance > 0" class="total-row balance-due">
        <span>Balance Due:</span>
        <span>${{ formatMoney(invoice.balance) }}</span>
      </div>
    </div>

    <div v-if="settings.bankName" class="payment-info">
      <h3>Payment Details</h3>
      <div>Bank: {{ settings.bankName }}</div>
      <div>Account Name: {{ settings.accountName }}</div>
      <div>BSB: {{ settings.bsb }}</div>
      <div>Account: {{ settings.accountNumber }}</div>
      <div class="payment-reference">Reference: {{ invoice.invoiceNumber }}</div>
    </div>

    <div v-if="invoice.clientNotes" class="notes-section">
      <h3>Notes</h3>
      <p>{{ invoice.clientNotes }}</p>
    </div>

    <div class="footer">
      <p>Thank you for your business!</p>
      <p class="terms">Payment due within {{ settings.paymentTermsDays || 7 }} days of invoice date.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Invoice, InvoiceSettings } from '../../stores/invoices';

interface Props {
  invoice: Invoice;
  settings: InvoiceSettings;
}

defineProps<Props>();

function formatMoney(value: number): string {
  return value.toFixed(2);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
</script>

<style scoped>
.print-invoice {
  font-family: 'Helvetica Neue', Arial, sans-serif;
  max-width: 800px;
  margin: 0 auto;
  padding: 40px;
  background: white;
  color: #333;
}

.invoice-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 40px;
  padding-bottom: 20px;
  border-bottom: 2px solid #1976d2;
}

.business-info {
  flex: 1;
}

.business-name {
  margin: 0 0 10px 0;
  color: #1976d2;
  font-size: 28px;
}

.invoice-info {
  text-align: right;
}

.invoice-info h2 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 24px;
}

.invoice-number {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 10px;
}

.client-section {
  margin-bottom: 30px;
}

.client-section h3 {
  margin: 0 0 10px 0;
  color: #666;
  font-size: 14px;
  text-transform: uppercase;
}

.client-name {
  font-size: 18px;
  font-weight: bold;
}

.line-items {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 30px;
}

.line-items th {
  background: #f5f5f5;
  padding: 12px;
  text-align: left;
  border-bottom: 2px solid #ddd;
  font-weight: 600;
}

.line-items td {
  padding: 12px;
  border-bottom: 1px solid #eee;
}

.line-items .text-right {
  text-align: right;
}

.totals-section {
  width: 300px;
  margin-left: auto;
  margin-bottom: 30px;
}

.total-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}

.grand-total {
  font-size: 18px;
  font-weight: bold;
  border-top: 2px solid #333;
  border-bottom: 2px solid #333;
  padding: 12px 0;
  margin-top: 10px;
}

.paid {
  color: #4caf50;
}

.balance-due {
  color: #f44336;
  font-weight: bold;
}

.payment-info {
  background: #f9f9f9;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 30px;
}

.payment-info h3 {
  margin: 0 0 10px 0;
  font-size: 16px;
}

.payment-reference {
  margin-top: 10px;
  font-weight: bold;
}

.notes-section {
  margin-bottom: 30px;
}

.notes-section h3 {
  margin: 0 0 10px 0;
  font-size: 16px;
}

.footer {
  text-align: center;
  color: #666;
  font-size: 14px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.terms {
  font-size: 12px;
  color: #999;
}

/* Print styles */
@media print {
  .print-invoice {
    padding: 0;
  }

  body {
    margin: 0;
  }
}
</style>
