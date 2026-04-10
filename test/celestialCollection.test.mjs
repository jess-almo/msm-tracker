import test from "node:test";
import assert from "node:assert/strict";

import { COLLECTIONS } from "../src/data/collections.js";
import { MONSTER_REQUIREMENTS } from "../src/data/monsterRequirements.js";
import { CELESTIAL_TRACKER_SHEET_DEFAULTS } from "../src/data/sheets.js";

const YOUNG_CELESTIAL_EGG_TOTALS = {
  Hornacle: 118,
  Furnoss: 94,
  Glaishur: 87,
  Blasoom: 72,
  Syncopite: 174,
  Vhamp: 195,
  Galvana: 150,
  Scaratar: 123,
  Loodvigg: 121,
  Torrt: 87,
  Plixie: 249,
  Attmoz: 65,
};

test("Celestial collection is active with young Celestial entries", () =>
{
  const collection = COLLECTIONS.find((item) => item.key === "celestials");
  const entryNames = collection.entries.map((entry) => entry.name);

  assert.equal(collection.status, "active");
  assert.deepEqual(entryNames, Object.keys(YOUNG_CELESTIAL_EGG_TOTALS));
});

test("young Celestial tracker defaults match imported egg totals", () =>
{
  assert.equal(CELESTIAL_TRACKER_SHEET_DEFAULTS.length, 12);

  CELESTIAL_TRACKER_SHEET_DEFAULTS.forEach((sheet) =>
  {
    const expectedTotal = YOUNG_CELESTIAL_EGG_TOTALS[sheet.monsterName];
    const requirementTotal = MONSTER_REQUIREMENTS.celestial[sheet.monsterName]
      .reduce((sum, item) => sum + Number(item.count || 0), 0);

    assert.equal(sheet.systemKey, "celestial");
    assert.equal(sheet.collectionKey, "celestials");
    assert.equal(sheet.totalEggs, expectedTotal);
    assert.equal(requirementTotal, expectedTotal);
    assert.equal(sheet.monsters.length, MONSTER_REQUIREMENTS.celestial[sheet.monsterName].length);
  });
});
