# CLAUDE.md - AI Assistant Guide for TicTacStick Quote Engine

**Last Updated:** 2025-11-18
**Version:** 1.12.0
**Project:** TicTacStick Quote Engine for 925 Pressure Glass

---

## Table of Contents

1. [Critical Information](#critical-information)
2. [Project Overview](#project-overview)
3. [Codebase Architecture](#codebase-architecture)
4. [Development Workflows](#development-workflows)
5. [Code Conventions](#code-conventions)
6. [Testing](#testing)
7. [Common Tasks](#common-tasks)
8. [Security & Validation](#security--validation)
9. [Module Reference](#module-reference)
10. [Design System](#design-system)
11. [Troubleshooting](#troubleshooting)

---

## What's New in v1.12.0

### Contract Management & Recurring Revenue System (November 2025)

This release transforms TicTacStick from a one-time quoting tool into a comprehensive recurring revenue platform, enabling predictable monthly cash flow and significantly higher business valuation:

**New Contract Management System (4 files, ~2,240 lines):**
- `contract-manager.js` - Contract CRUD & lifecycle management (660 lines)
  - Contract types: residential, commercial, strata
  - Service frequencies: weekly, fortnightly, monthly, quarterly, semi-annual, annual
  - Volume discounts (5-20% based on frequency)
  - Contract statuses: draft, pending, active, suspended, cancelled, completed
  - Payment terms: upfront, monthly, quarterly, annual
  - Auto-renewal configuration
  - Service scheduling

- `contract-wizard.js` - Multi-step contract creation wizard (663 lines)
  - Client selection/creation integration
  - Service configuration with pricing preview
  - Frequency and discount selection
  - Payment terms setup
  - Contract terms and conditions
  - Review and confirmation step

- `contract-automation.js` - Daily task scheduler & automation (470 lines)
  - Service reminders (7 days, 1 day before due)
  - Renewal processing (automatic and manual)
  - Status updates and notifications
  - Overdue contract handling
  - Invoice generation triggers

- `contract-forecasting.js` - Revenue forecasting & business intelligence (447 lines)
  - MRR (Monthly Recurring Revenue) calculation
  - ARR (Annual Recurring Revenue) projection
  - ACV (Annual Contract Value) tracking
  - CLV (Customer Lifetime Value) analysis
  - Churn rate monitoring
  - Revenue forecasting (3, 6, 12 months)
  - Business valuation metrics

**New Enhanced Analytics System (3 files, ~1,544 lines):**
- `analytics-config.js` - Analytics configuration (276 lines)
  - Date range presets (today, week, month, quarter, year)
  - Metric definitions and thresholds
  - Chart configurations
  - Export templates

- `analytics-engine.js` - Metrics calculation engine (624 lines)
  - Revenue metrics (total, by period, by source)
  - Conversion rate analysis
  - Customer acquisition cost (CAC)
  - Average order value (AOV)
  - Win/loss rate tracking
  - Performance trend analysis

- `analytics-dashboard.js` - Dashboard UI controller (644 lines)
  - Real-time metrics display
  - Interactive charts and graphs
  - Date range filtering
  - Drill-down capabilities
  - Export to CSV/PDF

**New Help System (2 files, ~994 lines):**
- `help-system.js` - In-app contextual help (555 lines)
  - Contextual tooltips
  - Interactive tutorials
  - Video tutorial links
  - FAQ database
  - Search functionality

- `css/help-system.css` - Help UI styling (439 lines)

**New Testing Infrastructure (4 files, ~1,610 lines):**
- `test-runner.js` - Test execution controller (388 lines)
- `test-framework.js` - Test framework core (452 lines)
- `test-suites.js` - Test suite definitions (408 lines)
- `test-checklist.js` - Production readiness checklist (362 lines)
- `css/test-runner.css` - Test UI styling

**New Production Tools:**
- `backup-manager.js` - Automated backup system (531 lines)
  - Scheduled backups
  - Export to JSON
  - Import/restore functionality
  - Version control

- `config-production.js` - Production configuration
- `integration-tests.js` - Integration test suite
- `production-readiness.js` - Deployment verification

**New GoHighLevel Integration Files:**
- `ghl-client.js` - GHL API client library
- `ghl-integration.js` - GHL integration orchestrator

**Key Features:**
- 💰 Recurring revenue tracking (MRR/ARR)
- 📅 Automated service scheduling
- 🔄 Auto-renewal capabilities
- 📊 Advanced business intelligence
- 💼 Contract lifecycle management
- 📈 Revenue forecasting
- 🎯 Customer lifetime value tracking
- 📋 Comprehensive testing suite
- 💾 Automated backup system
- ❓ In-app help system

**Total:** ~8,700 lines of new code (7,261 JS + 439 CSS + ~1,000 docs)

**Business Impact:**
- Predictable monthly cash flow
- 60% higher customer lifetime value
- 4-6x business valuation multiplier (vs. 2-3x for one-time transactions)
- Automated service reminders reduce missed appointments
- Professional contract management increases customer retention
- Revenue forecasting enables data-driven decisions

**Contract Frequencies & Discounts:**
- **Weekly:** 15-20% discount (highest retention)
- **Fortnightly:** 12-15% discount
- **Monthly:** 10-12% discount (most popular)
- **Quarterly:** 5-8% discount
- **Semi-Annual:** 3-5% discount
- **Annual:** 0-3% discount (best cash flow)

---

## What's New in v1.11.0

### GoHighLevel CRM Integration & Automated Follow-ups (November 2025)

This release adds comprehensive CRM integration with GoHighLevel, transforming TicTacStick into a full-featured sales automation platform:

**New Task Management System (4 files, ~2,049 lines):**
- `task-manager.js` - Core task CRUD operations (514 lines)
  - Create, read, update, delete tasks
  - Task types: follow-up, phone-call, email, SMS, meeting
  - Priority levels: urgent, high, normal, low
  - Status tracking: pending, in-progress, completed, cancelled, overdue
  - Automatic overdue detection
  - Task statistics and filtering
  - GHL sync integration (tracks ghlTaskId and syncStatus)

- `followup-automation.js` - Intelligent follow-up sequences (519 lines)
  - Event-driven automation (quote sent, viewed, accepted, declined)
  - 5 follow-up sequences: Standard, High-Value, Repeat Client, Referral, Nurture
  - Smart timing: Business hours and DND time respect
  - Message templates with variable substitution
  - Optimal contact time calculation
  - Automatic sequence triggering based on quote status

- `followup-config.js` - Follow-up sequence definitions (270 lines)
  - Configurable contact times (weekday/weekend)
  - DND (Do Not Disturb) time rules
  - Message templates for SMS, email, phone scripts
  - Sequence configurations by quote type

- `task-dashboard-ui.js` - Task dashboard interface (446 lines)
  - Visual task management dashboard
  - Summary cards (Today, Overdue, Urgent, Pending)
  - Task filtering by status, priority, type
  - Task details modal
  - Complete/cancel task actions
  - Auto-refresh every minute

**New Webhook Integration System (5 files, ~2,608 lines):**
- `webhook-processor.js` - Event processing engine (921 lines)
  - Real-time polling from Cloudflare Worker (every 30 seconds)
  - Event queue with batch processing (10 events per batch)
  - Bidirectional sync (GoHighLevel ↔ TicTacStick)
  - 4 conflict resolution strategies (timestamp, GHL wins, local wins, manual)
  - Retry logic (3 attempts with exponential backoff)
  - Handles 15+ event types (ContactUpdate, OpportunityUpdate, TaskUpdate, etc.)

- `webhook-settings.js` - Settings UI controller (487 lines)
  - Webhook URL and secret configuration
  - Event subscription management
  - Sync status monitoring
  - Manual sync trigger
  - Event queue viewer
  - Register/unregister with GHL

- `webhook-debug.js` - Testing and debugging tools (439 lines)
  - Simulate webhook events for testing
  - View event queue status
  - Export debug logs to JSON
  - Integration test suite
  - Test data generators

- `ghl-webhook-setup.js` - GHL API integration (373 lines)
  - Register/update/delete webhooks via GHL API
  - Test endpoint connectivity
  - List and verify existing webhooks
  - Support for 15+ GHL event types

- `ghl-task-sync.js` - Bidirectional task sync (388 lines)
  - Sync tasks between TicTacStick and GHL
  - Maps task formats between systems
  - Batch sync for offline recovery
  - Auto-sync on task create/update/complete
  - Graceful failure handling

**New Task Dashboard UI (2 files, ~885 lines):**
- Task dashboard page (integrated in `index.html`)
  - Modern card-based layout
  - Priority color coding (urgent=red, high=orange, normal=blue, low=gray)
  - Responsive design (desktop/tablet/mobile)
  - Real-time task updates

- `css/tasks.css` - Task styling (439 lines)
  - Card layouts and grids
  - Priority badges and status indicators
  - Dark theme support
  - Print-friendly styles
  - Mobile-optimized (44px touch targets)

**Key Features:**
- 📞 Automated follow-up sequences based on quote status
- 🔄 Real-time bidirectional sync with GoHighLevel CRM
- 📋 Visual task management dashboard
- ⏰ Smart timing (business hours, DND times, optimal contact times)
- 💬 Message templates with variable substitution
- 🎯 Priority-based task routing
- 📊 Task statistics and conversion tracking
- 🔌 Webhook integration with event queue and retry logic
- 🧪 Comprehensive testing and debugging tools
- 📱 Mobile-responsive task interface

**Total:** ~5,700 lines of new code (4,357 JS + 439 CSS + ~900 docs)

**Integration Highlights:**
- Seamlessly integrates with existing quote engine
- Client data syncs from GHL contacts
- Quote status triggers follow-up sequences
- Tasks linked to quotes and clients
- Uses existing design system and UI components
- No breaking changes to existing features

**Follow-up Sequences:**
1. **Standard** - Quote sent: SMS (24h) → Phone (72h) → Email (1 week)
2. **High-Value** ($2000+): Phone (6h) → Email (24h) → Phone (48h)
3. **Repeat Client**: SMS (12h) → Phone (36h)
4. **Referral**: Phone (6h) → SMS (24h)
5. **Nurture** (declined): Email (1 week) → SMS (90 days)

---

## What's New in v1.10.0

### PDF Generation Suite & Production Tools (November 2025)

This release adds comprehensive PDF generation and production deployment capabilities:

**New PDF Generation Suite (5 files, ~2,610 lines):**
- `pdf-config.js` - PDF configuration and branding (408 lines)
  - Company branding settings
  - Page layout specifications (A4, margins, fonts)
  - Color schemes and styling
  - Header/footer templates
  - Logo and contact information

- `pdf-components.js` - PDF component rendering engine (625 lines)
  - Reusable PDF components (headers, tables, signatures)
  - Text formatting and styling helpers
  - Table generation with alternating rows
  - Logo and image embedding
  - QR code generation for verification

- `quote-pdf.js` - Quote PDF generation logic (576 lines)
  - Convert quotes to professional PDFs
  - Multi-page support with automatic pagination
  - Line item tables with calculations
  - Summary sections with GST breakdown
  - Terms and conditions
  - Client and job information

- `quote-pdf-ui.js` - PDF generation UI controls (494 lines)
  - Generate PDF button and modal
  - Email preview and sending interface
  - PDF download and print options
  - Progress indicators
  - Error handling and user feedback

- `quote-pdf.css` - PDF UI styling (507 lines)
  - PDF action button styling
  - Email modal layout
  - Progress indicators
  - Responsive PDF controls

**New Production Tools (3 files, ~1,428 lines):**
- `deployment-helper.js` - Pre-deployment validation (510 lines)
  - Version checking
  - Required module validation
  - LocalStorage health checks
  - Configuration verification
  - Security audit (CSP, XSS prevention)
  - Performance benchmarks
  - **Usage:** `DeploymentHelper.runPreDeploymentChecks()`

- `health-check.js` - Post-deployment monitoring (493 lines)
  - Continuous health monitoring
  - LocalStorage availability checks
  - Module registration verification
  - Performance metrics tracking
  - Error rate monitoring
  - Service Worker status
  - **Usage:** `HealthCheck.runHealthCheck()` or `HealthCheck.startMonitoring(interval)`

- `bug-tracker.js` - Bug reporting system (425 lines)
  - User-friendly bug reporting interface
  - Automatic environment capture (browser, OS, version)
  - Screenshot attachment
  - LocalStorage state snapshot
  - Error stack trace capture
  - Export bug reports to JSON
  - **Usage:** `BugTracker.init()` - adds bug report button to UI

**Key Features:**
- 📄 Professional PDF quote generation with jsPDF
- 📧 Email integration for sending quotes
- 🎨 Customizable PDF branding and templates
- ✅ Comprehensive pre-deployment validation
- 🏥 Production health monitoring
- 🐛 Built-in bug tracking and reporting
- 📊 Performance benchmarking
- 🔒 Security audit tools

**Total:** ~4,000 lines of new code

---

## What's New in v1.9.0

### Professional UI/UX Design System (November 2025)

This release adds a comprehensive design system for consistent, accessible, and professional UI/UX:

**New Core Files:**
- `css/design-system.css` - Complete design system (1,200+ lines)
  - CSS variables for colors, typography, spacing
  - Button components (primary, secondary, tertiary, danger)
  - Form components (inputs, selects, checkboxes, radios)
  - Card and modal components
  - Loading states and skeleton screens
  - Toast notifications and alerts
  - Mobile-first responsive patterns
  - iOS Safari specific fixes
  - Accessibility utilities (ARIA, focus states)
  - Animation and micro-interactions

- `ui-components.js` - UI helper functions (430+ lines)
  - Toast notification system
  - Loading overlay management
  - Confirmation modals
  - Alert dialogs
  - iOS viewport height fix

**New Documentation:**
- `docs/DESIGN_SYSTEM.md` - Complete design system guide (1,000+ lines)
  - Component library with examples
  - Color system and typography
  - Accessibility guidelines
  - iOS Safari compatibility
  - Best practices and migration guide

**Key Improvements:**
- 🎨 Unified color palette and typography scale
- 📱 Mobile-first with 44px minimum touch targets
- ♿ WCAG AA accessibility compliance
- 🍎 iOS Safari optimizations (viewport fix, no zoom on inputs)
- ⚡ GPU-accelerated animations
- 🔄 Consistent button and form styling
- 🎯 Professional polish with micro-interactions
- 📋 Toast notifications replace browser alerts
- 🔐 Proper ARIA labels throughout

**HTML Updates:**
- Updated all buttons to use new design system classes
- Added ARIA labels and accessibility attributes
- Replaced `btn-small` → `btn-sm`
- Replaced `btn-ghost` → `btn-tertiary`
- Added proper form labels and hints

**Total:** ~1,700 lines of new code + comprehensive documentation

### Enhanced Print Layouts System (v1.8.0)

This release adds comprehensive professional printing capabilities:

**New Modules (12 files):**
- `invoice-print.css` - Professional invoice print layout
- `photo-print-layout.css` - Photo grid layouts (2×2, 3×3, 4×4, before/after)
- `letterhead.css` - Branded letterhead system with logo support
- `window-types-extended.js` - Australian-specific window types (louvre, awning, hopper, bay/bow)
- `conditions-modifiers.js` - Job condition pricing adjustments (weather, difficulty, urgency)
- `pressure-surfaces-extended.js` - Extended surface types (sandstone, timber, roof tiles)
- `lazy-loader.js` + `lazy-loader-init.js` - On-demand module loading
- `quick-add-ui.js` - Mobile-optimized quick add interface
- `custom-window-calculator.js` - Custom dimension calculator
- `travel-calculator.js` - Travel time/cost calculation
- `profitability-analyzer.js` - Job profitability analysis
- `job-presets.js` - Job preset management
- `quote-migration.js` - Data migration utilities

**New CSS Files (4):**
- `mobile.css` - Mobile responsive design (540 lines)
- `invoice-print.css` - Invoice print layout (399 lines)
- `photo-print-layout.css` - Photo grids (372 lines)
- `letterhead.css` - Professional letterhead (426 lines)

**New Test Suites (8):**
- `analytics.spec.js`, `client-database.spec.js`, `data-validation.spec.js`
- `debug-modules.spec.js`, `export.spec.js`, `storage.spec.js`
- `templates.spec.js`, `theme.spec.js`

**New Documentation:**
- `PRINT_GUIDE.md` - Comprehensive 900-line printing guide

**Key Features:**
- 📄 Professional invoice printing with letterhead
- 📸 Photo documentation with multiple grid layouts
- 🎨 Custom branding with logo upload
- 📱 Mobile-optimized UI components
- 📊 Business intelligence (travel, profitability)
- ⚡ Performance optimization with lazy loading
- 🪟 Extended Australian window types
- 🏢 Job presets for common configurations

**Total:** ~3,500 lines of new code + documentation

---

## Critical Information

### Read This First

**CRITICAL CONSTRAINTS** - Violating these will break the application:

#### 1. ES5 JavaScript Only - NO ES6+

**MUST NOT USE:**
- ❌ `const` or `let` (use `var`)
- ❌ Arrow functions `() => {}` (use `function() {}`)
- ❌ Template literals `` `${var}` `` (use `'string' + var`)
- ❌ Destructuring `{a, b} = obj` (use `var a = obj.a`)
- ❌ Spread operator `...arr` (use `.concat()` or loops)
- ❌ Default parameters `function(a = 5)` (use `a = a || 5`)
- ❌ Promises `async/await` (use callbacks)
- ❌ Classes (use IIFE pattern)

**WHY:** iOS Safari 12+ compatibility for field use on older iPads.

#### 2. No Build Tools

- NO webpack, babel, vite, rollup, parcel, or any transpilation
- Direct browser execution only
- Manual dependency management
- Script load order in `index.html` matters

#### 3. Offline-First Architecture

- Must work without internet indefinitely
- All data in LocalStorage (no backend in Phase 2)
- Service Worker must cache all assets
- No external dependencies except Chart.js CDN (optional)

#### 4. Money Calculations Must Use Integer Arithmetic

```javascript
// CORRECT - Use calc.js Money utilities
var cents = Money.toCents(19.99);  // 1999
var total = Money.sumCents(cents1, cents2);
var dollars = Money.fromCents(total);

// WRONG - Never use floating-point math directly
var total = 0.1 + 0.2;  // 0.30000000000000004 ❌
```

---

## Project Overview

### What Is This?

TicTacStick is a **Progressive Web App (PWA)** quote engine for 925 Pressure Glass, a window and pressure cleaning business in Perth, Western Australia. It runs entirely client-side with zero backend dependency.

**Key Features:**
- Window cleaning quotes (6 window types)
- Pressure cleaning quotes (5 surface types)
- Invoice generation and tracking
- Client database (CRM)
- Quote analytics and history
- Photo attachments
- PDF/CSV export
- Dark/Light themes
- Keyboard shortcuts
- Full offline capability

### Business Context

**Operator:** Gerard Varone (solo operator)
**Primary Use Case:** On-site iPad quotes at job locations
**Critical Requirement:** Must work offline (many job sites have no internet)

**Workflow:**
1. Drive to job site (often no internet)
2. Walk property with client
3. Create quote on iPad
4. Email/SMS quote immediately
5. Convert accepted quotes to invoices
6. Track client history and revenue

### Current Phase

**Phase 3:** Business Transformation & Recurring Revenue
- Status: Active production deployment with full business management suite
- Recent: Contract Management System (v1.12.0), GoHighLevel CRM integration (v1.11.0), PDF generation (v1.10.0)
- Current: Recurring revenue tracking, automated contract management, advanced analytics, comprehensive testing
- Features: MRR/ARR tracking, service scheduling, revenue forecasting, in-app help, automated backups
- Focus: Contract optimization, analytics refinement, user training, production monitoring
- Next: Cloud backend migration (Phase 4), mobile app development, API integrations

---

## Codebase Architecture

### Directory Structure

```
webapp/
├── index.html              # Main application entry point
├── manifest.json           # PWA manifest
├── package.json            # Node dependencies (tests only)
├── playwright.config.js    # Test configuration
├── .mcp.json              # Claude Code integration
├── CHANGELOG.md            # Version history and changes
│
├── Core JavaScript (~19,000 lines total)
├── bootstrap.js            # APP namespace initialization (MUST LOAD FIRST)
├── debug.js               # Debug system (load before others) - 445 lines
├── security.js            # XSS prevention, sanitization (load early) - 808 lines
├── validation.js          # Input validation system (load before invoice) - 1,323 lines
├── lazy-loader.js         # Lazy loading system - 743 lines
├── lazy-loader-init.js    # Lazy loader initialization - 164 lines
├── storage.js             # LocalStorage wrapper - 90 lines
├── calc.js                # Precision calculation engine - 365 lines
├── app.js                 # Core application state - 1,533 lines
├── ui.js                  # DOM manipulation and UI updates - 140 lines
├── wizard.js              # Modal wizard dialogs - 563 lines
├── loading.js             # Loading states - 124 lines
├── accessibility.js       # ARIA, keyboard nav - 365 lines
├── error-handler.js       # Global error handling - 239 lines
│
├── Data & Configuration Modules
├── data.js                # Base pricing data and lookup tables - 192 lines
├── window-types-extended.js    # Enhanced Australian window types - 405 lines
├── conditions-modifiers.js     # Job condition modifiers - 307 lines
├── pressure-surfaces-extended.js # Extended pressure surface types - 300 lines
├── quote-migration.js     # Quote data migration utilities - 262 lines
│
├── Feature Modules
├── invoice.js             # Invoice system (largest file) - 1,965 lines
├── client-database.js     # CRM functionality - 546 lines
├── quote-workflow.js      # Quote status tracking - 318 lines
├── analytics.js           # Business intelligence - 419 lines
├── charts.js              # Chart.js integration - 337 lines
├── photos.js              # Photo attachments - 267 lines
├── photo-modal.js         # Full-screen photo viewer - 156 lines
├── image-compression.js   # Photo compression - 714 lines
├── templates.js           # Quote templates - 480 lines
├── export.js              # PDF generation - 347 lines
├── import-export.js       # Backup/restore - 423 lines
├── theme.js               # Dark/Light theme - 133 lines
├── theme-customizer.js    # Theme customization UI - 663 lines
├── shortcuts.js           # Keyboard shortcuts - 501 lines
│
├── Mobile & UI Enhancement Modules
├── quick-add-ui.js        # Quick add UI for mobile - 351 lines
├── custom-window-calculator.js # Custom window calculator - 314 lines
│
├── Business Intelligence Modules
├── travel-calculator.js   # Travel time & cost calculator - 331 lines
├── profitability-analyzer.js # Job profitability analysis - 324 lines
│
├── Job Management Modules
├── job-presets.js         # Job presets and templates - 428 lines
│
├── Contract Management System (NEW v1.12.0)
├── contract-manager.js    # Contract CRUD & lifecycle - 660 lines
├── contract-wizard.js     # Multi-step contract creation - 663 lines
├── contract-automation.js # Service scheduling & automation - 470 lines
├── contract-forecasting.js # Revenue forecasting & BI - 447 lines
│
├── Enhanced Analytics System (NEW v1.12.0)
├── analytics-config.js    # Analytics configuration - 276 lines
├── analytics-engine.js    # Metrics calculation engine - 624 lines
├── analytics-dashboard.js # Dashboard UI controller - 644 lines
│
├── Help & Testing Infrastructure (NEW v1.12.0)
├── help-system.js         # In-app contextual help - 555 lines
├── test-runner.js         # Test execution controller - 388 lines
├── test-framework.js      # Test framework core - 452 lines
├── test-suites.js         # Test suite definitions - 408 lines
├── test-checklist.js      # Production readiness - 362 lines
├── integration-tests.js   # Integration test suite
├── production-readiness.js # Deployment verification
│
├── Backup & Production Tools (NEW v1.12.0)
├── backup-manager.js      # Automated backup system - 531 lines
├── config-production.js   # Production configuration
│
├── GoHighLevel CRM Integration (NEW v1.11.0)
├── ghl-client.js          # GHL API client library
├── ghl-integration.js     # GHL integration orchestrator
├── task-manager.js        # Task CRUD operations - 514 lines
├── followup-automation.js # Intelligent follow-up sequences - 519 lines
├── followup-config.js     # Follow-up sequence definitions - 270 lines
├── task-dashboard-ui.js   # Task dashboard interface - 446 lines
├── ghl-task-sync.js       # Bidirectional task sync with GHL - 388 lines
├── webhook-processor.js   # Event processing engine - 921 lines
├── webhook-settings.js    # Settings UI controller - 487 lines
├── webhook-debug.js       # Testing and debugging tools - 439 lines
├── ghl-webhook-setup.js   # GHL API integration - 373 lines
│
├── PDF Generation Suite (NEW v1.10.0)
├── pdf-config.js          # PDF configuration and branding - 408 lines
├── pdf-components.js      # PDF component rendering engine - 625 lines
├── quote-pdf.js           # Quote PDF generation logic - 576 lines
├── quote-pdf-ui.js        # PDF generation UI controls - 494 lines
│
├── Production Tools (NEW v1.10.0)
├── deployment-helper.js   # Pre-deployment validation - 510 lines
├── health-check.js        # Post-deployment monitoring - 493 lines
├── bug-tracker.js         # Bug tracking and reporting - 425 lines
│
├── Performance & PWA
├── performance-monitor.js # Performance tracking - 444 lines
├── performance-utils.js   # Optimization utilities - 439 lines
├── sw.js                  # Service Worker - 223 lines
├── sw-optimized.js        # Advanced caching (not in use) - 553 lines
├── ui-components.js       # UI helpers (toast, modals) - 380 lines
│
├── CSS Files (~27 total)
├── css/design-system.css  # Design system (NEW v1.9.0) - 1,539 lines
├── css/tasks.css          # Task dashboard (NEW v1.11.0) - 439 lines
├── css/contracts.css      # Contract management (NEW v1.12.0) - 439 lines
├── css/analytics-dashboard.css # Enhanced analytics (NEW v1.12.0)
├── css/help-system.css    # Help system (NEW v1.12.0) - 439 lines
├── css/test-runner.css    # Test runner UI (NEW v1.12.0)
├── css/analytics.css      # Analytics dashboard - 138 lines
├── app.css                # Main styles - 391 lines
├── invoice.css            # Invoice UI - 856 lines
├── validation.css         # Validation error styles - 353 lines
├── theme-light.css        # Light theme overrides - 218 lines
├── theme-customizer.css   # Theme customizer UI - 262 lines
├── mobile.css             # Mobile responsive styles - 540 lines
├── quote-pdf.css          # PDF UI styling (NEW v1.10.0) - 507 lines
├── print.css              # General print styles - 214 lines
├── invoice-print.css      # Invoice print layout - 399 lines
├── photo-print-layout.css # Photo grid print layouts - 372 lines
├── letterhead.css         # Professional letterhead - 426 lines
├── toast.css              # Toast notifications - 37 lines
├── loading.css            # Loading states - 93 lines
├── photo-modal.css        # Photo modal viewer - 153 lines
├── photos.css             # Photo gallery - 99 lines
├── client-database.css    # CRM styles - 234 lines
├── quote-workflow.css     # Workflow styles - 184 lines
├── import-export.css      # Import/export UI - 167 lines
├── analytics.css          # Analytics dashboard - 138 lines
├── shortcuts.css          # Keyboard shortcuts UI - 135 lines
│
├── tests/                 # Playwright test suite (20 test files)
│   ├── bootstrap.spec.js  # Module registration tests
│   ├── calculations.spec.js # Calculation accuracy tests
│   ├── invoice-functional.spec.js # Invoice CRUD tests
│   ├── invoice-interface.spec.js  # Invoice UI tests
│   ├── security.spec.js   # XSS & security tests
│   ├── ui-interactions.spec.js # UI interaction tests
│   ├── wizards.spec.js    # Wizard dialog tests
│   ├── check-errors.spec.js # Error checking tests
│   ├── init-test.spec.js  # Initialization tests
│   ├── analytics.spec.js  # Analytics tests (NEW v1.8)
│   ├── client-database.spec.js # CRM tests (NEW v1.8)
│   ├── data-validation.spec.js # Data validation tests (NEW v1.8)
│   ├── debug-modules.spec.js # Debug system tests (NEW v1.8)
│   ├── export.spec.js     # Export functionality tests (NEW v1.8)
│   ├── storage.spec.js    # Storage tests (NEW v1.8)
│   ├── templates.spec.js  # Template system tests (NEW v1.8)
│   ├── theme.spec.js      # Theme tests (NEW v1.8)
│   ├── examples/          # Example tests
│   └── fixtures/          # Test fixtures
│
└── docs/                  # Documentation
    ├── PRINT_GUIDE.md     # Comprehensive print documentation (NEW v1.8)
    ├── THEME_CUSTOMIZATION_GUIDE.md # Theme customization (v1.7)
    ├── BUG_FIX_IMPLEMENTATION_PLAN.md
    ├── MIGRATION_STRATEGY.md
    ├── INVOICE_TESTING_CHECKLIST.md
    └── bug-reports/       # Bug tracking
```

### Script Load Order (CRITICAL)

From `index.html`, scripts MUST load in this order:

```html
<!-- 1. FIRST: Bootstrap creates APP namespace -->
<script src="bootstrap.js"></script>

<!-- 2. EARLY: Debug, Security, Validation, UI Components (no defer - must be available immediately) -->
<script src="debug.js"></script>
<script src="security.js"></script>
<script src="validation.js"></script>
<script src="ui-components.js"></script>

<!-- 3. Lazy Loader System -->
<script src="lazy-loader.js"></script>
<script src="lazy-loader-init.js" defer></script>

<!-- 4. Data & Configuration Modules (extended types must load before data.js) -->
<script src="window-types-extended.js" defer></script>
<script src="conditions-modifiers.js" defer></script>
<script src="pressure-surfaces-extended.js" defer></script>
<script src="data.js" defer></script>
<script src="quote-migration.js" defer></script>

<!-- 5. Core modules (with defer) -->
<script src="storage.js" defer></script>
<script src="calc.js" defer></script>
<script src="app.js" defer></script>

<!-- 6. Mobile & Business Intelligence Modules -->
<script src="quick-add-ui.js" defer></script>
<script src="custom-window-calculator.js" defer></script>
<script src="travel-calculator.js" defer></script>
<script src="profitability-analyzer.js" defer></script>

<!-- 7. Job Management -->
<script src="job-presets.js" defer></script>

<!-- 8. Task & Follow-up Automation (NEW v1.11.0) -->
<script src="followup-config.js" defer></script>
<script src="task-manager.js" defer></script>
<script src="followup-automation.js" defer></script>
<script src="ghl-task-sync.js" defer></script>
<script src="task-dashboard-ui.js" defer></script>

<!-- 9. Contract Management System (NEW v1.12.0) -->
<script src="contract-manager.js" defer></script>
<script src="contract-wizard.js" defer></script>
<script src="contract-automation.js" defer></script>
<script src="contract-forecasting.js" defer></script>

<!-- 10. UI and feature modules (with defer) -->
<script src="ui.js" defer></script>
<script src="wizard.js" defer></script>
<script src="loading.js" defer></script>
<script src="accessibility.js" defer></script>
<script src="client-database.js" defer></script>
<script src="quote-workflow.js" defer></script>
<script src="import-export.js" defer></script>
<script src="invoice.js" defer></script>

<!-- 11. GoHighLevel Integration & Webhook Modules (NEW v1.11.0) -->
<script src="ghl-client.js" defer></script>
<script src="ghl-integration.js" defer></script>
<script src="task-manager.js" defer></script>
<script src="followup-automation.js" defer></script>
<script src="webhook-processor.js" defer></script>
<script src="ghl-webhook-setup.js" defer></script>
<script src="webhook-settings.js" defer></script>
<script src="webhook-debug.js" defer></script>

<!-- 12. Theme & Customization -->
<script src="theme.js" defer></script>
<script src="theme-customizer.js" defer></script>
<script src="shortcuts.js" defer></script>
<script src="error-handler.js" defer></script>
<script src="export.js" defer></script>
<script src="templates.js" defer></script>

<!-- 13. PDF Generation Suite (NEW v1.10.0) -->
<script src="pdf-config.js" defer></script>
<script src="pdf-components.js" defer></script>
<script src="quote-pdf.js" defer></script>
<script src="quote-pdf-ui.js" defer></script>

<!-- 14. Photos (loaded after PDF modules) -->
<script src="photos.js" defer></script>

<!-- 15. Production Tools (NEW v1.10.0) -->
<script src="deployment-helper.js" defer></script>
<script src="health-check.js" defer></script>
<script src="bug-tracker.js" defer></script>

<!-- 16. Help & Testing Infrastructure (NEW v1.12.0) -->
<script src="help-system.js" defer></script>
<script src="test-runner.js" defer></script>
<script src="test-framework.js" defer></script>
<script src="test-suites.js" defer></script>
<script src="test-checklist.js" defer></script>
<script src="integration-tests.js" defer></script>
<script src="production-readiness.js" defer></script>

<!-- 17. Backup & Analytics (NEW v1.12.0) -->
<script src="backup-manager.js" defer></script>
<script src="analytics-config.js" defer></script>
<script src="analytics-engine.js" defer></script>
<script src="analytics-dashboard.js" defer></script>

<!-- 18. Lazy-loaded modules (loaded on demand via LazyLoader) -->
<!-- analytics.js, charts.js, photo-modal.js are loaded when needed -->
```

**Why This Order?**
- `bootstrap.js` creates `window.APP` namespace - MUST be first
- `debug.js`, `security.js`, `validation.js`, `ui-components.js` have no dependencies - load early (no defer)
- `lazy-loader.js` loads early to enable on-demand module loading
- Extended type modules must load before `data.js` to register custom types
- `quote-migration.js` handles data format updates
- `app.js` depends on `calc.js`, `data.js`, `storage.js`
- Business intelligence and mobile modules load before UI
- Contract management system loads after job presets
- Feature modules depend on core modules
- GHL integration modules load after core features
- PDF generation suite loads after features
- Help system and testing infrastructure load near end
- Analytics and backup systems load last
- Production tools load last for monitoring and debugging
- Some modules (analytics, charts, photo-modal) are lazy-loaded on demand

---

## Development Workflows

### Module Pattern (ES5 IIFE)

ALL JavaScript files follow this pattern:

```javascript
// module-name.js - Brief description
// Dependencies: List any required modules
// iOS Safari 12+ compatible (no arrow functions, template literals, or let/const)

(function() {
  'use strict';

  // Private variables
  var privateVar = 'value';
  var config = {
    setting: 123
  };

  // Private functions
  function privateHelper() {
    console.log('Private function');
  }

  // Public functions
  function publicMethod(arg) {
    var result = privateHelper();
    return result;
  }

  // Module registration
  if (window.APP && window.APP.registerModule) {
    window.APP.registerModule('moduleName', {
      publicMethod: publicMethod
    });
  }

  // Global API (if needed)
  window.ModuleName = {
    publicMethod: publicMethod,
    anotherMethod: function(arg) {
      return arg;
    }
  };

  console.log('[MODULE-NAME] Initialized');
})();
```

### Adding a New Module

**Step-by-step:**

1. **Create the file** (e.g., `new-feature.js`)

```javascript
(function() {
  'use strict';

  function init() {
    console.log('[NEW-FEATURE] Initializing...');
    // Setup code here
  }

  function doSomething() {
    // Feature logic
  }

  // Register with APP
  if (window.APP) {
    window.APP.registerModule('newFeature', {
      init: init,
      doSomething: doSomething
    });
  }

  // Also expose globally if needed
  window.NewFeature = {
    doSomething: doSomething
  };

  // Auto-init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
```

2. **Add to `index.html`** in the correct position:

```html
<!-- Add after dependencies, before dependent modules -->
<script src="new-feature.js" defer></script>
```

3. **Add CSS if needed:**

```html
<link rel="stylesheet" href="new-feature.css" />
```

4. **Write tests** in `tests/`:

```javascript
// tests/new-feature.spec.js
const { test, expect } = require('@playwright/test');

test.describe('NewFeature', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.waitForSelector('.app');
  });

  test('should initialize correctly', async ({ page }) => {
    const result = await page.evaluate(() => {
      return window.NewFeature && typeof window.NewFeature.doSomething === 'function';
    });
    expect(result).toBe(true);
  });
});
```

5. **Update documentation:**
   - Add to this CLAUDE.md
   - Update PROJECT_STATE.md
   - Update README.md if user-facing

### Git Workflow

**Branch Naming:**
- Feature branches: `claude/feature-name-sessionid`
- Bug fixes: `claude/fix-bug-name-sessionid`
- Always include Claude session ID at end

**Commit Message Format:**

```bash
# Good commit messages
git commit -m "feat: add client search functionality to CRM"
git commit -m "fix: prevent duplicate invoice numbers (BUG-002)"
git commit -m "docs: update CLAUDE.md with validation guide"
git commit -m "test: add invoice validation test cases"
git commit -m "refactor: extract calculation logic to calc.js"

# Prefix types:
# feat: New feature
# fix: Bug fix
# docs: Documentation only
# test: Adding or updating tests
# refactor: Code change that neither fixes a bug nor adds a feature
# perf: Performance improvement
# style: Formatting, missing semicolons, etc.
# chore: Updating build tasks, package.json, etc.
```

**Before Committing:**

```bash
# 1. Run tests
npm test

# 2. Check for ES6 violations
grep -r "const " *.js
grep -r "let " *.js
grep -r "=>" *.js
grep -r "\`" *.js

# 3. Stage changes
git add .

# 4. Commit with descriptive message
git commit -m "feat: add new feature"

# 5. Push to feature branch
git push -u origin branch-name
```

### Testing Workflow

**Run Tests:**

```bash
# All tests
npm test

# With browser UI (interactive)
npm run test:ui

# With browser visible (debug)
npm run test:headed

# Debug specific test
npm run test:debug -- tests/calculations.spec.js
```

**Test Structure:**

All tests use Playwright. Key test files:
- `bootstrap.spec.js` - Module registration
- `calculations.spec.js` - Pricing accuracy
- `invoice-functional.spec.js` - Invoice CRUD operations
- `invoice-interface.spec.js` - Invoice UI interactions
- `security.spec.js` - XSS prevention, sanitization
- `ui-interactions.spec.js` - Form interactions
- `wizards.spec.js` - Modal dialogs

**Writing New Tests:**

```javascript
const { test, expect } = require('@playwright/test');

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Navigate to app
    await page.goto('http://localhost:8080');

    // Wait for app to be ready
    await page.waitForSelector('.app');
    await page.waitForFunction(() => window.APP && window.APP.initialized);
  });

  test('should do something', async ({ page }) => {
    // Arrange
    await page.fill('#inputField', 'test value');

    // Act
    await page.click('#submitButton');

    // Assert
    const result = await page.textContent('#result');
    expect(result).toBe('expected value');
  });
});
```

---

## Code Conventions

### ES5 Patterns

#### Variables

```javascript
// CORRECT
var count = 0;
var items = [];
var config = { enabled: true };

// WRONG
const count = 0;  // ❌ NO const
let items = [];   // ❌ NO let
```

#### Functions

```javascript
// CORRECT
function calculateTotal(items) {
  var total = 0;
  for (var i = 0; i < items.length; i++) {
    total += items[i].price;
  }
  return total;
}

// WRONG
const calculateTotal = (items) => {  // ❌ NO arrow functions
  let total = 0;  // ❌ NO let
  items.forEach(item => total += item.price);  // ❌ NO arrow functions
  return total;
};
```

#### String Concatenation

```javascript
// CORRECT
var message = 'Hello, ' + userName + '! Total: $' + total;

// WRONG
var message = `Hello, ${userName}! Total: $${total}`;  // ❌ NO template literals
```

#### Default Parameters

```javascript
// CORRECT
function greet(name) {
  name = name || 'Guest';
  return 'Hello, ' + name;
}

// WRONG
function greet(name = 'Guest') {  // ❌ NO default parameters
  return `Hello, ${name}`;
}
```

#### Array Methods

```javascript
// CORRECT
var doubled = [];
for (var i = 0; i < numbers.length; i++) {
  doubled.push(numbers[i] * 2);
}

// ACCEPTABLE (map/filter/reduce are ES5)
var doubled = numbers.map(function(n) {
  return n * 2;
});

// WRONG
var doubled = numbers.map(n => n * 2);  // ❌ NO arrow functions
```

### Naming Conventions

```javascript
// Variables and functions: camelCase
var userName = 'John';
function calculateTotal() {}

// Constants: UPPER_SNAKE_CASE
var MAX_ITEMS = 100;
var DEFAULT_RATE = 95;

// Private functions: underscore prefix (convention only)
function _privateHelper() {}

// DOM IDs: camelCase
<input id="baseFeeInput" />

// CSS classes: kebab-case
<div class="quote-summary"></div>

// File names: kebab-case
client-database.js
quote-workflow.js
```

### Comments

```javascript
// Single-line comments for brief notes
var total = 0;  // Running total

/**
 * Multi-line comments for function documentation
 * @param {number} amount - The amount in dollars
 * @param {boolean} includeGst - Whether to include GST
 * @returns {number} Final amount with GST if applicable
 */
function calculateGst(amount, includeGst) {
  if (!includeGst) return amount;
  return amount * 1.1;
}

// Section separators for major code blocks
// ============================================
// EVENT HANDLERS
// ============================================
```

### Error Handling

```javascript
// Try-catch for potentially failing operations
function saveToStorage(key, data) {
  try {
    var json = JSON.stringify(data);
    localStorage.setItem(key, json);
    return true;
  } catch (e) {
    console.error('[STORAGE] Save failed:', e);
    // Show user-friendly message
    if (window.showToast) {
      window.showToast('Failed to save data', 'error');
    }
    return false;
  }
}

// Input validation before processing
function calculatePrice(quantity, rate) {
  // Guard clauses
  if (typeof quantity !== 'number' || quantity < 0) {
    console.warn('[CALC] Invalid quantity:', quantity);
    return 0;
  }
  if (typeof rate !== 'number' || rate < 0) {
    console.warn('[CALC] Invalid rate:', rate);
    return 0;
  }

  return quantity * rate;
}
```

### LocalStorage Operations

```javascript
// ALWAYS use try-catch with localStorage
function loadState() {
  try {
    var json = localStorage.getItem('my-key');
    if (!json) return null;
    return JSON.parse(json);
  } catch (e) {
    console.error('[APP] Failed to load state:', e);
    return null;
  }
}

// Check for quota errors
function saveState(data) {
  try {
    localStorage.setItem('my-key', JSON.stringify(data));
    return true;
  } catch (e) {
    if (e.name === 'QuotaExceededError') {
      console.error('[APP] LocalStorage quota exceeded');
      // Prompt user to clear old data
      if (window.showToast) {
        window.showToast('Storage full! Please export and delete old data.', 'error');
      }
    } else {
      console.error('[APP] Storage error:', e);
    }
    return false;
  }
}
```

---

## Testing

### Test Configuration

Tests use Playwright v1.56.1 configured in `playwright.config.js`:

```javascript
module.exports = {
  testDir: './tests',
  timeout: 30000,
  retries: 2,
  use: {
    baseURL: 'http://localhost:8080',
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'firefox', use: { browserName: 'firefox' } },
    { name: 'webkit', use: { browserName: 'webkit' } }
  ]
};
```

### Running a Local Server for Tests

```bash
# Python 3
python3 -m http.server 8080

# Node http-server
npx http-server -p 8080

# Then run tests in another terminal
npm test
```

### Test Examples

**Testing Calculations:**

```javascript
test('should calculate window cleaning correctly', async ({ page }) => {
  await page.goto('http://localhost:8080');

  // Set hourly rate
  await page.fill('#hourlyRateInput', '100');

  // Add window line
  await page.click('#addWindowLineBtn');

  // Fill in details
  await page.selectOption('.window-type-select', 'standard');
  await page.fill('.window-quantity-input', '10');

  // Check calculation
  const total = await page.textContent('#totalIncGstDisplay');
  expect(total).toContain('$');
});
```

**Testing Module Registration:**

```javascript
test('APP.registerModule should work', async ({ page }) => {
  await page.goto('http://localhost:8080');

  const result = await page.evaluate(() => {
    window.APP.registerModule('testModule', { test: true });
    return window.APP.getModule('testModule');
  });

  expect(result).toEqual({ test: true });
});
```

### Test Coverage Areas

1. **Bootstrap Tests** (`bootstrap.spec.js`)
   - Module registration
   - APP namespace creation
   - Initialization sequence

2. **Calculation Tests** (`calculations.spec.js`)
   - Window pricing accuracy
   - Pressure cleaning pricing
   - GST calculations
   - Minimum job enforcement
   - High reach premiums

3. **Invoice Tests** (`invoice-functional.spec.js`, `invoice-interface.spec.js`)
   - Invoice creation from quotes
   - Payment recording
   - Status changes
   - Invoice editing
   - PDF generation
   - Duplicate number prevention
   - GST validation

4. **Security Tests** (`security.spec.js`)
   - XSS prevention
   - HTML sanitization
   - Input validation
   - CSP enforcement

5. **UI Tests** (`ui-interactions.spec.js`)
   - Form interactions
   - Button clicks
   - Modal dialogs
   - Accordion panels

6. **Wizard Tests** (`wizards.spec.js`)
   - Window wizard
   - Pressure wizard
   - Line item creation

---

## Common Tasks

### How to Add a New Window Type

1. **Add to data.js:**

```javascript
var WINDOW_TYPES = {
  existing: { /* ... */ },
  newType: {
    name: 'New Window Type',
    time: {
      in: 3,   // minutes per pane inside
      out: 4   // minutes per pane outside
    }
  }
};
```

2. **Update wizard.js** to include in dropdown
3. **Update calc.js** if special pricing logic needed
4. **Write tests** in `calculations.spec.js`

### How to Add a New Report/Export Format

1. **Create export function:**

```javascript
// In export.js or new file
function exportToXML() {
  var state = window.APP.getState();
  var xml = '<?xml version="1.0"?>\n<quote>\n';
  xml += '  <title>' + state.quoteTitle + '</title>\n';
  // ... build XML
  xml += '</quote>';

  // Download
  var blob = new Blob([xml], { type: 'application/xml' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'quote-' + Date.now() + '.xml';
  a.click();
  URL.revokeObjectURL(url);
}
```

2. **Add button to UI:**

```html
<button id="exportXmlBtn" class="btn">Export to XML</button>
```

3. **Wire up event handler:**

```javascript
// In app.js or export.js
document.getElementById('exportXmlBtn').addEventListener('click', function() {
  exportToXML();
});
```

### How to Add a New Validation Rule

1. **Add to validation.js:**

```javascript
// Add to ValidationRules object
phoneNumber: {
  code: 'ERR_PHONE_INVALID',
  message: 'Phone number must be 10 digits',
  validate: function(value) {
    if (!value) return true;  // Optional field
    return /^\d{10}$/.test(value.replace(/\s/g, ''));
  }
}
```

2. **Use in forms:**

```javascript
function validateForm() {
  var phone = document.getElementById('phoneInput').value;
  var result = window.InvoiceValidation.validateField('phoneNumber', phone);

  if (!result.valid) {
    window.showToast(result.message, 'error');
    return false;
  }
  return true;
}
```

### How to Add a New LocalStorage Key

1. **Define in storage.js:**

```javascript
var STORAGE_KEYS = {
  EXISTING_KEY: 'existing-key',
  NEW_KEY: 'new-feature-data'  // Add here
};
```

2. **Create accessor functions:**

```javascript
function saveNewFeatureData(data) {
  return Storage.set(STORAGE_KEYS.NEW_KEY, data);
}

function loadNewFeatureData() {
  return Storage.get(STORAGE_KEYS.NEW_KEY);
}
```

3. **Document schema:**

Update `PROJECT_STATE.md` LocalStorage Schema section with:
- Key name
- Data structure
- Purpose
- When it's updated

### How to Use the Printing System (v1.8.0)

The app now includes professional print layouts for invoices, photos, and documents.

#### Print an Invoice

1. **Open invoice in invoice system**
2. **Click "Print Invoice" or press Ctrl+P**
3. **Select print options:**
   - Standard invoice layout (clean, business-ready)
   - With letterhead (professional branding)
   - With company logo (uses theme customizer logo)

**Browser Print Settings:**
- Chrome: File → Print or Ctrl+P
- Firefox: File → Print or Ctrl+P
- Safari: File → Print or Cmd+P
- Paper: A4 or Letter
- Margins: Default or Minimum (for letterhead)
- Background graphics: Enabled (for colors/logos)

#### Print Photos (Job Documentation)

1. **Add photos to quote**
2. **Click photo to open photo viewer**
3. **Select print layout:**
   - **2×2 Grid** - 4 photos/page (large, for comparisons)
   - **3×3 Grid** - 9 photos/page (standard documentation)
   - **4×4 Grid** - 16 photos/page (overview/contact sheet)
   - **Before/After** - Side-by-side with color labels
   - **Full Page** - Single photo (feature photo)
   - **Panorama** - Full-width layout

4. **Press Ctrl+P to print**

**Photo Print Features:**
- Automatic captions (title, timestamp, location)
- Page break optimization (keeps photos together)
- High-quality rendering settings
- Window measurement overlays
- Room/location labels with color badges

#### Customize Letterhead

1. **Open Theme Customizer** (Settings → Theme)
2. **Upload company logo**
3. **Set company name and tagline**
4. **Choose letterhead style:**
   - Standard: Full header and footer
   - Minimal: Thin header/footer (saves paper)
   - Formal: Extra spacing and borders
   - Modern: Gradient accents

5. **Select letterhead color:** Blue, Green, or Gray
6. **Add optional elements:**
   - Draft watermark
   - Confidential banner
   - Signature block
   - QR code for verification
   - ABN/company registration

**See:** `PRINT_GUIDE.md` for comprehensive printing documentation

### How to Add Custom Window Types (Extended)

With the new `window-types-extended.js` module, you can add Australian-specific window types:

1. **Edit window-types-extended.js:**

```javascript
// Add to EXTENDED_WINDOW_TYPES object
louvre: {
  name: 'Louvre Windows',
  description: 'Adjustable slat windows',
  time: {
    in: 4,   // minutes per pane inside
    out: 5   // minutes per pane outside
  },
  difficulty: 'medium',
  highReachMultiplier: 1.4
}
```

2. **The type will automatically register with the system**
3. **Update wizard.js** to include in dropdown if needed
4. **Write tests** in `data-validation.spec.js`

### How to Add Job Condition Modifiers

1. **Edit conditions-modifiers.js:**

```javascript
// Add to CONDITION_MODIFIERS object
extremeHeat: {
  name: 'Extreme Heat (35°C+)',
  description: 'Hot weather premium',
  multiplier: 1.15,  // 15% increase
  category: 'weather',
  enabled: true
}
```

2. **Apply modifier in quote:**

```javascript
var basePrice = 500;
var adjustedPrice = ConditionsModifiers.applyModifier(basePrice, 'extremeHeat');
// Result: $575
```

### How to Configure Lazy Loading

The lazy loader defers loading heavy modules until needed:

1. **Register a module for lazy loading** in `lazy-loader-init.js`:

```javascript
LazyLoader.register('myModule', {
  script: 'my-module.js',
  dependencies: ['jquery'],  // Optional
  preload: false  // Don't load until requested
});
```

2. **Load when needed:**

```javascript
LazyLoader.load('myModule').then(function() {
  // Module is now loaded
  window.MyModule.doSomething();
});
```

3. **Check if loaded:**

```javascript
if (LazyLoader.isLoaded('analytics')) {
  // Use analytics
}
```

**Currently Lazy-Loaded:**
- `analytics.js` - Loads when analytics panel opened
- `charts.js` - Loads when charts needed
- `photo-modal.js` - Loads when photo viewed full-screen

### How to Add Business Intelligence Features

#### Add Travel Cost Calculation

```javascript
// In travel-calculator.js
TravelCalculator.calculateDistance('123 Main St, Perth WA');
// Returns: { distance: 15.2, time: 22, cost: 12.50 }

// Add to quote
TravelCalculator.addTravelToQuote(location);
```

#### Analyze Job Profitability

```javascript
// In profitability-analyzer.js
var analysis = ProfitabilityAnalyzer.analyzeJob({
  revenue: 450,
  costs: 120,
  timeHours: 3.5
});

console.log(analysis.margin);  // 73.3%
console.log(analysis.hourlyRate);  // $128.57/hr
console.log(analysis.breakEven);  // $120
```

### How to Create Job Presets

1. **Create a preset from current quote:**

```javascript
JobPresets.createPreset('3BR House Standard', {
  baseFee: 120,
  hourlyRate: 95,
  windowLines: [
    { type: 'standard', quantity: 12 },
    { type: 'sliding', quantity: 4 }
  ],
  pressureLines: [
    { surface: 'concrete', area: 50 }
  ]
});
```

2. **Load preset later:**

```javascript
JobPresets.loadPreset('3BR House Standard');
// Automatically fills quote with saved configuration
```

3. **Organize by category:**

```javascript
var residential = JobPresets.getPresetsByCategory('residential');
var commercial = JobPresets.getPresetsByCategory('commercial');
```

### How to Generate PDF Quotes (v1.10.0)

The PDF generation suite allows you to create professional PDF quotes with jsPDF.

#### Generate and Download a PDF

```javascript
// Get current quote state
var state = window.APP.getState();

// Generate PDF
var pdf = QuotePDF.generatePDF(state);

// Download PDF
QuotePDF.download(pdf, 'quote-' + state.quoteTitle + '.pdf');
```

#### Generate and Print a PDF

```javascript
var state = window.APP.getState();
var pdf = QuotePDF.generatePDF(state);
QuotePDF.print(pdf);
```

#### Customize PDF Branding

Edit `pdf-config.js` to customize:

```javascript
// In pdf-config.js
PDF_CONFIG.branding = {
  company: {
    name: '925 Pressure Glass',
    tagline: 'Window & Pressure Cleaning Specialists',
    abn: '12 345 678 901',
    phone: '0400 000 000',
    email: 'info@925pressureglass.com.au',
    website: 'www.925pressureglass.com.au'
  },
  colors: {
    primary: '#2563eb',
    secondary: '#10b981',
    accent: '#f59e0b'
  },
  logo: 'data:image/png;base64,...' // Base64 encoded logo
};
```

#### Using PDF Components

```javascript
// Create new PDF document
var doc = new jsPDF(PDF_CONFIG);

// Add header
PDFComponents.addHeader(doc, {
  title: 'Window Cleaning Quote',
  subtitle: 'Quote #001234'
});

// Add table
var data = [
  ['Service', 'Quantity', 'Price'],
  ['Standard Windows', '10', '$150.00'],
  ['Sliding Doors', '4', '$80.00']
];
PDFComponents.addTable(doc, data, ['Service', 'Quantity', 'Price']);

// Add footer
PDFComponents.addFooter(doc, 1, 1);
```

### How to Use Production Tools (v1.10.0)

#### Pre-Deployment Validation

Before deploying to production, run comprehensive checks:

```javascript
// In browser console on staging environment
DeploymentHelper.runPreDeploymentChecks();

// Output:
// ========================================
// PRE-DEPLOYMENT CHECKS
// ========================================
//
// --- Checking Version ---
// ✓ Version: 1.10.0
//
// --- Checking Modules ---
// ✓ All 25 required modules registered
//
// --- Checking LocalStorage ---
// ✓ Available and writable
// ✓ 2.5 MB used of 5 MB quota
//
// --- Checking Security ---
// ✓ CSP headers configured
// ✓ XSS prevention active
//
// --- Checking Performance ---
// ✓ Page load: 1.2s (target: <2s)
// ✓ Memory usage: 45 MB (target: <100 MB)
//
// === ALL CHECKS PASSED ✓ ===
// Ready for deployment!
```

#### Health Monitoring in Production

```javascript
// Start continuous health monitoring (every 15 minutes)
HealthCheck.startMonitoring(15);

// Or run single health check
HealthCheck.runHealthCheck();

// Get results
var results = HealthCheck.getLastResults();
console.log('Health Score:', results.score + '/100');

// If score < 80, investigate issues
if (results.score < 80) {
  console.warn('Health issues detected:', results.issues);
}

// Stop monitoring
HealthCheck.stopMonitoring();
```

#### Enable Bug Tracking

```javascript
// Initialize bug tracker (adds "Report Bug" button to UI)
BugTracker.init();

// Users can now click the button to report bugs
// Reports include:
// - Environment (browser, OS, app version)
// - Screenshot
// - LocalStorage snapshot
// - Console errors
// - Stack traces

// View all bug reports
var bugs = BugTracker.getBugList();

// Export specific bug report
BugTracker.exportReport('bug_1234567890');
// Downloads JSON file with full bug details

// Clear all bug reports (after fixing)
BugTracker.clearBugs();
```

### How to Use GoHighLevel CRM Integration (v1.11.0)

The GoHighLevel integration provides automated follow-ups and real-time CRM sync.

#### Configure Webhook Integration

1. **Open webhook settings:**
```javascript
// Click "🔄 Sync" button in header
// Or navigate to webhook settings modal
```

2. **Configure webhook endpoint:**
- Webhook URL: Your Cloudflare Worker endpoint
- Webhook Secret: Secret key for signature verification
- Enable real-time sync: ✓
- Bidirectional sync: ✓
- Conflict resolution: "Most recent wins" (recommended)

3. **Select event subscriptions:**
- Contact Updates ✓
- Opportunity Updates ✓
- Task Updates ✓
- Note Create ✓
- Inbound Messages (optional)
- Appointment Updates (optional)

4. **Register with GoHighLevel:**
```javascript
// Click "Register Webhook" button
// This calls GHL API to set up webhook subscription
```

#### Manage Tasks

1. **View task dashboard:**
```javascript
// Click Tasks icon or navigate to #page-tasks
// Shows summary cards: Today, Overdue, Urgent, Pending
```

2. **Create manual task:**
```javascript
TaskManager.createTask({
  quoteId: 'quote_123',
  clientId: 'client_456',
  type: 'phone-call',
  priority: 'high',
  title: 'Follow up on quote',
  description: 'Discuss quote details and answer questions',
  dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
  followUpMessage: 'Hi John, following up on your quote...'
});
```

3. **Complete task:**
```javascript
TaskManager.completeTask('task_123');
// Automatically syncs to GHL if integration enabled
```

4. **Filter tasks:**
```javascript
// Use dashboard filters
// - By status: pending, in-progress, overdue, completed
// - By priority: urgent, high, normal, low
// - By type: follow-up, phone-call, email, SMS, meeting
```

#### Configure Follow-up Sequences

1. **Edit follow-up config:**
```javascript
// In followup-config.js
var config = window.FollowupConfig.get();

// Customize contact times
config.contactTimes.weekday.morning = { start: 9, end: 12 };

// Update DND times
config.dndTimes.start = 20;  // 8pm
config.dndTimes.end = 8;      // 8am

// Customize message templates
config.templates.sms.quoteFollowup = "Hi {clientName}, ...";

window.FollowupConfig.save(config);
```

2. **Trigger automatic follow-up:**
```javascript
// Automatically triggered when quote status changes
// For example, when quote is marked as "sent":
FollowupAutomation.triggerFollowup('quote-sent', quoteData);

// This creates a follow-up sequence based on:
// - Quote value (high-value gets priority)
// - Client type (repeat client, referral)
// - Quote status
```

3. **Customize follow-up sequences:**
```javascript
// Edit sequences in followup-config.js
sequences: {
  standard: [
    { delay: 24 * 60, type: 'sms', template: 'quoteFollowup' },
    { delay: 72 * 60, type: 'phone-call', template: 'quoteFollowupPhone' },
    { delay: 7 * 24 * 60, type: 'email', template: 'quoteFollowupEmail' }
  ],
  highValue: [
    { delay: 6 * 60, type: 'phone-call', template: 'highValuePhone' },
    { delay: 24 * 60, type: 'email', template: 'highValueEmail' },
    { delay: 48 * 60, type: 'phone-call', template: 'highValueSecondCall' }
  ]
}
```

#### Monitor Sync Status

1. **Check sync status:**
```javascript
// Open webhook settings modal
// Shows:
// - Status: Active / Disabled / Error
// - Last Sync: timestamp
// - Pending Events: count
```

2. **Manual sync:**
```javascript
// Click "Sync Now" button
// Or:
WebhookProcessor.processBatch();
```

3. **View event queue:**
```javascript
// Click "View Queue" in webhook settings
// Shows all pending webhook events
// Can clear queue if needed
```

#### Test Integration

1. **Simulate webhook event:**
```javascript
// Use webhook debugger
WebhookDebug.simulateEvent('ContactUpdate', {
  contactId: 'test_123',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com'
});
```

2. **Run integration tests:**
```javascript
WebhookDebug.runIntegrationTests();
// Tests all event types and sync logic
```

3. **Export debug logs:**
```javascript
WebhookDebug.exportLogs();
// Downloads JSON file with all webhook activity
```

#### Troubleshooting Integration

**Issue: Tasks not syncing to GHL**
- Check webhook URL is correct
- Verify webhook secret matches
- Check GHL API key is valid
- View event queue for failed events
- Check browser console for errors

**Issue: Duplicate tasks created**
- Check conflict resolution strategy
- Ensure task IDs are being properly mapped
- Clear event queue and re-sync

**Issue: Follow-ups not triggering**
- Verify follow-up automation is enabled
- Check quote status is changing correctly
- Review followup-config.js settings
- Check browser console for errors

### How to Debug Issues

1. **Enable debug mode:**

```javascript
// In browser console
DEBUG_CONFIG.enabled = true;
localStorage.setItem('debug-enabled', 'true');
location.reload();
```

2. **Check module registration:**

```javascript
// In console
window.APP.modules  // List all registered modules
window.APP.getState()  // Current application state
```

3. **Check LocalStorage:**

```javascript
// View all data
Object.keys(localStorage).forEach(function(key) {
  console.log(key, localStorage.getItem(key));
});
```

4. **Monitor calculations:**

```javascript
// In calc.js, add logging
console.log('[CALC] Input:', input);
console.log('[CALC] Result:', result);
```

---

## Security & Validation

### XSS Prevention

**ALWAYS sanitize user input before display:**

```javascript
// CORRECT - Use security.js utilities
var sanitized = window.Security.escapeHTML(userInput);
element.innerHTML = sanitized;

// OR better yet
window.Security.setTextSafely(element, userInput);

// WRONG - Direct innerHTML with user input
element.innerHTML = userInput;  // ❌ XSS VULNERABILITY
```

**Security Module (`security.js`) provides:**

```javascript
// HTML entity escape
window.Security.escapeHTML(str);

// Sanitize with line breaks preserved
window.Security.sanitizeWithLineBreaks(str);

// Safe text insertion
window.Security.setTextSafely(element, text);

// Safe attribute setting
window.Security.setAttributeSafely(element, attr, value);
```

### Input Validation

**Validation Module (`validation.js`) provides:**

```javascript
// Number validation
var validated = window.Security.validateNumber(input, {
  min: 0,
  max: 10000,
  decimals: 2,
  allowNegative: false,
  fallback: 0,
  fieldName: 'Hourly Rate'
});

// Currency validation (money amounts)
var amount = window.Security.validateCurrency(value, 'Payment Amount');

// Email validation
var email = window.Security.validateEmail(emailInput);

// Phone validation (Australian format)
var phone = window.Security.validatePhone(phoneInput);

// BSB validation (Australian bank code)
var bsb = window.Security.validateBSB(bsbInput);

// ABN validation (Australian Business Number)
var abn = window.Security.validateABN(abnInput);
```

**Invoice Validation (`validation.js`):**

```javascript
// Validate invoice before creation
var result = window.InvoiceValidation.validateInvoiceCreation(invoiceData);
if (!result.valid) {
  window.showToast(result.message, 'error');
  return;
}

// Validate payment before recording
var result = window.InvoiceValidation.validatePaymentRecording(paymentData);
if (!result.valid) {
  window.showToast(result.message, 'error');
  return;
}
```

### Content Security Policy

The app enforces strict CSP via `<meta>` tag in `index.html`:

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob:;
  connect-src 'self';
  object-src 'none';
">
```

**Implications:**
- No external scripts except whitelisted CDNs
- No `eval()` or `Function()` constructor
- No inline event handlers (`onclick="..."`)
- Images can be data: URIs (for photos)

### Recent Security Fixes (v1.6)

1. **Paid Invoice Protection**
   - Invoices with status "paid" cannot be edited
   - Prevents data corruption and audit trail issues
   - Location: `invoice.js:1445-1452`

2. **Duplicate Invoice Number Prevention**
   - Settings form validates invoice numbers cannot be decreased
   - Prevents tax compliance violations
   - Location: `invoice.js:728-736`

3. **GST Validation**
   - GST must equal exactly 10% of subtotal
   - Enforced in invoice editing
   - Location: `invoice.js:1625-1634`

---

## Module Reference

### Core Modules

#### bootstrap.js (4.1K)

**Purpose:** Creates `window.APP` namespace, module registration system

**Key Functions:**
- `APP.registerModule(name, module)` - Register a module
- `APP.getModule(name)` - Retrieve a module
- `APP.init()` - Initialize application
- `APP.waitForInit(timeout)` - Wait for initialization (test-friendly)

**Load Order:** MUST load first (no defer)

#### app.js (45K)

**Purpose:** Core application state management, autosave, line item management

**Key Functions:**
- `addWindowLine(data)` - Add window line item
- `addPressureLine(data)` - Add pressure line item
- `removeWindowLine(id)` - Remove window line
- `removePressureLine(id)` - Remove pressure line
- `recalculate()` - Recalculate totals
- `getState()` - Get current state
- `setState(state)` - Set state
- `saveState()` - Save to LocalStorage
- `loadState()` - Load from LocalStorage

**State Structure:**
```javascript
{
  quoteTitle: '',
  clientName: '',
  clientLocation: '',
  jobType: '',
  baseFee: 120,
  hourlyRate: 95,
  minimumJob: 180,
  highReachModifier: 60,
  windowLines: [],
  pressureLines: [],
  internalNotes: '',
  clientNotes: '',
  photos: []
}
```

#### calc.js (9.6K)

**Purpose:** Precision calculation engine using integer arithmetic

**Key Utilities:**

```javascript
// Money (all calculations in cents)
Money.toCents(dollars)        // 19.99 → 1999
Money.fromCents(cents)        // 1999 → 19.99
Money.sumCents(...cents)      // Sum in cents
Money.multiply(cents, factor) // Multiply in cents

// Time (all calculations in minutes)
Time.hoursToMinutes(hours)    // 1.5 → 90
Time.minutesToHours(minutes)  // 90 → 1.5

// Percentages
Percentage.apply(amount, pct) // Apply percentage
Percentage.calculate(part, whole) // Calculate percentage
```

**Why Integer Arithmetic?**
Prevents floating-point errors: `0.1 + 0.2 = 0.30000000000000004`

#### storage.js (1.8K)

**Purpose:** LocalStorage wrapper with error handling

**Key Functions:**
```javascript
Storage.set(key, value)  // Save (auto-stringifies)
Storage.get(key)         // Load (auto-parses)
Storage.remove(key)      // Delete
Storage.clear()          // Clear all
Storage.getQuota()       // Check quota usage
```

**LocalStorage Keys:**
- `tictacstick_autosave_state_v1` - Current quote
- `tictacstick_presets_v1` - Job presets
- `tictacstick_saved_quotes_v1` - Saved quotes
- `client-database` - Client records
- `invoice-database` - Invoices
- `invoice-settings` - Invoice config
- `quote-history` - Analytics data
- `debug-enabled` - Debug mode flag
- `lastBackupDate` - Backup timestamp

#### security.js (23K)

**Purpose:** XSS prevention, input sanitization, validation utilities

**Key Functions:**
```javascript
Security.escapeHTML(str)
Security.sanitizeWithLineBreaks(str)
Security.setTextSafely(element, text)
Security.validateNumber(value, options)
Security.validateCurrency(value, fieldName)
Security.validateEmail(email)
Security.validatePhone(phone)
Security.validateBSB(bsb)
Security.validateABN(abn)
```

#### validation.js (40K)

**Purpose:** Production-grade input validation for invoices

**Key Functions:**
```javascript
InvoiceValidation.validateInvoiceCreation(data)
InvoiceValidation.validatePaymentRecording(data)
InvoiceValidation.validateField(fieldName, value)
InvoiceValidation.showError(message)
InvoiceValidation.clearErrors()
```

**Error Codes:** 50+ error codes covering all invoice operations

### Feature Modules

#### invoice.js (67K)

**Purpose:** Complete invoicing system

**Key Features:**
- Invoice creation from quotes
- Status tracking (draft, sent, paid, overdue, cancelled)
- Payment recording and history
- PDF generation
- Bank account details management
- Duplicate invoice number prevention
- GST validation

**Key Functions:**
```javascript
InvoiceSystem.convertQuoteToInvoice(quoteState)
InvoiceSystem.saveInvoice(invoice)
InvoiceSystem.loadInvoice(id)
InvoiceSystem.recordPayment(invoiceId, payment)
InvoiceSystem.generateInvoicePDF(invoice)
InvoiceSystem.updateInvoiceStatus(id, status)
```

#### client-database.js (17K)

**Purpose:** CRM functionality

**Key Features:**
- Client registry with contact info
- Job history tracking
- Quick client lookup and autofill

**Key Functions:**
```javascript
ClientDatabase.addClient(client)
ClientDatabase.updateClient(id, client)
ClientDatabase.deleteClient(id)
ClientDatabase.searchClients(query)
ClientDatabase.getClientHistory(clientId)
```

#### analytics.js (13K)

**Purpose:** Business intelligence and reporting

**Key Features:**
- Quote history (last 100 quotes)
- Revenue tracking
- Time estimates
- Top clients analysis
- CSV export

**Key Functions:**
```javascript
QuoteAnalytics.saveToHistory(quote)
QuoteAnalytics.getStatistics()
QuoteAnalytics.renderDashboard(period)
QuoteAnalytics.exportHistory()
```

#### templates.js (14K)

**Purpose:** Quote template system

**Built-in Templates:**
1. Standard House Package
2. Apartment Balcony Special
3. Commercial Storefront
4. Driveway & Paths Package
5. Full Service Package

**Key Functions:**
```javascript
QuoteTemplates.loadTemplate(id)
QuoteTemplates.saveCustomTemplate(name, state)
QuoteTemplates.deleteTemplate(id)
```

### UI Modules

#### ui.js (4.1K)

**Purpose:** DOM manipulation and UI updates

**Key Functions:**
```javascript
UI.updateSummary(breakdown)
UI.showModal(content)
UI.hideModal()
UI.showToast(message, type)
```

#### wizard.js (13K)

**Purpose:** Modal wizard dialogs for guided input

**Key Features:**
- Window wizard (guided window line creation)
- Pressure wizard (guided pressure line creation)
- Multi-step forms
- Validation

**Key Functions:**
```javascript
Wizard.openWindowWizard()
Wizard.openPressureWizard()
Wizard.close()
```

#### theme.js (133 lines)

**Purpose:** Dark/Light theme toggle

**Key Features:**
- System preference detection
- Theme persistence
- Smooth transitions

**Key Functions:**
```javascript
Theme.toggle()
Theme.set(mode)  // 'light' or 'dark'
Theme.getCurrent()
```

#### theme-customizer.js (663 lines) **NEW v1.7.0**

**Purpose:** Advanced theme customization UI

**Key Features:**
- Custom color scheme creation
- Logo upload and management
- Font customization
- Brand color selection
- Theme presets
- Export/import custom themes
- Real-time preview

**Key Functions:**
```javascript
ThemeCustomizer.open()
ThemeCustomizer.applyCustomTheme(theme)
ThemeCustomizer.saveCustomTheme(name, theme)
ThemeCustomizer.loadCustomTheme(id)
ThemeCustomizer.exportTheme()
ThemeCustomizer.importTheme(data)
```

### Data & Configuration Modules

#### data.js (192 lines)

**Purpose:** Base pricing data and lookup tables

**Key Data:**
- Window types (standard, sliding, etc.)
- Pressure cleaning surfaces (concrete, pavers, etc.)
- Base rates and multipliers

#### window-types-extended.js (405 lines) **NEW v1.8.0**

**Purpose:** Enhanced Australian window types with detailed configurations

**Key Features:**
- Louvre windows (adjustable slats)
- Awning windows (top-hinged)
- Hopper windows (bottom-hinged)
- Bay/bow windows (curved/angled)
- Garden windows (greenhouse-style)
- Skylight windows (roof-mounted)
- Custom time factors per type
- High-reach considerations

**Key Functions:**
```javascript
WindowTypesExtended.getType(typeId)
WindowTypesExtended.calculateTime(type, quantity)
WindowTypesExtended.getAllTypes()
```

#### conditions-modifiers.js (307 lines) **NEW v1.8.0**

**Purpose:** Job condition modifiers and pricing adjustments

**Key Features:**
- Weather conditions (rain, extreme heat)
- Site difficulty (high-rise, tight access)
- Time of day (after hours, weekend)
- Urgency (same day, emergency)
- Property condition (first clean, heavy buildup)
- Safety requirements (harness work, confined space)

**Key Functions:**
```javascript
ConditionsModifiers.applyModifier(basePrice, modifierType)
ConditionsModifiers.getModifierList()
ConditionsModifiers.calculateAdjustedPrice(basePrice, conditions)
```

#### pressure-surfaces-extended.js (300 lines) **NEW v1.8.0**

**Purpose:** Extended pressure cleaning surface types

**Key Features:**
- Additional surface types (sandstone, timber decking, roof tiles)
- Surface-specific time calculations
- Difficulty ratings
- Equipment recommendations
- Chemical requirements

**Key Functions:**
```javascript
PressureSurfacesExtended.getSurface(surfaceId)
PressureSurfacesExtended.calculateTime(surface, area)
PressureSurfacesExtended.getAllSurfaces()
```

#### quote-migration.js (262 lines) **NEW v1.8.0**

**Purpose:** Quote data migration and version compatibility

**Key Features:**
- Migrate old quote formats to new structure
- Handle breaking changes gracefully
- Preserve user data during updates
- Backward compatibility checks

**Key Functions:**
```javascript
QuoteMigration.migrate(quoteData)
QuoteMigration.checkVersion(data)
QuoteMigration.upgradeToLatest(data)
```

### Performance & Loading Modules

#### lazy-loader.js (743 lines) **NEW v1.8.0**

**Purpose:** On-demand module loading system for performance optimization

**Key Features:**
- Defer loading of heavy modules (analytics, charts)
- Load modules only when needed
- Progress tracking
- Dependency management
- Error handling and fallbacks
- Preload hints for anticipated features

**Key Functions:**
```javascript
LazyLoader.load(moduleName)
LazyLoader.loadMultiple([modules])
LazyLoader.preload(moduleName)
LazyLoader.isLoaded(moduleName)
```

**Lazy-Loaded Modules:**
- `analytics.js` - Loaded when analytics panel opened
- `charts.js` - Loaded when charts needed
- `photo-modal.js` - Loaded when photo viewed full-screen

#### lazy-loader-init.js (164 lines) **NEW v1.8.0**

**Purpose:** Initialize lazy loader and set up event handlers

**Key Features:**
- Register lazy-loadable modules
- Set up UI event triggers
- Handle module load failures
- Display loading states

### Mobile & UI Enhancement Modules

#### quick-add-ui.js (351 lines) **NEW v1.8.0**

**Purpose:** Mobile-optimized quick add interface

**Key Features:**
- Streamlined UI for touch devices
- Quick window/pressure line addition
- Preset buttons for common items
- Gesture support
- Compact layout for small screens

**Key Functions:**
```javascript
QuickAddUI.show()
QuickAddUI.hide()
QuickAddUI.addQuickWindow(preset)
QuickAddUI.addQuickPressure(preset)
```

#### custom-window-calculator.js (314 lines) **NEW v1.8.0**

**Purpose:** Custom window dimension calculator

**Key Features:**
- Calculate price based on exact measurements
- Support for unusual window shapes
- Area calculation (width × height)
- Custom pricing per square meter
- Visual measurement guide

**Key Functions:**
```javascript
CustomWindowCalculator.open()
CustomWindowCalculator.calculate(width, height)
CustomWindowCalculator.addCustomWindow(dimensions)
```

### Business Intelligence Modules

#### travel-calculator.js (331 lines) **NEW v1.8.0**

**Purpose:** Calculate travel time and costs for job pricing

**Key Features:**
- Distance calculation from base location
- Travel time estimation
- Fuel cost calculation
- Travel zone pricing (CBD, suburbs, rural)
- Integration with quote pricing
- Saved locations

**Key Functions:**
```javascript
TravelCalculator.calculateDistance(destination)
TravelCalculator.calculateTravelCost(distance)
TravelCalculator.addTravelToQuote(location)
TravelCalculator.saveLocation(name, location)
```

#### profitability-analyzer.js (324 lines) **NEW v1.8.0**

**Purpose:** Analyze job profitability and margins

**Key Features:**
- Break-even analysis
- Profit margin calculation
- Cost vs. revenue comparison
- Time efficiency metrics
- Hourly rate optimization suggestions
- Job type profitability reports

**Key Functions:**
```javascript
ProfitabilityAnalyzer.analyzeJob(jobData)
ProfitabilityAnalyzer.calculateMargin(quote)
ProfitabilityAnalyzer.suggestPricing(jobType)
ProfitabilityAnalyzer.generateReport()
```

### Job Management Modules

#### job-presets.js (428 lines) **NEW v1.8.0**

**Purpose:** Job preset management and quick templates

**Key Features:**
- Save common job configurations
- Quick load presets (e.g., "3BR House Standard")
- Preset categories (residential, commercial)
- Default settings per job type
- Preset sharing and export

**Key Functions:**
```javascript
JobPresets.createPreset(name, config)
JobPresets.loadPreset(id)
JobPresets.deletePreset(id)
JobPresets.getPresetsByCategory(category)
JobPresets.exportPresets()
JobPresets.importPresets(data)
```

### GoHighLevel CRM Integration

#### task-manager.js (514 lines) **NEW v1.11.0**

**Purpose:** Core task management system for follow-ups and client engagement

**Key Features:**
- CRUD operations for tasks (create, read, update, delete)
- Task types: follow-up, phone-call, email, SMS, meeting
- Priority levels: urgent, high, normal, low
- Status tracking: pending, in-progress, completed, cancelled, overdue
- Automatic overdue detection (checks every minute)
- Task statistics and filtering
- GHL sync integration

**Key Functions:**
```javascript
TaskManager.createTask(config)
TaskManager.updateTask(id, updates)
TaskManager.deleteTask(id)
TaskManager.getTask(id)
TaskManager.getAllTasks()
TaskManager.filterTasks(filters)
TaskManager.getTaskStats()
TaskManager.markOverdue()
TaskManager.completeTask(id)
```

**Task Object Structure:**
```javascript
{
  id: 'task_...',
  quoteId: null,
  clientId: null,
  type: 'follow-up',
  priority: 'normal',
  status: 'pending',
  title: '',
  description: '',
  dueDate: null,
  scheduledDate: null,
  completedDate: null,
  assignedTo: 'Gerry',
  followUpType: null,
  followUpMessage: '',
  followUpAttempts: 0,
  ghlTaskId: null,
  syncStatus: 'pending',
  lastSync: null,
  reminders: [],
  notes: []
}
```

**Storage Key:** `tts_tasks`

#### followup-automation.js (519 lines) **NEW v1.11.0**

**Purpose:** Intelligent follow-up sequence automation based on quote lifecycle events

**Key Features:**
- Event-driven automation (quote sent, viewed, accepted, declined)
- 5 pre-configured follow-up sequences
- Smart timing (business hours, DND time respect)
- Message templates with variable substitution
- Optimal contact time calculation
- Automatic sequence triggering

**Follow-up Sequences:**
1. **Standard** - Quote sent: SMS (24h) → Phone (72h) → Email (1 week)
2. **High-Value** ($2000+): Phone (6h) → Email (24h) → Phone (48h)
3. **Repeat Client**: SMS (12h) → Phone (36h)
4. **Referral**: Phone (6h) → SMS (24h)
5. **Nurture** (declined): Email (1 week) → SMS (90 days)

**Key Functions:**
```javascript
FollowupAutomation.triggerFollowup(event, quoteData)
FollowupAutomation.createFollowupSequence(sequenceType, quote)
FollowupAutomation.getOptimalContactTime(baseDate, preferredTime)
FollowupAutomation.generateMessage(template, variables)
FollowupAutomation.scheduleFollowup(task, delay)
```

**Supported Events:**
- `quote-created`
- `quote-sent`
- `quote-viewed`
- `quote-accepted`
- `quote-declined`
- `verbal-yes`

#### followup-config.js (270 lines) **NEW v1.11.0**

**Purpose:** Configuration for follow-up sequences and contact timing rules

**Key Configuration:**
```javascript
// Contact time windows
contactTimes: {
  weekday: {
    morning: { start: 9, end: 12 },
    afternoon: { start: 14, end: 17 },
    evening: { start: 18, end: 19 }
  },
  weekend: {
    morning: { start: 10, end: 12 },
    afternoon: { start: 14, end: 16 }
  }
}

// Do Not Disturb times
dndTimes: {
  start: 20,  // 8pm
  end: 8,     // 8am
  noSunday: true
}

// Message templates
templates: {
  sms: {
    quoteFollowup: "Hi {clientName}, just following up on the {serviceType} quote..."
  },
  email: { /* ... */ },
  phoneScript: { /* ... */ }
}
```

**Storage Key:** `tts_followup_config`

#### task-dashboard-ui.js (446 lines) **NEW v1.11.0**

**Purpose:** Visual task management dashboard interface

**Key Features:**
- Summary cards (Today, Overdue, Urgent, Pending)
- Task filtering by status, priority, type
- Task details modal
- Complete/cancel task actions
- Auto-refresh every minute
- Empty state handling

**Key Functions:**
```javascript
TaskDashboardUI.init()
TaskDashboardUI.render()
TaskDashboardUI.filterTasks(filter)
TaskDashboardUI.showTaskDetails(taskId)
TaskDashboardUI.completeTask(taskId)
TaskDashboardUI.updateSummary()
```

#### ghl-task-sync.js (388 lines) **NEW v1.11.0**

**Purpose:** Bidirectional task synchronization with GoHighLevel

**Key Features:**
- Sync tasks between TicTacStick and GHL
- Maps task formats between systems
- Batch sync for offline recovery
- Auto-sync on task create/update/complete
- Graceful failure handling

**Key Functions:**
```javascript
GHLTaskSync.syncTaskToGHL(taskId)
GHLTaskSync.syncTaskFromGHL(ghlTaskId)
GHLTaskSync.batchSync()
GHLTaskSync.mapTaskToGHL(task)
GHLTaskSync.mapTaskFromGHL(ghlTask)
```

#### webhook-processor.js (921 lines) **NEW v1.11.0**

**Purpose:** Event processing engine for real-time webhook integration

**Key Features:**
- Polls Cloudflare Worker every 30 seconds
- Event queue with batch processing (10 events per batch)
- Bidirectional sync (GoHighLevel ↔ TicTacStick)
- 4 conflict resolution strategies
- Retry logic (3 attempts with exponential backoff)
- Handles 15+ event types

**Conflict Resolution Strategies:**
1. **Timestamp** - Most recent wins (recommended)
2. **GHL Wins** - GoHighLevel data always takes precedence
3. **Local Wins** - Protect local changes
4. **Manual** - User chooses (UI not implemented)

**Supported Event Types:**
- ContactCreate, ContactUpdate, ContactDelete
- OpportunityCreate, OpportunityUpdate, OpportunityStatusChange
- TaskCreate, TaskUpdate, TaskComplete, TaskDelete
- NoteCreate, InboundMessage, AppointmentUpdate, etc.

**Key Functions:**
```javascript
WebhookProcessor.start()
WebhookProcessor.stop()
WebhookProcessor.processEvent(event)
WebhookProcessor.processBatch()
WebhookProcessor.resolveConflict(localData, remoteData)
WebhookProcessor.retryFailedEvents()
```

**Storage Keys:**
- `tts_webhook_queue` - Event queue
- `tts_webhook_config` - Webhook configuration

#### webhook-settings.js (487 lines) **NEW v1.11.0**

**Purpose:** Webhook configuration and settings UI controller

**Key Features:**
- Webhook URL and secret configuration
- Event subscription management
- Sync status monitoring
- Manual sync trigger
- Event queue viewer
- Register/unregister with GHL

**Key Functions:**
```javascript
WebhookSettings.init()
WebhookSettings.saveSettings()
WebhookSettings.testWebhookEndpoint()
WebhookSettings.triggerManualSync()
WebhookSettings.viewEventQueue()
WebhookSettings.clearEventQueue()
WebhookSettings.registerWebhookWithGHL()
WebhookSettings.unregisterWebhookFromGHL()
```

#### webhook-debug.js (439 lines) **NEW v1.11.0**

**Purpose:** Testing and debugging tools for webhook integration

**Key Features:**
- Simulate webhook events for testing
- View event queue status
- Export debug logs to JSON
- Integration test suite
- Test data generators

**Key Functions:**
```javascript
WebhookDebug.simulateEvent(eventType, data)
WebhookDebug.generateTestContact()
WebhookDebug.generateTestOpportunity()
WebhookDebug.generateTestTask()
WebhookDebug.viewQueue()
WebhookDebug.exportLogs()
WebhookDebug.runIntegrationTests()
```

#### ghl-webhook-setup.js (373 lines) **NEW v1.11.0**

**Purpose:** GoHighLevel API integration for webhook registration

**Key Features:**
- Register/update/delete webhooks via GHL API
- Test endpoint connectivity
- List and verify existing webhooks
- Support for 15+ GHL event types

**Key Functions:**
```javascript
GHLWebhookSetup.registerWebhook(url, events)
GHLWebhookSetup.updateWebhook(webhookId, config)
GHLWebhookSetup.deleteWebhook(webhookId)
GHLWebhookSetup.listWebhooks()
GHLWebhookSetup.testEndpoint(url)
GHLWebhookSetup.verifyWebhook(webhookId)
```

**Required Configuration:**
- GHL API key
- Webhook endpoint URL
- Webhook secret for signature verification

### PDF Generation Suite

#### pdf-config.js (408 lines) **NEW v1.10.0**

**Purpose:** PDF configuration and company branding

**Key Features:**
- Page layout configuration (A4, margins, orientation)
- Company branding (logo, colors, contact info)
- Font settings and styles
- Header/footer templates
- Color scheme definitions

**Key Configuration:**
```javascript
PDF_CONFIG.format         // 'a4'
PDF_CONFIG.orientation    // 'portrait'
PDF_CONFIG.margin         // {top, right, bottom, left}
PDF_CONFIG.branding       // {logo, company, contact, colors}
PDF_CONFIG.fonts          // {heading, body, sizes}
```

#### pdf-components.js (625 lines) **NEW v1.10.0**

**Purpose:** Reusable PDF component rendering engine

**Key Features:**
- Header and footer components
- Table generation with styling
- Logo and image embedding
- Text formatting helpers
- QR code generation
- Signature blocks
- Terms and conditions sections

**Key Functions:**
```javascript
PDFComponents.addHeader(doc, options)
PDFComponents.addFooter(doc, pageNum, totalPages)
PDFComponents.addTable(doc, data, columns, options)
PDFComponents.addLogo(doc, logoData, x, y, width, height)
PDFComponents.addQRCode(doc, text, x, y, size)
PDFComponents.addSignatureBlock(doc, x, y)
PDFComponents.formatCurrency(amount)
PDFComponents.formatDate(date)
```

#### quote-pdf.js (576 lines) **NEW v1.10.0**

**Purpose:** Quote to PDF conversion engine

**Key Features:**
- Convert quote data to professional PDF
- Multi-page support with pagination
- Line item tables with calculations
- Summary sections with GST breakdown
- Client and job information
- Terms and conditions
- Automatic page breaks

**Key Functions:**
```javascript
QuotePDF.generatePDF(quoteData)
QuotePDF.addClientInfo(doc, quote)
QuotePDF.addJobDetails(doc, quote)
QuotePDF.addLineItems(doc, windowLines, pressureLines)
QuotePDF.addSummary(doc, breakdown)
QuotePDF.addTerms(doc)
QuotePDF.download(doc, filename)
QuotePDF.print(doc)
```

**Usage Example:**
```javascript
// Generate PDF from current quote
var state = window.APP.getState();
var pdf = QuotePDF.generatePDF(state);
QuotePDF.download(pdf, 'quote-' + state.quoteTitle + '.pdf');
```

#### quote-pdf-ui.js (494 lines) **NEW v1.10.0**

**Purpose:** PDF generation UI controls and user interactions

**Key Features:**
- Generate PDF button and modal
- Email quote preview
- Download and print options
- Progress indicators
- Error handling
- User feedback (toasts, confirmations)

**Key Functions:**
```javascript
QuotePDFUI.init()
QuotePDFUI.showGenerateModal()
QuotePDFUI.hideGenerateModal()
QuotePDFUI.handleGeneratePDF()
QuotePDFUI.showEmailModal(pdfBlob)
QuotePDFUI.handleSendEmail(pdfBlob, emailData)
```

### Production Tools

#### deployment-helper.js (510 lines) **NEW v1.10.0**

**Purpose:** Pre-deployment validation and checks

**Key Features:**
- Version verification
- Required module validation
- LocalStorage health checks
- Configuration verification
- Security audit (CSP, XSS prevention)
- Performance benchmarks
- Dependency checking
- Environment validation

**Key Functions:**
```javascript
DeploymentHelper.runPreDeploymentChecks()
DeploymentHelper.checkVersion()
DeploymentHelper.checkModules()
DeploymentHelper.checkLocalStorage()
DeploymentHelper.checkSecurity()
DeploymentHelper.checkPerformance()
DeploymentHelper.generateReport()
```

**Usage:**
```javascript
// Before deployment, run in browser console:
DeploymentHelper.runPreDeploymentChecks();
// Reviews all checks, outputs detailed report
```

**Checks Performed:**
- ✅ App version matches expected
- ✅ All required modules registered
- ✅ LocalStorage available and writable
- ✅ CSP headers configured
- ✅ No XSS vulnerabilities in test inputs
- ✅ Performance metrics within acceptable ranges
- ✅ Service Worker registered
- ✅ All critical files present

#### health-check.js (493 lines) **NEW v1.10.0**

**Purpose:** Post-deployment continuous health monitoring

**Key Features:**
- Periodic health checks
- LocalStorage monitoring
- Module availability checking
- Performance tracking
- Error rate monitoring
- Service Worker status
- Automatic issue detection
- Health score calculation

**Key Functions:**
```javascript
HealthCheck.runHealthCheck()
HealthCheck.startMonitoring(intervalMinutes)
HealthCheck.stopMonitoring()
HealthCheck.getLastResults()
HealthCheck.checkLocalStorage()
HealthCheck.checkModules()
HealthCheck.checkPerformance()
HealthCheck.generateHealthScore()
```

**Usage:**
```javascript
// Single health check
HealthCheck.runHealthCheck();

// Continuous monitoring every 15 minutes
HealthCheck.startMonitoring(15);

// Get last results
var results = HealthCheck.getLastResults();
console.log('Health Score:', results.score + '/100');
```

**Monitored Metrics:**
- LocalStorage availability and quota
- Module registration status
- App initialization state
- Error frequency
- Performance metrics (load time, memory)
- Service Worker status
- Browser compatibility

#### bug-tracker.js (425 lines) **NEW v1.10.0**

**Purpose:** User bug reporting and tracking system

**Key Features:**
- User-friendly bug report interface
- Automatic environment capture
- Screenshot attachment support
- LocalStorage state snapshot
- Error stack trace capture
- Bug severity classification
- Export reports to JSON
- Bug list management

**Key Functions:**
```javascript
BugTracker.init()
BugTracker.showReportModal()
BugTracker.submitReport(bugData)
BugTracker.attachScreenshot(screenshot)
BugTracker.captureEnvironment()
BugTracker.captureState()
BugTracker.exportReport(bugId)
BugTracker.getBugList()
BugTracker.clearBugs()
```

**Usage:**
```javascript
// Initialize bug tracker (adds UI button)
BugTracker.init();

// User clicks "Report Bug" button
// Modal appears with form:
// - Bug title
// - Description
// - Steps to reproduce
// - Severity (low, medium, high, critical)
// - Screenshot upload

// Automatic capture includes:
// - Browser and OS info
// - App version
// - URL and timestamp
// - LocalStorage snapshot
// - Console errors
// - Performance metrics
```

**Bug Report Structure:**
```javascript
{
  id: 'bug_1234567890',
  timestamp: '2025-11-18T10:30:00Z',
  title: 'Invoice PDF generation fails',
  description: 'When clicking Generate PDF...',
  severity: 'high',
  environment: {
    browser: 'Safari 12.1',
    os: 'iOS 12.4',
    appVersion: '1.10.0',
    url: 'https://...'
  },
  state: { /* LocalStorage snapshot */ },
  screenshot: 'data:image/png;base64,...',
  stackTrace: '...'
}
```

### Contract Management System (NEW v1.12.0)

#### contract-manager.js (660 lines) **NEW v1.12.0**

**Purpose:** Contract CRUD operations and lifecycle management

**Key Features:**
- Contract types: residential, commercial, strata
- Service frequencies with volume discounts (5-20%)
- Contract statuses: draft, pending, active, suspended, cancelled, completed
- Payment terms: upfront, monthly, quarterly, annual
- Auto-renewal configuration
- Service scheduling and reminders

**Key Functions:**
```javascript
ContractManager.createContract(data)
ContractManager.updateContract(id, updates)
ContractManager.deleteContract(id)
ContractManager.getContract(id)
ContractManager.getAllContracts()
ContractManager.filterContracts(filters)
ContractManager.calculatePrice(services, frequency)
ContractManager.scheduleNextService(contractId)
ContractManager.processRenewal(contractId)
```

**Storage Key:** `tts_contracts`

#### contract-wizard.js (663 lines) **NEW v1.12.0**

**Purpose:** Multi-step contract creation wizard

**Key Features:**
- Step 1: Client selection/creation
- Step 2: Service configuration with pricing preview
- Step 3: Frequency and discount selection
- Step 4: Payment terms setup
- Step 5: Contract terms and conditions
- Step 6: Review and confirmation
- Navigation: Previous/Next/Save as Draft
- Real-time pricing updates

**Key Functions:**
```javascript
ContractWizard.open()
ContractWizard.close()
ContractWizard.nextStep()
ContractWizard.previousStep()
ContractWizard.goToStep(stepNumber)
ContractWizard.saveProgress()
ContractWizard.loadDraft(contractId)
ContractWizard.submitContract()
```

#### contract-automation.js (470 lines) **NEW v1.12.0**

**Purpose:** Service scheduling and automated contract management

**Key Features:**
- Daily task scheduler (runs automatically)
- Service reminders (7 days, 1 day before due)
- Renewal processing (automatic and manual)
- Status updates and notifications
- Overdue contract handling
- Invoice generation triggers
- Email/SMS notification system

**Key Functions:**
```javascript
ContractAutomation.init()
ContractAutomation.scheduleDailyTasks()
ContractAutomation.sendServiceReminders()
ContractAutomation.processRenewals()
ContractAutomation.handleOverdueContracts()
ContractAutomation.generateInvoices()
```

**Automation Schedule:**
- Runs daily at 8:00 AM
- Checks for upcoming services (7-day window)
- Processes renewals (30-day window)
- Updates overdue contracts
- Sends notifications

#### contract-forecasting.js (447 lines) **NEW v1.12.0**

**Purpose:** Revenue forecasting and business intelligence

**Key Features:**
- MRR (Monthly Recurring Revenue) calculation
- ARR (Annual Recurring Revenue) projection
- ACV (Annual Contract Value) tracking
- CLV (Customer Lifetime Value) analysis
- Churn rate monitoring
- Revenue forecasting (3, 6, 12 months)
- Business valuation metrics
- Contract health scoring

**Key Functions:**
```javascript
ContractForecasting.calculateMRR()
ContractForecasting.calculateARR()
ContractForecasting.calculateACV()
ContractForecasting.calculateCLV()
ContractForecasting.calculateChurnRate()
ContractForecasting.forecastRevenue(months)
ContractForecasting.getBusinessValuation()
ContractForecasting.getHealthScore(contractId)
```

**Key Metrics:**
- MRR: Sum of all active monthly contract values
- ARR: MRR × 12
- Churn Rate: (Cancelled contracts / Total contracts) × 100
- CLV: Average contract value × Average contract duration
- Business Valuation: ARR × 4-6 (SaaS multiple)

### Enhanced Analytics System (NEW v1.12.0)

#### analytics-config.js (276 lines) **NEW v1.12.0**

**Purpose:** Analytics configuration and presets

**Key Features:**
- Date range presets (today, week, month, quarter, year, custom)
- Metric definitions and thresholds
- Chart configurations (colors, types, options)
- Export templates (CSV, PDF, JSON)
- Dashboard layout settings

**Key Functions:**
```javascript
AnalyticsConfig.getDateRangeConfig(rangeId)
AnalyticsConfig.getMetricConfig(metricName)
AnalyticsConfig.getChartConfig(chartType)
AnalyticsConfig.getExportTemplate(format)
```

#### analytics-engine.js (624 lines) **NEW v1.12.0**

**Purpose:** Metrics calculation and business intelligence engine

**Key Features:**
- Revenue metrics (total, by period, by source, by service)
- Conversion rate analysis
- Customer acquisition cost (CAC) calculation
- Average order value (AOV) tracking
- Win/loss rate calculation
- Performance trend analysis
- Comparative metrics (YoY, MoM, WoW)
- Predictive analytics

**Key Functions:**
```javascript
AnalyticsEngine.calculateRevenue(dateRange, filters)
AnalyticsEngine.calculateConversionRate(dateRange)
AnalyticsEngine.calculateCAC(dateRange)
AnalyticsEngine.calculateAOV(dateRange)
AnalyticsEngine.calculateWinRate(dateRange)
AnalyticsEngine.analyzeTrends(metric, dateRange)
AnalyticsEngine.comparePerformance(metric, period1, period2)
AnalyticsEngine.predictRevenue(months)
```

#### analytics-dashboard.js (644 lines) **NEW v1.12.0**

**Purpose:** Interactive analytics dashboard UI controller

**Key Features:**
- Real-time metrics display with auto-refresh
- Interactive charts and graphs (Chart.js integration)
- Date range filtering with presets
- Drill-down capabilities for detailed analysis
- Export to CSV/PDF/JSON
- Customizable dashboard layouts
- Mobile-responsive design
- Dark/light theme support

**Key Functions:**
```javascript
AnalyticsDashboard.init()
AnalyticsDashboard.render()
AnalyticsDashboard.updateMetrics()
AnalyticsDashboard.renderChart(chartId, data)
AnalyticsDashboard.applyDateRange(range)
AnalyticsDashboard.drillDown(metric)
AnalyticsDashboard.export(format)
AnalyticsDashboard.saveLayout()
```

### Help & Testing Infrastructure (NEW v1.12.0)

#### help-system.js (555 lines) **NEW v1.12.0**

**Purpose:** In-app contextual help and documentation

**Key Features:**
- Contextual tooltips and hints
- Interactive tutorials and walkthroughs
- Video tutorial links
- Searchable FAQ database
- Quick help (press ? key)
- Context-sensitive help
- Beginner/advanced modes
- Help content versioning

**Key Functions:**
```javascript
HelpSystem.init()
HelpSystem.showTooltip(elementId, content)
HelpSystem.startTutorial(tutorialId)
HelpSystem.searchHelp(query)
HelpSystem.showContextHelp()
HelpSystem.setUserLevel(level) // 'beginner' or 'advanced'
```

**Help Topics:**
- Getting started
- Creating quotes
- Managing clients
- Invoice generation
- Contract management
- Analytics and reporting
- Keyboard shortcuts
- Troubleshooting

#### test-runner.js (388 lines) **NEW v1.12.0**

**Purpose:** In-browser test execution controller

**Key Features:**
- Run tests without external tools
- Test suite selection and filtering
- Real-time test results display
- Console output capture
- Test report generation
- Export results to JSON/CSV
- Performance benchmarking
- Production readiness verification

**Key Functions:**
```javascript
TestRunner.init()
TestRunner.runSuite(suiteId)
TestRunner.runAllTests()
TestRunner.filterTests(filter)
TestRunner.exportResults(format)
TestRunner.getTestStatus()
```

#### test-framework.js (452 lines) **NEW v1.12.0**

**Purpose:** Test framework core functionality

**Key Features:**
- Assertion library (expect, assert, toBe, toEqual, etc.)
- Test lifecycle hooks (beforeEach, afterEach, beforeAll, afterAll)
- Async test support
- Test fixtures and mocks
- Error handling and reporting
- Test isolation
- Coverage tracking (basic)

**Key Functions:**
```javascript
TestFramework.describe(name, fn)
TestFramework.test(name, fn)
TestFramework.expect(value)
TestFramework.beforeEach(fn)
TestFramework.afterEach(fn)
TestFramework.mock(object, method)
```

#### test-suites.js (408 lines) **NEW v1.12.0**

**Purpose:** Test suite definitions for all modules

**Test Suites:**
- Core functionality tests (calc, storage, app)
- Invoice system tests
- Client database tests
- Contract management tests
- Analytics tests
- Security tests (XSS, validation)
- Integration tests
- Performance tests
- UI interaction tests

#### test-checklist.js (362 lines) **NEW v1.12.0**

**Purpose:** Production readiness checklist

**Checklist Items:**
- Code quality verification
- Security audit
- Performance benchmarks
- Browser compatibility
- Accessibility compliance
- Data validation
- Error handling
- Documentation completeness
- Backup/restore functionality
- Mobile responsiveness

### Backup & Production Tools (NEW v1.12.0)

#### backup-manager.js (531 lines) **NEW v1.12.0**

**Purpose:** Automated backup and restore system

**Key Features:**
- Scheduled automatic backups (daily, weekly, monthly)
- Manual backup on demand
- Export to JSON with compression
- Import and restore functionality
- Backup versioning and history
- Selective backup (choose data types)
- Backup validation and integrity checks
- Cloud storage integration ready

**Key Functions:**
```javascript
BackupManager.init()
BackupManager.createBackup()
BackupManager.scheduleBackup(frequency)
BackupManager.restoreBackup(backupId)
BackupManager.exportBackup(backupId, format)
BackupManager.importBackup(file)
BackupManager.validateBackup(backup)
BackupManager.getBackupHistory()
BackupManager.deleteBackup(backupId)
```

**Backup Data Includes:**
- Quotes and quote history
- Invoices and payments
- Clients and contacts
- Contracts and services
- Analytics data
- Settings and preferences
- Templates and presets

**Storage Keys:**
- `tts_backups` - Backup metadata
- `tts_backup_schedule` - Backup schedule config
- `tts_last_backup` - Last backup timestamp

---

## Design System

### Overview

TicTacStick v1.9.0 includes a comprehensive design system for consistent, accessible, and professional UI/UX.

**Files:**
- `css/design-system.css` - Complete CSS design system (1,200+ lines)
- `ui-components.js` - JavaScript UI helpers (430+ lines)
- `docs/DESIGN_SYSTEM.md` - Full documentation (1,000+ lines)

### Quick Start

**Using Design System Components:**

```html
<!-- Primary Button -->
<button class="btn btn-primary">Save Quote</button>

<!-- Form Input with Label -->
<div class="form-group">
    <label class="form-label form-label-required" for="name">Client Name</label>
    <input type="text" id="name" class="form-input" aria-required="true">
    <span class="form-hint">Full name as it appears on quote</span>
</div>

<!-- Card Component -->
<div class="card">
    <div class="card-header">
        <h3 class="card-title">Quote Summary</h3>
    </div>
    <div class="card-body">
        <p>Card content...</p>
    </div>
</div>
```

**Using UI Components (JavaScript):**

```javascript
// Show success toast
UIComponents.showToast('Quote saved!', 'success');

// Show loading overlay
UIComponents.showLoading('Saving...');
UIComponents.hideLoading();

// Confirmation modal
UIComponents.showConfirm({
    title: 'Delete Quote?',
    message: 'This cannot be undone.',
    confirmText: 'Delete',
    danger: true,
    onConfirm: function() {
        // Delete action
    }
});
```

### Button Components

```html
<!-- Button Variants -->
<button class="btn btn-primary">Primary Action</button>
<button class="btn btn-secondary">Secondary Action</button>
<button class="btn btn-tertiary">Tertiary Action</button>
<button class="btn btn-danger">Delete</button>
<button class="btn btn-success">Complete</button>

<!-- Button Sizes -->
<button class="btn btn-sm">Small</button>
<button class="btn">Default</button>
<button class="btn btn-lg">Large</button>

<!-- Button Modifiers -->
<button class="btn btn-block">Full Width</button>
<button class="btn btn-loading">Loading...</button>
<button class="btn btn-icon">
    <svg>...</svg> With Icon
</button>
```

### Form Components

```html
<!-- Text Input -->
<div class="form-group">
    <label class="form-label" for="email">Email</label>
    <input type="email" id="email" class="form-input">
</div>

<!-- Select Dropdown -->
<select class="form-select" aria-label="Choose option">
    <option value="">Select...</option>
    <option value="1">Option 1</option>
</select>

<!-- Textarea -->
<textarea class="form-textarea" rows="4"></textarea>

<!-- Checkbox -->
<div class="form-checkbox-wrapper">
    <input type="checkbox" id="agree" class="form-checkbox">
    <label for="agree">I agree</label>
</div>

<!-- Error State -->
<input type="text" class="form-input form-input-error">
<span class="form-error">This field is required</span>
```

### Color System

**CSS Variables:**

```css
/* Primary Colors */
--color-primary: #2563eb
--color-primary-light: #3b82f6
--color-primary-dark: #1e40af

/* Semantic Colors */
--color-error: #ef4444
--color-warning: #f59e0b
--color-success: #10b981
--color-info: #3b82f6

/* Neutral Scale */
--color-neutral-50: #f9fafb    /* Lightest */
--color-neutral-100: #f3f4f6   /* Cards */
--color-neutral-200: #e5e7eb   /* Borders */
--color-neutral-500: #6b7280   /* Text */
--color-neutral-900: #111827   /* Darkest */
```

### Typography

```css
/* Font Sizes */
--font-size-xs: 0.75rem     /* 12px */
--font-size-sm: 0.875rem    /* 14px */
--font-size-base: 1rem      /* 16px - iOS safe */
--font-size-lg: 1.125rem    /* 18px */
--font-size-xl: 1.25rem     /* 20px */

/* Font Weights */
--font-weight-normal: 400
--font-weight-medium: 500
--font-weight-semibold: 600
--font-weight-bold: 700
```

### Spacing & Layout

```css
/* Spacing Scale */
--spacing-xs: 0.25rem    /* 4px */
--spacing-sm: 0.5rem     /* 8px */
--spacing-md: 1rem       /* 16px */
--spacing-lg: 1.5rem     /* 24px */
--spacing-xl: 2rem       /* 32px */

/* Border Radius */
--radius-sm: 0.25rem     /* 4px */
--radius-md: 0.5rem      /* 8px */
--radius-lg: 0.75rem     /* 12px */
--radius-full: 9999px    /* Pills */

/* Shadows */
--shadow-sm: 0 1px 2px...
--shadow-md: 0 4px 6px...
--shadow-lg: 0 10px 15px...
```

### UI Components (JavaScript)

#### Toast Notifications

```javascript
// Success
UIComponents.showToast('Operation successful!', 'success');

// Error
UIComponents.showToast('Something went wrong', 'error');

// Warning
UIComponents.showToast('Please review', 'warning');

// Info
UIComponents.showToast('Quote autosaved', 'info');

// Custom duration (ms)
UIComponents.showToast('Message', 'success', 5000);
```

#### Loading States

```javascript
// Show loading overlay
UIComponents.showLoading('Generating PDF...');

// Hide loading overlay
UIComponents.hideLoading();
```

#### Modals

```javascript
// Confirmation modal
UIComponents.showConfirm({
    title: 'Confirm Delete',
    message: 'Are you sure you want to delete this quote?',
    confirmText: 'Delete',
    cancelText: 'Cancel',
    danger: true,  // Red button
    onConfirm: function() {
        // Confirmed
    },
    onCancel: function() {
        // Cancelled
    }
});

// Alert modal
UIComponents.showAlert({
    title: 'Success',
    message: 'Quote has been saved.',
    buttonText: 'OK',
    onClose: function() {
        // Closed
    }
});
```

### Accessibility

**ARIA Labels:**

```html
<!-- Button with icon only -->
<button class="btn btn-tertiary" aria-label="Close modal">
    <svg>...</svg>
</button>

<!-- Form input -->
<input
    type="text"
    aria-required="true"
    aria-describedby="hint"
>
<span id="hint">Helper text</span>

<!-- Modal -->
<div
    class="modal"
    role="dialog"
    aria-modal="true"
    aria-labelledby="modal-title"
>
    <h3 id="modal-title">Title</h3>
</div>
```

**Focus States:**

All interactive elements have visible focus indicators:
```css
*:focus {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
}
```

**Screen Reader Only:**

```html
<span class="sr-only">Loading...</span>
```

### Mobile & iOS Safari

**Touch Targets:**
- Minimum 44px height for all interactive elements
- Adequate spacing between touch targets

**iOS Fixes:**
```css
/* Prevent zoom on input focus */
input, select, textarea {
    font-size: 16px;  /* iOS won't zoom */
}

/* Viewport height fix (handled by UIComponents.init()) */
.full-height {
    height: calc(var(--vh, 1vh) * 100);
}

/* Smooth scrolling */
.modal-body {
    -webkit-overflow-scrolling: touch;
}
```

**Modal Background Scroll Prevention:**

Automatically handled by UI components:
```javascript
// Prevents body scroll when modal opens
document.body.classList.add('modal-open');
```

### Responsive Patterns

**Mobile-First Breakpoints:**

```css
/* Mobile: 0-767px (default) */

/* Tablet: 768px+ */
@media (min-width: 768px) { }

/* Desktop: 1024px+ */
@media (min-width: 1024px) { }
```

**Utilities:**

```html
<!-- Stack to row -->
<div class="stack-mobile">
    <!-- Vertical on mobile, horizontal on tablet+ -->
</div>

<!-- Visibility -->
<div class="hide-mobile">Desktop only</div>
<div class="show-mobile">Mobile only</div>
```

### Best Practices

**DO ✅**
- Use CSS variables for colors and spacing
- Add ARIA labels to icon-only buttons
- Use `btn-primary` for main actions
- Show loading states for async operations
- Use confirmation modals for destructive actions
- Maintain 44px minimum touch targets
- Test on actual iOS devices

**DON'T ❌**
- Don't use inline styles
- Don't create custom colors
- Don't skip ARIA labels
- Don't use `<div>` for buttons
- Don't animate width/height (use transform)
- Don't use browser `alert()` or `confirm()`
- Don't make touch targets smaller than 44px

### Migration from Old Styles

**Button Classes:**

| Old | New |
|-----|-----|
| `btn-small` | `btn-sm` |
| `btn-ghost` | `btn-tertiary` |
| Custom colors | `btn-primary`, `btn-secondary`, `btn-danger` |

**Toast Notifications:**

Replace custom toast with:
```javascript
UIComponents.showToast(message, type, duration);
```

### Complete Documentation

For full design system documentation including all components, patterns, and examples:

**See:** `docs/DESIGN_SYSTEM.md`

This includes:
- Complete component library
- Usage examples for every component
- Color system details
- Typography scale
- Spacing and layout patterns
- Accessibility guidelines
- iOS Safari compatibility
- Animation patterns
- Best practices and anti-patterns

---

## Troubleshooting

### Common Issues

#### Issue: "APP is not defined"

**Cause:** `bootstrap.js` not loaded or loaded with `defer`

**Solution:**
```html
<!-- CORRECT: No defer on bootstrap.js -->
<script src="bootstrap.js"></script>

<!-- WRONG -->
<script src="bootstrap.js" defer></script>
```

#### Issue: Module not registering

**Cause:** Module loads before `bootstrap.js`

**Solution:** Check script order in `index.html`. `bootstrap.js` must be first.

#### Issue: Tests timing out

**Cause:** App not initialized before test runs

**Solution:**
```javascript
// Wait for initialization
await page.waitForFunction(() => window.APP && window.APP.initialized);
```

#### Issue: LocalStorage quota exceeded

**Symptoms:** `QuotaExceededError` in console, autosave fails

**Solutions:**
1. Export backup via "Export History" button
2. Clear old quotes from history
3. Delete unnecessary saved quotes
4. Compress or remove old photos

**Prevention:**
- Photo compression automatically reduces size
- History limited to 100 most recent quotes
- Backup reminders every 30 days

#### Issue: Calculations incorrect (floating-point errors)

**Cause:** Direct floating-point math instead of integer arithmetic

**Wrong:**
```javascript
var total = 0.1 + 0.2;  // 0.30000000000000004
```

**Correct:**
```javascript
var cents1 = Money.toCents(0.1);  // 10
var cents2 = Money.toCents(0.2);  // 20
var totalCents = Money.sumCents(cents1, cents2);  // 30
var total = Money.fromCents(totalCents);  // 0.30
```

#### Issue: XSS vulnerability introduced

**Symptoms:** Security tests failing, `<script>` tags executing

**Cause:** Using `innerHTML` with unsanitized user input

**Wrong:**
```javascript
element.innerHTML = userInput;  // ❌
```

**Correct:**
```javascript
window.Security.setTextSafely(element, userInput);  // ✅
```

#### Issue: ES6 code breaks iOS Safari

**Symptoms:** App works in Chrome but fails on iPad

**Cause:** ES6+ syntax used

**Common violations:**
```javascript
// Find these and fix
grep -r "const " *.js
grep -r "let " *.js
grep -r "=>" *.js
grep -r "\`" *.js
```

**Fix:** Rewrite in ES5 (see [Code Conventions](#code-conventions))

### Debugging Tools

#### Enable Debug Mode

```javascript
// In browser console
DEBUG_CONFIG.enabled = true;
localStorage.setItem('debug-enabled', 'true');
location.reload();
```

**Provides:**
- Verbose logging
- State change tracking
- Performance metrics

#### Inspect Application State

```javascript
// Get current state
window.APP.getState()

// View all modules
window.APP.modules

// Check specific module
window.APP.getModule('invoice')

// Check LocalStorage
Object.keys(localStorage)
```

#### Monitor Performance

```javascript
// Check performance metrics
window.PerformanceMonitor.getMetrics()

// Track specific operation
window.PerformanceMonitor.mark('operationStart');
// ... do operation ...
window.PerformanceMonitor.measure('operation', 'operationStart');
```

### Getting Help

**Documentation Files:**
- `README.md` - Project overview
- `PROJECT_STATE.md` - Comprehensive state summary
- `QUICK_START.md` - Quick reference
- `ERROR_CATALOG.md` - Error reference
- `DEBUG_SYSTEM_GUIDE.md` - Debug system
- `SECURITY.md` - Security implementation
- `VALIDATION_INTEGRATION_GUIDE.md` - Validation guide
- `TEST_REPORT.md` - Test documentation
- `docs/INVOICE_TESTING_CHECKLIST.md` - Invoice testing

**Test Examples:**
- `tests/examples/` - Example test patterns

**Issue Tracking:**
- `docs/bug-reports/` - Known bugs and fixes

---

## Quick Reference

### Most Common Operations

**Add a window line:**
```javascript
window.APP.addWindowLine({
  type: 'standard',
  quantity: 10,
  insidePanes: 10,
  outsidePanes: 10,
  highReach: false
});
```

**Add a pressure line:**
```javascript
window.APP.addPressureLine({
  surface: 'concrete',
  area: 50,
  unit: 'sqm'
});
```

**Recalculate totals:**
```javascript
window.APP.recalculate();
```

**Save current state:**
```javascript
window.APP.saveState();
```

**Create invoice from current quote:**
```javascript
var state = window.APP.getState();
var invoice = window.InvoiceSystem.convertQuoteToInvoice(state);
window.InvoiceSystem.saveInvoice(invoice);
```

**Show toast notification:**
```javascript
window.showToast('Operation successful!', 'success');
window.showToast('Something went wrong', 'error');
window.showToast('Please note...', 'info');
```

**Sanitize user input:**
```javascript
var safe = window.Security.escapeHTML(userInput);
```

**Validate a number:**
```javascript
var value = window.Security.validateNumber(input, {
  min: 0,
  max: 10000,
  decimals: 2,
  fieldName: 'Price'
});
```

### File Location Quick Reference

| Task | File |
|------|------|
| Add new window type | `data.js`, `window-types-extended.js` |
| Add job condition modifiers | `conditions-modifiers.js` |
| Add pressure surface types | `pressure-surfaces-extended.js` |
| Modify calculation logic | `calc.js` |
| Change state management | `app.js` |
| Update UI rendering | `ui.js` |
| Modify invoice system | `invoice.js` |
| Add validation rules | `validation.js` |
| Change security policies | `security.js` |
| Update PWA config | `manifest.json` |
| Modify offline caching | `sw.js` |
| Change test config | `playwright.config.js` |
| Update styles | `app.css`, `invoice.css`, `mobile.css`, etc. |
| Add keyboard shortcuts | `shortcuts.js` |
| Customize theme/branding | `theme-customizer.js` |
| Add business intelligence | `travel-calculator.js`, `profitability-analyzer.js` |
| Modify print layouts | `print.css`, `invoice-print.css`, `letterhead.css`, `photo-print-layout.css` |
| Add mobile features | `quick-add-ui.js`, `custom-window-calculator.js` |
| Configure lazy loading | `lazy-loader.js`, `lazy-loader-init.js` |
| Add job presets | `job-presets.js` |
| Migrate quote data | `quote-migration.js` |
| Generate PDF quotes | `quote-pdf.js`, `pdf-components.js`, `pdf-config.js` |
| Customize PDF branding | `pdf-config.js` |
| Add PDF UI controls | `quote-pdf-ui.js`, `quote-pdf.css` |
| Run pre-deployment checks | `deployment-helper.js` |
| Monitor production health | `health-check.js` |
| Enable bug tracking | `bug-tracker.js` |
| Update design system | `css/design-system.css` |
| Add UI components | `ui-components.js` |
| Manage contracts | `contract-manager.js`, `contract-wizard.js` |
| Configure contract automation | `contract-automation.js` |
| Revenue forecasting | `contract-forecasting.js` |
| Analytics configuration | `analytics-config.js`, `analytics-engine.js` |
| Analytics dashboard | `analytics-dashboard.js` |
| Add help content | `help-system.js` |
| Run tests | `test-runner.js`, `test-framework.js` |
| Configure backups | `backup-manager.js` |

---

## Appendix

### Version History

- **v1.12.0** (Current - 2025-11-18) - Contract Management & Recurring Revenue System
  - Contract management system (4 modules, ~2,240 lines)
  - Enhanced analytics system (3 modules, ~1,544 lines)
  - Help system with contextual tutorials
  - Testing infrastructure (test runner, framework, suites)
  - Automated backup system
  - MRR/ARR tracking and revenue forecasting
  - Service scheduling and automation
  - Business intelligence and reporting
  - In-app help and documentation
  - Production readiness tools
  - Total: ~8,700 lines of new code

- **v1.11.0** (2025-11-18) - GoHighLevel CRM Integration & Automated Follow-ups
  - Task management system (task-manager.js, task-dashboard-ui.js)
  - Intelligent follow-up automation (followup-automation.js, followup-config.js)
  - Webhook integration system (webhook-processor.js, webhook-settings.js, webhook-debug.js)
  - GoHighLevel API integration (ghl-webhook-setup.js, ghl-task-sync.js)
  - Real-time bidirectional sync
  - 5 pre-configured follow-up sequences
  - Task dashboard UI with filtering
  - Total: ~5,700 lines of new code

- **v1.10.0** (2025-11-18) - PDF Generation Suite & Production Tools
  - Professional PDF quote generation with jsPDF
  - PDF configuration and branding system (`pdf-config.js`)
  - Reusable PDF components library (`pdf-components.js`)
  - Quote to PDF conversion engine (`quote-pdf.js`)
  - PDF generation UI controls (`quote-pdf-ui.js`)
  - PDF styling system (`quote-pdf.css`)
  - Pre-deployment validation tool (`deployment-helper.js`)
  - Production health monitoring (`health-check.js`)
  - User bug tracking and reporting (`bug-tracker.js`)
  - Total: ~4,000 lines of new code

- **v1.9.0** (2025-11-18) - Professional UI/UX Design System
  - Complete design system (`css/design-system.css` - 1,539 lines)
  - UI component helpers (`ui-components.js` - 380 lines)
  - Comprehensive design documentation (`docs/DESIGN_SYSTEM.md` - 964 lines)
  - Mobile-first responsive patterns with iOS Safari optimizations
  - WCAG AA accessibility compliance
  - Professional button and form components
  - Toast notifications, modals, loading states
  - Total: ~2,800 lines of new code + documentation

- **v1.8.0** (2025-11-18) - Enhanced print layouts system
  - Professional invoice printing (`invoice-print.css`)
  - Photo grid layouts for job documentation (`photo-print-layout.css`)
  - Professional letterhead system (`letterhead.css`)
  - Comprehensive print documentation (`PRINT_GUIDE.md`)
  - Extended window types, conditions, and surface types
  - Lazy loading system for performance optimization
  - Mobile UI enhancements (quick add, custom calculator)
  - Business intelligence modules (travel, profitability)
  - Job presets management
  - Quote migration system
  - 8 new test suites

- **v1.7.0** (2025-11-17) - Theme customization and comprehensive documentation
  - Theme customizer with custom branding
  - Logo upload and management
  - Custom color schemes
  - Comprehensive CLAUDE.md created
  - Mobile responsive design improvements

- **v1.6.0** - Critical invoice bug fixes, validation integration
  - Fixed paid invoice editing
  - Duplicate invoice number prevention
  - GST validation enforcement

- **v1.5.0** - Security hardening, error handling audit
- **v1.4.0** - Dark/Light theme, analytics, photos
- **v1.3.0** - CSV export, templates, validation
- **v1.2.0** - Keyboard shortcuts, print styles, PWA icons
- **v1.1.0** - PWA support, Service Worker, test suite
- **v1.0.0** - Initial release

### Related Documentation

**User Documentation:**
- `README.md` - User guide and features
- `QUICK_START.md` - Quick start guide
- `KEYBOARD_SHORTCUTS.md` - Keyboard shortcuts

**Developer Documentation:**
- `PROJECT_STATE.md` - Comprehensive project state
- `SECURITY.md` - Security implementation
- `VALIDATION_INTEGRATION_GUIDE.md` - Validation guide
- `TEST_REPORT.md` - Test documentation
- `DEBUG_SYSTEM_GUIDE.md` - Debug system
- `PRINT_GUIDE.md` - Printing documentation (v1.8.0)
- `THEME_CUSTOMIZATION_GUIDE.md` - Theme customization (v1.7.0)

**Planning Documents:**
- `IMPROVEMENT_PLAN_V2.0.md` - Future roadmap
- `PRIORITY_MATRIX.md` - Feature prioritization
- `PHASE_1_COMPLETE.md` - Phase 1 summary
- `docs/MIGRATION_STRATEGY.md` - Cloud migration plan
- `CHANGELOG.md` - Complete version history

### License

MIT License - 925 Pressure Glass

### Maintainer

**Gerard Varone** - 925 Pressure Glass
**Location:** Perth, Western Australia
**Project Phase:** Phase 3 - Business Transformation & Recurring Revenue
**Current Version:** 1.12.0

---

**For AI Assistants:**

This document is your primary reference for understanding and contributing to the TicTacStick Quote Engine codebase. Always:

1. ✅ **Read this file first** before making changes
2. ✅ **Follow ES5 constraints** strictly
3. ✅ **Test your changes** with `npm test`
4. ✅ **Use integer arithmetic** for money calculations
5. ✅ **Sanitize all user input** before display
6. ✅ **Document your changes** in relevant files
7. ✅ **Update this file** if you add new conventions

**Critical reminders:**
- NO ES6+ syntax (const, let, arrow functions, template literals)
- NO build tools or transpilation
- MUST work offline indefinitely
- MUST use integer arithmetic for money
- MUST sanitize user input for XSS prevention
- MUST maintain iOS Safari 12+ compatibility

Good luck! 🚀
