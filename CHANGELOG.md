# Development Rules

1. Every meaningful change (logic, structure, features, bug fixes) must be logged.

2. Before diagnosing bugs or adding new features:
   - Check the CHANGELOG for recent related changes.
   - Assume recent changes may have introduced the issue.

3. When debugging:
   - Identify the last change that touched the affected system.
   - Use the log to trace where logic may have shifted.

4. Do NOT make new changes without understanding recent logged changes.

5. If behavior changes unexpectedly:
   - First step is reviewing the CHANGELOG before editing code.

6. After completing any meaningful code change:
   - Pause and decide if the change affects logic, structure, or behavior.
   - If yes, immediately add an entry to this CHANGELOG before continuing further work.
   - Do not stack multiple unlogged changes.

---

# Change Log

## [2026-04-05] Repo Audit Workflow Guidance Tightening

### Files Affected
- docs/CODEX_SYSTEM_PROMPT.md
- NEXT_HANDOFF.md
- CHANGELOG.md

### Purpose
Tighten the repo-audit workflow guidance so future passes stay calm, direct, and grounded in current on-disk file truth instead of shell-heavy exploration.

### Changes
- Added explicit guidance to prefer direct file reads over shell gymnastics during audit and recovery work
- Added guidance to avoid repeated `cmd.exe /c` nesting and to skip `git` or history checks unless explicitly requested
- Added a short default pre-edit workflow covering target-file reads, adjacent source-of-truth reads, minimal edits, build verification, and change reporting
- Reinforced the handoff notes to treat `src/main.jsx` -> `src/App.jsx` as the live app root unless on-disk files prove otherwise

### Notes
- Documentation-only pass
- No runtime behavior changed

## [2026-04-05] App Entrypoint Documentation Cleanup

### Files Affected
- src/main.jsx
- docs/CODEX_SYSTEM_PROMPT.md
- NEXT_HANDOFF.md
- docs/ARCHITECTURE.md
- docs/VERIFICATION.md
- CHANGELOG.md

### Purpose
Clean up outdated root-App deprecation language now that `src/App.jsx` is the only app root on disk.

### Changes
- Removed stale documentation references to deprecated or trap-style root App files
- Clarified across docs that `src/main.jsx` imports `src/App.jsx` as the only app entrypoint
- Added a small entrypoint comment in `src/main.jsx`

### Notes
- Documentation-only plus comment cleanup
- No runtime logic changed

## [2026-04-05] Occupancy Reconciliation + Root App Cleanup + Wublin Quick Activate

### Files Affected
- src/App.jsx
- src/pages/Collections.jsx
- App.jsx
- docs/CODEX_SYSTEM_PROMPT.md
- NEXT_HANDOFF.md
- docs/ARCHITECTURE.md
- docs/VERIFICATION.md
- CHANGELOG.md

### Purpose
Tighten live breeder occupancy around the existing `breedingSessions` source of truth, remove the deprecated root app entry footgun, and make not-started Wublin instances faster to activate from Collections.

### Changes
- Tightened breeding-session normalization so live occupancy only survives on islands that still support the relevant breeder or nursery capability
- Dropped non-completed assigned sessions that no longer carry a valid `sheetId`
- Added direct `Activate` actions for not-started Wublin instances in Collections by reusing the existing sheet activation handler
- Neutralized the deprecated root-level `App.jsx` into an explicit trap so future work can no longer silently target the wrong app root
- Updated docs and verification guidance to reflect that `src/App.jsx` is now the only app root

### Notes
- Island Manager occupancy still derives from live `breedingSessions`, not from duplicated island slot state
- `activatedAt` ordering and Wublin instance identity were preserved
- Queue `Zap Run` / `Breed Run` behavior was left intact

## [2026-04-05] Island Manager All Regions Filter

### Files Affected
- src/components/IslandPlanner.jsx
- CHANGELOG.md

### Purpose
Complete the Island Manager stacked filtering workflow by allowing all regions to be viewed together while still applying the existing availability filters.

### Changes
- Added `All Regions` at the start of the top filter row
- Made `All Regions` the default region filter state
- Updated region filtering so availability filters can apply across every region when `All Regions` is selected
- Clarified the helper text to show the combined filter state directly

### Notes
- Availability filter behavior was preserved
- No state architecture or planner derivation contracts changed

## [2026-04-05] Island Manager Capability + Capacity Revert Refinement

### Files Affected
- src/data/islands.js
- src/utils/queue.js
- src/App.jsx
- src/components/IslandPlanner.jsx
- NEXT_HANDOFF.md
- docs/CONTRACTS.md
- docs/VERIFICATION.md
- CHANGELOG.md

### Purpose
Make Island Manager reflect real island operational capabilities instead of forcing every island through the same breeder/nursery model, while adding a safe way to undo accidental capacity upgrades.

### Changes
- Added lightweight island operational metadata so special islands can report truthful capabilities and notes
- Normalized special islands like Wublin Island, Magical Nexus, Gold, Tribal, Composer, Colossingum, Ethereal Workshop, and Amber Island to stop carrying fake breeder/nursery capacity
- Updated planner derivation so `Need Now` only projects onto islands that actually support standard breeding
- Added small capacity revert controls for breeder and nursery counts, blocked safely by live occupancy
- Clarified Island Manager filter stacking with a live region-plus-availability summary and renamed `Busy` to `Constrained`

### Notes
- No new persistence keys were introduced
- Wublin instance identity, activation ordering, queue flow, and breeding-session linkage were preserved
- The earlier Congle/Shugabush issue remains an explicit metadata problem, not element-based inference

## [2026-04-05] Wublin Instance Display Cleanup + Congle Metadata Fix

### Files Affected
- src/App.jsx
- src/pages/Collections.jsx
- src/data/monsterDatabase.js
- CHANGELOG.md

### Purpose
Clean up Wublin instance naming in visible UI contexts without touching the underlying template-instance model, and fix a false-positive Congle breeding-island mapping that was leaking into queue, planner, and sheet breeding actions.

### Changes
- Hid Wublin numeric suffixes in visible list contexts when only one instance of that species is currently shown
- Preserved all underlying sheet identity, `sheet.key`, persistence, and instance numbering
- Removed `Shugabush Island` from Congle's explicit `breedableOn` metadata entry

### Notes
- The Congle issue was caused by stale explicit monster metadata, not by element-based island inference
- Queue, planner, and sheet breedability still resolve from explicit metadata through `getMonsterBreedingIslands(...)`

## [2026-04-05] Breeding Queue Zap Run + Breed Run Pass

### Files Affected
- src/components/BreedingQueue.jsx
- src/utils/queue.js
- src/App.jsx
- docs/CONTRACTS.md
- docs/VERIFICATION.md
- CHANGELOG.md

### Purpose
Rework the Breeding Queue around the actual two-pass player workflow so queue actions can be run in order: zap breeder-side tracked eggs first, then refill open breeders from currently actionable tracked demand.

### Changes
- Replaced the older mixed `To Breed` / `Breeding Now` queue tabs with `Zap Run` and `Breed Run`
- Added direct queue-side `Breed` actions that reuse the existing planner breeding handler instead of sending the user back to Island Manager first
- Kept direct queue-side `Zap` actions tied to the existing assigned-session zap flow
- Sorted both queue modes by island progression first and activation order second
- Added helper-side `sheetPriority` and `activatedOrder` fields to grouped session entries so operational queue ordering stays stable and truth-based

### Notes
- No new persistence was added
- No queue or planner execution system was duplicated
- Unassigned breeder eggs and nursery eggs remain part of live runtime state, but the queue page now centers the player’s two main tracked-demand passes

## [2026-04-04] Collections Family Filter + Wublin Presentation Refinement

### Files Affected
- src/pages/Collections.jsx
- CHANGELOG.md

### Purpose
Make the Collections page easier to scan by adding stronger vessel-family filtering, restoring priority-aware ordering, and presenting common Wublins as species-first collection cards while preserving the existing template-plus-instance architecture underneath.

### Changes
- Added a second-level vessel-family filter for `All`, `Amber`, `Wublin`, `Celestial`, and `Other`
- Updated Collections ordering to use derived operational status first and sheet `priority` before alphabetical fallback
- Reworked the Wublin section into common-Wublin, species-first cards with tracked instances nested as secondary metadata
- Reduced raw instance-number emphasis by moving `Instance N` into compact secondary rows instead of the main card title
- Added clearer `Create New Instance` wording for the Wublin creation flow from Collections
- Adjusted completed-state styling so finished items feel more muted and stay visually below active work

### Notes
- No queue/planner/session linkage changed
- No Wublin persistence or template-instance architecture changed
- Rare and Epic Wublin presentation is still intentionally out of scope for this pass

## [2026-04-04] Wublin Template + Instance Support Pass

### Files Affected
- src/App.jsx
- src/data/sheets.js
- src/data/monsterRequirements.js
- src/pages/Collections.jsx
- data-entry/parseCommonWublins.mjs
- data-entry/parsedWublinTemplates.json
- NEXT_HANDOFF.md
- docs/ARCHITECTURE.md
- docs/CONTRACTS.md
- docs/VERIFICATION.md
- docs/CODEX_SYSTEM_PROMPT.md
- CHANGELOG.md

### Purpose
Add common-Wublin tracking support that can represent multiple tracked instances of the same Wublin species while keeping sheet-row demand linkage, queue/planner derivation, and breeding-session behavior aligned with the existing architecture.

### Changes
- Added common-Wublin requirement data and common-Wublin tracker sheet defaults
- Added a shared-template vs tracked-instance Wublin model in `src/data/sheets.js`
- Preserved extra saved multi-instance sheets on load and reset by rebuilding them from saved seed/template metadata
- Added a simple `Create Another` workflow for multi-instance Wublin sheets from Collections and sheet view
- Added a focused common-Wublin inbox parser and generated structured parser output
- Updated docs and verification guidance to describe the new Wublin template/instance model and common-only data-ingestion scope

### Notes
- Queue/planner runtime remains derived from concrete tracked sheet rows
- Duplicate Wublin instances remain separate by exact sheet identity
- Common Wublin support is the intended scope of this pass; Rare/Epic Wublins remain future work
- No intended localStorage key changes
- No intended queue/planner helper signature changes

## [2026-04-04] Sheet Workflow + Navigation Cleanup

### Files Affected
- src/App.jsx
- src/components/TrackerSheet.jsx
- src/components/SheetMonsterCard.jsx
- src/pages/ActiveSheets.jsx
- NEXT_HANDOFF.md
- docs/ARCHITECTURE.md
- docs/CONTRACTS.md
- docs/VERIFICATION.md
- CHANGELOG.md

### Purpose
Make active sheets faster to reach and make sheet monster cards use the existing linked breeding and zapping workflow more directly, without creating a parallel execution system or changing persistence behavior.

### Changes
- Added `Active Sheets` as a top-level navigation destination for active goals only
- Reworked sheet monster cards so `Breed on...` and contextual `Zap Ready` become the primary actions
- Kept sheet-card breeding tied to the existing row-linked breeding assignment flow already used by planner actions
- Kept sheet-card zapping tied to the existing assigned-session zap flow for the exact sheet row
- Demoted manual counter controls into fallback UI instead of the primary workflow
- Replaced the large vessel feasibility panel with a compact read-only timing snapshot

### Notes
- No queue/planner helper signatures changed
- No intended persistence format changes
- Manual counters remain available as fallback for incomplete data or edge cases

## [2026-04-04] Island Manager Shared Demand Projection Fix

### Files Affected
- src/utils/queue.js
- docs/CONTRACTS.md
- docs/VERIFICATION.md
- NEXT_HANDOFF.md
- CHANGELOG.md

### Purpose
Repair Island Manager demand projection so one shared sheet requirement can appear on every valid breeding island card without multiplying the true underlying demand or disturbing queue and session behavior.

### Changes
- Updated `buildIslandPlannerData(...)` to project shared demand rows onto all valid breeding islands instead of collapsing them to one preferred island
- Kept planner action targeting tied to the same shared `sheetIndex` and `monsterIndex` source row
- Documented the updated planner projection rule and verification checks

### Notes
- Shared remaining demand still comes from the single underlying sheet row
- Queue demand generation and breeding session grouping were left intact
- No intended persistence format changes

## [2026-04-04] Codex Workflow Hardening Pass

### Files Affected
- docs/CODEX_SYSTEM_PROMPT.md
- NEXT_HANDOFF.md
- CHANGELOG.md

### Purpose
Create a persistent repo-specific Codex operating guide so future sessions can recover the active architecture, workflow, and source-of-truth rules without changing runtime behavior.

### Changes
- Created `docs/CODEX_SYSTEM_PROMPT.md`
- Added a minimal pointer to the new guide near the top of `NEXT_HANDOFF.md`
- Documented repo-specific workflow, verification expectations, and future data-entry guidance for Codex passes

### Notes
- Documentation-only pass
- No intended runtime behavior changes

## [2026-04-04] Monster Directory Breeding Time Display

### Files Affected
- src/components/MonsterDirectory.jsx
- src/utils/breedingCombos.js
- CHANGELOG.md

### Purpose
Surface breeding time on Monster Directory cards using the current project combo dataset, without changing any queue, planner, or sheet behavior.

### Changes
- Added a tiny helper to expose breeding time metadata from `src/utils/breedingCombos.js`
- Added a compact read-only breeding-time line to Monster Directory cards
- Kept missing-data presentation explicit with a `—` fallback when no combo timing exists

### Notes
- Current breeding-time coverage still depends on the existing dataset and is incomplete
- No intended runtime behavior changes outside the Monster Directory display

## [2026-04-04] Vessel Feasibility Estimator Pass

### Files Affected
- src/utils/vesselFeasibility.js
- src/components/TrackerSheet.jsx
- src/App.jsx
- docs/CONTRACTS.md
- NEXT_HANDOFF.md
- CHANGELOG.md

### Purpose
Add a minimal, truth-constrained vessel feasibility estimator for Amber-style vessel sheets without disturbing queue, planner, persistence, or session behavior.

### Changes
- Added `buildVesselFeasibilityEstimate(...)` in `src/utils/vesselFeasibility.js`
- Added a small read-only `Vessel Feasibility` panel to `TrackerSheet` for vessel sheets
- Passed `islandStates` and `breedingSessions` into `TrackerSheet` from `App.jsx`
- Documented the new helper contract in `docs/CONTRACTS.md`
- Added a brief recovery note about the estimator to `NEXT_HANDOFF.md`

### Notes
- Estimate uses current sheet progress plus current unlocked breeder capacity
- Estimate uses project breeding-time data only where coverage exists
- Enhanced breeding is not assumed because enhancement state is not tracked
- Nursery timing is not modeled because nursery timers are not stored
- Vessel deadlines are not persisted; deadline comparison currently uses user-provided hours only
- No intended queue/planner behavior changes
- No intended persistence behavior changes

## [2026-04-04] Documentation + Recovery Hardening Pass

### Files Affected
- docs/ARCHITECTURE.md
- docs/CONTRACTS.md
- docs/VERIFICATION.md
- NEXT_HANDOFF.md
- CHANGELOG.md

### Purpose
Create durable recovery documentation so future passes can re-establish the active architecture, queue contracts, and verification workflow quickly without changing runtime behavior.

### Changes
- Created `docs/ARCHITECTURE.md`
- Created `docs/CONTRACTS.md`
- Created `docs/VERIFICATION.md`
- Added a short recovery-notes section near the top of `NEXT_HANDOFF.md`
- Logged the current active entrypoint, stale root `App.jsx` status, queue/planner helper surface, persistence ownership, and verification checklist

### Notes
- This was a documentation and integrity-hardening pass only
- No intended runtime behavior changes
- No persistence behavior changes

## [2026-04-03] Island Progression + Capacity System

### Files Affected
- src/data/islands.js
- src/App.jsx
- src/components/IslandPlanner.jsx
- src/utils/queue.js
- CHANGELOG.md

### Purpose
Turn the Island Planner into a true island management layer by tracking island unlock state, breeding structures, nurseries, and breeding capacity on top of the existing planner flow.

### Changes
- Added persistent island state defaults for core requirement islands
- Added unlock tracking, breeding structure counts, and nursery counts per island
- Updated planner data generation to merge existing island planning data with island resource state
- Enforced breeding capacity in the Island Planner using `breedingStructures` as the slot limit
- Added per-island controls for lock or unlock, breeding structures, and nurseries

### Notes
- Existing Need Now, Currently Breeding, +Breeding, +Zapped, queue logic, and sheet integration were preserved
- Locked islands are still shown, but dimmed and non-breedable
- Legacy island slot-count storage is safely migrated into the new island state where possible

## [2026-04-03] Amber Tracker Activation Flow

### Files Affected
- src/App.jsx
- CHANGELOG.md

### Purpose
Make starting a Common Amber tracker a deliberate action by separating activation from simple sheet navigation.

### Changes
- Changed the inactive Common tracker action label from `Start Quest` to `Activate`
- Added confirmation before activating an inactive linked sheet
- Reused the existing sheet activation behavior to mark the sheet active and then navigate directly to it
- Kept `Continue Quest` and `View Tracker` behavior for already active or collected sheets

### Notes
- Activation only happens after confirmation
- Already active sheets still open directly without prompting
- Filtering, ordering, collection gating, and localStorage schema were unchanged

## [2026-04-03] Amber Rarity Library Expansion + Quest Labels

### Files Affected
- src/data/collections.js
- src/App.jsx
- CHANGELOG.md

### Purpose
Expand the Amber Island collection page to include full collection-only rarity coverage while keeping Common monsters as the main tracker workflow.

### Changes
- Expanded `amber_island` entries to include Common, Rare, Epic, and Special entries
- Kept tracker sheet linking limited to Common entries only
- Updated Common tracker actions from generic sheet wording to quest-style labels:
  - `Start Quest` for inactive linked sheets
  - `Continue Quest` for active linked sheets
  - `View Tracker` for collected linked sheets
- Added passive `Collection only` messaging for non-tracker rarity entries

### Notes
- Collected gating still depends on linked Common tracker sheets being active and complete
- Rarity filtering, localStorage merging, and inline tracker status were preserved
- Viveine, Rare Viveine, and Epic Viveine were treated as Special collection entries in this step

## [2026-04-03] Amber Collection Completion Gating

### Files Affected
- src/App.jsx
- CHANGELOG.md

### Purpose
Replace the free collected toggle on the Amber collection page with a sheet-driven completion lifecycle tied to tracker progress.

### Changes
- Removed direct collected toggling from Amber collection cards
- Added readiness gating so Amber entries can only be marked collected when their linked sheet is active and fully completed
- Added `Mark Collected` action for ready entries and a disabled completion hint for active but incomplete entries
- Reordered collection cards so collected entries move to the bottom while preserving source order among the remaining cards
- Styled collected cards with a dimmed greyed-out treatment and retained a clear collected badge

### Notes
- Ready state is detected from the linked sheet being active plus `isSheetComplete(sheet)`
- Sheet navigation and progress logic were preserved
- Collection rarity filtering continues to work on the reordered list

## [2026-04-03] Amber Tracker Sheet Expansion

### Files Affected
- src/data/sheets.js
- CHANGELOG.md

### Purpose
Expand the set of trackable Amber sheets using the reusable tracker sheet factory and imported Amber requirement data.

### Changes
- Added factory-generated Amber tracker sheet defaults for the explicitly provided trackable targets
- Kept Boskus and Ziggurab as the existing working examples without duplicating them
- Appended the new generated sheets through `AMBER_TRACKER_SHEET_DEFAULTS` into `TRACKER_SHEET_DEFAULTS`
- Used safe empty `lanes` arrays for new sheets where no lane plan was provided

### Notes
- Existing Boskus and Ziggurab keys and saved progress compatibility were preserved
- New sheets use requirement data from `monsterRequirements.js`
- Queue, planner, and collection logic were left unchanged

## [2026-04-03] Tracker Sheet Factory Template

### Files Affected
- src/data/sheets.js
- src/App.jsx
- CHANGELOG.md

### Purpose
Refactor tracker sheet defaults into a reusable factory so future Amber sheets can be added from requirement data without hand-authoring full sheet objects.

### Changes
- Added `createTrackerSheet(...)` in `src/data/sheets.js`
- Moved Boskus and Ziggurab to factory-generated sheet definitions
- Added `TRACKER_SHEET_DEFAULTS` as the generated default sheet list consumed by `App.jsx`
- Kept `monsters` generation tied to `createSheetMonstersFromRequirements(...)`

### Notes
- Generated sheets preserve the existing app-compatible shape, including stable `key` values
- LocalStorage compatibility was preserved for existing Boskus and Ziggurab saved progress
- Queue, planner, and sheet views continue to use the same merged sheet model

## [2026-04-03] Collection Cards Inline Sheet Tracking

### Files Affected
- src/App.jsx
- CHANGELOG.md

### Purpose
Reduce duplication on collection pages by moving linked sheet context directly into each monster card instead of showing a separate linked sheets list.

### Changes
- Integrated linked sheet lookup into each collection entry card by matching `sheet.monsterName === entry.name`
- Added inline sheet status, tracked progress, zapped progress, remaining count, and `Open Sheet` action when a linked sheet exists
- Added `No tracker yet` messaging when a collection entry has no linked sheet
- Removed the separate `LINKED SHEETS` UI section from collection pages

### Notes
- Sheet data, storage, queue logic, and planner logic were not changed
- Collection cards now act as the single collection-plus-tracking view for each monster

## [2026-04-03] Amber Collection Entry Merge Fix

### Files Affected
- src/App.jsx
- CHANGELOG.md

### Purpose
Fix Amber Island collection pages so new default collection entries still appear even when older saved collection data exists in localStorage.

### Changes
- Added collection state merging against `COLLECTIONS` defaults during load
- Preserved saved per-entry state like `collected` while restoring missing default entries
- Kept linked sheets behavior unchanged

### Notes
- This specifically fixes cases where `amber_island.entries` stayed empty from older saved data
- The Amber collection page now renders both the collection library and linked sheets sections

## [2026-04-03] Amber Spreadsheet Requirements Import

### Files Affected
- src/data/monsterRequirements.js
- src/data/collections.js
- CHANGELOG.md

### Purpose
Use the Amber Island tracking spreadsheet as the source of truth for Amber target monsters and their requirement lists.

### Changes
- Replaced the Amber requirement data with spreadsheet-derived target requirement lists
- Populated the Amber Island collection entries from the spreadsheet target columns in source order
- Normalized spreadsheet name mismatches to existing monster keys for `Bridg-It`, `PomPom`, and `Bisonorus`
- Left non-Amber systems unchanged

### Notes
- Only target monster names plus requirement rows were extracted
- Missing metadata was not inferred
- Amber collection entries are now active and backed by spreadsheet data

## [2026-04-03] Read-Only Monster Metadata Integration

### Files Affected
- src/components/BreedingQueue.jsx
- src/components/TrackerSheet.jsx
- src/components/IslandPlanner.jsx
- src/utils/monsterMetadata.js
- CHANGELOG.md

### Purpose
Connect the monster metadata database to the queue, planner, and tracker views as a read-only enrichment layer without changing any progress or breeding behavior.

### Changes
- Added a shared metadata lookup helper backed by `MONSTER_DIRECTORY`
- Enriched breeding queue rows with element chips, combo text, and optional category text
- Enriched tracker sheet monster cards with element chips and combo text
- Enriched island planner monster cards with element chips and combo text
- Kept all existing zapped, breeding, queue, and planner state logic unchanged

### Notes
- Missing metadata is handled safely by omitting the extra UI fields
- Metadata lookups are name-based and read-only
- This improves browseability and planning context without touching tracker progress behavior

## [2026-04-03] Monster Directory Category Filter Normalization

### Files Affected
- src/components/MonsterDirectory.jsx
- CHANGELOG.md

### Purpose
Make Monster Directory category filters reliable by matching normalized internal category keys instead of depending on raw values or display formatting.

### Changes
- Added a category normalization helper that trims and lowercases category values safely
- Refactored category filter options to use `{ key, label }` objects
- Updated category filtering to compare normalized keys only
- Kept user-facing button labels formatted and readable

### Notes
- Existing database category values were already normalized, so no category data changes were needed
- Search, element filters, advanced filters, and sorting behavior were preserved

## [2026-04-03] Monster Directory Filter Simplification + Element Chips

### Files Affected
- src/components/MonsterDirectory.jsx
- CHANGELOG.md

### Purpose
Reduce visual overload in the Monster Directory while keeping the full filtering toolset available for audits and adding clearer element-based scanability.

### Changes
- Kept search, category filters, and core element filters visible by default
- Moved sort, metadata audit, and requirement usage filters into a collapsible Advanced Filters section
- Split element filters into core elements and special or event elements, with special elements hidden behind their own toggle
- Added a centralized `ELEMENT_COLORS` map and applied muted colors to element chips in both the filter controls and monster cards
- Kept existing filter behavior intact, including multi-select any-match element filtering

### Notes
- The default view now emphasizes quick search and common filtering first
- Element colors are limited to chips only and fall back to a neutral style when unmapped
- This is a UI-only refinement and does not change the data model or planner behavior

## [2026-04-03] Monster Directory Browsing Filters

### Files Affected
- src/components/MonsterDirectory.jsx
- CHANGELOG.md

### Purpose
Make the Monster Directory much easier to search, filter, sort, and audit when working through large monster lists.

### Changes
- Added case-insensitive search by monster name, with alias matching when aliases exist
- Added click-to-toggle element filters using any-match logic across known database elements
- Expanded metadata audit filters for missing elements, combo, notes, description, complete, and needs-details views
- Added requirement usage filters for Amber, Wublin, Celestial, and Unused entries
- Added sort controls for A-Z, needs-details-first, and complete-first ordering
- Kept the existing directory data source and card layout behavior intact

### Notes
- Search is now the primary browsing control at the top of the page
- Element filters are multi-select and match any selected element
- This is a UI-only refinement and does not change monster data or queue logic

## [2026-04-03] Monsters Article Category + Element Enrichment

### Files Affected
- src/data/monsterDatabase.js
- CHANGELOG.md

### Purpose
Improve Monster Directory completeness by backfilling high-confidence category and element data from the Monsters reference article.

### Changes
- Added explicit element arrays to existing monster records when the article clearly listed them
- Reclassified monsters from generic `natural` to more specific categories such as `fire`, `magical`, `ethereal`, `seasonal`, `mythical`, `celestial`, `dipster`, `titansoul`, and others where clearly supported
- Left Supernatural and other ambiguous cases unchanged when the article did not cleanly map to the current database style
- Preserved the existing export structure and app compatibility

### Notes
- No new monsters were created and no existing monsters were deleted
- Ambiguous or unmatched names were skipped instead of guessed
- This change improves in-app Monster Directory quality without changing queue or planner behavior

## [2026-04-03] Core Monster Metadata Enrichment

### Files Affected
- src/data/monsterDatabase.js
- CHANGELOG.md

### Purpose
Improve the Monster Directory data quality for the monsters the app actively uses in sheets, the breeding queue, and the island planner.

### Changes
- Enriched the 22 core app monsters listed in `monsterDataRequests.txt`
- Added high-confidence `elements`, `description`, `class`, and `combo` data for those entries
- Added known aliases where they were clearly established
- Left uncertain fields unchanged instead of inventing data

### Notes
- This was limited to core app monsters only
- Existing queue, planner, and sheet behavior were not changed
- Export compatibility for `MONSTER_DIRECTORY` and `MONSTER_DATABASE` was preserved

## [2026-04-03] Monster Database Cleanup + Changelog Move

### Files Affected
- src/data/monsterDatabase.js
- CHANGELOG.md

### Purpose
Clean up high-confidence spreadsheet import issues and standardize the project changelog at the repository root.

### Changes
- Corrected high-confidence monster naming inconsistencies for `Kazilleon` and `Rare Kazilleon`
- Aligned obvious Amber categories for Boskus and Ziggurab variants
- Preserved the expanded monster directory structure and export compatibility
- Moved the changelog to the project root as `CHANGELOG.md`
- Stopped using the old `src/utils/logs/CHANGELOG.md` path

### Notes
- No low-confidence metadata was invented
- Queue, planner, and tracker behavior were left unchanged

## [2026-04-03] Spreadsheet Monster Directory Import

### Files Affected
- src/data/monsterDatabase.js

### Purpose
Expand the in-app monster directory by importing monster-to-island coverage from the spreadsheet export while preserving the existing database export structure.

### Changes
- Rebuilt `MONSTER_DIRECTORY` from the spreadsheet `Monsters` sheet
- Preserved the existing `MONSTER_DIRECTORY` / `MONSTER_DATABASE` export compatibility
- Reused existing IDs, categories, combos, and notes where entries already existed
- Defaulted unknown categories to `natural` and left unsupported fields empty instead of inventing data
- Normalized spreadsheet naming issues such as `Miror Plant Island` to `Mirror Plant Island`

### Notes
- The import excludes spreadsheet summary rows like `Total`
- This is a data refresh only; queue, planner, and tracker logic were not rewritten

## [2026-04-03] Monster Directory Page

### Files Affected
- src/App.jsx
- src/components/MonsterDirectory.jsx

### Purpose
Add an in-app directory page for monster metadata so missing details are easier to audit without leaving the tracker flow.

### Changes
- Added a new Monster Directory navigation button and screen in App.jsx
- Added a read-only directory component that lists every monster from `monsterDatabase.js`
- Added status badges, missing-field summaries, requirement usage labels, and filters for `All`, `Needs Details`, `Complete`, and category views
- Sorted monsters so incomplete entries appear first, then complete entries, alphabetically within each group

### Notes
- Completion requires `id`, `name`, `category`, and at least one `breedableOn` island
- `notes` are displayed but are not required for completion

## [2026-04-03] Requirement Model Extraction

### Files Affected
- src/data/monsterRequirements.js
- src/data/sheets.js

### Purpose
Separate target requirement lists from monster metadata so future directory and search features can use a cleaner data model.

### Changes
- Added grouped `MONSTER_REQUIREMENTS` structure with `amber`, `wublin`, `celestial`, `wubbox`, and `statue`
- Moved Boskus and Ziggurab Amber Island egg requirements into `monsterRequirements.js`
- Added helper exports for reading requirement lists and converting them into sheet monster rows
- Updated `sheets.js` to build Boskus and Ziggurab defaults from requirement data while preserving the existing sheet shape

### Notes
- Queue, planner, and sheet logic still receive the same `monsters` array shape as before
- `monsterDatabase.js` remains the canonical monster metadata source


\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
## [2026-04-02] Initial System Setup + Queue Implementation

### Files Affected
- src/App.jsx
- src/components/TrackerSheet.jsx
- src/components/BreedingQueue.jsx
- src/data/monsterDatabase.js
- src/data/sheets.js
- src/utils/queue.js

### Purpose
Build the core MSM tracker system with queue-based planning and interaction.

### Changes
- Created modular structure (components, data, utils)
- Implemented TrackerSheet for managing monster progress
- Implemented BreedingQueue for merged task view
- Added MONSTER_DATABASE for monster metadata (combos, islands)
- Added sheet defaults (Boskus + Ziggurab)
- Extracted queue logic into utils/queue.js
- Implemented updateMonster system for shared state updates
- Added queue action buttons (+ Breeding, + Zapped)
- Added target tracking system (sheetIndex + monsterIndex)

### Notes
- Queue dynamically rebuilds on every state update
- Targets + breakdown arrays must stay aligned
- System now functions as both tracker and control panel

\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
## [2026-04-02] Queue Targeting Stabilization Fix

### Files Affected
- src/components/BreedingQueue.jsx

### Purpose
Fix inconsistent behavior where queue actions applied to multiple or shifting targets.

### Changes
- Replaced "apply to all targets" logic with single-target selection
- Implemented selection based on highest `needed` value
- Ensured only one monster updates per click
- Prevented updates when no remaining needed

### Notes
- Target selection now stable and predictable
- Eliminates jumping between sheets during interaction
- Future improvement: allow manual per-sheet targeting


\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
## [2026-04-02] Reset System + Safety Controls

### Files Affected
- src/App.jsx

### Purpose
Add safe reset functionality for each sheet to prevent permanent mistakes during tracking.

### Changes
- Added `resetBoskus` function with confirmation prompt
- Added `resetZiggurab` function with confirmation prompt
- Cleared corresponding localStorage entries on reset
- Added conditional reset buttons shown per active tab

### Notes
- Reset is destructive but guarded with `window.confirm`
- Uses default sheet data from `data/sheets.js`
- Keeps logic centralized in App.jsx (controller layer)

\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
## [2026-04-02] Sheet Activation Gate + Queue Eligibility

### Files Affected
- src/data/sheets.js
- src/utils/queue.js
- src/App.jsx

### Purpose
Require each sheet to be manually activated before it can appear in the breeding queue, while keeping activation separate from reset behavior.

### Changes
- Added `isActive: false` to Boskus and Ziggurab defaults
- Updated queue filtering so only sheets with `status === "ACTIVE"` and `isActive === true` are included
- Added activate/deactivate toggle controls for Boskus and Ziggurab in App.jsx
- Kept reset actions separate from activation state changes


### Notes
- Queue is now opt-in per sheet instead of automatically including all active sheets
- Activation state is controlled from the sheet tabs
- This lays the groundwork for clearer queue priority and multi-sheet management

\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
## [2026-04-02] Sheet Visual State + Conditional Reset UI

### Files Affected
- src/App.jsx
- src/components/TrackerSheet.jsx

### Purpose
Improve clarity of sheet state by visually dimming inactive sheets and only showing reset controls when meaningful.

### Changes
- Dimmed entire sheet UI when `isActive === false` using opacity styling
- Added smooth opacity transition for activation state changes
- Restricted Reset button visibility to only show when:
  - sheet is active
  - and sheet has progress (zapped or breeding > 0)
- Kept Activate/Deactivate controls always visible

### Notes
- Inactive sheets remain visible but clearly de-emphasized
- Prevents resetting empty or inactive sheets
- Improves UX by aligning controls with actual user intent

\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
## [2026-04-03] Island Planner Real-Island Grouping Fix

### Files Affected
- src/data/monsterRequirements.js
- src/App.jsx

### Purpose
Stop Island Planner from collapsing breeding work into umbrella buckets like `Natural` and `Fire`, and instead group planner cards by the actual breeding islands each monster belongs to.

### Changes
- Added requirement-island resolution so sheet monsters now normalize legacy Amber import labels into real breeding islands like `Plant`, `Cold`, `Air`, `Water`, `Earth`, `Fire Haven`, and `Fire Oasis`
- Preserved planner behavior while fixing the grouping source used by the existing island planner logic
- Added a saved-sheet migration guard so old localStorage progress no longer overwrites corrected island names with legacy bucket values

### Notes
- Planner cards now split by real island capacity instead of broad family buckets
- Existing zapped and breeding progress remains intact while older saved sheet data upgrades safely

\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
## [2026-04-03] Island Manager Expansion + Mirror Island Groups

### Files Affected
- src/data/islands.js
- src/components/IslandPlanner.jsx
- src/utils/queue.js

### Purpose
Expand Island Planner into a fuller Island Manager with grouped main and mirror islands, while preserving the current breeding-capacity workflow and planner actions.

### Changes
- Expanded island state defaults to include Natural, Fire, Magical, Ethereal, Mirror, and Other island groups
- Added island metadata for `group`, `type`, and `isMirror` so the UI can organize islands without changing planner behavior
- Added mirror island cards for Mirror Plant, Cold, Air, Water, Earth, Light, Psychic, Faerie, and Bone
- Updated planner data shaping to carry island grouping metadata through to the Island Manager UI
- Updated Island Planner to render grouped sections while keeping the existing Need Now, Currently Breeding, +Breeding, and +Zapped flows intact

### Notes
- Existing localStorage island state migrates safely as new islands are added
- Non-breeding support and special islands now appear as managed resource cards without inventing fake planner demand

\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
## [2026-04-03] Island Planner Need-Now Visibility Fix

### Files Affected
- src/utils/queue.js
- src/components/IslandPlanner.jsx
- src/data/monsterDatabase.js

### Purpose
Make Island Planner reliably show all unmet demand from active sheets on the correct island cards, instead of dropping some items once breeding is reserved or when a monster name does not match metadata cleanly.

### Changes
- Updated Island Planner need-now data to use unmet remaining requirements as the visibility rule
- Kept breeding reservation separate so reserved items still appear in `Currently Breeding`
- Fixed the `Congle` monster metadata key so its Amber requirements resolve onto a real island card again

### Notes
- Breeding-capacity limits still control action availability, not whether unmet demand appears
- Need-now rows now stay visible while a monster is still required, even if some copies are already reserved in breeding

\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
## [2026-04-03] Island Manager Data Integrity + Progression Upgrade Pass

### Files Affected
- src/utils/monsterMetadata.js
- src/data/monsterRequirements.js
- src/utils/queue.js
- src/data/islands.js
- src/App.jsx
- src/components/IslandPlanner.jsx

### Purpose
Fix missing island demand on real planner cards and evolve island controls from raw toggles into progression-style unlocking and upgrade milestones.

### Changes
- Added high-confidence primary breeding-island overrides for core monsters used by active Amber sheets
- Tightened requirement-island fallback resolution so legacy umbrella labels route to stable real islands
- Added planner-side defensive island fallback and development warnings for legacy labels and metadata disagreements
- Replaced reversible island lock toggles with one-way unlock confirmation and progression-style upgrade actions
- Added max breeding structure and nursery caps to island state with safe persistence migration
- Added a subtle fully-upgraded island treatment for completed cards

### Notes
- Need Now and Currently Breeding still use the same planner concepts
- Full islands still show unmet demand, but new breeding reservations stay blocked until capacity is upgraded

\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
## [2026-04-03] Real-Island Source-Of-Truth Cleanup

### Files Affected
- src/utils/monsterMetadata.js
- src/data/monsterRequirements.js
- src/utils/queue.js

### Purpose
Make real island lists the consistent source of truth across planner fallbacks and requirement resolution, and keep family labels like `Natural` and `Fire` from masquerading as islands outside the legacy import translation layer.

### Changes
- Added a shared exported real-island list and validator in monster metadata helpers
- Restricted normalized database island lookups to real islands only
- Updated requirement resolution and planner fallback logic to rely on the shared real-island validator
- Kept legacy requirement labels isolated to translation logic instead of allowing them to act like general-purpose island values

### Notes
- `breedableOn` remains the real-island field in the monster database
- Category and family labels stay separate from island data

\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
## [2026-04-03] Island Manager Breedable-On vs Assigned-Island Refactor

### Files Affected
- src/App.jsx
- src/utils/queue.js
- src/data/monsterRequirements.js
- src/utils/monsterMetadata.js
- src/components/IslandPlanner.jsx
- src/components/TrackerSheet.jsx
- src/components/BreedingQueue.jsx

### Purpose
Separate where a monster can be bred from where the player has actually assigned a breeding reservation, so Island Manager stops auto-picking a single island from metadata order.

### Changes
- Kept `breedableOn` as the database source of truth for valid breeding islands
- Added per-monster `breedingAssignments` so Island Manager can track which island each reserved breeding copy is assigned to
- Stopped sheet defaults from auto-resolving broad labels like `Natural` into a single hardcoded island
- Updated Island Manager so unmet demand can appear on every valid real island card until the player assigns breeding there
- Updated Currently Breeding so it only shows reservations on the specific island where they were assigned
- Updated queue and sheet displays to show valid real-island options instead of implying one arbitrary island when none is explicitly chosen

### Notes
- Total `breeding` progress is still preserved for app compatibility
- Island capacity is now enforced from assigned island reservations instead of a fake single-island shortcut

\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
## [2026-04-03] Queue Tabs + Requirement Validation Pass

### Files Affected
- src/data/monsterRequirements.js
- src/utils/queue.js
- src/components/BreedingQueue.jsx

### Purpose
Split the breeding queue into unassigned work and active island allocations, while adding safer requirement validation so bad monster names do not silently corrupt sheet data.

### Changes
- Corrected the Flum Ox fire requirement from `Flowah` to `Glowl`
- Added `REQUIREMENT_MISMATCH_LOG` and database validation when building sheet monsters from requirements
- Invalid requirement monster names are now skipped instead of being accepted silently
- Refactored Breeding Queue into `To Breed` and `Breeding Now` tabs
- `To Breed` now shows unmet unassigned work with valid `breedableOn` island options
- `Breeding Now` now shows only explicit island breeding assignments and supports `+ Zapped`

### Notes
- Need Now and Island Manager assignment flow remain the main place to allocate breeding to islands
- Queue tabs now reflect the same assignment-aware state model instead of duplicating island-manager behavior

\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
## [2026-04-03] Island Progression Availability + Card Confirmation Pass

### Files Affected
- src/components/IslandPlanner.jsx
- src/App.jsx

### Purpose
Restore visible progression actions on breeding island cards and move confirmation into the card UI so unlock and upgrade steps feel staged instead of accidental.

### Changes
- Removed the old `window.confirm` unlock flow from App so island cards can own confirmation state
- Added per-card confirmation state with auto-cancel timeout for island unlock, breeder unlock, and nursery unlock actions
- Restored staged progression actions for breeding islands:
  - `Unlock Island`
  - `Unlock Breeder 2`
  - `Unlock Nursery 2`
- Restricted breeder and nursery progression controls to breeding islands only
- Kept fully upgraded islands in their highlighted completed state

### Notes
- Existing breeding assignment, capacity, Need Now, and Currently Breeding logic was preserved
- Saved island state still merges through the existing localStorage flow

\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
## [2026-04-03] Island Manager Tabs + Capacity Default Cleanup

### Files Affected
- src/components/IslandPlanner.jsx
- src/data/islands.js
- src/App.jsx

### Purpose
Replace the long grouped Island Manager layout with clearer top-level tabs while normalizing island defaults so every card has a usable 1 breeder / 1 nursery base progression path.

### Changes
- Rebuilt the Island Manager UI layer into tab-based navigation:
  - `Natural`
  - `Fire`
  - `Magical`
  - `Ethereal`
  - `Mirror`
  - `Other`
- Simplified island seed defaults so every island now carries at least:
  - `breedingStructures: 1`
  - `nurseries: 1`
  - `maxBreedingStructures: 2`
  - `maxNurseries: 2`
- Normalized island-state merging so older saved data cannot permanently hide progression controls with stale zero-capacity values
- Kept staged progression controls on every island card:
  - `Unlock Island`
  - `Unlock Breeder 2`
  - `Unlock Nursery 2`
- Preserved the existing Need Now, Currently Breeding, assignment, zapping, and capacity logic underneath the new UI shell

### Notes
- This was a UI-layer rebuild over the working planner state model, not a queue or sheet rewrite
- Existing localStorage-backed island progress is still merged safely into the refreshed defaults

\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
## [2026-04-03] Island Manager Upgrade Visibility + Nursery Groundwork

### Files Affected
- src/components/IslandPlanner.jsx
- src/data/islands.js
- src/utils/queue.js

### Purpose
Polish the tabbed Island Manager so progression is visible at a glance, every island follows the same temporary 1-to-2 upgrade model, and nursery capacity is exposed cleanly for future hatch tracking.

### Changes
- Normalized the base island defaults so every seeded island now starts from the same progression model:
  - `isUnlocked: false`
  - `breedingStructures: 1`
  - `nurseries: 1`
  - `maxBreedingStructures: 2`
  - `maxNurseries: 2`
- Moved breeder and nursery upgrade controls up next to their capacity summaries on each island card
- Replaced hidden upgrade meaning with explicit compact states:
  - `+ Breeder`
  - `+ Nursery`
  - `Breeder Max`
  - `Nursery Max`
- Kept card-level confirm/cancel behavior for unlock and upgrade actions, including timeout-based auto-cancel
- Added lightweight nursery groundwork in planner data with `nurseryOccupancy` and `freeNurseries` so future hatch tracking can plug into the same island cards cleanly

### Notes
- Need Now, Currently Breeding, explicit island breeding assignments, queue tabs, and sheet progress were preserved
- This pass improves progression clarity without introducing a separate nursery queue yet

\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
## [2026-04-03] Island Progression Local-State Normalization Fix

### Files Affected
- src/utils/queue.js

### Purpose
Align the Island Manager card data with the universal local island model so saved `1 breeder / 1 nursery` states no longer render as fully upgraded.

### Changes
- Preserved `maxBreedingStructures` and `maxNurseries` when seeding planner card data from saved island state
- Normalized planner-side island values to the same universal local model:
  - minimum `breedingStructures: 1`
  - minimum `nurseries: 1`
  - minimum `maxBreedingStructures: 2`
  - minimum `maxNurseries: 2`

### Notes
- This fixes cases where old or partial planner card state could incorrectly display `Fully Upgraded` at `1 / 1`

\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
## [2026-04-03] Island Upgrade Confirmation Separation Fix

### Files Affected
- src/components/IslandPlanner.jsx

### Purpose
Separate island upgrade confirmation UI from breeding-planner actions so upgrade clicks no longer feel like they collide with breeding state.

### Changes
- Renamed the island card’s local upgrade confirm state to `confirmUpgradeAction` to keep it conceptually separate from planner actions
- Kept upgrade confirmations local to their own UI zones:
  - breeder panel
  - nursery panel
  - island unlock row
- Replaced ambiguous confirm labels with explicit action labels:
  - `Confirm Breeder`
  - `Confirm Nursery`
  - `Confirm Unlock`
- Removed the generic `Breeding` type pill from the card header to avoid it reading like an active upgrade/planner control during confirmation

### Notes
- Need Now, Currently Breeding, `Assign Here + Breeding`, and `+ Zapped` continue to behave the same
- This was a rendering/state-separation fix only; island data and planner behavior were unchanged

\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
## [2026-04-03] Manual Breeding Sessions + Unassigned Flow

### Files Affected
- src/App.jsx
- src/components/BreedingQueue.jsx
- src/components/IslandPlanner.jsx
- src/components/TrackerSheet.jsx
- src/utils/queue.js

### Purpose
Introduce a session-based breeding runtime so manual breeding and planner-assigned breeding can coexist cleanly without breaking the current sheet, queue, and island workflows.

### Changes
- Added local `breedingSessions` persistence and reconciliation in App
- Active assigned breeding now reconciles from sheet breeding assignments, while manual sessions stay locally tracked
- Added inline `+ Manual Breed` flow to island cards
- Refactored `Breeding Now` to render from sessions and split into:
  - `Assigned`
  - `Unassigned`
- Added manual assignment bridge actions so unassigned breeding can be linked to an active sheet intentionally
- Extended planner `Currently Breeding` to include manual/unassigned sessions while preserving existing Need Now behavior
- Extended `+ Zapped` handling so it completes one matching breeding session while preserving sheet progression when relevant

### Notes
- This is additive over the current planner/queue/sheet model rather than a rewrite
- Existing island tabs, Need Now, Assign Here + Breeding, breedingAssignments, and localStorage-backed sheet/island state were preserved

\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
## [2026-04-03] Assign-and-Hatch Session Flow Fix

### Files Affected
- src/App.jsx
- src/components/BreedingQueue.jsx
- src/components/IslandPlanner.jsx
- src/components/TrackerSheet.jsx
- src/utils/queue.js

### Purpose
Fix unassigned breeding assignment safety, add explicit Activate-and-Assign behavior, and extend breeding sessions so they can move from breeding into hatching/nursery occupancy.

### Changes
- Fixed the assign-to-sheet handoff so unassigned sessions resolve target sheet and monster rows safely before changing state
- Added `Activate and Assign` inline confirmation paths for inactive target sheets in both the queue and sheet views
- Extended breeding session status handling to:
  - `breeding`
  - `hatching`
  - `completed`
- Added `Hatch` actions for breeding sessions in the queue and Island Manager
- Hatching now frees breeder occupancy, consumes nursery occupancy, and remains zappable
- Added `Currently Hatching` rendering on island cards
- Added a `Hatching` section in Breeding Queue under `Breeding Now`

### Notes
- `+ Zapped` now works from both breeding and hatching sessions
- Existing planner assignment flow, sheet progress, queue tabs, and localStorage persistence were preserved

\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
## [2026-04-03] Natural Breeding Combo Data Layer

### Files Affected
- src/data/breedingCombos.js
- src/utils/breedingCombos.js
- src/components/IslandPlanner.jsx

### Purpose
Add a real Natural Monster breeding combo source file and wire it into the manual breeding flow so combo, island, and time data can be shown inline from app-managed data instead of hardcoded UI text.

### Changes
- Added `BREEDING_COMBOS_NATURAL` as a dedicated exportable data source
- Added lightweight lookup helpers for combo access by monster name
- Updated the Island Manager manual breed panel to show:
  - combinations
  - breedable islands
  - breeding time
  - enhanced breeding time
  - notes when present
- Added graceful `No combo data yet.` fallback for monsters outside the Natural combo source

### Notes
- Manual breeding session creation still works the same way; this pass only adds a real combo data layer and inline display

\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
## [2026-04-03] Egg Flow Correction

### Files Affected
- src/App.jsx
- src/components/BreedingQueue.jsx
- src/components/IslandPlanner.jsx
- src/utils/queue.js

### Purpose
Correct the egg lifecycle so breeding, nursery movement, zapping, and hatching follow a real physical flow:

- breeder -> zap
- breeder -> nursery -> hatch

### Changes
- Normalized breeding session statuses to:
  - `breeding`
  - `nursery`
  - `completed`
- Added safe migration from legacy `hatching` sessions into `nursery`
- Updated breeder-side assigned actions to:
  - `Zap`
  - `To Nursery`
- Updated breeder-side unassigned/manual actions to:
  - `Assign + Zap`
  - `To Nursery`
- Updated nursery-side sessions to use `Hatch` instead of `+ Zapped`
- Moved breeder and nursery occupancy shaping to the corrected status model in queue/planner helpers
- Added active zap-target support for manual eggs so unassigned zaps can no longer silently disappear without a destination
- Kept sheet-linked nursery hatching from falsely counting as zaps while still clearing tracked breeding when the egg leaves the pipeline

### Notes
- Existing island tabs, Need Now, Currently Breeding, breedingAssignments, manual combo previews, and localStorage persistence were preserved
- Tracker sheet assignment flow remains intact for explicitly claiming existing unassigned breeding

\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
## [2026-04-04] Island Collection Sheet Type

### Files Affected
- src/data/sheets.js
- src/utils/queue.js
- src/components/IslandPlanner.jsx
- src/components/TrackerSheet.jsx
- src/App.jsx

### Purpose
Extend sheets into a multi-purpose tracking system so vessel goals and island collection goals can coexist without replacing the current Amber workflow.

### Changes
- Added stable sheet typing:
  - `vessel`
  - `island`
- Migrated legacy sheets with no type to `vessel`
- Added first-pass island collection sheet defaults for core non-mirror collection islands
- Added island-sheet planner support so island cards can show:
  - `Need Now / Priority Goals` from active vessel sheets
  - `Collection Missing` from active island sheets
- Updated TrackerSheet rendering so island sheets use collection-friendly wording such as:
  - `Collected`
  - `Planned`
  - `Collection Complete`
- Kept vessel-only assignment UI scoped to vessel sheets

### Notes
- Pass 1 island sheets include common-form breedable collection monsters on:
  - Plant
  - Cold
  - Air
  - Water
  - Earth
  - Fire Haven
  - Fire Oasis
  - Light
  - Psychic
  - Faerie
  - Bone
  - Shugabush

\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
## [2026-04-04] Navigation Architecture Refactor

### Files Affected
- src/App.jsx
- src/pages/Collections.jsx

### Purpose
Restructure the app into clearer top-level destinations so dashboard, collections, execution, queueing, and reference browsing each have a distinct role.

### Changes
- Added a dedicated `Collections` page with two tabs:
  - `Vessels`
  - `Islands`
- Grouped vessel sheets by tracking family:
  - Amber
  - Wublin
  - Celestial
- Grouped island collection sheets by region:
  - Natural
  - Fire
  - Magical
  - Ethereal
  - Mirror
  - Other
- Refined the top navigation to:
  - Dashboard
  - Collections
  - Breeding Queue
  - Island Manager
  - Monster Library
- Refocused Home into a real dashboard with:
  - active vessel summary
  - island collection completion summary
  - breeder/nursery availability
  - queue highlights
  - quick links
- Updated sheet back-navigation to return to Collections instead of older collection-browser flows

### Notes
- Existing sheet logic, queue/session logic, breeding flow, and localStorage persistence were preserved
- Island Manager remains execution-focused and now stays separate from collection browsing

\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
## [2026-04-04] Collections Prioritization Pass

### Files Affected
- src/pages/Collections.jsx
- CHANGELOG.md

### Purpose
Make the Collections page easier to scan by deriving clear sheet statuses, surfacing active work, and pushing completed work downward consistently.

### Changes
- Added a unified derived status model for collection sheets:
  - `active`
  - `in_progress`
  - `not_started`
  - `complete`
- Added top-level status filters:
  - `All`
  - `Active`
  - `In Progress`
  - `Not Started`
  - `Complete`
- Sorted sheets within each section by:
  1. active
  2. in progress
  3. not started
  4. complete
- Added status chips and calmer complete-state styling so users can identify important sheets without reading every card
- Preserved the older intent of pushing finished items downward, but consolidated it into the new explicit status system
