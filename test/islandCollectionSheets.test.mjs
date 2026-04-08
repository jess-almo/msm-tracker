import test from "node:test";
import assert from "node:assert/strict";

import { ISLAND_COLLECTION_SHEET_DEFAULTS } from "../src/data/sheets.js";
import { buildIslandPlannerData } from "../src/utils/queue.js";

function getIslandCollectionSheet(islandName)
{
  return ISLAND_COLLECTION_SHEET_DEFAULTS.find((sheet) => sheet.island === islandName);
}

test("Faerie collection uses the explicit roster with collection-only special entries", () =>
{
  const faerieSheet = getIslandCollectionSheet("Faerie");
  const names = faerieSheet.monsters.map((monster) => monster.name);
  const boskus = faerieSheet.monsters.find((monster) => monster.name === "Boskus");
  const krillby = faerieSheet.monsters.find((monster) => monster.name === "Krillby");
  const doDipster = faerieSheet.monsters.find((monster) => monster.name === "Do");
  const ffidyll = faerieSheet.monsters.find((monster) => monster.name === "Ffidyll");

  assert.ok(faerieSheet, "Faerie collection sheet should exist");
  assert.ok(names.includes("Boskus"));
  assert.ok(names.includes("Ziggurab"));
  assert.ok(names.includes("Krillby"));
  assert.ok(names.includes("PongPing"));
  assert.ok(names.includes("Tuskski"));
  assert.ok(names.includes("Ffidyll"));
  assert.ok(names.includes("Do"));
  assert.ok(names.includes("Ti"));
  assert.equal(boskus.showInOperations, true);
  assert.equal(krillby.showInOperations, false);
  assert.equal(krillby.acquisitionType, "market_relics");
  assert.equal(doDipster.showInOperations, false);
  assert.equal(doDipster.acquisitionType, "keys");
  assert.equal(ffidyll.showInOperations, false);
  assert.equal(ffidyll.acquisitionType, "seasonal");
});

test("Faerie planner demand skips collection-only monsters", () =>
{
  const faerieSheet = getIslandCollectionSheet("Faerie");
  const planner = buildIslandPlannerData(
    [faerieSheet],
    [
      {
        name: "Faerie",
        group: "magical",
        type: "breeding",
        isUnlocked: true,
        breedingStructures: 2,
        maxBreedingStructures: 2,
        nurseries: 2,
        maxNurseries: 2,
      },
    ],
    []
  );
  const faerieEntry = planner.find((entry) => entry.island === "Faerie");
  const plannerNames = faerieEntry.collectionMissing.map((item) => item.name);

  assert.ok(plannerNames.includes("Boskus"));
  assert.ok(plannerNames.includes("Ziggurab"));
  assert.ok(!plannerNames.includes("Krillby"));
  assert.ok(!plannerNames.includes("PongPing"));
  assert.ok(!plannerNames.includes("Tuskski"));
  assert.ok(!plannerNames.includes("Ffidyll"));
  assert.ok(!plannerNames.includes("Do"));
  assert.ok(!plannerNames.includes("Ti"));
});

test("Faerie collection demand stays on the island card until the monster is collected", () =>
{
  const faerieSheet = getIslandCollectionSheet("Faerie");
  const sheetWithTrackedBoskus = {
    ...faerieSheet,
    monsters: faerieSheet.monsters.map((monster) =>
    {
      if (monster.name !== "Boskus")
      {
        return monster;
      }

      return {
        ...monster,
        zapped: 0,
        breeding: 1,
      };
    }),
  };

  const planner = buildIslandPlannerData(
    [sheetWithTrackedBoskus],
    [
      {
        name: "Faerie",
        group: "magical",
        type: "breeding",
        isUnlocked: true,
        breedingStructures: 2,
        maxBreedingStructures: 2,
        nurseries: 2,
        maxNurseries: 2,
      },
    ],
    []
  );
  const faerieEntry = planner.find((entry) => entry.island === "Faerie");
  const boskusEntry = faerieEntry.collectionMissing.find((item) => item.name === "Boskus");

  assert.ok(boskusEntry, "Boskus should stay visible until it is actually collected");
  assert.equal(boskusEntry.remaining, 1);
  assert.equal(boskusEntry.actualRemaining, 1);
  assert.equal(boskusEntry.queueRemaining, 0);
});

test("Faerie island card still shows collection gaps from inactive island sheets", () =>
{
  const faerieSheet = getIslandCollectionSheet("Faerie");
  const inactiveFaerieSheet = {
    ...faerieSheet,
    isActive: false,
    monsters: faerieSheet.monsters.map((monster) =>
    {
      if (monster.name !== "Ziggurab")
      {
        return monster;
      }

      return {
        ...monster,
        zapped: 0,
        breeding: 0,
      };
    }),
  };

  const planner = buildIslandPlannerData(
    [],
    [
      {
        name: "Faerie",
        group: "magical",
        type: "breeding",
        isUnlocked: true,
        breedingStructures: 2,
        maxBreedingStructures: 2,
        nurseries: 2,
        maxNurseries: 2,
      },
    ],
    [],
    [inactiveFaerieSheet]
  );
  const faerieEntry = planner.find((entry) => entry.island === "Faerie");
  const plannerNames = faerieEntry.collectionMissing.map((item) => item.name);

  assert.ok(plannerNames.includes("Ziggurab"));
});
