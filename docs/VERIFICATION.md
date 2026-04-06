# Verification Checklist

Use this checklist before feature work, after queue/planner edits, and during recovery in a new chat.

## Read First

- Read [`NEXT_HANDOFF.md`](../NEXT_HANDOFF.md) first.
- Trust the code on disk over prior chat summaries.
- For versioning or release-structure work, also inspect [`package.json`](../package.json).

## Entrypoint Verification

- Verify the active entrypoint is [`src/main.jsx`](../src/main.jsx) importing [`src/App.jsx`](../src/App.jsx).
- Verify [`src/App.jsx`](../src/App.jsx) is the only app root and that [`src/main.jsx`](../src/main.jsx) still imports it directly.
- Verify top navigation still includes `Active Sheets` as the fast operational view for active goals only.

## Queue Helper Surface

- Audit [`src/utils/queue.js`](../src/utils/queue.js) exports.
- Compare them against imports in:
  - [`src/components/BreedingQueue.jsx`](../src/components/BreedingQueue.jsx)
  - [`src/components/IslandPlanner.jsx`](../src/components/IslandPlanner.jsx)
  - [`src/App.jsx`](../src/App.jsx)
- Confirm the helper surface is:
  - `buildToBreedEntries`
  - `buildBreedingQueue`
  - `buildBreedingNowEntriesFromSessions`
  - `buildIslandPlannerData`

## Planner Behavior

- Verify `Need Now` only reflects active vessel sheets.
- Verify shared sheet demand fans out onto every eligible breeding island card instead of collapsing to one preferred island.
- Verify planner projection skips islands that do not support the standard breeding loop.
- Verify `Collection Missing` only reflects active island sheets.
- Verify `Currently Breeding` only reflects sessions where `status === "breeding"`.
- Verify `In Nursery` only reflects sessions where `status === "nursery"`.
- Verify assigning from one island reduces the same shared remaining demand everywhere that row is projected.
- Verify special islands like Wublin Island, Gold, Tribal, Composer, Magical Nexus, and Ethereal Workshop do not show fake breeder or nursery availability.
- Verify breeder/nursery revert controls cannot reduce capacity below live occupancy.
- Verify Island Manager manual breed supports both direct-add fallback and parent-pair entry.
- Verify parent-pair manual breed creates an exact result only when combo data resolves to one candidate, otherwise a `Mystery Egg` session.

## Breeding Queue Behavior

- Verify `Zap Run` only shows breeder-side tracked items that can use the existing zap handler directly.
- Verify `Breed Run` only shows tracked sheet demand that is currently breedable on an open island.
- Verify both queue modes stay sorted by island progression first and activation order second.
- Verify the default queue mode is `Zap Run` when zap-ready tracked items exist, otherwise `Breed Run`.

## Target Integrity

- Verify planner actions that depend on `sheetIndex` still target the correct sheet row.
- Re-check any helper changes that reindex active sheets or rebuild grouped session entries.
- Verify duplicate Wublin instances keep distinct `sheet.key` values and do not share progress or zaps across instances.
- Verify any shared Wublin `templateKey` logic is used only for template identity or summary grouping, not for action targeting.
- Verify `TrackerSheet` primary `Breed on...` actions reuse the existing row-linked breeding flow rather than a second sheet-only execution path.
- Verify `TrackerSheet` `Zap Ready` only appears when real linked breeder-side sessions exist for that exact sheet row, and that using it updates the same row progress the planner would update.
- Verify manual sheet counters remain available only as fallback UI and are no longer the dominant sheet interaction model.

## Wublin Instance Checks

- Verify common Wublin sheets can create an additional instance from the current UI workflow.
- Verify the new instance receives a fresh tracked identity and starts with clean progress.
- Verify both instances can be active at the same time without breeding for one satisfying the other.
- Verify reload persistence keeps extra Wublin instances instead of dropping them because they are not part of the static defaults list.
- Verify resetting a duplicated Wublin sheet restores only that instance from template seed data.

## Data Pipeline Checks

- Verify `data-entry/inbox.txt` remains raw staging input, not production truth.
- Verify `npm run parse:inbox` runs `data-entry/parseInboxResearch.mjs`.
- Verify `npm run promote:breeding-data` runs `data-entry/promoteParsedBreedingData.mjs`.
- Verify `npm run audit:operational-data` runs `data-entry/auditOperationalBreedingCoverage.mjs`.
- Verify `data-entry/parseInboxResearch.mjs` can merge new mechanics/combo/time extractions into `data-entry/parsedBreedingData.json` without wiping previously extracted structured knowledge.
- Verify `data-entry/parseInboxResearch.mjs` archives processed raw page dumps into `data-entry/inboxArchive.md` and trims them out of `data-entry/inbox.txt`.
- Verify `data-entry/parsedBreedingData.json` is treated as cumulative structured candidate mechanics/reference output, not production gameplay data.
- Verify `data-entry/promoteParsedBreedingData.mjs` only promotes monsters already known in `src/data/monsterDatabase.js`.
- Verify ambiguous time-only rows are skipped during promotion instead of being silently collapsed.
- Verify `src/data/breedingCombosImported.json` is regenerated when candidate data promotion changes.
- Verify `data-entry/operationalBreedingCoverage.json` and `data-entry/operationalBreedingCoverage.md` regenerate and reflect the current requirement-scope completeness target.
- Verify the audit treats time-only runtime coverage as operationally complete but still distinguishes it from exact combo coverage.
- Verify `data-entry/parseCommonWublins.mjs` only extracts common-Wublin template data.
- Verify `data-entry/parsedWublinTemplates.json` stays structured and minimal:
  - species name
  - requirement list
  - total eggs when present
  - time limit when present
- Verify Rare/Epic Wublin data is not silently inferred from common-only parsing.

## Build Check

- Run `npm run build`.

## Android Wrapper Check

- Run `npm run android:doctor`.
- Run `npm run android:sync`.
- Verify the Capacitor Android project exists under [`android`](../android).
- If a native build is attempted, distinguish clearly between:
  - app/runtime issues
  - missing Android SDK / local machine setup
- If SDK is configured, a debug build can be checked with:
  - `cd android`
  - `gradlew.bat assembleDebug`

## Release Readiness Check

- Before intentionally versioning the app, run `npm run release:check`.
- Verify the recommendation is based on both:
  - notable `CHANGELOG.md` `Unreleased` volume
  - latest `data-entry/operationalBreedingCoverage.json` status
- If a version cut is intended, use `npm run release:prepare -- <version>` so `package.json` and `CHANGELOG.md` stay aligned.
- After the release commit is built and pushed, run `npm run release:tag`.
- Verify the matching annotated git tag exists and is pushed to `origin`.

## Documentation Follow-Through

- If this was an implementation session rather than analysis-only, verify session closeout included:
  - `npm run build`
  - [`CHANGELOG.md`](../CHANGELOG.md)
  - [`NEXT_HANDOFF.md`](../NEXT_HANDOFF.md) and the docs set when repo truth or workflow changed
- If structural or code changes were made, update:
  - [`NEXT_HANDOFF.md`](../NEXT_HANDOFF.md)
  - [`CHANGELOG.md`](../CHANGELOG.md)
  - [`docs/ARCHITECTURE.md`](./ARCHITECTURE.md)
  - [`docs/CONTRACTS.md`](./CONTRACTS.md)
  - [`docs/VERIFICATION.md`](./VERIFICATION.md)
- If Android packaging workflow changed, also update:
  - [`docs/ANDROID.md`](./ANDROID.md)
- If the change intentionally updates the app version, also update [`package.json`](../package.json) and add or revise the matching versioned changelog entry.
