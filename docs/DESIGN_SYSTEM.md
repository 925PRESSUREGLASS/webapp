# TicTacStick Design System Documentation

**Version:** 1.9.0
**Last Updated:** 2025-11-18
**Purpose:** Comprehensive UI/UX design system for mobile-first quote engine

---

## Table of Contents

1. [Overview](#overview)
2. [Design Principles](#design-principles)
3. [Color System](#color-system)
4. [Typography](#typography)
5. [Spacing & Layout](#spacing--layout)
6. [Component Library](#component-library)
7. [Responsive Patterns](#responsive-patterns)
8. [Accessibility](#accessibility)
9. [iOS Safari Specific](#ios-safari-specific)
10. [Usage Examples](#usage-examples)

---

## Overview

The TicTacStick Design System provides a comprehensive set of CSS variables, components, and utilities for building a consistent, accessible, and professional UI across the quote engine.

### Key Features

- **Mobile-first**: Optimized for touch devices and iOS Safari
- **Accessible**: WCAG AA compliant with proper ARIA attributes
- **Consistent**: Unified color palette, typography, and spacing
- **Professional**: Polished animations and micro-interactions
- **Performant**: GPU-accelerated animations, optimized for mobile

### Files

- **CSS**: `css/design-system.css` (1,200+ lines)
- **JavaScript**: `ui-components.js` (toast, modals, loading)
- **Documentation**: This file

---

## Design Principles

### 1. Mobile-First

All components are designed for touch first, then enhanced for desktop:
- Minimum 44px touch targets
- Touch-optimized interactions
- Mobile-friendly spacing and typography

### 2. Progressive Enhancement

Core functionality works without JavaScript, enhanced features layer on top:
- Forms work with HTML5 validation
- Navigation works with anchor links
- Print styles preserve content

### 3. Accessibility by Default

Every component is accessible out of the box:
- Proper semantic HTML
- ARIA labels and roles
- Keyboard navigation support
- Screen reader friendly

### 4. Performance First

Design system is optimized for performance:
- CSS variables for instant theme changes
- GPU-accelerated animations (transform, opacity)
- Minimal repaints and reflows
- Lazy-loaded heavy components

---

## Color System

All colors are defined as CSS variables in `:root` for easy theming.

### Primary Colors

```css
--color-primary: #2563eb          /* Blue 600 - primary actions */
--color-primary-light: #3b82f6    /* Blue 500 - hover states */
--color-primary-dark: #1e40af     /* Blue 700 - active states */
--color-primary-contrast: #ffffff /* White text on primary */
```

**Usage**: Primary buttons, links, focus states

### Secondary Colors

```css
--color-secondary: #10b981          /* Emerald 500 - success */
--color-secondary-light: #34d399    /* Emerald 400 - hover */
--color-secondary-dark: #059669     /* Emerald 600 - active */
--color-secondary-contrast: #ffffff
```

**Usage**: Secondary buttons, success states, completed items

### Semantic Colors

#### Error (Red)
```css
--color-error: #ef4444      /* Red 500 */
--color-error-light: #f87171
--color-error-dark: #dc2626
--color-error-bg: #fee2e2   /* Red 100 - backgrounds */
```

#### Warning (Amber)
```css
--color-warning: #f59e0b
--color-warning-light: #fbbf24
--color-warning-dark: #d97706
--color-warning-bg: #fef3c7
```

#### Success (Emerald)
```css
--color-success: #10b981
--color-success-light: #34d399
--color-success-dark: #059669
--color-success-bg: #d1fae5
```

#### Info (Blue)
```css
--color-info: #3b82f6
--color-info-light: #60a5fa
--color-info-dark: #2563eb
--color-info-bg: #dbeafe
```

### Neutral Scale

```css
--color-neutral-50: #f9fafb     /* Lightest backgrounds */
--color-neutral-100: #f3f4f6    /* Card backgrounds */
--color-neutral-200: #e5e7eb    /* Borders */
--color-neutral-300: #d1d5db    /* Dividers */
--color-neutral-400: #9ca3af    /* Disabled text */
--color-neutral-500: #6b7280    /* Secondary text */
--color-neutral-600: #4b5563    /* Body text */
--color-neutral-700: #374151    /* Headings */
--color-neutral-800: #1f2937    /* Strong headings */
--color-neutral-900: #111827    /* Maximum contrast */
```

---

## Typography

### Font Families

```css
--font-family-base: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
--font-family-mono: SFMono-Regular, Menlo, Monaco, Consolas, "Courier New", monospace
```

### Font Sizes

```css
--font-size-xs: 0.75rem     /* 12px - Helper text */
--font-size-sm: 0.875rem    /* 14px - Secondary text */
--font-size-base: 1rem      /* 16px - Body text (iOS safe) */
--font-size-lg: 1.125rem    /* 18px - Large body */
--font-size-xl: 1.25rem     /* 20px - Small headings */
--font-size-2xl: 1.5rem     /* 24px - H3 */
--font-size-3xl: 1.875rem   /* 30px - H2 */
--font-size-4xl: 2.25rem    /* 36px - H1 */
```

**Important**: Base font size is 16px to prevent iOS Safari zoom on input focus.

### Font Weights

```css
--font-weight-normal: 400
--font-weight-medium: 500
--font-weight-semibold: 600
--font-weight-bold: 700
```

### Line Heights

```css
--line-height-tight: 1.25    /* Headings */
--line-height-normal: 1.5    /* Body text */
--line-height-relaxed: 1.75  /* Comfortable reading */
```

### Usage

```html
<h1>Heading 1</h1>           <!-- 36px, semibold, tight -->
<h2>Heading 2</h2>           <!-- 30px, semibold, tight -->
<p>Body paragraph text</p>   <!-- 16px, normal, normal -->
<small>Helper text</small>   <!-- 14px, normal, normal -->
```

---

## Spacing & Layout

### Spacing Scale

```css
--spacing-xs: 0.25rem     /* 4px */
--spacing-sm: 0.5rem      /* 8px */
--spacing-md: 1rem        /* 16px */
--spacing-lg: 1.5rem      /* 24px */
--spacing-xl: 2rem        /* 32px */
--spacing-2xl: 3rem       /* 48px */
--spacing-3xl: 4rem       /* 64px */
```

### Border Radius

```css
--radius-none: 0
--radius-sm: 0.25rem      /* 4px - Small elements */
--radius-md: 0.5rem       /* 8px - Cards, buttons */
--radius-lg: 0.75rem      /* 12px - Large cards */
--radius-xl: 1rem         /* 16px - Modals */
--radius-full: 9999px     /* Pills, avatars */
```

### Shadows

```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05)
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1)
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1)
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1)
--shadow-inner: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)
```

### Container

```css
.container {
    width: 100%;
    padding: 1rem;           /* Mobile */
    max-width: 768px;        /* Tablet+ */
    max-width: 1024px;       /* Desktop+ */
}
```

---

## Component Library

### Buttons

#### Primary Button
```html
<button class="btn btn-primary">Save Quote</button>
```
- **Usage**: Main actions (save, submit, confirm)
- **Color**: Blue (#2563eb)
- **Hover**: Lifts up slightly, shadow increases

#### Secondary Button
```html
<button class="btn btn-secondary">Cancel</button>
```
- **Usage**: Secondary actions
- **Color**: White background, blue border
- **Hover**: Light blue background

#### Tertiary Button
```html
<button class="btn btn-tertiary">More Options</button>
```
- **Usage**: Minimal/ghost actions
- **Color**: Transparent background
- **Hover**: Light gray background

#### Danger Button
```html
<button class="btn btn-danger">Delete Quote</button>
```
- **Usage**: Destructive actions
- **Color**: Red (#ef4444)
- **Requires**: Confirmation modal

#### Button Sizes
```html
<button class="btn btn-sm">Small</button>      <!-- 36px min height -->
<button class="btn">Default</button>            <!-- 44px min height -->
<button class="btn btn-lg">Large</button>       <!-- 52px min height -->
```

#### Button Modifiers
```html
<button class="btn btn-block">Full Width</button>
<button class="btn btn-icon">
    <svg>...</svg> With Icon
</button>
<button class="btn btn-loading">Loading...</button>
```

### Form Components

#### Text Input
```html
<div class="form-group">
    <label class="form-label" for="name">Client Name</label>
    <input type="text" id="name" class="form-input" placeholder="Enter name">
    <span class="form-hint">Full name as it should appear on quote</span>
</div>
```

#### Required Field
```html
<label class="form-label form-label-required" for="email">
    Email Address
</label>
```

#### Error State
```html
<input type="email" class="form-input form-input-error">
<span class="form-error">Please enter a valid email address</span>
```

#### Success State
```html
<input type="email" class="form-input form-input-success">
<span class="form-success">Email address verified</span>
```

#### Select Dropdown
```html
<select class="form-select" aria-label="Choose window type">
    <option value="">Select...</option>
    <option value="standard">Standard Window</option>
</select>
```

#### Textarea
```html
<textarea class="form-textarea" rows="4" placeholder="Additional notes"></textarea>
```

#### Checkbox
```html
<div class="form-checkbox-wrapper">
    <input type="checkbox" id="agree" class="form-checkbox">
    <label for="agree">I agree to terms and conditions</label>
</div>
```

#### Radio Button
```html
<div class="form-checkbox-wrapper">
    <input type="radio" id="option1" name="options" class="form-radio">
    <label for="option1">Option 1</label>
</div>
```

### Cards

#### Base Card
```html
<div class="card">
    <div class="card-header">
        <h3 class="card-title">Quote Summary</h3>
        <p class="card-subtitle">Updated 5 minutes ago</p>
    </div>
    <div class="card-body">
        <p>Card content goes here...</p>
    </div>
    <div class="card-footer">
        <button class="btn btn-primary">View Details</button>
    </div>
</div>
```

#### Clickable Card
```html
<div class="card card-clickable" onclick="handleClick()">
    <!-- Card hover effect and pointer cursor -->
</div>
```

#### Line Item Card
```html
<div class="line-item-card">
    <div>10 × Standard Windows - Inside & Outside</div>
    <div>$250.00</div>
</div>
```

#### Quote Summary Card
```html
<div class="quote-summary-card">
    <div class="quote-label">Total (Inc GST)</div>
    <div class="quote-total">$1,234.56</div>
</div>
```

### Modals

#### Confirmation Modal (via JavaScript)
```javascript
UIComponents.showConfirm({
    title: 'Delete Quote?',
    message: 'This action cannot be undone. Are you sure?',
    confirmText: 'Delete',
    cancelText: 'Cancel',
    danger: true,  // Red confirm button
    onConfirm: function() {
        // Delete the quote
    },
    onCancel: function() {
        // User cancelled
    }
});
```

#### Alert Modal
```javascript
UIComponents.showAlert({
    title: 'Quote Saved',
    message: 'Your quote has been saved successfully.',
    buttonText: 'OK',
    onClose: function() {
        // Modal closed
    }
});
```

#### Custom Modal (HTML)
```html
<div class="modal-overlay">
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div class="modal-header">
            <h3 class="modal-title" id="modal-title">Add Line Item</h3>
            <button class="modal-close" aria-label="Close">×</button>
        </div>
        <div class="modal-body">
            <!-- Modal content -->
        </div>
        <div class="modal-footer">
            <button class="btn btn-secondary">Cancel</button>
            <button class="btn btn-primary">Add Item</button>
        </div>
    </div>
</div>
```

### Toast Notifications

```javascript
// Success toast
UIComponents.showToast('Quote saved successfully!', 'success');

// Error toast
UIComponents.showToast('Failed to save quote', 'error');

// Warning toast
UIComponents.showToast('Please review your entries', 'warning', 5000);

// Info toast
UIComponents.showToast('Quote autosaved', 'info');
```

**Parameters**:
- `message` (string): Message to display
- `type` (string): 'success', 'error', 'warning', 'info'
- `duration` (number): Time in ms (default 3000)

### Loading States

#### Loading Overlay
```javascript
// Show loading
UIComponents.showLoading('Generating PDF...');

// Hide loading
UIComponents.hideLoading();
```

#### Spinner
```html
<div class="spinner" role="status" aria-live="polite">
    <span class="sr-only">Loading...</span>
</div>

<!-- Sizes -->
<div class="spinner spinner-sm"></div>
<div class="spinner"></div>
<div class="spinner spinner-lg"></div>
```

#### Button Loading State
```html
<button class="btn btn-primary btn-loading">Saving...</button>
```

#### Skeleton Loading
```html
<div class="skeleton skeleton-title"></div>
<div class="skeleton skeleton-text"></div>
<div class="skeleton skeleton-text"></div>
<div class="skeleton skeleton-button"></div>
```

### Alerts

```html
<div class="alert alert-success">
    <svg class="alert-icon">...</svg>
    <div class="alert-content">
        <div class="alert-title">Success!</div>
        <div class="alert-message">Quote saved successfully.</div>
    </div>
    <button class="alert-close" aria-label="Close">×</button>
</div>
```

**Variants**: `alert-success`, `alert-error`, `alert-warning`, `alert-info`

### Badges

```html
<span class="badge badge-primary">New</span>
<span class="badge badge-success">Paid</span>
<span class="badge badge-warning">Pending</span>
<span class="badge badge-danger">Overdue</span>
<span class="badge badge-neutral">Draft</span>
```

### Status Indicators

```html
<span>
    <span class="status-dot status-dot-success"></span>
    Active
</span>
```

**Variants**: `status-dot-success`, `status-dot-warning`, `status-dot-danger`, `status-dot-neutral`

### Navigation

#### Bottom Navigation (Mobile)
```html
<nav class="bottom-nav">
    <a href="#quote" class="bottom-nav-item bottom-nav-item-active">
        <svg class="bottom-nav-icon">...</svg>
        <span class="bottom-nav-label">Quote</span>
    </a>
    <a href="#invoices" class="bottom-nav-item">
        <svg class="bottom-nav-icon">...</svg>
        <span class="bottom-nav-label">Invoices</span>
    </a>
</nav>
```

#### Tabs
```html
<div class="tabs" role="tablist">
    <button class="tab tab-active" role="tab" aria-selected="true">Windows</button>
    <button class="tab" role="tab">Pressure</button>
    <button class="tab" role="tab">Photos</button>
</div>

<div class="tab-panel" role="tabpanel">
    <!-- Panel 1 content -->
</div>
<div class="tab-panel tab-panel-hidden" role="tabpanel">
    <!-- Panel 2 content -->
</div>
```

### Empty States

```html
<div class="empty-state">
    <svg class="empty-state-icon">...</svg>
    <h3 class="empty-state-title">No quotes yet</h3>
    <p class="empty-state-message">
        Create your first quote to get started with the quote engine.
    </p>
    <div class="empty-state-action">
        <button class="btn btn-primary">Create Quote</button>
    </div>
</div>
```

---

## Responsive Patterns

### Mobile-First Breakpoints

```css
/* Mobile: 0-767px (default styles) */

/* Tablet: 768px+ */
@media (min-width: 768px) { }

/* Desktop: 1024px+ */
@media (min-width: 1024px) { }
```

### Stack to Row

```html
<div class="stack-mobile">
    <button class="btn btn-primary">Save</button>
    <button class="btn btn-secondary">Cancel</button>
</div>
```
- **Mobile**: Stacked vertically
- **Tablet+**: Horizontal row

### Visibility Utilities

```html
<div class="hide-mobile">Desktop only content</div>
<div class="show-mobile">Mobile only content</div>
```

### Content with Bottom Nav

```html
<div class="content-with-bottom-nav">
    <!-- Adds 5rem bottom padding for fixed bottom nav -->
</div>
```

---

## Accessibility

### Focus Indicators

All interactive elements have visible focus indicators:
```css
*:focus {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
}
```

### Skip to Content

```html
<a href="#main-content" class="skip-link">Skip to main content</a>
```

### Screen Reader Only Content

```html
<span class="sr-only">Loading...</span>
```

### ARIA Labels

#### Buttons with Icons Only
```html
<button class="btn btn-tertiary" aria-label="Close modal">
    <svg>...</svg>
</button>
```

#### Form Inputs
```html
<label for="email">Email</label>
<input
    type="email"
    id="email"
    aria-required="true"
    aria-describedby="email-hint"
>
<span id="email-hint">We'll never share your email</span>
```

#### Modals
```html
<div
    class="modal"
    role="dialog"
    aria-modal="true"
    aria-labelledby="modal-title"
>
    <h3 id="modal-title">Modal Title</h3>
</div>
```

#### Loading States
```html
<div class="spinner" role="status" aria-live="polite">
    <span class="sr-only">Loading...</span>
</div>
```

### Keyboard Navigation

- **Tab**: Move through interactive elements
- **Shift+Tab**: Move backwards
- **Enter/Space**: Activate buttons
- **Escape**: Close modals

---

## iOS Safari Specific

### Prevent Input Zoom

All form inputs use 16px font size minimum:
```css
input, select, textarea {
    font-size: 16px;  /* iOS won't zoom */
}
```

### Viewport Height Fix

iOS Safari address bar causes viewport height changes:
```javascript
// Automatically handled by UIComponents.init()
// Sets CSS variable --vh for dynamic viewport height
```

Usage:
```css
.full-height {
    height: 100vh;
    height: calc(var(--vh, 1vh) * 100);
}
```

### Modal Background Scroll

Prevent background scroll when modal open:
```javascript
// Automatically handled by UIComponents
document.body.classList.add('modal-open');  // Prevents scroll
```

### Smooth Scrolling

```css
.modal-body,
.scrollable-content {
    -webkit-overflow-scrolling: touch;
}
```

### Safe Area Insets

iPhone X+ notch support:
```css
.safe-area-bottom {
    padding-bottom: max(1rem, env(safe-area-inset-bottom));
}
```

---

## Usage Examples

### Complete Form Example

```html
<form>
    <div class="form-group">
        <label class="form-label form-label-required" for="clientName">
            Client Name
        </label>
        <input
            type="text"
            id="clientName"
            class="form-input"
            aria-required="true"
            placeholder="Enter client name"
        >
        <span class="form-hint">Full name as it should appear on quote</span>
    </div>

    <div class="form-group">
        <label class="form-label" for="jobType">Job Type</label>
        <select id="jobType" class="form-select" aria-label="Select job type">
            <option value="">Select...</option>
            <option value="residential">Residential</option>
            <option value="commercial">Commercial</option>
        </select>
    </div>

    <div class="form-group">
        <label class="form-label" for="notes">Notes</label>
        <textarea
            id="notes"
            class="form-textarea"
            placeholder="Additional notes..."
            rows="4"
        ></textarea>
    </div>

    <div class="form-checkbox-wrapper">
        <input type="checkbox" id="urgent" class="form-checkbox">
        <label for="urgent">Mark as urgent</label>
    </div>

    <div class="stack-mobile" style="margin-top: 1.5rem;">
        <button type="submit" class="btn btn-primary btn-block">
            Save Quote
        </button>
        <button type="button" class="btn btn-secondary btn-block">
            Cancel
        </button>
    </div>
</form>
```

### Complete Card Example

```html
<div class="card">
    <div class="card-header">
        <h3 class="card-title">Quote #1234</h3>
        <span class="badge badge-success">Accepted</span>
    </div>
    <div class="card-body">
        <div style="margin-bottom: 1rem;">
            <strong>Client:</strong> John Smith<br>
            <strong>Location:</strong> Perth CBD<br>
            <strong>Total:</strong> $1,234.56
        </div>
        <div class="line-item-card">
            <div>10 × Standard Windows</div>
            <div>$250.00</div>
        </div>
        <div class="line-item-card">
            <div>Pressure clean driveway (50m²)</div>
            <div>$125.00</div>
        </div>
    </div>
    <div class="card-footer">
        <button class="btn btn-primary btn-sm">Convert to Invoice</button>
        <button class="btn btn-tertiary btn-sm">View Details</button>
    </div>
</div>
```

### JavaScript Integration Example

```javascript
// Show loading
UIComponents.showLoading('Saving quote...');

// Simulate async operation
setTimeout(function() {
    // Hide loading
    UIComponents.hideLoading();

    // Show success toast
    UIComponents.showToast('Quote saved successfully!', 'success');
}, 2000);

// Confirmation before delete
document.getElementById('deleteBtn').addEventListener('click', function() {
    UIComponents.showConfirm({
        title: 'Delete Quote?',
        message: 'This action cannot be undone.',
        confirmText: 'Delete',
        cancelText: 'Cancel',
        danger: true,
        onConfirm: function() {
            // Delete the quote
            UIComponents.showToast('Quote deleted', 'success');
        }
    });
});
```

---

## Best Practices

### DO ✅

- Use CSS variables for colors and spacing
- Add ARIA labels to icon-only buttons
- Use semantic HTML (`<button>`, `<nav>`, `<main>`)
- Test on actual iOS devices
- Use `btn-primary` for main actions, `btn-secondary` for others
- Provide loading states for async operations
- Show toast notifications for user feedback
- Use confirmation modals for destructive actions
- Maintain 44px minimum touch targets
- Use `form-label-required` for required fields

### DON'T ❌

- Don't use inline styles (use utility classes instead)
- Don't create custom colors (use design system variables)
- Don't skip ARIA labels
- Don't use `<div>` for buttons (use `<button>`)
- Don't animate `width`, `height`, or `left/right` (use `transform`)
- Don't use `alert()` or `confirm()` (use UIComponents modals)
- Don't make touch targets smaller than 44px
- Don't use custom fonts (stick to system fonts)
- Don't use `!important` unless absolutely necessary
- Don't skip loading states for async operations

---

## Migration from Old Styles

### Button Classes

| Old | New |
|-----|-----|
| `btn-small` | `btn-sm` |
| `btn-ghost` | `btn-tertiary` |
| Custom colors | Use `btn-primary`, `btn-secondary`, `btn-danger` |

### Form Classes

All form inputs should use `.form-input`, `.form-select`, etc.

### Toast/Alerts

Replace custom toast with:
```javascript
UIComponents.showToast(message, type, duration);
```

---

## Version History

**v1.9.0** (2025-11-18)
- Initial design system implementation
- Comprehensive component library
- UI components JavaScript module
- Mobile-first responsive patterns
- iOS Safari specific fixes
- WCAG AA accessibility compliance

---

## Support

For questions or issues with the design system:
- Review this documentation
- Check component examples above
- Refer to `css/design-system.css` for implementation details
- Test on iOS Safari 12+ for mobile compatibility

---

**Maintained by**: 925 Pressure Glass
**Project**: TicTacStick Quote Engine
**License**: MIT
