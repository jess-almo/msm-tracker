# Android Packaging

This repo now has a first Android wrapper path using Capacitor.

## Current Setup

- Capacitor config: [`capacitor.config.json`](../capacitor.config.json)
- Native Android project: [`android`](../android)
- App ID: `com.jessealmo.msmtracker`
- App name: `MSM Tracker`
- Web build source: `dist`

## Repo Commands

- `npm run android:doctor`
  - checks the current Capacitor Android setup
- `npm run android:sync`
  - runs the Vite build
  - copies fresh web assets into the Android project
  - updates Capacitor plugins
- `npm run android:open`
  - opens the Android project in Android Studio
- `npm run android:run`
  - runs build + sync + native run for Android once SDK/device setup exists

## Current Machine Status

The Android project was generated successfully and `npm run android:sync` works.

The current blocker to producing a debug APK on this machine is:

- Android SDK location is not configured

Observed native build failure:

- `SDK location not found. Define a valid SDK location with an ANDROID_HOME environment variable or by setting the sdk.dir path in your project's local properties file`

## What You Need To Finish A Real APK

1. Install Android Studio or a standalone Android SDK.
2. Ensure the SDK exists in a valid location.
3. Either:
   - set `ANDROID_HOME`, or
   - set `ANDROID_SDK_ROOT`, or
   - create `android/local.properties` with:

```properties
sdk.dir=C:\\Users\\<you>\\AppData\\Local\\Android\\Sdk
```

4. Run:

```bash
npm run android:sync
cd android
gradlew.bat assembleDebug
```

5. The debug APK should then appear under:

```text
android/app/build/outputs/apk/debug/
```

## Recommended Next Mobile Steps

1. Install/test a debug APK on a real Android device.
2. Validate:
   - local persistence survives close/reopen
   - scroll behavior
   - tap targets
   - Android back-button behavior
   - long-session stress usage
3. Add app icon and splash polish.
4. Add export/import backup before relying on the mobile build heavily.
5. Later, create a signed release build for sharing beyond local testing.
