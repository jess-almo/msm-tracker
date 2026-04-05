# MSM Tracker Codex Operating Guide

Use this file as the standing repo workflow guide for future Codex sessions. Read it before making edits.

## Quick Repo Map

- Live entrypoint: `src/main.jsx` -> `src/App.jsx`
- Main state owner and screen router: `src/App.jsx`
- Queue and planner projection helpers: `src/utils/queue.js`
- Island and breeding-assignment helpers: `src/utils/monsterMetadata.js`
- Vessel feasibility estimator: `src/utils/vesselFeasibility.js`
- Sheet defaults and sheet typing: `src/data/sheets.js`
- Common-Wublin inbox parser: `data-entry/parseCommonWublins.mjs`
- Collections page: `src/pages/Collections.jsx`
- Breeding Queue UI: `src/components/BreedingQueue.jsx`
- Island Manager UI: `src/components/IslandPlanner.jsx`
- Shared sheet UI: `src/components/TrackerSheet.jsx`
- Monster directory UI: `src/components/MonsterDirectory.jsx`
- Main app datasets: `src/data/monsterDatabase.js`, `src/data/breedingCombos.js`, `src/data/monsterRequirements.js`, `src/data/collections.js`, `src/data/islands.js`
- `README.md` is still the default Vite template and is not a project source of truth

## 1. Project Purpose

MSM Tracker is a React/Vite app for planning and tracking My Singing Monsters breeding work without losing the relationship between long-term goals and live execution.

Major functional areas:

- `sheets`
  - Shared tracking backbone for goal sheets
  - Includes vessel sheets and island collection sheets
- `queue`
  - Shows tracked demand still needing breeding plus the live `Breeding Now` runtime
- `planner`
  - Island Manager for unlocked islands, breeder and nursery capacity, assignment flow, manual breeding, nursery movement, and hatching
- `monster directory`
  - Read-only browse and audit surface for monster metadata
- `feasibility estimation`
  - Read-only vessel estimate built from current sheet state, unlocked breeder capacity, and known breeding-time coverage
- `breeding data pipeline`
  - The path by which raw breeding or metadata research should eventually become validated production data in `src/data/*`

Keep the app’s mental model intact:

- Sheets describe demand and progress.
- `breedingSessions` describe live execution state.
- Queue and planner are derived projection layers, not independent stored state.

## 2. Mandatory Reading Order

Before editing anything, read in this order:

1. `NEXT_HANDOFF.md`
2. `docs/ARCHITECTURE.md`
3. `docs/CONTRACTS.md`
4. `docs/VERIFICATION.md`
5. `CHANGELOG.md`

Then read the task-relevant source files.

Usual next files:

- `src/App.jsx` for state ownership, persistence, and action wiring
- `src/utils/queue.js` for queue and planner derivation
- `src/utils/monsterMetadata.js` for breeding-island resolution and assignment helpers
- `src/data/sheets.js` for sheet defaults and the `vessel` / `island` model
- `src/utils/vesselFeasibility.js` for estimator work
- The task-owning component or dataset under `src/components/*`, `src/pages/*`, or `src/data/*`

## 3. Source-Of-Truth Rules

- Trust code on disk over prior chat summaries.
- The active app entrypoint is `src/main.jsx` importing `src/App.jsx`.
- `src/App.jsx` is the only app root.
- `src/utils/queue.js` is the queue/planner helper source of truth.
- `src/App.jsx` is the source of truth for top-level state ownership, reconciliation, and localStorage persistence.
- `src/utils/monsterMetadata.js` is the source of truth for real breeding islands, breeding-assignment normalization, and assignment trimming/consumption helpers.
- `src/utils/vesselFeasibility.js` is the source of truth for the current vessel feasibility estimator.
- Wublin sheets now separate shared species template identity from tracked instance identity:
  - template identity uses fields such as `systemKey`, `templateKey`, and `templateName`
  - tracked instance identity still depends on the unique concrete `sheet.key`
- Sheets describe demand and progress.
- `breedingSessions` describe live execution state.
- Queue and planner are derived projection layers.
- `localStorage` persistence must not be broken.
- For this repo, always treat `src/main.jsx` -> `src/App.jsx` as the live app root unless the files on disk prove otherwise.

Current persisted keys owned by `src/App.jsx`:

- `msmTrackerSheets`
- `msmTrackerIslandState`
- `msmTrackerIslandSlots`
- `msmTrackerBreedingSessions`
- `msmTrackerView`
- `collectionsData`

## 4. Safe Operating Rules

- Do not add features when asked to verify, audit, or fix integrity.
- Do not refactor unnecessarily.
- Do not change helper contracts casually.
- Do not modify helper signatures without updating every consumer and the docs that describe the contract.
- Do not invent data.
- Do not fake certainty when data coverage is incomplete.
- Prefer minimal additive changes.
- Preserve working behavior unless the task explicitly requires behavioral change.
- Preserve the current sheet-type model: `vessel` and `island`.
- Preserve the normalized breeding-session statuses: `breeding`, `nursery`, `completed`.
- Preserve localStorage keys, load behavior, and migration behavior unless the task is explicitly about persistence.
- Do not silently rework `sheetIndex` or `monsterIndex` behavior; planner actions depend on them lining up with the full `sheets` array.
- Do not recreate a second app root. `src/App.jsx` is the single source of truth.
- Prefer simple direct file reads over shell gymnastics.
- Do not nest `cmd.exe /c` repeatedly unless it is genuinely necessary.
- Git version control is part of the normal repo workflow now, but do not spend time on history or git archaeology unless the user explicitly asks for it.
- If a tool or environment limitation exists, state it briefly and move on.
- Avoid noisy command experimentation when direct reads already answer the question.
- Re-run `npm run build` after code changes, and do not claim success without reporting the result.

## 5. Default Pre-Edit Workflow

Before making edits in this repo:

1. Read the exact target files.
2. Read the adjacent source-of-truth files that control the same behavior.
3. Make the smallest change that satisfies the task.
4. Run `npm run build`.
5. Report which files changed and why.

## 6. Versioning And Changelog

- `package.json` version should be updated intentionally, not as a reflex on every small pass.
- Use lightweight pre-1.0 versioning unless the product maturity clearly justifies something else.
- `CHANGELOG.md` should use versioned entries rather than loose running notes.
- Future notable work should be grouped under concise `Added`, `Changed`, and `Fixed` headings.
- Do not create a fake release for every tiny edit or documentation tweak.
- `NEXT_HANDOFF.md` now includes paste-ready templates for a planning/support chatbot and a fresh Codex session; keep those templates current when repo truth or workflow expectations change.

## 7. Common Task Workflows

### Integrity Verification Pass

1. Read the mandatory docs in order.
2. Verify the live entrypoint is still `src/main.jsx` -> `src/App.jsx`.
3. Audit `src/utils/queue.js` exports against imports in `src/App.jsx` and `src/components/BreedingQueue.jsx`.
4. Verify planner derivation still uses sheets plus `breedingSessions`, not hidden duplicate state.
5. Check `src/App.jsx` persistence and reconciliation paths before proposing any fix.
6. Run `npm run build`.
7. Report mismatches found before suggesting feature work.

### Data Expansion Pass

1. Identify which production dataset under `src/data/*` is being expanded.
2. Stage raw research in `data-entry/inbox.txt` instead of editing production data directly.
3. Parse and normalize the raw input into structured candidate output.
4. Review the parser output and missing-data report manually.
5. Only move clean validated entries into production datasets.
6. Leave uncertain fields blank or omitted rather than guessed.
7. Run `npm run build` and spot-check the affected UI.

### UI Clarity Tweak

1. Start from the owning screen or component.
2. Keep helper contracts and persisted state untouched unless the task explicitly requires more.
3. Prefer copy, layout, emphasis, and labeling improvements over logic churn.
4. Check both sheet types and the current session states if the screen renders shared data.
5. Run `npm run build`.

### Estimator-Related Pass

1. Read `src/utils/vesselFeasibility.js`, `src/components/TrackerSheet.jsx`, `src/App.jsx`, and the estimator notes in the docs.
2. Keep the existing helper signature and output shape unless you are doing a coordinated contract update.
3. Prefer `partial` or `insufficient_data` over invented precision.
4. Do not invent breeding times, enhancement state, nursery timing, or deadline data.
5. Verify the change remains read-only unless the task explicitly expands estimator behavior.
6. Run `npm run build`.

### Documentation-Only Pass

1. Confirm the pass does not touch runtime files unless the task changed scope.
2. Update `CHANGELOG.md` for the documentation pass.
3. Update `NEXT_HANDOFF.md` and the docs set if the recovery workflow or source-of-truth rules changed.
4. Be explicit that runtime behavior is not intended to change.
5. If the pass claims repo integrity or workflow safety, still run `npm run build` before closing out.

## 8. Verification Checklist Summary

- Confirm queue helper imports/exports match their consumers.
- Confirm planner behavior derives from live sessions correctly:
  - `Need Now` from active vessel sheets
  - `Collection Missing` from active island sheets
  - `Currently Breeding` from sessions with `status === "breeding"`
  - `In Nursery` from sessions with `status === "nursery"`
- Confirm the active entrypoint is still `src/main.jsx` -> `src/App.jsx`.
- Confirm localStorage persistence and migration behavior were not broken.
- Confirm `sheetIndex`-driven actions still target the intended sheet rows.
- Run `npm run build`.
- Update docs and `CHANGELOG.md` when structural contracts, ownership, or workflow rules change.

## 9. Data Pipeline Guidance

- Raw data goes into `data-entry/inbox.txt`.
- A parser step should clean, normalize, and structure the inbox input.
- The parser should produce both structured candidate output and a missing-data report.
- Review the parsed output and missing-data report before touching production datasets.
- Production data files should receive only clean validated entries.
- Dataset accuracy matters more than volume.
- If a field is uncertain, leave it unresolved and report the gap instead of guessing.
- Likely production targets include `src/data/monsterDatabase.js`, `src/data/breedingCombos.js`, `src/data/monsterRequirements.js`, and `src/data/collections.js`.
- For the current Wublin workflow:
  - use `data-entry/parseCommonWublins.mjs` for common-Wublin-only inbox normalization
  - keep parser output minimal and structured in `data-entry/parsedWublinTemplates.json`
  - ignore lore, fill prices, release dates, long strategy prose, and Rare/Epic sections unless the task explicitly expands scope

## 10. Reporting Expectations

Future Codex responses for this repo should report:

- mismatches found, or explicitly say none were found
- what changed
- files changed
- build status
- remaining limitations or uncertainties

When relevant, also report:

- whether any runtime code changed
- whether localStorage or helper contracts were touched
- whether the change was documentation-only, UI-only, data-only, or behavioral
