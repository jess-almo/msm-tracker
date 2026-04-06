# Android Packaging

MSM Tracker now has a first Android wrapper path using Capacitor.

## Current Setup

- Capacitor config: [`capacitor.config.json`](../capacitor.config.json)
- Native Android project: [`android`](../android)
- App ID: `com.jessealmo.msmtracker`
- App name: `MSM Tracker`
- Web build source: `dist`

## Repo Commands

- `npm run android:doctor`
- `npm run android:sync`
- `npm run android:open`
- `npm run android:run`

## Typical Workflow

1. Install Android Studio or Android SDK.
2. Ensure your Android SDK path is configured.
3. Sync fresh web assets:

```bash
npm run android:sync
```

4. Build a debug APK:

```bash
cd android
gradlew.bat assembleDebug
```

5. Install the APK on a real Android device for testing.

## Expected APK Output

```text
android/app/build/outputs/apk/debug/
```

## Recommended Mobile Validation

- local persistence survives close/reopen
- scroll behavior feels natural
- tap targets are comfortable
- Android back-button behavior is sane
- long-session usage stays stable
