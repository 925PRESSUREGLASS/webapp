# TicTacStick v2.0 Implementation Plan

## Overview

This document outlines the 12-week implementation timeline for migrating from TicTacStick v1.x to v2.0. The goal is to rebuild the application using modern web technologies while preserving all existing functionality.

## Technology Stack

| Component | v1.x | v2.0 |
|-----------|------|------|
| Framework | Vanilla JavaScript (ES5) | Vue 3 + Quasar Framework |
| Language | JavaScript | TypeScript |
| State Management | Global `APP` object | Pinia stores |
| Styling | Custom CSS | Quasar + SCSS |
| Build System | None (direct browser loading) | Vite |
| Testing | Playwright E2E only | Vitest (unit) + Playwright (E2E) |
| PWA | Custom service worker | Workbox |
| Native | Capacitor | Capacitor (unchanged) |

## Phase 1: Foundation (Weeks 1-2)

### Week 1: Project Setup ✅
- [x] Create monorepo structure with workspaces
- [x] Move v1.x files to `/v1/` directory
- [x] Create shared `@tictacstick/calculation-engine` package
- [x] Create shared `@tictacstick/ui` package placeholder
- [x] Initialize Quasar project at `/apps/quote-engine/`
- [x] Configure TypeScript, ESLint, Prettier
- [x] Set up Pinia stores (quote, settings)
- [x] Create basic layout and navigation

### Week 2: Core Data Structures ✅
- [x] Define TypeScript interfaces for all data types
- [x] Port pricing data structures from `data.js`
- [x] Port window types from `window-types-extended.js`
- [x] Port pressure surfaces from `pressure-surfaces-extended.js`
- [x] Port conditions and modifiers from `conditions-modifiers.js`
- [x] Create comprehensive test suite for data structures

## Phase 2: Calculation Engine (Weeks 3-4)

### Week 3: Core Calculations ✅
- [x] Port precision calculation helpers from `calc.js`
- [x] Implement window cost calculations with all modifiers
- [x] Implement pressure cost calculations with all modifiers
- [x] Port GST calculations with integer arithmetic
- [x] Port minimum job logic
- [x] Add unit tests with 100% coverage (109 tests passing)

### Week 4: Advanced Calculations ✅
- [x] Port travel calculation logic from `travel-calculator.js`
- [x] Port high reach calculations
- [x] Port setup buffer calculations
- [x] Implement time estimation
- [x] Port profitability analyzer logic (basic)
- [x] Comprehensive calculation testing with edge cases

## Phase 3: Quote Builder UI (Weeks 5-6)

### Week 5: Line Item Components ✅
- [x] Create `WindowLineEditor` component
- [x] Create `PressureLineEditor` component
- [x] Implement window type selector with icons
- [x] Implement surface type selector
- [x] Create condition/access modifier selectors
- [x] Add real-time price preview
- [x] Create `QuoteSummary` component with breakdown

### Week 6: Quote Management ✅
- [x] Create complete quote wizard flow
- [x] Implement quote saving/loading (IndexedDB)
- [x] Port quick-add presets functionality (presets store)
- [x] Create SavedQuotesPage with filtering/sorting
- [x] Implement quote validation (errors + warnings)
- [x] Add undo/redo support (with keyboard shortcuts)

## Phase 4: Client & Storage (Weeks 7-8)

### Week 7: Storage Layer ✅ (Completed early with Week 6)
- [x] Port `storage.js` to TypeScript composable (`useStorage.ts`)
- [x] Implement IndexedDB adapter for large data
- [x] Create sync composable for cloud backup (export/import)
- [x] Port storage quota manager (basic)
- [ ] Implement data migration from v1.x format
- [ ] Add encryption support for sensitive data

### Week 8: Client Management
- [ ] Port `client-database.js` functionality
- [ ] Create client directory component
- [ ] Implement client search and filtering
- [ ] Add client-quote associations
- [ ] Create client import/export
- [ ] Port CSV import functionality

## Phase 5: Invoice System (Weeks 9-10)

### Week 9: Invoice Core
- [ ] Port `invoice.js` to TypeScript
- [ ] Create invoice store
- [ ] Implement quote-to-invoice conversion
- [ ] Create invoice editor component
- [ ] Implement payment recording
- [ ] Add status management

### Week 10: Invoice Features
- [ ] Create invoice list with filtering
- [ ] Implement aging report
- [ ] Create print/PDF invoice view
- [ ] Port invoice validation
- [ ] Add invoice settings management
- [ ] Implement invoice statistics

## Phase 6: Advanced Features (Weeks 11-12)

### Week 11: Analytics & Reporting
- [ ] Port analytics engine
- [ ] Create analytics dashboard components
- [ ] Implement chart visualizations
- [ ] Add export functionality
- [ ] Create performance metrics display

### Week 12: Integration & Polish
- [ ] Port GHL integration (if enabled)
- [ ] Implement push notifications
- [ ] Add keyboard shortcuts
- [ ] Implement help system
- [ ] Complete accessibility audit
- [ ] Performance optimization
- [ ] Documentation update

## Testing Strategy

### Unit Tests (Vitest)
- All calculation functions
- Store actions and getters
- Utility functions
- Composables

### Component Tests (Vitest + Vue Test Utils)
- Component rendering
- User interactions
- Form validation
- Event handling

### E2E Tests (Playwright)
- Critical user flows
- Quote creation workflow
- Invoice generation
- Data persistence
- Offline functionality

### Manual Testing
- iOS Safari compatibility
- Android WebView
- Offline mode
- Performance benchmarks

## Deployment Strategy

### Staging Environment
1. Deploy v2.0 to staging URL (e.g., `v2-staging.tictacstick.com`)
2. Run full test suite
3. Beta testing with select users
4. Collect feedback and iterate

### Production Rollout
1. Deploy with feature flag (v1 default)
2. Gradual rollout to % of users
3. Monitor error rates and performance
4. Full rollout after 1 week stability
5. Keep v1 accessible at `/v1/` for fallback

### Migration Path
1. Automatic data migration on first v2 load
2. Export v1 data before migration
3. Rollback capability for 30 days
4. Clear communication to users

## Risk Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Data migration failure | High | Medium | Thorough testing, backup before migration |
| Performance regression | Medium | Low | Benchmark against v1, optimize early |
| Feature parity gaps | High | Medium | Detailed feature checklist, user feedback |
| iOS Safari issues | Medium | Medium | Continuous iOS testing, feature detection |
| Offline sync conflicts | Medium | High | Conflict resolution strategy, user notification |

## Success Metrics

### Technical
- [ ] Bundle size < 500KB (gzipped)
- [ ] First contentful paint < 1.5s
- [ ] Time to interactive < 3s
- [ ] Lighthouse score > 90 (all categories)
- [ ] 0 accessibility violations (critical/serious)

### Business
- [ ] All v1 features available in v2
- [ ] User satisfaction maintained or improved
- [ ] No increase in support tickets
- [ ] Successful migration for 100% of users

## Timeline Summary

```
Week 1-2:   Foundation & Project Setup ✅
Week 3-4:   Calculation Engine
Week 5-6:   Quote Builder UI
Week 7-8:   Client & Storage
Week 9-10:  Invoice System
Week 11-12: Advanced Features & Polish
Week 13+:   Gradual rollout & monitoring
```

## Resources

- [Quasar Documentation](https://quasar.dev/)
- [Vue 3 Documentation](https://vuejs.org/)
- [Pinia Documentation](https://pinia.vuejs.org/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [Workbox Documentation](https://developer.chrome.com/docs/workbox/)

## Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2025-11-27 | 0.1.0 | Initial plan created |

---

*Last updated: November 27, 2025*
