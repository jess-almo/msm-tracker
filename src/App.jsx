import React, { Suspense, lazy, useEffect, useMemo, useState } from "react";
import {
  createTrackerSheetInstanceFromSeed,
  TRACKER_SHEET_DEFAULTS,
} from "./data/sheets";
import {
  getIslandOperationalProfile,
  ISLAND_STATE_DEFAULTS,
  mergeIslandStates,
} from "./data/islands";
import { buildBreedingQueue, buildIslandPlannerData } from "./utils/queue";
import { COLLECTIONS } from "./data/collections";
import {
  addBreedingAssignment,
  consumeBreedingAssignments,
  getAssignedBreedingTotal,
  getMonsterBreedingIslands,
  isRealBreedingIsland,
  normalizeBreedingAssignments,
  trimBreedingAssignments,
} from "./utils/monsterMetadata";

const DEFAULT_SHEETS = TRACKER_SHEET_DEFAULTS;
const BreedingQueue = lazy(() => import("./components/BreedingQueue"));
const IslandPlanner = lazy(() => import("./components/IslandPlanner"));
const MonsterDirectory = lazy(() => import("./components/MonsterDirectory"));
const TrackerSheet = lazy(() => import("./components/TrackerSheet"));
const ActiveSheetsPage = lazy(() => import("./pages/ActiveSheets"));
const CollectionsPage = lazy(() => import("./pages/Collections"));

const baseCardStyle = {
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: "18px",
  padding: "18px",
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.025))",
  boxShadow: "0 12px 30px rgba(0,0,0,0.18)",
};

const buttonBaseStyle = {
  padding: "10px 16px",
  borderRadius: "12px",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.08)",
  color: "inherit",
  cursor: "pointer",
  fontWeight: 600,
  boxShadow: "0 10px 24px rgba(0,0,0,0.14)",
};

const SCREEN_OPTIONS = [
  { key: "home", label: "Dashboard" },
  { key: "active", label: "Active Sheets" },
  { key: "collections", label: "Collections" },
  { key: "queue", label: "Breeding Queue" },
  { key: "planner", label: "Island Manager" },
  { key: "directory", label: "Monster Library" },
];

function ScreenLoadingFallback({ label = "Loading screen..." })
{
  return (
    <div
      className="responsive-page-card"
      style={{
        ...baseCardStyle,
        display: "grid",
        gap: "8px",
      }}
    >
      <div style={{ fontSize: "14px", opacity: 0.7, letterSpacing: "0.06em" }}>
        LOADING
      </div>
      <div style={{ fontSize: "22px", fontWeight: 700 }}>
        {label}
      </div>
      <div style={{ opacity: 0.72 }}>
        Pulling in this workspace without changing the current app state.
      </div>
    </div>
  );
}

function clamp(value, min, max)
{
  return Math.max(min, Math.min(max, value));
}

function deepClone(value)
{
  return JSON.parse(JSON.stringify(value));
}

function createBreedingSessionId()
{
  return `breed_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeMonsterLookupKey(name)
{
  return typeof name === "string"
    ? name.trim().toLowerCase()
    : "";
}

function findMonsterRowIndex(monsters, monsterName)
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

function normalizeBreedingSession(session)
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

  const source = session.source === "manual" ? "manual" : "assigned";
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
    const profile = getIslandOperationalProfile(islandId, "breeding");

    if (status === "nursery" && !profile.supportsNursery)
    {
      return null;
    }

    if (status === "breeding" && !profile.supportsStandardBreeding)
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

function buildAssignedBreedingSessionsFromSheets(sheets)
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

function reconcileBreedingSessions(sessions, sheets)
{
  const normalizedSessions = Array.isArray(sessions)
    ? sessions.map(normalizeBreedingSession).filter(Boolean)
    : [];
  const persistentCompletedSessions = normalizedSessions.filter(
    (session) => session.status === "completed"
  );
  const persistentManualSessions = normalizedSessions.filter(
    (session) => session.source === "manual" && session.status !== "completed"
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

function loadBreedingSessions(seedSheets)
{
  const savedSessions = localStorage.getItem("msmTrackerBreedingSessions");

  if (!savedSessions)
  {
    return buildAssignedBreedingSessionsFromSheets(seedSheets);
  }

  try
  {
    return reconcileBreedingSessions(JSON.parse(savedSessions), seedSheets);
  }
  catch (error)
  {
    console.error("Failed to parse breeding sessions", error);
    return buildAssignedBreedingSessionsFromSheets(seedSheets);
  }
}

function buildDefaultSheetForSavedSheet(savedSheet)
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

function mergeSheetWithDefaults(defaultSheet, savedSheet)
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

function loadSheets()
{
  const savedSheets = localStorage.getItem("msmTrackerSheets");

  if (savedSheets)
  {
    try
    {
      const parsed = JSON.parse(savedSheets);
      const defaultSheetKeys = new Set(DEFAULT_SHEETS.map((sheet) => sheet.key));
      const savedByKey = Object.fromEntries(
        parsed.map((sheet) => [sheet.key, sheet])
      );

      const mergedDefaultSheets = DEFAULT_SHEETS.map((defaultSheet) =>
        mergeSheetWithDefaults(defaultSheet, savedByKey[defaultSheet.key])
      );
      const extraSavedSheets = parsed
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
    catch (error)
    {
      console.error("Failed to load saved sheets", error);
    }
  }

  return DEFAULT_SHEETS.map((sheet) => mergeSheetWithDefaults(sheet, null));
}

function loadIslandStates()
{
  const savedStates = localStorage.getItem("msmTrackerIslandState");
  const legacySlotCounts = localStorage.getItem("msmTrackerIslandSlots");

  if (!savedStates)
  {
    if (!legacySlotCounts)
    {
      return ISLAND_STATE_DEFAULTS;
    }

    try
    {
      return mergeIslandStates(
        ISLAND_STATE_DEFAULTS,
        [],
        JSON.parse(legacySlotCounts)
      );
    }
    catch (error)
    {
      console.error("Failed to parse legacy island slot counts", error);
      return ISLAND_STATE_DEFAULTS;
    }
  }

  try
  {
    return mergeIslandStates(
      ISLAND_STATE_DEFAULTS,
      JSON.parse(savedStates),
      legacySlotCounts ? JSON.parse(legacySlotCounts) : {}
    );
  }
  catch (error)
  {
    console.error("Failed to parse island state", error);
    return ISLAND_STATE_DEFAULTS;
  }
}

function mergeCollectionsWithDefaults(defaultCollections, savedCollections)
{
  if (!Array.isArray(savedCollections) || savedCollections.length === 0)
  {
    return COLLECTIONS;
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

function getSheetProgress(sheet)
{
  if (sheet.isCollected)
  {
    return 100;
  }

  const total = sheet.monsters.reduce((sum, monster) => sum + monster.required, 0);
  const done = sheet.monsters.reduce((sum, monster) => sum + (monster.zapped || 0), 0);

  return total ? Math.round((done / total) * 100) : 0;
}

function getSheetTrackedProgress(sheet)
{
  const total = sheet.monsters.reduce((sum, monster) => sum + monster.required, 0);
  const tracked = sheet.monsters.reduce(
    (sum, monster) => sum + (monster.zapped || 0) + (monster.breeding || 0),
    0
  );

  return total ? Math.round((tracked / total) * 100) : 0;
}

function getRemainingCount(sheet)
{
  return sheet.monsters.reduce(
    (sum, monster) => sum + Math.max(0, monster.required - monster.zapped),
    0
  );
}

function hasSheetProgress(sheet)
{
  return sheet.monsters.some(
    (monster) => (monster.zapped || 0) > 0 || (monster.breeding || 0) > 0
  );
}

function isSheetComplete(sheet)
{
  return (
    sheet.isCollected ||
    sheet.monsters.every((monster) => (monster.zapped || 0) >= monster.required)
  );
}

function getCollectionCounts(collection)
{
  const entries = collection?.entries || [];

  return {
    collected: entries.filter((entry) => entry.collected).length,
    total: entries.length,
  };
}

function getCollectionSheetCounts(collectionKey, sheets)
{
  if (!collectionKey)
  {
    return {
      active: 0,
      total: 0,
      complete: 0,
    };
  }

  const relevantSheets = sheets.filter((sheet) => sheet.collectionKey === collectionKey);
  const collectionProgressByIdentity = new Map();

  relevantSheets.forEach((sheet) =>
  {
    const identity = getSheetType(sheet) === "vessel" && sheet.templateKey
      ? sheet.templateKey
      : sheet.key;
    const existing = collectionProgressByIdentity.get(identity) || {
      active: false,
      complete: false,
    };

    collectionProgressByIdentity.set(identity, {
      active: existing.active || Boolean(sheet.isActive),
      complete: existing.complete || isSheetComplete(sheet),
    });
  });

  const groupedSheets = Array.from(collectionProgressByIdentity.values());

  return {
    active: groupedSheets.filter((sheet) => sheet.active).length,
    total: collectionProgressByIdentity.size,
    complete: groupedSheets.filter((sheet) => sheet.complete).length,
  };
}

function getSheetType(sheet)
{
  return sheet?.type || "vessel";
}

function getSheetDisplayName(sheet)
{
  if (getSheetType(sheet) === "island")
  {
    return sheet.sheetTitle;
  }

  return sheet.displayName || sheet.monsterName;
}

function getSheetDisplayNameForVisibleList(sheet, visibleSheets = [])
{
  if (getSheetType(sheet) !== "vessel" || !sheet?.templateKey)
  {
    return getSheetDisplayName(sheet);
  }

  const templateIdentity = sheet.templateKey || sheet.templateName || sheet.monsterName || "";
  const instanceCount = visibleSheets.filter((candidate) =>
  {
    return (
      getSheetType(candidate) === "vessel"
      && (candidate.templateKey || candidate.templateName || candidate.monsterName || "")
        === templateIdentity
    );
  }).length;

  if (instanceCount <= 1)
  {
    return sheet.templateName || sheet.monsterName || sheet.displayName || sheet.sheetTitle;
  }

  if (Number(sheet.instanceNumber || 0) > 0)
  {
    return `${sheet.templateName || sheet.monsterName || sheet.displayName || sheet.sheetTitle} #${Number(sheet.instanceNumber)}`;
  }

  if (sheet.isDuplicateInstance)
  {
    return sheet.displayName || sheet.monsterName;
  }

  return sheet.templateName || sheet.monsterName || sheet.displayName || sheet.sheetTitle;
}

function getSheetTemplateIdentity(sheet)
{
  if (getSheetType(sheet) !== "vessel")
  {
    return "";
  }

  return sheet.templateKey || sheet.templateName || sheet.monsterName || "";
}

function canCreateDuplicateSheetRun(sheet)
{
  return (
    getSheetType(sheet) === "vessel"
    && sheet?.allowsDuplicateRuns !== false
    && Boolean(getSheetTemplateIdentity(sheet))
  );
}

function canDeleteDuplicateSheetRun(sheet, sheets)
{
  if (!canCreateDuplicateSheetRun(sheet))
  {
    return false;
  }

  const templateIdentity = getSheetTemplateIdentity(sheet);
  const templateInstanceCount = sheets.filter(
    (entry) => getSheetTemplateIdentity(entry) === templateIdentity
  ).length;

  return templateInstanceCount > 1;
}

function getCollectionUnlockedAcrossTemplate(sheet, sheets)
{
  const templateIdentity = getSheetTemplateIdentity(sheet);

  if (!templateIdentity)
  {
    return Boolean(sheet?.isCollected);
  }

  return sheets.some((entry) =>
  {
    return (
      getSheetTemplateIdentity(entry) === templateIdentity
      && Boolean(entry.isCollected)
    );
  });
}

function getTemplateInstanceCount(sheet, sheets)
{
  const templateIdentity = getSheetTemplateIdentity(sheet);

  if (!templateIdentity)
  {
    return 0;
  }

  return sheets.filter((entry) => getSheetTemplateIdentity(entry) === templateIdentity).length;
}

function getNextSheetInstanceNumber(sheet, sheets)
{
  const templateIdentity = getSheetTemplateIdentity(sheet);

  if (!templateIdentity)
  {
    return 1;
  }

  return sheets.reduce((maxInstanceNumber, entry) =>
  {
    if (getSheetTemplateIdentity(entry) !== templateIdentity)
    {
      return maxInstanceNumber;
    }

    return Math.max(maxInstanceNumber, Number(entry.instanceNumber || 0));
  }, 0) + 1;
}

function getSheetSubtitle(sheet)
{
  if (getSheetType(sheet) === "island")
  {
    return `${sheet.collectionName} · ${sheet.island}`;
  }

  return `${sheet.collectionName} · ${sheet.sheetTitle}`;
}

function getSheetActivationPrompt(sheet)
{
  if (getSheetType(sheet) === "island")
  {
    return `Activate ${sheet.sheetTitle}? This will start tracking missing island monsters.`;
  }

  if (sheet.systemKey === "wublin")
  {
    return `Activate ${getSheetDisplayName(sheet)}? This will start tracking eggs for this Wublin statue.`;
  }

  return `Activate ${getSheetDisplayName(sheet)}? This will start tracking required eggs.`;
}

function getSheetActivationOrderValue(sheet)
{
  return typeof sheet?.activatedAt === "string" ? sheet.activatedAt : "";
}

function getSheetSortPriorityValue(sheet)
{
  const parsedPriority = Number(sheet?.priority);

  return Number.isFinite(parsedPriority) ? parsedPriority : Number.MAX_SAFE_INTEGER;
}

function compareSheetsByOperationalFallback(a, b)
{
  const priorityDelta = getSheetSortPriorityValue(a) - getSheetSortPriorityValue(b);

  if (priorityDelta !== 0)
  {
    return priorityDelta;
  }

  const nameComparison = getSheetDisplayName(a).localeCompare(getSheetDisplayName(b));

  if (nameComparison !== 0)
  {
    return nameComparison;
  }

  return Number(a?.instanceNumber || 0) - Number(b?.instanceNumber || 0);
}

function compareActiveSheetsByActivationOrder(a, b)
{
  const aComplete = isSheetComplete(a);
  const bComplete = isSheetComplete(b);

  if (aComplete !== bComplete)
  {
    return aComplete ? 1 : -1;
  }

  const aActivatedAt = getSheetActivationOrderValue(a);
  const bActivatedAt = getSheetActivationOrderValue(b);

  if (aActivatedAt && bActivatedAt && aActivatedAt !== bActivatedAt)
  {
    return aActivatedAt.localeCompare(bActivatedAt);
  }

  if (aActivatedAt !== bActivatedAt)
  {
    return aActivatedAt ? -1 : 1;
  }

  return compareSheetsByOperationalFallback(a, b);
}

function getRarityBadgeBackground(rarity, collected)
{
  if (collected)
  {
    return "rgba(34,197,94,0.2)";
  }

  if (rarity === "rare")
  {
    return "rgba(59,130,246,0.16)";
  }

  if (rarity === "epic")
  {
    return "rgba(168,85,247,0.18)";
  }

  if (rarity === "special")
  {
    return "rgba(245,158,11,0.18)";
  }

  return "rgba(255,255,255,0.08)";
}

function getIslandCapacityBounds(islandState)
{
  const profile = getIslandOperationalProfile(
    islandState?.name || "",
    islandState?.type || "special"
  );

  return {
    supportsStandardBreeding: Boolean(profile.supportsStandardBreeding),
    supportsNursery: Boolean(profile.supportsNursery),
    minBreedingStructures: profile.supportsStandardBreeding ? 1 : 0,
    minNurseries: profile.supportsNursery ? 1 : 0,
    maxBreedingStructures: profile.supportsStandardBreeding
      ? Math.max(
        1,
        Number(
          islandState?.maxBreedingStructures ??
          islandState?.breedingStructures ??
          2
        )
      )
      : 0,
    maxNurseries: profile.supportsNursery
      ? Math.max(
        1,
        Number(islandState?.maxNurseries ?? islandState?.nurseries ?? 2)
      )
      : 0,
  };
}

export default function App()
{
  const [view, setView] = useState(() => 
{
    const saved = localStorage.getItem("msmTrackerView");

    if (!saved)
    {
      return { screen: "home" };
    }

    try
    {
      return JSON.parse(saved);
    }
    catch (error)
    {
      console.error("Failed to parse saved view", error);
      return { screen: "home" };
    }
  });

  const [sheets, setSheets] = useState(loadSheets);
  const [collectionsData, setCollectionsData] = useState(() => 
{
    const saved = localStorage.getItem("collectionsData");

    if (!saved)
    {
      return COLLECTIONS;
    }

    try
    {
      return mergeCollectionsWithDefaults(COLLECTIONS, JSON.parse(saved));
    }
    catch (error)
    {
      console.error("Failed to parse saved collections", error);
      return COLLECTIONS;
    }
  });
  const [islandStates, setIslandStates] = useState(loadIslandStates);
  const [breedingSessions, setBreedingSessions] = useState(() =>
    loadBreedingSessions(loadSheets())
  );

  const activeSheets = useMemo(
    () => [...sheets.filter((sheet) => sheet.isActive)].sort(compareActiveSheetsByActivationOrder),
    [sheets]
  );
  const indexedActiveSheets = useMemo(
    () =>
      sheets
        .map((sheet, sheetIndex) => ({ ...sheet, sheetIndex }))
        .filter((sheet) => sheet.isActive),
    [sheets]
  );

  const queue = useMemo(() => buildBreedingQueue(sheets), [sheets]);
  const islandPlannerData = useMemo(
    () => buildIslandPlannerData(indexedActiveSheets, islandStates, breedingSessions),
    [indexedActiveSheets, islandStates, breedingSessions]
  );
  const islandPlannerByName = useMemo(
    () => new Map(islandPlannerData.map((entry) => [entry.island, entry])),
    [islandPlannerData]
  );

  const selectedSheet = useMemo(() => 
{
    if (view.screen !== "sheet")
    {
      return null;
    }

    return sheets.find((sheet) => sheet.key === view.sheetKey) || null;
  }, [sheets, view]);
  const selectedSheetIndex = useMemo(() =>
  {
    if (view.screen !== "sheet")
    {
      return -1;
    }

    return sheets.findIndex((sheet) => sheet.key === view.sheetKey);
  }, [sheets, view]);

  const selectedSheetAssignableSessions = useMemo(() =>
  {
    if (!selectedSheet || getSheetType(selectedSheet) !== "vessel")
    {
      return [];
    }

    return breedingSessions.filter((session) =>
    {
      if (
        session.status !== "breeding" ||
        session.sheetId !== null ||
        !isRealBreedingIsland(session.islandId)
      )
      {
        return false;
      }

      return selectedSheet.monsters.some((monster) =>
      {
        if (monster.name !== session.monsterId)
        {
          return false;
        }

        return (
          Math.max(
            0,
            Number(monster.required || 0) -
              Number(monster.zapped || 0) -
              Number(monster.breeding || 0)
          ) > 0
        );
      });
    });
  }, [breedingSessions, selectedSheet]);

  const collectionSummary = useMemo(() => 
{
    return collectionsData.map((collection) => 
{
      const entryCounts = getCollectionCounts(collection);
      const sheetCounts = getCollectionSheetCounts(collection.key, sheets);
      const isTrackedComplete =
        sheetCounts.total > 0 && sheetCounts.complete === sheetCounts.total;
      const isEntryComplete =
        entryCounts.total > 0 && entryCounts.collected === entryCounts.total;
      const complete = isTrackedComplete || isEntryComplete;

      return {
        ...collection,
        counts: entryCounts,
        sheetCounts,
        complete,
      };
    });
  }, [collectionsData, sheets]);

  const completedCollections = collectionSummary.filter((collection) => collection.complete).length;
  const totalCollections = collectionSummary.length;
  const overallProgress = totalCollections
    ? Math.round((completedCollections / totalCollections) * 100)
    : 0;

  const homeGoals = useMemo(() => 
{
    return activeSheets.map((sheet) => ({
      key: sheet.key,
      name: getSheetDisplayNameForVisibleList(sheet, activeSheets),
      title: getSheetType(sheet) === "island" ? sheet.island : sheet.sheetTitle,
      collectionName: sheet.collectionName,
      type: getSheetType(sheet),
      progress: getSheetProgress(sheet),
      trackedProgress: getSheetTrackedProgress(sheet),
      remaining: getRemainingCount(sheet),
      complete: isSheetComplete(sheet),
    }));
  }, [activeSheets]);

  const activeVesselSummary = useMemo(
    () => homeGoals.filter((goal) => goal.type === "vessel").slice(0, 4),
    [homeGoals]
  );
  const islandCollectionSheets = useMemo(
    () => sheets.filter((sheet) => getSheetType(sheet) === "island"),
    [sheets]
  );
  const islandCollectionProgress = useMemo(() =>
  {
    const total = islandCollectionSheets.length;
    const complete = islandCollectionSheets.filter((sheet) => isSheetComplete(sheet)).length;

    return {
      complete,
      total,
      percent: total ? Math.round((complete / total) * 100) : 0,
    };
  }, [islandCollectionSheets]);
  const islandCapacitySummary = useMemo(() =>
  {
    const unlockedIslands = islandPlannerData.filter((island) => island.isUnlocked);
    const totalBreeders = unlockedIslands.reduce(
      (sum, island) => sum + Number(island.breedingStructures || 0),
      0
    );
    const occupiedBreeders = unlockedIslands.reduce(
      (sum, island) => sum + Number(island.occupiedSlots || 0),
      0
    );
    const totalNurseries = unlockedIslands.reduce(
      (sum, island) => sum + Number(island.nurseries || 0),
      0
    );
    const occupiedNurseries = unlockedIslands.reduce(
      (sum, island) => sum + Number(island.nurseryOccupancy || 0),
      0
    );

    return {
      totalBreeders,
      freeBreeders: Math.max(0, totalBreeders - occupiedBreeders),
      totalNurseries,
      freeNurseries: Math.max(0, totalNurseries - occupiedNurseries),
    };
  }, [islandPlannerData]);

  const topQueueItems = queue.slice(0, 5);

  useEffect(() => 
{
    localStorage.setItem("msmTrackerSheets", JSON.stringify(sheets));
  }, [sheets]);

  useEffect(() => 
{
    localStorage.setItem("msmTrackerView", JSON.stringify(view));
  }, [view]);

  useEffect(() => 
{
    localStorage.setItem("collectionsData", JSON.stringify(collectionsData));
  }, [collectionsData]);

  useEffect(() =>
{
    localStorage.setItem("msmTrackerIslandState", JSON.stringify(islandStates));
  }, [islandStates]);

  useEffect(() =>
  {
    setBreedingSessions((prev) => reconcileBreedingSessions(prev, sheets));
  }, [sheets]);

  useEffect(() =>
  {
    localStorage.setItem("msmTrackerBreedingSessions", JSON.stringify(breedingSessions));
  }, [breedingSessions]);

  const openHome = () => setView({ screen: "home" });
  const openActiveSheets = () => setView({ screen: "active" });

  const openSheet = (sheetKey) => 
{
    setView({
      screen: "sheet",
      sheetKey,
    });
  };

  const openCollections = () => setView({ screen: "collections" });
  const openQueue = () => setView({ screen: "queue" });
  const openIslandPlanner = () => setView({ screen: "planner" });
  const openDirectory = () => setView({ screen: "directory" });

  const createAnotherSheetInstance = (sheetKey, options = {}) =>
  {
    const sourceSheet = sheets.find((entry) => entry.key === sheetKey);

    if (
      !sourceSheet ||
      !canCreateDuplicateSheetRun(sourceSheet)
    )
    {
      return;
    }

    const nextInstanceNumber = getNextSheetInstanceNumber(sourceSheet, sheets);
    const nextSheet = createTrackerSheetInstanceFromSeed(sourceSheet, nextInstanceNumber, {
      forceDuplicateInstance: true,
    });

    setSheets((prev) =>
    {
      if (prev.some((entry) => entry.key === nextSheet.key))
      {
        return prev;
      }

      return [
        ...prev,
        nextSheet,
      ];
    });

    if (options.openAfterCreate !== false)
    {
      openSheet(nextSheet.key);
    }
  };

  const getDeleteSheetInstanceBlockState = (sheetKey) =>
  {
    const targetSheet = sheets.find((entry) => entry.key === sheetKey);

    if (
      !targetSheet ||
      !canCreateDuplicateSheetRun(targetSheet)
    )
    {
      return {
        kind: "invalid_target",
        reason: "Only duplicate-capable vessel runs can be deleted here.",
      };
    }

    if (targetSheet.isActive)
    {
      return {
        kind: "active",
        reason: "Deactivate this tracked run before deleting it.",
      };
    }

    const hasLinkedLiveSessions = breedingSessions.some(
      (session) => session.sheetId === sheetKey && session.status !== "completed"
    );

    if (hasLinkedLiveSessions)
    {
      return {
        kind: "live_sessions",
        reason: "This instance still has linked live breeding or nursery sessions.",
      };
    }

    const templateInstanceCount = getTemplateInstanceCount(targetSheet, sheets);

    if (templateInstanceCount <= 1)
    {
      return {
        kind: "last_instance",
        reason: "Keep at least one tracked instance for this species in Collections.",
      };
    }

    return {
      kind: "",
      reason: "",
    };
  };

  const deleteSheetInstance = (sheetKey) =>
  {
    const targetSheet = sheets.find((entry) => entry.key === sheetKey);
    const blockState = getDeleteSheetInstanceBlockState(sheetKey);

    if (!targetSheet)
    {
      return;
    }

    if (blockState.reason)
    {
      window.alert(blockState.reason);
      return;
    }

    const confirmed = window.confirm(
      `Delete ${getSheetDisplayName(targetSheet)}? This removes only this tracked run and cannot be undone.`
    );

    if (!confirmed)
    {
      return;
    }

    setSheets((prev) => prev.filter((entry) => entry.key !== sheetKey));

    if (view.screen === "sheet" && view.sheetKey === sheetKey)
    {
      openCollections();
    }
  };

  const updateSheet = (sheetKey, updater) => 
{
    setSheets((prev) =>
      prev.map((sheet) => 
{
        if (sheet.key !== sheetKey)
        {
          return sheet;
        }

        const draft = deepClone(sheet);
        const updated = updater(draft);
        return updated || draft;
      })
    );
  };

  const updateMonster = (sheetIndex, monsterIndex, field, delta, options = {}) => 
{
    setSheets((prev) =>
      prev.map((sheet, currentIndex) => 
{
        if (currentIndex !== sheetIndex)
        {
          return sheet;
        }

        const next = deepClone(sheet);
        const monster = next.monsters[monsterIndex];

        if (!monster)
        {
          return sheet;
        }

        if (field === "zapped")
        {
          const previousZapped = monster.zapped || 0;
          const nextZapped = clamp(previousZapped + delta, 0, monster.required);
          const actualDelta = nextZapped - previousZapped;

          monster.zapped = nextZapped;

          if (actualDelta > 0)
          {
            monster.breeding = clamp(
              (monster.breeding || 0) - actualDelta,
              0,
              monster.required
            );
            monster.breedingAssignments = consumeBreedingAssignments(
              monster.breedingAssignments,
              actualDelta,
              options.islandName || ""
            );
          }
        }
        else if (field === "breeding")
        {
          const actualRemaining = Math.max(0, monster.required - (monster.zapped || 0));
          const previousBreeding = Number(monster.breeding || 0);
          const nextBreeding = clamp(previousBreeding + delta, 0, actualRemaining);
          const actualDelta = nextBreeding - previousBreeding;

          monster.breeding = nextBreeding;

          if (actualDelta > 0)
          {
            if (isRealBreedingIsland(options.islandName || ""))
            {
              monster.breedingAssignments = addBreedingAssignment(
                monster.breedingAssignments,
                options.islandName,
                actualDelta
              );
            }
            else
            {
              const validIslands = getMonsterBreedingIslands(monster.name);

              if (validIslands.length === 1)
              {
                monster.breedingAssignments = addBreedingAssignment(
                  monster.breedingAssignments,
                  validIslands[0],
                  actualDelta
                );
              }
            }
          }
          else if (actualDelta < 0)
          {
            monster.breedingAssignments = consumeBreedingAssignments(
              monster.breedingAssignments,
              Math.abs(actualDelta),
              options.islandName || ""
            );
          }
        }

        const assignedBreeding = getAssignedBreedingTotal(monster.breedingAssignments);

        if (assignedBreeding > monster.breeding)
        {
          monster.breedingAssignments = trimBreedingAssignments(
            monster.breedingAssignments,
            monster.breeding
          );
        }

        return next;
      })
    );
  };

  const updateIslandState = (islandName, updater) =>
{
    setIslandStates((prev) =>
    {
      return prev.map((state) =>
      {
        if (state.name !== islandName)
        {
          return state;
        }

        const nextState = typeof updater === "function" ? updater(state) : state;
        const bounds = getIslandCapacityBounds(nextState);

        return {
          ...nextState,
          maxBreedingStructures: bounds.maxBreedingStructures,
          maxNurseries: bounds.maxNurseries,
          breedingStructures: clamp(
            Number(nextState.breedingStructures ?? bounds.minBreedingStructures),
            bounds.minBreedingStructures,
            bounds.maxBreedingStructures
          ),
          nurseries: clamp(
            Number(nextState.nurseries ?? bounds.minNurseries),
            bounds.minNurseries,
            bounds.maxNurseries
          ),
          isUnlocked: Boolean(nextState.isUnlocked),
        };
      });
    });
  };

  const unlockIsland = (islandName) =>
  {
    const island = islandStates.find((state) => state.name === islandName);

    if (!island || island.isUnlocked)
    {
      return;
    }

    updateIslandState(islandName, (state) => ({
      ...state,
      isUnlocked: true,
      breedingStructures: Math.max(
        getIslandCapacityBounds(state).minBreedingStructures,
        Number(state.breedingStructures ?? getIslandCapacityBounds(state).minBreedingStructures)
      ),
      nurseries: Math.max(
        getIslandCapacityBounds(state).minNurseries,
        Number(state.nurseries ?? getIslandCapacityBounds(state).minNurseries)
      ),
    }));
  };

  const unlockIslandBreedingStructure = (islandName) =>
  {
    const island = islandStates.find((state) => state.name === islandName);
    const bounds = island ? getIslandCapacityBounds(island) : null;

    if (!island || !island.isUnlocked || !bounds?.supportsStandardBreeding)
    {
      return;
    }

    updateIslandState(islandName, (state) => ({
      ...state,
      breedingStructures: clamp(
        Number(state.breedingStructures || bounds.minBreedingStructures) + 1,
        bounds.minBreedingStructures,
        bounds.maxBreedingStructures
      ),
    }));
  };

  const unlockIslandNursery = (islandName) =>
  {
    const island = islandStates.find((state) => state.name === islandName);
    const bounds = island ? getIslandCapacityBounds(island) : null;

    if (!island || !island.isUnlocked || !bounds?.supportsNursery)
    {
      return;
    }

    updateIslandState(islandName, (state) => ({
      ...state,
      nurseries: clamp(
        Number(state.nurseries || bounds.minNurseries) + 1,
        bounds.minNurseries,
        bounds.maxNurseries
      ),
    }));
  };

  const reduceIslandBreedingStructure = (islandName) =>
  {
    const island = islandStates.find((state) => state.name === islandName);
    const plannerEntry = islandPlannerByName.get(islandName);
    const bounds = island ? getIslandCapacityBounds(island) : null;

    if (!island || !island.isUnlocked || !bounds?.supportsStandardBreeding)
    {
      return;
    }

    const minimumBreedingStructures = Math.max(
      bounds.minBreedingStructures,
      Number(plannerEntry?.occupiedSlots || 0)
    );

    if (Number(island.breedingStructures || 0) <= minimumBreedingStructures)
    {
      return;
    }

    updateIslandState(islandName, (state) => ({
      ...state,
      breedingStructures: clamp(
        Number(state.breedingStructures || minimumBreedingStructures) - 1,
        minimumBreedingStructures,
        bounds.maxBreedingStructures
      ),
    }));
  };

  const reduceIslandNursery = (islandName) =>
  {
    const island = islandStates.find((state) => state.name === islandName);
    const plannerEntry = islandPlannerByName.get(islandName);
    const bounds = island ? getIslandCapacityBounds(island) : null;

    if (!island || !island.isUnlocked || !bounds?.supportsNursery)
    {
      return;
    }

    const minimumNurseries = Math.max(
      bounds.minNurseries,
      Number(plannerEntry?.nurseryOccupancy || 0)
    );

    if (Number(island.nurseries || 0) <= minimumNurseries)
    {
      return;
    }

    updateIslandState(islandName, (state) => ({
      ...state,
      nurseries: clamp(
        Number(state.nurseries || minimumNurseries) - 1,
        minimumNurseries,
        bounds.maxNurseries
      ),
    }));
  };

  const createManualBreedingSession = (monsterIdOrPayload, islandIdArg) =>
  {
    const payload = typeof monsterIdOrPayload === "object" && monsterIdOrPayload !== null
      ? monsterIdOrPayload
      : {
          monsterId: monsterIdOrPayload,
          islandId: islandIdArg,
          manualRecipeParents: [],
          manualObservedTime: "",
          manualResolution: "exact",
        };
    const monsterId = typeof payload.monsterId === "string" ? payload.monsterId.trim() : "";
    const islandId = typeof payload.islandId === "string" ? payload.islandId.trim() : "";

    if (!monsterId || !isRealBreedingIsland(islandId))
    {
      return;
    }

    const islandEntry = islandPlannerByName.get(islandId);

    if (!islandEntry || !islandEntry.isUnlocked || islandEntry.freeSlots <= 0)
    {
      return;
    }

    setBreedingSessions((prev) => [
      ...prev,
      {
        id: createBreedingSessionId(),
        monsterId,
        islandId,
        source: "manual",
        sheetId: null,
        status: "breeding",
        createdAt: Date.now(),
        manualRecipeParents: Array.isArray(payload.manualRecipeParents)
          ? payload.manualRecipeParents
              .filter((value) => typeof value === "string" && value.trim())
              .slice(0, 2)
          : [],
        manualObservedTime: typeof payload.manualObservedTime === "string"
          ? payload.manualObservedTime.trim()
          : "",
        manualResolution: payload.manualResolution === "exact" ? "exact" : "mystery",
      },
    ]);
  };

  const completeBreedingSession = (sessionId) =>
  {
    if (!sessionId)
    {
      return;
    }

    setBreedingSessions((prev) =>
      prev.map((session) =>
      {
        if (session.id !== sessionId)
        {
          return session;
        }

        return {
          ...session,
          status: "completed",
        };
      })
    );
  };

  const assignExistingBreedingSession = (sessionId, sheetKey, options = {}) =>
  {
    return assignExistingBreedingSessionWithOptions(sessionId, sheetKey, {
      activateIfNeeded: Boolean(options.activateIfNeeded),
    });
  };

  const assignExistingBreedingSessionWithOptions = (
    sessionId,
    sheetKey,
    options = {}
  ) =>
  {
    const session = breedingSessions.find(
      (entry) => entry.id === sessionId && entry.status !== "completed"
    );
    const sheetIndex = sheets.findIndex((sheet) => sheet.key === sheetKey);
    const targetSheet = sheetIndex >= 0 ? sheets[sheetIndex] : null;

    if (!session || !targetSheet)
    {
      return { ok: false, reason: "missing_target" };
    }

    const monsterIndex = targetSheet.monsters.findIndex((monster) =>
    {
      if (monster.name !== session.monsterId)
      {
        return false;
      }

      const remaining = Math.max(
        0,
        Number(monster.required || 0) -
          Number(monster.zapped || 0) -
          Number(monster.breeding || 0)
      );

      return remaining > 0;
    });

    if (monsterIndex === -1)
    {
      return { ok: false, reason: "missing_monster" };
    }

    if (!targetSheet.isActive && !options.activateIfNeeded)
    {
      return { ok: false, reason: "requires_activation" };
    }

    if (!targetSheet.isActive && options.activateIfNeeded)
    {
      updateSheet(sheetKey, (draft) =>
      {
        if (!draft.isActive)
        {
          draft.isActive = true;
          draft.activatedAt = new Date().toISOString();
        }

        return draft;
      });
    }

    setBreedingSessions((prev) =>
      prev.map((entry) =>
      {
        if (entry.id !== sessionId)
        {
          return entry;
        }

        return {
          ...entry,
          source: "assigned",
          sheetId: sheetKey,
        };
      })
    );

    if (session.status === "breeding")
    {
      updateMonster(sheetIndex, monsterIndex, "breeding", 1, {
        islandName: session.islandId,
      });
    }
    else if (session.status === "nursery")
    {
      updateSheet(sheetKey, (draft) =>
      {
        const monster = draft.monsters[monsterIndex];

        if (!monster)
        {
          return draft;
        }

        const actualRemaining = Math.max(
          0,
          Number(monster.required || 0) - Number(monster.zapped || 0)
        );

        monster.breeding = clamp(
          Number(monster.breeding || 0) + 1,
          0,
          actualRemaining
        );

        return draft;
      });
    }

    return { ok: true };
  };

  const assignAndZapBreedingSession = (sessionId, sheetKey) =>
  {
    const session = breedingSessions.find(
      (entry) => entry.id === sessionId && entry.status === "breeding"
    );
    const targetSheet = sheets.find((sheet) => sheet.key === sheetKey) || null;

    if (!session || !targetSheet || !targetSheet.isActive)
    {
      if (typeof import.meta !== "undefined" && import.meta.env?.DEV)
      {
        console.warn("Assign + Zap failed before target resolution", {
          sessionId,
          sheetKey,
          sessionMonster: session?.monsterId || null,
          hasTargetSheet: Boolean(targetSheet),
          isTargetSheetActive: Boolean(targetSheet?.isActive),
        });
      }

      return { ok: false, reason: "missing_target" };
    }

    const monsterIndex = findMonsterRowIndex(targetSheet.monsters, session.monsterId);
    const targetMonster = monsterIndex >= 0 ? targetSheet.monsters[monsterIndex] : null;

    if (
      !targetMonster ||
      Math.max(
        0,
        Number(targetMonster.required || 0) - Number(targetMonster.zapped || 0)
      ) <= 0
    )
    {
      if (typeof import.meta !== "undefined" && import.meta.env?.DEV)
      {
        console.warn("Assign + Zap could not resolve a valid target row", {
          sessionId,
          sheetKey,
          sessionMonster: session.monsterId,
          resolvedMonsterIndex: monsterIndex,
          resolvedMonsterName: targetMonster?.name || null,
        });
      }

      return { ok: false, reason: "missing_monster" };
    }

    let didUpdateTargetRow = false;

    updateSheet(sheetKey, (draft) =>
    {
      const draftMonsterIndex = findMonsterRowIndex(draft.monsters, session.monsterId);
      const draftMonster = draftMonsterIndex >= 0 ? draft.monsters[draftMonsterIndex] : null;

      if (
        !draftMonster ||
        Math.max(
          0,
          Number(draftMonster.required || 0) - Number(draftMonster.zapped || 0)
        ) <= 0
      )
      {
        return draft;
      }

      const previousZapped = Number(draftMonster.zapped || 0);
      const nextZapped = clamp(previousZapped + 1, 0, Number(draftMonster.required || 0));
      const actualDelta = nextZapped - previousZapped;

      if (actualDelta <= 0)
      {
        return draft;
      }

      draftMonster.zapped = nextZapped;
      draftMonster.breeding = clamp(
        Number(draftMonster.breeding || 0) - actualDelta,
        0,
        Number(draftMonster.required || 0)
      );
      draftMonster.breedingAssignments = consumeBreedingAssignments(
        draftMonster.breedingAssignments,
        actualDelta,
        session.islandId
      );
      didUpdateTargetRow = true;

      return draft;
    });

    if (!didUpdateTargetRow)
    {
      if (typeof import.meta !== "undefined" && import.meta.env?.DEV)
      {
        console.warn("Assign + Zap aborted because the target row update did not succeed", {
          sessionId,
          sheetKey,
          sessionMonster: session.monsterId,
          resolvedMonsterName: targetMonster.name,
        });
      }

      return { ok: false, reason: "update_failed" };
    }

    setBreedingSessions((prev) =>
      prev.map((entry) =>
      {
        if (entry.id !== sessionId)
        {
          return entry;
        }

        return {
          ...entry,
          source: "assigned",
          sheetId: sheetKey,
          status: "completed",
        };
      })
    );

    if (typeof import.meta !== "undefined" && import.meta.env?.DEV)
    {
      console.info("Assign + Zap succeeded", {
        sessionId,
        sessionMonster: session.monsterId,
        targetSheetKey: sheetKey,
        targetSheetTitle: targetSheet.sheetTitle,
        targetRowName: targetMonster.name,
      });
    }

    return { ok: true };
  };

  const moveBreedingSessionToNursery = (sessionId) =>
  {
    const session = breedingSessions.find(
      (entry) => entry.id === sessionId && entry.status === "breeding"
    );
    const islandEntry = session ? islandPlannerByName.get(session.islandId) : null;

    if (
      !session ||
      !islandEntry ||
      !islandEntry.isUnlocked ||
      Number(islandEntry.freeNurseries || 0) <= 0
    )
    {
      return;
    }

    if (session.sheetId)
    {
      const sheetIndex = sheets.findIndex((sheet) => sheet.key === session.sheetId);

      if (sheetIndex === -1)
      {
        return;
      }

      updateSheet(session.sheetId, (draft) =>
      {
        const monster = draft.monsters.find((entry) => entry.name === session.monsterId);

        if (!monster)
        {
          return draft;
        }

        monster.breedingAssignments = consumeBreedingAssignments(
          monster.breedingAssignments,
          1,
          session.islandId
        );

        return draft;
      });
    }

    setBreedingSessions((prev) =>
      prev.map((entry) =>
      {
        if (entry.id !== sessionId)
        {
          return entry;
        }

        return {
          ...entry,
          status: "nursery",
        };
      })
    );
  };

  const hatchNurserySession = (sessionId) =>
  {
    const session = breedingSessions.find(
      (entry) => entry.id === sessionId && entry.status === "nursery"
    );

    if (!session)
    {
      return;
    }

    if (session.sheetId)
    {
      const sheetIndex = sheets.findIndex((sheet) => sheet.key === session.sheetId);

      if (sheetIndex >= 0)
      {
        const monsterIndex = sheets[sheetIndex].monsters.findIndex(
          (monster) => monster.name === session.monsterId
        );

        if (monsterIndex >= 0)
        {
          updateMonster(sheetIndex, monsterIndex, "breeding", -1, {
            islandName: session.islandId,
          });
        }
      }
    }

    completeBreedingSession(sessionId);
  };

  const zapAssignedSessionFromPlanner = (item) =>
  {
    if (
      item.sheetIndex === undefined ||
      item.monsterIndex === undefined ||
      !Array.isArray(item.sessionIds) ||
      item.sessionIds.length === 0
    )
    {
      return;
    }

    updateMonster(item.sheetIndex, item.monsterIndex, "zapped", 1, {
      islandName: item.island || "",
    });
    completeBreedingSession(item.sessionIds[0]);
  };

  const breedFromPlanner = (item) =>
{
    const islandEntry = islandPlannerByName.get(item.island);

    if (!islandEntry || !islandEntry.isUnlocked || islandEntry.freeSlots <= 0)
    {
      return;
    }

    updateMonster(item.sheetIndex, item.monsterIndex, "breeding", 1, {
      islandName: item.island,
    });
  };

  const adjustSelectedSheetMonster = (monsterIndex, field, delta, options = {}) =>
  {
    if (selectedSheetIndex < 0)
    {
      return;
    }

    updateMonster(selectedSheetIndex, monsterIndex, field, delta, options);
  };

  const breedSelectedSheetMonsterOnIsland = (monsterIndex, islandName) =>
  {
    if (!selectedSheet || selectedSheetIndex < 0 || !selectedSheet.isActive)
    {
      return;
    }

    breedFromPlanner({
      sheetIndex: selectedSheetIndex,
      monsterIndex,
      island: islandName,
    });
  };

  const zapSelectedSheetMonsterReady = (monsterIndex, sessionId, islandName) =>
  {
    if (selectedSheetIndex < 0 || !sessionId)
    {
      return;
    }

    zapAssignedSessionFromPlanner({
      sheetIndex: selectedSheetIndex,
      monsterIndex,
      sessionIds: [sessionId],
      island: islandName || "",
    });
  };

  const activateSheetAndOpen = (sheetKey) =>
{
    const sheet = sheets.find((entry) => entry.key === sheetKey);

    if (!sheet)
    {
      return;
    }

    if (!sheet.isActive)
    {
      const confirmed = window.confirm(
        getSheetActivationPrompt(sheet)
      );

      if (!confirmed)
      {
        return;
      }

      updateSheet(sheetKey, (draft) =>
      {
        if (draft.isActive)
        {
          return draft;
        }

        draft.isActive = true;
        draft.activatedAt = new Date().toISOString();
        return draft;
      });
    }

    openSheet(sheetKey);
  };

  const toggleSheetActive = (sheetKey) => 
{
    updateSheet(sheetKey, (sheet) => 
{
      const nextActive = !sheet.isActive;
      sheet.isActive = nextActive;

      if (nextActive)
      {
        sheet.activatedAt = new Date().toISOString();
      }

      return sheet;
    });
  };

  const toggleSheetCollected = (sheetKey) => 
{
    const targetSheet = sheets.find((entry) => entry.key === sheetKey);

    if (!targetSheet)
    {
      return;
    }

    const templateIdentity = getSheetTemplateIdentity(targetSheet);
    const nextCollected = !getCollectionUnlockedAcrossTemplate(targetSheet, sheets);

    if (!nextCollected)
    {
      const confirmed = window.confirm("Remove collected status?");

      if (!confirmed)
      {
        return;
      }
    }

    if (templateIdentity)
    {
      setSheets((prev) =>
        prev.map((sheet) =>
        {
          if (getSheetTemplateIdentity(sheet) !== templateIdentity)
          {
            return sheet;
          }

          return {
            ...sheet,
            isCollected: nextCollected,
          };
        })
      );

      return;
    }

    updateSheet(sheetKey, (sheet) => 
{
      sheet.isCollected = nextCollected;
      return sheet;
    });
  };

  const resetSheet = (sheetKey) => 
{
    const sheet = sheets.find((entry) => entry.key === sheetKey);

    if (!sheet)
    {
      return;
    }

    const confirmed = window.confirm(
      `Reset all ${getSheetDisplayName(sheet)} progress? This cannot be undone.`
    );

    if (!confirmed)
    {
      return;
    }

    const defaultSheet = buildDefaultSheetForSavedSheet(sheet)
      || DEFAULT_SHEETS.find((entry) => entry.key === sheetKey);

    if (!defaultSheet)
    {
      return;
    }

    setSheets((prev) =>
      prev.map((entry) =>
        entry.key === sheetKey
          ? mergeSheetWithDefaults(defaultSheet, null)
          : entry
      )
    );
  };

  const needNowIslandCount = islandPlannerData.filter(
    (island) => Array.isArray(island.needNow) && island.needNow.length > 0
  ).length;
  const breedableIslandCount = islandPlannerData.filter(
    (island) => island.isUnlocked && Number(island.freeSlots || 0) > 0
  ).length;
  const activeIslandSessionCount = islandPlannerData.reduce(
    (sum, island) =>
      sum
      + Number(island.currentlyBreeding?.length || 0)
      + Number(island.nurserySessions?.length || 0),
    0
  );
  const queuePressureCount = topQueueItems.reduce(
    (sum, item) => sum + Number(item.actualRemaining || 0),
    0
  );

  const openScreenByKey = (screenKey) =>
  {
    switch (screenKey)
    {
      case "home":
        openHome();
        break;
      case "active":
        openActiveSheets();
        break;
      case "collections":
        openCollections();
        break;
      case "queue":
        openQueue();
        break;
      case "planner":
        openIslandPlanner();
        break;
      case "directory":
        openDirectory();
        break;
      default:
        break;
    }
  };

  return (
    <div
      className="app-shell"
      style={{
        width: "100%",
      }}
    >
      <h1
        className="app-title"
        style={{
          fontSize: "clamp(40px, 8vw, 68px)",
          lineHeight: 0.95,
          margin: "0 0 10px",
          letterSpacing: "-0.04em",
        }}
      >
        MSM Tracker
      </h1>

      <div style={{ fontSize: "16px", opacity: 0.72, marginBottom: "4px" }}>
        Wublin egg chaos, but dressed better.
      </div>

      {view.screen !== "sheet" && (
        <div className="mobile-screen-nav" style={{ width: "100%" }}>
          <div style={{ fontSize: "12px", fontWeight: 700, opacity: 0.72, marginBottom: "8px" }}>
            Screen
          </div>
          <select
            className="mobile-screen-select"
            value={view.screen}
            onChange={(event) => openScreenByKey(event.target.value)}
          >
            {SCREEN_OPTIONS.map((screen) => (
              <option key={`mobile-screen-${screen.key}`} value={screen.key}>
                {screen.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div
        className="top-nav"
        style={{
          width: "100%",
        }}
      >
        <button
          style={{
            ...buttonBaseStyle,
            background: view.screen === "home" ? "rgba(255,255,255,0.18)" : buttonBaseStyle.background,
          }}
          onClick={openHome}
        >
          Dashboard
        </button>

        <button
          style={{
            ...buttonBaseStyle,
            background: view.screen === "active" ? "rgba(255,255,255,0.18)" : buttonBaseStyle.background,
          }}
          onClick={openActiveSheets}
        >
          Active Sheets
        </button>

        <button
          style={{
            ...buttonBaseStyle,
            background: view.screen === "collections" ? "rgba(255,255,255,0.18)" : buttonBaseStyle.background,
          }}
          onClick={openCollections}
        >
          Collections
        </button>

        <button
          style={{
            ...buttonBaseStyle,
            background: view.screen === "queue" ? "rgba(255,255,255,0.18)" : buttonBaseStyle.background,
          }}
          onClick={openQueue}
        >
          Breeding Queue
        </button>

        <button
          style={{
            ...buttonBaseStyle,
            background: view.screen === "planner" ? "rgba(255,255,255,0.18)" : buttonBaseStyle.background,
          }}
          onClick={openIslandPlanner}
        >
          Island Manager
        </button>

        <button
          style={{
            ...buttonBaseStyle,
            background: view.screen === "directory" ? "rgba(255,255,255,0.18)" : buttonBaseStyle.background,
          }}
          onClick={openDirectory}
        >
          Monster Library
        </button>
      </div>

      {view.screen === "home" && (
        <div className="page-surface" style={{ gap: "16px" }}>
          <div className="responsive-page-card" style={{ ...baseCardStyle, display: "grid", gap: "16px" }}>
            <div>
              <div style={{ fontSize: "14px", opacity: 0.7, letterSpacing: "0.06em" }}>
                RIGHT NOW
              </div>
              <div style={{ marginTop: "8px", fontSize: "30px", fontWeight: 700 }}>
                Work the live board, not the brochure
              </div>
              <div style={{ marginTop: "10px", opacity: 0.76 }}>
                Let Island Manager answer what can move, let Active Sheets hold the goals, and let the queue show where pressure is building.
              </div>
            </div>

            <div className="dashboard-command-grid">
              <div className="responsive-section-card" style={baseCardStyle}>
                <div style={{ fontSize: "13px", opacity: 0.7, letterSpacing: "0.06em" }}>
                  NEED NOW
                </div>
                <div style={{ marginTop: "8px", fontSize: "26px", fontWeight: 700 }}>
                  {needNowIslandCount}
                </div>
                <div style={{ marginTop: "6px", opacity: 0.72 }}>
                  islands with tracked work waiting
                </div>
              </div>

              <div className="responsive-section-card" style={baseCardStyle}>
                <div style={{ fontSize: "13px", opacity: 0.7, letterSpacing: "0.06em" }}>
                  BREEDABLE
                </div>
                <div style={{ marginTop: "8px", fontSize: "26px", fontWeight: 700 }}>
                  {breedableIslandCount}
                </div>
                <div style={{ marginTop: "6px", opacity: 0.72 }}>
                  islands with open breeder space
                </div>
              </div>

              <div className="responsive-section-card" style={baseCardStyle}>
                <div style={{ fontSize: "13px", opacity: 0.7, letterSpacing: "0.06em" }}>
                  ACTIVE EGGS
                </div>
                <div style={{ marginTop: "8px", fontSize: "26px", fontWeight: 700 }}>
                  {activeIslandSessionCount}
                </div>
                <div style={{ marginTop: "6px", opacity: 0.72 }}>
                  breeding or nursery sessions in motion
                </div>
              </div>

              <div className="responsive-section-card" style={baseCardStyle}>
                <div style={{ fontSize: "13px", opacity: 0.7, letterSpacing: "0.06em" }}>
                  QUEUE PRESSURE
                </div>
                <div style={{ marginTop: "8px", fontSize: "26px", fontWeight: 700 }}>
                  {queuePressureCount}
                </div>
                <div style={{ marginTop: "6px", opacity: 0.72 }}>
                  tracked eggs still needed across the top queue
                </div>
              </div>
            </div>

            <div style={{ fontSize: "13px", opacity: 0.68 }}>
              If you just opened the app on mobile, start with <strong>Island Manager</strong> for live capacity, then drop into <strong>Active Sheets</strong> when you need the exact row-level work.
            </div>
          </div>

          <div className="dashboard-stat-grid">
            <div className="responsive-section-card" style={baseCardStyle}>
              <div style={{ fontSize: "14px", opacity: 0.7, letterSpacing: "0.06em" }}>
                ACTIVE VESSELS
              </div>
              <div style={{ marginTop: "8px", fontSize: "26px", fontWeight: 700 }}>
                {activeVesselSummary.length}
              </div>
              <div style={{ marginTop: "6px", opacity: 0.72 }}>
                {activeVesselSummary.length === 0
                  ? "No active vessel sheets"
                  : "Vessel sheets currently demanding attention"}
              </div>
            </div>

            <div className="responsive-section-card" style={baseCardStyle}>
              <div style={{ fontSize: "14px", opacity: 0.7, letterSpacing: "0.06em" }}>
                ISLAND COLLECTIONS
              </div>
              <div style={{ marginTop: "8px", fontSize: "26px", fontWeight: 700 }}>
                {islandCollectionProgress.complete} / {islandCollectionProgress.total}
              </div>
              <div style={{ marginTop: "6px", opacity: 0.72 }}>
                {islandCollectionProgress.percent}% island collections complete
              </div>
            </div>

            <div className="responsive-section-card" style={baseCardStyle}>
              <div style={{ fontSize: "14px", opacity: 0.7, letterSpacing: "0.06em" }}>
                BREEDER SPACE
              </div>
              <div style={{ marginTop: "8px", fontSize: "26px", fontWeight: 700 }}>
                {islandCapacitySummary.freeBreeders} free
              </div>
              <div style={{ marginTop: "6px", opacity: 0.72 }}>
                {islandCapacitySummary.totalBreeders} total breeders across unlocked islands
              </div>
            </div>

            <div className="responsive-section-card" style={baseCardStyle}>
              <div style={{ fontSize: "14px", opacity: 0.7, letterSpacing: "0.06em" }}>
                NURSERY SPACE
              </div>
              <div style={{ marginTop: "8px", fontSize: "26px", fontWeight: 700 }}>
                {islandCapacitySummary.freeNurseries} free
              </div>
              <div style={{ marginTop: "6px", opacity: 0.72 }}>
                {islandCapacitySummary.totalNurseries} total nurseries across unlocked islands
              </div>
            </div>
          </div>

          <div className="responsive-page-card" style={{ ...baseCardStyle, display: "grid", gap: "14px" }}>
            <div
              style={{
                display: "flex",
                gap: "12px",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontSize: "14px", opacity: 0.7, letterSpacing: "0.06em" }}>
                  FOCUS
                </div>
                <div style={{ marginTop: "6px", fontSize: "24px", fontWeight: 700 }}>
                  Active sheets driving the next moves
                </div>
              </div>
            </div>

            {activeVesselSummary.length === 0 ? (
              <div style={{ opacity: 0.72 }}>
                No active vessel sheets yet. Activate one from Collections when you want it to start driving island work.
              </div>
            ) : (
              <div style={{ display: "grid", gap: "12px" }}>
                {activeVesselSummary.map((goal) => (
                  <div
                    key={goal.key}
                    onClick={() => openSheet(goal.key)}
                    style={{
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: "16px",
                      padding: "16px",
                      background: goal.complete
                        ? "linear-gradient(180deg, rgba(34,197,94,0.16), rgba(34,197,94,0.06))"
                        : "rgba(255,255,255,0.035)",
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "12px",
                        flexWrap: "wrap",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <div style={{ fontSize: "21px", fontWeight: 700 }}>{goal.name}</div>
                        <div style={{ marginTop: "4px", fontSize: "13px", opacity: 0.72 }}>
                          {goal.collectionName} · {goal.title}
                        </div>
                      </div>

                      <div
                        style={{
                          padding: "6px 12px",
                          borderRadius: "999px",
                          border: "1px solid rgba(255,255,255,0.1)",
                          background: goal.complete
                            ? "rgba(34,197,94,0.2)"
                            : "rgba(245,158,11,0.18)",
                          fontSize: "12px",
                          fontWeight: 700,
                        }}
                      >
                        {goal.complete ? "Collected" : `${goal.remaining} left`}
                      </div>
                    </div>

                    <div style={{ marginTop: "12px", fontSize: "14px", opacity: 0.85 }}>
                      {goal.progress}% zapped · {goal.trackedProgress}% tracked
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="responsive-page-card" style={{ ...baseCardStyle, display: "grid", gap: "14px" }}>
            <div
              style={{
                display: "flex",
                gap: "12px",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontSize: "14px", opacity: 0.7, letterSpacing: "0.06em" }}>
                  QUEUE HIGHLIGHTS
                </div>
                <div style={{ marginTop: "6px", fontSize: "24px", fontWeight: 700 }}>
                  Pipeline pressure at a glance
                </div>
              </div>
            </div>

            {topQueueItems.length === 0 ? (
              <div style={{ opacity: 0.72 }}>No active breeding pressure right now.</div>
            ) : (
              <div style={{ display: "grid", gap: "10px" }}>
                {topQueueItems.map((item) => (
                  <div
                    key={item.name}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "12px",
                      flexWrap: "wrap",
                      padding: "14px 16px",
                      borderRadius: "14px",
                      background: "rgba(255,255,255,0.035)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "18px", fontWeight: 700 }}>{item.name}</div>
                      <div style={{ marginTop: "4px", fontSize: "13px", opacity: 0.72 }}>
                        {(item.islands || []).join(" / ")}
                      </div>
                    </div>

                    <div
                      style={{
                        padding: "6px 12px",
                        borderRadius: "999px",
                        border: "1px solid rgba(255,255,255,0.1)",
                        background: "rgba(255,255,255,0.08)",
                        fontSize: "12px",
                        fontWeight: 700,
                      }}
                    >
                      Need {item.actualRemaining}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {view.screen === "active" && (
        <Suspense fallback={<ScreenLoadingFallback label="Loading Active Sheets..." />}>
          <ActiveSheetsPage
            goals={homeGoals}
            onOpenSheet={openSheet}
            onOpenCollections={openCollections}
          />
        </Suspense>
      )}

      {view.screen === "collections" && (
        <Suspense fallback={<ScreenLoadingFallback label="Loading Collections..." />}>
          <CollectionsPage
            sheets={sheets}
            getDeleteInstanceBlockState={getDeleteSheetInstanceBlockState}
            onOpenSheet={openSheet}
            onCreateAnotherSheetInstance={createAnotherSheetInstance}
            onDeleteSheetInstance={deleteSheetInstance}
            onToggleSheetActive={toggleSheetActive}
          />
        </Suspense>
      )}

      {view.screen === "sheet" && selectedSheet && (
        <>
          <div style={{ marginBottom: "16px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {selectedSheet.isActive && (
              <button style={buttonBaseStyle} onClick={openActiveSheets}>
                ← Active Sheets
              </button>
            )}

            <button style={buttonBaseStyle} onClick={openCollections}>
              ← Collections
            </button>

            {canCreateDuplicateSheetRun(selectedSheet) && (
              <button
                style={buttonBaseStyle}
                onClick={() => createAnotherSheetInstance(selectedSheet.key)}
              >
                Create Another
              </button>
            )}

            <button
              onClick={() => toggleSheetActive(selectedSheet.key)}
              style={{
                ...buttonBaseStyle,
                background: selectedSheet.isActive
                  ? "rgba(245,158,11,0.2)"
                  : "rgba(34,197,94,0.2)",
              }}
            >
              {selectedSheet.isActive
                ? `Deactivate ${getSheetDisplayName(selectedSheet)}`
                : `Activate ${getSheetDisplayName(selectedSheet)}`}
            </button>

            <button
              onClick={() => toggleSheetCollected(selectedSheet.key)}
              style={{
                ...buttonBaseStyle,
                background: selectedSheet.isCollected
                  ? "rgba(239,68,68,0.2)"
                  : "rgba(34,197,94,0.2)",
              }}
            >
              {selectedSheet.isCollected ? "Remove Collected" : "Mark Collected"}
            </button>

            {selectedSheet.isActive && hasSheetProgress(selectedSheet) && (
              <button
                onClick={() => resetSheet(selectedSheet.key)}
                style={{
                  ...buttonBaseStyle,
                  background: "rgba(239,68,68,0.2)",
                }}
              >
                Reset {getSheetDisplayName(selectedSheet)}
              </button>
            )}
          </div>

          <Suspense fallback={<ScreenLoadingFallback label={`Loading ${getSheetDisplayName(selectedSheet)}...`} />}>
            <TrackerSheet
              data={selectedSheet}
              islandStates={islandStates}
              islandPlannerByName={islandPlannerByName}
              breedingSessions={breedingSessions}
              assignableSessions={selectedSheetAssignableSessions}
              onAdjustMonster={adjustSelectedSheetMonster}
              onBreedOnIsland={breedSelectedSheetMonsterOnIsland}
              onZapReady={zapSelectedSheetMonsterReady}
              onAssignExistingBreeding={(sessionId) =>
                assignExistingBreedingSession(sessionId, selectedSheet.key)
              }
              onActivateAndAssignExistingBreeding={(sessionId) =>
                assignExistingBreedingSession(sessionId, selectedSheet.key, {
                  activateIfNeeded: true,
                })
              }
            />
          </Suspense>
        </>
      )}

      {view.screen === "queue" && (
        <>
          <div style={{ marginBottom: "16px" }}>
            <button style={buttonBaseStyle} onClick={openHome}>
              ← Home
            </button>
          </div>

          <Suspense fallback={<ScreenLoadingFallback label="Loading Breeding Queue..." />}>
            <BreedingQueue
              sheets={sheets}
              breedingSessions={breedingSessions}
              islandPlannerData={islandPlannerData}
              onZapBreedingSession={zapAssignedSessionFromPlanner}
              onBreedFromQueue={breedFromPlanner}
            />
          </Suspense>
        </>
      )}

      {view.screen === "planner" && (
        <>
          <div style={{ marginBottom: "16px" }}>
            <button style={buttonBaseStyle} onClick={openHome}>
              ← Home
            </button>
          </div>

          <Suspense fallback={<ScreenLoadingFallback label="Loading Island Manager..." />}>
            <IslandPlanner
              plannerData={islandPlannerData}
              unlockIsland={unlockIsland}
              unlockIslandBreedingStructure={unlockIslandBreedingStructure}
              unlockIslandNursery={unlockIslandNursery}
              reduceIslandBreedingStructure={reduceIslandBreedingStructure}
              reduceIslandNursery={reduceIslandNursery}
              onZapFromPlanner={zapAssignedSessionFromPlanner}
              onBreedFromPlanner={breedFromPlanner}
              onCreateManualBreed={createManualBreedingSession}
              onAssignAndZapFromPlanner={assignAndZapBreedingSession}
              onMoveToNurseryFromPlanner={moveBreedingSessionToNursery}
              onHatchNurseryFromPlanner={hatchNurserySession}
            />
          </Suspense>
        </>
      )}

      {view.screen === "directory" && (
        <>
          <div style={{ marginBottom: "16px" }}>
            <button style={buttonBaseStyle} onClick={openHome}>
              ← Home
            </button>
          </div>

          <Suspense fallback={<ScreenLoadingFallback label="Loading Monster Library..." />}>
            <MonsterDirectory />
          </Suspense>
        </>
      )}
    </div>
  );
}
