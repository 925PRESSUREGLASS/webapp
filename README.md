# Tic-Tac-Stick Quote Engine

Professional quoting tool for **925 Pressure Glass** - Window & Pressure Cleaning services.

## Features

### Core Functionality
- **Window Cleaning Quotes** - 6 window types with customizable pricing
- **Pressure Cleaning Quotes** - 5 surface types with area-based calculations
- **Smart Pricing Engine** - GST calculations, high-reach premiums, minimum job enforcement
- **Quote Management** - Autosave, save/load multiple quotes, presets
- **Export Options** - PDF, CSV/Excel, copy to clipboard for SMS/email
- **Visual Analytics** - Real-time cost breakdown with Chart.js visualizations
- **Quote Templates** - 5 built-in templates + save custom templates

### Progressive Web App (PWA)
- **Offline Capability** - Works without internet connection via Service Worker
- **Install as App** - Add to home screen on mobile devices
- **Fast Loading** - Cached assets for instant startup
- **App Icons** - Professional branding with custom icons

### Productivity Features
- **Keyboard Shortcuts** - Power-user shortcuts for common actions (see [KEYBOARD_SHORTCUTS.md](KEYBOARD_SHORTCUTS.md))
- **Toast Notifications** - Visual feedback for actions
- **Professional Print Layout** - Optimized PDF export with clean formatting
- **Quick Help** - Press `?` to see available shortcuts
- **Error Handling** - LocalStorage quota warnings, validation, offline detection
- **Form Validation** - Real-time validation with helpful error messages

### Technology
- Pure Vanilla JavaScript (ES5-compatible for iOS Safari)
- No frameworks or build tools required
- Client-side only - works anywhere
- LocalStorage for data persistence

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

## Recent Improvements

### v1.3 (Latest)
- ✅ CSV/Excel export functionality
- ✅ Quote templates system (5 built-in + custom)
- ✅ Enhanced error handling and validation
- ✅ LocalStorage quota monitoring
- ✅ Offline status detection
- ✅ Real-time form validation

### v1.2
- ✅ Added keyboard shortcuts for power users
- ✅ Created professional print stylesheet for PDFs
- ✅ Added toast notifications for user feedback
- ✅ Generated PWA app icons and favicon
- ✅ Icon generator utility for easy customization

### v1.1
- ✅ Fixed duplicate HTML in summary section
- ✅ Added PWA support for offline capability
- ✅ Implemented Service Worker caching
- ✅ Added comprehensive Playwright test suite
- ✅ Cross-browser and mobile testing
- ✅ Created proper project documentation

## License

MIT License - 925 Pressure Glass

## Support

For issues or questions, contact the development team.
