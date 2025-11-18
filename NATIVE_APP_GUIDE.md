# Native Mobile App Deployment Guide

**TicTacStick v1.13.0 - Native Mobile App Wrapper**

**Last Updated:** 2025-11-18

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Quick Start](#quick-start)
4. [iOS Setup](#ios-setup)
5. [Android Setup](#android-setup)
6. [Testing](#testing)
7. [App Store Submission](#app-store-submission)
8. [Updates & Maintenance](#updates--maintenance)
9. [Troubleshooting](#troubleshooting)

---

## Overview

This guide covers converting TicTacStick from a Progressive Web App (PWA) to native iOS and Android applications using Capacitor.

### Why Native Apps?

**Benefits:**
- 📱 **Discoverability** - App Store & Google Play visibility
- 🔔 **Push Notifications** - Re-engage users with task reminders
- 📷 **Native Camera** - Better photo quality and integration
- 📍 **Geolocation** - Accurate job site tracking
- ⚡ **Performance** - Native UI feels faster
- 💼 **Professional** - Increases business credibility

### Technology Stack

- **Capacitor 6.0** - Modern native bridge (successor to Cordova)
- **iOS 13+** - Target deployment
- **Android 5.0+ (API 22+)** - Target deployment
- **ES5 JavaScript** - Maintains existing codebase compatibility

---

## Prerequisites

### Required Software

#### For iOS Development:

- **macOS Computer** (required for iOS builds)
- **Xcode 13+** - Download from Mac App Store
- **CocoaPods** - Install with: `sudo gem install cocoapods`
- **Apple Developer Account** - $99/year (required for App Store)

#### For Android Development:

- **Android Studio** - Download from [developer.android.com](https://developer.android.com/studio)
- **Android SDK** - Installed via Android Studio
- **Java Development Kit (JDK) 11+** - Required by Android build tools
- **Google Play Developer Account** - $25 one-time fee

#### For Both Platforms:

- **Node.js v16+** - Check with: `node --version`
- **npm or yarn** - Package manager
- **Git** - Version control

### Verify Installation

```bash
# Check Node.js version
node --version  # Should be v16 or higher

# Check npm version
npm --version

# For iOS - Check Xcode
xcode-select --version

# For iOS - Check CocoaPods
pod --version

# For Android - Check Java
java -version  # Should be 11 or higher
```

---

## Quick Start

### Step 1: Install Dependencies

```bash
# Navigate to project directory
cd /path/to/tictacstick

# Install Capacitor dependencies (already in package.json)
npm install

# This installs:
# - @capacitor/core
# - @capacitor/cli
# - @capacitor/ios
# - @capacitor/android
# - @capacitor/camera
# - @capacitor/push-notifications
# - @capacitor/geolocation
# - @capacitor/haptics
# - etc.
```

### Step 2: Initialize Capacitor (if not already done)

The `capacitor.config.json` is already configured. If you need to re-initialize:

```bash
npx cap init
# Answer prompts:
# App name: TicTacStick
# App ID: com.pressureglass.tictacstick
# Web directory: . (current directory)
```

### Step 3: Add Platforms

```bash
# Add iOS platform
npx cap add ios

# Add Android platform
npx cap add android

# This creates ios/ and android/ directories with native projects
```

### Step 4: Sync Web Assets

```bash
# Copy web app to native projects
npx cap sync

# Or use npm script:
npm run cap:sync
```

### Step 5: Open in IDE

```bash
# Open iOS in Xcode
npx cap open ios
# Or: npm run cap:open:ios

# Open Android in Android Studio
npx cap open android
# Or: npm run cap:open:android
```

---

## iOS Setup

### 1. Configure iOS Project

After running `npx cap add ios`, configure the iOS project:

#### Update Info.plist

Location: `ios/App/App/Info.plist`

Add required permission descriptions:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <!-- App Information -->
    <key>CFBundleDisplayName</key>
    <string>TicTacStick</string>

    <key>CFBundleIdentifier</key>
    <string>com.pressureglass.tictacstick</string>

    <key>CFBundleShortVersionString</key>
    <string>1.13.0</string>

    <key>CFBundleVersion</key>
    <string>1</string>

    <!-- Camera Permission -->
    <key>NSCameraUsageDescription</key>
    <string>Take photos of jobs for quotes and documentation</string>

    <!-- Photo Library Permission -->
    <key>NSPhotoLibraryUsageDescription</key>
    <string>Access photos for job documentation</string>

    <key>NSPhotoLibraryAddUsageDescription</key>
    <string>Save photos to your library</string>

    <!-- Location Permission -->
    <key>NSLocationWhenInUseUsageDescription</key>
    <string>Show your location on the map for nearby jobs</string>

    <key>NSLocationAlwaysUsageDescription</key>
    <string>Track job locations for routing optimization</string>

    <!-- Microphone (for video) -->
    <key>NSMicrophoneUsageDescription</key>
    <string>Record videos of job sites</string>

    <!-- Background Modes (for push notifications) -->
    <key>UIBackgroundModes</key>
    <array>
        <string>fetch</string>
        <string>remote-notification</string>
    </array>

    <!-- Status Bar -->
    <key>UIStatusBarStyle</key>
    <string>UIStatusBarStyleLightContent</string>

    <key>UIViewControllerBasedStatusBarAppearance</key>
    <true/>

    <!-- Orientation (Portrait only) -->
    <key>UISupportedInterfaceOrientations</key>
    <array>
        <string>UIInterfaceOrientationPortrait</string>
        <string>UIInterfaceOrientationPortraitUpsideDown</string>
    </array>
</dict>
</plist>
```

### 2. Create App Icons

**Required Sizes:**

Create icons for all required sizes. Use a tool like [appicon.co](https://appicon.co) or [makeappicon.com](https://makeappicon.com).

Upload a **1024×1024** master icon and the tool generates all sizes:

- 20×20, 29×29, 40×40, 58×58, 60×60
- 76×76, 80×80, 87×87, 120×120
- 152×152, 167×167, 180×180
- 1024×1024 (App Store)

**Location:** `ios/App/App/Assets.xcassets/AppIcon.appiconset/`

### 3. Create Launch Screen

The launch screen is configured in `ios/App/App/LaunchScreen.storyboard`.

**Capacitor default is sufficient**, but you can customize:
- Background color: `#2563eb` (TicTacStick blue)
- Logo: App icon centered
- App name below logo

### 4. Configure Signing

In Xcode:

1. Select project in navigator
2. Select target "App"
3. Go to "Signing & Capabilities" tab
4. Select your **Team** (Apple Developer account)
5. Enable **Automatically manage signing**
6. Xcode will create provisioning profiles automatically

### 5. Build and Test

```bash
# Sync latest changes
npx cap sync ios

# Open in Xcode
npx cap open ios

# In Xcode:
# 1. Select a simulator (e.g., iPhone 14 Pro)
# 2. Click Run button (▶) or press Cmd+R
# 3. App launches in simulator

# Test on physical device:
# 1. Connect iPhone via USB
# 2. Select device in Xcode
# 3. Click Run
# 4. Trust developer certificate on device if prompted
```

---

## Android Setup

### 1. Configure Android Project

After running `npx cap add android`, configure the Android project:

#### Update AndroidManifest.xml

Location: `android/app/src/main/AndroidManifest.xml`

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.pressureglass.tictacstick">

    <!-- Permissions -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"/>
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"/>
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-permission android:name="android.permission.VIBRATE" />

    <!-- Features -->
    <uses-feature android:name="android.hardware.camera" android:required="false" />
    <uses-feature android:name="android.hardware.camera.autofocus" android:required="false" />
    <uses-feature android:name="android.hardware.location.gps" android:required="false" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/AppTheme"
        android:usesCleartextTraffic="true">

        <activity
            android:name=".MainActivity"
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode"
            android:label="@string/title_activity_main"
            android:theme="@style/AppTheme.NoActionBarLaunch"
            android:launchMode="singleTask"
            android:exported="true">

            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
```

#### Update build.gradle

Location: `android/app/build.gradle`

```gradle
android {
    namespace "com.pressureglass.tictacstick"
    compileSdkVersion 33

    defaultConfig {
        applicationId "com.pressureglass.tictacstick"
        minSdkVersion 22
        targetSdkVersion 33
        versionCode 1
        versionName "1.13.0"
        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

### 2. Create App Icons

Use Android Studio's Image Asset tool:

1. Right-click `android/app/src/main/res`
2. New → Image Asset
3. Icon Type: Launcher Icons (Adaptive and Legacy)
4. Path: Select your 1024×1024 icon
5. Background: Choose solid color (#2563eb)
6. Finish

**Generates:**
- mipmap-mdpi (48×48)
- mipmap-hdpi (72×72)
- mipmap-xhdpi (96×96)
- mipmap-xxhdpi (144×144)
- mipmap-xxxhdpi (192×192)

### 3. Create Splash Screen

Create `android/app/src/main/res/drawable/splash.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<layer-list xmlns:android="http://schemas.android.com/apk/res/android">
    <!-- Background Color -->
    <item android:drawable="@color/splash_background"/>

    <!-- Logo (centered) -->
    <item>
        <bitmap
            android:gravity="center"
            android:src="@drawable/splash_logo"/>
    </item>
</layer-list>
```

Create `android/app/src/main/res/values/colors.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="splash_background">#2563eb</color>
    <color name="colorPrimary">#2563eb</color>
    <color name="colorPrimaryDark">#1e40af</color>
    <color name="colorAccent">#10b981</color>
</resources>
```

### 4. Build and Test

```bash
# Sync latest changes
npx cap sync android

# Open in Android Studio
npx cap open android

# In Android Studio:
# 1. Let Gradle sync (first time takes a while)
# 2. Select device/emulator
# 3. Click Run (▶) or press Shift+F10

# Build APK for testing:
# Build → Build Bundle(s) / APK(s) → Build APK(s)
```

---

## Testing

### Test Checklist

#### Web Features:

- [ ] All pages load correctly
- [ ] Forms work properly
- [ ] LocalStorage persists data
- [ ] Offline mode works
- [ ] Calculations are accurate
- [ ] PDF generation works
- [ ] Invoices save and load

#### Native Features:

- [ ] Camera opens and captures photos
- [ ] Photos attach to quotes
- [ ] Push notifications display
- [ ] Location permission requested
- [ ] Location data saved
- [ ] Haptic feedback works
- [ ] Share functionality works
- [ ] Status bar styled correctly

#### Platform-Specific:

**iOS:**
- [ ] Runs on iPhone 8, 11, 14 (test multiple)
- [ ] Runs on iPad
- [ ] Portrait orientation locks correctly
- [ ] No console errors
- [ ] App doesn't crash

**Android:**
- [ ] Runs on Android 5.0+
- [ ] Runs on various screen sizes
- [ ] Back button behaves correctly
- [ ] Material design respected
- [ ] No crashes

### Debug on Device

#### iOS Debug:

1. Connect iPhone via USB
2. Open Xcode
3. Select device
4. Run app
5. View console in Xcode for logs
6. Safari → Develop → [Device] → Inspect web view

#### Android Debug:

1. Enable Developer Options on Android device
2. Enable USB Debugging
3. Connect via USB
4. Run from Android Studio
5. View Logcat for logs
6. Chrome → chrome://inspect → Inspect web view

---

## App Store Submission

### iOS App Store

#### 1. Create App in App Store Connect

1. Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. Click "My Apps" → "+"
3. Select "New App"
4. Fill in:
   - **Platform:** iOS
   - **Name:** TicTacStick
   - **Primary Language:** English (Australia)
   - **Bundle ID:** com.pressureglass.tictacstick
   - **SKU:** TTS-001

#### 2. Prepare App Metadata

**App Information:**
- **Name:** TicTacStick
- **Subtitle:** Quote Engine for Service Pros
- **Category:** Business / Productivity

**Description (4000 chars max):**

```
TicTacStick is the complete mobile quote engine for window cleaning and pressure washing professionals. Generate professional quotes in minutes, manage clients, track tasks, and grow your business.

FEATURES:
• Quick Quote Generation - Answer a few questions, get accurate pricing
• Client Database - Store all customer information securely
• Task Management - Never miss a follow-up
• Contract Management - Recurring jobs made easy
• Invoice & Payments - Get paid faster
• Analytics Dashboard - Track your business growth
• Works Offline - Create quotes anywhere, sync later

PERFECT FOR:
• Window cleaners
• Pressure washing services
• Exterior cleaning professionals
• Service contractors

Download TicTacStick today and streamline your quoting process!
```

**Keywords (100 chars max):**
```
quote,invoice,business,cleaning,contractor,job,estimate,crm,field service
```

**URLs:**
- **Support URL:** https://tictacstick.com.au/support (create this)
- **Marketing URL:** https://tictacstick.com.au
- **Privacy Policy URL:** https://tictacstick.com.au/privacy (required - create this)

#### 3. Prepare Screenshots

**Required sizes:**
- 6.7" (iPhone 14 Pro Max): 1290×2796
- 6.5" (iPhone 11 Pro Max): 1242×2688
- 5.5" (iPhone 8 Plus): 1242×2208

**Screenshots needed (3-10):**
1. Dashboard/Home screen
2. Quote creation wizard
3. Client database list
4. Analytics dashboard
5. Invoice screen

**How to capture:**
- Use iOS Simulator in Xcode
- Cmd+S to save screenshot
- Or use connected device

#### 4. Archive and Upload

In Xcode:

```bash
# 1. Set destination to "Any iOS Device (arm64)"
# 2. Product → Archive
# 3. Wait for archive to complete (5-10 min)
# 4. Organizer window opens
# 5. Select your archive
# 6. Click "Distribute App"
# 7. Choose "App Store Connect"
# 8. Follow wizard
# 9. Click "Upload"
# 10. Wait for upload (10-30 min)
```

#### 5. Submit for Review

1. In App Store Connect, go to your app
2. Click "+ Version or Platform"
3. iOS → Enter version: 1.13.0
4. Fill required fields
5. Upload screenshots
6. Add "What's New"
7. Select build (uploaded from Xcode)
8. Submit for review

**Review time:** Typically 24-48 hours

---

### Google Play Store

#### 1. Create App in Play Console

1. Go to [play.google.com/console](https://play.google.com/console)
2. Click "Create app"
3. Fill in:
   - **App name:** TicTacStick
   - **Default language:** English (Australia)
   - **App or game:** App
   - **Free or paid:** Free
4. Complete declarations (privacy policy, etc.)

#### 2. Set Up Store Listing

**App details:**
- **App name:** TicTacStick
- **Short description (80 chars):**
  ```
  Professional quote engine for window cleaning & pressure washing services
  ```

- **Full description (4000 chars):**
  ```
  TicTacStick is the complete mobile solution for service professionals who need to generate quotes quickly and professionally in the field.

  KEY FEATURES:
  ✓ Quick Quote Generation
  ✓ Client Database Management
  ✓ Task & Follow-up Tracking
  ✓ Recurring Contracts
  ✓ Invoice & Payment Processing
  ✓ Business Analytics
  ✓ Offline Capability

  [Same as iOS description above]
  ```

**Graphics:**
- **App icon:** 512×512 PNG
- **Feature graphic:** 1024×500 PNG
- **Phone screenshots:** At least 2, 16:9 aspect ratio
- **Tablet screenshots:** Optional

**Categorization:**
- **Category:** Business
- **Content rating:** Complete questionnaire (answer honestly)
- **Target age:** Everyone

**Contact details:**
- **Email:** support@tictacstick.com.au
- **Privacy Policy:** https://tictacstick.com.au/privacy

#### 3. Prepare AAB (Android App Bundle)

In Android Studio:

```bash
# 1. Build → Generate Signed Bundle / APK
# 2. Choose "Android App Bundle"
# 3. Create or select keystore:
#    - Keystore path: ~/tictacstick.keystore
#    - Password: [choose secure password]
#    - Alias: tictacstick
#    - Alias password: [choose secure password]
#
#    CRITICAL: Save keystore file and passwords!
#    You cannot update app without them!
#
# 4. Choose "release" build variant
# 5. Click "Finish"
# 6. Find AAB: android/app/release/app-release.aab
```

**Store keystore securely:**
- Backup to password manager
- Backup to encrypted cloud storage
- Never commit to Git

#### 4. Upload to Play Console

1. In Play Console, go to your app
2. Release → Production
3. Create new release
4. Upload `app-release.aab`
5. Release name: 1.13.0
6. Release notes:
   ```
   Initial release of TicTacStick

   Features:
   - Professional quote generation
   - Client management
   - Task tracking
   - Invoice processing
   - Business analytics
   - Offline support
   ```
7. Review release
8. Start rollout → Production

**Review time:** Typically 1-7 days

---

## Updates & Maintenance

### Updating the App

#### For Web Changes (HTML, CSS, JavaScript):

```bash
# 1. Make changes to web app files
# 2. Test in browser
# 3. Sync to native projects
npx cap sync

# 4. Test in simulators/devices
# 5. Build and submit updates
```

#### Version Numbering:

**iOS:**
- Update `CFBundleShortVersionString` (e.g., 1.13.1)
- Increment `CFBundleVersion` (e.g., 2, 3, 4...)

**Android:**
- Update `versionName` (e.g., 1.13.1)
- Increment `versionCode` (must increase: 2, 3, 4...)

**Location:**
- iOS: `ios/App/App/Info.plist`
- Android: `android/app/build.gradle`

### Update Workflow

```bash
# 1. Make code changes

# 2. Update version numbers
# iOS: Edit Info.plist
# Android: Edit build.gradle

# 3. Sync changes
npm run cap:sync

# 4. Test on devices

# 5. iOS: Archive and upload via Xcode

# 6. Android: Generate signed AAB

# 7. Upload to stores

# 8. Submit for review
```

### Faster Updates with Capacitor Live Updates

For **minor web-only changes** (no native code changes):

```bash
# Install Capacitor Live Updates
npm install @capacitor/live-updates

# Deploy update
npx cap live-update deploy

# Users get updates immediately without App Store review!
```

**Limitations:**
- Cannot change native code
- Cannot add new permissions
- Cannot add new plugins

**Use cases:**
- Bug fixes
- UI improvements
- New web features
- Content updates

---

## Troubleshooting

### Common Issues

#### Issue: "App not opening"

**Cause:** JavaScript errors preventing app initialization

**Solution:**
1. Open Safari Web Inspector (iOS) or Chrome DevTools (Android)
2. Check console for errors
3. Fix errors in web code
4. Re-sync with `npx cap sync`

#### Issue: "Camera not working"

**Cause:** Missing permissions or plugin not installed

**Solution:**
1. Check `Info.plist` (iOS) or `AndroidManifest.xml` has camera permission
2. Verify `@capacitor/camera` is installed: `npm list @capacitor/camera`
3. Re-sync: `npx cap sync`
4. Test on physical device (simulators may not have camera)

#### Issue: "Push notifications not received"

**Cause:** Not registered or permission denied

**Solution:**
1. Check permission requested in `push-notifications.js`
2. Verify user granted permission
3. For iOS: Set up APNs certificate in Apple Developer
4. For Android: Set up Firebase Cloud Messaging
5. Test on physical device (simulators don't support push)

#### Issue: "Location not working"

**Cause:** Missing permissions

**Solution:**
1. Check location permissions in `Info.plist` / `AndroidManifest.xml`
2. Verify user granted permission
3. Test on physical device with GPS

#### Issue: "iOS build fails"

**Common causes:**
- CocoaPods not installed: `sudo gem install cocoapods`
- Pods not updated: `cd ios/App && pod install`
- Xcode version too old: Update Xcode from App Store
- Signing issues: Check Team in Xcode settings

#### Issue: "Android build fails"

**Common causes:**
- Java version mismatch: Use JDK 11
- Gradle sync failed: Android Studio → File → Sync Project with Gradle Files
- SDK not installed: Android Studio → SDK Manager → Install missing SDKs
- Build tools outdated: Update in SDK Manager

#### Issue: "App rejected by App Store"

**Common reasons:**
- Missing privacy policy
- Insufficient app description
- Poor quality screenshots
- Bugs or crashes
- Missing required metadata

**Solution:**
1. Read rejection email carefully
2. Fix issues mentioned
3. Re-submit

---

## Resources

### Documentation

- [Capacitor Docs](https://capacitorjs.com/docs)
- [iOS Development](https://developer.apple.com/documentation/)
- [Android Development](https://developer.android.com/docs)

### Tools

- [App Icon Generator](https://appicon.co)
- [Screenshot Generator](https://www.applaunchpad.com)
- [Privacy Policy Generator](https://www.privacypolicygenerator.info)

### Support

- **Capacitor Community:** [capacitor.ionicframework.com/community](https://capacitor.ionicframework.com/community)
- **Stack Overflow:** Tag with `capacitor`

---

## Next Steps

1. **Test thoroughly** on multiple devices
2. **Create privacy policy** (required for App Store)
3. **Prepare marketing materials** (screenshots, descriptions)
4. **Submit to App Stores**
5. **Monitor reviews** and respond to users
6. **Plan updates** based on user feedback

---

**Congratulations! You now have native iOS and Android apps!** 🎉

For questions or issues, consult this guide or reach out to the Capacitor community.
