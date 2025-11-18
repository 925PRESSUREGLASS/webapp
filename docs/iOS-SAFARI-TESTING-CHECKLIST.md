# iOS Safari Testing Checklist
## TicTacStick Quote Engine v1.9.0

**Purpose:** Comprehensive checklist for testing on iOS Safari (primary target platform)

**Test Date:** _______________
**Tester:** _______________
**iOS Version:** _______________
**Device:** _______________

---

## Device Setup

### Test Devices (Required)
- [ ] iPhone SE or similar (small screen: 4.7")
- [ ] iPhone 12/13/14 (standard screen: 6.1")
- [ ] iPhone 14 Pro Max or similar (large screen: 6.7")
- [ ] iPad (tablet view: 10.2" or larger)

### iOS Versions (Minimum)
- [ ] iOS 15.x
- [ ] iOS 16.x
- [ ] iOS 17.x

### Test Orientations
- [ ] Portrait (primary)
- [ ] Landscape (secondary)

---

## Display & Layout

### Visual Rendering
- [ ] No horizontal scrolling
- [ ] All text is readable (minimum 16px)
- [ ] Touch targets are minimum 44px (Apple HIG)
- [ ] Cards/buttons don't overlap
- [ ] Footer doesn't cover content
- [ ] Modals center correctly
- [ ] Loading spinners visible

### Safe Areas & Notch Handling
- [ ] Safe area insets respected (devices with notch)
- [ ] Status bar doesn't overlap header
- [ ] Home indicator doesn't cover buttons
- [ ] Content readable in all safe zones

### Typography & Spacing
- [ ] Headings are appropriately sized
- [ ] Body text is legible
- [ ] Line height prevents cramping
- [ ] Spacing between elements is consistent
- [ ] No text cutoff or truncation issues

### Responsive Breakpoints
- [ ] Small phone (≤375px): Single column, compact UI
- [ ] Standard phone (376-414px): Optimized layout
- [ ] Large phone (≥415px): Enhanced spacing
- [ ] Tablet (≥768px): Multi-column where appropriate

---

## Input Behavior

### Text Inputs
- [ ] Text inputs don't cause zoom (font-size ≥16px)
- [ ] Input focus doesn't push content off screen
- [ ] Keyboard appears with correct type
- [ ] Keyboard doesn't hide active input
- [ ] Can dismiss keyboard by tapping outside
- [ ] Autofocus works correctly
- [ ] Input blur works correctly

### Keyboard Types
- [ ] Number inputs show numeric keyboard
- [ ] Email inputs show email keyboard (@, .)
- [ ] Tel inputs show phone keyboard
- [ ] URL inputs show URL keyboard
- [ ] Default inputs show standard keyboard

### Form Controls
- [ ] Select dropdowns work properly
- [ ] Checkboxes are tappable
- [ ] Radio buttons are tappable
- [ ] Range sliders are draggable
- [ ] File upload works (if applicable)

### Autocomplete & Suggestions
- [ ] Autocomplete suggestions appear
- [ ] Can select autocomplete options
- [ ] Autocorrect doesn't break functionality
- [ ] Paste works correctly

---

## Modal & Overlay Behavior

### Modal Dialogs
- [ ] Modals center on screen
- [ ] Background scroll is prevented
- [ ] Modal closes with X button
- [ ] Modal closes with backdrop tap (if applicable)
- [ ] Can't interact with background while modal open
- [ ] Modal content scrollable if needed
- [ ] Keyboard in modal doesn't break layout
- [ ] Multiple modals stack correctly (if applicable)

### Overlays & Dropdowns
- [ ] Dropdowns appear in correct position
- [ ] Dropdowns don't extend off screen
- [ ] Tooltips visible and positioned correctly
- [ ] Toast notifications appear and disappear
- [ ] Loading overlays block interaction correctly

### Modal Animations
- [ ] Modal animations are smooth (60fps)
- [ ] No jank during open/close
- [ ] Backdrop fade is smooth
- [ ] Transitions feel natural

---

## Scrolling & Touch

### Scrolling Behavior
- [ ] Momentum scrolling works (-webkit-overflow-scrolling: touch)
- [ ] Overscroll bounce is acceptable
- [ ] Pull-to-refresh doesn't activate unintentionally
- [ ] Scroll position persists on navigation
- [ ] Fixed elements stay fixed during scroll
- [ ] Smooth scrolling to anchors works
- [ ] No scroll jank or stuttering

### Touch Gestures
- [ ] Tap works on all interactive elements
- [ ] Double-tap doesn't cause zoom
- [ ] Long-press doesn't show context menu (where unwanted)
- [ ] Swipe gestures work (if implemented)
- [ ] Pinch-to-zoom disabled on app content (if desired)

### Touch Targets
- [ ] All buttons are min 44×44px (Apple HIG)
- [ ] Adequate spacing between touch targets (8px+)
- [ ] Touch targets in thumb-reach zones
- [ ] No accidental taps on adjacent elements

---

## Performance

### Loading Performance
- [ ] App loads in <3 seconds on 4G
- [ ] First contentful paint <1.5 seconds
- [ ] Interactive in <3 seconds
- [ ] No blank white screen during load
- [ ] Loading indicators show during wait times

### Runtime Performance
- [ ] Interactions respond in <100ms
- [ ] No jank or stuttering during scrolling
- [ ] No lag when typing in inputs
- [ ] Animations run at 60fps
- [ ] Large lists scroll smoothly
- [ ] No performance degradation over time

### Resource Usage
- [ ] PDF generation completes in <5 seconds
- [ ] No memory leaks (test for 30+ minutes)
- [ ] Battery drain is acceptable
- [ ] CPU usage is reasonable
- [ ] Network usage is minimal (offline-first)

### Memory Management
- [ ] App doesn't crash after extended use
- [ ] Can create 50+ quotes without slowdown
- [ ] Photo uploads don't cause memory issues
- [ ] LocalStorage doesn't exceed quota

---

## Offline & PWA

### Offline Functionality
- [ ] App works without internet connection
- [ ] Can create quotes offline
- [ ] Can save quotes offline
- [ ] Can generate PDFs offline
- [ ] Data persists across sessions
- [ ] No "No Connection" errors for offline features

### PWA Features
- [ ] App can be added to home screen
- [ ] Home screen icon appears correctly
- [ ] Splash screen shows on launch
- [ ] No browser chrome when launched from home screen
- [ ] Looks like native app
- [ ] Status bar color matches app theme

### Service Worker
- [ ] Service Worker registers successfully
- [ ] Assets cached for offline use
- [ ] Cache updates when app updates
- [ ] Offline page appears when appropriate

---

## Feature Testing

### Quote Creation
- [ ] Can add window line items
- [ ] Can add pressure washing line items
- [ ] Calculations update in real-time
- [ ] Can delete line items
- [ ] Can edit line items
- [ ] Total updates correctly with GST
- [ ] Minimum charge applies correctly

### PDF Generation
- [ ] Can preview PDF
- [ ] Can download PDF
- [ ] PDF opens in new tab
- [ ] PDF displays correctly
- [ ] Logo appears in PDF
- [ ] All quote data in PDF
- [ ] Terms and conditions in PDF
- [ ] Professional formatting

### Analytics
- [ ] Analytics dashboard loads
- [ ] Charts render correctly
- [ ] Data updates when filtered
- [ ] Export to CSV works
- [ ] Statistics are accurate

### Client Database
- [ ] Can add new clients
- [ ] Can search clients
- [ ] Can view client history
- [ ] Can update client details
- [ ] Autofill works from client database

---

## Edge Cases & Error Handling

### Invalid Input
- [ ] Graceful handling of invalid numbers
- [ ] Validation messages are clear
- [ ] Can't save quote with missing required fields
- [ ] Error messages don't crash app
- [ ] Can recover from errors

### Storage Limits
- [ ] Warning when storage nearly full
- [ ] Can export data when storage full
- [ ] App doesn't crash when quota exceeded
- [ ] Clear guidance on freeing space

### Network Issues
- [ ] Works with no internet
- [ ] Works with slow 3G
- [ ] Works with intermittent connection
- [ ] No hanging requests
- [ ] Proper timeout handling

### Data Integrity
- [ ] No data loss on app crash
- [ ] No data loss on iOS update
- [ ] No data loss on browser clear (warn user)
- [ ] Backup/restore works correctly
- [ ] Export includes all data

---

## Accessibility

### Screen Reader (VoiceOver)
- [ ] All buttons have labels
- [ ] Form inputs have labels
- [ ] Navigation is logical
- [ ] Can complete all tasks with VoiceOver
- [ ] Announcements are clear and helpful

### Contrast & Visibility
- [ ] Text contrast meets WCAG AA (4.5:1)
- [ ] Focus indicators are visible
- [ ] Disabled states are clear
- [ ] Error states are obvious
- [ ] Works in bright sunlight

### Assistive Technologies
- [ ] Works with Zoom enabled
- [ ] Works with Bold Text enabled
- [ ] Works with Larger Text enabled
- [ ] Works with Reduce Motion enabled
- [ ] Works with Reduce Transparency enabled

---

## Specific iOS Safari Issues

### Known Safari Quirks (Check these!)
- [ ] 100vh issue: Content not cut off by browser chrome
- [ ] Input zoom: Font-size ≥16px on all inputs
- [ ] Momentum scrolling: -webkit-overflow-scrolling works
- [ ] Fixed positioning: Elements fixed correctly
- [ ] Date inputs: Native picker works
- [ ] Touch events: preventDefault doesn't break scrolling
- [ ] Passive listeners: Used where appropriate

### iOS-Specific CSS
- [ ] -webkit-appearance handled correctly
- [ ] Safe area insets work (env(safe-area-inset-*))
- [ ] Text size adjust doesn't break layout
- [ ] Smooth scrolling works
- [ ] Transform3d for GPU acceleration

---

## Testing Workflow

### Daily Use Simulation
- [ ] Use app for 30+ minutes continuously
- [ ] Create 10+ quotes in one session
- [ ] Generate 5+ PDFs
- [ ] Test all major features
- [ ] Return to app next day (persistence test)

### Stress Testing
- [ ] Create quote with 50+ line items
- [ ] Fill storage to 90%
- [ ] Upload 20+ photos
- [ ] Generate large PDF (10+ pages)
- [ ] Run app for 2+ hours

### Real-World Scenarios
- [ ] Create quote in bright sunlight
- [ ] Use with one hand
- [ ] Use with gloves (if applicable)
- [ ] Use in moving vehicle (as passenger)
- [ ] Use with poor/no internet

---

## Sign-Off

### Critical Issues Found
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

### Non-Critical Issues Found
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

### Overall Assessment
- **Display/Layout:** ⭐️⭐️⭐️⭐️⭐️ (1-5)
- **Performance:** ⭐️⭐️⭐️⭐️⭐️ (1-5)
- **Offline/PWA:** ⭐️⭐️⭐️⭐️⭐️ (1-5)
- **Features:** ⭐️⭐️⭐️⭐️⭐️ (1-5)
- **Accessibility:** ⭐️⭐️⭐️⭐️⭐️ (1-5)

### Ready for Production?
- [ ] YES - All critical tests passed
- [ ] NO - Critical issues must be fixed
- [ ] CONDITIONAL - Minor issues acceptable

**Tester Signature:** _________________
**Date:** _________________

---

## Notes

Use this space for additional observations, suggestions, or context:

_______________________________________________
_______________________________________________
_______________________________________________
_______________________________________________
_______________________________________________
