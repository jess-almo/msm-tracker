# Verification Checklist

Use this public checklist after notable implementation work.

## Core Checks

- verify the app entrypoint is still `src/main.jsx` -> `src/App.jsx`
- verify queue/planner behavior still derives from sheets and `breedingSessions`
- verify Wublin instances keep separate tracked identity
- verify no persistence regressions were introduced

## Build Check

Run:

```bash
npm run build
```

## Data Workflow Check

If breeding data or parsing changed, re-run the relevant steps:

```bash
npm run parse:inbox
npm run promote:breeding-data
npm run audit:operational-data
```

## Android Check

If Android packaging changed, re-run:

```bash
npm run android:doctor
npm run android:sync
```
