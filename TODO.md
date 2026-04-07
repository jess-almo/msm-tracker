# TODO

MSM Tracker's active operating list.

Use this file for:
- the next 1-3 things we are actually working on
- the minimum bar for the next release
- the current Android packaging routine

For the full command list, use [`COMMANDS.md`](./COMMANDS.md).

Do not let this turn into a graveyard of every idea. Move finished work to [`CHANGELOG.md`](./CHANGELOG.md) and keep this biased toward the next real milestone.

## Now

- Keep pushing Collections toward the true collection-first model:
  - one collection item per monster identity
  - Rare and Epic variants stay separate entries
  - collection status should describe collection progress, not just sheet/run state
- Tighten cross-screen consistency across Collections, Dashboard, Island Manager, Active Sheets, and Monster Library so the app feels like one design system.
- Keep improving correction and reconciliation flows for wrong zaps, wrong assignments, and tracker drift during real play.

## Before Next Release

- Sanity-check the current collection-first and reconciliation changes in actual play, not just ideal test cases.
- Decide whether the current unreleased work is enough for `0.4.1` or should wait for a broader `0.5.0` milestone.
- Run the release routine:

```bash
npm run release:review
```

- If eligible and worth cutting:

```bash
npm run release:prepare -- <version>
npm run build
npm run release:notes
npm run android:package-debug
npm run release:tag -- --dry-run
npm run release:guide
```

- Then commit, push, tag, and publish the GitHub release with the newest APK asset.

## Android Routine

- For fast web iteration, keep using:

```bash
npm run dev
```

- For Android checkpoint testing on emulator/device:

```bash
npm run android:refresh-debug
```

- For a releasable debug APK asset:

```bash
npm run android:package-debug
```

- That routine should:
  - build the newest web app
  - sync it into Capacitor
  - install the newest debug APK onto the running emulator/device

- Still needed for Android:
  - change app id to `com.jalmo.msmtracker`
  - use `J.almo` as the visible developer/storefront identity
  - add app icon, splash, and basic Android polish
  - eventually move from debug APK sharing to a proper signed release APK

## Safety / Data

- Use the new backup/export/import flow before device changes or risky tracker cleanup.
- Keep improving reconciliation so tracker drift can be repaired from game truth instead of manual unraveling.
- Expand data coverage where it materially improves the live app, not just for encyclopedia completeness.
- Keep the lightweight persistence tests healthy as shared save/load helpers evolve.

## Later

- Improve Monster Directory as the main in-app reference surface.
- Explore recipe/discovery support built on manual breeding sessions.
- Add broader collection support over time, including more complete Rare/Epic tracking and full island collection views beyond the base layer.
- Explore limited-time or event goal activation once the data layer is strong enough.
