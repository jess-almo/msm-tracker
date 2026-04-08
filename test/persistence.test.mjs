import test from "node:test";
import assert from "node:assert/strict";

import {
  ACTIVITY_LOG_LIMIT,
  appendActivityLogEntry,
  BACKUP_SCHEMA_VERSION,
  loadInitialAppState,
  loadActivityLog,
  loadLatestSnapshot,
  loadSnapshotHistory,
  parseBackupPayload,
  saveAppSnapshot,
  SNAPSHOT_HISTORY_LIMIT,
  reconcileBreedingSessions,
  serializeBackupPayload,
} from "../src/utils/persistence.js";
import {
  buildBlockedBreedingQueue,
  buildBreedingQueue,
  buildIslandPlannerData,
} from "../src/utils/queue.js";

function createDefaultSheet(overrides = {})
{
  return {
    key: "sheet_foo",
    type: "vessel",
    systemKey: "wublin",
    templateKey: "wublin_foo",
    templateName: "Zynth",
    monsterName: "Zynth",
    collectionKey: "wublins",
    collectionName: "Wublins",
    sheetTitle: "Zynth",
    displayName: "Zynth",
    instanceNumber: 1,
    allowsDuplicateRuns: true,
    monsters: [
      {
        name: "Congle",
        required: 2,
        zapped: 0,
        breeding: 1,
        breedingAssignments: {
          Plant: 1,
        },
        island: "Plant",
        requirementIsland: "Plant",
      },
    ],
    ...overrides,
  };
}

function createDefaultCollections()
{
  return [
    {
      key: "wublins",
      label: "Wublins",
      entries: [
        {
          name: "Zynth",
          rarity: "common",
          collected: false,
          status: "inactive",
        },
      ],
    },
  ];
}

function createMemoryStorage()
{
  const values = new Map();

  return {
    getItem(key)
    {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value)
    {
      values.set(key, String(value));
    },
    removeItem(key)
    {
      values.delete(key);
    },
  };
}

test("parseBackupPayload rejects invalid JSON", () =>
{
  assert.throws(
    () =>
      parseBackupPayload("not json", {
        defaultSheets: [createDefaultSheet()],
        defaultCollections: createDefaultCollections(),
      }),
    /not valid JSON/i
  );
});

test("serializeBackupPayload and parseBackupPayload round-trip core state", () =>
{
  const defaultSheets = [createDefaultSheet()];
  const defaultCollections = createDefaultCollections();
  const rawPayload = serializeBackupPayload({
    appVersion: "0.4.0",
    sheets: defaultSheets,
    view: { screen: "collections" },
    collectionsData: [
      {
        ...defaultCollections[0],
        entries: [
          {
            ...defaultCollections[0].entries[0],
            collected: true,
            status: "complete",
          },
        ],
      },
    ],
    islandStates: [
      {
        name: "Plant",
        group: "natural",
        unlocked: true,
        breedingStructures: 2,
        maxBreedingStructures: 2,
        nurseries: 2,
        maxNurseries: 2,
      },
    ],
    breedingSessions: [
      {
        id: "manual_1",
        monsterId: "Congle",
        islandId: "Plant",
        source: "manual",
        sheetId: null,
        status: "breeding",
        createdAt: 123,
      },
    ],
    exportedAt: "2026-04-07T12:00:00.000Z",
  });

  const parsedPayload = parseBackupPayload(rawPayload, {
    defaultSheets,
    defaultCollections,
  });

  assert.equal(parsedPayload.meta.schemaVersion, BACKUP_SCHEMA_VERSION);
  assert.equal(parsedPayload.meta.appVersion, "0.4.0");
  assert.equal(parsedPayload.meta.exportedAt, "2026-04-07T12:00:00.000Z");
  assert.deepEqual(parsedPayload.view, { screen: "collections" });
  assert.equal(parsedPayload.collectionsData[0].entries[0].collected, true);
  assert.equal(parsedPayload.collectionsData[0].entries[0].status, "complete");
  assert.equal(parsedPayload.breedingSessions.some((session) => session.source === "manual"), true);
});

test("reconcileBreedingSessions preserves manual sessions and restores assigned sessions from sheets", () =>
{
  const sheets = [createDefaultSheet()];
  const reconciled = reconcileBreedingSessions(
    [
      {
        id: "manual_1",
        monsterId: "Mammott",
        islandId: "Plant",
        source: "manual",
        sheetId: null,
        status: "breeding",
        createdAt: 1,
      },
      {
        id: "assigned_1",
        monsterId: "Congle",
        islandId: "Plant",
        source: "assigned",
        sheetId: "sheet_foo",
        status: "breeding",
        createdAt: 2,
      },
    ],
    sheets
  );

  const manualSession = reconciled.find((session) => session.id === "manual_1");
  const assignedSession = reconciled.find(
    (session) => session.source === "assigned" && session.sheetId === "sheet_foo"
  );

  assert.ok(manualSession, "manual reconciliation-safe session should remain");
  assert.ok(assignedSession, "assigned session should exist after reconciliation");
  assert.equal(assignedSession.monsterId, "Congle");
  assert.equal(assignedSession.islandId, "Plant");
});

test("island collection queue entries stay routed to the sheet's target island", () =>
{
  const islandCollectionSheet = {
    key: "mirror_plant_collection",
    type: "island",
    island: "Mirror Plant",
    sheetTitle: "Mirror Plant Collection",
    priority: 200,
    status: "ACTIVE",
    isActive: true,
    monsters: [
      {
        name: "Bowgart",
        required: 1,
        zapped: 0,
        breeding: 0,
        breedingAssignments: {},
        island: "Mirror Plant",
        requirementIsland: "Mirror Plant",
      },
    ],
  };

  const queue = buildBreedingQueue([islandCollectionSheet]);

  assert.equal(queue.length, 1);
  assert.equal(queue[0].island, "Mirror Plant");
  assert.deepEqual(queue[0].validBreedingIslands, ["Mirror Plant"]);
  assert.equal(queue[0].routeLockedToIsland, true);
});

test("island planner keeps island collection demand on the intended island", () =>
{
  const islandCollectionSheet = {
    key: "mirror_plant_collection",
    type: "island",
    island: "Mirror Plant",
    sheetTitle: "Mirror Plant Collection",
    priority: 200,
    status: "ACTIVE",
    isActive: true,
    monsters: [
      {
        name: "Bowgart",
        required: 1,
        zapped: 0,
        breeding: 0,
        breedingAssignments: {},
        island: "Mirror Plant",
        requirementIsland: "Mirror Plant",
      },
    ],
  };

  const planner = buildIslandPlannerData([islandCollectionSheet], [], []);
  const mirrorPlantEntry = planner.find((entry) => entry.island === "Mirror Plant");
  const psychicEntry = planner.find((entry) => entry.island === "Psychic");

  assert.ok(mirrorPlantEntry, "mirror plant planner entry should exist");
  assert.equal(mirrorPlantEntry.collectionMissing.length, 1);
  assert.equal(mirrorPlantEntry.collectionMissing[0].name, "Bowgart");
  assert.ok(!psychicEntry || psychicEntry.collectionMissing.length === 0);
});

test("buildBlockedBreedingQueue reports locked breeding islands", () =>
{
  const sheet = createDefaultSheet({
    key: "mirror_plant_collection",
    type: "island",
    island: "Mirror Plant",
    sheetTitle: "Mirror Plant Collection",
    status: "ACTIVE",
    isActive: true,
    monsters: [
      {
        name: "Bowgart",
        required: 1,
        zapped: 0,
        breeding: 0,
        breedingAssignments: {},
        island: "Mirror Plant",
        requirementIsland: "Mirror Plant",
      },
    ],
  });

  const blockedQueue = buildBlockedBreedingQueue(
    [sheet],
    [
      {
        island: "Mirror Plant",
        isUnlocked: false,
        freeSlots: 1,
        supportsStandardBreeding: true,
        orderIndex: 1,
      },
    ]
  );

  assert.equal(blockedQueue.length, 1);
  assert.match(blockedQueue[0].blockReason, /locked/i);
  assert.match(blockedQueue[0].blockDetails, /Mirror Plant: locked/i);
});

test("buildBlockedBreedingQueue skips entries when a valid island has open breeders", () =>
{
  const sheet = createDefaultSheet({
    key: "mirror_plant_collection",
    type: "island",
    island: "Mirror Plant",
    sheetTitle: "Mirror Plant Collection",
    status: "ACTIVE",
    isActive: true,
    monsters: [
      {
        name: "Bowgart",
        required: 1,
        zapped: 0,
        breeding: 0,
        breedingAssignments: {},
        island: "Mirror Plant",
        requirementIsland: "Mirror Plant",
      },
    ],
  });

  const blockedQueue = buildBlockedBreedingQueue(
    [sheet],
    [
      {
        island: "Mirror Plant",
        isUnlocked: true,
        freeSlots: 1,
        supportsStandardBreeding: true,
        orderIndex: 1,
      },
    ]
  );

  assert.equal(blockedQueue.length, 0);
});

test("loadInitialAppState falls back to the latest snapshot when live keys are missing", () =>
{
  const storage = createMemoryStorage();
  const defaultSheets = [createDefaultSheet()];
  const defaultCollections = createDefaultCollections();

  saveAppSnapshot(
    {
      appVersion: "0.4.0",
      sheets: [
        createDefaultSheet({
          monsters: [
            {
              name: "Congle",
              required: 2,
              zapped: 1,
              breeding: 0,
              breedingAssignments: {},
              island: "Plant",
              requirementIsland: "Plant",
            },
          ],
        }),
      ],
      view: { screen: "collections" },
      collectionsData: [
        {
          ...defaultCollections[0],
          entries: [
            {
              ...defaultCollections[0].entries[0],
              collected: false,
              status: "in_progress",
            },
          ],
        },
      ],
      islandStates: [
        {
          name: "Plant",
          group: "natural",
          unlocked: true,
          breedingStructures: 2,
          maxBreedingStructures: 2,
          nurseries: 2,
          maxNurseries: 2,
        },
      ],
      breedingSessions: [
        {
          id: "manual_1",
          monsterId: "Congle",
          islandId: "Plant",
          source: "manual",
          sheetId: null,
          status: "breeding",
          createdAt: 1,
        },
      ],
    },
    storage
  );

  const loadedState = loadInitialAppState({
    defaultSheets,
    defaultCollections,
    storage,
  });

  assert.equal(loadedState.view.screen, "collections");
  assert.equal(loadedState.sheets[0].monsters[0].zapped, 1);
  assert.equal(loadedState.collectionsData[0].entries[0].status, "in_progress");
  assert.equal(loadedState.breedingSessions.length, 1);
});

test("saveAppSnapshot keeps only the most recent snapshot history entries", () =>
{
  const storage = createMemoryStorage();

  for (let index = 0; index < SNAPSHOT_HISTORY_LIMIT + 3; index += 1)
  {
    saveAppSnapshot(
      {
        appVersion: "0.4.0",
        sheets: [createDefaultSheet({ key: `sheet_${index}` })],
        view: { screen: `snapshot_${index}` },
        collectionsData: createDefaultCollections(),
        islandStates: [],
        breedingSessions: [],
        exportedAt: `2026-04-08T00:00:0${index % 10}.000Z`,
      },
      storage
    );
  }

  const snapshotHistory = loadSnapshotHistory(storage);
  const latestSnapshot = loadLatestSnapshot(storage);

  assert.equal(snapshotHistory.length, SNAPSHOT_HISTORY_LIMIT);
  assert.equal(latestSnapshot.view.screen, `snapshot_${SNAPSHOT_HISTORY_LIMIT + 2}`);
});

test("appendActivityLogEntry stores normalized log entries", () =>
{
  const storage = createMemoryStorage();
  const entry = appendActivityLogEntry(
    {
      type: "sheet_activated",
      message: "Activated Tympa #1.",
      details: {
        sheetKey: "wublin_tympa_1",
      },
    },
    storage
  );

  const activityLog = loadActivityLog(storage);

  assert.ok(entry.id);
  assert.equal(activityLog.length, 1);
  assert.equal(activityLog[0].type, "sheet_activated");
  assert.equal(activityLog[0].message, "Activated Tympa #1.");
  assert.equal(activityLog[0].details.sheetKey, "wublin_tympa_1");
});

test("appendActivityLogEntry keeps only the most recent activity entries", () =>
{
  const storage = createMemoryStorage();

  for (let index = 0; index < ACTIVITY_LOG_LIMIT + 5; index += 1)
  {
    appendActivityLogEntry(
      {
        type: "collection_entry_status_updated",
        message: `Updated entry ${index}.`,
        details: { index },
      },
      storage
    );
  }

  const activityLog = loadActivityLog(storage);

  assert.equal(activityLog.length, ACTIVITY_LOG_LIMIT);
  assert.equal(activityLog[0].message, "Updated entry 5.");
  assert.equal(activityLog[activityLog.length - 1].message, `Updated entry ${ACTIVITY_LOG_LIMIT + 4}.`);
});
