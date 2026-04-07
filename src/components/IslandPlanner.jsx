import React, { useEffect, useMemo, useRef, useState } from "react";
import { ISLAND_GROUPS } from "../data/islands";
import { MONSTER_DATABASE } from "../data/monsterDatabase";
import {
  getBreedingComboByMonsterName,
  inferBreedingOutcomeFromParents,
} from "../utils/breedingCombos";
import {
  getElementChipStyle,
  getMonsterBreedingIslands,
  getMonsterMetadata,
} from "../utils/monsterMetadata";
import {
  compareMonsterNamesByPriority,
  isEpicMonsterName,
} from "../utils/monsterPriority";

const cardStyle = {
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: "18px",
  padding: "18px",
  background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.025))",
  boxShadow: "0 12px 30px rgba(0,0,0,0.18)",
};

const sectionTitleStyle = {
  fontSize: "13px",
  opacity: 0.7,
  letterSpacing: "0.06em",
  marginBottom: "10px",
};

const pillStyle = {
  padding: "6px 12px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.08)",
  fontSize: "12px",
  fontWeight: 700,
};

const tabButtonStyle = {
  padding: "10px 16px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.06)",
  color: "inherit",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: 700,
};

const primaryButtonStyle = {
  padding: "10px 16px",
  borderRadius: "12px",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "inherit",
  cursor: "pointer",
  fontWeight: 700,
  boxShadow: "0 10px 24px rgba(0,0,0,0.14)",
};

const confirmButtonStyle = {
  ...primaryButtonStyle,
  padding: "8px 12px",
  background: "rgba(34,197,94,0.18)",
};

const cancelButtonStyle = {
  ...primaryButtonStyle,
  padding: "8px 12px",
  background: "rgba(255,255,255,0.08)",
};

const compactActionStyle = {
  padding: "6px 10px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "inherit",
  cursor: "pointer",
  fontSize: "12px",
  fontWeight: 700,
  background: "rgba(255,255,255,0.08)",
};

const DIRECT_SLOT_ACTION_LIMIT = 3;
const ALL_REGIONS_FILTER = "all";
const AVAILABILITY_FILTER_OPTIONS = [
  { key: "all", label: "All" },
  { key: "need_now", label: "Need Now" },
  { key: "breedable", label: "Breedable" },
  { key: "active", label: "Active" },
  { key: "capacity_limited", label: "Capacity Limited" },
];

function getTabLabel(group)
{
  if (group.key === "mirror")
  {
    return "Mirror";
  }

  return group.label;
}

function getRegionFilterLabel(regionKey, groupedPlannerData)
{
  if (regionKey === ALL_REGIONS_FILTER)
  {
    return "All Regions";
  }

  return groupedPlannerData.find((group) => group.key === regionKey)?.label || "All Regions";
}

function matchesAvailabilityFilter(island, filterKey)
{
  if (filterKey === "all")
  {
    return true;
  }

  if (filterKey === "breedable")
  {
    return island.supportsStandardBreeding && Number(island.freeSlots || 0) > 0;
  }

  if (filterKey === "need_now")
  {
    return Array.isArray(island.needNow) && island.needNow.length > 0;
  }

  if (filterKey === "active")
  {
    return (
      Array.isArray(island.currentlyBreeding) && island.currentlyBreeding.length > 0
    ) || (
      Array.isArray(island.nurserySessions) && island.nurserySessions.length > 0
    );
  }

  if (filterKey === "capacity_limited")
  {
    return (
      (island.supportsStandardBreeding && Number(island.freeSlots || 0) <= 0) ||
      (island.supportsNursery && Number(island.freeNurseries || 0) <= 0)
    );
  }

  return true;
}

function getAvailabilityFilterLabel(filterKey)
{
  return AVAILABILITY_FILTER_OPTIONS.find((filter) => filter.key === filterKey)?.label || "All";
}

function getAvailabilityFilterMeaning(filterKey)
{
  if (filterKey === "breedable")
  {
    return "At least one breeder slot is open on the visible islands.";
  }

  if (filterKey === "need_now")
  {
    return "Tracked queue work is waiting on the visible islands right now.";
  }

  if (filterKey === "active")
  {
    return "Breeding or nursery work is already in motion on the visible islands.";
  }

  if (filterKey === "capacity_limited")
  {
    return "Breeder or nursery capacity is currently full on the visible islands.";
  }

  return "";
}

function buildObservedSlotDraft(observedNames, slotCount)
{
  const normalizedCount = Math.max(slotCount, observedNames.length, 0);
  const next = Array.from({ length: normalizedCount }, (_, index) => observedNames[index] || "");

  return next;
}

function compareObservedSessions(trackedItems, observedNames)
{
  const remainingObservedByName = observedNames.reduce((acc, name) =>
  {
    if (!name)
    {
      return acc;
    }

    acc.set(name, Number(acc.get(name) || 0) + 1);
    return acc;
  }, new Map());

  const matchedTracked = [];
  const missingTracked = [];

  trackedItems.forEach((item) =>
  {
    const currentCount = Number(remainingObservedByName.get(item.name) || 0);

    if (currentCount > 0)
    {
      remainingObservedByName.set(item.name, currentCount - 1);
      matchedTracked.push(item);
      return;
    }

    missingTracked.push(item);
  });

  const observedOnly = [];

  remainingObservedByName.forEach((count, name) =>
  {
    for (let index = 0; index < count; index += 1)
    {
      observedOnly.push(name);
    }
  });

  return {
    matchedTracked,
    missingTracked,
    observedOnly,
  };
}

function NeedNowRow({ item, faded, canBreed, onBreed, buttonLabel = "Assign Here + Breeding" })
{
  const metadata = getMonsterMetadata(item.name);
  const hasUnreservedNeed = item.queueRemaining > 0;

  return (
    <div
      style={{
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "14px",
        padding: "14px",
        background: "rgba(245,158,11,0.09)",
        opacity: faded ? 0.62 : 1,
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
          <div style={{ fontSize: "18px", fontWeight: 700 }}>{item.name}</div>
          <div style={{ marginTop: "4px", fontSize: "13px", opacity: 0.72 }}>
            {item.sheetTitle}
          </div>
        </div>

        <div style={pillStyle}>Need {item.queueRemaining}</div>
      </div>

      <div style={{ marginTop: "8px", fontSize: "13px", opacity: 0.72 }}>
        Remaining {item.queueRemaining} · Total left {item.actualRemaining} · Breeding {item.breeding} · Zapped {item.zapped}/{item.required}
      </div>

      {item.validBreedingIslands?.length > 1 && (
        <div style={{ marginTop: "8px", fontSize: "13px", opacity: 0.68 }}>
          Breedable on: {item.validBreedingIslands.join(" · ")}
        </div>
      )}

      {metadata?.elements?.length > 0 && (
        <div style={{ marginTop: "10px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {metadata.elements.map((element) => (
            <span key={`${item.sheetKey}-${item.name}-${element}`} style={getElementChipStyle(element)}>
              {element}
            </span>
          ))}
        </div>
      )}

      {metadata?.combo && (
        <div style={{ marginTop: "8px", fontSize: "13px", opacity: 0.72 }}>
          Combo: {metadata.combo}
        </div>
      )}

      {item.source === "manual" && item.manualRecipeParents?.length === 2 && (
        <div style={{ marginTop: "8px", fontSize: "13px", opacity: 0.68 }}>
          Bred from: {item.manualRecipeParents.join(" + ")}
          {item.manualObservedTime ? ` · Observed timer: ${item.manualObservedTime}` : ""}
          {item.manualResolution === "mystery" ? " · Result unresolved" : ""}
        </div>
      )}

      <div style={{ marginTop: "12px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <button
          style={{
            ...primaryButtonStyle,
            padding: "8px 12px",
            background: canBreed ? "rgba(245,158,11,0.18)" : "rgba(255,255,255,0.08)",
            opacity: canBreed ? 1 : 0.5,
            cursor: canBreed ? "pointer" : "not-allowed",
          }}
          onClick={() => onBreed(item)}
          disabled={!canBreed}
        >
          {hasUnreservedNeed ? buttonLabel : "Breeding Reserved"}
        </button>
      </div>
    </div>
  );
}

function CookingRow({
  item,
  onZapAssigned,
  onAssignAndZap,
  onUnassign,
  onBreed,
  onMoveToNursery,
  canMoveToNursery,
})
{
  const metadata = getMonsterMetadata(item.name);
  const [showZapTargets, setShowZapTargets] = useState(false);
  const activeZapTargets = (item.zapTargets || []).filter((sheet) => sheet.isActive);
  const isUnassigned = !item.sheetKey;

  function handleAssignAndZap()
  {
    if (activeZapTargets.length === 1)
    {
      onAssignAndZap(item.sessionIds?.[0], activeZapTargets[0].key);
      setShowZapTargets(false);
      return;
    }

    if (activeZapTargets.length > 1)
    {
      setShowZapTargets(true);
    }
  }

  return (
    <div
      style={{
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "14px",
        padding: "14px",
        background: "rgba(59,130,246,0.09)",
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
          <div style={{ fontSize: "18px", fontWeight: 700 }}>{item.name}</div>
          <div style={{ marginTop: "4px", fontSize: "13px", opacity: 0.72 }}>
            {item.sheetTitle}
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {item.source === "manual" && <div style={pillStyle}>Manual</div>}
          {!item.sheetKey && <div style={pillStyle}>Unassigned</div>}
          <div style={pillStyle}>
            {item.required > 0 ? `${item.breeding}/${item.required} breeding` : `${item.breeding} breeding`}
          </div>
          {item.required > 0 && (
            <div style={pillStyle}>{item.zapped}/{item.required} zapped</div>
          )}
        </div>
      </div>

      <div style={{ marginTop: "8px", fontSize: "13px", opacity: 0.72 }}>
        {item.required > 0
          ? `Actual left ${item.actualRemaining} · Assigned here ${item.breeding}`
          : `Manual session count ${item.breeding} on this island`}
      </div>

      {isUnassigned && (
        <div style={{ marginTop: "8px", fontSize: "13px", opacity: 0.68 }}>
          {activeZapTargets.length === 0
            ? "No active zap target"
            : activeZapTargets.length === 1
              ? `Zap target: ${activeZapTargets[0].title}`
              : `Zap targets: ${activeZapTargets.map((sheet) => sheet.title).join(" · ")}`}
        </div>
      )}

      {metadata?.elements?.length > 0 && (
        <div style={{ marginTop: "10px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {metadata.elements.map((element) => (
            <span key={`${item.sheetKey}-${item.name}-${element}`} style={getElementChipStyle(element)}>
              {element}
            </span>
          ))}
        </div>
      )}

      {metadata?.combo && (
        <div style={{ marginTop: "8px", fontSize: "13px", opacity: 0.72 }}>
          Combo: {metadata.combo}
        </div>
      )}

      <div style={{ marginTop: "12px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {onMoveToNursery && (
          <button
            style={{
              ...primaryButtonStyle,
              padding: "8px 12px",
              background: canMoveToNursery ? "rgba(245,158,11,0.16)" : "rgba(255,255,255,0.08)",
              opacity: canMoveToNursery ? 1 : 0.5,
              cursor: canMoveToNursery ? "pointer" : "not-allowed",
            }}
            onClick={() => onMoveToNursery(item.sessionIds?.[0])}
            disabled={!canMoveToNursery}
          >
            To Nursery
          </button>
        )}

        <button
          style={{
            ...primaryButtonStyle,
            padding: "8px 12px",
            background: isUnassigned && activeZapTargets.length === 0
              ? "rgba(255,255,255,0.08)"
              : "rgba(34,197,94,0.16)",
            opacity: isUnassigned && activeZapTargets.length === 0 ? 0.5 : 1,
            cursor: isUnassigned && activeZapTargets.length === 0 ? "not-allowed" : "pointer",
          }}
          onClick={() =>
          {
            if (isUnassigned)
            {
              handleAssignAndZap();
              return;
            }

            onZapAssigned(item);
          }}
          disabled={isUnassigned && activeZapTargets.length === 0}
        >
          {isUnassigned ? "Assign + Zap" : "Zap"}
        </button>

        {onBreed && (
          <button
            style={{
              ...primaryButtonStyle,
              padding: "8px 12px",
              background: "rgba(59,130,246,0.16)",
            }}
            onClick={() => onBreed(item)}
          >
            + Breeding
          </button>
        )}

        {!isUnassigned && onUnassign && (
          <button
            style={{
              ...primaryButtonStyle,
              padding: "8px 12px",
              background: "rgba(239,68,68,0.16)",
            }}
            onClick={() => onUnassign(item.sessionIds?.[0])}
          >
            Unassign
          </button>
        )}
      </div>

      {showZapTargets && activeZapTargets.length > 1 && (
        <div style={{ marginTop: "10px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {activeZapTargets.map((sheet) => (
            <button
              key={`${item.name}-${sheet.key}-zap`}
              style={{
                ...primaryButtonStyle,
                padding: "8px 12px",
                background: "rgba(34,197,94,0.16)",
              }}
              onClick={() =>
              {
                onAssignAndZap(item.sessionIds?.[0], sheet.key);
                setShowZapTargets(false);
              }}
            >
              Zap to {sheet.title}
            </button>
          ))}
          <button
            style={{
              ...primaryButtonStyle,
              padding: "8px 12px",
              background: "rgba(255,255,255,0.08)",
            }}
            onClick={() => setShowZapTargets(false)}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

function NurseryRow({ item, onHatch, onUnassign })
{
  const metadata = getMonsterMetadata(item.name);
  const isUnassigned = !item.sheetKey;

  return (
    <div
      style={{
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "14px",
        padding: "14px",
        background: "rgba(168,85,247,0.09)",
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
          <div style={{ fontSize: "18px", fontWeight: 700 }}>{item.name}</div>
          <div style={{ marginTop: "4px", fontSize: "13px", opacity: 0.72 }}>
            {item.sheetTitle}
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {item.source === "manual" && <div style={pillStyle}>Manual</div>}
          {!item.sheetKey && <div style={pillStyle}>Unassigned</div>}
          <div style={pillStyle}>Nursery</div>
        </div>
      </div>

      {metadata?.elements?.length > 0 && (
        <div style={{ marginTop: "10px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {metadata.elements.map((element) => (
            <span key={`${item.name}-${element}-nursery`} style={getElementChipStyle(element)}>
              {element}
            </span>
          ))}
        </div>
      )}

      <div style={{ marginTop: "8px", fontSize: "13px", opacity: 0.72 }}>
        {item.required > 0
          ? `Tracked for ${item.sheetTitle} · In nursery`
          : "Manual nursery session"}
      </div>

      {item.source === "manual" && item.manualRecipeParents?.length === 2 && (
        <div style={{ marginTop: "8px", fontSize: "13px", opacity: 0.68 }}>
          Bred from: {item.manualRecipeParents.join(" + ")}
          {item.manualObservedTime ? ` · Observed timer: ${item.manualObservedTime}` : ""}
          {item.manualResolution === "mystery" ? " · Result unresolved" : ""}
        </div>
      )}

      <div style={{ marginTop: "12px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <button
          style={{
            ...primaryButtonStyle,
            padding: "8px 12px",
            background: "rgba(34,197,94,0.16)",
          }}
          onClick={() => onHatch(item.sessionIds?.[0])}
        >
          Hatch
        </button>

        {!isUnassigned && onUnassign && (
          <button
            style={{
              ...primaryButtonStyle,
              padding: "8px 12px",
              background: "rgba(239,68,68,0.16)",
            }}
            onClick={() => onUnassign(item.sessionIds?.[0])}
          >
            Unassign
          </button>
        )}
      </div>
    </div>
  );
}

function IslandCard({
  island,
  unlockIsland,
  unlockIslandBreedingStructure,
  unlockIslandNursery,
  reduceIslandBreedingStructure,
  reduceIslandNursery,
  onZapFromPlanner,
  onBreedFromPlanner,
  onCreateManualBreed,
  onCreateObservedLiveSession,
  onAssignAndZapFromPlanner,
  onUnassignFromPlanner,
  onClearPlannerSession,
  onClearIslandBreeders,
  onClearIslandNurseries,
  onResetIslandLiveBoard,
  onMoveToNurseryFromPlanner,
  onHatchNurseryFromPlanner,
})
{
  const [confirmUpgradeAction, setConfirmUpgradeAction] = useState(null);
  const [confirmCapacityAction, setConfirmCapacityAction] = useState(null);
  const [showCapacityEditor, setShowCapacityEditor] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [showReconcilePanel, setShowReconcilePanel] = useState(false);
  const [reconcileBreedingSlots, setReconcileBreedingSlots] = useState([]);
  const [reconcileNurserySlots, setReconcileNurserySlots] = useState([]);
  const [manualMode, setManualMode] = useState("pair");
  const [manualMonsterId, setManualMonsterId] = useState("");
  const [manualParentA, setManualParentA] = useState("");
  const [manualParentB, setManualParentB] = useState("");
  const [manualObservedTime, setManualObservedTime] = useState("");
  const [showAllNeedNow, setShowAllNeedNow] = useState(false);
  const [showAllCollectionMissing, setShowAllCollectionMissing] = useState(false);

  useEffect(() =>
  {
    if (!confirmUpgradeAction)
    {
      return undefined;
    }

    const timeout = setTimeout(() =>
    {
      setConfirmUpgradeAction(null);
    }, 4000);

    return () => clearTimeout(timeout);
  }, [confirmUpgradeAction]);

  useEffect(() =>
  {
    if (!confirmCapacityAction)
    {
      return undefined;
    }

    const timeout = setTimeout(() =>
    {
      setConfirmCapacityAction(null);
    }, 4000);

    return () => clearTimeout(timeout);
  }, [confirmCapacityAction]);

  function resetReconcileDraft()
  {
    setReconcileBreedingSlots(
      buildObservedSlotDraft(
        (island.currentlyBreeding || []).map((item) => item.name),
        breederReconcileSlotCount
      )
    );
    setReconcileNurserySlots(
      buildObservedSlotDraft(
        (island.nurserySessions || []).map((item) => item.name),
        nurseryReconcileSlotCount
      )
    );
  }

  const canUpgradeBreedingStructures =
    island.isUnlocked &&
    island.supportsStandardBreeding &&
    island.breedingStructures < island.maxBreedingStructures;
  const canUpgradeNurseries =
    island.isUnlocked &&
    island.supportsNursery &&
    island.nurseries < island.maxNurseries;
  const canReduceBreedingStructures =
    island.isUnlocked &&
    island.supportsStandardBreeding &&
    island.breedingStructures > Math.max(1, Number(island.occupiedSlots || 0));
  const canReduceNurseries =
    island.isUnlocked &&
    island.supportsNursery &&
    island.nurseries > Math.max(1, Number(island.nurseryOccupancy || 0));
  const hasEditableCapacities = island.supportsStandardBreeding || island.supportsNursery;
  const isFullyUpgraded =
    island.isUnlocked &&
    hasEditableCapacities &&
    (!island.supportsStandardBreeding || island.breedingStructures >= island.maxBreedingStructures) &&
    (!island.supportsNursery || island.nurseries >= island.maxNurseries);
  const isConfirmingUpgrade = confirmUpgradeAction !== null;
  const breederSummary = `${island.occupiedSlots} / ${island.breedingStructures} occupied`;
  const nurserySummary = `${island.nurseryOccupancy || 0} / ${island.nurseries} in nursery`;
  const manualMonsterOptions = useMemo(
    () =>
      Object.keys(MONSTER_DATABASE)
        .filter((monsterName) => getMonsterBreedingIslands(monsterName).includes(island.island))
        .sort((a, b) => compareMonsterNamesByPriority(a, b, { preferRequirementUsage: false })),
    [island.island]
  );
  const manualParentOptions = useMemo(
    () => manualMonsterOptions.filter((monsterName) => !isEpicMonsterName(monsterName)),
    [manualMonsterOptions]
  );
  const reconcileMonsterOptions = useMemo(
    () =>
      Array.from(new Set([
        ...manualMonsterOptions,
        ...(island.currentlyBreeding || []).map((item) => item.name),
        ...(island.nurserySessions || []).map((item) => item.name),
      ])).sort(compareMonsterNamesByPriority),
    [island.currentlyBreeding, island.nurserySessions, manualMonsterOptions]
  );
  const breederReconcileSlotCount = Math.max(
    Number(island.breedingStructures || 0),
    Number(island.currentlyBreeding?.length || 0)
  );
  const nurseryReconcileSlotCount = Math.max(
    Number(island.nurseries || 0),
    Number(island.nurserySessions?.length || 0)
  );
  const observedBreedingNames = reconcileBreedingSlots.filter(Boolean);
  const observedNurseryNames = reconcileNurserySlots.filter(Boolean);
  const breedingReconcile = useMemo(
    () => compareObservedSessions(island.currentlyBreeding || [], observedBreedingNames),
    [island.currentlyBreeding, observedBreedingNames]
  );
  const nurseryReconcile = useMemo(
    () => compareObservedSessions(island.nurserySessions || [], observedNurseryNames),
    [island.nurserySessions, observedNurseryNames]
  );
  const selectedManualCombo = useMemo(
    () => getBreedingComboByMonsterName(manualMonsterId),
    [manualMonsterId]
  );
  const manualPairOutcome = useMemo(
    () =>
      inferBreedingOutcomeFromParents({
        parentA: manualParentA,
        parentB: manualParentB,
        islandName: island.island,
        observedTime: manualObservedTime,
      }),
    [island.island, manualObservedTime, manualParentA, manualParentB]
  );
  const visibleNeedNow = showAllNeedNow
    ? island.needNow
    : island.needNow.slice(0, DIRECT_SLOT_ACTION_LIMIT);
  const hiddenNeedNowCount = Math.max(0, island.needNow.length - visibleNeedNow.length);
  const visibleCollectionMissing = showAllCollectionMissing
    ? (island.collectionMissing || [])
    : (island.collectionMissing || []).slice(0, DIRECT_SLOT_ACTION_LIMIT);
  const hiddenCollectionMissingCount = Math.max(
    0,
    Number(island.collectionMissing?.length || 0) - visibleCollectionMissing.length
  );
  const showBreedingPipeline =
    island.supportsStandardBreeding ||
    island.needNow.length > 0 ||
    Number(island.collectionMissing?.length || 0) > 0 ||
    island.currentlyBreeding.length > 0;
  const showNurseryPipeline =
    island.supportsNursery || Number(island.nurserySessions?.length || 0) > 0;
  const canMaxCapacity = canUpgradeBreedingStructures || canUpgradeNurseries;
  const capacitySummaryParts = [];

  if (island.supportsStandardBreeding)
  {
    capacitySummaryParts.push(
      `${island.breedingStructures} breeder${island.breedingStructures === 1 ? "" : "s"}`
    );
  }

  if (island.supportsNursery)
  {
    capacitySummaryParts.push(
      `${island.nurseries} nursery${island.nurseries === 1 ? "" : "ies"}`
    );
  }

  function handleUnlockIsland()
  {
    unlockIsland(island.island);
    setConfirmUpgradeAction(null);
  }

  function handleUnlockBreeder()
  {
    unlockIslandBreedingStructure(island.island);
    setConfirmUpgradeAction(null);
  }

  function handleUnlockNursery()
  {
    unlockIslandNursery(island.island);
    setConfirmUpgradeAction(null);
  }

  function handleReduceBreeder()
  {
    reduceIslandBreedingStructure(island.island);
    setConfirmCapacityAction(null);
  }

  function handleReduceNursery()
  {
    reduceIslandNursery(island.island);
    setConfirmCapacityAction(null);
  }

  function handleMaxCapacity()
  {
    const breederUpgradesNeeded = island.supportsStandardBreeding
      ? Math.max(0, Number(island.maxBreedingStructures || 0) - Number(island.breedingStructures || 0))
      : 0;
    const nurseryUpgradesNeeded = island.supportsNursery
      ? Math.max(0, Number(island.maxNurseries || 0) - Number(island.nurseries || 0))
      : 0;

    for (let index = 0; index < breederUpgradesNeeded; index += 1)
    {
      unlockIslandBreedingStructure(island.island);
    }

    for (let index = 0; index < nurseryUpgradesNeeded; index += 1)
    {
      unlockIslandNursery(island.island);
    }

    setConfirmUpgradeAction(null);
    setShowCapacityEditor(false);
  }

  function handleCreateManualBreed()
  {
    if (manualMode === "pair")
    {
      if (!manualParentA || !manualParentB)
      {
        return;
      }

      onCreateManualBreed({
        monsterId: manualPairOutcome.resultName,
        islandId: island.island,
        manualRecipeParents: [manualParentA, manualParentB],
        manualObservedTime,
        manualResolution: manualPairOutcome.resolution,
      });
      setManualParentA("");
      setManualParentB("");
      setManualObservedTime("");
      setShowManualForm(false);
      return;
    }

    if (!manualMonsterId)
    {
      return;
    }

    onCreateManualBreed(manualMonsterId, island.island);
    setManualMonsterId("");
    setShowManualForm(false);
  }

  function handleToggleReconcilePanel()
  {
    setShowReconcilePanel((current) =>
    {
      const next = !current;

      if (next)
      {
        setShowCapacityEditor(false);
        setShowManualForm(false);
        setConfirmCapacityAction(null);
        setConfirmUpgradeAction(null);
        resetReconcileDraft();
      }

      return next;
    });
  }

  function updateReconcileSlot(setter, slotIndex, value)
  {
    setter((current) =>
    {
      const next = [...current];
      next[slotIndex] = value;
      return next;
    });
  }

  function handleAdoptObservedSession(monsterName, status)
  {
    if (!monsterName)
    {
      return;
    }

    onCreateObservedLiveSession?.(monsterName, island.island, status);
  }

  return (
    <div
      style={{
        ...cardStyle,
        opacity: island.isUnlocked ? 1 : 0.68,
        background: island.isUnlocked
          ? isFullyUpgraded
            ? "linear-gradient(180deg, rgba(250,204,21,0.12), rgba(255,255,255,0.035))"
            : cardStyle.background
          : "linear-gradient(180deg, rgba(127,29,29,0.18), rgba(255,255,255,0.02))",
        border: isFullyUpgraded
          ? "1px solid rgba(250,204,21,0.35)"
          : island.isUnlocked
            ? cardStyle.border
            : "1px solid rgba(248,113,113,0.24)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ fontSize: "28px", fontWeight: 700 }}>{island.island}</div>
          <div style={{ marginTop: "6px", fontSize: "14px", opacity: 0.75 }}>
            {island.isUnlocked ? "Unlocked" : "Locked"}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          {island.isMirror && <div style={pillStyle}>Mirror</div>}
          {isFullyUpgraded && <div style={pillStyle}>Fully Upgraded</div>}
          {(island.capabilityTags || []).map((tag) => (
            <div key={`${island.island}-${tag}`} style={pillStyle}>
              {tag}
            </div>
          ))}

          {!hasEditableCapacities && (
            <div
              style={{
                display: "grid",
                gap: "6px",
                padding: "8px 12px",
                borderRadius: "14px",
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.05)",
                minWidth: "240px",
              }}
            >
              <div style={{ fontSize: "12px", fontWeight: 700, opacity: 0.8 }}>
                Operations
              </div>
              <div style={{ fontSize: "13px", lineHeight: 1.5, opacity: 0.78 }}>
                {island.operationalNote || "This island does not use the standard breeding loop."}
              </div>
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          marginTop: "14px",
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        {!island.isUnlocked ? (
          confirmUpgradeAction === "unlockIsland" ? (
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button style={confirmButtonStyle} onClick={handleUnlockIsland}>
                Confirm Unlock
              </button>
              <button style={cancelButtonStyle} onClick={() => setConfirmUpgradeAction(null)}>
                Cancel
              </button>
            </div>
          ) : (
            <button
              style={{
                ...primaryButtonStyle,
                padding: "8px 12px",
                background: "rgba(248,113,113,0.16)",
                opacity: isConfirmingUpgrade ? 0.55 : 1,
                cursor: isConfirmingUpgrade ? "default" : "pointer",
              }}
              onClick={() => setConfirmUpgradeAction("unlockIsland")}
              disabled={isConfirmingUpgrade}
            >
              Unlock Island
            </button>
          )
        ) : (
          <>
            {hasEditableCapacities && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(160px, max-content))",
                  gap: "10px",
                  width: "100%",
                }}
              >
                {island.supportsStandardBreeding && (
                  <div
                    style={{
                      display: "grid",
                      gap: "4px",
                      padding: "10px 12px",
                      borderRadius: "14px",
                      border: "1px solid rgba(255,255,255,0.08)",
                      background: "rgba(255,255,255,0.05)",
                    }}
                  >
                    <div style={{ fontSize: "12px", fontWeight: 700, opacity: 0.76 }}>Breeders</div>
                    <div style={{ fontSize: "14px", fontWeight: 700 }}>{breederSummary}</div>
                    <div style={{ fontSize: "12px", opacity: 0.7 }}>{island.freeSlots} free</div>
                  </div>
                )}

                {island.supportsNursery && (
                  <div
                    style={{
                      display: "grid",
                      gap: "4px",
                      padding: "10px 12px",
                      borderRadius: "14px",
                      border: "1px solid rgba(255,255,255,0.08)",
                      background: "rgba(255,255,255,0.05)",
                    }}
                  >
                    <div style={{ fontSize: "12px", fontWeight: 700, opacity: 0.76 }}>Nurseries</div>
                    <div style={{ fontSize: "14px", fontWeight: 700 }}>{nurserySummary}</div>
                    <div style={{ fontSize: "12px", opacity: 0.7 }}>{island.freeNurseries} free</div>
                  </div>
                )}

                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                  {island.supportsStandardBreeding && !showManualForm && (
                    <button
                      style={{
                        ...compactActionStyle,
                        background: island.freeSlots > 0
                          ? "rgba(168,85,247,0.16)"
                          : "rgba(255,255,255,0.08)",
                        opacity: island.freeSlots > 0 ? 1 : 0.5,
                        cursor: island.freeSlots > 0 ? "pointer" : "not-allowed",
                      }}
                      onClick={() => setShowManualForm(true)}
                      disabled={island.freeSlots <= 0}
                    >
                      + Manual Breed
                    </button>
                  )}

                  {island.isUnlocked && (showBreedingPipeline || showNurseryPipeline) && (
                    <button
                      style={{
                        ...compactActionStyle,
                        background: showReconcilePanel
                          ? "rgba(96,165,250,0.18)"
                          : compactActionStyle.background,
                      }}
                      onClick={handleToggleReconcilePanel}
                    >
                      {showReconcilePanel ? "Done Reconciling" : "Reconcile"}
                    </button>
                  )}

                  {Array.isArray(island.currentlyBreeding) && island.currentlyBreeding.length > 0 && (
                    <button
                      style={{
                        ...compactActionStyle,
                        background: "rgba(239,68,68,0.14)",
                      }}
                      onClick={() => onClearIslandBreeders?.(island.island)}
                    >
                      Clear Breeders
                    </button>
                  )}

                  {Array.isArray(island.nurserySessions) && island.nurserySessions.length > 0 && (
                    <button
                      style={{
                        ...compactActionStyle,
                        background: "rgba(168,85,247,0.14)",
                      }}
                      onClick={() => onClearIslandNurseries?.(island.island)}
                    >
                      Clear Nurseries
                    </button>
                  )}

                  {(
                    (Array.isArray(island.currentlyBreeding) && island.currentlyBreeding.length > 0)
                    || (Array.isArray(island.nurserySessions) && island.nurserySessions.length > 0)
                  ) && (
                    <button
                      style={{
                        ...compactActionStyle,
                        background: "rgba(245,158,11,0.16)",
                      }}
                      onClick={() => onResetIslandLiveBoard?.(island.island)}
                    >
                      Reset Live Board
                    </button>
                  )}

                  {(canReduceBreedingStructures || canReduceNurseries || canUpgradeBreedingStructures || canUpgradeNurseries) && (
                    <button
                      style={{
                        ...compactActionStyle,
                        background: showCapacityEditor ? "rgba(255,255,255,0.16)" : compactActionStyle.background,
                      }}
                      onClick={() =>
                      {
                        setShowCapacityEditor((current) => !current);
                        setConfirmCapacityAction(null);
                        setConfirmUpgradeAction(null);
                      }}
                    >
                      {showCapacityEditor ? "Done" : "Capacity Settings"}
                    </button>
                  )}
                </div>

                <div style={{ fontSize: "13px", opacity: 0.72, alignSelf: "center" }}>
                  {capacitySummaryParts.join(" · ")}
                  {isFullyUpgraded ? " · fully upgraded" : ""}
                </div>
              </div>
            )}

            {!hasEditableCapacities && (
              <div style={{ fontSize: "13px", opacity: 0.72 }}>
                {island.operationalNote || "This island uses a special workflow instead of breeder and nursery capacity."}
              </div>
            )}
          </>
        )}
      </div>

      {showCapacityEditor && island.isUnlocked && hasEditableCapacities && (
        <div
          style={{
            marginTop: "14px",
            padding: "14px",
            borderRadius: "16px",
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.04)",
            display: "grid",
            gap: "12px",
          }}
        >
          <div style={{ fontSize: "13px", opacity: 0.72 }}>
            Capacity setup stays compact until you intentionally edit it here. Reverts require confirmation and cannot reduce below current live occupancy.
          </div>

          {canMaxCapacity && (
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {confirmUpgradeAction === "max_capacity" ? (
                <>
                  <button style={confirmButtonStyle} onClick={handleMaxCapacity}>
                    Confirm Max Capacity
                  </button>
                  <button style={cancelButtonStyle} onClick={() => setConfirmUpgradeAction(null)}>
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  style={{
                    ...compactActionStyle,
                    background: "rgba(245,158,11,0.16)",
                    opacity: isConfirmingUpgrade ? 0.55 : 1,
                    cursor: isConfirmingUpgrade ? "default" : "pointer",
                  }}
                  onClick={() => setConfirmUpgradeAction("max_capacity")}
                  disabled={isConfirmingUpgrade}
                >
                  Max Capacity
                </button>
              )}
            </div>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "12px",
            }}
          >
            {island.supportsStandardBreeding && (
              <div
                style={{
                  display: "grid",
                  gap: "8px",
                  padding: "12px",
                  borderRadius: "14px",
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.03)",
                }}
              >
                <div style={{ fontSize: "12px", fontWeight: 700, opacity: 0.78 }}>Breeders</div>
                <div style={{ fontSize: "13px", opacity: 0.74 }}>
                  {island.breedingStructures} installed · {island.maxBreedingStructures} max
                </div>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {canUpgradeBreedingStructures && (
                    confirmUpgradeAction === "breeder" ? (
                      <>
                        <button style={confirmButtonStyle} onClick={handleUnlockBreeder}>
                          Confirm + Breeder
                        </button>
                        <button style={cancelButtonStyle} onClick={() => setConfirmUpgradeAction(null)}>
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        style={{
                          ...compactActionStyle,
                          background: "rgba(59,130,246,0.16)",
                          opacity: isConfirmingUpgrade ? 0.55 : 1,
                          cursor: isConfirmingUpgrade ? "default" : "pointer",
                        }}
                        onClick={() => setConfirmUpgradeAction("breeder")}
                        disabled={isConfirmingUpgrade}
                      >
                        + Breeder
                      </button>
                    )
                  )}

                  {canReduceBreedingStructures && (
                    confirmCapacityAction === "revert_breeder" ? (
                      <>
                        <button style={confirmButtonStyle} onClick={handleReduceBreeder}>
                          Confirm Revert
                        </button>
                        <button style={cancelButtonStyle} onClick={() => setConfirmCapacityAction(null)}>
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        style={compactActionStyle}
                        onClick={() => setConfirmCapacityAction("revert_breeder")}
                      >
                        Revert 1 Breeder
                      </button>
                    )
                  )}

                  {!canUpgradeBreedingStructures && !canReduceBreedingStructures && (
                    <div style={pillStyle}>Stable</div>
                  )}
                </div>
              </div>
            )}

            {island.supportsNursery && (
              <div
                style={{
                  display: "grid",
                  gap: "8px",
                  padding: "12px",
                  borderRadius: "14px",
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.03)",
                }}
              >
                <div style={{ fontSize: "12px", fontWeight: 700, opacity: 0.78 }}>Nurseries</div>
                <div style={{ fontSize: "13px", opacity: 0.74 }}>
                  {island.nurseries} installed · {island.maxNurseries} max
                </div>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {canUpgradeNurseries && (
                    confirmUpgradeAction === "nursery" ? (
                      <>
                        <button style={confirmButtonStyle} onClick={handleUnlockNursery}>
                          Confirm + Nursery
                        </button>
                        <button style={cancelButtonStyle} onClick={() => setConfirmUpgradeAction(null)}>
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        style={{
                          ...compactActionStyle,
                          background: "rgba(34,197,94,0.16)",
                          opacity: isConfirmingUpgrade ? 0.55 : 1,
                          cursor: isConfirmingUpgrade ? "default" : "pointer",
                        }}
                        onClick={() => setConfirmUpgradeAction("nursery")}
                        disabled={isConfirmingUpgrade}
                      >
                        + Nursery
                      </button>
                    )
                  )}

                  {canReduceNurseries && (
                    confirmCapacityAction === "revert_nursery" ? (
                      <>
                        <button style={confirmButtonStyle} onClick={handleReduceNursery}>
                          Confirm Revert
                        </button>
                        <button style={cancelButtonStyle} onClick={() => setConfirmCapacityAction(null)}>
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        style={compactActionStyle}
                        onClick={() => setConfirmCapacityAction("revert_nursery")}
                      >
                        Revert 1 Nursery
                      </button>
                    )
                  )}

                  {!canUpgradeNurseries && !canReduceNurseries && (
                    <div style={pillStyle}>Stable</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showReconcilePanel && island.isUnlocked && (showBreedingPipeline || showNurseryPipeline) && (
        <div
          style={{
            marginTop: "14px",
            padding: "14px",
            borderRadius: "16px",
            border: "1px solid rgba(96,165,250,0.22)",
            background: "rgba(96,165,250,0.06)",
            display: "grid",
            gap: "14px",
          }}
        >
          <div>
            <div style={{ fontSize: "12px", fontWeight: 700, opacity: 0.82 }}>
              Reconcile Live Island State
            </div>
            <div style={{ marginTop: "6px", fontSize: "13px", opacity: 0.72, lineHeight: 1.55 }}>
              Enter what is actually sitting in the breeder and nursery slots right now. The tracker will compare that against its live sessions so you can clear stale links or adopt missing sessions without rebuilding the island by hand.
            </div>
          </div>

          {showBreedingPipeline && (
            <div
              style={{
                display: "grid",
                gap: "10px",
                padding: "12px",
                borderRadius: "14px",
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.03)",
              }}
            >
              <div style={{ ...sectionTitleStyle, marginBottom: 0 }}>
                BREEDER SLOTS
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: "10px",
                }}
              >
                {Array.from({ length: breederReconcileSlotCount }, (_, index) => (
                  <label
                    key={`${island.island}-breeder-reconcile-${index}`}
                    style={{
                      display: "grid",
                      gap: "6px",
                      fontSize: "12px",
                      fontWeight: 700,
                      opacity: 0.82,
                    }}
                  >
                    Slot {index + 1}
                    <select
                      value={reconcileBreedingSlots[index] || ""}
                      onChange={(event) =>
                        updateReconcileSlot(setReconcileBreedingSlots, index, event.target.value)
                      }
                      style={{
                        padding: "8px 10px",
                        borderRadius: "10px",
                        border: "1px solid rgba(255,255,255,0.12)",
                        background: "rgba(255,255,255,0.06)",
                        color: "inherit",
                      }}
                    >
                      <option value="">Empty / Unknown</option>
                      {reconcileMonsterOptions.map((monsterName) => (
                        <option key={`${island.island}-breeder-slot-${index}-${monsterName}`} value={monsterName}>
                          {monsterName}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>

              <div style={{ fontSize: "13px", opacity: 0.7 }}>
                Matched {breedingReconcile.matchedTracked.length} tracked session{breedingReconcile.matchedTracked.length === 1 ? "" : "s"}.
              </div>

              {breedingReconcile.missingTracked.length > 0 && (
                <div style={{ display: "grid", gap: "8px" }}>
                  <div style={{ fontSize: "12px", fontWeight: 700, opacity: 0.8 }}>
                    Tracked as breeding here, but not seen in the breeder slots
                  </div>
                  {breedingReconcile.missingTracked.map((item, index) => (
                    <div
                      key={`${island.island}-missing-breeding-${item.name}-${item.sessionIds?.[0] || index}`}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "10px",
                        flexWrap: "wrap",
                        alignItems: "center",
                        padding: "10px 12px",
                        borderRadius: "12px",
                        border: "1px solid rgba(255,255,255,0.08)",
                        background: "rgba(239,68,68,0.08)",
                      }}
                    >
                      <div style={{ fontSize: "13px", opacity: 0.82 }}>
                        <strong>{item.name}</strong> · {item.sheetTitle}
                      </div>
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        {item.sheetKey && (
                          <button
                            style={{
                              ...compactActionStyle,
                              background: "rgba(239,68,68,0.16)",
                            }}
                            onClick={() => onUnassignFromPlanner?.(item.sessionIds?.[0])}
                          >
                            Unassign
                          </button>
                        )}
                        <button
                          style={{
                            ...compactActionStyle,
                            background: "rgba(245,158,11,0.16)",
                          }}
                          onClick={() => onClearPlannerSession?.(item.sessionIds?.[0])}
                        >
                          Remove From Board
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {breedingReconcile.observedOnly.length > 0 && (
                <div style={{ display: "grid", gap: "8px" }}>
                  <div style={{ fontSize: "12px", fontWeight: 700, opacity: 0.8 }}>
                    Seen in breeder slots, but not tracked live yet
                  </div>
                  {breedingReconcile.observedOnly.map((monsterName, index) => (
                    <div
                      key={`${island.island}-observed-breeding-${monsterName}-${index}`}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "10px",
                        flexWrap: "wrap",
                        alignItems: "center",
                        padding: "10px 12px",
                        borderRadius: "12px",
                        border: "1px solid rgba(255,255,255,0.08)",
                        background: "rgba(34,197,94,0.08)",
                      }}
                    >
                      <div style={{ fontSize: "13px", opacity: 0.82 }}>
                        <strong>{monsterName}</strong> appears to be breeding here.
                      </div>
                      <button
                        style={{
                          ...compactActionStyle,
                          background: "rgba(34,197,94,0.16)",
                        }}
                        onClick={() => handleAdoptObservedSession(monsterName, "breeding")}
                      >
                        Add Unassigned Breeding
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {breedingReconcile.missingTracked.length === 0 && breedingReconcile.observedOnly.length === 0 && (
                <div style={{ fontSize: "13px", opacity: 0.72 }}>
                  Breeder slots match the tracker right now.
                </div>
              )}
            </div>
          )}

          {showNurseryPipeline && (
            <div
              style={{
                display: "grid",
                gap: "10px",
                padding: "12px",
                borderRadius: "14px",
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.03)",
              }}
            >
              <div style={{ ...sectionTitleStyle, marginBottom: 0 }}>
                NURSERY SLOTS
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: "10px",
                }}
              >
                {Array.from({ length: nurseryReconcileSlotCount }, (_, index) => (
                  <label
                    key={`${island.island}-nursery-reconcile-${index}`}
                    style={{
                      display: "grid",
                      gap: "6px",
                      fontSize: "12px",
                      fontWeight: 700,
                      opacity: 0.82,
                    }}
                  >
                    Slot {index + 1}
                    <select
                      value={reconcileNurserySlots[index] || ""}
                      onChange={(event) =>
                        updateReconcileSlot(setReconcileNurserySlots, index, event.target.value)
                      }
                      style={{
                        padding: "8px 10px",
                        borderRadius: "10px",
                        border: "1px solid rgba(255,255,255,0.12)",
                        background: "rgba(255,255,255,0.06)",
                        color: "inherit",
                      }}
                    >
                      <option value="">Empty / Unknown</option>
                      {reconcileMonsterOptions.map((monsterName) => (
                        <option key={`${island.island}-nursery-slot-${index}-${monsterName}`} value={monsterName}>
                          {monsterName}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>

              <div style={{ fontSize: "13px", opacity: 0.7 }}>
                Matched {nurseryReconcile.matchedTracked.length} tracked nursery session{nurseryReconcile.matchedTracked.length === 1 ? "" : "s"}.
              </div>

              {nurseryReconcile.missingTracked.length > 0 && (
                <div style={{ display: "grid", gap: "8px" }}>
                  <div style={{ fontSize: "12px", fontWeight: 700, opacity: 0.8 }}>
                    Tracked in nursery here, but not seen in the nursery slots
                  </div>
                  {nurseryReconcile.missingTracked.map((item, index) => (
                    <div
                      key={`${island.island}-missing-nursery-${item.name}-${item.sessionIds?.[0] || index}`}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "10px",
                        flexWrap: "wrap",
                        alignItems: "center",
                        padding: "10px 12px",
                        borderRadius: "12px",
                        border: "1px solid rgba(255,255,255,0.08)",
                        background: "rgba(239,68,68,0.08)",
                      }}
                    >
                      <div style={{ fontSize: "13px", opacity: 0.82 }}>
                        <strong>{item.name}</strong> · {item.sheetTitle}
                      </div>
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        {item.sheetKey && (
                          <button
                            style={{
                              ...compactActionStyle,
                              background: "rgba(239,68,68,0.16)",
                            }}
                            onClick={() => onUnassignFromPlanner?.(item.sessionIds?.[0])}
                          >
                            Unassign
                          </button>
                        )}
                        <button
                          style={{
                            ...compactActionStyle,
                            background: "rgba(245,158,11,0.16)",
                          }}
                          onClick={() => onClearPlannerSession?.(item.sessionIds?.[0])}
                        >
                          Remove From Board
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {nurseryReconcile.observedOnly.length > 0 && (
                <div style={{ display: "grid", gap: "8px" }}>
                  <div style={{ fontSize: "12px", fontWeight: 700, opacity: 0.8 }}>
                    Seen in nursery slots, but not tracked live yet
                  </div>
                  {nurseryReconcile.observedOnly.map((monsterName, index) => (
                    <div
                      key={`${island.island}-observed-nursery-${monsterName}-${index}`}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "10px",
                        flexWrap: "wrap",
                        alignItems: "center",
                        padding: "10px 12px",
                        borderRadius: "12px",
                        border: "1px solid rgba(255,255,255,0.08)",
                        background: "rgba(34,197,94,0.08)",
                      }}
                    >
                      <div style={{ fontSize: "13px", opacity: 0.82 }}>
                        <strong>{monsterName}</strong> appears to be in the nursery here.
                      </div>
                      <button
                        style={{
                          ...compactActionStyle,
                          background: "rgba(34,197,94,0.16)",
                        }}
                        onClick={() => handleAdoptObservedSession(monsterName, "nursery")}
                      >
                        Add Unassigned Nursery
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {nurseryReconcile.missingTracked.length === 0 && nurseryReconcile.observedOnly.length === 0 && (
                <div style={{ fontSize: "13px", opacity: 0.72 }}>
                  Nursery slots match the tracker right now.
                </div>
              )}
            </div>
          )}

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button
              style={{
                ...compactActionStyle,
                background: "rgba(255,255,255,0.12)",
              }}
              onClick={resetReconcileDraft}
            >
              Reset To Tracker
            </button>
            <button
              style={{
                ...compactActionStyle,
                background: "rgba(255,255,255,0.08)",
              }}
              onClick={() => setShowReconcilePanel(false)}
            >
              Hide Reconcile
            </button>
          </div>
        </div>
      )}

      {showManualForm && island.isUnlocked && island.supportsStandardBreeding && (
        <div
          style={{
            marginTop: "14px",
            padding: "14px",
            borderRadius: "16px",
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.04)",
            display: "grid",
            gap: "10px",
          }}
        >
          <div style={{ fontSize: "12px", fontWeight: 700, opacity: 0.8 }}>
            Manual Breed
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button
              style={{
                ...compactActionStyle,
                background: manualMode === "pair" ? "rgba(168,85,247,0.16)" : compactActionStyle.background,
              }}
              onClick={() => setManualMode("pair")}
            >
              By Pair
            </button>
            <button
              style={{
                ...compactActionStyle,
                background: manualMode === "direct" ? "rgba(168,85,247,0.16)" : compactActionStyle.background,
              }}
              onClick={() => setManualMode("direct")}
            >
              Direct Add
            </button>
          </div>

          {manualMode === "pair" ? (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: "10px",
                }}
              >
                <select
                  value={manualParentA}
                  onChange={(event) => setManualParentA(event.target.value)}
                  style={{
                    padding: "8px 10px",
                    borderRadius: "10px",
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.06)",
                    color: "inherit",
                  }}
                >
                  <option value="">Select parent A</option>
                  {manualParentOptions.map((monsterName) => (
                    <option key={`${island.island}-${monsterName}-a`} value={monsterName}>
                      {monsterName}
                    </option>
                  ))}
                </select>

                <select
                  value={manualParentB}
                  onChange={(event) => setManualParentB(event.target.value)}
                  style={{
                    padding: "8px 10px",
                    borderRadius: "10px",
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.06)",
                    color: "inherit",
                  }}
                >
                  <option value="">Select parent B</option>
                  {manualParentOptions.map((monsterName) => (
                    <option key={`${island.island}-${monsterName}-b`} value={monsterName}>
                      {monsterName}
                    </option>
                  ))}
                </select>
              </div>

              {manualPairOutcome.timerOptions.length > 0 && (
                <select
                  value={manualObservedTime}
                  onChange={(event) => setManualObservedTime(event.target.value)}
                  style={{
                    padding: "8px 10px",
                    borderRadius: "10px",
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.06)",
                    color: "inherit",
                  }}
                >
                  <option value="">Observed timer (optional)</option>
                  {manualPairOutcome.timerOptions.map((timeValue) => (
                    <option key={`${island.island}-${timeValue}-timer`} value={timeValue}>
                      {timeValue}
                    </option>
                  ))}
                </select>
              )}
            </>
          ) : (
            <select
              value={manualMonsterId}
              onChange={(event) => setManualMonsterId(event.target.value)}
              style={{
                padding: "8px 10px",
                borderRadius: "10px",
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.06)",
                color: "inherit",
              }}
            >
              <option value="">Select monster</option>
              {manualMonsterOptions.map((monsterName) => (
                <option key={`${island.island}-${monsterName}`} value={monsterName}>
                  {monsterName}
                </option>
              ))}
            </select>
          )}

          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            <button
              style={{
                ...compactActionStyle,
                background: "rgba(168,85,247,0.16)",
              }}
              onClick={handleCreateManualBreed}
              disabled={
                manualMode === "pair"
                  ? (!manualParentA || !manualParentB)
                  : !manualMonsterId
              }
            >
              {manualMode === "pair"
                ? (manualPairOutcome.resolution === "exact"
                  ? `Add ${manualPairOutcome.resultName}`
                  : "Add Mystery Session")
                : "Add Session"}
            </button>
            <button
              style={compactActionStyle}
              onClick={() =>
              {
                setManualMonsterId("");
                setManualParentA("");
                setManualParentB("");
                setManualObservedTime("");
                setShowManualForm(false);
              }}
            >
              Cancel
            </button>
          </div>

          <div
            style={{
              marginTop: "4px",
              fontSize: "12px",
              lineHeight: 1.5,
              opacity: 0.78,
            }}
          >
            {manualMode === "pair" ? (
              manualParentA && manualParentB ? (
                <>
                  <div>
                    Pair: {manualParentA} + {manualParentB}
                  </div>
                  <div>
                    {manualPairOutcome.candidates.length === 0
                      ? "No exact combo match is currently in the dataset for this pair on this island."
                      : `Possible results: ${manualPairOutcome.candidates.map((entry) => entry.monsterName).join(" · ")}`}
                  </div>
                  {manualObservedTime && (
                    <div>Observed timer: {manualObservedTime}</div>
                  )}
                  <div>
                    {manualPairOutcome.resolution === "exact"
                      ? `Resolved result: ${manualPairOutcome.resultName}`
                      : "Result unresolved. The app will record this as a Mystery Egg session."}
                  </div>
                </>
              ) : (
                <div>Select both parents to preview possible results and use a timer when available.</div>
              )
            ) : manualMonsterId ? (
              selectedManualCombo ? (
                <>
                  <div>
                    Combo: {selectedManualCombo.combinations.length > 0
                      ? selectedManualCombo.combinations
                          .map((combo) => combo.join(" + "))
                          .join(" · ")
                      : "No combo listed"}
                  </div>
                  <div>
                    Breedable On: {selectedManualCombo.breedableOn.join(", ") || "—"}
                  </div>
                  <div>
                    Time: {selectedManualCombo.breedingTime}
                    {selectedManualCombo.enhancedBreedingTime
                      ? ` (Enhanced: ${selectedManualCombo.enhancedBreedingTime})`
                      : ""}
                  </div>
                  {selectedManualCombo.notes && (
                    <div>Notes: {selectedManualCombo.notes}</div>
                  )}
                </>
              ) : (
                <div>No combo data yet.</div>
              )
            ) : (
              <div>Select a monster to preview combos and breeding time.</div>
            )}
          </div>
        </div>
      )}

      <div style={{ marginTop: "18px", display: "grid", gap: "18px" }}>
        {showBreedingPipeline && (
          <>
            <div>
              <div
                style={{
                  ...sectionTitleStyle,
                  opacity: island.freeSlots > 0 ? 0.7 : 0.45,
                }}
              >
                NEED NOW
              </div>
              {island.needNow.length === 0 ? (
                <div style={{ opacity: island.freeSlots > 0 ? 0.68 : 0.5 }}>
                  Nothing assignable on this island right now.
                </div>
              ) : (
                <div style={{ display: "grid", gap: "10px" }}>
                  {visibleNeedNow.map((item) => (
                    <NeedNowRow
                      key={`${island.island}-${item.sheetKey}-${item.name}-need`}
                      item={item}
                      faded={!island.isUnlocked || island.freeSlots === 0}
                      canBreed={
                        island.isUnlocked &&
                        island.freeSlots > 0 &&
                        item.queueRemaining > 0
                      }
                      onBreed={onBreedFromPlanner}
                    />
                  ))}
                  {hiddenNeedNowCount > 0 && (
                    <button
                      style={{
                        ...compactActionStyle,
                        justifySelf: "start",
                      }}
                      onClick={() => setShowAllNeedNow(true)}
                    >
                      More Breed Options ({hiddenNeedNowCount})
                    </button>
                  )}
                  {showAllNeedNow && island.needNow.length > DIRECT_SLOT_ACTION_LIMIT && (
                    <button
                      style={{
                        ...compactActionStyle,
                        justifySelf: "start",
                      }}
                      onClick={() => setShowAllNeedNow(false)}
                    >
                      Show Fewer
                    </button>
                  )}
                </div>
              )}
            </div>

            <div>
              <div
                style={{
                  ...sectionTitleStyle,
                  opacity: island.freeSlots > 0 ? 0.7 : 0.45,
                }}
              >
                COLLECTION MISSING
              </div>
              {island.collectionMissing?.length === 0 ? (
                <div style={{ opacity: island.freeSlots > 0 ? 0.68 : 0.5 }}>
                  No active island collection gaps here right now.
                </div>
              ) : (
                <div style={{ display: "grid", gap: "10px" }}>
                  {visibleCollectionMissing.map((item) => (
                    <NeedNowRow
                      key={`${island.island}-${item.sheetKey}-${item.name}-collection`}
                      item={item}
                      faded={!island.isUnlocked || island.freeSlots === 0}
                      canBreed={
                        island.isUnlocked &&
                        island.freeSlots > 0 &&
                        item.queueRemaining > 0
                      }
                      onBreed={onBreedFromPlanner}
                      buttonLabel="Plan Collection Breed"
                    />
                  ))}
                  {hiddenCollectionMissingCount > 0 && (
                    <button
                      style={{
                        ...compactActionStyle,
                        justifySelf: "start",
                      }}
                      onClick={() => setShowAllCollectionMissing(true)}
                    >
                      More Collection Options ({hiddenCollectionMissingCount})
                    </button>
                  )}
                  {showAllCollectionMissing && (island.collectionMissing?.length || 0) > DIRECT_SLOT_ACTION_LIMIT && (
                    <button
                      style={{
                        ...compactActionStyle,
                        justifySelf: "start",
                      }}
                      onClick={() => setShowAllCollectionMissing(false)}
                    >
                      Show Fewer
                    </button>
                  )}
                </div>
              )}
            </div>

            <div>
              <div
                style={{
                  ...sectionTitleStyle,
                  opacity: island.freeSlots === 0 ? 0.82 : 0.7,
                }}
              >
                CURRENTLY BREEDING
              </div>
              {island.currentlyBreeding.length === 0 ? (
                <div style={{ opacity: 0.68 }}>No active breeding reserved here.</div>
              ) : (
                <div style={{ display: "grid", gap: "10px" }}>
                  {island.currentlyBreeding.map((item) => (
                    <CookingRow
                      key={`${island.island}-${item.sheetKey}-${item.name}-breeding`}
                      item={item}
                      onZapAssigned={onZapFromPlanner}
                      onAssignAndZap={onAssignAndZapFromPlanner}
                      onUnassign={onUnassignFromPlanner}
                      onMoveToNursery={onMoveToNurseryFromPlanner}
                      canMoveToNursery={island.isUnlocked && island.freeNurseries > 0}
                      onBreed={
                        island.isUnlocked &&
                        island.freeSlots > 0 &&
                        item.queueRemaining > 0
                          ? onBreedFromPlanner
                          : null
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {showNurseryPipeline && (
          <div>
            <div style={sectionTitleStyle}>IN NURSERY</div>
            {island.nurserySessions?.length === 0 ? (
              <div style={{ opacity: 0.68 }}>No eggs in nursery here right now.</div>
            ) : (
              <div style={{ display: "grid", gap: "10px" }}>
                {island.nurserySessions.map((item) => (
                  <NurseryRow
                    key={`${island.island}-${item.sheetKey || "manual"}-${item.name}-nursery`}
                    item={item}
                    onHatch={onHatchNurseryFromPlanner}
                    onUnassign={onUnassignFromPlanner}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function IslandPlanner({
  plannerData,
  unlockIsland,
  unlockIslandBreedingStructure,
  unlockIslandNursery,
  reduceIslandBreedingStructure,
  reduceIslandNursery,
  onZapFromPlanner,
  onBreedFromPlanner,
  onCreateManualBreed,
  onCreateObservedLiveSession,
  onAssignAndZapFromPlanner,
  onUnassignFromPlanner,
  onClearPlannerSession,
  onClearIslandBreeders,
  onClearIslandNurseries,
  onResetIslandLiveBoard,
  onMoveToNurseryFromPlanner,
  onHatchNurseryFromPlanner,
})
{
  const [activeTab, setActiveTab] = useState(ALL_REGIONS_FILTER);
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [highlightedIslandKey, setHighlightedIslandKey] = useState(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const islandCardRefs = useRef(new Map());

  const groupedPlannerData = useMemo(() =>
  {
    return ISLAND_GROUPS.map((group) => ({
      ...group,
      islands: plannerData.filter((island) => (island.group || "other") === group.key),
    }));
  }, [plannerData]);
  const hasActiveTab = activeTab === ALL_REGIONS_FILTER
    || groupedPlannerData.some((group) => group.key === activeTab);
  const resolvedActiveTab = hasActiveTab ? activeTab : ALL_REGIONS_FILTER;

  useEffect(() =>
  {
    if (!highlightedIslandKey)
    {
      return undefined;
    }

    const timeout = setTimeout(() =>
    {
      setHighlightedIslandKey(null);
    }, 1800);

    return () => clearTimeout(timeout);
  }, [highlightedIslandKey]);

  useEffect(() =>
  {
    function handleScroll()
    {
      setShowScrollTop(window.scrollY > 720);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (plannerData.length === 0)
  {
    return (
      <div style={cardStyle}>
        <div style={{ fontSize: "32px", fontWeight: 800, letterSpacing: "-0.02em" }}>
          Island Manager
        </div>
        <div style={{ marginTop: "8px", opacity: 0.75 }}>
          No active islands yet. Activate a sheet to start planning islands.
        </div>
      </div>
    );
  }

  const activeGroup = resolvedActiveTab === ALL_REGIONS_FILTER
    ? null
    : groupedPlannerData.find((group) => group.key === resolvedActiveTab) || groupedPlannerData[0];
  const regionFilteredIslands = resolvedActiveTab === ALL_REGIONS_FILTER
    ? plannerData
    : (activeGroup?.islands || []);
  const visibleIslands = regionFilteredIslands.filter((island) =>
    matchesAvailabilityFilter(island, availabilityFilter)
  );
  const activeRegionLabel = getRegionFilterLabel(resolvedActiveTab, groupedPlannerData);
  const activeAvailabilityLabel = getAvailabilityFilterLabel(availabilityFilter);
  const activeAvailabilityMeaning = getAvailabilityFilterMeaning(availabilityFilter);

  function handleJumpToIsland(island)
  {
    const islandKey = island.islandKey || island.island;
    const targetNode = islandCardRefs.current.get(islandKey);

    if (!targetNode)
    {
      return;
    }

    targetNode.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    setHighlightedIslandKey(islandKey);
  }

  function handleScrollToTop()
  {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  return (
    <div className="page-surface">
      <div className="responsive-page-card" style={cardStyle}>
        <div style={{ fontSize: "32px", fontWeight: 800, letterSpacing: "-0.02em" }}>
          Island Manager
        </div>
        <div style={{ marginTop: "8px", opacity: 0.75 }}>
          Choose a region, then manage island progression, breeding capacity, and active assignments.
        </div>

        <div className="screen-card-actions island-filter-row island-region-row" style={{ marginTop: "16px" }}>
          {[{ key: ALL_REGIONS_FILTER, label: "All Regions" }, ...ISLAND_GROUPS].map((group) =>
          {
            const isActive = resolvedActiveTab === group.key;

            return (
              <button
                key={group.key}
                style={{
                  ...tabButtonStyle,
                  background: isActive ? "rgba(245,158,11,0.18)" : tabButtonStyle.background,
                  border: isActive
                    ? "1px solid rgba(245,158,11,0.34)"
                    : tabButtonStyle.border,
                }}
                onClick={() => setActiveTab(group.key)}
              >
                {group.key === ALL_REGIONS_FILTER ? group.label : getTabLabel(group)}
              </button>
            );
          })}
        </div>

        <div className="island-region-select-wrap" style={{ marginTop: "16px" }}>
          <div style={{ fontSize: "12px", fontWeight: 700, opacity: 0.72 }}>
            Region
          </div>
          <select
            className="island-region-select"
            value={resolvedActiveTab}
            onChange={(event) => setActiveTab(event.target.value)}
          >
            {[{ key: ALL_REGIONS_FILTER, label: "All Regions" }, ...ISLAND_GROUPS].map((group) => (
              <option key={`select-${group.key}`} value={group.key}>
                {group.key === ALL_REGIONS_FILTER ? group.label : getTabLabel(group)}
              </option>
            ))}
          </select>
        </div>

        <div className="screen-card-actions island-filter-row island-availability-row" style={{ marginTop: "14px" }}>
          {AVAILABILITY_FILTER_OPTIONS.map((filter) =>
          {
            const isActive = availabilityFilter === filter.key;

            return (
              <button
                key={filter.key}
                style={{
                  ...tabButtonStyle,
                  padding: "8px 14px",
                  fontSize: "13px",
                  background: isActive ? "rgba(59,130,246,0.18)" : tabButtonStyle.background,
                  border: isActive
                    ? "1px solid rgba(96,165,250,0.34)"
                    : tabButtonStyle.border,
                }}
                onClick={() => setAvailabilityFilter(filter.key)}
              >
                {filter.label}
              </button>
            );
          })}
        </div>

        <div style={{ marginTop: "10px", fontSize: "13px", opacity: 0.68 }}>
          Viewing: {activeRegionLabel} | {activeAvailabilityLabel}
        </div>
        {activeAvailabilityMeaning && (
          <div style={{ marginTop: "4px", fontSize: "12px", opacity: 0.56 }}>
            {activeAvailabilityMeaning}
          </div>
        )}
        {visibleIslands.length > 1 && (
          <div className="island-jump-wrap" style={{ marginTop: "14px" }}>
            <div style={{ fontSize: "12px", fontWeight: 700, opacity: 0.72 }}>
              Jump to island
            </div>
            <div className="island-jump-row">
              {visibleIslands.map((island) => (
                <button
                  key={`jump-${island.islandKey || island.island}`}
                  style={compactActionStyle}
                  onClick={() => handleJumpToIsland(island)}
                >
                  {island.island}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {showScrollTop && (
        <button
          className="page-scroll-top"
          style={{
            ...compactActionStyle,
            padding: "10px 14px",
            background: "rgba(59,130,246,0.16)",
            border: "1px solid rgba(96,165,250,0.3)",
            boxShadow: "0 12px 30px rgba(0,0,0,0.24)",
          }}
          onClick={handleScrollToTop}
        >
          ↑ Top
        </button>
      )}

      <div style={{ display: "grid", gap: "16px" }}>
        {visibleIslands.length === 0 ? (
          <div style={cardStyle}>
            <div style={{ fontSize: "18px", fontWeight: 700 }}>
              No islands match this filter
            </div>
            <div style={{ marginTop: "8px", opacity: 0.72 }}>
              Try a different region or availability filter.
            </div>
          </div>
        ) : (
          visibleIslands.map((island) => (
            <div
              key={island.islandKey || island.island}
              ref={(node) =>
              {
                const islandKey = island.islandKey || island.island;

                if (node)
                {
                  islandCardRefs.current.set(islandKey, node);
                }
                else
                {
                  islandCardRefs.current.delete(islandKey);
                }
              }}
              style={{
                borderRadius: "18px",
                boxShadow: highlightedIslandKey === (island.islandKey || island.island)
                  ? "0 0 0 2px rgba(96,165,250,0.4), 0 0 30px rgba(96,165,250,0.18)"
                  : "none",
                transition: "box-shadow 180ms ease",
              }}
            >
              <IslandCard
                island={island}
                unlockIsland={unlockIsland}
                unlockIslandBreedingStructure={unlockIslandBreedingStructure}
                unlockIslandNursery={unlockIslandNursery}
                reduceIslandBreedingStructure={reduceIslandBreedingStructure}
                reduceIslandNursery={reduceIslandNursery}
                onZapFromPlanner={onZapFromPlanner}
                onBreedFromPlanner={onBreedFromPlanner}
                onCreateManualBreed={onCreateManualBreed}
                onCreateObservedLiveSession={onCreateObservedLiveSession}
                onAssignAndZapFromPlanner={onAssignAndZapFromPlanner}
                onUnassignFromPlanner={onUnassignFromPlanner}
                onClearPlannerSession={onClearPlannerSession}
                onClearIslandBreeders={onClearIslandBreeders}
                onClearIslandNurseries={onClearIslandNurseries}
                onResetIslandLiveBoard={onResetIslandLiveBoard}
                onMoveToNurseryFromPlanner={onMoveToNurseryFromPlanner}
                onHatchNurseryFromPlanner={onHatchNurseryFromPlanner}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
