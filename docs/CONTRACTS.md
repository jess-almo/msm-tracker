# MSM Tracker Public Contracts

This file keeps the public, app-facing contracts concise.

## Source Of Truth

- `src/main.jsx` -> `src/App.jsx` is the live app entry path
- sheets are the source of truth for tracked work
- `breedingSessions` are the source of truth for live execution state
- queue/planner remain derived systems

## Supported Sheet Types

- `vessel`
- `island`

## Normalized Session Statuses

- `breeding`
- `nursery`
- `completed`

## Runtime Data Expectations

- queue/planner helpers must target real tracked sheet identity
- Wublin template identity must not replace exact `sheet.key` action targeting
- imported breeding data may provide:
  - exact combo coverage
  - or time-only coverage when combo data is still incomplete

## Public Implementation Rule

Preserve the shared sheet backbone and avoid creating parallel runtime state systems.
