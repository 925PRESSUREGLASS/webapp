# Contract Management & Recurring Revenue System

**Version:** 1.12.0
**Implementation Date:** 2025-11-18
**Module:** Contract Management

---

## Overview

The Contract Management System transforms TicTacStick from a one-time quoting tool into a comprehensive recurring revenue platform. This enables predictable monthly cash flow, automated service scheduling, and significantly higher business valuation.

## Business Impact

### Financial Transformation

**Before Contract Management:**
- One-time transactions
- Unpredictable income
- Customer acquisition cost: $200-500 per client
- Average customer lifetime: 1-2 jobs
- Business valuation: 2-3x annual profit

**After Contract Management:**
- Recurring monthly revenue
- Predictable cash flow
- Customer retention: 2-5 years+
- 60% higher customer lifetime value
- Business valuation: 4-6x annual revenue (recurring revenue premium)

### Key Metrics

The system calculates and tracks:

1. **MRR (Monthly Recurring Revenue)** - Predictable monthly income
2. **ARR (Annual Recurring Revenue)** - MRR × 12
3. **ACV (Annual Contract Value)** - Total contracted revenue per year
4. **CLV (Customer Lifetime Value)** - Average revenue per customer
5. **Churn Rate** - Customer retention metric

## Architecture

### Module Structure

```
contract-manager.js (514 lines)
├── Contract CRUD operations
├── Pricing calculations
├── Service scheduling
└── Contract lifecycle management

contract-wizard.js (446 lines)
├── Multi-step contract creation
├── Client selection/creation
├── Service configuration
└── Terms and payment setup

contract-automation.js (388 lines)
├── Daily task scheduler
├── Service reminders
├── Renewal processing
└── Status updates

contract-forecasting.js (324 lines)
├── Revenue forecasting
├── MRR/ARR calculations
├── Churn rate analysis
└── Business intelligence

css/contracts.css (439 lines)
└── Professional contract UI styling
```

### Data Model

#### Contract Object

```javascript
{
  id: 'contract_...',
  contractNumber: 'CTR-2025-0001',
  type: 'residential|commercial|strata',
  category: 'windows|pressure-washing|gutters',
  status: 'draft|pending|active|suspended|cancelled|completed',

  client: {
    id: '...',
    name: '...',
    phone: '...',
    email: '...',
    address: '...'
  },

  services: [
    {
      description: 'Window cleaning service',
      unitPrice: 250.00,
      quantity: 1
    }
  ],

  frequency: {
    id: 'monthly',
    interval: 1,
    unit: 'month'
  },

  terms: {
    startDate: '2025-11-25',
    endDate: '2026-11-25',
    duration: 12, // months
    autoRenew: true,
    noticePeriod: 30 // days
  },

  payment: {
    method: 'invoice|direct-debit|credit-card',
    terms: 'net-7|net-14|net-30|due-on-receipt'
  },

  pricing: {
    basePrice: 250.00,
    discount: 10, // percentage
    discountAmount: 25.00,
    subtotal: 225.00,
    gst: 22.50,
    total: 247.50
  },

  schedule: {
    preferredDay: 1, // Monday = 1
    preferredTime: 'morning|afternoon|evening',
    flexible: true
  },

  nextService: {
    scheduledDate: '2025-12-25',
    quoteId: null,
    reminderSent: false,
    confirmed: false
  },

  serviceHistory: [],

  notes: 'Special instructions...',

  createdAt: '2025-11-18T...',
  updatedAt: '2025-11-18T...',
  activationDate: null,
  cancellationDate: null
}
```

## Contract Types

### 1. Residential Contracts

**Target:** Single-family homes, townhouses, apartments

**Frequencies:**
- Weekly (15% discount)
- Fortnightly (12% discount)
- Monthly (10% discount)
- Quarterly (5% discount)
- Semi-Annual (3% discount)
- Annual (0% discount)

**Typical Services:**
- Window cleaning (inside & outside)
- Balcony cleaning
- Screen cleaning

### 2. Commercial Contracts

**Target:** Offices, retail stores, restaurants

**Frequencies:**
- Weekly (20% discount)
- Fortnightly (15% discount)
- Monthly (12% discount)
- Quarterly (8% discount)

**Typical Services:**
- Storefront windows
- Office windows
- Entrance glass doors
- Display cases

### 3. Strata/Body Corporate Contracts

**Target:** Multi-unit buildings, apartment complexes

**Frequencies:**
- Fortnightly (18% discount)
- Monthly (15% discount)
- Quarterly (10% discount)

**Typical Services:**
- Common area windows
- Balcony glass panels
- Lobby/entrance glass
- Pool fencing (glass)

## Key Features

### 1. Contract Creation Wizard

6-step guided process:

**Step 1: Contract Type Selection**
- Choose: Residential, Commercial, or Strata
- Determines available frequencies and discounts

**Step 2: Client Information**
- Select existing client OR
- Create new client inline

**Step 3: Services & Frequency**
- Add multiple services
- Select frequency (affects discount)
- Real-time pricing calculation

**Step 4: Contract Terms**
- Set start date
- Choose duration (or ongoing)
- Configure auto-renewal
- Set notice period
- Select payment method and terms

**Step 5: Schedule Preferences**
- Preferred day of week
- Preferred time of day
- Flexible scheduling option
- Special notes/instructions

**Step 6: Review & Create**
- Comprehensive summary
- Final pricing breakdown
- Save as draft OR
- Create active contract

### 2. Automated Service Scheduling

**Service Reminder Flow:**

1. **7 Days Before**: Quote auto-generated for upcoming service
2. **3 Days Before**: SMS/email reminder sent to client
3. **1 Day Before**: Follow-up task created for confirmation
4. **Service Day**: Service performed and recorded
5. **Next Service**: Automatically scheduled based on frequency

**Example Timeline (Monthly Contract):**

```
Nov 25 - Service completed
Dec 18 - Quote auto-generated
Dec 22 - Reminder sent (3 days before)
Dec 24 - Confirmation task due
Dec 25 - Service scheduled
```

### 3. Contract Renewal Automation

**Expiring Contract Notifications:**

- **60 Days Before**: First renewal reminder
- **30 Days Before**: Second renewal reminder
- **7 Days Before**: Final renewal reminder

**Auto-Renewal Process:**

If `autoRenew: true`:
1. Contract expires
2. New term starts automatically (same duration)
3. Client notified of renewal
4. Billing continues without interruption

If `autoRenew: false`:
1. Contract marked as "completed"
2. No further services scheduled
3. Client can manually renew

### 4. Revenue Forecasting

**Monthly Recurring Revenue (MRR):**

Converts all contracts to monthly equivalent:

```javascript
// Weekly contract: $100/week
MRR = $100 × (52 weeks / 12 months) = $433.33/month

// Quarterly contract: $600/quarter
MRR = $600 / 3 months = $200/month
```

**Annual Recurring Revenue (ARR):**

```javascript
ARR = MRR × 12
```

**12-Month Forecast:**

Projects revenue for next 12 months based on:
- Active contracts
- Service frequencies
- Contract end dates
- Historical growth rate

**Customer Lifetime Value (CLV):**

```javascript
CLV = MRR × Average Customer Lifetime (months)

// Example:
MRR = $2,000
Avg Lifetime = 24 months
CLV = $48,000
```

## API Reference

### ContractManager

#### Create Contract

```javascript
var contract = ContractManager.createContract({
  type: 'residential',
  client: {
    name: 'John Smith',
    phone: '0400123456',
    email: 'john@example.com',
    address: '123 Main St, Perth'
  },
  services: [
    {
      description: 'Monthly window cleaning',
      unitPrice: 250,
      quantity: 1
    }
  ],
  category: 'windows',
  frequency: {
    id: 'monthly',
    interval: 1,
    unit: 'month'
  },
  terms: {
    startDate: '2025-12-01',
    duration: 12,
    autoRenew: true,
    noticePeriod: 30
  },
  payment: {
    method: 'invoice',
    terms: 'net-7'
  },
  schedule: {
    preferredDay: 1, // Monday
    preferredTime: 'morning',
    flexible: true
  },
  notes: 'Client prefers early morning service'
});
```

#### Get Contract

```javascript
var contract = ContractManager.getContract(contractId);
```

#### Update Contract

```javascript
ContractManager.updateContract(contractId, {
  status: 'active',
  notes: 'Updated notes...'
});
```

#### Get Upcoming Services

```javascript
var upcoming = ContractManager.getUpcomingServices(30); // Next 30 days

// Returns:
[
  {
    contract: {...},
    serviceDate: '2025-11-25',
    daysUntil: 7
  },
  ...
]
```

#### Record Service Completion

```javascript
ContractManager.recordServiceCompletion(contractId, {
  completedDate: '2025-11-25',
  invoiceId: 'invoice_...',
  notes: 'Service completed successfully',
  photos: [...]
});
```

### ContractForecasting

#### Calculate MRR

```javascript
var mrr = ContractForecasting.calculateMRR();
// Returns: 5250.00 (monthly recurring revenue)
```

#### Calculate ARR

```javascript
var arr = ContractForecasting.calculateARR();
// Returns: 63000.00 (annual recurring revenue)
```

#### Forecast Revenue

```javascript
var forecast = ContractForecasting.forecastRevenue(12); // 12 months

// Returns:
[
  {
    month: '2025-11',
    monthName: 'November 2025',
    revenue: 5250.00,
    services: 21,
    contracts: [...]
  },
  ...
]
```

#### Calculate Churn Rate

```javascript
var churn = ContractForecasting.calculateChurnRate(90); // 90-day period

// Returns:
{
  activeAtStart: 50,
  churned: 3,
  churnRate: 6.0, // percentage
  period: 90
}
```

#### Calculate CLV

```javascript
var clv = ContractForecasting.calculateCLV();

// Returns:
{
  clv: 48000.00,
  avgLifetimeMonths: 24.0,
  monthlyChurnRate: 2.0
}
```

### ContractAutomation

#### Run Daily Tasks Manually

```javascript
ContractAutomation.runDailyTasks();
```

Performs:
- Send service reminders (3 days before)
- Generate quotes (7 days before)
- Check expiring contracts
- Process renewals
- Update statuses

#### Send Service Reminders

```javascript
var count = ContractAutomation.sendServiceReminders();
// Returns: 5 (number of reminders sent)
```

#### Process Renewals

```javascript
var count = ContractAutomation.processRenewals();
// Returns: 2 (number of contracts renewed)
```

## Integration with Existing Systems

### Task Management Integration

Contract automation creates tasks in TaskManager:

**Service Confirmation Task:**
```javascript
TaskManager.createTask({
  clientId: contract.client.id,
  type: 'phone-call',
  priority: 'normal',
  title: 'Confirm service: ' + contract.client.name,
  description: 'Confirm Dec 25 service appointment',
  dueDate: '2025-12-24', // 1 day before service
  followUpMessage: 'Reminder: Your service is scheduled for...'
});
```

**Renewal Follow-up Task:**
```javascript
TaskManager.createTask({
  clientId: contract.client.id,
  type: 'email',
  priority: 'high',
  title: 'Contract renewal: ' + contract.client.name,
  description: 'Follow up on contract renewal - expires in 30 days',
  dueDate: '...', // 7 days from now
  followUpMessage: 'Your contract expires soon...'
});
```

### Client Database Integration

Contracts automatically link to existing clients or create new ones:

```javascript
// Existing client
var client = ClientDatabase.getClient(clientId);

// New client created inline
var client = ClientDatabase.saveClient({
  name: '...',
  phone: '...',
  email: '...',
  address: '...'
});
```

### Invoice System Integration

Generate invoices from completed services:

```javascript
// After service completion
var invoice = InvoiceSystem.createFromContract(contract);
```

### Quote System Integration

Auto-generate quotes for scheduled services:

```javascript
var quote = ContractManager.generateServiceQuote(contractId);
// Returns quote data ready for APP.setState()
```

## Usage Examples

### Example 1: Create Residential Monthly Contract

```javascript
// Step 1: Open contract wizard
ContractWizard.init();

// Step 2: Select type
ContractWizard.selectContractType('residential');

// Step 3: Client details (existing)
ContractWizard.loadClientDetails('client_12345');

// Step 4: Add service
ContractWizard.addService(); // Opens prompt

// Step 5: Configure and create
ContractWizard.createFinal();
```

### Example 2: Get Revenue Metrics

```javascript
var report = ContractForecasting.generateReport();

console.log('MRR:', report.metrics.mrr);
console.log('ARR:', report.metrics.arr);
console.log('Active Contracts:', report.metrics.activeContracts);
console.log('Churn Rate:', report.metrics.churnRate + '%');
console.log('CLV:', report.metrics.clv);

// 12-month forecast
report.forecast.forEach(function(month) {
  console.log(month.monthName + ':', '$' + month.revenue);
});
```

### Example 3: Monitor Upcoming Services

```javascript
var upcoming = ContractManager.getUpcomingServices(7);

upcoming.forEach(function(item) {
  console.log(
    item.contract.client.name,
    '-',
    item.serviceDate,
    '(' + item.daysUntil + ' days)'
  );
});
```

## Business Best Practices

### Pricing Strategy

**Frequency Discounts:**

Offer progressively better discounts for more frequent services:

- Weekly: 15-20% (locks in maximum commitment)
- Fortnightly: 12-15%
- Monthly: 10-12%
- Quarterly: 5-8%
- Semi-Annual: 3-5%
- Annual: 0-3%

**Why?**
- More frequent = more predictable cash flow
- Reduces customer acquisition costs
- Builds stronger relationships
- Higher lifetime value

### Contract Terms

**Recommended Duration:**
- Residential: 6-12 months
- Commercial: 12-24 months
- Strata: 12-36 months

**Auto-Renewal:**
- Enable by default (opt-out vs opt-in)
- Reduces churn
- Improves retention
- Requires 30-60 day notice to cancel

### Payment Terms

**Best for Cash Flow:**
1. Direct Debit (automatic monthly)
2. Credit Card (automatic billing)
3. Invoice (Net 7 days)

**Avoid:** Net 30 or Net 60 for contracts (delays cash flow)

### Service Reminders

**Timeline:**
- 7 days: Quote generated
- 3 days: Reminder sent
- 1 day: Confirmation call
- Service day: Perform service
- Same day: Record completion

### Renewal Strategy

**Retention Tactics:**

1. **60-Day Notice**: "Your contract is up for renewal. Lock in current pricing!"
2. **30-Day Notice**: "Continue your service without interruption - renew today"
3. **7-Day Notice**: "Final reminder: Your contract expires soon"

**Upsell Opportunities:**
- Offer upgrade to more frequent service (better discount)
- Bundle additional services
- Longer commitment = better pricing

## Troubleshooting

### Issue: Services Not Scheduling Automatically

**Check:**
1. Contract status is "active"
2. Start date is in the past
3. Frequency is properly configured
4. ContractAutomation is initialized

**Debug:**
```javascript
var contract = ContractManager.getContract(contractId);
console.log('Status:', contract.status);
console.log('Next Service:', contract.nextService.scheduledDate);
```

### Issue: Reminders Not Sending

**Check:**
1. Daily automation is running
2. Service is within 3-day window
3. Reminder not already sent
4. TaskManager is available

**Debug:**
```javascript
var upcoming = ContractManager.getUpcomingServices(7);
console.log('Upcoming services:', upcoming.length);

upcoming.forEach(function(item) {
  console.log('Reminder sent?', item.contract.nextService.reminderSent);
});
```

### Issue: Incorrect Revenue Forecast

**Check:**
1. Contracts have correct pricing
2. Frequencies are properly configured
3. End dates are set correctly

**Debug:**
```javascript
var contracts = ContractManager.getContractsByStatus('active');
contracts.forEach(function(c) {
  var monthly = ContractManager.calculateContractValue(c, 'monthly');
  console.log(c.contractNumber, monthly);
});
```

## Future Enhancements

**Planned Features:**

1. **Contract Templates** - Pre-configured packages
2. **Price Lock Guarantees** - Fixed pricing for contract duration
3. **Service Add-ons** - Upsell additional services
4. **Referral Rewards** - Contract holders refer new clients
5. **Loyalty Tiers** - Bronze/Silver/Gold based on tenure
6. **Payment Plans** - Split large jobs into monthly installments
7. **Contract Reporting** - Detailed analytics dashboard
8. **PDF Contract Generation** - Professional contract documents
9. **Digital Signatures** - E-signature integration
10. **SMS/Email Automation** - Enhanced communication

## Support

For questions or issues:

1. Review this guide
2. Check CLAUDE.md for development guidelines
3. Consult API reference above
4. Test with sample contracts first
5. Monitor browser console for errors

---

**Version History:**

- v1.12.0 (2025-11-18) - Initial release
  - Contract management system
  - Automation engine
  - Revenue forecasting
  - UI components

**Next Version (v1.13.0):**
- Contract templates
- Enhanced reporting
- PDF contract generation
- Payment integrations
