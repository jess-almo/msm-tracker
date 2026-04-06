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

What it does:
- runs a production build first
- then runs the release checker
- tells you whether the repo is release-eligible right now
- suggests the next version number if the current unreleased work is big enough

Use this when:
- you just finished a meaningful feature pass
- you want to know if the next cut should be a real version
- you want a quick “are we actually ready?” check

Detailed release commands:

```bash
npm run release:check
npm run release:prepare -- <version>
npm run build
npm run release:tag -- --dry-run
npm run release:tag
```

What each command does:

`npm run release:check`
- checks the current changelog state against the existing package version
- counts unreleased notable bullets
- checks whether operational completeness is currently satisfied
- recommends whether a release should happen and suggests the next version

`npm run release:prepare -- <version>`
- updates `package.json` to the new version
- moves the current `Unreleased` changelog notes into a real versioned section
- resets `Unreleased` so the next work starts fresh

`npm run build`
- verifies the app still builds cleanly after the version cut
- this is the final app sanity check before you commit and push the release

`npm run release:tag -- --dry-run`
- checks whether the repo is in a valid state for tagging
- lets you preview the tag step without changing git history
- good for catching mistakes before making the real tag

`npm run release:tag`
- creates the real annotated git tag for the prepared release
- this should happen only after the release commit is pushed

## Recommended Release Routine

When the checker says a release is worth cutting, use this order:

```bash
npm run release:review
npm run release:prepare -- <version>
npm run build
npm run release:tag -- --dry-run
git status
git add package.json CHANGELOG.md
git commit -m "release-<version>"
git push origin main
npm run release:tag
git push origin v<version>
gh release create v<version> "android\app\build\outputs\apk\debug\app-debug.apk" --title "<version>" --notes "<release notes>"
```

What this routine is doing:
- first confirms the release is actually justified
- then stamps the new version into the repo
- then verifies the app still builds
- then previews the tag step
- then creates the actual release commit and pushes it
- then creates and pushes the tag
- then creates the GitHub release page and uploads the APK asset

Practical rule:
- stop after any step that looks wrong
- do not tag or publish if the build fails
- do not create the GitHub release until the release commit and tag are both on GitHub

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
