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
- `npm run android:package-debug`
- `npm run android:install-debug`
- `npm run android:refresh-debug`
- `npm run android:open`
- `npm run android:run`

## Typical Workflow

1. Install Android Studio or Android SDK.
2. Ensure your Android SDK path is configured.
3. Sync fresh web assets:

```bash
npm run android:sync
```

4. Install the newest debug build onto the running emulator or connected device:

```bash
npm run android:install-debug
```

5. Or do the full checkpoint loop in one shot:

```bash
npm run android:refresh-debug
```

6. If you need the raw debug APK file for sharing or release assets:

```bash
npm run android:package-debug
```

7. Or run Gradle directly if you need the native wrapper command:

```bash
cd android
gradlew.bat assembleDebug
```

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

## Release Rhythm

Before cutting another version, use the active checklist in [`TODO.md`](../TODO.md) and run:

```bash
npm run release:review
npm run release:notes
npm run android:package-debug
npm run release:guide
```

That keeps the Android packaging routine aligned with release eligibility instead of treating APK builds as a separate side quest.
