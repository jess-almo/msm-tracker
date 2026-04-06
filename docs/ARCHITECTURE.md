# MSM Tracker Architecture

This document describes the public app architecture currently on disk.

## Entrypoint

- active app entrypoint: [`src/main.jsx`](../src/main.jsx)
- live app root: [`src/App.jsx`](../src/App.jsx)

## Core Model

MSM Tracker is built around one simple relationship:

- sheets describe demand and progress
- `breedingSessions` describe live execution state
- queue and planner are derived from those systems

The app intentionally avoids parallel execution state.

## Main Screens

- Dashboard
- Active Sheets
- Collections
- Breeding Queue
- Island Manager
- Monster Library
- Tracker Sheet

## State Ownership

Top-level state lives in [`src/App.jsx`](../src/App.jsx):

- `sheets`
- `collectionsData`
- `islandStates`
- `breedingSessions`
- `view`

## Sheet Model

Supported sheet types:

- `vessel`
- `island`

Important notes:

- common Wublins use shared template identity plus separate tracked instances
- exact queue/planner/session targeting still depends on the concrete `sheet.key`
- island sheets reuse the shared sheet backbone instead of a second collection system

## Queue / Planner

Source of truth:

- [`src/utils/queue.js`](../src/utils/queue.js)

Behavior:

- queue derives active tracked demand from sheets
- planner derives island execution data from sheets, island state, and live sessions
- special islands use explicit operational metadata instead of fake breeder/nursery defaults

## Persistence

The app currently persists browser-side state in local storage for:

- sheets
- island progression/state
- breeding sessions
- view state
- collections data

## Data Layer

Main runtime datasets:

- [`src/data/sheets.js`](../src/data/sheets.js)
- [`src/data/islands.js`](../src/data/islands.js)
- [`src/data/monsterDatabase.js`](../src/data/monsterDatabase.js)
- [`src/data/breedingCombos.js`](../src/data/breedingCombos.js)
- [`src/data/collections.js`](../src/data/collections.js)

## Android Wrapper

The repo now includes a Capacitor Android wrapper.

- config: [`capacitor.config.json`](../capacitor.config.json)
- native project: [`android`](../android)
- details: [docs/ANDROID.md](./ANDROID.md)

The Android layer packages the same web app. It is not a second frontend or second state system.

## Working Routine

Use [`TODO.md`](../TODO.md) as the active operating list for:

- the next real product targets
- the minimum bar for the next release
- the current Android test/install routine

Use [`CHANGELOG.md`](../CHANGELOG.md) for completed notable work and released milestones.
