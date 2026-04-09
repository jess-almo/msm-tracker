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

test("Faerie planner demand shows up to three operational monsters and skips collection-only entries", () =>
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

  assert.equal(plannerNames.length, 3);
  assert.deepEqual(plannerNames, ["Drumpler", "Stogg", "HippityHop"]);
  assert.ok(!plannerNames.includes("Krillby"));
  assert.ok(!plannerNames.includes("PongPing"));
  assert.ok(!plannerNames.includes("Tuskski"));
  assert.ok(!plannerNames.includes("Ffidyll"));
  assert.ok(!plannerNames.includes("Do"));
  assert.ok(!plannerNames.includes("Ti"));
});

test("Faerie collection demand prefers manual focus picks before fallback recommendations", () =>
{
  const faerieSheet = getIslandCollectionSheet("Faerie");
  const sheetWithFocusedBoskusAndZiggurab = {
    ...faerieSheet,
    monsters: faerieSheet.monsters.map((monster) =>
    {
      if (monster.name === "Boskus")
      {
        return {
          ...monster,
          collectionFocusRank: 1,
        };
      }

      if (monster.name === "Ziggurab")
      {
        return {
          ...monster,
          collectionFocusRank: 2,
        };
      }

      return monster;
    }),
  };

  const planner = buildIslandPlannerData(
    [sheetWithFocusedBoskusAndZiggurab],
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

  assert.deepEqual(plannerNames, ["Boskus", "Ziggurab", "Drumpler"]);
});

test("invalid island collection focus ranks do not count as real focus slots", () =>
{
  const faerieSheet = getIslandCollectionSheet("Faerie");
  const sheetWithInvalidFocusRanks = {
    ...faerieSheet,
    monsters: faerieSheet.monsters.map((monster) =>
    {
      if (monster.name === "Boskus")
      {
        return {
          ...monster,
          collectionFocusRank: 0,
        };
      }

      if (monster.name === "Ziggurab")
      {
        return {
          ...monster,
          collectionFocusRank: null,
        };
      }

      return monster;
    }),
  };

  const planner = buildIslandPlannerData(
    [sheetWithInvalidFocusRanks],
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

  assert.deepEqual(plannerNames, ["Drumpler", "Stogg", "HippityHop"]);
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
        collectionFocusRank: 1,
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
        collectionFocusRank: 1,
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

test("Light collection uses the explicit roster with collection-only special entries", () =>
{
  const lightSheet = getIslandCollectionSheet("Light");
  const names = lightSheet.monsters.map((monster) => monster.name);
  const boskus = lightSheet.monsters.find((monster) => monster.name === "Boskus");
  const yelmut = lightSheet.monsters.find((monster) => monster.name === "Yelmut");
  const whizBang = lightSheet.monsters.find((monster) => monster.name === "Whiz-bang");
  const doDipster = lightSheet.monsters.find((monster) => monster.name === "Do");
  const phlox = lightSheet.monsters.find((monster) => monster.name === "Phosphoran Phlox");

  assert.ok(lightSheet, "Light collection sheet should exist");
  assert.ok(names.includes("Boskus"));
  assert.ok(names.includes("Bulbo"));
  assert.ok(names.includes("Blow't"));
  assert.ok(names.includes("Yelmut"));
  assert.ok(names.includes("Tiawa"));
  assert.ok(names.includes("Drummidary"));
  assert.ok(names.includes("Whiz-bang"));
  assert.ok(names.includes("Phosphoran Phlox"));
  assert.ok(names.includes("Do"));
  assert.ok(names.includes("Ti"));
  assert.equal(boskus.showInOperations, true);
  assert.equal(yelmut.showInOperations, false);
  assert.equal(yelmut.acquisitionType, "market_relics");
  assert.equal(whizBang.showInOperations, false);
  assert.equal(whizBang.acquisitionType, "seasonal");
  assert.equal(doDipster.showInOperations, false);
  assert.equal(doDipster.acquisitionType, "keys");
  assert.equal(phlox.showInOperations, false);
});

test("Light planner demand shows up to three operational monsters and skips collection-only entries", () =>
{
  const lightSheet = getIslandCollectionSheet("Light");
  const planner = buildIslandPlannerData(
    [lightSheet],
    [
      {
        name: "Light",
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
  const lightEntry = planner.find((entry) => entry.island === "Light");
  const plannerNames = lightEntry.collectionMissing.map((item) => item.name);

  assert.equal(plannerNames.length, 3);
  assert.deepEqual(plannerNames, ["Furcorn", "Flowah", "Gob"]);
  assert.ok(!plannerNames.includes("Yelmut"));
  assert.ok(!plannerNames.includes("Tiawa"));
  assert.ok(!plannerNames.includes("Drummidary"));
  assert.ok(!plannerNames.includes("Whiz-bang"));
  assert.ok(!plannerNames.includes("Do"));
  assert.ok(!plannerNames.includes("Ti"));
  assert.ok(!plannerNames.includes("Phosphoran Phlox"));
});

test("Light planner still skips collection-only monsters when saved sheet flags are stale", () =>
{
  const lightSheet = getIslandCollectionSheet("Light");
  const staleSavedLightSheet = {
    ...lightSheet,
    monsters: lightSheet.monsters.map((monster) =>
    {
      if (!["Yelmut", "Tiawa", "Drummidary"].includes(monster.name))
      {
        return monster;
      }

      return {
        ...monster,
        showInOperations: true,
        acquisitionType: "breed",
      };
    }),
  };

  const planner = buildIslandPlannerData(
    [staleSavedLightSheet],
    [
      {
        name: "Light",
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
  const lightEntry = planner.find((entry) => entry.island === "Light");
  const plannerNames = lightEntry.collectionMissing.map((item) => item.name);

  assert.ok(!plannerNames.includes("Yelmut"));
  assert.ok(!plannerNames.includes("Tiawa"));
  assert.ok(!plannerNames.includes("Drummidary"));
});

test("Mirror Faerie uses the curated Faerie roster instead of broad breeding inference", () =>
{
  const mirrorFaerieSheet = getIslandCollectionSheet("Mirror Faerie");
  const names = mirrorFaerieSheet.monsters.map((monster) => monster.name);
  const krillby = mirrorFaerieSheet.monsters.find((monster) => monster.name === "Krillby");
  const ffidyll = mirrorFaerieSheet.monsters.find((monster) => monster.name === "Ffidyll");

  assert.ok(mirrorFaerieSheet, "Mirror Faerie collection sheet should exist");
  assert.ok(names.includes("Boskus"));
  assert.ok(names.includes("Ziggurab"));
  assert.ok(names.includes("Krillby"));
  assert.ok(names.includes("Ffidyll"));
  assert.equal(krillby.showInOperations, false);
  assert.equal(ffidyll.showInOperations, false);
});

test("Mirror Light keeps collection-only magical specials out of planner demand", () =>
{
  const mirrorLightSheet = getIslandCollectionSheet("Mirror Light");
  const planner = buildIslandPlannerData(
    [mirrorLightSheet],
    [
      {
        name: "Mirror Light",
        group: "mirror",
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
  const mirrorLightEntry = planner.find((entry) => entry.island === "Mirror Light");
  const plannerNames = mirrorLightEntry.collectionMissing.map((item) => item.name);

  assert.deepEqual(plannerNames, ["Furcorn", "Flowah", "Gob"]);
  assert.ok(!plannerNames.includes("Yelmut"));
  assert.ok(!plannerNames.includes("Whiz-bang"));
  assert.ok(!plannerNames.includes("Phosphoran Phlox"));
});
