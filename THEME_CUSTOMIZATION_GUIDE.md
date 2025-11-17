# Theme Customization Guide
**Version:** 1.7.0
**Date:** November 18, 2025
**Feature:** Advanced Theme Customization System

---

## Overview

The Theme Customization system allows users to create fully personalized color schemes and upload custom logos for the Tic-Tac-Stick Quote Engine. This feature provides a professional white-labeling capability, enabling businesses to match the application's appearance to their brand identity.

---

## Features

### 🎨 Color Customization
- **18 customizable color variables** covering all UI elements
- Real-time color pickers with hex code input
- Live preview mode while editing
- Base theme selection (Dark or Light)
- WCAG contrast validation recommended

### 🖼️ Logo Upload
- Custom logo support (replaces default icon)
- File size limit: 500KB
- Supported formats: PNG, JPG, GIF, SVG
- Logo stored in localStorage as base64

### 💾 Import/Export
- Export custom themes as JSON files
- Import themes from JSON files
- Share themes across devices or with team members
- Backup and restore custom configurations

### 🔄 Reset Functionality
- One-click reset to default theme
- Clears all customizations
- Restores original colors and logo

---

## How to Use

### Opening the Theme Customizer

1. **Via UI Button:**
   - Click the **"🎨 Customize"** button in the header
   - Located next to the theme toggle button

2. **Via JavaScript API:**
   ```javascript
   window.ThemeCustomizer.open();
   ```

### Customizing Colors

1. **Select Base Theme:**
   - Choose between "Dark" or "Light" as your starting point
   - Each base theme has different default colors

2. **Adjust Colors:**
   - Click any color picker to choose a new color
   - Or manually enter a hex code (e.g., `#FF5733`)
   - Changes preview in real-time

3. **Color Categories:**
   - **Background Colors:** Primary, Secondary, Tertiary, Card backgrounds
   - **Text Colors:** Primary, Secondary, Tertiary, Muted
   - **Border Colors:** Default and Hover states
   - **Accent Colors:** Primary, Secondary, Hover
   - **Semantic Colors:** Success, Warning, Error, Info

### Uploading a Custom Logo

1. **Upload Logo:**
   - Click **"📁 Upload Logo"** button
   - Select an image file (max 500KB)
   - Logo appears in preview area

2. **Remove Logo:**
   - Click **"🗑️ Remove Logo"** button
   - Restores default window icon

3. **Logo Requirements:**
   - **Recommended size:** 80x80 pixels or larger
   - **Aspect ratio:** Square (1:1) recommended
   - **File formats:** PNG (with transparency), JPG, GIF, SVG
   - **Max file size:** 500KB
   - **Best practice:** Use PNG with transparent background

### Saving Your Theme

1. **Save & Apply:**
   - Click **"✅ Save & Apply"** button
   - Theme is saved to localStorage
   - Applied immediately to the application

2. **Persistence:**
   - Custom theme persists across browser sessions
   - Automatically loaded on page refresh
   - Stored locally (no server required)

### Exporting Your Theme

1. **Export:**
   - Click **"💾 Export Theme"** button
   - Downloads a JSON file (e.g., `my-custom-theme.json`)
   - Contains all color values and logo data

2. **Use Cases:**
   - Backup your custom theme
   - Share with team members
   - Transfer between devices
   - Version control for theme changes

### Importing a Theme

1. **Import:**
   - Click **"📂 Import Theme"** button
   - Select a previously exported JSON file
   - Theme loads immediately in preview mode

2. **Validation:**
   - System validates theme file structure
   - Shows error if file is corrupted
   - Automatically applies valid themes

### Resetting to Defaults

1. **Reset:**
   - Click **"🔄 Reset to Defaults"** button
   - Confirms action (cannot be undone)
   - Clears all customizations
   - Restores original theme

---

## Technical Details

### Storage Structure

Custom themes are stored in localStorage with the following structure:

```javascript
{
  "name": "My Custom Theme",
  "baseTheme": "dark",  // or "light"
  "colors": {
    "bgPrimary": "#0f172a",
    "bgSecondary": "#1f2937",
    "bgTertiary": "#020617",
    "bgCard": "#1f2937",
    "bgCardHover": "#374151",
    "textPrimary": "#e5e7eb",
    "textSecondary": "#94a3b8",
    "textTertiary": "#64748b",
    "textMuted": "#64748b",
    "borderColor": "#334155",
    "borderHover": "#475569",
    "accentPrimary": "#38bdf8",
    "accentSecondary": "#0ea5e9",
    "accentHover": "#0ea5e9",
    "success": "#22c55e",
    "warning": "#f59e0b",
    "error": "#ef4444",
    "info": "#3b82f6"
  },
  "logo": "data:image/png;base64,..."  // Base64 encoded image
}
```

### CSS Variables

The theme customizer uses CSS custom properties (variables) to override colors:

```css
:root {
  --bg-primary: #0f172a;
  --bg-secondary: #1f2937;
  --text-primary: #e5e7eb;
  --accent-primary: #38bdf8;
  /* ... etc */
}
```

Custom colors are applied dynamically via JavaScript:
```javascript
document.documentElement.style.setProperty('--bg-primary', '#custom-color');
```

### localStorage Keys

- **Theme Data:** `quote-engine-custom-theme`
- **Logo Data:** `quote-engine-custom-logo`

### File Size Limits

- **Logo:** 500KB maximum
- **Theme JSON:** Typically <5KB (excluding logo)
- **With Logo:** Can be up to 500KB+ depending on logo size

---

## API Reference

The Theme Customizer exposes a public JavaScript API via `window.ThemeCustomizer`:

### Methods

#### `open()`
Opens the theme customizer modal.
```javascript
window.ThemeCustomizer.open();
```

#### `close()`
Closes the theme customizer modal.
```javascript
window.ThemeCustomizer.close();
```

#### `apply(theme)`
Applies a custom theme object.
```javascript
var customTheme = {
  name: "Brand Theme",
  baseTheme: "dark",
  colors: { /* ... */ },
  logo: "data:image/png;base64,..."
};
window.ThemeCustomizer.apply(customTheme);
```

#### `reset()`
Resets to default theme.
```javascript
window.ThemeCustomizer.reset();
```

#### `save(theme)`
Saves a theme to localStorage.
```javascript
window.ThemeCustomizer.save(customTheme);
```

#### `load()`
Loads saved theme from localStorage.
```javascript
var savedTheme = window.ThemeCustomizer.load();
```

#### `export(theme)`
Exports theme as downloadable JSON file.
```javascript
window.ThemeCustomizer.export(customTheme);
```

---

## Color Recommendations

### Accessibility Guidelines

For WCAG AA compliance, ensure:
- **Normal text (< 18px):** Contrast ratio ≥ 4.5:1
- **Large text (≥ 18px):** Contrast ratio ≥ 3:1
- **UI components:** Contrast ratio ≥ 3:1

**Tools for checking contrast:**
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Contrast Ratio Calculator](https://contrast-ratio.com/)

### Brand Color Harmony

**Recommended color schemes:**

1. **Monochromatic:**
   - Use different shades of the same base color
   - Example: Navy (#0f172a) → Slate (#475569) → Light Gray (#94a3b8)

2. **Analogous:**
   - Use adjacent colors on the color wheel
   - Example: Blue (#38bdf8) → Cyan (#06b6d4) → Teal (#14b8a6)

3. **Complementary:**
   - Use opposite colors for accents
   - Example: Blue (#38bdf8) for primary, Orange (#fb923c) for warnings

4. **Professional Palettes:**
   - **Corporate Blue:** Primary #0066cc, Accent #0099ff
   - **Natural Green:** Primary #10b981, Accent #34d399
   - **Elegant Purple:** Primary #8b5cf6, Accent #a78bfa
   - **Modern Gray:** Primary #6b7280, Accent #9ca3af

### Logo Design Tips

1. **Keep it simple:** Logos should be recognizable at small sizes
2. **Use SVG when possible:** Scalable without quality loss
3. **Transparent backgrounds:** PNG with alpha channel works best
4. **High contrast:** Ensure logo is visible on background colors
5. **Test in both themes:** Verify logo looks good in dark and light modes

---

## Use Cases

### 1. White-Label Branding
**Scenario:** Window cleaning company wants to brand the app

**Steps:**
1. Upload company logo
2. Change accent colors to match brand (e.g., company blue)
3. Adjust text colors for readability
4. Export theme for backup
5. Save and apply

**Result:** App matches company branding perfectly

### 2. High-Contrast Mode
**Scenario:** User needs higher contrast for accessibility

**Steps:**
1. Start with Light theme
2. Set text to pure black (#000000)
3. Set background to pure white (#ffffff)
4. Increase border contrast
5. Save as "High Contrast" theme

**Result:** Maximum readability for visually impaired users

### 3. Team Standardization
**Scenario:** Team wants consistent branding across devices

**Steps:**
1. Designer creates custom theme
2. Exports theme as JSON
3. Shares JSON file with team
4. Team members import JSON
5. Everyone has identical branding

**Result:** Consistent appearance across all team devices

### 4. Client-Specific Themes
**Scenario:** Different clients want different branding

**Steps:**
1. Create theme for Client A
2. Export as `client-a-theme.json`
3. Create theme for Client B
4. Export as `client-b-theme.json`
5. Import appropriate theme when working with each client

**Result:** Professional, client-specific branding

---

## Troubleshooting

### Theme Not Saving
**Problem:** Changes don't persist after refresh

**Solutions:**
1. Check browser localStorage is enabled
2. Clear browser cache and try again
3. Ensure cookies/storage not blocked
4. Try in incognito mode to test
5. Check browser console for errors

### Logo Not Displaying
**Problem:** Logo upload fails or doesn't show

**Solutions:**
1. Verify file size < 500KB
2. Use supported format (PNG, JPG, GIF)
3. Try different image
4. Compress image before upload
5. Check browser console for errors

### Colors Not Applying
**Problem:** Custom colors don't change UI

**Solutions:**
1. Click "Save & Apply" button
2. Refresh the page
3. Try resetting and reapplying
4. Check if theme customizer is latest version
5. Clear localStorage and retry

### Export Not Working
**Problem:** Export button doesn't download file

**Solutions:**
1. Check browser download settings
2. Allow downloads from the site
3. Try different browser
4. Check popup blocker settings
5. Manually copy JSON from console

### Import Fails
**Problem:** Import shows "Invalid theme file"

**Solutions:**
1. Verify JSON file structure is correct
2. Ensure file isn't corrupted
3. Re-export theme and try again
4. Check file encoding is UTF-8
5. Validate JSON syntax

---

## Best Practices

### 1. Test Before Deploying
- Always preview changes before saving
- Test in both dark and light base themes
- Verify readability of all text
- Check buttons and UI elements

### 2. Document Your Themes
- Name themes descriptively
- Keep notes on color choices
- Document brand guidelines
- Version your theme files

### 3. Backup Regularly
- Export themes periodically
- Store JSON files safely
- Version control theme files
- Keep multiple backups

### 4. Maintain Accessibility
- Use high contrast ratios
- Test with color blindness simulators
- Ensure readable text sizes
- Don't rely solely on color for meaning

### 5. Performance Considerations
- Keep logo files small (< 100KB preferred)
- Optimize images before upload
- Limit number of custom themes
- Clear old themes from localStorage

---

## Browser Compatibility

### Supported Browsers
✅ Chrome 90+
✅ Firefox 88+
✅ Safari 12+ (iOS and macOS)
✅ Edge 90+
✅ Opera 76+

### Features Requiring Modern Browsers
- CSS custom properties (variables)
- localStorage API
- FileReader API (for logo upload)
- Blob/URL.createObjectURL (for export)

### iOS Safari Compatibility
- Fully compatible with iOS Safari 12+
- Uses ES5 JavaScript (no modern syntax)
- Tested on iPhone 6 and later
- Works in standalone (PWA) mode

---

## Future Enhancements

### Planned Features (v1.8.0+)

1. **Preset Themes:**
   - Professional presets (Corporate, Modern, Classic)
   - Industry-specific themes (Construction, Services)
   - Seasonal themes (Winter, Summer)

2. **Advanced Color Tools:**
   - Color palette generator
   - Automatic contrast checker
   - Accessibility scoring
   - Color blindness simulator

3. **Enhanced Logo Options:**
   - Multiple logo sizes (header, print, favicon)
   - Logo positioning controls
   - Background customization for logo area

4. **Theme Marketplace:**
   - Browse community themes
   - Download premium themes
   - Share your creations
   - Rate and review themes

5. **Team Features:**
   - Cloud sync for themes
   - Team theme library
   - Admin-enforced branding
   - Role-based theme access

---

## FAQ

### Q: Can I use gradients for colors?
**A:** Currently, solid colors only. Gradients may be added in future versions.

### Q: How many custom themes can I create?
**A:** You can create unlimited themes and export them. Only one active theme is stored in localStorage at a time.

### Q: Will my theme work on mobile?
**A:** Yes! Themes are fully responsive and work on all devices.

### Q: Can I animate color transitions?
**A:** Color changes have smooth CSS transitions built-in (0.3s ease).

### Q: Is my logo data private?
**A:** Yes, everything is stored locally in your browser. No data is sent to servers.

### Q: Can I revert changes if I don't like them?
**A:** Yes, use "Reset to Defaults" or import a previously exported theme.

### Q: What happens if I clear browser data?
**A:** Custom themes are lost. Always export important themes as backup.

### Q: Can I customize fonts?
**A:** Not yet. Font customization is planned for v1.8.0.

---

## Support

### Getting Help

**Documentation:**
- [Design System Guide](DESIGN_SYSTEM.md)
- [Color Contrast Audit](COLOR_CONTRAST_AUDIT.md)
- [UI Theme Improvements](UI_THEME_IMPROVEMENTS_SUMMARY.md)

**Issues:**
- Report bugs on GitHub Issues
- Request features via GitHub Discussions
- Check existing issues before creating new ones

**Community:**
- Share your themes with the community
- Get feedback on color choices
- Learn from other users' designs

---

## Changelog

### v1.7.0 (November 18, 2025)
- ✅ Initial release of theme customization
- ✅ 18 customizable color variables
- ✅ Logo upload functionality
- ✅ Import/export themes as JSON
- ✅ Real-time preview mode
- ✅ Reset to defaults
- ✅ Base theme selection
- ✅ Mobile-responsive UI
- ✅ Accessibility focused
- ✅ iOS Safari compatible

---

## Credits

**Developed by:** Claude Code
**Design System:** Based on Tailwind CSS color palette
**Accessibility:** WCAG 2.1 Level AA compliant
**Version:** 1.7.0

---

**Last Updated:** November 18, 2025
**Status:** Production Ready ✅
