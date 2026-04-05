import React, { useEffect, useMemo, useState } from "react";
import { ISLAND_GROUPS } from "../data/islands";
import { MONSTER_DATABASE } from "../data/monsterDatabase";
import { getBreedingComboByMonsterName } from "../utils/breedingCombos";
import {
  getElementChipStyle,
  getMonsterBreedingIslands,
  getMonsterMetadata,
} from "../utils/monsterMetadata";

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
  { key: "open", label: "Open" },
  { key: "breeder_free", label: "Breeder Free" },
  { key: "nursery_free", label: "Nursery Free" },
  { key: "busy", label: "Constrained" },
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

  if (filterKey === "open" || filterKey === "breeder_free")
  {
    return island.supportsStandardBreeding && Number(island.freeSlots || 0) > 0;
  }

  if (filterKey === "nursery_free")
  {
    return island.supportsNursery && Number(island.freeNurseries || 0) > 0;
  }

  if (filterKey === "busy")
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

function NurseryRow({ item, onHatch })
{
  const metadata = getMonsterMetadata(item.name);

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
  onAssignAndZapFromPlanner,
  onMoveToNurseryFromPlanner,
  onHatchNurseryFromPlanner,
})
{
  const [confirmUpgradeAction, setConfirmUpgradeAction] = useState(null);
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualMonsterId, setManualMonsterId] = useState("");
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
        .sort((a, b) => a.localeCompare(b)),
    [island.island]
  );
  const selectedManualCombo = useMemo(
    () => getBreedingComboByMonsterName(manualMonsterId),
    [manualMonsterId]
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
  }

  function handleReduceNursery()
  {
    reduceIslandNursery(island.island);
  }

  function handleCreateManualBreed()
  {
    if (!manualMonsterId)
    {
      return;
    }

    onCreateManualBreed(manualMonsterId, island.island);
    setManualMonsterId("");
    setShowManualForm(false);
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

          {island.supportsStandardBreeding && (
            <div
              style={{
                display: "grid",
                gap: "6px",
                padding: "8px 12px",
                borderRadius: "14px",
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.05)",
              }}
            >
              <div style={{ fontSize: "12px", fontWeight: 700, opacity: 0.8 }}>
                Breeders
              </div>
              <div style={{ fontSize: "13px", fontWeight: 700 }}>{breederSummary}</div>
              <div style={{ fontSize: "12px", opacity: 0.7 }}>{island.freeSlots} free</div>

              {!island.isUnlocked ? null : canUpgradeBreedingStructures ? (
                confirmUpgradeAction === "breeder" ? (
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    <button style={confirmButtonStyle} onClick={handleUnlockBreeder}>
                      Confirm Breeder
                    </button>
                    <button style={cancelButtonStyle} onClick={() => setConfirmUpgradeAction(null)}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
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
                    {canReduceBreedingStructures && (
                      <button
                        style={compactActionStyle}
                        onClick={handleReduceBreeder}
                      >
                        Revert
                      </button>
                    )}
                  </div>
                )
              ) : canReduceBreedingStructures ? (
                <button style={compactActionStyle} onClick={handleReduceBreeder}>
                  Revert
                </button>
              ) : (
                <div style={pillStyle}>Breeder Base</div>
              )}
            </div>
          )}

          {island.supportsNursery && (
            <div
              style={{
                display: "grid",
                gap: "6px",
                padding: "8px 12px",
                borderRadius: "14px",
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.05)",
              }}
            >
              <div style={{ fontSize: "12px", fontWeight: 700, opacity: 0.8 }}>
                Nurseries
              </div>
              <div style={{ fontSize: "13px", fontWeight: 700 }}>{nurserySummary}</div>
              <div style={{ fontSize: "12px", opacity: 0.7 }}>{island.freeNurseries} free</div>

              {!island.isUnlocked ? null : canUpgradeNurseries ? (
                confirmUpgradeAction === "nursery" ? (
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    <button style={confirmButtonStyle} onClick={handleUnlockNursery}>
                      Confirm Nursery
                    </button>
                    <button style={cancelButtonStyle} onClick={() => setConfirmUpgradeAction(null)}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
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
                    {canReduceNurseries && (
                      <button
                        style={compactActionStyle}
                        onClick={handleReduceNursery}
                      >
                        Revert
                      </button>
                    )}
                  </div>
                )
              ) : canReduceNurseries ? (
                <button style={compactActionStyle} onClick={handleReduceNursery}>
                  Revert
                </button>
              ) : (
                <div style={pillStyle}>Nursery Base</div>
              )}
            </div>
          )}

          {island.isUnlocked && island.supportsStandardBreeding && (
            <div
              style={{
                display: "grid",
                gap: "6px",
                padding: "8px 12px",
                borderRadius: "14px",
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.05)",
                minWidth: "210px",
              }}
            >
              <div style={{ fontSize: "12px", fontWeight: 700, opacity: 0.8 }}>
                Manual Breed
              </div>

              {!showManualForm ? (
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
              ) : (
                <>
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

                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    <button
                      style={{
                        ...compactActionStyle,
                        background: "rgba(168,85,247,0.16)",
                      }}
                      onClick={handleCreateManualBreed}
                      disabled={!manualMonsterId}
                    >
                      Add Session
                    </button>
                    <button
                      style={compactActionStyle}
                      onClick={() =>
                      {
                        setManualMonsterId("");
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
                    {manualMonsterId ? (
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
                </>
              )}
            </div>
          )}

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
            {hasEditableCapacities && isFullyUpgraded && (
              <div style={{ fontSize: "13px", opacity: 0.72 }}>
                {island.breedingStructures} breeders · {island.nurseries} nurseries · fully upgraded
              </div>
            )}

            {hasEditableCapacities && !isFullyUpgraded && (
              <div style={{ fontSize: "13px", opacity: 0.72 }}>
                Upgrade or revert breeder and nursery capacity from the controls above.
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
  onAssignAndZapFromPlanner,
  onMoveToNurseryFromPlanner,
  onHatchNurseryFromPlanner,
})
{
  const [activeTab, setActiveTab] = useState(ALL_REGIONS_FILTER);
  const [availabilityFilter, setAvailabilityFilter] = useState("all");

  const groupedPlannerData = useMemo(() =>
  {
    return ISLAND_GROUPS.map((group) => ({
      ...group,
      islands: plannerData.filter((island) => (island.group || "other") === group.key),
    }));
  }, [plannerData]);

  useEffect(() =>
  {
    const hasActiveTab = activeTab === ALL_REGIONS_FILTER
      || groupedPlannerData.some((group) => group.key === activeTab);

    if (!hasActiveTab)
    {
      setActiveTab(ALL_REGIONS_FILTER);
    }
  }, [activeTab, groupedPlannerData]);

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

  const activeGroup = activeTab === ALL_REGIONS_FILTER
    ? null
    : groupedPlannerData.find((group) => group.key === activeTab) || groupedPlannerData[0];
  const regionFilteredIslands = activeTab === ALL_REGIONS_FILTER
    ? plannerData
    : (activeGroup?.islands || []);
  const visibleIslands = regionFilteredIslands.filter((island) =>
    matchesAvailabilityFilter(island, availabilityFilter)
  );
  const activeRegionLabel = getRegionFilterLabel(activeTab, groupedPlannerData);
  const activeAvailabilityLabel = getAvailabilityFilterLabel(availabilityFilter);

  return (
    <div style={{ display: "grid", gap: "18px" }}>
      <div style={cardStyle}>
        <div style={{ fontSize: "32px", fontWeight: 800, letterSpacing: "-0.02em" }}>
          Island Manager
        </div>
        <div style={{ marginTop: "8px", opacity: 0.75 }}>
          Choose a region, then manage island progression, breeding capacity, and active assignments.
        </div>

        <div
          style={{
            marginTop: "16px",
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          {[{ key: ALL_REGIONS_FILTER, label: "All Regions" }, ...ISLAND_GROUPS].map((group) => {
            const isActive = activeTab === group.key;

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

        <div
          style={{
            marginTop: "14px",
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          {AVAILABILITY_FILTER_OPTIONS.map((filter) => {
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
      </div>

      <div style={{ display: "grid", gap: "16px" }}>
        {visibleIslands.length === 0 ? (
          <div style={cardStyle}>
            <div style={{ fontSize: "18px", fontWeight: 700 }}>
              No islands match this filter
            </div>
            <div style={{ marginTop: "8px", opacity: 0.72 }}>
              Try a different availability filter for this region.
            </div>
          </div>
        ) : (
          visibleIslands.map((island) => (
            <IslandCard
              key={island.islandKey || island.island}
              island={island}
              unlockIsland={unlockIsland}
              unlockIslandBreedingStructure={unlockIslandBreedingStructure}
              unlockIslandNursery={unlockIslandNursery}
              reduceIslandBreedingStructure={reduceIslandBreedingStructure}
              reduceIslandNursery={reduceIslandNursery}
              onZapFromPlanner={onZapFromPlanner}
              onBreedFromPlanner={onBreedFromPlanner}
              onCreateManualBreed={onCreateManualBreed}
              onAssignAndZapFromPlanner={onAssignAndZapFromPlanner}
              onMoveToNurseryFromPlanner={onMoveToNurseryFromPlanner}
              onHatchNurseryFromPlanner={onHatchNurseryFromPlanner}
            />
          ))
        )}
      </div>
    </div>
  );
}
