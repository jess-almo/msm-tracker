# Changelog

This changelog tracks notable project-level changes for intentional versions.
Use versioned entries and group future notes under `Added`, `Changed`, and `Fixed`.
Do not create a fake release for every tiny edit.

## [Unreleased]

### Changed

- Updated `NEXT_HANDOFF.md` with paste-ready reusable templates for a planning/support chatbot and a fresh Codex session.
- Added guidance in `docs/CODEX_SYSTEM_PROMPT.md` to keep those handoff templates current when repo truth or workflow expectations change.

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
