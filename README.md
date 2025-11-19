# Tic-Tac-Stick Quote Engine

Professional quoting tool for **925 Pressure Glass** - Window & Pressure Cleaning services.

**Current Version:** v1.13.2 | [See Changelog](CHANGELOG.md)

## Features

### Core Functionality
- **Window Cleaning Quotes** - 6 window types with customizable pricing
- **Pressure Cleaning Quotes** - 60+ surface types with area-based calculations
- **Smart Pricing Engine** - GST calculations, high-reach premiums, minimum job enforcement
- **Quote Management** - Autosave, save/load multiple quotes, presets
- **Export Options** - PDF generation, CSV/Excel, copy to clipboard for SMS/email
- **Visual Analytics** - Real-time cost breakdown with Chart.js visualizations
- **Quote Templates** - 5 built-in templates + save custom templates
- **Invoice System** - Convert quotes to invoices, payment tracking, tax compliance
- **Client Database** - CRM functionality with contact management and history
- **Quote Workflow** - Status tracking (draft, sent, accepted, declined, completed)

### Progressive Web App (PWA)
- **Offline Capability** - Works without internet connection via Service Worker
- **Install as App** - Add to home screen on mobile devices
- **Fast Loading** - Cached assets for instant startup
- **App Icons** - Professional branding with custom icons

### Productivity Features
- **Keyboard Shortcuts** - Power-user shortcuts for common actions (see [KEYBOARD_SHORTCUTS.md](KEYBOARD_SHORTCUTS.md))
- **Toast Notifications** - Visual feedback for actions
- **Professional Print Layout** - Optimized PDF export with clean formatting and letterhead
- **Quick Help** - Press `?` to see available shortcuts
- **Error Handling** - LocalStorage quota warnings, validation, offline detection
- **Form Validation** - Real-time validation with helpful error messages
- **Dark/Light Theme** - Toggle themes with ☀️/🌙 button, respects system preference
- **Quote History & Analytics** - Track all quotes, view business statistics, visual charts
- **Photo Upload** - Attach before/after photos with automatic compression and full-screen preview
- **Loading States** - Clear feedback for async operations (photo processing, analytics, exports)
- **Enhanced Accessibility** - ARIA labels, keyboard navigation, screen reader support
- **Performance Optimization** - Input debouncing for smooth calculation updates

### Advanced Features (v1.10-v1.13)
- **PDF Generation Suite** - Professional PDF quotes with customizable branding
- **Contract Management** - Recurring service contracts with automated billing and MRR/ARR tracking
- **Task Management** - Follow-up automation with GoHighLevel CRM integration
- **Enhanced Analytics** - Advanced reporting with conversion funnels and cohort analysis
- **Mobile Features** - Camera integration, geolocation, push notifications
- **Backup System** - Comprehensive backup and restore with cloud storage ready
- **Testing Infrastructure** - Production-ready testing framework and manual checklists
- **Help System** - In-app contextual help and interactive tutorials
- **Production Tools** - Pre-deployment validation, health monitoring, bug tracking

### Technology
- Pure Vanilla JavaScript (ES5-compatible for iOS Safari)
- No frameworks or build tools required
- Client-side only - works anywhere
- LocalStorage for data persistence

## 📋 Fix Documentation

TicTacStick v1.7+ is under active development. Comprehensive fix documentation is available:

- **[Master Fix Roadmap](docs/fixes/MASTER_TODO_FIXES.md)** - Complete overview of all planned fixes
- **[P0 Critical Fixes](docs/fixes/P0_IMMEDIATE_FIXES.md)** - Immediate blockers (test suite, iOS Safari)
- **[P1 High Priority](docs/fixes/P1_HIGH_PRIORITY_FIXES.md)** - iOS Safari compatibility improvements
- **[P2 Medium Priority](docs/fixes/P2_MEDIUM_PRIORITY_FIXES.md)** - Future enhancements and architecture improvements

For a navigation index of all fix documentation, see [docs/fixes/README.md](docs/fixes/README.md).

**Current Status:** Production-ready with known areas for improvement. See P0 documentation for immediate action items.

## Getting Started

### Quick Start
1. Open `index.html` in any modern browser
2. Start creating quotes immediately
3. All data saves automatically to your browser

### Development Setup

#### Install Dependencies
```bash
npm install
```

#### Run Tests
```bash
# Run all tests
npm test

# Run tests with browser UI
npm run test:ui

# Run tests in headed mode (see browser)
npm run test:headed

# Debug tests
npm run test:debug
```

#### Local Server
```bash
# Python 3
python3 -m http.server 8080

# Then visit: http://localhost:8080
```

## Testing

Comprehensive automated tests using Playwright:

- **Calculation Tests** - Verify pricing accuracy and GST calculations
- **UI Tests** - Ensure all interactions work correctly
- **Wizard Tests** - Validate quick-entry dialogs
- **Cross-Browser Tests** - Chrome, Firefox, Safari, Mobile browsers
- **Responsive Tests** - Mobile and tablet viewports

### Running Tests

```bash
# Run all tests
npm test

# Run specific test suite
npm test tests/unit/storage.test.js

# Known Issues:
# See docs/fixes/P0_IMMEDIATE_FIXES.md for details on current test status
```

## Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (iOS 12+)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Deployment

### Static Hosting
Deploy to any static hosting service:
- GitHub Pages
- Netlify
- Vercel
- AWS S3
- Cloudflare Pages

### Example: GitHub Pages
```bash
git add .
git commit -m "Deploy quote engine"
git push origin main

# Enable GitHub Pages in repository settings
# Point to main branch, root directory
```

## File Structure

```
├── index.html              # Main application
├── app.css                 # Styling
├── toast.css               # Toast notification styles
├── print.css               # Print/PDF stylesheet
├── app.js                  # Core logic & state
├── calc.js                 # Precision calculation engine
├── data.js                 # Pricing data & lookup tables
├── storage.js              # LocalStorage wrapper
├── ui.js                   # UI interactions
├── wizard.js               # Modal wizard dialogs
├── shortcuts.js            # Keyboard shortcuts
├── manifest.json           # PWA manifest
├── sw.js                   # Service worker
├── icon.svg                # App icon (SVG source)
├── icon-192.png            # PWA icon 192x192
├── icon-512.png            # PWA icon 512x512
├── favicon.png             # Browser favicon
├── generate-icons.html     # Icon generator utility
├── playwright.config.js    # Test configuration
├── package.json            # Dependencies & scripts
├── README.md               # This file
├── KEYBOARD_SHORTCUTS.md   # Shortcuts reference
└── tests/                  # Automated tests
    ├── calculations.spec.js
    ├── ui-interactions.spec.js
    └── wizards.spec.js
```

## Keyboard Shortcuts

Press `?` in the app to see all available shortcuts, or check [KEYBOARD_SHORTCUTS.md](KEYBOARD_SHORTCUTS.md) for the full reference.

**Quick shortcuts:**
- `Cmd/Ctrl + S` - Save preset
- `Cmd/Ctrl + W` - Add window line
- `Cmd/Ctrl + P` - Add pressure line
- `Cmd/Ctrl + E` - Export to PDF
- `ESC` - Close modals

## Generating App Icons

1. Open `generate-icons.html` in your browser
2. Click the download buttons to get:
   - `icon-192.png` (192x192)
   - `icon-512.png` (512x512)
   - `favicon.png` (32x32)
3. Save the files to the root directory
4. Icons will be automatically used by the PWA

## Quote Templates

5 built-in templates to get started quickly:

1. **Standard House Package** - 3-bedroom house with standard windows
2. **Apartment Balcony Special** - Balcony glass and sliding doors
3. **Commercial Storefront** - Retail shop front windows
4. **Driveway & Paths Package** - Residential pressure cleaning
5. **Full Service Package** - Windows + pressure cleaning combo

**To use templates:**
- Select from "Choose Template..." dropdown in Job Settings
- Or save your own custom templates with "Save as Template"

## Export Options

### CSV/Excel Export
Click "Export to CSV/Excel" to download a spreadsheet-compatible file containing:
- Quote metadata (client, location, date)
- Job settings and pricing
- All line items (windows and pressure cleaning)
- Cost summary and time estimates
- Notes

Perfect for:
- Importing into accounting software
- Quote comparisons in Excel
- Business analytics and reporting

## Theme Support

Switch between dark and light themes:
- Click the ☀️/🌙 button in the header
- Automatically detects system preference
- Saves your preference
- Smooth animated transitions

Perfect for:
- Daytime use (light theme)
- Nighttime use (dark theme)
- Reducing eye strain
- Matching your device settings

## Quote History & Analytics

Track your business performance:
- Automatic quote history (last 100 quotes)
- Total revenue and quote count
- Average quote value
- Total hours estimated
- Quote breakdown (windows/pressure/mixed)
- Top clients by revenue
- Export history to CSV

**To use:**
1. Click "Save to History" after creating a quote
2. View analytics in the Analytics panel
3. Export history for accounting/reporting

## Photo Attachments

Document jobs with before/after photos:
- Click "📷 Add Photos" to upload
- Automatic image compression (max 1920px)
- Base64 storage for offline capability
- Photos included in quotes
- Thumbnail gallery view
- Remove individual photos or clear all

**Supported:**
- All image formats (JPEG, PNG, etc.)
- Multiple photos per quote
- Up to 5MB per image (before compression)

## Recent Improvements

### v1.13.2 (Latest - 2025-11-19)
- ✅ **iOS Safari:** Fixed critical line item rendering on iPad/iPhone
- ✅ **Data Validation:** Created quote validation system (quote-validation.js)
- ✅ **Jobs Tracking:** Completed global initialization (60% → 100%)
- ✅ **Help System:** Completed page wiring (50% → 100%)
- ✅ **Integration:** Overall completion improved: 88% → 95%
- ✅ **Production Ready:** All critical systems operational

### v1.13.0 (2025-11-18)
- ✅ Fixed 4 XSS security vulnerabilities in user input handling
- ✅ Fixed critical production blocker (missing file reference)
- ✅ Fixed calculation edge case in window cleaning quotes
- ✅ Fixed modal structure for customer/job creation
- ✅ Added complete Jobs tracking feature with UI
- ✅ Optimized wizard UX with design system components
- ✅ Integration completion improved: 72% → 88%

### v1.12.0 (2025-11-18)
- ✅ Contract management system with recurring billing
- ✅ Enhanced analytics with interactive dashboards
- ✅ Mobile/native features (camera, geolocation, push notifications)
- ✅ Comprehensive backup and restore system
- ✅ Complete testing infrastructure (browser-based + manual)
- ✅ In-app contextual help system
- ✅ Production configuration management
- ✅ ~10,000 lines of new code across 19 modules

### v1.11.0 (2025-11-18)
- ✅ Task management system with automated follow-ups
- ✅ GoHighLevel CRM integration (bidirectional sync)
- ✅ Webhook integration with event processing
- ✅ 5 intelligent follow-up sequences
- ✅ Task dashboard with priority management
- ✅ ~5,700 lines of new code

### v1.10.0 (2025-11-18)
- ✅ Professional PDF generation suite with jsPDF
- ✅ Pre-deployment validation tools
- ✅ Production health monitoring
- ✅ Built-in bug tracking and reporting
- ✅ ~4,000 lines of new code

### v1.9.0 (2025-11-18)
- ✅ Client database and CRM functionality
- ✅ Quote workflow and status tracking
- ✅ Testing and production polish
- ✅ WCAG AA accessibility compliance
- ✅ ~6,700 lines of new code

For complete version history, see [CHANGELOG.md](CHANGELOG.md)

## License

MIT License - 925 Pressure Glass

## Support

For issues or questions, contact the development team.
