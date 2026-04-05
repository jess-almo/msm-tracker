import { createSheetMonstersFromRequirements } from "./monsterRequirements";
import { MONSTER_DIRECTORY } from "./monsterDatabase";
import { getMonsterBreedingIslands } from "../utils/monsterMetadata";

function createSheetKey(targetMonsterName)
{
  return targetMonsterName.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function createTrackerTemplateKey(systemKey, targetMonsterName)
{
  return `${systemKey}_${createSheetKey(targetMonsterName)}`;
}

function createTrackerInstanceKey(templateKey, instanceNumber = 1)
{
  return `${templateKey}__${instanceNumber}`;
}

function createDefaultSheetTitle(priority, targetMonsterName)
{
  return `Sheet ${priority} — ${targetMonsterName}`;
}

function createInstanceDisplayName(targetMonsterName, instanceNumber, supportsMultipleInstances)
{
  if (!supportsMultipleInstances)
  {
    return targetMonsterName;
  }

  return `${targetMonsterName} #${instanceNumber}`;
}

function createWublinTemplateNotes(timeLimitDays, totalEggs)
{
  const noteParts = ["Common Wublin template."];

  if (Number(timeLimitDays || 0) > 0)
  {
    noteParts.push(`Time limit: ${timeLimitDays} day${timeLimitDays === 1 ? "" : "s"}.`);
  }

  if (Number(totalEggs || 0) > 0)
  {
    noteParts.push(`Total eggs: ${totalEggs}.`);
  }

  return noteParts.join(" ");
}

export function createTrackerSheet({
  systemKey,
  targetMonsterName,
  collectionKey,
  collectionName,
  priority,
  sheetTitle,
  lanes = [],
  key,
  templateKey,
  instanceNumber = 1,
  supportsMultipleInstances = false,
  notes = "",
  templateNotes = "",
  totalEggs = 0,
  timeLimitDays = 0,
  displayName,
})
{
  const resolvedTemplateKey = templateKey || createTrackerTemplateKey(systemKey, targetMonsterName);
  const resolvedDisplayName = displayName
    || createInstanceDisplayName(targetMonsterName, instanceNumber, supportsMultipleInstances);
  const resolvedSheetTitle = sheetTitle
    || (supportsMultipleInstances
      ? resolvedDisplayName
      : createDefaultSheetTitle(priority, targetMonsterName));
  const resolvedNotes = notes || templateNotes || "";

  return {
    key: key || (
      supportsMultipleInstances
        ? createTrackerInstanceKey(resolvedTemplateKey, instanceNumber)
        : createSheetKey(targetMonsterName)
    ),
    type: "vessel",
    systemKey,
    templateKey: resolvedTemplateKey,
    templateName: targetMonsterName,
    instanceNumber,
    supportsMultipleInstances: Boolean(supportsMultipleInstances),
    displayName: resolvedDisplayName,
    monsterName: targetMonsterName,
    collectionKey,
    collectionName,
    sheetTitle: resolvedSheetTitle,
    priority,
    isActive: false,
    isCollected: false,
    status: "ACTIVE",
    lanes,
    monsters: createSheetMonstersFromRequirements(systemKey, targetMonsterName),
    notes: resolvedNotes,
    templateNotes: templateNotes || resolvedNotes,
    totalEggs: Number(totalEggs || 0),
    timeLimitDays: Number(timeLimitDays || 0),
  };
}

export function createTrackerSheetInstanceFromSeed(seedSheet, instanceNumber)
{
  const targetMonsterName = seedSheet.templateName || seedSheet.monsterName;
  const supportsMultipleInstances = Boolean(seedSheet.supportsMultipleInstances);
  const resolvedInstanceNumber = supportsMultipleInstances
    ? Math.max(1, Number(instanceNumber || seedSheet.instanceNumber || 1))
    : Math.max(1, Number(seedSheet.instanceNumber || 1));
  const resolvedTemplateKey = seedSheet.templateKey
    || createTrackerTemplateKey(seedSheet.systemKey, targetMonsterName);

  return createTrackerSheet({
    systemKey: seedSheet.systemKey,
    targetMonsterName,
    collectionKey: seedSheet.collectionKey,
    collectionName: seedSheet.collectionName,
    priority: seedSheet.priority,
    sheetTitle: supportsMultipleInstances
      ? createInstanceDisplayName(targetMonsterName, resolvedInstanceNumber, true)
      : seedSheet.sheetTitle,
    lanes: Array.isArray(seedSheet.lanes) ? seedSheet.lanes : [],
    key: supportsMultipleInstances
      ? createTrackerInstanceKey(resolvedTemplateKey, resolvedInstanceNumber)
      : seedSheet.key,
    templateKey: resolvedTemplateKey,
    instanceNumber: resolvedInstanceNumber,
    supportsMultipleInstances,
    notes: seedSheet.templateNotes || seedSheet.notes || "",
    templateNotes: seedSheet.templateNotes || seedSheet.notes || "",
    totalEggs: Number(seedSheet.totalEggs || 0),
    timeLimitDays: Number(seedSheet.timeLimitDays || 0),
    displayName: createInstanceDisplayName(
      targetMonsterName,
      resolvedInstanceNumber,
      supportsMultipleInstances
    ),
  });
}

const PASS_1_ISLAND_COLLECTION_ISLANDS = [
  "Plant",
  "Cold",
  "Air",
  "Water",
  "Earth",
  "Fire Haven",
  "Fire Oasis",
  "Light",
  "Psychic",
  "Faerie",
  "Bone",
  "Shugabush",
];

const PASS_1_ALLOWED_ISLAND_CATEGORIES = new Set([
  "natural",
  "fire",
  "magical",
  "mythical",
  "legendary",
]);

function shouldIncludeInIslandCollection(name, metadata, islandName)
{
  if (!metadata || !name || name.startsWith("Rare ") || name.startsWith("Epic ") || name.startsWith("Adult "))
  {
    return false;
  }

  if (!PASS_1_ALLOWED_ISLAND_CATEGORIES.has(metadata.category))
  {
    return false;
  }

  return getMonsterBreedingIslands(name).includes(islandName);
}

function createIslandCollectionMonsters(islandName)
{
  return Object.entries(MONSTER_DIRECTORY)
    .filter(([name, metadata]) => shouldIncludeInIslandCollection(name, metadata, islandName))
    .sort((a, b) =>
    {
      const aElements = Array.isArray(a[1].elements) ? a[1].elements.length : 0;
      const bElements = Array.isArray(b[1].elements) ? b[1].elements.length : 0;

      if (aElements !== bElements)
      {
        return aElements - bElements;
      }

      return a[0].localeCompare(b[0]);
    })
    .map(([name]) => ({
      name,
      required: 1,
      zapped: 0,
      breeding: 0,
      island: islandName,
      requirementIsland: islandName,
      breedingAssignments: {},
    }));
}

function createIslandCollectionSheet(islandName, priority)
{
  return {
    key: `${islandName.toLowerCase().replace(/[^a-z0-9]+/g, "_")}_collection`,
    type: "island",
    monsterName: islandName,
    island: islandName,
    collectionKey: "island_collections",
    collectionName: "Island Collections",
    sheetTitle: `${islandName} Collection`,
    priority,
    isActive: false,
    isCollected: false,
    status: "ACTIVE",
    lanes: [],
    monsters: createIslandCollectionMonsters(islandName),
    notes: "Pass 1 includes common-form breedable collection monsters for this island.",
  };
}

export const BOSKUS_DEFAULT = createTrackerSheet({
  systemKey: "amber",
  targetMonsterName: "Boskus",
  collectionKey: "amber_island",
  collectionName: "Amber Island",
  priority: 1,
  sheetTitle: "Sheet 3 — Boskus",
  lanes: [
    { island: "Air", task: "Riff → Pango → Cybop" },
    { island: "Fire Oasis", task: "Floogull → Kayna → Bridg-it" },
    { island: "Plant", task: "Bowgart → Furcorn" },
  ],
});

export const ZIGGURAB_DEFAULT = createTrackerSheet({
  systemKey: "amber",
  targetMonsterName: "Ziggurab",
  collectionKey: "amber_island",
  collectionName: "Amber Island",
  priority: 2,
  sheetTitle: "Sheet 4 — Ziggurab",
  lanes: [
    { island: "Fire Oasis", task: "Boskus + Wynq" },
    { island: "Earth", task: "Quarrister" },
  ],
});

const AMBER_TRACKABLE_SHEET_CONFIGS = [
  { targetMonsterName: "Kayna", priority: 1 },
  { targetMonsterName: "Glowl", priority: 2 },
  { targetMonsterName: "Flowah", priority: 3 },
  { targetMonsterName: "Stogg", priority: 4 },
  { targetMonsterName: "Phangler", priority: 5 },
  { targetMonsterName: "Barrb", priority: 7 },
  { targetMonsterName: "Floogull", priority: 8 },
  { targetMonsterName: "Whaddle", priority: 9 },
  { targetMonsterName: "Woolabee", priority: 10 },
  { targetMonsterName: "Repatillo", priority: 11 },
  { targetMonsterName: "Rootitoot", priority: 12 },
  { targetMonsterName: "Sooza", priority: 13 },
  { targetMonsterName: "Thrumble", priority: 14 },
  { targetMonsterName: "Wynq", priority: 16 },
  { targetMonsterName: "Sneyser", priority: 17 },
  { targetMonsterName: "Tring", priority: 18 },
  { targetMonsterName: "Viveine", priority: 19 },
  { targetMonsterName: "Incisaur", priority: 20 },
  { targetMonsterName: "Yelmut", priority: 21 },
  { targetMonsterName: "Flum Ox", priority: 22 },
  { targetMonsterName: "Krillby", priority: 23 },
  { targetMonsterName: "Edamimi", priority: 24 },
  { targetMonsterName: "PongPing", priority: 25 },
  { targetMonsterName: "Tiawa", priority: 26 },
  { targetMonsterName: "Bisonorus", priority: 27 },
  { targetMonsterName: "Bowhead", priority: 28 },
  { targetMonsterName: "Drummidary", priority: 29 },
  { targetMonsterName: "Tuskski", priority: 30 },
  { targetMonsterName: "Gnarls", priority: 31 },
  { targetMonsterName: "Candelavra", priority: 32 },
];

const COMMON_WUBLIN_TRACKABLE_SHEET_CONFIGS = [
  { targetMonsterName: "Brump", priority: 101, totalEggs: 8, timeLimitDays: 2 },
  { targetMonsterName: "Zynth", priority: 102, totalEggs: 6, timeLimitDays: 3 },
  { targetMonsterName: "Poewk", priority: 103, totalEggs: 11, timeLimitDays: 5 },
  { targetMonsterName: "Thwok", priority: 104, totalEggs: 25, timeLimitDays: 7 },
  { targetMonsterName: "Dwumrohl", priority: 105, totalEggs: 71, timeLimitDays: 14 },
  { targetMonsterName: "Zuuker", priority: 106, totalEggs: 30, timeLimitDays: 10 },
  { targetMonsterName: "Screemu", priority: 107, totalEggs: 20, timeLimitDays: 5 },
  { targetMonsterName: "Tympa", priority: 108, totalEggs: 68, timeLimitDays: 14 },
  { targetMonsterName: "Dermit", priority: 109, totalEggs: 26, timeLimitDays: 3 },
  { targetMonsterName: "Gheegur", priority: 110, totalEggs: 26, timeLimitDays: 7 },
  { targetMonsterName: "Whajje", priority: 111, totalEggs: 43, timeLimitDays: 10 },
  { targetMonsterName: "Creepuscule", priority: 112, totalEggs: 52, timeLimitDays: 7 },
  { targetMonsterName: "Blipsqueak", priority: 113, totalEggs: 24, timeLimitDays: 5 },
  { targetMonsterName: "Scargo", priority: 114, totalEggs: 16, timeLimitDays: 3 },
  { targetMonsterName: "Astropod", priority: 115, totalEggs: 42, timeLimitDays: 10 },
  { targetMonsterName: "Pixolotl", priority: 116, totalEggs: 62, timeLimitDays: 14 },
  { targetMonsterName: "Bona-Petite", priority: 117, totalEggs: 68, timeLimitDays: 10 },
  { targetMonsterName: "Maulch", priority: 118, totalEggs: 38, timeLimitDays: 7 },
  { targetMonsterName: "Fleechwurm", priority: 119, totalEggs: 24, timeLimitDays: 5 },
];

export const AMBER_TRACKER_SHEET_DEFAULTS = AMBER_TRACKABLE_SHEET_CONFIGS.map((config) =>
  createTrackerSheet({
    systemKey: "amber",
    targetMonsterName: config.targetMonsterName,
    collectionKey: "amber_island",
    collectionName: "Amber Island",
    priority: config.priority,
    lanes: [],
  })
);

export const WUBLIN_TRACKER_SHEET_DEFAULTS = COMMON_WUBLIN_TRACKABLE_SHEET_CONFIGS.map((config) =>
  createTrackerSheet({
    systemKey: "wublin",
    targetMonsterName: config.targetMonsterName,
    collectionKey: "wublins",
    collectionName: "Wublins",
    priority: config.priority,
    supportsMultipleInstances: true,
    templateKey: createTrackerTemplateKey("wublin", config.targetMonsterName),
    instanceNumber: 1,
    sheetTitle: createInstanceDisplayName(config.targetMonsterName, 1, true),
    displayName: createInstanceDisplayName(config.targetMonsterName, 1, true),
    templateNotes: createWublinTemplateNotes(config.timeLimitDays, config.totalEggs),
    totalEggs: config.totalEggs,
    timeLimitDays: config.timeLimitDays,
  })
);

export const ISLAND_COLLECTION_SHEET_DEFAULTS = PASS_1_ISLAND_COLLECTION_ISLANDS
  .map((islandName, index) => createIslandCollectionSheet(islandName, 200 + index))
  .filter((sheet) => sheet.monsters.length > 0);

export const TRACKER_SHEET_DEFAULTS = [
  BOSKUS_DEFAULT,
  ZIGGURAB_DEFAULT,
  ...AMBER_TRACKER_SHEET_DEFAULTS,
  ...WUBLIN_TRACKER_SHEET_DEFAULTS,
  ...ISLAND_COLLECTION_SHEET_DEFAULTS,
];
