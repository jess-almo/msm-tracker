# Command Reference

Quick command index for MSM Tracker. Run these from the repo root unless a section says otherwise.

## Daily Development

```bash
npm install
npm run dev
npm run build
npm run preview
npm run lint
```

## Data Workflow

```bash
npm run parse:inbox
npm run promote:breeding-data
npm run audit:operational-data
```

## Release Workflow

Quick release review:

```bash
npm run release:review
```

Detailed release commands:

```bash
npm run release:check
npm run release:prepare -- <version>
npm run build
npm run release:tag -- --dry-run
npm run release:tag
```

## Android Workflow

General checks and setup:

```bash
npm run android:doctor
npm run android:open
```

Sync the latest web build into Capacitor:

```bash
npm run android:sync
```

Install the current debug build onto a running emulator or device:

```bash
npm run android:install-debug
```

Do the full Android refresh in one shot:

```bash
npm run android:refresh-debug
```

Capacitor direct run flow:

```bash
npm run android:run
```

## Manual Android Gradle Commands

From the repo root:

```bash
cd android
```

In `cmd.exe`:

```bat
gradlew.bat installDebug
gradlew.bat assembleDebug
```

In PowerShell:

```powershell
.\gradlew.bat installDebug
.\gradlew.bat assembleDebug
```

## Git / Publishing

Typical checkpoint flow:

```bash
git status
git add <files>
git commit -m "<message>"
git push origin main
```

Typical version/tag flow:

```bash
git tag -a v<version> -m "release v<version>"
git push origin v<version>
```

GitHub release with APK asset:

```bash
gh release create v<version> "android\app\build\outputs\apk\debug\app-debug.apk" --title "<version>" --notes "<release notes>"
```

## Useful Files

- `README.md`: project overview
- `TODO.md`: active operating list
- `CHANGELOG.md`: completed notable work and release history
- `docs/ANDROID.md`: Android setup and emulator/device workflow
- `docs/ARCHITECTURE.md`: app structure and working routine
