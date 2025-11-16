# Tic-Tac-Stick Quote Engine

Professional quoting tool for **925 Pressure Glass** - Window & Pressure Cleaning services.

## Features

### Core Functionality
- **Window Cleaning Quotes** - 6 window types with customizable pricing
- **Pressure Cleaning Quotes** - 5 surface types with area-based calculations
- **Smart Pricing Engine** - GST calculations, high-reach premiums, minimum job enforcement
- **Quote Management** - Autosave, save/load multiple quotes, presets
- **Export Options** - PDF generation, copy to clipboard for SMS/email
- **Visual Analytics** - Real-time cost breakdown with Chart.js visualizations

### Progressive Web App (PWA)
- **Offline Capability** - Works without internet connection via Service Worker
- **Install as App** - Add to home screen on mobile devices
- **Fast Loading** - Cached assets for instant startup

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
├── app.js                  # Core logic & state
├── calc.js                 # Precision calculation engine
├── data.js                 # Pricing data & lookup tables
├── storage.js              # LocalStorage wrapper
├── ui.js                   # UI interactions
├── wizard.js               # Modal wizard dialogs
├── manifest.json           # PWA manifest
├── sw.js                   # Service worker
├── playwright.config.js    # Test configuration
└── tests/                  # Automated tests
    ├── calculations.spec.js
    ├── ui-interactions.spec.js
    └── wizards.spec.js
```

## Recent Improvements

### v1.1 (Latest)
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
