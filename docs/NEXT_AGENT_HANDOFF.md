# Next Agent Handoff

This file is the short project-state handoff for the next coding pass.
Use it when thread context is gone and you need the current app direction fast.

## Current Product Direction

- The app is shifting from a tracker-shaped UI to an app-first UI.
- Collections is now organized around `collection worlds`, not `vessels vs islands`.
- Standard island worlds, Amber Island, Wublin Island, and other worlds should feel like one browsing system with different inner mechanics.
- Desktop still matters, but recent work intentionally optimized the experience so it also feels good in the Android wrapper.

## Current Collections Model

- Standard island collection world cards are fully clickable.
- The old bottom-first `Open Collection` flow has been replaced by a lighter `Tap to open` treatment.
- Locked worlds should still be viewable in Collections, but they should not behave as active operational surfaces until unlocked in Island Manager.
- Standard world cards should use simple state language:
  - `Locked`
  - `Active`
  - `Complete`
- Avoid older world-card states like `Partially Complete` for standard islands unless there is a clear product reason.

## Current Island Collection Rules

- Island collection membership is curated game-truth data.
- Do not derive standard island collection membership purely from broad `breedableOn` metadata.
- `showInCollection` and `showInOperations` are separate ideas.
- Dipsters, relic-bought monsters, and other collection-only entries can stay in collections without entering operations.
- Standard island collection demand should stay visible until the monster is actually collected/placed, not merely planned.

## Current Visual System

- World cards on Collections home now support:
  - world pin art on the card
  - world icon art inside the opened collection sheet
- Monster portraits are now supported on compact collection cards and in Monster Directory.
- Circular element icons are the preferred in-app element style.
- The older square/wiki-style element portraits are not the primary UI direction.
- Shared element icon chips are already wired across:
  - Monster Directory
  - Sheet monster cards
  - Breeding Queue
  - Island Manager

## Asset Structure

Use the documented structure under `public/`:

- `public/branding/app-icon.png`
  - main app identity icon
- `public/monsters/portraits`
  - monster portraits
- `public/monsters/worlds/icons`
  - world art used inside opened collection sheets
- `public/monsters/worlds/pins`
  - world art used on Collections home cards
- `public/monsters/elements`
  - circular element icons
- `public/inbox`
  - holding area for unsorted incoming assets

Also read:
- `public/ASSET_STRUCTURE.md`

## Key Files To Know

- `src/pages/Collections.jsx`
  - collection worlds home, world card layout, world art treatment, click/open behavior
- `src/components/TrackerSheet.jsx`
  - opened collection sheet header and world icon treatment
- `src/components/SheetMonsterCard.jsx`
  - compact island collection card treatment, portrait usage, focus/collected actions
- `src/components/MonsterDirectory.jsx`
  - portrait and element icon usage in the directory
- `src/components/ElementChip.jsx`
  - shared circular icon-backed element chip
- `src/utils/monsterMetadata.js`
  - portrait lookup, world/icon helper mapping, element icon mapping, special element aliases, Wubbox/Wublin electricity fallback
- `src/utils/queue.js`
  - island collection operations shaping and per-island demand behavior

## Current Known Design Preferences

- The user likes:
  - app-like, visual, collectible-feeling UI
  - dark mode as a strong baseline
  - light mode still being worth polishing later
  - collection cards that feel rewarding, not spreadsheet-like
- The user does not like:
  - bloated card copy
  - giant destructive buttons
  - stale states left over from older UI versions
  - visuals that fight the layout instead of supporting it

## Working Agreements

- Use `cmd`, not PowerShell, for shell commands.
- Use `apply_patch` for manual code edits.
- If suggesting a commit, remind:
  1. Export backup
  2. Then commit
- Keep commit-message suggestions explicit.

## Current Gaps / Next Good Targets

- Continue the curated island roster pass beyond the first current islands.
- Finalize how per-island collection focus should work cleanly.
- Keep tuning Collections desktop/mobile balance without losing the newer app-style card system.
- Improve world art coverage as more assets are added.
- Continue polishing Monster Directory as a stronger in-app reference surface now that portraits and element icons exist.

