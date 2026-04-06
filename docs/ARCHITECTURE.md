# MSM Tracker Architecture

This document describes the architecture that is currently on disk. Update it whenever structural ownership, helper contracts, entrypoints, or persistence behavior changes.

## Active Entrypoint

- The active app entrypoint is [`src/main.jsx`](../src/main.jsx).
- [`src/main.jsx`](../src/main.jsx) imports [`src/App.jsx`](../src/App.jsx) as the live app root.
- [`src/App.jsx`](../src/App.jsx) is the only app root.

## Top-Level Screens

- Dashboard: implemented inside [`src/App.jsx`](../src/App.jsx) as the `home` screen. Shows active vessel summary, island collection completion, breeder and nursery capacity, queue highlights, and quick navigation.
- Active Sheets: [`src/pages/ActiveSheets.jsx`](../src/pages/ActiveSheets.jsx). Fast operational view of active sheets only.
- Collections: [`src/pages/Collections.jsx`](../src/pages/Collections.jsx). Browsing surface for tracked goals.
- Breeding Queue: [`src/components/BreedingQueue.jsx`](../src/components/BreedingQueue.jsx). Shows `To Breed` and `Breeding Now`.
- Island Manager: [`src/components/IslandPlanner.jsx`](../src/components/IslandPlanner.jsx). Operational execution surface for island capacity, assignment, manual breeding, zapping, nursery movement, and hatching.
- Monster Library: [`src/components/MonsterDirectory.jsx`](../src/components/MonsterDirectory.jsx). Read-only reference screen.
- Tracker Sheet: [`src/components/TrackerSheet.jsx`](../src/components/TrackerSheet.jsx). Shared sheet renderer for both vessel and island sheets.

## State Ownership

Top-level state lives in [`src/App.jsx`](../src/App.jsx):

- `sheets`
- `collectionsData`
- `islandStates`
- `breedingSessions`
- `view`

`src/App.jsx` is also the controller layer for:

- sheet updates
- island progression updates
- breeding session reconciliation
- planner actions
- queue actions

## Core Model Relationship

- Sheets describe demand and progress.
- `breedingSessions` describe live execution state.
- Queue and planner data are derived projection layers built from sheets, island state, and sessions.

Current derivation flow:

- [`src/utils/queue.js`](../src/utils/queue.js) builds `To Breed` from active sheet demand.
- [`src/utils/queue.js`](../src/utils/queue.js) builds `Breeding Now` from live `breedingSessions`.
- [`src/utils/queue.js`](../src/utils/queue.js) builds Island Manager card data from active sheets, island resource state, and live sessions.

Source-of-truth rules:

- Sheets are the source of truth for tracked requirement totals and progress fields such as `required`, `zapped`, `breeding`, and `breedingAssignments`.
- `breedingSessions` are the source of truth for whether work is actively `breeding`, in `nursery`, or `completed`.
- Queue and planner helpers must stay projection-only. They should not become independent stored state.

## Sheet Types

Supported sheet types:

- `vessel`
- `island`

Notes:

- Vessel sheets drive active breeding demand.
- Common Wublins now use a shared-template vs tracked-instance model:
  - template identity lives on fields such as `systemKey`, `templateKey`, and `templateName`
  - each tracked run keeps its own unique `key`, `instanceNumber`, progress, activation state, and linked sessions
  - duplicate Wublin runs are created from the same sheet backbone, not a separate runtime system
- Island sheets track collection gaps for a specific island.
- Island sheets still use `zapped` and `breeding` internally, but the UI relabels them as collection-oriented terms such as `Collected` and `Planned`.

Current sheet seeding lives in [`src/data/sheets.js`](../src/data/sheets.js):

- Amber sheets remain single-instance defaults.
- Common Wublin sheets now seed one default instance per species and mark those sheets with `supportsMultipleInstances: true`.
- Additional Wublin runs are instantiated by cloning shared template fields into a fresh tracked sheet instance.

## Breeding Session Model

Normalized session statuses:

- `breeding`
- `nursery`
- `completed`

Current session ownership and flow:

- Session state lives in [`src/App.jsx`](../src/App.jsx).
- Assigned sessions are reconciled from sheet `breedingAssignments`.
- Manual sessions are stored with `sheetId: null`.
- `breeding` occupies breeder capacity.
- `nursery` occupies nursery capacity.
- `completed` occupies neither.

## Queue / Planner Layer

The queue/planner source of truth is [`src/utils/queue.js`](../src/utils/queue.js).

Current exported helper surface:

- `buildToBreedEntries`
- `buildBreedingQueue`
- `buildBreedingNowEntriesFromSessions`
- `buildIslandPlannerData`

Consumers:

- [`src/App.jsx`](../src/App.jsx)
- [`src/components/BreedingQueue.jsx`](../src/components/BreedingQueue.jsx)
- [`src/components/IslandPlanner.jsx`](../src/components/IslandPlanner.jsx)

## Persistence

Current localStorage keys:

- `msmTrackerSheets`
  - persisted sheet state
- `msmTrackerIslandState`
  - persisted island progression and capacity state
- `msmTrackerIslandSlots`
  - legacy migration input for island slot counts
- `msmTrackerBreedingSessions`
  - persisted breeding session state
- `msmTrackerView`
  - persisted current screen
- `collectionsData`
  - persisted collection-library state

Persistence behavior currently implemented in [`src/App.jsx`](../src/App.jsx):

- saved sheets merge back onto defaults
- sheets missing `type` normalize to `vessel`
- extra saved multi-instance vessel sheets that are not part of `TRACKER_SHEET_DEFAULTS` are preserved on load
- extra saved multi-instance vessel sheets are rebuilt from saved template/instance seed fields before saved progress is merged back in
- saved breeding sessions normalize legacy `hatching` to `nursery`
- assigned sessions reconcile against sheet `breedingAssignments`
- island state merges against `ISLAND_STATE_DEFAULTS`
- manual sessions may now carry lightweight recipe metadata such as parent pair, observed timer, and exact-vs-mystery resolution without creating a second execution system

## Android Wrapper Layer

- The repo now includes a Capacitor wrapper for Android packaging.
- Wrapper config lives in [`capacitor.config.json`](../capacitor.config.json).
- The generated native Android project lives in [`android`](../android).
- The Android wrapper still ships the same built Vite app from `dist`; it is not a second frontend or second state system.
- Current helper scripts in [`package.json`](../package.json):
  - `npm run android:doctor`
  - `npm run android:sync`
  - `npm run android:run`
  - `npm run android:open`
- Current app identity assumptions:
  - app name: `MSM Tracker`
  - app id: `com.jessealmo.msmtracker`
- Detailed packaging notes now live in [`docs/ANDROID.md`](./ANDROID.md).

## Data Pipeline Notes

Current committed staging flow:

- raw inbox input: [`data-entry/inbox.txt`](../data-entry/inbox.txt)
- raw inbox archive: [`data-entry/inboxArchive.md`](../data-entry/inboxArchive.md)
- general research parser: [`data-entry/parseInboxResearch.mjs`](../data-entry/parseInboxResearch.mjs)
- operational coverage audit: [`data-entry/auditOperationalBreedingCoverage.mjs`](../data-entry/auditOperationalBreedingCoverage.mjs)
- structured breeding/mechanics candidate output: [`data-entry/parsedBreedingData.json`](../data-entry/parsedBreedingData.json)
- human-readable mechanics reference: [`data-entry/gameMechanicsReference.md`](../data-entry/gameMechanicsReference.md)
- operational coverage reports: [`data-entry/operationalBreedingCoverage.json`](../data-entry/operationalBreedingCoverage.json) and [`data-entry/operationalBreedingCoverage.md`](../data-entry/operationalBreedingCoverage.md)
- common-Wublin parser: [`data-entry/parseCommonWublins.mjs`](../data-entry/parseCommonWublins.mjs)
- structured candidate output: [`data-entry/parsedWublinTemplates.json`](../data-entry/parsedWublinTemplates.json)

Current intended scope:

- `parseInboxResearch.mjs` is the broader mechanics/reference extraction path for noisy wiki dumps that include breeding rules, timer notes, and feature-planning research
- `npm run parse:inbox` runs the broader parser directly
- `npm run promote:breeding-data` runs [`data-entry/promoteParsedBreedingData.mjs`](../data-entry/promoteParsedBreedingData.mjs)
- `npm run audit:operational-data` runs [`data-entry/auditOperationalBreedingCoverage.mjs`](../data-entry/auditOperationalBreedingCoverage.mjs)
- `parseInboxResearch.mjs` now merges newly extracted facts and candidate rows into `parsedBreedingData.json` instead of replacing prior extracted knowledge
- `parseInboxResearch.mjs` archives processed raw page dumps into `data-entry/inboxArchive.md` and trims them out of `data-entry/inbox.txt`
- `parsedBreedingData.json` is now a cumulative structured candidate reference artifact that includes mechanics facts plus combo/time candidate rows
- `gameMechanicsReference.md` is the readable summary of extracted mechanics facts plus latest-run pipeline summary
- `operationalBreedingCoverage.*` now define the first explicit operational completeness target:
  - every monster currently referenced by the active requirement systems must have a runtime monster database entry
  - explicit breeding-island metadata must exist
  - runtime breeding data must include a standard breeding time through combo or time-only coverage
- `promoteParsedBreedingData.mjs` now generates [`src/data/breedingCombosImported.json`](../src/data/breedingCombosImported.json) as the runtime import layer for parsed combo/time data
- runtime combo helpers now read from a combined dataset in [`src/data/breedingCombos.js`](../src/data/breedingCombos.js):
  - hand-authored Natural baseline data
  - imported combo rows
  - imported unambiguous time-only rows
- promotion intentionally filters to monster names already known in [`src/data/monsterDatabase.js`](../src/data/monsterDatabase.js) and skips ambiguous time-only rows instead of guessing
- the common-Wublin parser is intentionally narrow and common-Wublin-only
- it extracts only relevant template fields such as species name, egg requirements, total eggs, and time limit
- it ignores lore, release dates, fill prices, long strategy prose, and Rare/Epic sections unless a future task explicitly expands scope

## Release Workflow Notes

- `npm run release:check` reads `package.json`, `CHANGELOG.md`, and the latest operational coverage audit to decide whether a real release is recommended.
- The current lightweight threshold policy is:
  - recommend release at 8 or more notable `Unreleased` bullets
  - or at 4 or more notable `Unreleased` bullets once operational completeness has been achieved
- `npm run release:prepare -- <version>` is the intentional version-cut step:
  - updates `package.json`
  - moves `CHANGELOG.md` `Unreleased` notes into a new dated version section
  - leaves build, commit, and push as explicit follow-up actions
- `npm run release:tag` is the formal release-checkpoint step after the release commit is built and pushed:
  - verifies `package.json` matches the latest released changelog version
  - requires a clean working tree
  - creates the annotated git tag if it does not exist yet
  - pushes `refs/tags/v<version>` to `origin`

## Recovery Notes

- Read [`NEXT_HANDOFF.md`](../NEXT_HANDOFF.md) before making structural changes.
- Trust the code on disk over prior chat summaries.
- Re-verify entrypoints and queue helper contracts before feature work.
- `TrackerSheet` is no longer meant to be primarily manual-counter driven. Its primary workflow is row-linked `Breed on...` plus contextual `Zap Ready`, reusing the same underlying App/session logic as queue and planner flows.
- Island Manager manual breeding now supports parent-pair entry with exact-result inference when combo data is sufficient, and falls back to `Mystery Egg` when it is not.
- Preserve exact `sheet.key` targeting for queue, planner, and session behavior even when multiple sheets share the same Wublin template.
- Update this file, [`docs/CONTRACTS.md`](./CONTRACTS.md), and [`docs/VERIFICATION.md`](./VERIFICATION.md) whenever architecture or helper contracts change.
