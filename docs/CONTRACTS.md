# MSM Tracker Contracts

This document records the current helper and data contracts used by the queue and planner. Update it whenever signatures, entry shapes, or consumers change.

## Warning

Do not change helper signatures or entry shapes without updating:

- all consumers
- this document
- [`docs/ARCHITECTURE.md`](./ARCHITECTURE.md)
- [`docs/VERIFICATION.md`](./VERIFICATION.md)

## Supported Types

Sheet types:

- `vessel`
- `island`

Normalized session statuses:

- `breeding`
- `nursery`
- `completed`

## Required Sheet Fields

Queue and planner helpers currently rely on these sheet fields:

- `key`
- `type`
- `status`
- `isActive`
- `activatedAt`
- `priority`
- `sheetTitle`
- `sheetIndex` when already indexed by the caller; otherwise the helper may assign one
- `monsters`

Additional vessel fields now used by the app shell for multi-instance workflows:

- `systemKey`
- `templateKey`
- `templateName`
- `instanceNumber`
- `supportsMultipleInstances`
- `displayName`

Notes:

- `templateKey` groups shared species-template identity for multi-instance Wublin sheets.
- Exact queue/planner/session targeting must still use the concrete tracked `key`, plus `sheetIndex`/`monsterIndex` where applicable.

Required monster row fields used by helpers:

- `name`
- `required`
- `zapped`
- `breeding`
- `island`

## Required Breeding Session Fields

Queue and planner helpers currently rely on these breeding session fields:

- `id`
- `monsterId`
- `islandId`
- `source`
- `sheetId`
- `status`

`createdAt` is part of the normalized session shape in [`src/App.jsx`](../src/App.jsx), but the queue/planner helpers do not currently use it directly.

## `buildToBreedEntries(sheets)`

Purpose:

- Derive active tracked demand from sheets.

Inputs:

- `sheets`: app sheet array. The helper internally filters to sheets where:
  - `status === "ACTIVE"`
  - `isActive === true`

Derived meaning:

- Builds entries for unmet tracked demand where `required - zapped - breeding > 0`.
- Uses sheet demand, not live session state.

Current output shape per entry:

- `id`
- `name`
- `island`
- `islands`
- `validBreedingIslands`
- `sheetKey`
- `sheetTitle`
- `sheetPriority`
- `activatedOrder`
- `sheetIndex`
- `monsterIndex`
- `required`
- `zapped`
- `breeding`
- `actualRemaining`
- `queueRemaining`
- `remaining`

Current derivation details:

- `actualRemaining = max(0, required - zapped)`
- `queueRemaining = max(0, required - zapped - breeding)`
- `remaining` is currently the same value as `queueRemaining`
- `islands` comes from `getMonsterBreedingIslands(monster.name)` and falls back to the preferred island when necessary
- rows from duplicate Wublin instances remain separate because entries keep the concrete tracked `sheetKey`

## `buildBreedingQueue(sheets)`

Purpose:

- Current compatibility wrapper for queue demand generation.

Current behavior:

- Returns `buildToBreedEntries(sheets)` directly.

Output shape:

- Same as `buildToBreedEntries(sheets)`.

## `buildBreedingNowEntriesFromSessions(breedingSessions, sheets)`

Purpose:

- Derive live breeding runtime entries from real sessions.

Inputs:

- `breedingSessions`: session array
- `sheets`: sheet array used for sheet lookup and target-sheet metadata enrichment

Grouping behavior:

- Excludes sessions where `status === "completed"`
- Groups remaining sessions by:
  - `status`
  - `sheetId` or `"unassigned"`
  - `islandId`
  - `monsterId`

Assigned/manual/nursery representation:

- Assigned entries have `sheetKey` / `sheetTitle` from the matched sheet.
- Manual or unassigned entries have:
  - `sheetKey: null`
  - `sheetTitle: "Unassigned"`
- Nursery entries keep `status: "nursery"`.
- Breeding entries keep `status: "breeding"`.

Additional lookup behavior for unassigned entries:

- `matchingSheets` includes sheets where the monster still has tracked `queueRemaining > 0`
- `zapTargets` includes active sheets where the monster still has `actualRemaining > 0`

Current output shape per grouped entry:

- `id`
- `name`
- `island`
- `source`
- `status`
- `sheetKey`
- `sheetTitle`
- `sheetPriority`
- `activatedOrder`
- `sheetIndex`
- `monsterIndex`
- `required`
- `zapped`
- `actualRemaining`
- `queueRemaining`
- `count`
- `breeding`
- `sessionIds`
- `matchingSheets`
- `zapTargets`

Notes:

- `count` is the number of grouped sessions in that bucket.
- `breeding` is also incremented per grouped session and currently matches `count`.
- `sheetIndex` is preserved from incoming indexed sheets when available.

## `buildIslandPlannerData(indexedActiveSheets, islandStates, breedingSessions)`

Purpose:

- Derive Island Manager card data from active sheets, island resource state, and live sessions.

Inputs:

- `indexedActiveSheets`
  - caller currently passes active sheets already decorated with stable `sheetIndex`
- `islandStates`
  - current island progression and capacity state
- `breedingSessions`
  - live breeding runtime state

Exact derivation rules:

- `Need Now`
  - built from active sheets whose `type !== "island"`
  - only includes monster rows where `queueRemaining > 0`
  - each shared sheet row is projected onto every valid breeding island from `getMonsterBreedingIslands(monster.name)`
  - planner projection must skip islands that do not support the standard breeding loop
- `Collection Missing`
  - built from active sheets whose `type === "island"`
  - only includes monster rows where `queueRemaining > 0`
  - uses the same shared-demand projection rule as `Need Now`
- `Currently Breeding`
  - built from grouped session entries with `status !== "nursery"` after completed sessions are excluded upstream
  - given the current normalized status model, this means live `breeding` sessions
- `In Nursery`
  - built from grouped session entries where `status === "nursery"`

Island capability notes:

- Island Manager availability and capacity should come from explicit island operational metadata, not from assuming every island has breeders and nurseries.
- Special islands may still render in Island Manager, but unsupported islands must not advertise fake open breeder or nursery capacity.

Current planner output shape per island card:

- `island`
- `group`
- `type`
- `isMirror`
- `isUnlocked`
- `supportsStandardBreeding`
- `supportsNursery`
- `capabilityTags`
- `operationalNote`
- `breedingStructures`
- `maxBreedingStructures`
- `nurseries`
- `maxNurseries`
- `occupiedSlots`
- `nurseryOccupancy`
- `freeSlots`
- `freeNurseries`
- `needNow`
- `collectionMissing`
- `currentlyBreeding`
- `nurserySessions`
- `orderIndex`

Entry shapes inside planner arrays:

- `needNow`
  - uses `buildToBreedEntries`-style item shape
  - `item.island` is the rendered island card for that projection
  - `queueRemaining` and `actualRemaining` stay shared across all projected copies of the same source row
- `collectionMissing`
  - uses `buildToBreedEntries`-style item shape
  - `item.island` is the rendered island card for that projection
  - `queueRemaining` and `actualRemaining` stay shared across all projected copies of the same source row
- `currentlyBreeding`
  - uses `buildBreedingNowEntriesFromSessions` grouped session shape
- `nurserySessions`
  - uses `buildBreedingNowEntriesFromSessions` grouped session shape

## `buildVesselFeasibilityEstimate({ sheet, islandStates, breedingSessions, deadlineHoursRemaining })`

Purpose:

- Derive a read-only feasibility estimate for a vessel sheet using current tracked remaining work, unlocked breeder capacity, and whatever breeding-time coverage exists in project data.

Inputs:

- `sheet`
  - current vessel sheet object
- `islandStates`
  - island progression and breeder-capacity state
- `breedingSessions`
  - live session array used to detect active breeder blockers already assigned to the vessel
- `deadlineHoursRemaining`
  - optional numeric input for active vessel hours remaining

Current derivation rules:

- Only available for non-`island` sheets
- Remaining work uses `max(0, required - zapped - breeding)` per monster row
- Timing coverage currently comes only from `BREEDING_COMBOS_NATURAL`
- Standard breeding times are used; enhanced breeding times are not assumed
- Active vessel breeder blockers only include sessions where:
  - `status === "breeding"`
  - `sheetId === sheet.key`
- Breeder capacity comes from unlocked islands and their `breedingStructures`
- Covered active sessions preload island slot load
- Active sessions with unknown durations reduce usable slot count conservatively on their island
- Remaining covered eggs are greedily scheduled onto the earliest-free eligible breeder slot across their valid breeding islands
- Nursery timing is not included
- Shop timers and active vessel deadlines are not stored in app state; deadline comparison uses the provided hours input only

Current output shape:

- `sheetId`
- `sheetName`
- `totalRemainingEggs`
- `coveredRemainingEggs`
- `uncoveredMonsters`
- `coverageRatio`
- `estimateMode`
  - `exact`
  - `partial`
  - `insufficient_data`
- `breederOnlyEstimateHours`
- `bottleneckIslands`
- `assumedBreederCapacities`
- `activeSessionCredits`
- `deadlineHoursRemaining`
- `feasible`
- `marginHours`
- `confidenceNotes`
- `failureMeaning`
- `blockedByCapacityMonsters`

Required additional sheet fields used by this helper:

- `sheetTitle`
- `monsterName`

Required additional breeding session fields used by this helper:

- `createdAt` is still not required
- only `monsterId`, `islandId`, `sheetId`, and `status` are read

Notes:

- This helper is intentionally truth-constrained and should prefer `partial` or `insufficient_data` over guessed precision
- Do not change this helper signature or output shape without updating all consumers and this document

Sheet index integrity:

- `buildIslandPlannerData(...)` preserves incoming `sheetIndex` values on indexed active sheets.
- Planner actions in [`src/App.jsx`](../src/App.jsx) depend on `item.sheetIndex` and `item.monsterIndex` remaining aligned to the full `sheets` array.
- Multi-instance Wublin sheets must not be collapsed by `templateKey` inside queue or planner action payloads; `templateKey` is for shared template identity only.

## Sheet Screen Interaction Notes

- `TrackerSheet` primary `Breed on...` actions should keep using the existing row-linked breeding update flow in [`src/App.jsx`](../src/App.jsx), not a separate sheet-only state path.
- `TrackerSheet` contextual `Zap Ready` actions should only appear when real linked breeder-side sessions exist for that sheet row, and should reuse the existing assigned-session zap flow.
- Manual sheet counters remain fallback UI only. They should not become the primary execution path again unless the task explicitly changes workflow behavior.

## Multi-Instance Wublin Notes

- Common Wublin sheets now support duplicate tracked instances from one shared species template.
- Instance creation currently reuses `createTrackerSheetInstanceFromSeed(...)` in [`src/data/sheets.js`](../src/data/sheets.js).
- New instances must:
  - receive a unique tracked `key`
  - preserve shared template metadata
  - keep separate progress and activation state
  - keep separate queue, planner, and breeding-session linkage
- Reset and load flows in [`src/App.jsx`](../src/App.jsx) must rebuild multi-instance sheets from template seed data instead of assuming every sheet exists in the static defaults array.

## Current Consumers

- [`src/App.jsx`](../src/App.jsx)
  - imports `buildBreedingQueue` and `buildIslandPlannerData`
- [`src/components/BreedingQueue.jsx`](../src/components/BreedingQueue.jsx)
  - imports `buildBreedingQueue` and `buildBreedingNowEntriesFromSessions`
- [`src/components/IslandPlanner.jsx`](../src/components/IslandPlanner.jsx)
  - consumes planner data shape from `buildIslandPlannerData(...)`
