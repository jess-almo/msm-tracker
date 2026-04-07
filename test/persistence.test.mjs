import test from "node:test";
import assert from "node:assert/strict";

import {
  BACKUP_SCHEMA_VERSION,
  parseBackupPayload,
  reconcileBreedingSessions,
  serializeBackupPayload,
} from "../src/utils/persistence.js";

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
