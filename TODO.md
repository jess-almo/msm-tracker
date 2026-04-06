# TODO

MSM Tracker's active operating list.

Use this file for:
- the next 1-3 things we are actually working on
- the minimum bar for the next release
- the current Android packaging routine

For the full command list, use [`COMMANDS.md`](./COMMANDS.md).

Do not let this turn into a graveyard of every idea. Move finished work to [`CHANGELOG.md`](./CHANGELOG.md) and keep this biased toward the next real milestone.

## Now

- Use the new Island Manager reconciliation flow during real breeding/zapping and note any mismatch cases it still fails to repair cleanly.
- Add a stronger correction workflow for wrong zaps and wrong assignments:
  - island-side reconcile stays as the first recovery surface
  - later add faster reassign/correction helpers where the friction is highest
- Keep tightening consistency across Collections, Dashboard, Island Manager, and Monster Library so the app feels like one design system.

## Before Next Release

- Sanity-check the reconciliation flow in actual play, not just ideal test cases.
- Decide whether the current unreleased work feels like `0.4.0` or should wait for one more safety/polish pass.
- Run the release routine:

```bash
npm run release:review
```

- If eligible and worth cutting:

```bash
npm run release:prepare -- <version>
npm run build
npm run release:tag -- --dry-run
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

- Add backup/export/import before relying on cross-device use heavily.
- Keep improving reconciliation so tracker drift can be repaired from game truth instead of manual unraveling.
- Expand data coverage where it materially improves the live app, not just for encyclopedia completeness.

## Later

- Improve Monster Directory as the main in-app reference surface.
- Explore recipe/discovery support built on manual breeding sessions.
- Add broader collection support over time, including more complete Rare/Epic tracking.
- Explore limited-time or event goal activation once the data layer is strong enough.
