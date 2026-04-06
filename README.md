# MSM Tracker

![MSM Tracker icon](public/favicon.svg)

Track My Singing Monsters breeding work with one app that keeps long-term goals, live breeder occupancy, and island-by-island execution tied together.

## Status

- Current version: `0.3.0`
- Current release tag: `v0.3.0`
- Web app is working and actively used
- Android wrapper path is now set up with Capacitor
- Current breeding-data target is operationally complete for tracked requirement monsters

## What This App Does

MSM Tracker is built around a simple rule:

- sheets describe demand and progress
- `breedingSessions` describe live execution state
- queue and planner are derived views, not a second state system

That gives the app a practical workflow:

1. choose goals
2. activate the sheets that matter right now
3. see what is ready to zap or breed
4. manage island capacity and active breeders
5. keep the live game and the tracker in sync

## Current Features

### Goal Tracking

- shared sheet system for:
  - vessel sheets
  - island collection sheets
- Active Sheets view for currently relevant work only
- Collections view for browsing tracked goals without leaving the sheet model
- Wublin multi-instance support with separate tracked identity per instance

### Operational Workflow

- Breeding Queue split into:
  - `Zap Run`
  - `Breed Run`
- Island Manager with:
  - island capacity tracking
  - breeder and nursery occupancy
  - demand projection
  - manual breeding support
  - context-aware jump-to-island navigation
- row-linked `Breed on...` and `Zap Ready` actions from sheets

### Breeding Data / Reference

- Monster Directory for browsing monster metadata and breeding info
- imported combo and breeding-time data layered on top of the hand-authored baseline
- manual breeding by parent pair with:
  - exact-result inference when current data is strong enough
  - truthful `Mystery Egg` fallback when it is not

### Data Pipeline

- raw inbox ingestion for messy research dumps
- parsing, promotion, and audit commands for growing the runtime data safely
- explicit operational breeding-completeness audit

## Main Screens

- `Dashboard`
  - summary-first command center
- `Active Sheets`
  - quick view of the work currently driving action
- `Collections`
  - species and collection browsing
- `Breeding Queue`
  - what to zap now and what to breed next
- `Island Manager`
  - island-by-island execution surface
- `Monster Library`
  - read-only monster and breeding reference
- `Tracker Sheet`
  - shared detailed sheet view

## Why It Exists

This project is for real play, not just data display.

The goal is to make the game easier to manage when you are juggling:

- multiple islands
- active breeders and nurseries
- Wublin zaps
- Amber vessels
- collection gaps
- temporary manual breeding sessions

The app is meant to feel like a practical companion, not a spreadsheet with prettier buttons.

## Android Path

The repo now has a first Android wrapper path using Capacitor.

What is already done:

- Capacitor config exists
- native `android/` project exists
- web build sync into Android works

Current blocker on this machine:

- Android SDK location is not configured yet, so a debug APK cannot be built from this machine until Android Studio / SDK setup is finished

See:

- [docs/ANDROID.md](docs/ANDROID.md)

## Local Development

For the full command index, see:

- [COMMANDS.md](COMMANDS.md)

From the repo root:

```bash
npm install
npm run dev
```

The app entrypoint is:

```text
src/main.jsx -> src/App.jsx
```

Useful commands:

```bash
npm run build
npm run preview
npm run lint
```

## Data Workflow

Raw research goes into:

```text
data-entry/inbox.txt
```

Then process it with:

```bash
npm run parse:inbox
npm run promote:breeding-data
npm run audit:operational-data
```

Key generated outputs:

- `data-entry/parsedBreedingData.json`
- `data-entry/gameMechanicsReference.md`
- `src/data/breedingCombosImported.json`
- `data-entry/operationalBreedingCoverage.md`

## Release Workflow

This repo now has a lightweight intentional release flow:

```bash
npm run release:check
npm run release:prepare -- <version>
npm run build
npm run release:tag
```

The idea is:

- do not cut fake releases for every tiny pass
- do cut real releases when the changelog and audit state justify it

## Tech Stack

- React
- Vite
- Capacitor for Android packaging
- localStorage persistence
- plain JS data/model layer

## Current Priorities

- finish the first real Android device install path
- continue expanding runtime monster coverage beyond the current operational-completeness target
- improve mobile polish through real device testing
- eventually support broader collection and event-driven workflows

## Project Docs

- [COMMANDS.md](COMMANDS.md)
- [TODO.md](TODO.md)
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- [docs/ANDROID.md](docs/ANDROID.md)
- [CHANGELOG.md](CHANGELOG.md)
