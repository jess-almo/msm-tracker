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
import {
  buildBlockedBreedingQueue,
  buildIslandPlannerData,
  FOCUSED_OPERATIONAL_LIMIT,
  buildReadyBreedingQueue,
} from "./utils/queue";
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
  appendActivityLogEntry,
  buildDefaultSheetForSavedSheet,
  clamp,
  createBreedingSessionId,
  deepClone,
  findMonsterRowIndex,
  loadInitialAppState,
  mergeSheetWithDefaults,
  parseBackupPayload,
  reconcileBreedingSessions,
  saveAppSnapshot,
  saveJsonValue,
  serializeBackupPayload,
  STORAGE_KEYS,
} from "./utils/persistence";
import { applyCollectionEntryStatus, getCollectionEntryStatus } from "./utils/collectionStatus";

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

const APP_ICON_SRC = "/branding/app-icon.png";

const SCREEN_OPTIONS = [
  { key: "home", label: "Dashboard" },
  { key: "active", label: "Active Sheets" },
  { key: "collections", label: "Collections" },
  { key: "queue", label: "Breeding Queue" },
  { key: "planner", label: "Island Manager" },
  { key: "directory", label: "Monster Library" },
];

class ScreenErrorBoundary extends React.Component
{
  constructor(props)
  {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error)
  {
    return {
      hasError: true,
      errorMessage: error instanceof Error ? error.message : "Unknown screen error.",
    };
  }

  componentDidCatch(error)
  {
    console.error("Screen render failed", error);
  }

  handleReset = () =>
  {
    this.setState({ hasError: false });
    this.props.onReset?.();
  };

  render()
  {
    if (this.state.hasError)
    {
      return (
        <div
          className="responsive-page-card"
          style={{
            ...baseCardStyle,
            display: "grid",
            gap: "10px",
          }}
        >
          <div style={{ fontSize: "14px", opacity: 0.7, letterSpacing: "0.06em" }}>
            SCREEN ERROR
          </div>
          <div style={{ fontSize: "24px", fontWeight: 700 }}>
            That screen failed to load.
          </div>
          <div style={{ opacity: 0.7 }}>
            {this.props.label || "Current screen"}: {this.state.errorMessage || "Unknown screen error."}
          </div>
          <div style={{ opacity: 0.74 }}>
            Jump back to Dashboard and we can keep using the tracker while we fix the broken view.
          </div>
          <div>
            <button style={buttonBaseStyle} onClick={this.handleReset}>
              Return to Dashboard
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

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
  if (getSheetType(sheet) !== "island" && sheet.isCollected)
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
  if (getSheetType(sheet) === "island")
  {
    return sheet.monsters.every((monster) => (monster.zapped || 0) >= monster.required);
  }

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

function isValidCollectionEntry(entry)
{
  return Boolean(entry && typeof entry === "object" && typeof entry.name === "string" && entry.name.trim());
}

function getCollectionWorldStatusSortRank(status)
{
  const order = {
    active: 0,
    in_progress: 1,
    not_started: 2,
    complete: 3,
  };

  return Number.isFinite(order[status]) ? order[status] : 9;
}

function getVesselFamilyKey(sheet)
{
  const collectionKey = sheet?.collectionKey || "";

  if (collectionKey.includes("amber"))
  {
    return "amber";
  }

  if (collectionKey.includes("wublin"))
  {
    return "wublin";
  }

  if (collectionKey.includes("celestial"))
  {
    return "celestial";
  }

  return "other";
}

function getSheetFocusRankValue(sheet)
{
  const parsedRank = Number(sheet?.focusRank);

  return Number.isFinite(parsedRank) ? parsedRank : Number.MAX_SAFE_INTEGER;
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

  const focusRankDelta = getSheetFocusRankValue(a) - getSheetFocusRankValue(b);

  if (focusRankDelta !== 0)
  {
    return focusRankDelta;
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

function isBackgroundOperationalSheet(sheet)
{
  return getSheetType(sheet) === "island" && sheet?.status === "ACTIVE";
}

function isOperationalSheet(sheet)
{
  return Boolean(sheet && sheet.status === "ACTIVE" && (sheet.isActive || isBackgroundOperationalSheet(sheet)));
}

function normalizeFocusedSheetRanks(nextSheets)
{
  const orderedFocusedSheets = [...nextSheets.filter((sheet) => sheet.isActive)]
    .sort(compareActiveSheetsByActivationOrder);
  const focusRankByKey = new Map(
    orderedFocusedSheets.map((sheet, index) => [sheet.key, index + 1])
  );

  return nextSheets.map((sheet) =>
  {
    if (!sheet.isActive)
    {
      return {
        ...sheet,
        focusRank: null,
      };
    }

    return {
      ...sheet,
      focusRank: focusRankByKey.get(sheet.key) ?? null,
    };
  });
}

function normalizeIslandCollectionMonsterFocus(monsters)
{
  const normalizedMonsters = Array.isArray(monsters) ? monsters : [];
  const focusedMonsters = normalizedMonsters
    .map((monster, monsterIndex) => ({
      monster,
      monsterIndex,
      focusRank: getIslandCollectionMonsterFocusRank(monster?.collectionFocusRank),
    }))
    .filter(({ focusRank }) => focusRank !== null)
    .sort((a, b) => a.focusRank - b.focusRank || a.monsterIndex - b.monsterIndex)
    .slice(0, 3);
  const focusRankByIndex = new Map(
    focusedMonsters.map(({ monsterIndex }, index) => [monsterIndex, index + 1])
  );

  return normalizedMonsters.map((monster, monsterIndex) => ({
    ...monster,
    collectionFocusRank: focusRankByIndex.get(monsterIndex) ?? null,
  }));
}

function getIslandCollectionMonsterFocusRank(value)
{
  const parsedValue = Number(value);

  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : null;
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
  const indexedOperationalSheets = useMemo(
    () =>
      sheets
        .map((sheet, sheetIndex) => ({ ...sheet, sheetIndex }))
        .filter((sheet) => isOperationalSheet(sheet)),
    [sheets]
  );

  const islandPlannerData = useMemo(
    () => buildIslandPlannerData(indexedOperationalSheets, islandStates, breedingSessions, sheets),
    [indexedOperationalSheets, islandStates, breedingSessions, sheets]
  );
  const islandPlannerByName = useMemo(
    () => new Map(islandPlannerData.map((entry) => [entry.island, entry])),
    [islandPlannerData]
  );
  const readyQueue = useMemo(
    () => buildReadyBreedingQueue(sheets, islandPlannerData),
    [sheets, islandPlannerData]
  );
  const blockedQueue = useMemo(
    () => buildBlockedBreedingQueue(sheets, islandPlannerData),
    [sheets, islandPlannerData]
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
      focusRank: getSheetFocusRankValue(sheet),
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
  const vesselSheets = useMemo(
    () => sheets.filter((sheet) => getSheetType(sheet) === "vessel"),
    [sheets]
  );
  const collectionsByKey = useMemo(
    () => new Map((Array.isArray(collectionsData) && collectionsData.length > 0 ? collectionsData : COLLECTIONS)
      .filter((collection) => collection && typeof collection === "object")
      .map((collection) => [collection.key, collection])),
    [collectionsData]
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
  const collectionWorldHighlights = useMemo(() =>
  {
    const islandHighlights = islandCollectionSheets.map((sheet) =>
    {
      const progress = getSheetProgress(sheet);
      const trackedProgress = getSheetTrackedProgress(sheet);
      const islandState = islandStates.find((entry) => entry.name === sheet.island);
      const isLocked = islandState?.isUnlocked === false;
      const groupLabel = islandState?.group
        ? islandState.group[0].toUpperCase() + islandState.group.slice(1).replace(/_/g, " ")
        : "Island";
      const status = isLocked
        ? "not_started"
        : sheet.isActive
          ? "active"
          : isSheetComplete(sheet)
            ? "complete"
            : trackedProgress > 0 || progress > 0
              ? "in_progress"
              : "not_started";

      return {
        key: `sheet:${sheet.key}`,
        kind: "sheet",
        targetKey: sheet.key,
        title: sheet.island,
        status,
        isLocked,
        progressPercent: progress,
        trackedPercent: trackedProgress,
        summaryValue: `${sheet.monsters.reduce((sum, monster) => sum + Number(monster.zapped || 0), 0)} / ${sheet.monsters.reduce((sum, monster) => sum + Number(monster.required || 0), 0)}`,
        summaryLabel: "collected",
        chips: [
          groupLabel,
          ...(sheet.island.includes("Mirror") ? ["Mirror"] : []),
          ...(sheet.island === "Seasonal Shanty" ? ["Seasonal"] : []),
        ],
        supportingCopy: isLocked
          ? "Unlock in Island Manager first."
          : `${trackedProgress}% tracked across this checklist.`,
      };
    });

    const specialDefinitions = [
      {
        key: "amber_island",
        familyKey: "amber",
        collectionKey: "amber_island",
        title: "Amber Island",
        chips: ["Vessels", "Relics", "Limited"],
      },
      {
        key: "wublin_island",
        familyKey: "wublin",
        collectionKey: "wublins",
        title: "Wublin Island",
        chips: ["Zap", "Statues", "Timed"],
      },
      {
        key: "celestial_island",
        familyKey: "celestial",
        collectionKey: "celestials",
        title: "Celestial Island",
        chips: ["Zap", "Monthly", "Celestials"],
      },
    ];

    const specialHighlights = specialDefinitions.map((definition) =>
    {
      const entries = (collectionsByKey.get(definition.collectionKey)?.entries || []).filter(isValidCollectionEntry);
      const familySheets = vesselSheets.filter((sheet) => getVesselFamilyKey(sheet) === definition.familyKey);
      const statuses = entries.map((entry) =>
      {
        const instances = familySheets.filter((sheet) =>
        {
          const candidateName =
            sheet.templateName || sheet.monsterName || sheet.displayName || sheet.sheetTitle || "";
          return candidateName === entry.name;
        });

        return getCollectionEntryStatus(entry, instances);
      });
      const completeCount = statuses.filter((status) => status === "complete").length;
      const trackedCount = statuses.filter((status) => status !== "not_started").length;
      const activeCount = statuses.filter((status) => status === "active").length;
      const inProgressCount = statuses.filter((status) => status === "in_progress").length;
      const status = activeCount > 0
        ? "active"
        : inProgressCount > 0
          ? "in_progress"
          : entries.length > 0 && completeCount === entries.length
            ? "complete"
            : "not_started";

      return {
        key: `world:${definition.key}`,
        kind: "world",
        targetKey: definition.key,
        title: definition.title,
        status,
        isLocked: false,
        progressPercent: entries.length ? Math.round((completeCount / entries.length) * 100) : 0,
        trackedPercent: entries.length ? Math.round((trackedCount / entries.length) * 100) : 0,
        summaryValue: `${completeCount} / ${entries.length}`,
        summaryLabel: "species complete",
        chips: definition.chips,
        supportingCopy: trackedCount > 0
          ? `${trackedCount} species tracked across this world.`
          : "No tracked species here yet.",
      };
    }).filter((world) => !world.isLocked && world.summaryValue !== "0 / 0");

    return [...islandHighlights, ...specialHighlights]
      .sort((a, b) =>
      {
        if (a.isLocked !== b.isLocked)
        {
          return a.isLocked ? 1 : -1;
        }

        const statusDelta = getCollectionWorldStatusSortRank(a.status) - getCollectionWorldStatusSortRank(b.status);

        if (statusDelta !== 0)
        {
          return statusDelta;
        }

        if (a.progressPercent !== b.progressPercent)
        {
          return a.progressPercent - b.progressPercent;
        }

        return a.title.localeCompare(b.title);
      })
      .slice(0, 4);
  }, [collectionsByKey, islandCollectionSheets, islandStates, vesselSheets]);
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

  const topReadyQueueItems = readyQueue.slice(0, 5);
  const topBlockedQueueItems = blockedQueue.slice(0, 5);

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

  useEffect(() =>
  {
    saveAppSnapshot({
      appVersion: APP_VERSION,
      sheets,
      view,
      collectionsData,
      islandStates,
      breedingSessions,
    });
  }, [breedingSessions, collectionsData, islandStates, sheets, view]);

  const openHome = () => setView({ screen: "home" });
  const openActiveSheets = () => setView({ screen: "active" });

  const openSheet = (sheetKey) => 
{
    setView({
      screen: "sheet",
      sheetKey,
    });
  };

  const openCollections = (worldKey = "") =>
  {
    const normalizedWorldKey = typeof worldKey === "string" ? worldKey : "";

    setView(
      normalizedWorldKey
        ? { screen: "collections", worldKey: normalizedWorldKey }
        : { screen: "collections" }
    );
  };
  const openQueue = () => setView({ screen: "queue" });
  const openIslandPlanner = () => setView({ screen: "planner" });
  const openDirectory = () => setView({ screen: "directory" });
  const recoverToHome = () => setView({ screen: "home" });
  const recordActivity = (type, message, details = {}) =>
    appendActivityLogEntry({ type, message, details });

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

    recordActivity(
      "sheet_instance_created",
      `Created another tracked run for ${getSheetDisplayName(sourceSheet)}.`,
      {
        sourceSheetKey: sourceSheet.key,
        newSheetKey: nextSheet.key,
        instanceNumber: nextInstanceNumber,
      }
    );

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

    recordActivity(
      "sheet_instance_deleted",
      `Deleted tracked run ${getSheetDisplayName(targetSheet)}.`,
      {
        sheetKey,
        templateKey: targetSheet.templateKey || "",
        instanceNumber: Number(targetSheet.instanceNumber || 0),
      }
    );

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

          if ((next.type || "vessel") === "island" && nextZapped >= monster.required)
          {
            monster.collectionFocusRank = null;
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

        if ((next.type || "vessel") === "island")
        {
          next.monsters = normalizeIslandCollectionMonsterFocus(next.monsters);
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

  const createAssignedBreedingSession = ({
    monsterId,
    islandId,
    sheetKey,
    sheetTitle = "",
  }) =>
  {
    const normalizedMonsterId = typeof monsterId === "string" ? monsterId.trim() : "";
    const normalizedIslandId = typeof islandId === "string" ? islandId.trim() : "";
    const normalizedSheetKey = typeof sheetKey === "string" ? sheetKey.trim() : "";

    if (!normalizedMonsterId || !isRealBreedingIsland(normalizedIslandId) || !normalizedSheetKey)
    {
      return { ok: false, reason: "invalid_target" };
    }

    setBreedingSessions((prev) => [
      ...prev,
      {
        id: createBreedingSessionId(),
        monsterId: normalizedMonsterId,
        islandId: normalizedIslandId,
        source: "assigned",
        sheetId: normalizedSheetKey,
        sheetTitle: sheetTitle || normalizedSheetKey,
        status: "breeding",
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

  const clearIslandLiveSessions = (islandName, statusFilter = "all", options = {}) =>
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
    if (!options.skipConfirm)
    {
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
  const clearAllIslandLiveBoards = () =>
  {
    const islandsWithLiveSessions = islandStates
      .filter((island) =>
        breedingSessions.some((entry) =>
          entry.status !== "completed" && entry.islandId === island.name
        )
      )
      .map((island) => island.name);

    if (islandsWithLiveSessions.length === 0)
    {
      return { ok: false, reason: "missing_sessions" };
    }

    const assignedCount = breedingSessions.filter(
      (entry) =>
        entry.status !== "completed"
        && islandsWithLiveSessions.includes(entry.islandId)
        && Boolean(entry.sheetId)
    ).length;
    const confirmed = window.confirm(
      `Clear every live breeder and nursery session across ${islandsWithLiveSessions.length} island${islandsWithLiveSessions.length === 1 ? "" : "s"}?`
      + (assignedCount > 0
        ? ` ${assignedCount} linked sheet reservation${assignedCount === 1 ? " will" : "s will"} also be released.`
        : " This will only clear live board tracking.")
    );

    if (!confirmed)
    {
      return { ok: false, reason: "cancelled" };
    }

    islandsWithLiveSessions.forEach((islandName) =>
    {
      clearIslandLiveSessions(islandName, "all", { skipConfirm: true });
    });

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

    if (
      !islandEntry ||
      !islandEntry.isUnlocked ||
      islandEntry.freeSlots <= 0 ||
      item?.sheetIndex === undefined ||
      item?.monsterIndex === undefined ||
      !item?.sheetKey
    )
    {
      return { ok: false, reason: "invalid_target" };
    }

    updateMonster(item.sheetIndex, item.monsterIndex, "breeding", 1, {
      islandName: item.island,
    });

    createAssignedBreedingSession({
      monsterId: item.name,
      islandId: item.island,
      sheetKey: item.sheetKey,
      sheetTitle: item.sheetTitle,
    });

    return { ok: true };
  };

  const adjustSelectedSheetMonster = (monsterIndex, field, delta, options = {}) =>
  {
    if (selectedSheetIndex < 0)
    {
      return;
    }

    updateMonster(selectedSheetIndex, monsterIndex, field, delta, options);
  };

  const toggleSelectedSheetMonsterFocus = (monsterIndex) =>
  {
    if (!selectedSheet || selectedSheetIndex < 0 || getSheetType(selectedSheet) !== "island")
    {
      return;
    }

    const targetMonster = selectedSheet.monsters?.[monsterIndex];

    if (!targetMonster)
    {
      return;
    }

    const isCurrentlyFocused = getIslandCollectionMonsterFocusRank(targetMonster.collectionFocusRank) !== null;

    updateSheet(selectedSheet.key, (sheet) =>
    {
      const monsters = Array.isArray(sheet.monsters) ? [...sheet.monsters] : [];
      const nextTargetMonster = monsters[monsterIndex];

      if (!nextTargetMonster)
      {
        return sheet;
      }

      if (getIslandCollectionMonsterFocusRank(nextTargetMonster.collectionFocusRank) !== null)
      {
        monsters[monsterIndex] = {
          ...nextTargetMonster,
          collectionFocusRank: null,
        };
      }
      else
      {
        const focusedMonsterCount = monsters.filter(
          (monster) => getIslandCollectionMonsterFocusRank(monster?.collectionFocusRank) !== null
        ).length;

        if (focusedMonsterCount >= 3)
        {
          return sheet;
        }

        monsters[monsterIndex] = {
          ...nextTargetMonster,
          collectionFocusRank: focusedMonsterCount + 1,
        };
      }

      return {
        ...sheet,
        monsters: normalizeIslandCollectionMonsterFocus(monsters),
      };
    });

    recordActivity(
      isCurrentlyFocused ? "collection_focus_removed" : "collection_focus_added",
      `${isCurrentlyFocused ? "Removed focus from" : "Focused"} ${targetMonster.name} in ${selectedSheet.sheetTitle}.`,
      {
        sheetKey: selectedSheet.key,
        monsterName: targetMonster.name,
        nextFocused: !isCurrentlyFocused,
      }
    );
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
      name: selectedSheet.monsters?.[monsterIndex]?.name || "",
      sheetKey: selectedSheet.key,
      sheetTitle: selectedSheet.sheetTitle,
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
    const targetSheet = sheets.find((entry) => entry.key === sheetKey);

    if (!targetSheet)
    {
      return;
    }

    const nextActive = !targetSheet.isActive;

    setSheets((prev) =>
      normalizeFocusedSheetRanks(
        prev.map((sheet) =>
        {
          if (sheet.key !== sheetKey)
          {
            return sheet;
          }

          return {
            ...sheet,
            isActive: nextActive,
            activatedAt: nextActive ? (sheet.activatedAt || new Date().toISOString()) : "",
            focusRank: nextActive ? sheet.focusRank : null,
          };
        })
      )
    );

    recordActivity(
      nextActive ? "sheet_activated" : "sheet_deactivated",
      `${nextActive ? "Focused" : "Removed focus from"} ${getSheetDisplayName(targetSheet)}.`,
      {
        sheetKey,
        sheetType: getSheetType(targetSheet),
        nextActive,
      }
    );
  };

  const moveFocusedSheet = (sheetKey, direction) =>
  {
    const focusedSheets = [...sheets.filter((sheet) => sheet.isActive)].sort(compareActiveSheetsByActivationOrder);
    const currentIndex = focusedSheets.findIndex((sheet) => sheet.key === sheetKey);

    if (currentIndex === -1)
    {
      return;
    }

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= focusedSheets.length)
    {
      return;
    }

    const currentSheet = focusedSheets[currentIndex];
    const targetSheet = focusedSheets[targetIndex];

    setSheets((prev) =>
      normalizeFocusedSheetRanks(
        prev.map((sheet) =>
        {
          if (sheet.key === currentSheet.key)
          {
            return {
              ...sheet,
              focusRank: targetSheet.focusRank ?? targetIndex + 1,
            };
          }

          if (sheet.key === targetSheet.key)
          {
            return {
              ...sheet,
              focusRank: currentSheet.focusRank ?? currentIndex + 1,
            };
          }

          return sheet;
        })
      )
    );

    recordActivity(
      "sheet_focus_reordered",
      `Moved ${getSheetDisplayName(currentSheet)} ${direction} in focus order.`,
      {
        sheetKey,
        direction,
      }
    );
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

            return applyCollectionEntryStatus(entry, nextStatus);
          }),
        };
      })
    );

    recordActivity(
      "collection_entry_status_updated",
      `Set ${entryName} in ${collectionKey} to ${nextStatus}.`,
      {
        collectionKey,
        entryName,
        nextStatus,
      }
    );
  };

  const toggleSheetCollected = (sheetKey) => 
{
    const targetSheet = sheets.find((entry) => entry.key === sheetKey);

    if (!targetSheet)
    {
      return;
    }

    if (getSheetType(targetSheet) === "island")
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

      recordActivity(
        nextCollected ? "collection_entry_collected" : "collection_entry_uncollected",
        `${nextCollected ? "Marked" : "Cleared"} collected status for ${getSheetDisplayName(targetSheet)}.`,
        {
          sheetKey,
          templateIdentity,
          nextCollected,
        }
      );

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

    recordActivity(
      nextCollected ? "collection_entry_collected" : "collection_entry_uncollected",
      `${nextCollected ? "Marked" : "Cleared"} collected status for ${getSheetDisplayName(targetSheet)}.`,
      {
        sheetKey,
        templateIdentity: "",
        nextCollected,
      }
    );
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

    recordActivity(
      "sheet_reset",
      `Reset progress for ${getSheetDisplayName(sheet)}.`,
      {
        sheetKey,
        sheetType: getSheetType(sheet),
      }
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
  const readyQueuePressureCount = readyQueue.reduce(
    (sum, item) => sum + Number(item.actualRemaining || 0),
    0
  );
  const blockedQueuePressureCount = blockedQueue.reduce(
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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "14px",
          width: "100%",
          margin: "0 0 10px",
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            width: "clamp(56px, 8vw, 76px)",
            height: "clamp(56px, 8vw, 76px)",
            borderRadius: "22px",
            border: "1px solid rgba(255,255,255,0.12)",
            background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.18), rgba(255,255,255,0.04))",
            display: "grid",
            placeItems: "center",
            boxShadow: "0 16px 34px rgba(0,0,0,0.2)",
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          <img
            src={APP_ICON_SRC}
            alt="MSM Tracker icon"
            style={{
              width: "78%",
              height: "78%",
              objectFit: "contain",
            }}
          />
        </div>

        <h1
          className="app-title"
          style={{
            fontSize: "clamp(40px, 8vw, 68px)",
            lineHeight: 0.95,
            margin: 0,
            letterSpacing: "-0.04em",
          }}
        >
          MSM Tracker
        </h1>
      </div>

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
          onClick={() => openCollections()}
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
        <ScreenErrorBoundary key="home" label="Dashboard" onReset={recoverToHome}>
          <HomeDashboard
            needNowIslandCount={needNowIslandCount}
            breedableIslandCount={breedableIslandCount}
            activeIslandSessionCount={activeIslandSessionCount}
            readyQueuePressureCount={readyQueuePressureCount}
            blockedQueuePressureCount={blockedQueuePressureCount}
            activeVesselSummary={activeVesselSummary}
            islandCollectionProgress={islandCollectionProgress}
            islandCapacitySummary={islandCapacitySummary}
            topReadyQueueItems={topReadyQueueItems}
            topBlockedQueueItems={topBlockedQueueItems}
            collectionWorldHighlights={collectionWorldHighlights}
            onOpenIslandPlanner={openIslandPlanner}
            onOpenActiveSheets={openActiveSheets}
            onOpenCollections={openCollections}
            onOpenCollectionWorld={openCollections}
            onOpenQueue={openQueue}
            onOpenSheet={openSheet}
            onExportBackup={handleExportBackup}
            onImportBackup={handleImportBackup}
            backupMessage={backupMessage}
            isImporting={isImporting}
          />
        </ScreenErrorBoundary>
      )}

      {view.screen === "active" && (
        <ScreenErrorBoundary key="active" label="Active Sheets" onReset={recoverToHome}>
          <Suspense fallback={<ScreenLoadingFallback label="Loading Active Sheets..." />}>
            <ActiveSheetsPage
              goals={homeGoals}
              onOpenSheet={openSheet}
              onOpenCollections={openCollections}
              onMoveGoalUp={(sheetKey) => moveFocusedSheet(sheetKey, "up")}
              onMoveGoalDown={(sheetKey) => moveFocusedSheet(sheetKey, "down")}
              focusLimit={FOCUSED_OPERATIONAL_LIMIT}
            />
          </Suspense>
        </ScreenErrorBoundary>
      )}

      {view.screen === "collections" && (
        <ScreenErrorBoundary key="collections" label="Collections" onReset={recoverToHome}>
          <Suspense fallback={<ScreenLoadingFallback label="Loading Collections..." />}>
            <CollectionsPage
              sheets={sheets}
              collectionsData={collectionsData}
              islandStates={islandStates}
              initialWorldKey={view.worldKey || ""}
              onClearInitialWorldKey={() => setView({ screen: "collections" })}
              onOpenCollectionWorld={openCollections}
              getDeleteInstanceBlockState={getDeleteSheetInstanceBlockState}
              onOpenSheet={openSheet}
              onCreateAnotherSheetInstance={createAnotherSheetInstance}
              onDeleteSheetInstance={deleteSheetInstance}
              onUpdateCollectionEntryStatus={updateCollectionEntryStatus}
              onToggleSheetActive={toggleSheetActive}
            />
          </Suspense>
        </ScreenErrorBoundary>
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

            {getSheetType(selectedSheet) !== "island" && (
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
                  ? `Remove Focus from ${getSheetDisplayName(selectedSheet)}`
                  : `Add ${getSheetDisplayName(selectedSheet)} to Focus`}
              </button>
            )}

            {getSheetType(selectedSheet) !== "island" && (
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
            )}

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
            <ScreenErrorBoundary
              key={`sheet:${selectedSheet.key}`}
              label={getSheetDisplayName(selectedSheet)}
              onReset={recoverToHome}
            >
              <TrackerSheet
                data={selectedSheet}
                islandStates={islandStates}
                islandPlannerByName={islandPlannerByName}
                breedingSessions={breedingSessions}
                assignableSessions={selectedSheetAssignableSessions}
                onAdjustMonster={adjustSelectedSheetMonster}
                onToggleCollectionFocus={toggleSelectedSheetMonsterFocus}
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
            </ScreenErrorBoundary>
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

          <ScreenErrorBoundary key="queue" label="Breeding Queue" onReset={recoverToHome}>
            <Suspense fallback={<ScreenLoadingFallback label="Loading Breeding Queue..." />}>
              <BreedingQueue
                sheets={sheets}
                breedingSessions={breedingSessions}
                islandPlannerData={islandPlannerData}
                onZapBreedingSession={zapAssignedSessionFromPlanner}
                onBreedFromQueue={breedFromPlanner}
              />
            </Suspense>
          </ScreenErrorBoundary>
        </>
      )}

      {view.screen === "planner" && (
        <>
          <div style={{ marginBottom: "16px" }}>
            <button style={buttonBaseStyle} onClick={openHome}>
              ← Home
            </button>
          </div>

          <ScreenErrorBoundary key="planner" label="Island Manager" onReset={recoverToHome}>
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
                onClearAllIslandLiveBoards={clearAllIslandLiveBoards}
                onMoveToNurseryFromPlanner={moveBreedingSessionToNursery}
                onHatchNurseryFromPlanner={hatchNurserySession}
              />
            </Suspense>
          </ScreenErrorBoundary>
        </>
      )}

      {view.screen === "directory" && (
        <>
          <div style={{ marginBottom: "16px" }}>
            <button style={buttonBaseStyle} onClick={openHome}>
              ← Home
            </button>
          </div>

          <ScreenErrorBoundary key="directory" label="Monster Library" onReset={recoverToHome}>
            <Suspense fallback={<ScreenLoadingFallback label="Loading Monster Library..." />}>
              <MonsterDirectory />
            </Suspense>
          </ScreenErrorBoundary>
        </>
      )}
    </div>
  );
}
