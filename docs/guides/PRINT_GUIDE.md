# Print Guide
**Version:** 1.8.0
**Date:** November 18, 2025
**Feature:** Enhanced Print Layouts

---

## Overview

The Tic-Tac-Stick Quote Engine includes professional print layouts optimized for invoices, quotes, and photo documentation. All print features work directly from your browser without requiring additional software.

### What's Included

- **Professional Invoice Printing** - Clean, business-ready invoice layouts
- **Photo Grid Layouts** - 2x2, 3x3, 4x4 grids for job documentation
- **Letterhead Support** - Branded printing with custom logos
- **Before/After Layouts** - Side-by-side comparison printing
- **A4 & Letter Support** - Optimized for international and US paper sizes

---

## Quick Start

### Printing an Invoice

1. **Open Invoice:**
   - Navigate to the invoice you want to print
   - Ensure all details are correct

2. **Print:**
   - **Keyboard:** Press `Ctrl+P` (Windows/Linux) or `Cmd+P` (Mac)
   - **Browser Menu:** File → Print
   - **Button:** Click any print button in the interface

3. **Configure:**
   - Select printer or "Save as PDF"
   - Choose paper size (A4 or Letter)
   - Adjust margins if needed

4. **Print/Save:**
   - Click "Print" to send to printer
   - Or "Save" to create PDF

### Printing Photos

1. **Navigate to Photos:**
   - Open the photos section of your quote/job

2. **Select Layout:**
   - Photos automatically arrange in optimal grids
   - 2x2 for large photos (4 per page)
   - 3x3 for medium photos (9 per page)
   - 4x4 for small photos (16 per page)

3. **Print:**
   - Use `Ctrl+P` / `Cmd+P`
   - Photos will print in organized grids

---

## Invoice Printing

### Standard Invoice Print

**Features:**
- Professional header with invoice number and date
- Clean table layout for line items
- Clear totals section with subtotal, GST, and grand total
- Payment information and terms
- Footer with company details

**How to Use:**
1. Open any invoice
2. Press `Ctrl+P` / `Cmd+P`
3. The invoice will automatically format for printing
4. All UI elements (buttons, navigation) are hidden
5. Only the invoice content prints

**What Prints:**
- ✅ Invoice header (number, date, status)
- ✅ Client information
- ✅ Line items table
- ✅ Totals (subtotal, GST, grand total)
- ✅ Payment details
- ✅ Notes and terms
- ❌ Navigation and buttons (hidden)

### Letterhead Printing

**Features:**
- Branded header with custom logo (from theme customization)
- Company information in header
- Professional footer with contact details
- Optional watermark for drafts
- Multiple letterhead styles

**How to Enable Letterhead:**

1. **Method 1 - CSS Class (Programmatic):**
   ```javascript
   document.body.classList.add('use-letterhead');
   ```

2. **Method 2 - Browser Console:**
   - Open browser console (F12)
   - Type: `document.body.classList.add('use-letterhead')`
   - Then print (`Ctrl+P`)

3. **Method 3 - Future UI Toggle:**
   - Print mode selector (coming in future update)

**Letterhead Variants:**

**Standard Letterhead:**
```javascript
document.body.classList.add('use-letterhead');
```
- Full-size header with logo
- Complete footer with details

**Minimal Letterhead:**
```javascript
document.body.classList.add('use-letterhead', 'letterhead-minimal');
```
- Thin header (saves paper)
- Minimal footer

**Formal Letterhead:**
```javascript
document.body.classList.add('use-letterhead', 'letterhead-formal');
```
- Extra spacing and borders
- Premium appearance

**Modern Letterhead:**
```javascript
document.body.classList.add('use-letterhead', 'letterhead-modern');
```
- Gradient accents
- Contemporary design

**Colored Themes:**
```javascript
// Blue theme
document.body.classList.add('use-letterhead', 'letterhead-theme-blue');

// Green theme
document.body.classList.add('use-letterhead', 'letterhead-theme-green');

// Gray theme (professional)
document.body.classList.add('use-letterhead', 'letterhead-theme-gray');
```

### Draft Watermark

**Add "DRAFT" watermark to invoices:**

```javascript
document.body.classList.add('letterhead-draft');
```

The word "DRAFT" appears rotated at 45° in light red across the page.

### Confidential Banner

**Add confidential banner to top of invoice:**

```javascript
document.body.classList.add('letterhead-confidential');
```

Red banner appears at top with "CONFIDENTIAL" text.

---

## Photo Printing

### Photo Grid Layouts

Photos automatically arrange in grids based on quantity and available space.

**2x2 Grid (Large Photos):**
- **Photos per page:** 4
- **Best for:** Before/after comparisons, feature photos
- **Photo size:** ~120mm x 120mm each
- **Use when:** You have 1-8 important photos

**3x3 Grid (Medium Photos):**
- **Photos per page:** 9
- **Best for:** Standard job documentation
- **Photo size:** ~70mm x 70mm each
- **Use when:** You have 9-18 photos

**4x4 Grid (Small Photos):**
- **Photos per page:** 16
- **Best for:** Overview/contact sheets
- **Photo size:** ~45mm x 45mm each
- **Use when:** You have many photos (16+)

**Contact Sheet (5x5 Grid):**
- **Photos per page:** 25
- **Best for:** Dense overview
- **Photo size:** ~35mm x 35mm each
- **Use when:** You need maximum photos per page

### Before/After Printing

**Automatic Side-by-Side Layout:**

When photos are marked as "before" and "after", they automatically print side-by-side for easy comparison.

**Features:**
- Labels: "BEFORE" (red) and "AFTER" (green)
- Equal sizing for fair comparison
- Page-break protection (keeps pairs together)

**How to Use:**
1. Tag photos as "before" or "after" in your system
2. Print normally
3. Photos automatically arrange side-by-side

### Photo Captions

All photos print with captions including:
- Photo title/description
- Timestamp (when photo was taken)
- Location/room (if specified)
- Measurements (if applicable)

**Caption Styling:**
- Bold title
- Smaller details below
- Centered alignment
- Professional appearance

### Window-Specific Features

**Measurement Overlays:**
- Window dimensions automatically print on photos
- Appears in bottom-right corner
- White background for readability

**Location Labels:**
- Room/area name appears on photos
- Top-right corner placement
- Blue background badge

### Panorama Photos

Wide photos (aspect ratio > 2:1) automatically use full-width layout:
- Spans entire page width
- Optimized height (~100mm)
- Single photo per section
- Perfect for wide window views

---

## Paper Sizes

### A4 (International Standard)

**Dimensions:** 210mm × 297mm (8.27" × 11.69")
**Best for:** International clients, Europe, Australia

**Margins:**
- Top: 15mm (first page: 10mm)
- Bottom: 10mm
- Left/Right: 10mm

**Optimization:**
- Invoice fits perfectly on one page
- 2x2 photo grid fits optimally
- Letterhead proportions adjusted for A4

### Letter (US Standard)

**Dimensions:** 8.5" × 11" (215.9mm × 279.4mm)
**Best for:** US clients

**Margins:**
- Top: 0.6in (first page: 0.4in)
- Bottom: 0.4in
- Left/Right: 0.4in

**Auto-Adjustments:**
- Photo grids adapt to narrower width
- 4x4 grids become 3x4 grids
- Contact sheets: 5x5 becomes 4x5
- All content remains readable

### Switching Paper Sizes

**In Print Dialog:**
1. Open print (`Ctrl+P`)
2. Click "More settings"
3. Select "Paper size"
4. Choose "A4" or "Letter"
5. Layout automatically adjusts

---

## Browser-Specific Tips

### Google Chrome / Edge (Recommended)

**Best print quality and features**

**Settings:**
- ✅ Enable "Background graphics" for colored headers
- ✅ Set margins to "Default" or "Minimal"
- ✅ Enable "Headers and footers" for page numbers

**PDF Export:**
1. `Ctrl+P` to open print dialog
2. Destination: "Save as PDF"
3. Click "Save"
4. Choose location and filename

**Pro Tip:**
Chrome prints CSS styles most accurately. Recommended for best results.

### Firefox

**Good compatibility**

**Settings:**
- ✅ Enable "Print backgrounds"
- ✅ Margins: "Default"
- ✅ Enable page numbers if desired

**Known Issue:**
Some gradient backgrounds may not print. Use Chrome for colored letterheads.

### Safari (Mac)

**Works well for basic printing**

**Settings:**
- ✅ Show Details (expand dialog)
- ✅ Paper size: A4 or US Letter
- ✅ Margins: Standard

**PDF Export:**
1. `Cmd+P` to open print dialog
2. Click "PDF" button (bottom-left)
3. Select "Save as PDF"

**Note:**
Safari has best color accuracy on Mac. Good for photo printing.

### Safari (iOS/iPad)

**Mobile printing supported**

**How to Print:**
1. Open invoice/document
2. Tap Share button (box with arrow)
3. Select "Print"
4. Choose AirPrint printer or "Save as PDF"

**Limitations:**
- Some advanced layouts may simplify
- Photo grids may adjust for smaller screen
- Letterhead may use minimal variant

---

## Printing Best Practices

### Before Printing

**Checklist:**
- [ ] All information is correct and up-to-date
- [ ] Photos are uploaded and captioned
- [ ] Client details are complete
- [ ] Payment terms are specified
- [ ] Company information is current

### Print Quality

**For Best Results:**
1. **Use PDF first:**
   - Print to PDF before sending to printer
   - Review PDF to ensure layout is correct
   - Catch any issues before wasting paper

2. **Check preview:**
   - Use print preview to review layout
   - Verify page breaks are correct
   - Ensure nothing is cut off

3. **Test print:**
   - Print one copy first
   - Review for quality
   - Adjust settings if needed

### Color vs. Black & White

**Color Printing:**
- Better for photos
- More professional appearance
- Colored status badges stand out
- Recommended for client-facing documents

**Black & White:**
- Cheaper and faster
- Still professional
- Good for internal copies
- Invoices remain clear

**Mixed Approach:**
- Print draft/copies in B&W
- Print final/client copy in color

---

## Common Tasks

### Task: Print Invoice as PDF

**Steps:**
1. Open invoice
2. Press `Ctrl+P` (Windows/Linux) or `Cmd+P` (Mac)
3. Destination: "Save as PDF"
4. Click "Save"
5. Choose filename: `Invoice-{number}-{client}.pdf`
6. Click "Save"

**Result:** PDF file ready to email to client

### Task: Print Invoice with Company Logo

**Steps:**
1. Upload logo via Theme Customizer (`🎨 Customize` button)
2. Open invoice
3. Open browser console (F12)
4. Type: `document.body.classList.add('use-letterhead')`
5. Press Enter
6. Press `Ctrl+P` to print
7. Logo appears in header

**Result:** Branded invoice with your company logo

### Task: Print Job Photos (2 per page)

**Steps:**
1. Navigate to photos section
2. Open browser console (F12)
3. Type: `document.querySelector('.photo-grid').className = 'photo-grid-2x2'`
4. Press Enter
5. Press `Ctrl+P` to print

**Result:** Large photos, 2x2 grid (4 per page)

### Task: Print Before/After Photos

**Steps:**
1. Ensure photos are tagged "before" and "after"
2. Navigate to photos section
3. Press `Ctrl+P` to print
4. Before/after photos automatically arrange side-by-side

**Result:** Side-by-side comparison prints

### Task: Add Draft Watermark

**Steps:**
1. Open invoice
2. Open browser console (F12)
3. Type: `document.body.classList.add('letterhead-draft')`
4. Press Enter
5. Press `Ctrl+P` to print

**Result:** "DRAFT" watermark on invoice

---

## Troubleshooting

### Issue: Headers/Footers Not Printing

**Cause:** Browser setting disabled

**Solution:**
1. Open print dialog
2. Enable "Headers and footers"
3. Or enable "Background graphics"

### Issue: Colors Not Printing

**Cause:** Background graphics disabled

**Solution:**
1. Print dialog → More settings
2. Enable "Background graphics"
3. Or use "Save as PDF" which always includes colors

### Issue: Logo Not Appearing

**Cause:** Logo not uploaded or letterhead not enabled

**Solution:**
1. Check if logo uploaded (`🎨 Customize`)
2. Enable letterhead class:
   ```javascript
   document.body.classList.add('use-letterhead');
   ```
3. Ensure you saved custom theme with logo

### Issue: Photos Cut Off

**Cause:** Page margins too large

**Solution:**
1. Print dialog → More settings
2. Margins: Change to "Minimal"
3. Or choose "Custom" and set smaller margins

### Issue: Text Too Small

**Cause:** Browser zoom setting

**Solution:**
1. Reset browser zoom to 100% (`Ctrl+0`)
2. Then print again
3. Don't adjust zoom before printing

### Issue: Page Breaks in Wrong Places

**Cause:** Content too long for one page

**Solution:**
1. This is normal for multi-page invoices
2. Page breaks are optimized automatically
3. Table headers repeat on each page
4. Totals section kept together

### Issue: Photos Print Blurry

**Cause:** Low-resolution photos or browser scaling

**Solution:**
1. Upload higher-resolution photos
2. Use "Actual size" in print settings
3. Print to PDF first to check quality
4. Consider printing on photo paper

---

## Advanced Customization

### Custom CSS for Printing

You can add custom print styles by modifying the print CSS files:

**Files:**
- `invoice-print.css` - Invoice layouts
- `photo-print-layout.css` - Photo grids
- `letterhead.css` - Letterhead styles

**Example - Change Invoice Font:**
```css
@media print {
  .invoice-items-table {
    font-family: 'Times New Roman', serif;
    font-size: 11pt;
  }
}
```

**Example - Adjust Photo Grid Spacing:**
```css
@media print {
  .photo-grid-3x3 {
    gap: 12pt; /* Was 8pt */
  }
}
```

### Programmatic Print Control

**JavaScript API for advanced users:**

```javascript
// Enable letterhead
document.body.classList.add('use-letterhead');

// Set letterhead style
document.body.classList.add('letterhead-modern');

// Add draft watermark
document.body.classList.add('letterhead-draft');

// Print immediately
window.print();

// Print to PDF (requires user action)
window.print(); // User selects "Save as PDF"
```

**Automated Workflow:**
```javascript
// Setup for professional invoice
document.body.classList.add('use-letterhead', 'letterhead-formal');

// Wait a moment for classes to apply
setTimeout(() => {
  window.print();
}, 100);
```

---

## Tips & Tricks

### Tip 1: Save Print Settings

**Problem:** Adjusting settings every time

**Solution:**
Most browsers remember your print settings per website. Set them once:
1. Open print dialog
2. Configure all settings (paper size, margins, etc.)
3. Print or cancel
4. Next time, settings are remembered

### Tip 2: Create Print Templates

**For different document types:**

1. **Standard Invoice:** No special classes
2. **Formal Invoice:** Add `use-letterhead letterhead-formal`
3. **Draft Invoice:** Add `letterhead-draft`
4. **Photo Report:** Use photo grid layouts

Save these as bookmarklets for quick access.

### Tip 3: Batch Printing

**Print multiple invoices:**

1. Open first invoice
2. Print to PDF
3. Open second invoice
4. Print to PDF
5. Merge PDFs using online tool or Adobe Acrobat

**Better approach (future):**
- Multi-select invoices
- Bulk print option (coming soon)

### Tip 4: Professional Finishing

**For client presentations:**

1. Print on quality paper (24lb minimum)
2. Use color for final copies
3. Consider:
   - Hole punch for binders
   - Staple multi-page invoices
   - Use sheet protectors for photos
   - Print on photo paper for best photo quality

### Tip 5: Digital Distribution

**Instead of physical printing:**

1. Print to PDF
2. Email PDF to client
3. More professional than email body
4. Client can print if needed
5. Creates permanent record

---

## Keyboard Shortcuts

### Universal Print Shortcuts

- **Print:** `Ctrl+P` (Windows/Linux) or `Cmd+P` (Mac)
- **Print Preview:** Usually same as print
- **Close Print Dialog:** `Esc`

### Browser Console Shortcuts

- **Open Console:** `F12` or `Ctrl+Shift+I`
- **Clear Console:** `Ctrl+L`
- **Close Console:** `F12` again or click X

---

## Frequently Asked Questions

### Q: Can I print in color?

**A:** Yes! Enable "Background graphics" in print settings. Colored elements include:
- Status badges (paid/pending/overdue)
- Before/after labels
- Letterhead themes (blue, green, gray)
- Colored headers

### Q: How do I save paper?

**A:** Several options:
1. Use "Minimal" margins
2. Print 2-sided (duplex) if your printer supports it
3. Use smaller photo grids (4x4 instead of 2x2)
4. Skip letterhead for internal copies
5. Review PDF before printing to avoid waste

### Q: Can I customize the letterhead?

**A:** Yes! Upload your logo via Theme Customizer:
1. Click `🎨 Customize` button
2. Upload logo (PNG recommended, max 500KB)
3. Save theme
4. Enable letterhead when printing

Colors and styling can be customized in `letterhead.css`.

### Q: Do photos print in high quality?

**A:** Yes, if:
- Original photos are high resolution
- You enable "Background graphics"
- Printer supports photo quality mode
- Using photo paper (optional but recommended)

Print quality depends on your original photo quality.

### Q: Can I print without borders?

**A:** This depends on your printer:
1. Check printer supports "borderless printing"
2. Enable in print dialog under paper size
3. Select "Borderless" option
4. Note: Not all printers support this

### Q: How do I print multiple copies?

**A:** In print dialog:
1. Find "Copies" field
2. Enter number of copies
3. Enable "Collated" if printing multi-page documents

### Q: Can I print from mobile?

**A:** Yes! iOS Safari and Chrome Android support printing:
- iOS: Share button → Print → AirPrint
- Android: Menu → Share → Print

Some layouts may simplify on mobile for best results.

### Q: Why doesn't my logo appear?

**A:** Check these:
1. Logo uploaded in Theme Customizer?
2. Theme saved after uploading logo?
3. Letterhead enabled: `document.body.classList.add('use-letterhead')`
4. Background graphics enabled in print settings?

If still not working, try re-uploading logo.

---

## Best Practices Summary

**Before Printing:**
- ✅ Review content for accuracy
- ✅ Check print preview
- ✅ Verify paper size matches printer
- ✅ Enable background graphics for color

**For Professional Results:**
- ✅ Use letterhead for client documents
- ✅ Print to PDF first for review
- ✅ Use color for final copies
- ✅ Choose quality paper

**To Save Money:**
- ✅ Print drafts in B&W
- ✅ Use minimal margins
- ✅ Review PDF before printing
- ✅ Print 2-sided when possible

**For Photos:**
- ✅ Upload high-resolution photos
- ✅ Use appropriate grid size
- ✅ Consider photo paper for best quality
- ✅ Print color for client presentations

---

## Resources

### Online Tools

**PDF Merging:**
- [Adobe Acrobat Online](https://www.adobe.com/acrobat/online/merge-pdf.html)
- [PDF24 Tools](https://tools.pdf24.org/en/merge-pdf)
- [ILovePDF](https://www.ilovepdf.com/merge_pdf)

**Photo Optimization:**
- [TinyPNG](https://tinypng.com/) - Compress photos
- [Squoosh](https://squoosh.app/) - Resize and optimize

**Print Testing:**
- [Test Page Print](https://www.testpage.info/) - Test printer settings
- [Print What You Like](https://www.printwhatyoulike.com/) - Print optimization

### Color Profiles

**For accurate color printing:**
- sRGB (standard) - Best for most printers
- Adobe RGB - For high-end photo printers
- CMYK - For professional printing services

Your browser automatically converts RGB to printer color space.

---

## Technical Specifications

### Invoice Print Layout

**File:** `invoice-print.css`
**Size:** ~500 lines
**Features:** 20+ layout components

**Supported Elements:**
- Invoice header with logo
- Client information block
- Line items table with pagination
- Totals section (subtotal, GST, grand total)
- Payment information
- Notes and terms
- Footer with company details
- Status badges
- QR codes (optional)
- Payment stub (optional)

### Photo Print Layout

**File:** `photo-print-layout.css`
**Size:** ~450 lines
**Features:** 15+ layout types

**Supported Layouts:**
- 2x2 grid (4 photos/page)
- 3x3 grid (9 photos/page)
- 4x4 grid (16 photos/page)
- 5x5 contact sheet (25 photos/page)
- Before/after side-by-side
- Single photo full-page
- Panorama full-width
- Custom grids

### Letterhead System

**File:** `letterhead.css`
**Size:** ~550 lines
**Features:** 10+ letterhead variants

**Supported Styles:**
- Standard (full header/footer)
- Minimal (thin header/footer)
- Formal (extra spacing)
- Modern (gradient accents)
- Colored themes (blue, green, gray)
- Draft watermark
- Confidential banner
- Custom logo integration

### Browser Compatibility

**Full Support:**
- Chrome 90+ (recommended)
- Firefox 88+
- Safari 14+
- Edge 90+

**Partial Support:**
- Safari 12-13 (some gradients may not print)
- Older browsers (basic layout works)

**Not Supported:**
- Internet Explorer (end of life)

---

## Support

### Getting Help

**Documentation:**
- This print guide (comprehensive)
- [Design System](DESIGN_SYSTEM.md) - Color and layout reference
- [Theme Customization Guide](THEME_CUSTOMIZATION_GUIDE.md) - Logo upload

**Community:**
- GitHub Issues for bug reports
- Discussions for feature requests

### Reporting Issues

**If you experience print issues:**

1. **Check browser console** (F12) for errors
2. **Test in different browser** (Chrome recommended)
3. **Try print to PDF** instead of physical printer
4. **Report issue** with:
   - Browser name and version
   - Operating system
   - Paper size being used
   - Screenshot of print preview
   - Any console errors

---

## Version History

### v1.8.0 (November 18, 2025) - Current
- ✅ Initial release of enhanced print layouts
- ✅ Invoice-specific print CSS
- ✅ Photo grid layouts (2x2, 3x3, 4x4, 5x5)
- ✅ Letterhead system with custom logo support
- ✅ Before/after photo layouts
- ✅ A4 and Letter paper optimization
- ✅ Draft and confidential watermarks

### Future Enhancements (v1.9.0+)
- UI toggle for letterhead modes
- Print template selector
- Batch printing multiple invoices
- Custom page headers/footers
- More photo layout options
- Print settings save/recall

---

**Prepared By:** Claude Code
**Version:** 1.8.0 (Enhanced Print Layouts Release)
**Status:** Production Ready ✅
**Last Updated:** November 18, 2025
