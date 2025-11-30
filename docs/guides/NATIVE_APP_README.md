# TicTacStick Native Mobile Apps

**Version 1.13.0 - Native App Wrapper with Capacitor**

---

## Quick Start

### For Developers

```bash
# 1. Install dependencies
npm install

# 2. Add platforms (first time only)
npx cap add ios
npx cap add android

# 3. Sync web app to native projects
npm run cap:sync

# 4. Open in IDE
npm run cap:open:ios      # For iOS (macOS only)
npm run cap:open:android  # For Android
```

### For Users

**Download from:**
- 📱 **iOS:** App Store (search "TicTacStick")
- 🤖 **Android:** Google Play Store (search "TicTacStick")

---

## What's New in Native Apps

### Native Features

✅ **Camera Integration**
- Take job site photos directly in app
- Attach photos to quotes instantly
- Before/after photo mode
- Save to device gallery

✅ **Push Notifications**
- Task reminders
- Follow-up alerts
- Payment notifications
- Contract renewals

✅ **Geolocation**
- Auto-detect job site location
- Track travel distance
- Map integration
- Routing optimization

✅ **Haptic Feedback**
- Button tap feedback
- Success vibrations
- Error alerts
- Enhanced UX

✅ **Native Sharing**
- Share quotes via SMS, email, WhatsApp
- Share to any installed app
- Native share sheet

---

## Using Native Features

### Take a Photo

```javascript
// Simple photo capture
CameraHelper.takePhoto()
  .then(function(photo) {
    console.log('Photo captured:', photo.dataUrl);
  });

// Attach to current quote
CameraHelper.attachToQuote()
  .then(function(photo) {
    console.log('Photo attached to quote');
  });

// Before/after photos
CameraHelper.takeBeforeAfterPhotos(quoteId)
  .then(function(photos) {
    console.log('Before:', photos.before);
    console.log('After:', photos.after);
  });
```

### Get Location

```javascript
// Get current position
GeolocationHelper.getCurrentPosition()
  .then(function(position) {
    console.log('Latitude:', position.latitude);
    console.log('Longitude:', position.longitude);
  });

// Attach to quote
GeolocationHelper.attachToQuote(quoteId)
  .then(function(position) {
    console.log('Location saved to quote');
  });

// Calculate distance
GeolocationHelper.getDistanceFromCurrent(targetLat, targetLon)
  .then(function(distance) {
    console.log('Distance:', distance, 'km');
  });
```

### Schedule Notifications

```javascript
// Schedule task reminder
PushNotificationsManager.scheduleTaskReminder(task);

// Schedule follow-up
PushNotificationsManager.scheduleFollowUpReminder(quote, 24); // 24 hours

// Custom notification
PushNotificationsManager.scheduleLocalNotification({
  title: 'Quote Follow-up',
  body: 'Remember to follow up with John Doe',
  scheduleTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
  data: { type: 'quote', quoteId: '123' }
});
```

### Share Content

```javascript
// Share quote
NativeFeatures.shareQuote(quoteData);

// Custom share
NativeFeatures.share({
  title: 'Check out my quote',
  text: 'Quote for $500',
  url: 'https://tictacstick.com.au/quote/123'
});
```

### Haptic Feedback

```javascript
// Light tap (button press)
NativeFeatures.hapticLight();

// Medium (success)
NativeFeatures.hapticMedium();

// Heavy (error)
NativeFeatures.hapticHeavy();

// Notification
NativeFeatures.hapticNotification('success'); // or 'warning', 'error'
```

---

## Platform Detection

```javascript
// Check if running in native app
if (NativeFeatures.isNative()) {
  console.log('Running in native app');
}

// Get platform
var platform = NativeFeatures.getPlatform(); // 'web', 'ios', or 'android'

// Platform-specific code
if (NativeFeatures.isIOS()) {
  // iOS-specific code
} else if (NativeFeatures.isAndroid()) {
  // Android-specific code
}
```

---

## File Structure

```
tictacstick/
├── capacitor.config.json        # Capacitor configuration
├── package.json                 # Dependencies (includes Capacitor)
│
├── Web App Files (unchanged)
├── index.html
├── app.js
├── [other existing files]
│
├── Native Integration (NEW)
├── native-features.js           # Core native features manager
├── camera-helper.js             # Camera integration
├── push-notifications.js        # Push notification manager
├── geolocation-helper.js        # Geolocation helper
│
├── iOS Project (generated)
├── ios/
│   ├── App/
│   │   ├── App.xcodeproj        # Xcode project
│   │   ├── App/
│   │   │   ├── Info.plist       # iOS configuration
│   │   │   └── Assets.xcassets  # App icons
│   │   └── public/              # Symlink to web app
│   └── Podfile
│
├── Android Project (generated)
├── android/
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── AndroidManifest.xml
│   │   │   └── assets/          # Symlink to web app
│   │   └── build.gradle
│   └── build.gradle
│
└── Documentation
    ├── NATIVE_APP_GUIDE.md      # Complete deployment guide
    ├── APP_STORE_CHECKLIST.md   # Submission checklist
    └── NATIVE_APP_README.md     # This file
```

---

## Development Workflow

### Daily Development

```bash
# 1. Make changes to web app (HTML, CSS, JS)

# 2. Test in browser first
# Open index.html in browser

# 3. Sync to native apps when ready
npm run cap:sync

# 4. Test in iOS Simulator
npm run cap:open:ios
# Then click Run in Xcode

# 5. Test in Android Emulator
npm run cap:open:android
# Then click Run in Android Studio
```

### Before Releasing

```bash
# 1. Update version numbers
# iOS: ios/App/App/Info.plist
# Android: android/app/build.gradle

# 2. Sync changes
npm run cap:sync

# 3. Test on physical devices
# iOS: Connect iPhone via USB, run from Xcode
# Android: Connect Android device, run from Android Studio

# 4. Build for release
# iOS: Archive in Xcode, upload to App Store Connect
# Android: Generate signed AAB in Android Studio

# 5. Submit to stores
# Follow APP_STORE_CHECKLIST.md
```

---

## Permissions

### iOS Permissions (Info.plist)

- **NSCameraUsageDescription** - Take job photos
- **NSPhotoLibraryUsageDescription** - Access photo library
- **NSPhotoLibraryAddUsageDescription** - Save photos
- **NSLocationWhenInUseUsageDescription** - Get job location
- **NSMicrophoneUsageDescription** - Record videos (optional)

### Android Permissions (AndroidManifest.xml)

- **CAMERA** - Take job photos
- **READ_EXTERNAL_STORAGE** - Access photos
- **WRITE_EXTERNAL_STORAGE** - Save photos
- **ACCESS_FINE_LOCATION** - Get job location
- **ACCESS_COARSE_LOCATION** - Approximate location
- **VIBRATE** - Haptic feedback

All permissions are requested at runtime when needed (not on app install).

---

## Capacitor Plugins

### Installed Plugins

- `@capacitor/core` - Core framework
- `@capacitor/camera` - Photo capture
- `@capacitor/push-notifications` - Push notifications
- `@capacitor/geolocation` - GPS location
- `@capacitor/haptics` - Vibration feedback
- `@capacitor/share` - Native sharing
- `@capacitor/status-bar` - Status bar styling
- `@capacitor/keyboard` - Keyboard handling
- `@capacitor/ios` - iOS platform
- `@capacitor/android` - Android platform

### Adding More Plugins

```bash
# Example: Add network plugin
npm install @capacitor/network

# Sync to native projects
npx cap sync

# Use in code
var Network = Capacitor.Plugins.Network;
Network.getStatus().then(function(status) {
  console.log('Network status:', status);
});
```

---

## Testing

### Web Browser Testing

Most native features gracefully degrade in browser:

```javascript
if (CameraHelper.isAvailable()) {
  // Use native camera
  CameraHelper.takePhoto();
} else {
  // Fallback to file input
  document.getElementById('fileInput').click();
}
```

### Simulator/Emulator Testing

**iOS Simulator:**
- ✅ Most UI works
- ❌ No camera (use physical device)
- ❌ No push notifications (use physical device)
- ✅ Geolocation works (can set location)

**Android Emulator:**
- ✅ Most UI works
- ✅ Camera works (virtual camera)
- ❌ Push notifications limited
- ✅ Geolocation works (can set location)

### Physical Device Testing

**Recommended for:**
- Camera functionality
- Push notifications
- GPS/Location
- Haptic feedback
- Performance testing
- Battery usage

---

## Troubleshooting

### Camera not working

1. Check permissions in Info.plist (iOS) or AndroidManifest.xml (Android)
2. Test on physical device (simulators may not have camera)
3. Check console for errors

### Notifications not showing

1. Verify push notification permissions requested
2. Check user granted permission
3. Test on physical device (simulators limited)
4. For remote notifications: Set up APNs (iOS) or FCM (Android)

### Location inaccurate

1. Test outdoors (GPS needs clear sky view)
2. Enable high accuracy in code
3. Check device location settings

### App crashes on launch

1. Check browser console in web inspector
2. Look for JavaScript errors
3. Verify all dependencies loaded
4. Check Capacitor plugins installed

---

## Resources

### Documentation

- **This Project:**
  - [NATIVE_APP_GUIDE.md](./NATIVE_APP_GUIDE.md) - Complete deployment guide
  - [APP_STORE_CHECKLIST.md](./APP_STORE_CHECKLIST.md) - Submission checklist
  - [CLAUDE.md](./CLAUDE.md) - Full codebase documentation

- **Capacitor:**
  - [Capacitor Docs](https://capacitorjs.com/docs)
  - [iOS Guide](https://capacitorjs.com/docs/ios)
  - [Android Guide](https://capacitorjs.com/docs/android)
  - [Plugins](https://capacitorjs.com/docs/plugins)

- **Platform Docs:**
  - [Apple Developer](https://developer.apple.com)
  - [Android Developers](https://developer.android.com)

### Support

- **Issues:** Check NATIVE_APP_GUIDE.md Troubleshooting section
- **Capacitor Community:** [ionic.link/discord](https://ionic.link/discord)
- **Stack Overflow:** Tag with `capacitor`

---

## Next Steps

1. **Read [NATIVE_APP_GUIDE.md](./NATIVE_APP_GUIDE.md)** for complete setup instructions
2. **Install prerequisites** (Xcode, Android Studio, etc.)
3. **Add platforms** (`npx cap add ios && npx cap add android`)
4. **Test thoroughly** on simulators and devices
5. **Follow [APP_STORE_CHECKLIST.md](./APP_STORE_CHECKLIST.md)** for submission
6. **Launch!** 🚀

---

**Questions?** Consult the documentation or Capacitor community.

**Ready to build native apps?** Start with NATIVE_APP_GUIDE.md!
