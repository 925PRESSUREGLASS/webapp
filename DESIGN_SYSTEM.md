# TicTacStick Design System
**Version:** 1.6.0
**Last Updated:** November 17, 2025
**Status:** Production

---

## Table of Contents
1. [Color Palette](#color-palette)
2. [Typography](#typography)
3. [Spacing System](#spacing-system)
4. [Grid & Layout](#grid--layout)
5. [Components](#components)
6. [Icons](#icons)
7. [Accessibility](#accessibility)
8. [Theme System](#theme-system)
9. [Responsive Design](#responsive-design)
10. [Code Examples](#code-examples)

---

## Color Palette

### Dark Theme (Default)

#### Background Colors
```css
--bg-primary: #0f172a       /* Deep navy - main background */
--bg-secondary: #1f2937     /* Slate gray - panels/cards */
--bg-tertiary: #020617      /* Near black - accents */
```

#### Text Colors
```css
--text-primary: #e5e7eb     /* Light gray - main text */
--text-secondary: #94a3b8   /* Muted gray - secondary text */
--text-tertiary: #64748b    /* Darker gray - disabled text */
```

#### Brand Colors
```css
--accent-primary: #38bdf8   /* Sky blue - primary actions */
--accent-secondary: #0ea5e9 /* Darker sky - hover states */
--accent-gradient: linear-gradient(135deg, #38bdf8, #0ea5e9)
```

#### Semantic Colors
```css
--success: #22c55e          /* Green - success states */
--error: #ef4444            /* Red - errors/warnings */
--warning: #f59e0b          /* Amber - warnings */
--info: #3b82f6             /* Blue - info messages */
```

#### UI Elements
```css
--border-color: #334155     /* Slate - borders */
--border-hover: #475569     /* Lighter slate - hover */
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.3)
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.5)
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.7)
```

### Light Theme

#### Background Colors
```css
--bg-primary: #ffffff       /* White - main background */
--bg-secondary: #f8fafc     /* Slate-50 - panels/cards */
--bg-tertiary: #f1f5f9      /* Slate-100 - accents */
```

#### Text Colors
```css
--text-primary: #0f172a     /* Slate-900 - main text */
--text-secondary: #475569   /* Slate-600 - secondary text */
--text-tertiary: #94a3b8    /* Slate-400 - disabled text */
```

#### Brand Colors
```css
--accent-primary: #0ea5e9   /* Sky-500 - primary actions */
--accent-secondary: #0284c7 /* Sky-600 - hover states */
--accent-gradient: linear-gradient(135deg, #0ea5e9, #0284c7)
```

#### UI Elements
```css
--border-color: #e2e8f0     /* Slate-200 - borders */
--border-hover: #cbd5e1     /* Slate-300 - hover */
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05)
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1)
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.15)
```

### Color Usage Guidelines

**Primary Actions:** Use `--accent-primary` with gradient for CTAs
**Secondary Actions:** Use `--accent-secondary` or transparent
**Destructive Actions:** Use `--error` with caution
**Success Feedback:** Use `--success` for confirmations
**Informational:** Use `--info` for neutral info

**Contrast Requirements:**
- Normal text (16px): Minimum 4.5:1 ratio (WCAG AA)
- Large text (24px+): Minimum 3:1 ratio (WCAG AA)
- Interactive elements: Minimum 3:1 against background

---

## Typography

### Font Family
```css
font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI',
             Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
```

**Rationale:** System fonts provide optimal performance and native feel

### Font Scale

```css
--font-xs: 12px;     /* Fine print, labels */
--font-sm: 14px;     /* Secondary text, captions */
--font-base: 16px;   /* Body text (default) */
--font-md: 18px;     /* Emphasized body text */
--font-lg: 20px;     /* Small headings */
--font-xl: 24px;     /* Section headings */
--font-2xl: 28px;    /* Page headings */
--font-3xl: 36px;    /* Hero headings */
```

### Font Weights
```css
--weight-normal: 400;    /* Body text */
--weight-medium: 500;    /* Emphasized text */
--weight-semibold: 600;  /* Buttons, labels */
--weight-bold: 700;      /* Headings */
```

### Line Heights
```css
--leading-tight: 1.25;   /* Headings */
--leading-normal: 1.5;   /* Body text */
--leading-relaxed: 1.75; /* Long-form content */
```

### Typography Examples

```html
<!-- Headings -->
<h1 style="font-size: var(--font-3xl); font-weight: var(--weight-bold);">Page Title</h1>
<h2 style="font-size: var(--font-2xl); font-weight: var(--weight-bold);">Section Title</h2>
<h3 style="font-size: var(--font-xl); font-weight: var(--weight-semibold);">Subsection</h3>

<!-- Body Text -->
<p style="font-size: var(--font-base); line-height: var(--leading-normal);">
  Regular paragraph text with comfortable reading line height.
</p>

<!-- Small Text -->
<small style="font-size: var(--font-sm); color: var(--text-secondary);">
  Secondary information or captions
</small>
```

---

## Spacing System

### Base Unit: 4px

```css
--space-0: 0;
--space-1: 4px;      /* 0.25rem */
--space-2: 8px;      /* 0.5rem */
--space-3: 12px;     /* 0.75rem */
--space-4: 16px;     /* 1rem */
--space-5: 20px;     /* 1.25rem */
--space-6: 24px;     /* 1.5rem */
--space-8: 32px;     /* 2rem */
--space-10: 40px;    /* 2.5rem */
--space-12: 48px;    /* 3rem */
--space-16: 64px;    /* 4rem */
--space-20: 80px;    /* 5rem */
```

### Spacing Usage

**Component Padding:**
- Small: 8px × 12px (buttons, inputs)
- Medium: 12px × 20px (cards, panels)
- Large: 20px × 30px (modals, sections)

**Component Margins:**
- Tight: 8px (related items)
- Normal: 16px (standard spacing)
- Relaxed: 24px (section breaks)
- Loose: 32px+ (major sections)

**Grid Gaps:**
- Compact: 8px (dense layouts)
- Normal: 10px (standard grids)
- Comfortable: 15px-20px (photo grids, cards)

---

## Grid & Layout

### Main Layout Grid

```css
.main {
  display: grid;
  grid-template-columns: 1.1fr 0.9fr; /* Desktop: 55% / 45% split */
  gap: 10px;
  max-width: 1200px;
  margin: 0 auto;
  padding: 10px;
}

@media (max-width: 960px) {
  .main {
    grid-template-columns: 1fr; /* Tablet: Single column */
  }
}
```

### Breakpoints

```css
/* Mobile First Approach */

/* Extra Small (default) */
/* 0px - 640px: Mobile phones */

/* Small */
@media (min-width: 640px) {
  /* Large phones, small tablets */
}

/* Medium */
@media (min-width: 960px) {
  /* Tablets, small laptops */
}

/* Large */
@media (min-width: 1200px) {
  /* Desktops, large screens */
}

/* Extra Large */
@media (min-width: 1440px) {
  /* Wide screens, 4K displays */
}
```

### Container Widths

```css
.container-sm: max-width: 640px;  /* Forms, modals */
.container-md: max-width: 960px;  /* Standard content */
.container-lg: max-width: 1200px; /* Main layout */
.container-xl: max-width: 1440px; /* Wide layouts */
```

---

## Components

### Buttons

#### Primary Button
```css
.btn {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: white;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.btn:active {
  transform: translateY(0);
}
```

#### Secondary Button
```css
.btn-secondary {
  background: linear-gradient(135deg, #38bdf8, #0ea5e9);
  /* All other properties same as .btn */
}
```

#### Ghost Button
```css
.btn-ghost {
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
}

.btn-ghost:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: var(--border-hover);
}
```

#### Small Button
```css
.btn-small {
  padding: 8px 16px;
  font-size: 14px;
}
```

#### Button Usage
```html
<!-- Primary Action -->
<button class="btn">Save Changes</button>

<!-- Secondary Action -->
<button class="btn btn-secondary">Export PDF</button>

<!-- Tertiary Action -->
<button class="btn btn-ghost">Cancel</button>

<!-- Compact Button -->
<button class="btn btn-small">Edit</button>
```

### Forms

#### Text Input
```css
input[type="text"],
input[type="number"],
input[type="email"],
input[type="tel"],
input[type="date"],
select,
textarea {
  width: 100%;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--text-primary);
  font-size: 16px;
  transition: all 0.2s ease;
}

input:focus,
select:focus,
textarea:focus {
  outline: none;
  border-color: var(--accent-primary);
  background: rgba(255, 255, 255, 0.08);
  box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.1);
}
```

#### Form Group
```html
<div class="form-group">
  <label for="clientName">Client Name *</label>
  <input type="text" id="clientName" required />
</div>
```

```css
.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: var(--text-primary);
}

.form-group input[required] + label::after {
  content: " *";
  color: var(--error);
}
```

### Cards

```css
.card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 20px;
  box-shadow: var(--shadow-sm);
  transition: all 0.2s ease;
}

.card:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--border-hover);
}
```

```html
<div class="card">
  <h3>Card Title</h3>
  <p>Card content goes here</p>
</div>
```

### Modals

```css
.invoice-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
  z-index: 9999;
}

.invoice-modal.active {
  opacity: 1;
  visibility: visible;
}

.invoice-modal-content {
  background: var(--bg-primary);
  border-radius: 12px;
  max-width: 90vw;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
}

.invoice-modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.invoice-modal-body {
  padding: 24px;
}
```

### Badges/Status

```css
.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-draft { background: #94a3b8; color: #0f172a; }
.status-sent { background: #38bdf8; color: #0f172a; }
.status-paid { background: #22c55e; color: #0f172a; }
.status-overdue { background: #ef4444; color: white; }
.status-cancelled { background: #64748b; color: white; }
```

### Notifications (Toast)

```css
.toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  padding: 16px 20px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: var(--shadow-lg);
  min-width: 300px;
  max-width: 400px;
  z-index: 10000;
  animation: slideInRight 0.3s ease;
}

.toast-success { border-left: 4px solid var(--success); }
.toast-error { border-left: 4px solid var(--error); }
.toast-warning { border-left: 4px solid var(--warning); }
.toast-info { border-left: 4px solid var(--info); }

@keyframes slideInRight {
  from { transform: translateX(400px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
```

### Loading States

```css
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9998;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid rgba(255, 255, 255, 0.2);
  border-top-color: var(--accent-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

---

## Icons

### Icon Set
The app uses emoji icons for visual clarity and zero dependencies:

**Common Icons:**
- 🧽 - App logo (cleaning)
- ☀️ - Light theme
- 🌙 - Dark theme
- 📄 - Documents/Invoices
- 💰 - Payments/Money
- 📊 - Analytics
- 📸 - Photos
- 👤 - Client/User
- ✓ - Success/Paid
- ⚠ - Warning/Overdue
- ✗ - Cancelled
- 📝 - Draft
- 📤 - Sent
- ⚙ - Settings
- ➕ - Add/Create
- 🔍 - Search

### Icon Usage
```html
<button class="btn">
  <span class="icon">📄</span>
  Manage Invoices
</button>
```

```css
.icon {
  display: inline-block;
  margin-right: 8px;
  font-size: 1.2em;
  vertical-align: middle;
}
```

---

## Accessibility

### Focus States

```css
*:focus {
  outline: 3px solid var(--accent-primary);
  outline-offset: 2px;
}

/* For elements that provide their own focus styles */
button:focus,
a:focus {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
}
```

### Screen Reader Only

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

### ARIA Labels

```html
<!-- Button with icon only -->
<button aria-label="Toggle dark/light theme" class="theme-toggle-btn">
  ☀️
</button>

<!-- Form with helper text -->
<label for="email">Email Address</label>
<input
  type="email"
  id="email"
  aria-describedby="email-help"
/>
<small id="email-help">We'll never share your email</small>

<!-- Live region for announcements -->
<div
  id="sr-announcer"
  class="sr-only"
  role="status"
  aria-live="polite"
  aria-atomic="true"
></div>
```

### Keyboard Navigation

**Tab Order:** Follows DOM order, logical flow
**Esc Key:** Closes modals and dialogs
**Enter:** Submits forms, activates buttons
**Space:** Toggles checkboxes, activates buttons
**Arrow Keys:** Navigate lists, select options

---

## Theme System

### Theme Toggle

```html
<button id="themeToggleBtn" class="theme-toggle-btn" aria-label="Toggle theme">
  <span class="theme-icon-sun">☀️</span>
  <span class="theme-icon-moon">🌙</span>
</button>
```

```javascript
// Theme detection and application
function initTheme() {
  var savedTheme = localStorage.getItem('quote-engine-theme');
  var systemTheme = getSystemTheme();
  var theme = savedTheme || systemTheme;
  applyTheme(theme);
}

function getSystemTheme() {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  document.body.setAttribute('data-theme', theme);
  localStorage.setItem('quote-engine-theme', theme);
  updateThemeIcon(theme);
}

function toggleTheme() {
  var current = document.documentElement.getAttribute('data-theme') || 'dark';
  var newTheme = current === 'dark' ? 'light' : 'dark';
  applyTheme(newTheme);
}
```

### Theme-Specific Styles

```css
/* Default (dark theme) */
.element {
  background: #1f2937;
  color: #e5e7eb;
}

/* Light theme override */
[data-theme="light"] .element {
  background: #f8fafc;
  color: #0f172a;
}
```

---

## Responsive Design

### Mobile-First Approach

```css
/* Mobile (default) */
.container {
  padding: 10px;
}

.grid {
  grid-template-columns: 1fr;
  gap: 10px;
}

/* Tablet */
@media (min-width: 640px) {
  .container {
    padding: 20px;
  }

  .grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
  }
}

/* Desktop */
@media (min-width: 960px) {
  .container {
    padding: 30px;
  }

  .grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
  }
}
```

### Touch Targets

**Minimum Size:** 44px × 44px (iOS/Apple HIG)
**Recommended:** 48px × 48px (Material Design)

```css
.touch-target {
  min-width: 44px;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
```

---

## Code Examples

### Complete Form Example

```html
<form class="invoice-form">
  <div class="form-row">
    <div class="form-group">
      <label for="clientName">Client Name *</label>
      <input
        type="text"
        id="clientName"
        required
        placeholder="John Smith"
        aria-required="true"
      />
    </div>

    <div class="form-group">
      <label for="clientEmail">Email</label>
      <input
        type="email"
        id="clientEmail"
        placeholder="john@example.com"
      />
    </div>
  </div>

  <div class="form-actions">
    <button type="button" class="btn btn-ghost">Cancel</button>
    <button type="submit" class="btn">Save Invoice</button>
  </div>
</form>
```

### Complete Modal Example

```html
<div id="exampleModal" class="invoice-modal">
  <div class="invoice-modal-content invoice-modal-medium">
    <div class="invoice-modal-header">
      <h2>Modal Title</h2>
      <button
        type="button"
        class="invoice-modal-close"
        aria-label="Close modal"
      >
        &times;
      </button>
    </div>

    <div class="invoice-modal-body">
      <p>Modal content goes here</p>
    </div>

    <div class="invoice-modal-footer">
      <button type="button" class="btn btn-ghost">Cancel</button>
      <button type="button" class="btn">Confirm</button>
    </div>
  </div>
</div>
```

### Card Grid Example

```html
<div class="analytics-grid">
  <div class="card">
    <h3 class="card-title">Total Quotes</h3>
    <p class="card-value">127</p>
    <small class="card-subtitle">Last 30 days</small>
  </div>

  <div class="card">
    <h3 class="card-title">Win Rate</h3>
    <p class="card-value">68%</p>
    <small class="card-subtitle">Quotes converted</small>
  </div>

  <div class="card">
    <h3 class="card-title">Revenue</h3>
    <p class="card-value">$45,230</p>
    <small class="card-subtitle">This month</small>
  </div>
</div>
```

---

## Best Practices

### DO ✅
- Use semantic HTML elements (`<button>`, `<main>`, `<nav>`, etc.)
- Provide aria-labels for icon-only buttons
- Maintain 4.5:1 contrast ratio for text
- Use system fonts for performance
- Test in both dark and light themes
- Support keyboard navigation
- Use transitions for smooth UX (0.2s-0.3s)
- Make touch targets at least 44px × 44px
- Follow mobile-first responsive approach
- Keep components consistent across the app

### DON'T ❌
- Use color alone to convey information
- Create tiny touch targets (<40px)
- Forget focus indicators
- Use !important unless absolutely necessary
- Inline styles (use classes instead)
- Break the 8-point grid system
- Skip ARIA labels on interactive elements
- Use fixed pixel widths for layout
- Forget to test on iOS Safari
- Break ES5 compatibility (no const, let, arrow functions)

---

## Design Tokens

For future CSS custom properties implementation (when dropping ES5):

```css
:root {
  /* Colors */
  --color-primary: #38bdf8;
  --color-secondary: #0ea5e9;
  --color-success: #22c55e;
  --color-error: #ef4444;
  --color-warning: #f59e0b;

  /* Spacing */
  --space-unit: 4px;
  --space-xs: calc(var(--space-unit) * 1);   /* 4px */
  --space-sm: calc(var(--space-unit) * 2);   /* 8px */
  --space-md: calc(var(--space-unit) * 4);   /* 16px */
  --space-lg: calc(var(--space-unit) * 6);   /* 24px */
  --space-xl: calc(var(--space-unit) * 8);   /* 32px */

  /* Typography */
  --font-size-base: 16px;
  --font-weight-normal: 400;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;

  /* Borders */
  --border-radius-sm: 6px;
  --border-radius-md: 8px;
  --border-radius-lg: 12px;
  --border-width: 1px;

  /* Transitions */
  --transition-fast: 0.2s ease;
  --transition-base: 0.3s ease;
  --transition-slow: 0.5s ease;
}
```

---

## Version History

**v1.6.0** (2025-11-17)
- Initial design system documentation
- Comprehensive color palette documentation
- Component library reference
- Theme system documentation
- Accessibility guidelines
- Responsive design patterns

---

## Contributing

When adding new components:
1. Follow the spacing system (8-point grid)
2. Use existing color palette
3. Maintain contrast ratios (4.5:1 minimum)
4. Test in both themes
5. Add ARIA labels for accessibility
6. Document component in this file
7. Provide code example
8. Test on mobile devices

---

## Resources

- **WCAG Guidelines:** https://www.w3.org/WAI/WCAG21/quickref/
- **Color Contrast Checker:** https://webaim.org/resources/contrastchecker/
- **iOS Design Guidelines:** https://developer.apple.com/design/human-interface-guidelines/
- **Material Design:** https://material.io/design
- **PWA Checklist:** https://web.dev/pwa-checklist/

---

**Maintained by:** TicTacStick Development Team
**Questions?** Refer to code comments or PROJECT_STATE.md
**Last Review:** November 17, 2025
