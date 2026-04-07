import React, { Suspense, lazy, useEffect, useMemo, useState } from "react";
import packageJson from "../package.json";
import {
  createTrackerSheetInstanceFromSeed,
  TRACKER_SHEET_DEFAULTS,
} from "./data/sheets";
import {
  getIslandOperationalProfile,
  ISLAND_STATE_DEFAULTS,
} from "./data/islands";
import { buildBreedingQueue, buildIslandPlannerData } from "./utils/queue";
import { COLLECTIONS } from "./data/collections";
import {
  addBreedingAssignment,
  consumeBreedingAssignments,
  getAssignedBreedingTotal,
  getMonsterBreedingIslands,
  isRealBreedingIsland,
  trimBreedingAssignments,
} from "./utils/monsterMetadata";
import HomeDashboard from "./components/HomeDashboard";
import {
  buildDefaultSheetForSavedSheet,
  clamp,
  createBreedingSessionId,
  deepClone,
  findMonsterRowIndex,
  loadInitialAppState,
  mergeSheetWithDefaults,
  parseBackupPayload,
  reconcileBreedingSessions,
  saveJsonValue,
  serializeBackupPayload,
  STORAGE_KEYS,
} from "./utils/persistence";

const DEFAULT_SHEETS = TRACKER_SHEET_DEFAULTS;
const APP_VERSION = packageJson.version;
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
  const [initialAppState] = useState(() =>
    loadInitialAppState({
      defaultSheets: DEFAULT_SHEETS,
      defaultCollections: COLLECTIONS,
    })
  );
  const [view, setView] = useState(() => initialAppState.view);
  const [sheets, setSheets] = useState(() => initialAppState.sheets);
  const [collectionsData, setCollectionsData] = useState(() => initialAppState.collectionsData);
  const [islandStates, setIslandStates] = useState(() => initialAppState.islandStates);
  const [storedBreedingSessions, setBreedingSessions] = useState(
    () => initialAppState.breedingSessions
  );
  const [backupMessage, setBackupMessage] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const breedingSessions = useMemo(
    () => reconcileBreedingSessions(storedBreedingSessions, sheets),
    [storedBreedingSessions, sheets]
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
    saveJsonValue(STORAGE_KEYS.sheets, sheets);
  }, [sheets]);

  useEffect(() => 
{
    saveJsonValue(STORAGE_KEYS.view, view);
  }, [view]);

  useEffect(() => 
{
    saveJsonValue(STORAGE_KEYS.collections, collectionsData);
  }, [collectionsData]);

  useEffect(() =>
{
    saveJsonValue(STORAGE_KEYS.islandState, islandStates);
  }, [islandStates]);

  useEffect(() =>
  {
    saveJsonValue(STORAGE_KEYS.breedingSessions, breedingSessions);
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

  const handleExportBackup = () =>
  {
    try
    {
      const rawBackup = serializeBackupPayload({
        appVersion: APP_VERSION,
        sheets,
        view,
        collectionsData,
        islandStates,
        breedingSessions,
      });
      const exportBlob = new Blob([rawBackup], { type: "application/json" });
      const exportUrl = window.URL.createObjectURL(exportBlob);
      const downloadLink = document.createElement("a");
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

      downloadLink.href = exportUrl;
      downloadLink.download = `msm-tracker-backup-${timestamp}.json`;
      downloadLink.click();
      window.URL.revokeObjectURL(exportUrl);
      setBackupMessage({
        kind: "success",
        text: "Backup exported. Keep that JSON somewhere safe before device changes.",
      });
    }
    catch (error)
    {
      console.error("Failed to export backup", error);
      setBackupMessage({
        kind: "error",
        text: "Backup export failed. Try again after the current changes settle.",
      });
    }
  };

  const handleImportBackup = async (file) =>
  {
    setIsImporting(true);

    try
    {
      const parsedBackup = parseBackupPayload(await file.text(), {
        defaultSheets: DEFAULT_SHEETS,
        defaultCollections: COLLECTIONS,
      });

      setView(parsedBackup.view);
      setSheets(parsedBackup.sheets);
      setCollectionsData(parsedBackup.collectionsData);
      setIslandStates(parsedBackup.islandStates);
      setBreedingSessions(parsedBackup.breedingSessions);
      setBackupMessage({
        kind: "success",
        text: parsedBackup.meta.exportedAt
          ? `Backup restored from ${parsedBackup.meta.exportedAt}.`
          : "Backup restored successfully.",
      });
    }
    catch (error)
    {
      console.error("Failed to import backup", error);
      setBackupMessage({
        kind: "error",
        text: error instanceof Error
          ? error.message
          : "That backup could not be imported.",
      });
    }
    finally
    {
      setIsImporting(false);
    }
  };

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

  const createObservedLiveSession = (monsterId, islandId, status = "breeding") =>
  {
    const normalizedMonsterId = typeof monsterId === "string" ? monsterId.trim() : "";
    const normalizedIslandId = typeof islandId === "string" ? islandId.trim() : "";
    const normalizedStatus = status === "nursery" ? "nursery" : "breeding";

    if (!normalizedMonsterId || !isRealBreedingIsland(normalizedIslandId))
    {
      return { ok: false, reason: "invalid_target" };
    }

    setBreedingSessions((prev) => [
      ...prev,
      {
        id: createBreedingSessionId(),
        monsterId: normalizedMonsterId,
        islandId: normalizedIslandId,
        source: "reconciled",
        sheetId: null,
        sheetTitle: normalizedStatus === "nursery"
          ? "Unassigned nursery"
          : "Unassigned breeding",
        status: normalizedStatus,
        createdAt: Date.now(),
      },
    ]);

    return { ok: true };
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

  const unassignBreedingSession = (sessionId) =>
  {
    const session = breedingSessions.find(
      (entry) =>
        entry.id === sessionId
        && entry.status !== "completed"
        && Boolean(entry.sheetId)
    );

    if (!session)
    {
      return { ok: false, reason: "missing_session" };
    }

    const confirmed = window.confirm(
      `Unassign ${session.monsterId} from ${session.sheetTitle || "this target"}? The live session will stay on ${session.islandId}, but the tracker link will be cleared so you can assign it somewhere else.`
    );

    if (!confirmed)
    {
      return { ok: false, reason: "cancelled" };
    }

    const sheetIndex = sheets.findIndex((sheet) => sheet.key === session.sheetId);

    if (sheetIndex >= 0)
    {
      const monsterIndex = findMonsterRowIndex(sheets[sheetIndex].monsters, session.monsterId);

      if (monsterIndex >= 0)
      {
        updateMonster(sheetIndex, monsterIndex, "breeding", -1, {
          islandName: session.islandId,
        });
      }
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
          source: "unassigned",
          sheetId: null,
          sheetTitle: "Unassigned breeding",
        };
      })
    );

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

  const clearBreedingSessionFromBoard = (sessionId) =>
  {
    const session = breedingSessions.find(
      (entry) => entry.id === sessionId && entry.status !== "completed"
    );

    if (!session)
    {
      return { ok: false, reason: "missing_session" };
    }

    const confirmed = window.confirm(
      `Remove ${session.monsterId} from the live board on ${session.islandId}? This will clear the tracked live session without changing any sheet counts.`
    );

    if (!confirmed)
    {
      return { ok: false, reason: "cancelled" };
    }

    completeBreedingSession(sessionId);
    return { ok: true };
  };

  const clearIslandLiveSessions = (islandName, statusFilter = "all") =>
  {
    const targetSessions = breedingSessions.filter((entry) =>
    {
      if (entry.status === "completed" || entry.islandId !== islandName)
      {
        return false;
      }

      if (statusFilter === "all")
      {
        return true;
      }

      return entry.status === statusFilter;
    });

    if (targetSessions.length === 0)
    {
      return { ok: false, reason: "missing_sessions" };
    }

    const assignedCount = targetSessions.filter((entry) => Boolean(entry.sheetId)).length;
    const sessionLabel = statusFilter === "nursery"
      ? "nursery slot"
      : statusFilter === "breeding"
        ? "breeder slot"
        : "live board session";
    const confirmed = window.confirm(
      `Clear ${targetSessions.length} ${sessionLabel}${targetSessions.length === 1 ? "" : "s"} on ${islandName}?`
      + (assignedCount > 0
        ? ` ${assignedCount} linked sheet reservation${assignedCount === 1 ? " will" : "s will"} also be released so you can resync this island cleanly.`
        : " This will only clear the live board tracking for this island.")
    );

    if (!confirmed)
    {
      return { ok: false, reason: "cancelled" };
    }

    const targetSessionIds = new Set(targetSessions.map((entry) => entry.id));

    setSheets((prev) =>
      prev.map((sheet) =>
      {
        let didChangeSheet = false;

        const nextMonsters = sheet.monsters.map((monster) =>
        {
          let nextMonster = monster;

          targetSessions.forEach((session) =>
          {
            if (session.sheetId !== sheet.key || session.monsterId !== monster.name)
            {
              return;
            }

            const previousBreeding = Number(nextMonster.breeding || 0);
            const nextBreeding = clamp(
              previousBreeding - 1,
              0,
              Number(nextMonster.required || 0)
            );
            const nextAssignments = session.status === "breeding"
              ? consumeBreedingAssignments(
                nextMonster.breedingAssignments,
                1,
                session.islandId
              )
              : nextMonster.breedingAssignments;

            if (
              nextBreeding !== previousBreeding
              || nextAssignments !== nextMonster.breedingAssignments
            )
            {
              nextMonster = {
                ...nextMonster,
                breeding: nextBreeding,
                breedingAssignments: nextAssignments,
              };
              didChangeSheet = true;
            }
          });

          return nextMonster;
        });

        return didChangeSheet
          ? {
              ...sheet,
              monsters: nextMonsters,
            }
          : sheet;
      })
    );

    setBreedingSessions((prev) =>
      prev.map((entry) =>
      {
        if (!targetSessionIds.has(entry.id))
        {
          return entry;
        }

        return {
          ...entry,
          status: "completed",
          source: entry.sheetId ? "reset" : entry.source,
          sheetId: null,
          sheetTitle: entry.status === "nursery"
            ? "Unassigned nursery"
            : "Unassigned breeding",
        };
      })
    );

    return { ok: true };
  };

  const clearIslandBreeders = (islandName) => clearIslandLiveSessions(islandName, "breeding");
  const clearIslandNurseries = (islandName) => clearIslandLiveSessions(islandName, "nursery");
  const resetIslandLiveBoard = (islandName) => clearIslandLiveSessions(islandName, "all");

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

  const updateCollectionEntryStatus = (collectionKey, entryName, nextStatus) =>
  {
    if (!collectionKey || !entryName)
    {
      return;
    }

    setCollectionsData((prev) =>
      prev.map((collection) =>
      {
        if (collection.key !== collectionKey)
        {
          return collection;
        }

        return {
          ...collection,
          entries: collection.entries.map((entry) =>
          {
            if (entry.name !== entryName)
            {
              return entry;
            }

            if (nextStatus === "complete")
            {
              return {
                ...entry,
                collected: true,
                status: "complete",
              };
            }

            if (nextStatus === "in_progress")
            {
              return {
                ...entry,
                collected: false,
                status: "in_progress",
              };
            }

            return {
              ...entry,
              collected: false,
              status: "inactive",
            };
          }),
        };
      })
    );
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

      if (targetSheet.collectionKey && targetSheet.templateName)
      {
        updateCollectionEntryStatus(
          targetSheet.collectionKey,
          targetSheet.templateName,
          nextCollected ? "complete" : "not_started"
        );
      }

      return;
    }

    updateSheet(sheetKey, (sheet) => 
{
      sheet.isCollected = nextCollected;
      return sheet;
    });

    if (targetSheet.collectionKey && targetSheet.templateName)
    {
      updateCollectionEntryStatus(
        targetSheet.collectionKey,
        targetSheet.templateName,
        nextCollected ? "complete" : "not_started"
      );
    }
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
        <HomeDashboard
          needNowIslandCount={needNowIslandCount}
          breedableIslandCount={breedableIslandCount}
          activeIslandSessionCount={activeIslandSessionCount}
          queuePressureCount={queuePressureCount}
          activeVesselSummary={activeVesselSummary}
          islandCollectionProgress={islandCollectionProgress}
          islandCapacitySummary={islandCapacitySummary}
          topQueueItems={topQueueItems}
          onOpenIslandPlanner={openIslandPlanner}
          onOpenActiveSheets={openActiveSheets}
          onOpenCollections={openCollections}
          onOpenQueue={openQueue}
          onOpenSheet={openSheet}
          onExportBackup={handleExportBackup}
          onImportBackup={handleImportBackup}
          backupMessage={backupMessage}
          isImporting={isImporting}
        />
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
            collectionsData={collectionsData}
            getDeleteInstanceBlockState={getDeleteSheetInstanceBlockState}
            onOpenSheet={openSheet}
            onCreateAnotherSheetInstance={createAnotherSheetInstance}
            onDeleteSheetInstance={deleteSheetInstance}
            onUpdateCollectionEntryStatus={updateCollectionEntryStatus}
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
              onCreateObservedLiveSession={createObservedLiveSession}
              onAssignAndZapFromPlanner={assignAndZapBreedingSession}
              onUnassignFromPlanner={unassignBreedingSession}
              onClearPlannerSession={clearBreedingSessionFromBoard}
              onClearIslandBreeders={clearIslandBreeders}
              onClearIslandNurseries={clearIslandNurseries}
              onResetIslandLiveBoard={resetIslandLiveBoard}
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
