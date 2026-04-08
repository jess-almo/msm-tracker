import { createSheetMonstersFromRequirements } from "./monsterRequirements.js";
import { MONSTER_DIRECTORY } from "./monsterDatabase.js";
import { getMonsterBreedingIslands } from "../utils/monsterMetadata.js";
import {
  getIslandOperationalProfile,
  ISLAND_STATE_DEFAULTS,
} from "./islands.js";

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
  allowsDuplicateRuns = true,
  isDuplicateInstance = false,
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
    allowsDuplicateRuns: Boolean(allowsDuplicateRuns),
    isDuplicateInstance: Boolean(isDuplicateInstance),
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

export function createTrackerSheetInstanceFromSeed(seedSheet, instanceNumber, options = {})
{
  const targetMonsterName = seedSheet.templateName || seedSheet.monsterName;
  const supportsMultipleInstances = Boolean(seedSheet.supportsMultipleInstances);
  const forceDuplicateInstance = Boolean(options.forceDuplicateInstance);
  const shouldUseInstanceIdentity = Boolean(
    supportsMultipleInstances
    || seedSheet.isDuplicateInstance
    || forceDuplicateInstance
    || Math.max(1, Number(instanceNumber || seedSheet.instanceNumber || 1)) > 1
  );
  const resolvedInstanceNumber = shouldUseInstanceIdentity
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
    sheetTitle: shouldUseInstanceIdentity
      ? createInstanceDisplayName(targetMonsterName, resolvedInstanceNumber, true)
      : seedSheet.sheetTitle,
    lanes: Array.isArray(seedSheet.lanes) ? seedSheet.lanes : [],
    key: shouldUseInstanceIdentity
      ? createTrackerInstanceKey(resolvedTemplateKey, resolvedInstanceNumber)
      : seedSheet.key,
    templateKey: resolvedTemplateKey,
    instanceNumber: resolvedInstanceNumber,
    supportsMultipleInstances,
    allowsDuplicateRuns: seedSheet.allowsDuplicateRuns !== false,
    isDuplicateInstance: shouldUseInstanceIdentity,
    notes: seedSheet.templateNotes || seedSheet.notes || "",
    templateNotes: seedSheet.templateNotes || seedSheet.notes || "",
    totalEggs: Number(seedSheet.totalEggs || 0),
    timeLimitDays: Number(seedSheet.timeLimitDays || 0),
    displayName: createInstanceDisplayName(
      targetMonsterName,
      resolvedInstanceNumber,
      shouldUseInstanceIdentity
    ),
  });
}

const BASE_ISLAND_COLLECTION_ISLANDS = ISLAND_STATE_DEFAULTS
  .filter((islandState) =>
  {
    const profile = getIslandOperationalProfile(islandState.name, islandState.type);

    return profile.supportsStandardBreeding;
  })
  .map((islandState) => islandState.name);

const BASE_ISLAND_ALLOWED_CATEGORIES = new Set([
  "natural",
  "fire",
  "magical",
  "ethereal",
  "seasonal",
  "mythical",
  "legendary",
  "dipster",
]);

const NON_OPERATIONAL_ISLAND_COLLECTION_MONSTERS = new Set([
  "Do",
  "Re",
  "Mi",
  "Fa",
  "Sol",
  "La",
  "Ti",
  "Krillby",
  "PongPing",
  "Tuskski",
  "Owlesque",
  "Faesoddoid Fungus",
]);

const FAERIE_ISLAND_COLLECTION_ROSTER = [
  { name: "Noggin" },
  { name: "Mammott" },
  { name: "Kayna" },
  { name: "Floot Fly" },
  { name: "Drumpler" },
  { name: "Stogg" },
  { name: "HippityHop" },
  { name: "Boskus" },
  { name: "Squot" },
  { name: "Wimmzies" },
  { name: "Ziggurab" },
  { name: "Cantorell" },
  { name: "Bridg-It" },
  { name: "Clavi Gnat" },
  { name: "Pladdie" },
  { name: "Krillby", acquisitionType: "market_relics", showInOperations: false },
  { name: "PongPing", acquisitionType: "market_relics", showInOperations: false },
  { name: "Tuskski", acquisitionType: "market_relics", showInOperations: false },
  { name: "Owlesque", acquisitionType: "special", showInOperations: false },
  { name: "Faesoddoid Fungus", acquisitionType: "special", showInOperations: false },
  { name: "Ffidyll", acquisitionType: "seasonal", showInOperations: false },
  { name: "Do", acquisitionType: "keys", showInOperations: false },
  { name: "Re", acquisitionType: "keys", showInOperations: false },
  { name: "Mi", acquisitionType: "keys", showInOperations: false },
  { name: "Fa", acquisitionType: "keys", showInOperations: false },
  { name: "Sol", acquisitionType: "keys", showInOperations: false },
  { name: "La", acquisitionType: "keys", showInOperations: false },
  { name: "Ti", acquisitionType: "keys", showInOperations: false },
];

const LIGHT_ISLAND_COLLECTION_ROSTER = [
  { name: "Potbelly" },
  { name: "Mammott" },
  { name: "Kayna" },
  { name: "Fluoress" },
  { name: "Furcorn" },
  { name: "Flowah" },
  { name: "Gob" },
  { name: "Boskus" },
  { name: "Bulbo" },
  { name: "Pluckbill" },
  { name: "Sooza" },
  { name: "Spytrap" },
  { name: "TooToo" },
  { name: "Fiddlement" },
  { name: "Blow't" },
  { name: "Yelmut", acquisitionType: "market_relics", showInOperations: false },
  { name: "Tiawa", acquisitionType: "market_relics", showInOperations: false },
  { name: "Drummidary", acquisitionType: "market_relics", showInOperations: false },
  { name: "Whiz-bang", acquisitionType: "seasonal", showInOperations: false },
  { name: "Shhimmer", acquisitionType: "special", showInOperations: false },
  { name: "Phosphoran Phlox", acquisitionType: "special", showInOperations: false },
  { name: "Do", acquisitionType: "keys", showInOperations: false },
  { name: "Re", acquisitionType: "keys", showInOperations: false },
  { name: "Mi", acquisitionType: "keys", showInOperations: false },
  { name: "Fa", acquisitionType: "keys", showInOperations: false },
  { name: "Sol", acquisitionType: "keys", showInOperations: false },
  { name: "La", acquisitionType: "keys", showInOperations: false },
  { name: "Ti", acquisitionType: "keys", showInOperations: false },
];

const ISLAND_COLLECTION_ROSTER_OVERRIDES = {
  Faerie: FAERIE_ISLAND_COLLECTION_ROSTER,
  Light: LIGHT_ISLAND_COLLECTION_ROSTER,
};

function getIslandCollectionRosterEntry(islandName, monsterName)
{
  const roster = ISLAND_COLLECTION_ROSTER_OVERRIDES[islandName];

  if (!Array.isArray(roster))
  {
    return null;
  }

  return roster.find((entry) => entry.name === monsterName) || null;
}

function shouldIncludeInDerivedIslandCollection(name, metadata, islandName)
{
  if (!metadata || !name || name.startsWith("Rare ") || name.startsWith("Epic ") || name.startsWith("Adult "))
  {
    return false;
  }

  if (!BASE_ISLAND_ALLOWED_CATEGORIES.has(metadata.category))
  {
    return false;
  }

  return getMonsterBreedingIslands(name).includes(islandName);
}

function getIslandCollectionAcquisitionType(name, metadata)
{
  if (NON_OPERATIONAL_ISLAND_COLLECTION_MONSTERS.has(name))
  {
    if (["Do", "Re", "Mi", "Fa", "Sol", "La", "Ti"].includes(name))
    {
      return "keys";
    }

    if (["Krillby", "PongPing", "Tuskski"].includes(name))
    {
      return "market_relics";
    }

    return "special";
  }

  if (metadata?.category === "dipster")
  {
    return "keys";
  }

  if (metadata?.category === "seasonal")
  {
    return "seasonal";
  }

  if (Array.isArray(metadata?.elements) && metadata.elements.length === 1 && metadata?.category !== "mythical")
  {
    return "market";
  }

  return "breed";
}

function shouldShowIslandCollectionMonsterInOperations(name, metadata, acquisitionType)
{
  if (acquisitionType !== "breed")
  {
    return false;
  }

  if (metadata?.category === "seasonal" || metadata?.category === "dipster")
  {
    return false;
  }

  return !NON_OPERATIONAL_ISLAND_COLLECTION_MONSTERS.has(name);
}

function createIslandCollectionMonster(name, islandName, overrides = {})
{
  const metadata = MONSTER_DIRECTORY[name] || null;
  const acquisitionType = overrides.acquisitionType || getIslandCollectionAcquisitionType(name, metadata);
  const showInOperations = typeof overrides.showInOperations === "boolean"
    ? overrides.showInOperations
    : shouldShowIslandCollectionMonsterInOperations(name, metadata, acquisitionType);

  return {
    name,
    required: 1,
    zapped: 0,
    breeding: 0,
    island: islandName,
    requirementIsland: islandName,
    breedingAssignments: {},
    acquisitionType,
    showInCollection: true,
    showInOperations,
  };
}

function createIslandCollectionMonsters(islandName)
{
  const explicitRoster = ISLAND_COLLECTION_ROSTER_OVERRIDES[islandName];

  if (Array.isArray(explicitRoster) && explicitRoster.length > 0)
  {
    return explicitRoster.map((entry) =>
      createIslandCollectionMonster(entry.name, islandName, entry)
    );
  }

  return Object.entries(MONSTER_DIRECTORY)
    .filter(([name, metadata]) => shouldIncludeInDerivedIslandCollection(name, metadata, islandName))
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
    .map(([name]) => createIslandCollectionMonster(name, islandName));
}

export function resolveIslandCollectionMonsterPolicy(monster, islandName = "")
{
  const resolvedIslandName = islandName || monster?.requirementIsland || monster?.island || "";
  const name = monster?.name || "";
  const metadata = MONSTER_DIRECTORY[name] || null;
  const rosterEntry = getIslandCollectionRosterEntry(resolvedIslandName, name);
  const acquisitionType = rosterEntry?.acquisitionType
    || monster?.acquisitionType
    || getIslandCollectionAcquisitionType(name, metadata);
  const showInOperations = typeof rosterEntry?.showInOperations === "boolean"
    ? rosterEntry.showInOperations
    : (typeof monster?.showInOperations === "boolean"
      ? monster.showInOperations
      : shouldShowIslandCollectionMonsterInOperations(name, metadata, acquisitionType));

  return {
    acquisitionType,
    showInOperations,
    requirementIsland: resolvedIslandName,
  };
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
    allowsDuplicateRuns: false,
    status: "ACTIVE",
    lanes: [],
    monsters: createIslandCollectionMonsters(islandName),
    notes: "Base collection tracker for this island. Rare and Epic variants stay separate and can layer in later as their own collection targets.",
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

export const ISLAND_COLLECTION_SHEET_DEFAULTS = BASE_ISLAND_COLLECTION_ISLANDS
  .map((islandName, index) => createIslandCollectionSheet(islandName, 200 + index))
  .filter((sheet) => sheet.monsters.length > 0);

export const TRACKER_SHEET_DEFAULTS = [
  BOSKUS_DEFAULT,
  ZIGGURAB_DEFAULT,
  ...AMBER_TRACKER_SHEET_DEFAULTS,
  ...WUBLIN_TRACKER_SHEET_DEFAULTS,
  ...ISLAND_COLLECTION_SHEET_DEFAULTS,
];
