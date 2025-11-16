# Quick Start Guide - Tic-Tac-Stick Quote Engine

Welcome to your enhanced quote engine! This guide will help you get started with the new features.

## ✅ What's New (v1.2)

### 1. Keyboard Shortcuts ⌨️

Work faster with power-user shortcuts:

- **`Cmd/Ctrl + W`** - Add window line instantly
- **`Cmd/Ctrl + P`** - Add pressure cleaning line
- **`Cmd/Ctrl + E`** - Export to PDF
- **`Cmd/Ctrl + S`** - Save current preset
- **`?`** - Show all shortcuts

See [KEYBOARD_SHORTCUTS.md](KEYBOARD_SHORTCUTS.md) for the complete list.

### 2. Professional PDF Export 📄

The print stylesheet now creates beautiful, professional quotes:

- Clean invoice layout
- Company branding header
- No buttons or controls in print
- Optimized for A4 paper
- Terms & conditions footer

**To export:** Press `Cmd/Ctrl + E` or click "Export Quote Breakdown (PDF)"

### 3. App Icons 🎨

Custom branding for your PWA:

- Professional window-cleaning themed icon
- Sparkle effects for that "clean" look
- 192x192 and 512x512 sizes for all devices
- Favicon for browser tabs

**To generate icons:**
1. Open `generate-icons.html` in your browser
2. Click download buttons for each size
3. Save files to the root directory

### 4. Toast Notifications 🔔

Visual feedback for every action:

- Appears top-right when you use shortcuts
- Auto-dismisses after 3 seconds
- Color-coded: green (success), blue (info), red (error)

## 🚀 First Time Setup

### Generate Your Icons

1. Open `generate-icons.html`
2. Download all three icon files:
   - icon-192.png
   - icon-512.png
   - favicon.png
3. Save them to `/Users/gerardvarone/Documents/GitHub/webapp/`

### Test the App

1. Start local server:
   ```bash
   python3 -m http.server 8080
   ```

2. Visit: http://localhost:8080

3. Try keyboard shortcuts:
   - Press `?` to see help
   - Press `Cmd/Ctrl + W` to add a window line
   - Press `Cmd/Ctrl + E` to test PDF export

### Install as PWA

On your phone or desktop:
1. Visit the app in your browser
2. Look for "Install" or "Add to Home Screen"
3. Now you can use it offline!

## 📱 Mobile Tips

- All keyboard shortcuts work on external keyboards
- Touch-friendly interface (no keyboard needed)
- Works offline after first visit
- Add to home screen for app-like experience

## 🎯 Common Workflows

### Quick Quote Creation
1. Press `Cmd/Ctrl + T` to focus title
2. Type client name
3. Press `Cmd/Ctrl + Shift + W` to open wizard
4. Fill in window details
5. Press `Cmd/Ctrl + E` to export

### Repeat Customer
1. Load saved quote from dropdown
2. Modify quantities as needed
3. Update client name
4. Export instantly

### Professional PDF
1. Complete quote details
2. Add client-facing notes
3. Press `Cmd/Ctrl + E`
4. Print dialog opens
5. Save as PDF or print directly

## 🔧 Troubleshooting

### Shortcuts Not Working?
- Check if you're in an input field (most shortcuts disabled there)
- Make sure shortcuts.js is loaded (check browser console)
- Try refreshing the page

### Icons Not Showing?
- Generate icons using generate-icons.html
- Save files to correct directory
- Clear browser cache
- Check manifest.json is loading

### PDF Looks Wrong?
- Use Chrome/Edge for best results
- Check print preview before saving
- Ensure print.css is loaded
- Try "Save as PDF" from print dialog

## 📚 Next Steps

- Read [KEYBOARD_SHORTCUTS.md](KEYBOARD_SHORTCUTS.md) for all shortcuts
- Check [README.md](README.md) for full documentation
- Run tests: `npm test`
- Customize icons in icon.svg

## 🆘 Need Help?

Press `?` anytime in the app to see keyboard shortcuts help.

---

**Version:** 1.2
**Last Updated:** 2025
**925 Pressure Glass** - Professional Window & Pressure Cleaning
