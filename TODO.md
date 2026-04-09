# TODO

MSM Tracker's active operating list.

Use this file for:
- the next 1-3 things we are actually working on
- the minimum bar for the next release
- the current Android packaging routine

For the full command list, use [`COMMANDS.md`](./COMMANDS.md).

Do not let this turn into a graveyard of every idea. Move finished work to [`CHANGELOG.md`](./CHANGELOG.md) and keep this biased toward the next real milestone.

## Now

- Finish the curated island-collection truth pass beyond the current first batches:
  - keep moving islands off broad `breedableOn` inference and onto explicit collection rosters
  - preserve `showInCollection` vs `showInOperations` so collection-only entries do not leak into planner demand
  - keep standard island worlds browseable even while locked, but only let unlocked worlds drive live operations
- Tighten time-gated and special availability rules:
  - seasonal monsters stay in collection but only enter operations when marked available
  - Owlesque and other time-gated cases need explicit availability handling instead of generic always-on routing
  - verify mythical behavior and design Mythical Island as a special teleport/breeding system instead of forcing it into standard island logic
- Keep refining normal island collection flow:
  - collection gaps should stay visible until the monster is actually hatched/placed
  - nursery/placement truth should read more clearly for regular island collections
  - keep per-island collection focus to a clean 3-slot lane once that interaction is finalized
- Keep polishing the app-first UI system:
  - standard collection world cards are now clickable and art-led; continue tuning desktop/mobile balance without regressing the stronger app feel
  - compact collection cards should stay dense, portrait-friendly, and checklist-first
  - remove leftover copy or states that still sound like planner math instead of collection progress
- Keep expanding the asset-driven visual system:
  - wire newly added world art and monster portraits as assets land
  - keep the circular element icon system consistent across all screens
  - finish documenting any remaining naming/placement rules so asset drops do not depend on thread context
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
- Treat island collection membership as curated game-truth data, not something that can be inferred safely from broad breeding metadata alone.
- Keep the new asset system curated:
  - monster portraits live under `public/monsters/portraits`
  - world sheet art lives under `public/monsters/worlds/icons`
  - world card pins live under `public/monsters/worlds/pins`
  - circular element icons live under `public/monsters/elements`

## Later

- Improve Monster Directory as the main in-app reference surface.
- Explore recipe/discovery support built on manual breeding sessions.
- Add broader collection support over time, including more complete Rare/Epic tracking and full island collection views beyond the base layer.
- Explore limited-time or event goal activation once the data layer is strong enough.
