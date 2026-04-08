import { createTrackerSheetInstanceFromSeed } from "../data/sheets.js";
import {
  ISLAND_STATE_DEFAULTS,
  mergeIslandStates,
} from "../data/islands.js";
import {
  isRealBreedingIsland,
  normalizeBreedingAssignments,
} from "./monsterMetadata.js";

export const STORAGE_KEYS = {
  sheets: "msmTrackerSheets",
  view: "msmTrackerView",
  collections: "collectionsData",
  islandState: "msmTrackerIslandState",
  breedingSessions: "msmTrackerBreedingSessions",
  legacyIslandSlots: "msmTrackerIslandSlots",
  snapshotHistory: "msmTrackerSnapshotHistory",
  activityLog: "msmTrackerActivityLog",
};

export const BACKUP_SCHEMA_VERSION = 1;
export const PERSISTENCE_SCHEMA_VERSION = 1;
export const SNAPSHOT_HISTORY_LIMIT = 8;
export const ACTIVITY_LOG_LIMIT = 250;
export const DEFAULT_VIEW = { screen: "home" };
const PERSISTED_VALUE_MARKER = "__msmTrackerEnvelope";

function getStorageHandle(storage = globalThis.localStorage)
{
  if (
    !storage ||
    typeof storage.getItem !== "function" ||
    typeof storage.setItem !== "function"
  )
  {
    return null;
  }

  return storage;
}

function wrapPersistedValue(value)
{
  return {
    [PERSISTED_VALUE_MARKER]: true,
    schemaVersion: PERSISTENCE_SCHEMA_VERSION,
    savedAt: new Date().toISOString(),
    value,
  };
}

function unwrapPersistedValue(parsedValue)
{
  if (
    parsedValue
    && typeof parsedValue === "object"
    && parsedValue[PERSISTED_VALUE_MARKER] === true
    && Object.prototype.hasOwnProperty.call(parsedValue, "value")
  )
  {
    return parsedValue.value;
  }

  return parsedValue;
}

export function clamp(value, min, max)
{
  return Math.max(min, Math.min(max, value));
}

export function deepClone(value)
{
  return JSON.parse(JSON.stringify(value));
}

export function createBreedingSessionId()
{
  return `breed_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function createActivityLogEntryId()
{
  return `log_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function normalizeMonsterLookupKey(name)
{
  return typeof name === "string"
    ? name.trim().toLowerCase()
    : "";
}

export function findMonsterRowIndex(monsters, monsterName)
{
  if (!Array.isArray(monsters) || !monsterName)
  {
    return -1;
  }

  const exactIndex = monsters.findIndex((monster) => monster.name === monsterName);

  if (exactIndex >= 0)
  {
    return exactIndex;
  }

  const normalizedTarget = normalizeMonsterLookupKey(monsterName);

  return monsters.findIndex(
    (monster) => normalizeMonsterLookupKey(monster.name) === normalizedTarget
  );
}

function readJsonValue(key, storage = globalThis.localStorage)
{
  const storageHandle = getStorageHandle(storage);

  if (!storageHandle)
  {
    return null;
  }

  const rawValue = storageHandle.getItem(key);

  if (!rawValue)
  {
    return null;
  }

  return unwrapPersistedValue(JSON.parse(rawValue));
}

export function saveJsonValue(key, value, storage = globalThis.localStorage)
{
  const storageHandle = getStorageHandle(storage);

  if (!storageHandle)
  {
    return;
  }

  storageHandle.setItem(key, JSON.stringify(wrapPersistedValue(value)));
}

function isSnapshotPayload(value)
{
  return Boolean(
    value
    && typeof value === "object"
    && Array.isArray(value.sheets)
    && Array.isArray(value.collectionsData)
    && Array.isArray(value.islandStates)
    && Array.isArray(value.breedingSessions)
  );
}

export function loadSnapshotHistory(storage = globalThis.localStorage)
{
  try
  {
    const storedHistory = readJsonValue(STORAGE_KEYS.snapshotHistory, storage);

    if (!Array.isArray(storedHistory))
    {
      return [];
    }

    return storedHistory.filter(isSnapshotPayload);
  }
  catch (error)
  {
    console.error("Failed to parse snapshot history", error);
    return [];
  }
}

export function loadLatestSnapshot(storage = globalThis.localStorage)
{
  const snapshotHistory = loadSnapshotHistory(storage);

  return snapshotHistory.length > 0
    ? snapshotHistory[snapshotHistory.length - 1]
    : null;
}

function normalizeActivityLogEntry(entry)
{
  if (!entry || typeof entry !== "object")
  {
    return null;
  }

  const type = typeof entry.type === "string" ? entry.type.trim() : "";
  const message = typeof entry.message === "string" ? entry.message.trim() : "";

  if (!type || !message)
  {
    return null;
  }

  return {
    id: typeof entry.id === "string" && entry.id ? entry.id : createActivityLogEntryId(),
    at: typeof entry.at === "string" && entry.at ? entry.at : new Date().toISOString(),
    type,
    message,
    details: entry.details && typeof entry.details === "object" && !Array.isArray(entry.details)
      ? entry.details
      : {},
  };
}

export function loadActivityLog(storage = globalThis.localStorage)
{
  try
  {
    const storedLog = readJsonValue(STORAGE_KEYS.activityLog, storage);

    if (!Array.isArray(storedLog))
    {
      return [];
    }

    return storedLog
      .map(normalizeActivityLogEntry)
      .filter(Boolean)
      .slice(-ACTIVITY_LOG_LIMIT);
  }
  catch (error)
  {
    console.error("Failed to parse activity log", error);
    return [];
  }
}

export function appendActivityLogEntry(entry, storage = globalThis.localStorage)
{
  const normalizedEntry = normalizeActivityLogEntry(entry);

  if (!normalizedEntry)
  {
    return null;
  }

  const nextLog = [...loadActivityLog(storage), normalizedEntry].slice(-ACTIVITY_LOG_LIMIT);
  saveJsonValue(STORAGE_KEYS.activityLog, nextLog, storage);

  return normalizedEntry;
}

export function normalizeBreedingSession(session)
{
  if (!session || typeof session !== "object")
  {
    return null;
  }

  const monsterId = typeof session.monsterId === "string" ? session.monsterId.trim() : "";
  const islandId = typeof session.islandId === "string" ? session.islandId.trim() : "";

  if (!monsterId || !isRealBreedingIsland(islandId))
  {
    return null;
  }

  const source = session.source === "manual"
    || session.source === "reconciled"
    ? session.source
    : "assigned";
  const sheetId = typeof session.sheetId === "string" && session.sheetId ? session.sheetId : null;
  const status =
    session.status === "completed"
      ? "completed"
      : session.status === "hatching" || session.status === "nursery"
        ? "nursery"
        : "breeding";

  if (source === "assigned" && status !== "completed" && !sheetId)
  {
    return null;
  }

  if (status !== "completed")
  {
    const sessionSupportsNursery = status === "nursery";

    if (!isRealBreedingIsland(islandId) || (sessionSupportsNursery && !isRealBreedingIsland(islandId)))
    {
      return null;
    }
  }

  return {
    id: session.id || createBreedingSessionId(),
    monsterId,
    islandId,
    source,
    sheetId,
    sheetTitle: typeof session.sheetTitle === "string" ? session.sheetTitle : "",
    status,
    createdAt: Number(session.createdAt || Date.now()),
    manualRecipeParents: Array.isArray(session.manualRecipeParents)
      ? session.manualRecipeParents
          .filter((value) => typeof value === "string" && value.trim())
          .slice(0, 2)
      : [],
    manualObservedTime: typeof session.manualObservedTime === "string"
      ? session.manualObservedTime.trim()
      : "",
    manualResolution: session.manualResolution === "exact" ? "exact" : "mystery",
  };
}

export function buildAssignedBreedingSessionsFromSheets(sheets)
{
  const sessions = [];

  sheets.forEach((sheet) =>
  {
    sheet.monsters.forEach((monster) =>
    {
      const breedingAssignments = normalizeBreedingAssignments(monster.breedingAssignments);

      Object.entries(breedingAssignments).forEach(([islandId, count]) =>
      {
        for (let index = 0; index < count; index += 1)
        {
          sessions.push({
            id: createBreedingSessionId(),
            monsterId: monster.name,
            islandId,
            source: "assigned",
            sheetId: sheet.key,
            status: "breeding",
            createdAt: Date.now() + index,
          });
        }
      });
    });
  });

  return sessions;
}

export function reconcileBreedingSessions(sessions, sheets)
{
  const normalizedSessions = Array.isArray(sessions)
    ? sessions.map(normalizeBreedingSession).filter(Boolean)
    : [];
  const persistentCompletedSessions = normalizedSessions.filter(
    (session) => session.status === "completed"
  );
  const persistentManualSessions = normalizedSessions.filter(
    (session) => session.source !== "assigned" && session.status !== "completed"
  );
  const savedAssignedSessions = normalizedSessions.filter(
    (session) => session.source === "assigned" && session.status !== "completed" && session.sheetId
  );
  const reconciledAssignedSessions = [];

  sheets.forEach((sheet) =>
  {
    sheet.monsters.forEach((monster) =>
    {
      const breedingAssignments = normalizeBreedingAssignments(monster.breedingAssignments);
      const totalBreeding = Number(monster.breeding || 0);
      const totalAssignedBreeding = Object.values(breedingAssignments).reduce(
        (sum, count) => sum + Number(count || 0),
        0
      );
      const totalDesiredNursery = Math.max(0, totalBreeding - totalAssignedBreeding);
      const savedMonsterAssignedSessions = savedAssignedSessions
        .filter(
          (session) => session.sheetId === sheet.key && session.monsterId === monster.name
        )
        .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
      const savedNurserySessions = savedMonsterAssignedSessions.filter(
        (session) => session.status === "nursery"
      );
      let remainingDesiredNursery = totalDesiredNursery;

      Object.entries(breedingAssignments).forEach(([islandId, count]) =>
      {
        const savedBreedingSessions = savedMonsterAssignedSessions.filter(
          (session) => session.status === "breeding" && session.islandId === islandId
        );

        for (let index = 0; index < Number(count || 0); index += 1)
        {
          reconciledAssignedSessions.push(
            savedBreedingSessions[index] || {
              id: createBreedingSessionId(),
              monsterId: monster.name,
              islandId,
              source: "assigned",
              sheetId: sheet.key,
              status: "breeding",
              createdAt: Date.now() + index,
            }
          );
        }
      });

      savedNurserySessions.forEach((session) =>
      {
        if (remainingDesiredNursery <= 0)
        {
          return;
        }

        reconciledAssignedSessions.push(session);
        remainingDesiredNursery -= 1;
      });
    });
  });

  return [
    ...persistentCompletedSessions,
    ...persistentManualSessions,
    ...reconciledAssignedSessions,
  ];
}

export function buildDefaultSheetForSavedSheet(savedSheet)
{
  if (!savedSheet || typeof savedSheet !== "object")
  {
    return null;
  }

  if ((savedSheet.type || "vessel") === "vessel" && savedSheet.systemKey && savedSheet.monsterName)
  {
    return createTrackerSheetInstanceFromSeed(
      savedSheet,
      Number(savedSheet.instanceNumber || 1)
    );
  }

  return deepClone(savedSheet);
}

function resolveSavedSheets(defaultSheets, savedSheets)
{
  const fallbackSheets = Array.isArray(defaultSheets) ? defaultSheets : [];

  if (!Array.isArray(savedSheets) || savedSheets.length === 0)
  {
    return fallbackSheets.map((sheet) => mergeSheetWithDefaults(sheet, null));
  }

  const defaultSheetKeys = new Set(fallbackSheets.map((sheet) => sheet.key));
  const savedByKey = Object.fromEntries(
    savedSheets.map((sheet) => [sheet.key, sheet])
  );

  const mergedDefaultSheets = fallbackSheets.map((defaultSheet) =>
    mergeSheetWithDefaults(defaultSheet, savedByKey[defaultSheet.key])
  );
  const extraSavedSheets = savedSheets
    .filter((sheet) => !defaultSheetKeys.has(sheet.key))
    .map((savedSheet) =>
    {
      const defaultSheet = buildDefaultSheetForSavedSheet(savedSheet);

      return mergeSheetWithDefaults(defaultSheet || savedSheet, savedSheet);
    });

  return [
    ...mergedDefaultSheets,
    ...extraSavedSheets,
  ];
}

export function mergeSheetWithDefaults(defaultSheet, savedSheet)
{
  if (!savedSheet)
  {
    return deepClone(defaultSheet);
  }

  const savedMonstersByName = Object.fromEntries(
    (savedSheet.monsters || []).map((monster) => [monster.name, monster])
  );

  return {
    ...deepClone(defaultSheet),
    ...savedSheet,
    type: savedSheet?.type || defaultSheet.type || "vessel",
    lanes: savedSheet.lanes || defaultSheet.lanes,
    monsters: defaultSheet.monsters.map((defaultMonster) =>
    {
      const savedMonster = savedMonstersByName[defaultMonster.name] || {};
      const mergedRequirementIsland =
        savedMonster.requirementIsland || defaultMonster.requirementIsland || "";
      const mergedIsland = defaultMonster.island || "";
      const breeding = clamp(
        Number(savedMonster.breeding ?? defaultMonster.breeding ?? 0),
        0,
        Number(defaultMonster.required || 0)
      );
      const breedingAssignments = trimBreedingAssignments(
        normalizeBreedingAssignments(savedMonster.breedingAssignments),
        breeding
      );

      return {
        ...defaultMonster,
        ...savedMonster,
        island: mergedIsland,
        requirementIsland: mergedRequirementIsland,
        breeding,
        breedingAssignments,
      };
    }),
  };
}

function trimBreedingAssignments(assignments, maxAssigned)
{
  const normalizedAssignments = normalizeBreedingAssignments(assignments);
  const remainingAssignments = [];
  let remainingCapacity = Math.max(0, Number(maxAssigned || 0));

  Object.entries(normalizedAssignments).forEach(([islandName, count]) =>
  {
    if (remainingCapacity <= 0)
    {
      return;
    }

    const assignedCount = Math.min(Number(count || 0), remainingCapacity);

    if (assignedCount > 0)
    {
      remainingAssignments.push([islandName, assignedCount]);
      remainingCapacity -= assignedCount;
    }
  });

  return Object.fromEntries(remainingAssignments);
}

export function loadView(storage = globalThis.localStorage)
{
  const snapshotView = loadLatestSnapshot(storage)?.view;
  const fallbackView = snapshotView && typeof snapshotView === "object"
    ? snapshotView
    : DEFAULT_VIEW;

  try
  {
    return readJsonValue(STORAGE_KEYS.view, storage) || fallbackView;
  }
  catch (error)
  {
    console.error("Failed to parse saved view", error);
    return fallbackView;
  }
}

export function loadSheets(defaultSheets, storage = globalThis.localStorage)
{
  const snapshotSheets = loadLatestSnapshot(storage)?.sheets;

  try
  {
    const parsed = readJsonValue(STORAGE_KEYS.sheets, storage);

    if (!parsed)
    {
      return resolveSavedSheets(defaultSheets, snapshotSheets);
    }

    return resolveSavedSheets(defaultSheets, parsed);
  }
  catch (error)
  {
    console.error("Failed to load saved sheets", error);
    return resolveSavedSheets(defaultSheets, snapshotSheets);
  }
}

export function loadIslandStates(storage = globalThis.localStorage)
{
  const snapshotIslandStates = loadLatestSnapshot(storage)?.islandStates;

  try
  {
    const savedStates = readJsonValue(STORAGE_KEYS.islandState, storage);
    const legacySlotCounts = readJsonValue(STORAGE_KEYS.legacyIslandSlots, storage) || {};

    if (!savedStates)
    {
      return mergeIslandStates(
        ISLAND_STATE_DEFAULTS,
        Array.isArray(snapshotIslandStates) ? snapshotIslandStates : [],
        legacySlotCounts
      );
    }

    return mergeIslandStates(
      ISLAND_STATE_DEFAULTS,
      savedStates,
      legacySlotCounts
    );
  }
  catch (error)
  {
    console.error("Failed to parse island state", error);
    return mergeIslandStates(
      ISLAND_STATE_DEFAULTS,
      Array.isArray(snapshotIslandStates) ? snapshotIslandStates : [],
      {}
    );
  }
}

export function mergeCollectionsWithDefaults(defaultCollections, savedCollections)
{
  if (!Array.isArray(savedCollections) || savedCollections.length === 0)
  {
    return defaultCollections;
  }

  const savedCollectionsByKey = Object.fromEntries(
    savedCollections.map((collection) => [collection.key, collection])
  );

  return defaultCollections.map((defaultCollection) =>
  {
    const savedCollection = savedCollectionsByKey[defaultCollection.key];

    if (!savedCollection)
    {
      return defaultCollection;
    }

    const savedEntriesByName = Object.fromEntries(
      (savedCollection.entries || []).map((entry) => [entry.name, entry])
    );

    return {
      ...defaultCollection,
      ...savedCollection,
      entries: (defaultCollection.entries || []).map((defaultEntry) => ({
        ...defaultEntry,
        ...(savedEntriesByName[defaultEntry.name] || {}),
      })),
    };
  });
}

export function loadCollections(defaultCollections, storage = globalThis.localStorage)
{
  const snapshotCollections = loadLatestSnapshot(storage)?.collectionsData;

  try
  {
    const savedCollections = readJsonValue(STORAGE_KEYS.collections, storage);

    if (!savedCollections)
    {
      return mergeCollectionsWithDefaults(defaultCollections, snapshotCollections);
    }

    return mergeCollectionsWithDefaults(defaultCollections, savedCollections);
  }
  catch (error)
  {
    console.error("Failed to parse saved collections", error);
    return mergeCollectionsWithDefaults(defaultCollections, snapshotCollections);
  }
}

export function loadBreedingSessions(seedSheets, storage = globalThis.localStorage)
{
  const snapshotSessions = loadLatestSnapshot(storage)?.breedingSessions;

  try
  {
    const savedSessions = readJsonValue(STORAGE_KEYS.breedingSessions, storage);

    if (!savedSessions)
    {
      return Array.isArray(snapshotSessions) && snapshotSessions.length > 0
        ? reconcileBreedingSessions(snapshotSessions, seedSheets)
        : buildAssignedBreedingSessionsFromSheets(seedSheets);
    }

    return reconcileBreedingSessions(savedSessions, seedSheets);
  }
  catch (error)
  {
    console.error("Failed to parse breeding sessions", error);
    return Array.isArray(snapshotSessions) && snapshotSessions.length > 0
      ? reconcileBreedingSessions(snapshotSessions, seedSheets)
      : buildAssignedBreedingSessionsFromSheets(seedSheets);
  }
}

export function loadInitialAppState({
  defaultSheets,
  defaultCollections,
  storage = globalThis.localStorage,
})
{
  const sheets = loadSheets(defaultSheets, storage);

  return {
    view: loadView(storage),
    sheets,
    collectionsData: loadCollections(defaultCollections, storage),
    islandStates: loadIslandStates(storage),
    breedingSessions: loadBreedingSessions(sheets, storage),
  };
}

export function buildBackupPayload({
  appVersion,
  sheets,
  view,
  collectionsData,
  islandStates,
  breedingSessions,
  exportedAt = new Date().toISOString(),
})
{
  return {
    schemaVersion: BACKUP_SCHEMA_VERSION,
    appVersion,
    exportedAt,
    view: view || DEFAULT_VIEW,
    sheets: Array.isArray(sheets) ? sheets : [],
    collectionsData: Array.isArray(collectionsData) ? collectionsData : [],
    islandStates: Array.isArray(islandStates) ? islandStates : [],
    breedingSessions: Array.isArray(breedingSessions) ? breedingSessions : [],
  };
}

export function saveAppSnapshot(context, storage = globalThis.localStorage)
{
  const storageHandle = getStorageHandle(storage);

  if (!storageHandle)
  {
    return;
  }

  const nextSnapshot = buildBackupPayload(context);
  const snapshotHistory = loadSnapshotHistory(storage);
  const nextHistory = [...snapshotHistory, nextSnapshot].slice(-SNAPSHOT_HISTORY_LIMIT);

  saveJsonValue(STORAGE_KEYS.snapshotHistory, nextHistory, storage);
}

export function serializeBackupPayload(context)
{
  return JSON.stringify(buildBackupPayload(context), null, 2);
}

export function parseBackupPayload(rawPayload, {
  defaultSheets,
  defaultCollections,
})
{
  let parsedPayload;

  try
  {
    parsedPayload = JSON.parse(rawPayload);
  }
  catch
  {
    throw new Error("That backup file is not valid JSON.");
  }

  if (!parsedPayload || typeof parsedPayload !== "object")
  {
    throw new Error("That backup file does not contain usable app data.");
  }

  const fallbackSheets = Array.isArray(defaultSheets) ? defaultSheets : [];
  const fallbackCollections = Array.isArray(defaultCollections) ? defaultCollections : [];
  const sheets = resolveSavedSheets(fallbackSheets, parsedPayload.sheets);

  const collectionsData = mergeCollectionsWithDefaults(
    fallbackCollections,
    parsedPayload.collectionsData
  );
  const islandStates = mergeIslandStates(
    ISLAND_STATE_DEFAULTS,
    Array.isArray(parsedPayload.islandStates) ? parsedPayload.islandStates : [],
    {}
  );
  const breedingSessions = reconcileBreedingSessions(parsedPayload.breedingSessions, sheets);
  const view = parsedPayload.view && typeof parsedPayload.view === "object"
    ? parsedPayload.view
    : DEFAULT_VIEW;

  return {
    view,
    sheets,
    collectionsData,
    islandStates,
    breedingSessions,
    meta: {
      schemaVersion: Number(parsedPayload.schemaVersion || 0),
      appVersion: typeof parsedPayload.appVersion === "string"
        ? parsedPayload.appVersion
        : "",
      exportedAt: typeof parsedPayload.exportedAt === "string"
        ? parsedPayload.exportedAt
        : "",
    },
  };
}
