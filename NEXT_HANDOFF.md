# MSM Tracker – Next Handoff

## 0. Paste-Ready Handoff Templates

Keep the two templates below current whenever repo truth, workflow, architecture ownership, or major active priorities change. They are meant to be copied into a fresh chat with minimal editing.

### Support Chatbot Paste Template

```md
YOU ARE THE SUPPORT BOT IF YOU RECEIVE THIS PROMPT!
You are helping me think through changes for the MSM Tracker React + Vite app.

Your job:
- help me plan changes
- help me structure messy thoughts into clear implementation goals
- help me turn rough ideas into a clean prompt for Codex
- do not pretend to have repo access
- do not invent architecture or claim something exists unless I tell you

Repo truth you should assume unless I explicitly tell you otherwise:
- active app entrypoint is `src/main.jsx` -> `src/App.jsx`
- `src/App.jsx` is the only live app root
- sheets are the source of truth for tracked demand and progress
- `breedingSessions` are the source of truth for live execution state
- queue and planner are derived systems
- do not propose parallel state systems
- do not suggest architecture rewrites unless I explicitly ask for them
- this repo uses lightweight pre-1.0 versioning
- `CHANGELOG.md` uses versioned entries, not fake release spam

How to help me:
1. First restate what you think I want in simple terms.
2. If my idea is fuzzy, help break it into:
   - goal
   - constraints
   - affected files or systems
   - risks
   - smallest useful implementation
3. If relevant, warn me about ambiguity, hidden scope, or risky assumptions.
4. Then produce a clean Codex-ready prompt I can paste directly.

When writing the Codex prompt:
- tell Codex to read current source-of-truth files first
- keep the request grounded in existing architecture
- prefer minimal targeted changes
- require `npm run build` before closeout
- ask for files changed, why, and build status in the final answer

Do not over-engineer. Help me get to a clean, realistic prompt for the current app.
```

### New Codex Agent Paste Template

```md
You are continuing development of the MSM Tracker React + Vite app.

Before making changes, read these first in this order:
1. docs/CODEX_SYSTEM_PROMPT.md
2. NEXT_HANDOFF.md
3. docs/ARCHITECTURE.md
4. docs/CONTRACTS.md
5. docs/VERIFICATION.md
6. CHANGELOG.md
7. package.json

Core repo truth:
- active app entrypoint is `src/main.jsx` -> `src/App.jsx`
- `src/App.jsx` is the only live app root
- sheets are the source of truth
- `breedingSessions` are the live execution source of truth
- queue/planner are derived systems
- do not refactor architecture unless explicitly asked
- do not invent parallel state systems

Workflow rules:
- prefer direct file reads and current on-disk repo truth
- read target files and adjacent source-of-truth files before editing
- make minimal targeted changes
- update docs only when necessary
- update `package.json` version intentionally, not casually
- keep `CHANGELOG.md` in versioned format with concise `Added` / `Changed` / `Fixed` notes when a notable pass should be recorded
- run `npm run build` before closing out

Final response should include:
1. files changed
2. what changed
3. any important assumptions or limits
4. confirmation that `npm run build` passed
```

## Read Me First / Recovery Notes

- Active entrypoint is `src/main.jsx` -> `src/App.jsx`
- Standing repo workflow guide for future Codex sessions: `docs/CODEX_SYSTEM_PROMPT.md`
- `src/App.jsx` is the only live app root
- Git version control is now part of the normal repo workflow
- Queue/planner source of truth is `src/utils/queue.js`
- Vessel feasibility estimation source of truth is `src/utils/vesselFeasibility.js`
- Active Sheets is now a top-level screen for fast access to active goals only
- TrackerSheet monster cards now use row-linked `Breed on...` and contextual `Zap Ready` actions as the primary workflow
- Manual sheet counters are still present, but only as fallback controls
- Vessel feasibility on the sheet page is now a compact timing snapshot, not a large estimator panel
- Island Manager demand projection should fan out shared sheet rows onto all valid breeding islands while keeping one shared remaining count underneath
- Island Manager now treats special islands with explicit operational capability metadata, so non-breeding islands no longer report fake breeder/nursery capacity
- Wublin tracking now supports shared common-species templates plus separate tracked instances, so `Zynth #1`, `Zynth #2`, etc. can coexist without sharing progress or sessions
- `src/data/sheets.js` is now the template/instance seed source for common Wublins, and duplicate instances are created from the existing sheet backbone rather than a second tracking system
- `data-entry/parseCommonWublins.mjs` and `data-entry/parsedWublinTemplates.json` now exist for common-Wublin-only inbox normalization
- `data-entry/auditOperationalBreedingCoverage.mjs` now defines the first explicit “complete in one operational way” target for breeding data and writes reports to `data-entry/operationalBreedingCoverage.json` and `data-entry/operationalBreedingCoverage.md`
- `npm run release:check`, `npm run release:prepare -- <version>`, and `npm run release:tag` now provide a lightweight intentional release workflow tied to changelog state, the latest operational coverage audit, and a matching annotated git tag
- The repo now has a first Android wrapper path using Capacitor:
  - config in `capacitor.config.json`
  - native project in `android/`
  - helper doc in `docs/ANDROID.md`
  - helper scripts in `package.json`
- Collections now has a second-level vessel family filter and renders Wublins as species-first common-template cards with instance details nested underneath
- First step before new feature work should be integrity verification, not feature work
- Trust code on disk over prior chat summaries
- Prefer direct file reads over shell gymnastics during repo-audit passes
- Avoid repeated `cmd.exe /c` nesting unless it is truly necessary
- Do not spend time on `git` or history checks unless explicitly asked
- If a tool or environment limitation exists, state it briefly and move on
- Avoid noisy command experimentation when direct reads already answer the question
- Before edits: read target files, read adjacent source-of-truth files, make minimal changes, run `npm run build`, then report files changed and why
- `package.json` version should be updated intentionally, not for every tiny pass
- `CHANGELOG.md` now uses versioned entries and should log notable work under `Added`, `Changed`, and `Fixed`
- Some issue notes below are historical; verify current code before acting on them
- Vessel deadline estimation is currently read-only and input-driven; shop timers and active vessel timers are not yet persisted in app state
- Current Android status on this machine:
  - `npm run android:doctor` passes
  - `npm run android:sync` passes
  - native debug build currently fails because no Android SDK location is configured

## 1. Current architecture

- `src/App.jsx`
  - Main state owner and view router.
  - Non-home screen surfaces are now lazy-loaded with `React.lazy` + `Suspense` so the first bundle does not eagerly include every major screen.
  - Controls the top-level screens:
    - Dashboard (`home`)
    - Active Sheets (`active`)
    - Collections (`collections`)
    - Breeding Queue (`queue`)
    - Island Manager (`planner`)
    - Monster Library (`directory`)
    - TrackerSheet (`sheet`)
  - Owns the main persisted state:
    - sheets
    - collections data
    - island state
    - breeding sessions
    - current view

- Dashboard
  - Summary-first landing screen.
  - Shows:
    - active sheet summary
    - island collection completion summary
    - breeder/nursery availability
    - queue highlights
    - quick navigation into Collections / Queue / Island Manager
  - It is no longer intended to be the main collection browser.

- Collections
  - Implemented in `src/pages/Collections.jsx`.
  - This is the browsing surface for tracked goals.
  - Has two top-level tabs:
    - Vessels
    - Islands
  - Uses the shared sheet system rather than separate collection-specific state.

- Breeding Queue
  - Implemented in `src/components/BreedingQueue.jsx`.
  - Intended to show:
    - `To Breed`
    - `Breeding Now`
  - `Breeding Now` is split visually into:
    - assigned
    - unassigned
    - in nursery

- Island Manager
  - Implemented in `src/components/IslandPlanner.jsx`.
  - Action-focused surface for operational work:
    - assign breeding on specific islands
    - manual breeding creation
    - breeder/nursery progression
    - breeder-side and nursery-side session actions
  - Region tabs:
    - Natural
    - Fire
    - Magical
    - Ethereal
    - Mirror
    - Other

- Monster Library
  - Implemented through `src/components/MonsterDirectory.jsx`.
  - Read-only reference layer.
  - Not part of the core execution flow.
  - Default browse order now prefers practical priority over raw alphabetic order:
    - requirement-used monsters first
    - common before rare before epic
    - fewer-element monsters before denser monsters
    - alphabetical only as a final tie-breaker

- TrackerSheet
  - Implemented in `src/components/TrackerSheet.jsx`.
  - Shared sheet renderer for both vessel sheets and island sheets.
  - The same base monster-row structure is reused, but labels differ by sheet type.

- Data layer
  - `src/data/sheets.js`
    - defines vessel sheet defaults, island sheet defaults, and the shared-template/per-instance Wublin seed model
  - `src/data/islands.js`
    - defines island groups and default island progression state
  - `src/data/monsterDatabase.js`
    - monster reference database
  - `src/data/breedingCombos.js`
    - dedicated runtime breeding combo source file
    - now merges the hand-authored Natural baseline with generated imports from `src/data/breedingCombosImported.json`
  - `src/data/collections.js`
    - collection/library content
  - `data-entry/inbox.txt`
    - raw staging area for noisy source material before production data updates
- `data-entry/parseInboxResearch.mjs`
  - broader parser for noisy mechanics and breeding-rule dumps
- `data-entry/promoteParsedBreedingData.mjs`
  - promotion step from parsed candidate breeding data into runtime import data
- `data-entry/auditOperationalBreedingCoverage.mjs`
  - audit step that checks current requirement-scope monsters for runtime database coverage, breedability metadata, and runtime breeding-time coverage
- `data-entry/parsedBreedingData.json`
  - cumulative structured candidate mechanics/reference output from the general inbox parser
- `src/data/breedingCombosImported.json`
  - generated runtime import layer for reviewed parsed combo and time data
- `data-entry/gameMechanicsReference.md`
  - human-readable summary of extracted mechanics, timer rules, latest-run extraction counts, and future inbox guidance
- `data-entry/inboxArchive.md`
  - archive of processed raw page dumps that have been trimmed out of the live inbox
- `data-entry/operationalBreedingCoverage.json`
  - machine-readable operational completeness report for current requirement monsters
- `data-entry/operationalBreedingCoverage.md`
  - human-readable operational completeness report
  - `data-entry/parseCommonWublins.mjs`
    - common-Wublin-only parser that ignores rare/epic/lore noise
  - `data-entry/parsedWublinTemplates.json`
    - structured candidate output for common Wublin template ingestion

- Queue / session layer
  - Intended source is `src/utils/queue.js`
  - Also relies on `src/utils/monsterMetadata.js` for breeding-island resolution and assignment helpers
  - Session lifecycle is coordinated from `src/App.jsx`

- Persistence / localStorage
  - Sheets persist in localStorage and are merged with defaults on load
  - Island state persists separately
  - Breeding sessions persist separately
  - View state persists separately
  - Collections data also persists separately

- Android wrapper layer
  - `capacitor.config.json` points Capacitor at the built Vite output in `dist`
  - `android/` is now the generated native wrapper project
  - this wrapper does not change app state architecture; it packages the same app

## 2. Sheet system

- Supported sheet types:
  - `vessel`
  - `island`

- Vessel sheets
  - Existing Amber/vessel workflow.
  - Built from requirement data in `src/data/sheets.js` and `src/data/monsterRequirements.js`.
  - Wublins now use a template-vs-instance model:
    - template identity is shared at the species level
    - tracked instances keep distinct `key` values and distinct progress/session linkage
  - Current common-Wublin defaults seed one starting instance per species and allow additional instances to be created from the UI.
  - Progress meaning:
    - `zapped` = actual fulfilled progress
    - `breeding` = tracked / reserved progress still in pipeline
  - Completion meaning:
    - sheet is complete when all monster rows satisfy `zapped >= required`
    - or when `isCollected` is true

- Island sheets
  - Newer collection-tracking sheet type.
  - Each island sheet tracks collection needs for one island.
  - Progress meaning in UI:
    - `zapped` is relabeled to `Collected`
    - `breeding` is relabeled to `Planned`
  - Completion meaning:
    - current implementation still uses the same underlying numeric rule as vessel sheets
    - practically this means island sheet completion is based on all rows reaching collected progress
    - `TrackerSheet.jsx` presents this as collection completion rather than vessel completion

- Migration behavior
  - In `src/App.jsx`, old saved sheets without a `type` are normalized to `type: "vessel"`.
  - Saved monster rows are merged onto default sheet rows by monster name.
  - `breedingAssignments` are normalized and trimmed to current breeding totals.
  - Saved extra vessel instances that are not in `TRACKER_SHEET_DEFAULTS` are now preserved on load instead of being dropped.
  - Saved multi-instance vessel sheets are rebuilt from their saved seed/template metadata before progress is merged back in.

- Active / inactive behavior
  - Both sheet types support `isActive`.
  - Active vessel sheets feed urgent work into queue/planner.
  - Active island sheets feed collection work into Island Manager / Collections summaries.
  - Activation prompt differs by type:
    - vessel prompt talks about starting vessel egg tracking
    - island prompt talks about tracking missing island monsters

## 3. Breeding session system

- Session state lives in `src/App.jsx` as `breedingSessions`.
- Current normalized statuses:
  - `breeding`
  - `nursery`
  - `completed`

- Session shape currently includes:
  - `id`
  - `monsterId`
  - `islandId`
  - `source`
    - `assigned`
    - `manual`
  - `sheetId`
    - `null` for unassigned/manual work
  - `status`
  - `createdAt`

- Status meanings
  - `breeding`
    - occupies a breeder
  - `nursery`
    - occupies a nursery
  - `completed`
    - no longer occupies anything

- Assigned vs unassigned/manual
  - Assigned sessions are tied to a sheet via `sheetId`
  - Manual sessions are created with `sheetId: null`
  - Assigned sessions are reconciled from sheet `breedingAssignments`
  - Manual sessions persist directly

- Assign + Zap flow
  - Intended for unassigned/manual breeding sessions.
  - Current intended flow:
    1. resolve the chosen target sheet
    2. resolve the target monster row inside that sheet by the session monster name
    3. increment that row’s `zapped`
    4. only then complete the session
  - This was recently hardened to avoid completing the session before row update succeeds.
  - There is dev logging around this path in `src/App.jsx`.

- Assign existing breeding flow
  - Used when an unassigned breeding session should become a tracked assigned session without zapping.
  - If the target sheet is inactive, the UI offers `Activate and Assign`.

- To Nursery
  - Moves a session from `breeding` to `nursery`
  - Frees breeder occupancy
  - Consumes nursery occupancy
  - Does not increment zap progress

- Hatch
  - Available from nursery-side sessions
  - Moves session to `completed`
  - Frees nursery occupancy
  - Does not count as zapping

- Occupancy rules
  - Breeders count only sessions with `status === "breeding"`
  - Nurseries count only sessions with `status === "nursery"`
  - Completed sessions count for neither

## 4. Island Manager behavior

- Implemented in `src/components/IslandPlanner.jsx`
- Region-tabbed layout using `ISLAND_GROUPS`
- On narrow/mobile widths, the region filter now collapses to a single `Region` select so the top of the page is not consumed by stacked full-width region buttons
- Island Manager now includes a context-aware `Jump to island` row derived from the currently visible islands after region + availability filtering
- Jumping scrolls to the target card and briefly highlights it without narrowing the list or changing filters
- Each island card currently shows:
  - island name
  - locked/unlocked state
  - breeder summary
  - nursery summary
  - compact capacity summary with `Max Capacity` and `Capacity Settings`
  - `Need Now`
  - `Collection Missing`
  - `Currently Breeding`
  - `In Nursery`
  - on-demand `+ Manual Breed`

- `Need Now`
  - Intended to show vessel-priority demand from active vessel sheets

- `Collection Missing`
  - Intended to show missing monsters from active island collection sheets for that island

- `Currently Breeding`
  - Breeder-side sessions only

- `In Nursery`
  - Nursery-side sessions only

- Manual Breed
  - On-demand panel on an island card
  - Supports both direct-add fallback and parent-pair entry
  - Uses monster list filtered by `getMonsterBreedingIslands(monsterName).includes(island)`
  - Parent-pair dropdowns now use practical priority sorting instead of raw alphabetical order
  - Epic monsters are now excluded from parent-pair dropdowns because they are not valid breeding parents
  - Parent-pair entry resolves an exact result only when current combo data supports one candidate for that island and optional observed timer
  - Falls back to `Mystery Egg` when the result cannot be resolved honestly
  - Creates a manual `breeding` session if the island has free breeder capacity

- Upgrade controls
  - Card-local confirmation state
  - Supports:
    - unlock island
    - `+ Breeder`
    - `+ Nursery`
    - `Max Capacity`
  - Revert actions now live inside `Capacity Settings` and require a second click confirmation
  - Confirmation UI is intentionally separated from planner actions
  - Old `window.confirm` island progression flow was removed in favor of local card confirmation

- What is working well
  - Region-tab grouping exists
  - Region scope now stays available on mobile without consuming the full first screenful
  - Availability filters stay quick-access on mobile instead of collapsing into one long vertical stack
  - Jump-to-island navigation now respects the current top-down filter truth instead of creating a second scope system
  - Manual Breed UI is isolated per card without permanently bloating the header
  - Upgrade confirmation is locally scoped instead of colliding with planner actions
  - Breeder and nursery capacities are both visible on the card

- What is still rough
  - There is likely drift between the intended planner/session system and the current helper layer in `src/utils/queue.js`
  - Because of that, Island Manager data shaping should be re-verified before any new feature pass
- Some parts of the UI are more mature than the underlying helper consolidation
- Availability filter wording is now clearer:
  - `Breedable` = at least one breeder slot open
  - `Nursery Free` = at least one nursery slot open
  - `Capacity Limited` = breeder or nursery capacity is currently full

## 5. Collections page behavior

- Implemented in `src/pages/Collections.jsx`
- Tabs:
  - Vessels
  - Islands

- Vessel grouping
  - Amber
  - Wublin
  - Celestial
  - Other

- Island grouping
  - Natural
  - Fire
  - Magical
  - Ethereal
  - Mirror Islands
  - Other

- Status model
  - Derived, not stored
  - Current statuses:
    - `active`
    - `in_progress`
    - `not_started`
    - `complete`

- Sorting
  - Within each section:
    1. active
    2. in_progress
    3. not_started
    4. complete
  - Alphabetical inside each bucket

- Filters
  - All
  - Active
  - In Progress
  - Not Started
  - Complete
  - Vessels also now have a second-level family filter:
    - All
    - Amber
    - Wublin
    - Celestial
    - Other

- Legacy collected/completed logic
  - Useful older “push finished items downward” behavior did exist conceptually in prior summary screens.
  - That intent is now folded into the explicit derived status + sort system in `src/pages/Collections.jsx`.
  - There is not a separate competing stored completion flag beyond existing `isCollected` / progress rules.

- Scanability
  - Better than earlier versions because active and in-progress cards are visually distinct
  - Completed cards are visually calmer and pushed downward
  - Common Wublins now browse as species-first cards instead of leading with raw `#1` / `#2` labels
  - Amber and Wublins both now lean on `priority` for ordering inside the derived status buckets

## 6. Combo data

- Combo data file
  - `src/data/breedingCombos.js`
  - current runtime export path:
    - `BREEDING_COMBOS_NATURAL`
    - `BREEDING_COMBOS_IMPORTED`
    - `BREEDING_TIME_ONLY_IMPORTED`
    - `BREEDING_COMBOS_ALL`

- Helper layer
  - `src/utils/breedingCombos.js`
  - current helpers:
    - `getBreedingComboByMonsterName`
    - `getBreedableIslandsForMonster`
    - `getBestBreedingCombos`

- Current imported coverage
  - Hand-authored Natural baseline still exists and remains authoritative for existing Natural rows
  - Runtime helper coverage is now broader because `BREEDING_COMBOS_ALL` also includes generated imported combo rows and generated unambiguous time-only rows
  - Latest successful promotion counts:
    - 109 imported combo rows
    - 255 imported time-only rows
    - 51 parsed time names still skipped because they are not yet modeled in `src/data/monsterDatabase.js`
    - 6 time-only rows still intentionally skipped because parsed times conflict
  - Imported runtime coverage currently includes many additional:
    - Fire monsters
    - Magical monsters
    - Ethereal monsters
    - Mythical monsters
    - Seasonal monsters
    - some Rare timing rows for monsters already present in the runtime monster database
  - Time-only imported rows intentionally provide breeding-time lookup even when exact combo data is still unresolved
  - The current operational completeness target is satisfied even though 6 current requirement monsters are still time-only rather than exact-combo complete

- Missing categories
  - Full Rare runtime database coverage
  - Full Epic runtime database coverage
  - Any parsed rows whose monster names do not yet exist in `src/data/monsterDatabase.js`
  - Ambiguous time-only rows with conflicting parsed times
  - Any non-Natural monsters still absent from the current parsed import output
  - Recently fixed runtime-name gaps:
    - `bbli$zard` now exists in the runtime monster database and can promote parsed timing data
    - `Rare Congle` and `Epic Congle` now match their real monster names instead of the old `Congole` typo

- Manual Breed consumption
  - `src/components/IslandPlanner.jsx` looks up combo data after monster selection
  - If found, it shows inline:
    - combinations
    - breedableOn islands
    - breeding time
    - enhanced breeding time
    - notes

- Fallback behavior
  - If no combo data exists, the UI shows a graceful “No combo data yet” style fallback rather than crashing
  - `src/components/MonsterDirectory.jsx` now also falls back to imported combo data when the static `monster.combo` field is blank

## 7. Persistence and migration

- `msmTrackerSheets`
  - Saved sheet state
  - Merged back onto defaults on load
  - Missing `type` migrates to `vessel`

- `msmTrackerIslandState`
  - Saved island progression state
  - Merged with `ISLAND_STATE_DEFAULTS`

- `msmTrackerIslandSlots`
  - Legacy slot-count storage
  - Still used as migration input by `mergeIslandStates(...)`

- `msmTrackerBreedingSessions`
  - Saved breeding session state
  - Old `hatching` status normalizes to `nursery`
  - Sessions are reconciled against sheets so assigned sessions stay in sync with `breedingAssignments`

- `msmTrackerView`
  - Saved current screen/view

- `collectionsData`
  - Saved collection library state
  - Merged with `COLLECTIONS` defaults on load

## 8. Known issues / rough edges

- `src/main.jsx` imports `src/App.jsx`
- future passes should continue treating `src/App.jsx` as the only live app entry

- Island sheet progress still reuses vessel-ish numeric fields under the hood.
  - The UI relabels them honestly as collected/planned
  - but the underlying field names are still `zapped` and `breeding`
  - this is functional, but conceptually messy

- Combo coverage is incomplete.
  - Production combo timing data is still heavily Natural-only
  - Manual Breed, Monster Directory timing, and the vessel estimator will hit fallback behavior for many Wublin requirements
  - Requirement-scope operational completeness is now satisfied, but exact combo completeness is not:
    - 6 current requirement monsters are still time-only complete rather than exact-combo complete
    - the broader parsed backlog still includes 51 time names that are not yet modeled in `src/data/monsterDatabase.js`

- Wublin support is intentionally common-first.
  - Common Wublin template requirements now exist
  - Rare/Epic Wublin handling is still future work and should not be inferred from common data

- The Wublin parser is intentionally narrow.
  - `data-entry/parseCommonWublins.mjs` only extracts common-Wublin template fields from noisy inbox input
  - it deliberately ignores lore, prices, dates, and Rare/Epic sections

- The general inbox research parser is now broader.
  - `data-entry/parseInboxResearch.mjs` extracts high-value breeding mechanics, Rare/Epic rules, timer notes, and future inbox guidance
- `data-entry/parsedBreedingData.json` is now structured candidate mechanics/reference output rather than an empty placeholder
- `data-entry/gameMechanicsReference.md` is the human-readable summary of those extracted facts
- `npm run parse:inbox` now runs the broader research pipeline end to end
- `parseInboxResearch.mjs` now merges extracted mechanics facts, combo candidates, and breeding-time candidates into `parsedBreedingData.json`
- `parseInboxResearch.mjs` archives processed raw page dumps into `data-entry/inboxArchive.md` and trims them out of `data-entry/inbox.txt`
- `npm run promote:breeding-data` now turns reviewed parsed combo/time candidates into `src/data/breedingCombosImported.json`
- `promoteParsedBreedingData.mjs` filters to monsters already known in `src/data/monsterDatabase.js`, canonicalizes name casing, and skips ambiguous time-only rows instead of guessing
- `npm run audit:operational-data` now checks whether current requirement-scope monsters are operationally complete:
  - runtime monster database entry exists
  - explicit breeding-island metadata exists
  - runtime breeding data includes a standard breeding time through combo coverage or time-only coverage
- Latest audit status on disk:
  - 76 unique requirement monsters
  - 76/76 operationally complete
  - 70 with combo+time coverage
  - 6 with time-only coverage
  - 0 blocking operational gaps
- `npm run release:check` now recommends a real release when:
  - `Unreleased` reaches 8 notable bullets
  - or `Unreleased` reaches 4 notable bullets after operational completeness is achieved
- Latest intentional release on disk:
  - version `0.2.0`
  - git tag `v0.2.0`
  - the next release should follow: `npm run release:check` -> `npm run release:prepare -- <version>` -> `npm run build` -> commit/push -> `npm run release:tag`

- Collection-level summary counts intentionally aggregate multi-instance Wublin sheets by shared template identity.
  - This avoids duplicate Wublin instances inflating collection-completion summaries
  - per-instance operational work still appears separately in Active Sheets, Collections cards, queue, planner, and sheet screens

- Some prior summary statements from earlier coding passes do not fully match the current on-disk code.
  - The next pass should trust the files on disk, not prior chat summaries

- Android packaging is set up, but this machine still lacks a configured Android SDK path.
  - `gradlew.bat assembleDebug` currently fails with `SDK location not found`
  - the next real mobile step is Android Studio/SDK setup plus a device install test

## 9. Most recent successful changes

- Added a first Android wrapper path using Capacitor, including repo scripts, config, generated native Android project scaffolding, and a dedicated `docs/ANDROID.md` guide for finishing debug APK generation once the Android SDK is configured.
- Added a broader inbox research parser that extracts high-value breeding mechanics, Rare/Epic rules, timer-disambiguation notes, and feature-planning guidance into `data-entry/parsedBreedingData.json`.
- Added `data-entry/gameMechanicsReference.md` as the readable mechanics reference generated from the inbox, including what future inbox dumps should contain and what noise to avoid.
- Expanded the inbox research pipeline so it now extracts structured combo candidates and grouped breeding-time candidates, preserves cumulative parsed output across runs, archives processed raw page dumps, and automatically trims `data-entry/inbox.txt`.
- Added a runtime promotion step that turns reviewed parsed breeding combo/time candidates into `src/data/breedingCombosImported.json`, broadening helper coverage beyond the hand-authored Natural baseline while filtering out unknown names and ambiguous time-only rows.
- Added an operational breeding coverage audit plus machine-readable and human-readable reports so the repo now has one explicit completeness target for current requirement-scope monsters.
- Added a lightweight release workflow with `npm run release:check` and `npm run release:prepare -- <version>`, tied to changelog volume and the latest operational coverage audit.
- Updated a few runtime imports to use explicit module paths or JSON import attributes so Node-based repo tooling can safely read the same source modules the app uses.
- Updated Monster Directory so blank static combo fields now fall back to imported breeding combo data when available.
- Added `src/utils/monsterPriority.js` so Monster Directory and Island Manager manual breeding can share the same practical ordering rules.
- Switched Monster Directory’s default sort to a priority-first browse mode that favors requirement-used monsters, common before rare before epic, and lower-element monsters before denser ones.
- Reordered Island Manager manual-breed parent pickers by the same practical priority rules and removed Epic monsters from parent-pair dropdowns because they are not valid breeding parents.
- Added real runtime monster coverage for `bbli$zard` and fixed the `Rare/Epic Congole` typo to `Rare/Epic Congle`, which reduced skipped parsed time rows on the next promotion pass.
- Lazy-loaded the major non-home screen surfaces from `src/App.jsx` (`Active Sheets`, `Collections`, `Tracker Sheet`, `Breeding Queue`, `Island Manager`, and `Monster Library`) so bundle growth is less front-loaded as the app and data keep expanding.
- Reworked Island Manager capacity controls so breeder/nursery counts stay visible while upgrades collapse behind a lower-emphasis `Capacity Settings` panel.
- Added a compact `Max Capacity` action for standard breeding islands and moved manual breeding into an on-demand panel instead of a permanently large header block.
- Added manual breed parent-pair entry with exact-result inference when combo data supports it, plus a truthful `Mystery Egg` fallback when it does not.

- Added Active Sheets as a top-level operational screen
- Shifted TrackerSheet toward linked `Breed on...` and `Zap Ready` actions instead of manual counter-first interaction
- Repaired Island Manager shared-demand projection so one underlying row can appear on all eligible island cards without multiplying real demand
- Added a compact read-only vessel timing snapshot instead of a large noisy feasibility panel
- Added common-Wublin requirement data and common-Wublin tracker defaults
- Added a shared-template vs tracked-instance Wublin model so duplicate Wublin runs can coexist with separate progress and session linkage
- Added a `Create Another` workflow for multi-instance Wublin sheets from Collections and sheet view
- Added a common-Wublin-only inbox parser plus structured parser output in `data-entry/`

## 10. Recommended next priorities

1. Finish the first real Android device install path
   - install/configure Android Studio or Android SDK
   - make `gradlew.bat assembleDebug` succeed
   - install the debug APK on a real Android device
   - then stress-test persistence, scroll behavior, touch targets, and Android back-button behavior

2. Keep the release ritual consistent for the next real version
   - start with `npm run release:check`
   - if a release is warranted, use:
     - `npm run release:prepare -- <version>`
     - `npm run build`
     - commit
     - push
     - `npm run release:tag`

3. Expand runtime monster coverage for the remaining parsed names that still cannot promote
   - Current promotion output still reports 51 parsed time names that do not exist in `src/data/monsterDatabase.js`
   - This is now a higher-value path than more parser work because the pipeline is already finding usable data
   - Better runtime coverage immediately improves Monster Directory, Manual Breed inference, and future recipe/event work

4. Upgrade the six time-only requirement monsters to exact combo coverage when clean source data exists
   - `Kayna`
   - `Noggin`
   - `Toe Jammer`
   - `Mammott`
   - `Tweedle`
   - `Potbelly`
   - This is now a quality pass rather than a blocking operational gap

5. Continue Wublin common-data verification before broadening scope
   - Treat `data-entry/inbox.txt` plus `parseCommonWublins.mjs` as the common-Wublin ingestion path
   - Keep Rare/Epic Wublins out of the production dataset until they are intentionally supported

6. Re-verify multi-instance Wublin UX with real saved state
   - Check duplicate-instance activation, reset, queue projection, planner projection, and assigned-session flows end to end

7. Decide whether Active Sheets or Collections should gain any additional multi-instance affordances
   - only if needed after real use
   - avoid inventing a second Wublin execution path

8. Revisit internal naming for island-sheet `zapped` / `breeding` only if the change can be done safely
   - not urgent while current behavior remains correct

## 11. Guardrails for the next pass

- Do not break sheet persistence or saved progress migration
- Do not remove the current sheet-type model:
  - `vessel`
  - `island`
- Do not collapse duplicate Wublin runs back into one species-level progress bucket
- Do not make `templateKey` a replacement for exact `sheet.key` targeting in queue/planner/session logic
- Do not break breeding session normalization:
  - `breeding`
  - `nursery`
  - `completed`
- Do not reintroduce umbrella island labels like `Natural` as actual breeding-island values
- Do not break local card-level upgrade confirmation in Island Manager
- Do not replace the shared sheet backbone just because island sheets and vessel sheets differ semantically
- Do not recreate a second app root outside `src/App.jsx`
- Verify helper imports/exports before building new queue/planner features

## 12. Build status

- Latest known status from the most recent successful pass: `npm run build` passed
- Next pass should still re-run build early and treat that as a verification step, not an assumption

## 13. Session closeout rule

- For implementation sessions, close out with:
  - `npm run build`
  - `CHANGELOG.md` update
  - `NEXT_HANDOFF.md` and docs updates if repo truth, workflow, or contracts changed
- Use analysis-only closeout only when the task explicitly says no runtime or repo changes.
