import test from "node:test";
import assert from "node:assert/strict";

import {
  applyCollectionEntryStatus,
  getCollectionEntryStatus,
  getSheetProgressState,
} from "../src/utils/collectionStatus.js";

function createSheet(overrides = {})
{
  return {
    key: "sheet_1",
    isActive: false,
    isCollected: false,
    monsters: [
      {
        name: "Congle",
        required: 2,
        zapped: 0,
        breeding: 0,
      },
    ],
    ...overrides,
  };
}

test("getSheetProgressState treats collected sheets as complete truth", () =>
{
  const progress = getSheetProgressState(
    createSheet({
      isCollected: true,
      monsters: [
        {
          name: "Congle",
          required: 2,
          zapped: 0,
          breeding: 0,
        },
      ],
    })
  );

  assert.equal(progress.complete, true);
  assert.equal(progress.percent, 0);
});

test("getCollectionEntryStatus marks active runs ahead of manual partial state", () =>
{
  const status = getCollectionEntryStatus(
    {
      name: "Zynth",
      collected: false,
      status: "in_progress",
    },
    [createSheet({ isActive: true })]
  );

  assert.equal(status, "active");
});

test("getCollectionEntryStatus treats tracked sheet progress as in progress", () =>
{
  const status = getCollectionEntryStatus(
    {
      name: "Zynth",
      collected: false,
      status: "inactive",
    },
    [
      createSheet({
        monsters: [
          {
            name: "Congle",
            required: 2,
            zapped: 0,
            breeding: 1,
          },
        ],
      }),
    ]
  );

  assert.equal(status, "in_progress");
});

test("getCollectionEntryStatus treats any completed duplicate run as collection complete", () =>
{
  const status = getCollectionEntryStatus(
    {
      name: "Zynth",
      collected: false,
      status: "inactive",
    },
    [
      createSheet({ key: "sheet_1" }),
      createSheet({
        key: "sheet_2",
        monsters: [
          {
            name: "Congle",
            required: 2,
            zapped: 2,
            breeding: 0,
          },
        ],
      }),
    ]
  );

  assert.equal(status, "complete");
});

test("applyCollectionEntryStatus normalizes clear and partial states", () =>
{
  assert.deepEqual(
    applyCollectionEntryStatus(
      {
        name: "Zynth",
        collected: true,
        status: "complete",
      },
      "not_started"
    ),
    {
      name: "Zynth",
      collected: false,
      status: "not_started",
    }
  );

  assert.deepEqual(
    applyCollectionEntryStatus(
      {
        name: "Zynth",
        collected: false,
        status: "inactive",
      },
      "partial"
    ),
    {
      name: "Zynth",
      collected: false,
      status: "in_progress",
    }
  );
});
