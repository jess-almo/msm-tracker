import { getIslandOperationalProfile } from "../data/islands";
import { getMonsterBreedingIslands } from "./monsterMetadata";

function compareEntries(a, b)
{
  if (a.sheetPriority !== b.sheetPriority)
  {
    return a.sheetPriority - b.sheetPriority;
  }

  if (a.activatedOrder !== b.activatedOrder)
  {
    return a.activatedOrder - b.activatedOrder;
  }

  if (a.sheetIndex !== b.sheetIndex)
  {
    return a.sheetIndex - b.sheetIndex;
  }

  if (a.monsterIndex !== b.monsterIndex)
  {
    return a.monsterIndex - b.monsterIndex;
  }

  return a.name.localeCompare(b.name);
}

function normalizeSheets(sheets)
{
  return Array.isArray(sheets) ? sheets : [];
}

function normalizeSessions(sessions)
{
  return Array.isArray(sessions) ? sessions : [];
}

function getActiveSheetsInOrder(sheets)
{
  const activeSheets = normalizeSheets(sheets)
    .map((sheet, sheetIndex) => ({ ...sheet, sheetIndex }))
    .filter((sheet) => sheet.status === "ACTIVE" && sheet.isActive);

  return [...activeSheets].sort((a, b) =>
  {
    const aActivatedAt = a.activatedAt || "";
    const bActivatedAt = b.activatedAt || "";

    if (aActivatedAt && bActivatedAt && aActivatedAt !== bActivatedAt)
    {
      return aActivatedAt.localeCompare(bActivatedAt);
    }

    if (aActivatedAt !== bActivatedAt)
    {
      return aActivatedAt ? -1 : 1;
    }

    if ((a.priority ?? 999) !== (b.priority ?? 999))
    {
      return (a.priority ?? 999) - (b.priority ?? 999);
    }

    return a.sheetIndex - b.sheetIndex;
  });
}

function getActivationOrderByKey(activeSheets)
{
  return new Map(activeSheets.map((sheet, index) => [sheet.key, index]));
}

function buildRemainingEntry(monster, monsterIndex, sheet, activatedOrder)
{
  const required = Number(monster.required || 0);
  const zapped = Number(monster.zapped || 0);
  const breeding = Number(monster.breeding || 0);
  const queueRemaining = Math.max(0, required - zapped - breeding);
  const actualRemaining = Math.max(0, required - zapped);

  if (queueRemaining <= 0)
  {
    return null;
  }

  const validBreedingIslands = getMonsterBreedingIslands(monster.name);
  const preferredIsland = monster.island || validBreedingIslands[0] || "";

  return {
    id: `${sheet.key}-${monster.name}-${monsterIndex}`,
    name: monster.name,
    island: preferredIsland,
    islands: validBreedingIslands.length > 0 ? validBreedingIslands : [preferredIsland].filter(Boolean),
    validBreedingIslands,
    sheetKey: sheet.key,
    sheetTitle: sheet.sheetTitle,
    sheetPriority: sheet.priority ?? 999,
    activatedOrder,
    sheetIndex: sheet.sheetIndex,
    monsterIndex,
    required,
    zapped,
    breeding,
    actualRemaining,
    queueRemaining,
    remaining: queueRemaining,
  };
}

// Planner demand should fan out across every valid breeding island while
// keeping one shared sheet row and one shared remaining count underneath.
function createPlannerProjectionEntries(item)
{
  if (!item)
  {
    return [];
  }

  const eligibleIslands = Array.isArray(item.validBreedingIslands) && item.validBreedingIslands.length > 0
    ? item.validBreedingIslands
    : [item.island].filter(Boolean);

  return Array.from(new Set(eligibleIslands))
    .filter(Boolean)
    .map((islandName) => ({
      ...item,
      island: islandName,
    }));
}

function getSheetMonsterState(sheet, monsterName)
{
  if (!sheet || !Array.isArray(sheet.monsters))
  {
    return null;
  }

  const monsterIndex = sheet.monsters.findIndex((monster) => monster.name === monsterName);

  if (monsterIndex === -1)
  {
    return null;
  }

  const monster = sheet.monsters[monsterIndex];
  const required = Number(monster.required || 0);
  const zapped = Number(monster.zapped || 0);
  const totalBreeding = Number(monster.breeding || 0);

  return {
    monster,
    monsterIndex,
    required,
    zapped,
    totalBreeding,
    actualRemaining: Math.max(0, required - zapped),
    queueRemaining: Math.max(0, required - zapped - totalBreeding),
  };
}

function getMatchingSheetsForMonster(sheets, monsterName, matcher)
{
  return normalizeSheets(sheets)
    .map((sheet, sheetIndex) =>
    {
      const monsterState = getSheetMonsterState({ ...sheet, sheetIndex }, monsterName);

      if (!monsterState || !matcher(monsterState, sheet))
      {
        return null;
      }

      return {
        key: sheet.key,
        title: sheet.sheetTitle,
        isActive: Boolean(sheet.isActive),
        sheetIndex,
        monsterIndex: monsterState.monsterIndex,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.title.localeCompare(b.title));
}

function createBreedingSessionGroup(
  session,
  sheets,
  sheetByKey,
  activationOrderByKey
)
{
  const sheet = session.sheetId ? sheetByKey.get(session.sheetId) : null;
  const sheetState = sheet ? getSheetMonsterState(sheet, session.monsterId) : null;
  const matchingSheets = !session.sheetId
    ? getMatchingSheetsForMonster(
        sheets,
        session.monsterId,
        (monsterState) => monsterState.queueRemaining > 0
      )
    : [];
  const zapTargets = !session.sheetId
    ? getMatchingSheetsForMonster(
        sheets,
        session.monsterId,
        (monsterState, candidateSheet) =>
          candidateSheet.isActive && monsterState.actualRemaining > 0
      )
    : [];

  return {
    id: `${session.status}-${session.sheetId || "unassigned"}-${session.islandId}-${session.monsterId}`,
    name: session.monsterId,
    island: session.islandId,
    source: session.source || (session.sheetId ? "assigned" : "manual"),
    status: session.status,
    sheetKey: sheet?.key || null,
    sheetTitle: sheet?.sheetTitle || "Unassigned",
    sheetPriority: sheet?.priority ?? 999,
    activatedOrder: sheet?.key
      ? activationOrderByKey.get(sheet.key) ?? 999
      : 999,
    sheetIndex: sheet?.sheetIndex,
    monsterIndex: sheetState?.monsterIndex,
    required: sheetState?.required || 0,
    zapped: sheetState?.zapped || 0,
    actualRemaining: sheetState?.actualRemaining || 0,
    queueRemaining: sheetState?.queueRemaining || 0,
    count: 0,
    breeding: 0,
    sessionIds: [],
    matchingSheets,
    zapTargets,
    manualRecipeParents: Array.isArray(session.manualRecipeParents) ? session.manualRecipeParents : [],
    manualObservedTime: session.manualObservedTime || "",
    manualResolution: session.manualResolution === "exact" ? "exact" : "mystery",
  };
}

function sortSessionEntries(entries)
{
  return [...entries].sort((a, b) =>
  {
    if (a.status !== b.status)
    {
      return a.status.localeCompare(b.status);
    }

    if (a.sheetTitle !== b.sheetTitle)
    {
      return a.sheetTitle.localeCompare(b.sheetTitle);
    }

    if (a.island !== b.island)
    {
      return a.island.localeCompare(b.island);
    }

    return a.name.localeCompare(b.name);
  });
}

export function buildToBreedEntries(sheets)
{
  const activeSheets = getActiveSheetsInOrder(sheets);
  const activationOrderByKey = getActivationOrderByKey(activeSheets);

  return activeSheets
    .flatMap((sheet) =>
      sheet.monsters
        .map((monster, monsterIndex) =>
          buildRemainingEntry(
            monster,
            monsterIndex,
            sheet,
            activationOrderByKey.get(sheet.key) ?? 999
          )
        )
        .filter(Boolean)
    )
    .sort(compareEntries);
}

export function buildBreedingQueue(sheets)
{
  return buildToBreedEntries(sheets);
}

export function buildBreedingNowEntriesFromSessions(breedingSessions, sheets)
{
  const normalizedSheets = normalizeSheets(sheets).map((sheet, sheetIndex) => ({
    ...sheet,
    sheetIndex: sheet.sheetIndex ?? sheetIndex,
  }));
  const activationOrderByKey = getActivationOrderByKey(
    getActiveSheetsInOrder(normalizedSheets)
  );
  const sheetByKey = new Map(normalizedSheets.map((sheet) => [sheet.key, sheet]));
  const groups = new Map();

  normalizeSessions(breedingSessions)
    .filter((session) => session && session.status !== "completed")
    .forEach((session) =>
    {
      const groupKey = [
        session.status || "breeding",
        session.sheetId || "unassigned",
        session.islandId || "",
        session.monsterId || "",
        session.source === "manual" && Array.isArray(session.manualRecipeParents)
          ? session.manualRecipeParents.join("::")
          : "",
        session.source === "manual" ? session.manualObservedTime || "" : "",
      ].join("::");

      if (!groups.has(groupKey))
      {
        groups.set(
          groupKey,
          createBreedingSessionGroup(
            session,
            normalizedSheets,
            sheetByKey,
            activationOrderByKey
          )
        );
      }

      const entry = groups.get(groupKey);
      entry.count += 1;
      entry.breeding += 1;
      entry.sessionIds.push(session.id);
    });

  return sortSessionEntries(Array.from(groups.values()));
}

function createPlannerIslandEntry(islandState, orderIndex)
{
  const profile = getIslandOperationalProfile(islandState.name, islandState.type || "special");
  const minimumBreedingStructures = profile.supportsStandardBreeding ? 1 : 0;
  const minimumNurseries = profile.supportsNursery ? 1 : 0;
  const maxBreedingStructures = profile.supportsStandardBreeding
    ? Math.max(
      minimumBreedingStructures,
      Number(islandState.maxBreedingStructures || islandState.breedingStructures || 2)
    )
    : 0;
  const maxNurseries = profile.supportsNursery
    ? Math.max(
      minimumNurseries,
      Number(islandState.maxNurseries || islandState.nurseries || 2)
    )
    : 0;

  return {
    island: islandState.name,
    group: islandState.group || "other",
    type: islandState.type || "special",
    isMirror: Boolean(islandState.isMirror),
    isUnlocked: Boolean(islandState.isUnlocked),
    supportsStandardBreeding: Boolean(profile.supportsStandardBreeding),
    supportsNursery: Boolean(profile.supportsNursery),
    capabilityTags: Array.isArray(profile.capabilityTags) ? profile.capabilityTags : [],
    operationalNote: profile.operationalNote || "",
    breedingStructures: Math.max(
      minimumBreedingStructures,
      Math.min(
        maxBreedingStructures,
        Number(islandState.breedingStructures ?? minimumBreedingStructures)
      )
    ),
    maxBreedingStructures,
    nurseries: Math.max(
      minimumNurseries,
      Math.min(maxNurseries, Number(islandState.nurseries ?? minimumNurseries))
    ),
    maxNurseries,
    occupiedSlots: 0,
    nurseryOccupancy: 0,
    freeSlots: 0,
    freeNurseries: 0,
    needNow: [],
    collectionMissing: [],
    currentlyBreeding: [],
    nurserySessions: [],
    orderIndex,
  };
}

function sortPlannerItems(entries)
{
  return [...entries].sort(compareEntries);
}

function ensureIslandEntry(plannerByIsland, islandName, fallbackOrderIndex)
{
  if (!plannerByIsland.has(islandName))
  {
    plannerByIsland.set(
      islandName,
      createPlannerIslandEntry(
        {
          name: islandName,
          group: "other",
          type: "breeding",
          isMirror: islandName.startsWith("Mirror "),
          isUnlocked: false,
          breedingStructures: 1,
          maxBreedingStructures: 2,
          nurseries: 1,
          maxNurseries: 2,
        },
        fallbackOrderIndex
      )
    );
  }

  return plannerByIsland.get(islandName);
}

export function buildIslandPlannerData(activeSheets, islandStates = [], breedingSessions = [])
{
  const plannerByIsland = new Map();
  const orderedIslandStates = Array.isArray(islandStates) ? islandStates : [];

  orderedIslandStates.forEach((islandState, index) =>
  {
    plannerByIsland.set(
      islandState.name,
      createPlannerIslandEntry(islandState, index)
    );
  });

  const activationOrderByKey = getActivationOrderByKey(getActiveSheetsInOrder(activeSheets));
  const indexedSheets = normalizeSheets(activeSheets).map((sheet, fallbackIndex) => ({
    ...sheet,
    sheetIndex: sheet.sheetIndex ?? fallbackIndex,
  }));

  indexedSheets.forEach((sheet) =>
  {
    sheet.monsters.forEach((monster, monsterIndex) =>
    {
      const item = buildRemainingEntry(
        monster,
        monsterIndex,
        sheet,
        activationOrderByKey.get(sheet.key) ?? 999
      );

      const plannerItems = createPlannerProjectionEntries(item);

      if (plannerItems.length === 0)
      {
        return;
      }

      plannerItems.forEach((plannerItem) =>
      {
        const islandEntry = ensureIslandEntry(
          plannerByIsland,
          plannerItem.island,
          orderedIslandStates.length + plannerByIsland.size
        );

        if (sheet.type === "island")
        {
          islandEntry.collectionMissing.push(plannerItem);
          return;
        }

        if (!islandEntry.supportsStandardBreeding)
        {
          return;
        }

        islandEntry.needNow.push(plannerItem);
      });
    });
  });

  const groupedSessions = buildBreedingNowEntriesFromSessions(breedingSessions, indexedSheets);

  groupedSessions.forEach((entry) =>
  {
    const islandEntry = ensureIslandEntry(
      plannerByIsland,
      entry.island,
      orderedIslandStates.length + plannerByIsland.size
    );

    if (entry.status === "nursery")
    {
      islandEntry.nurseryOccupancy += entry.count;
      islandEntry.nurserySessions.push(entry);
      return;
    }

    islandEntry.occupiedSlots += entry.count;
    islandEntry.currentlyBreeding.push(entry);
  });

  return Array.from(plannerByIsland.values())
    .map((entry) => ({
      ...entry,
      freeSlots: Math.max(0, Number(entry.breedingStructures || 0) - entry.occupiedSlots),
      freeNurseries: Math.max(0, Number(entry.nurseries || 0) - entry.nurseryOccupancy),
      needNow: sortPlannerItems(entry.needNow),
      collectionMissing: sortPlannerItems(entry.collectionMissing),
      currentlyBreeding: sortSessionEntries(entry.currentlyBreeding),
      nurserySessions: sortSessionEntries(entry.nurserySessions),
    }))
    .sort((a, b) => a.orderIndex - b.orderIndex || a.island.localeCompare(b.island));
}
