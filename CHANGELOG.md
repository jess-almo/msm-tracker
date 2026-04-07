# Changelog

This changelog tracks notable project-level changes for intentional versions.
Use versioned entries and group future notes under `Added`, `Changed`, and `Fixed`.
Do not create a fake release for every tiny edit.

## [Unreleased]

### Changed

- Refreshed the public-facing repo docs so `README.md`, `TODO.md`, and the architecture/Android guides now match the shipped `0.4.0` state, including backup/import support, the lightweight test layer, and the current Android debug-build workflow.
- Added the same conditional floating `Top` control to Collections so long vessel and island lists can jump back to the top quickly once you scroll deep into the page.
- Removed the Wublin-only single-column Collections layout treatment and normalized vessel entry labeling so Amber and Wublin collection cards now use the same display rhythm and card sizing.
- Added a planner-only floating `Top` control in Island Manager so once you scroll deep into the island list you can jump back to the top quickly without manually dragging all the way back up.
- Reworked Monster Directory category behavior so the `Amber` filter now follows the app's real 32-species Amber vessel set instead of only the 6 monsters literally tagged `category: "amber"` in the raw database, and replaced the old alphabetical category-button order with a more intentional operational browse order.
- Simplified Collections section headers so vessel and island group counts now read directly in the heading line instead of floating as detached mobile badges.
- Added mobile-friendly select controls for Collections `Status` and `Family` filters so the page stops stacking a long wall of filter buttons on phones.
- Expanded base island collection seeding from the old pass-1 subset to the full set of currently modeled standard-breeding islands, including Fire, Magical, Ethereal, Seasonal Shanty, and mirror-island base collections.
- Clarified island collection notes so base collections stay focused on common-form island ownership while Rare and Epic variants can be layered in later as separate collection targets instead of being faked as the same monster.
- Reworked Active Sheets into a more operational workbench with inline section counts, overview cards for `Need Now`, `In Motion`, `Ready to Start`, and total remaining work, plus clearer separation between live work and already collected active sheets.
- Renamed the Breeding Queue mode labels from the older `Zap Run` / `Breed Run` wording to clearer action-first `Ready to Zap` / `Ready to Breed` language, and updated the supporting copy to talk about hatching and board-clearing more naturally.
- Finished the visible Collections shift toward the real collection catalog by rendering Amber, Wublin, and Celestial entries from `collectionsData`, giving each monster its own collection card, and adding collection-level `Mark Partial`, `Mark Collected`, and `Clear Status` controls even when no live run sheet exists yet.

## [0.4.0] - 2026-04-06

### Changed

- Added a root-level `COMMANDS.md` reference so daily dev, data, release, Android, and GitHub release commands are easy to find in one place.
- Added a first assignment-recovery flow in Island Manager so live breeding and nursery sessions can be unassigned from the wrong tracked target without deleting the real session, letting those eggs be reassigned correctly from the appropriate sheet afterward.
- Added a first island-side reconciliation flow in Island Manager so you can enter what is actually sitting in breeder and nursery slots, compare that against tracked live sessions, clear stale links from the board, and adopt missing in-game sessions back into the tracker as unassigned live work.
- Simplified the Collections browsing surface so the filters read more clearly as `Browser`, `Status`, and `Family`, hid empty vessel-family options, and renamed the status labels to more operational wording like `Working` and `Ready to Start`.
- Surfaced direct `Activate` and `Deactivate` controls on collection cards instead of forcing everything through the full sheet view, and added a clearer top-level `Activate Next Run` action for grouped common Wublin templates.
- Gave the desktop workspace a bit more horizontal room and introduced a responsive Collections card grid so the web app uses side space more intentionally while mobile stays single-column and compact.
- Started separating collection identity from live run instances by consolidating all vessel families around species-level collection entries, sharing collected-state truth across duplicate-capable vessel runs, and letting new duplicate runs be created beyond the original singleton seed sheets.
- Turned `TODO.md` into an active workflow file for the next targets, next-release bar, and Android checkpoint routine, and added `npm run release:review`, `npm run android:install-debug`, and `npm run android:refresh-debug` so the latest web/app state is easier to verify and package consistently.
- Added `npm run release:notes`, `npm run release:guide`, and `npm run android:package-debug` so release notes, debug APK packaging, and the exact next release commands can be generated from current repo state without automating the final commit/push/publish decisions.
## [0.3.0] - 2026-04-06

### Added

- Added `npm run release:tag` plus `data-entry/releaseTag.mjs` so intentional version cuts can end with a matching annotated git tag pushed to GitHub.
- Added a first Capacitor Android wrapper path with `capacitor.config.json`, Android helper scripts in `package.json`, a generated native `android/` project, and a dedicated `docs/ANDROID.md` guide for debug-APK setup.
- Added `TODO.md` as a public-facing roadmap for the next meaningful Android, data, and product steps.

### Changed

- Updated the handoff and workflow docs so the standard release ritual is now `release:check -> release:prepare -> build -> commit/push -> release:tag`, and recorded that the current released checkpoint is `0.2.0` with tag `v0.2.0`.
- Updated the app document title to `MSM Tracker` so the wrapped build carries a cleaner app identity.
- Replaced the default Vite README with a real project front page covering the app purpose, feature set, workflows, Android path, and release/data commands.
- Split the public repo docs away from the detailed operator/Codex workflow notes so GitHub now shows cleaner app-facing documentation while the private working notes can stay local.
- Simplified the public repo surface again by removing the operator-style doc stubs from version control, keeping the public focus on the app docs and roadmap, and moving `data-entry/inboxArchive.md` out of the tracked repo.
- Reworked the mobile app shell so the top screen navigation collapses into a compact `Screen` select instead of stacking full-width buttons above every page.
- Reframed the home screen into a more operational `Right Now` command center with live counts for `Need Now`, `Breedable`, `Active Eggs`, and `Queue Pressure`, while removing the duplicated `Open ...` navigation buttons from the hero area.
- Updated Island Manager filter semantics so `Need Now` and `Active` are first-class operational views, `Nursery Free` is retired, and `Max Capacity` now lives inside `Capacity Settings` instead of competing with top-level card actions.
## [0.2.0] - 2026-04-06

### Changed

- Updated the local handoff workflow with reusable templates for a planning/support chatbot and a fresh coding session.
- Added guidance to keep those handoff templates current when repo truth or workflow expectations change.
- Added a first responsive polish pass across the app shell, page surfaces, browse screens, and sheet monster cards to reduce small-screen layout drift.
- Reworked Island Manager island cards so breeder/nursery counts stay visible while upgrade and revert controls collapse into a lower-emphasis `Capacity Settings` panel, with a compact `Max Capacity` action and on-demand manual breeding panel.
- Clarified the repo session-closeout rule so implementation passes always end with build verification plus changelog and workflow-doc updates when truth changes.
- Expanded Island Manager manual breeding so you can enter a parent pair, use known combo/timer data to resolve exact results when possible, and fall back to a truthful `Mystery Egg` manual session when the result cannot be determined.
- Added a broader inbox research parser plus generated mechanics reference outputs so noisy wiki dumps can be turned into reusable breeding rules, Rare/Epic notes, timer guidance, and future inbox-format guidance without treating the raw inbox as production truth.
- Expanded the inbox research pipeline so `npm run parse:inbox` now extracts structured combo and breeding-time candidates, preserves cumulative parsed output across runs, archives processed raw page dumps into `data-entry/inboxArchive.md`, and automatically trims `data-entry/inbox.txt`.
- Added `npm run promote:breeding-data` plus `data-entry/promoteParsedBreedingData.mjs` so reviewed parsed breeding combo/time candidates can be promoted into the generated runtime import at `src/data/breedingCombosImported.json`.
- Broadened runtime breeding helper coverage by merging the hand-authored Natural baseline with imported combo rows and unambiguous time-only rows, and updated Monster Directory to fall back to imported combo data when the static monster entry is blank.
- Added a shared monster-priority helper and switched Monster Directory to a practical default browse order that favors requirement-used monsters, common before rare before epic, and lower-element monsters before denser ones.
- Reordered Island Manager manual-breed parent pickers by that same practical priority logic, excluded Epic monsters from parent-pair dropdowns, and fixed runtime coverage gaps for `bbli$zard` plus `Rare/Epic Congle` so those parsed rows now promote cleanly.
- Tightened Island Manager mobile usability by collapsing the region scope control to a mobile-only select, keeping availability filters as compact quick-action pills, and removing the redundant `Open` breeder-availability label in favor of clearer `Breedable` and `Capacity Limited` wording.
- Added a context-aware Island Manager `Jump to island` strip that is derived from the currently visible islands, scrolls to the chosen card, and briefly highlights it without creating a second filtering mode.
- Split the app’s largest non-home screens behind `React.lazy` and `Suspense` so `src/App.jsx` no longer eagerly loads every major screen into the initial bundle.
- Added `npm run audit:operational-data` plus generated operational coverage reports so the repo now has one explicit “complete in one operational way” target for current requirement-scope breeding data.
- Added `npm run release:check` and `npm run release:prepare -- <version>` as a lightweight pre-1.0 release workflow tied to changelog volume and the latest operational coverage audit.
- Tightened a few runtime module imports to use explicit file paths or JSON import attributes so Node-based repo tooling can safely read the same source modules the app uses.

## [0.1.0] - 2026-04-05

First real GitHub-tracked baseline release. This entry consolidates the prior development notes from 2026-04-03 through 2026-04-05 into one honest pre-1.0 baseline instead of inventing a long formal release history.

### Added

- Shared sheet system supporting both `vessel` and `island` sheet types.
- Top-level app surfaces for Dashboard, Active Sheets, Collections, Breeding Queue, Island Manager, Monster Library, and shared Tracker Sheet flows.
- Persistent `breedingSessions` runtime with normalized `breeding`, `nursery`, and `completed` states.
- Island progression and capacity tracking with unlock state, breeder counts, nursery counts, and operational metadata for special islands.
- Common-Wublin template plus tracked-instance support, including multi-instance creation and persistence-safe loading.
- Common-Wublin data-ingestion path with `data-entry/inbox.txt`, `data-entry/parseCommonWublins.mjs`, and `data-entry/parsedWublinTemplates.json`.
- Natural breeding combo dataset and helper layer for combo lookup, timing display, and manual breeding previews.
- Read-only vessel feasibility estimate based on current sheet state, unlocked breeder capacity, and known timing coverage.
- Repo documentation set covering operating workflow, architecture, helper contracts, verification, and handoff recovery.

### Changed

- Established `0.1.0` as the first intentional app version in `package.json`.
- Converted the changelog from loose running notes into a versioned baseline format suitable for a lightweight real-project workflow.
- Shifted Tracker Sheet interaction toward row-linked `Breed on...` and contextual `Zap Ready` actions, with manual counters left as fallback controls.
- Reworked the queue into `Zap Run` and `Breed Run` operational passes using the existing sheet and session systems.
- Expanded Collections into a clearer browsing surface with derived status, family filters, species-first Wublin presentation, and active-work prioritization.
- Improved Island Manager demand shaping so shared sheet demand projects across valid breeding islands while keeping one underlying source row.
- Tightened planner behavior around island capability metadata so special islands no longer advertise fake breeder or nursery capacity.
- Clarified repo workflow so direct on-disk file reads are preferred during audit and recovery work.

### Fixed

- Corrected breeder and nursery occupancy reconciliation to stay aligned with live `breedingSessions` and valid sheet linkage.
- Fixed multiple planner and metadata integrity issues, including requirement validation, real-island normalization, and the false-positive Congle breeding-island mapping.
- Fixed shared-demand projection and need-now visibility issues that could hide or misplace active sheet demand on island cards.
- Fixed duplicate-Wublin handling so separate tracked instances keep distinct identity, progress, and session targeting.
- Fixed several assignment, zap, nursery, and activation flows so sheet updates complete before sessions are finalized.
