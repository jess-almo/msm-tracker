import React, { useEffect, useMemo, useState } from "react";
import { ISLAND_GROUPS, ISLAND_STATE_DEFAULTS, getIslandOperationalProfile } from "../data/islands";
import { COLLECTIONS } from "../data/collections";
import {
  getCollectionEntryStatus,
  getSheetProgressState,
} from "../utils/collectionStatus";
import { getWorldVisualPalette } from "../utils/worldPalettes";

const pageCardStyle = {
  border: "1px solid rgba(255,255,255,0.12)",
  background: "linear-gradient(180deg, rgba(255,255,255,0.065), rgba(255,255,255,0.025))",
  boxShadow: "0 18px 40px rgba(0,0,0,0.2)",
  backdropFilter: "blur(8px)",
};

const sectionCardStyle = {
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.035)",
  boxShadow: "0 10px 24px rgba(0,0,0,0.12)",
};

const tabStyle = {
  padding: "10px 16px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.08)",
  color: "inherit",
  cursor: "pointer",
  fontWeight: 700,
};

const filterButtonStyle = {
  padding: "8px 14px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.08)",
  color: "inherit",
  cursor: "pointer",
  fontWeight: 700,
  fontSize: "13px",
};

const filterSelectStyle = {
  width: "100%",
  padding: "11px 14px",
  borderRadius: "14px",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.06)",
  color: "inherit",
  fontWeight: 700,
};

const actionButtonStyle = {
  padding: "8px 14px",
  borderRadius: "12px",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.08)",
  color: "inherit",
  cursor: "pointer",
  fontWeight: 700,
};

const compactActionButtonStyle = {
  ...actionButtonStyle,
  padding: "7px 12px",
  fontSize: "12px",
};

const compactDangerButtonStyle = {
  ...compactActionButtonStyle,
  border: "1px solid rgba(239,68,68,0.22)",
  background: "rgba(239,68,68,0.12)",
};

const COLLECTION_WORLD_ART = {
  Plant: {
    icon: "/monsters/worlds/icons/plant.png",
    pin: "/monsters/worlds/pins/plant.png",
    // Tweak world-card pin scale per island here.
    pinScale: 1.28,
  },
  Cold: {
    icon: "/monsters/worlds/icons/cold.png",
    pin: "/monsters/worlds/pins/cold.png",
    // Cold reads a little smaller, so it runs slightly larger by default.
    pinScale: 1.42,
  },
  Air: {
    icon: "/monsters/worlds/icons/air.png",
    pin: "/monsters/worlds/pins/air.png",
    pinScale: 1.28,
  },
  Water: {
    icon: "/monsters/worlds/icons/water.png",
    pin: "/monsters/worlds/pins/water.png",
    pinScale: 1.28,
  },
  Earth: {
    icon: "/monsters/worlds/icons/earth.png",
    pin: "/monsters/worlds/pins/earth.png",
    pinScale: 1.28,
  },
  "Fire Haven": {
    icon: "/monsters/worlds/icons/fire-haven.png",
    pin: "/monsters/worlds/pins/fire-haven.png",
    pinScale: 1.3,
  },
  "Fire Oasis": {
    icon: "/monsters/worlds/icons/fire-oasis.png",
    pin: "/monsters/worlds/pins/fire-oasis.png",
    pinScale: 1.3,
  },
  Light: {
    icon: "/monsters/worlds/icons/light.png",
    pin: "/monsters/worlds/pins/light.png",
    pinScale: 1.3,
  },
  Psychic: {
    icon: "/monsters/worlds/icons/psychic.png",
    pin: "/monsters/worlds/pins/psychic.png",
    pinScale: 1.3,
  },
  Faerie: {
    icon: "/monsters/worlds/icons/faerie.png",
    pin: "/monsters/worlds/pins/faerie.png",
    pinScale: 1.3,
  },
  Bone: {
    icon: "/monsters/worlds/icons/bone.png",
    pin: "/monsters/worlds/pins/bone.png",
    pinScale: 1.3,
  },
  "Magical Sanctum": {
    icon: "/monsters/worlds/icons/magical-sanctum.png",
    pin: "/monsters/worlds/pins/magical-sanctum.png",
    pinScale: 1.3,
  },
  "Ethereal Island": {
    icon: "/monsters/worlds/icons/ethereal-island.png",
    pin: "/monsters/worlds/pins/ethereal-island.png",
    pinScale: 1.3,
  },
  "Amber Island": {
    icon: "/monsters/worlds/icons/amber-island.png",
    pin: "/monsters/worlds/pins/amber-island.png",
    pinScale: 1.34,
  },
  "Wublin Island": {
    icon: "/monsters/worlds/icons/wublin-island.png",
    pin: "/monsters/worlds/pins/wublin-island.png",
    pinScale: 1.34,
  },
  Shugabush: {
    icon: "/monsters/worlds/icons/shugabush.png",
    pin: "/monsters/worlds/pins/shugabush.png",
    pinScale: 1.34,
  },
  "Seasonal Shanty": {
    icon: "/monsters/worlds/icons/seasonal-shanty.png",
    pin: "/monsters/worlds/pins/seasonal-shanty.png",
    pinScale: 1.34,
  },
  "Mirror Plant": {
    icon: "/monsters/worlds/icons/mirror-plant.png",
    pin: "/monsters/worlds/pins/mirror-plant.png",
    pinScale: 1.32,
  },
  "Mirror Cold": {
    icon: "/monsters/worlds/icons/mirror-cold.png",
    pin: "/monsters/worlds/pins/mirror-cold.png",
    pinScale: 1.34,
  },
  "Mirror Air": {
    icon: "/monsters/worlds/icons/mirror-air.png",
    pin: "/monsters/worlds/pins/mirror-air.png",
    pinScale: 1.32,
  },
  "Mirror Water": {
    icon: "/monsters/worlds/icons/mirror-water.png",
    pin: "/monsters/worlds/pins/mirror-water.png",
    pinScale: 1.32,
  },
  "Mirror Earth": {
    icon: "/monsters/worlds/icons/mirror-earth.png",
    pin: "/monsters/worlds/pins/mirror-earth.png",
    pinScale: 1.32,
  },
  "Mirror Light": {
    icon: "/monsters/worlds/icons/mirror-light.png",
    pin: "/monsters/worlds/pins/mirror-light.png",
    pinScale: 1.32,
  },
  "Mirror Psychic": {
    icon: "/monsters/worlds/icons/mirror-psychic.png",
    pin: "/monsters/worlds/pins/mirror-psychic.png",
    pinScale: 1.32,
  },
  "Mirror Faerie": {
    icon: "/monsters/worlds/icons/mirror-faerie.png",
    pin: "/monsters/worlds/pins/mirror-faerie.png",
    pinScale: 1.32,
  },
  "Mirror Bone": {
    icon: "/monsters/worlds/icons/mirror-bone.png",
    pin: "/monsters/worlds/pins/mirror-bone.png",
    pinScale: 1.32,
  },
};

const STATUS_FILTER_OPTIONS = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "in_progress", label: "Partially Complete" },
  { key: "not_started", label: "Ready to Start" },
  { key: "complete", label: "Complete" },
];

const VESSEL_FAMILY_FILTER_OPTIONS = [
  { key: "all", label: "All" },
  { key: "amber", label: "Amber" },
  { key: "wublin", label: "Wublin" },
  { key: "celestial", label: "Celestial" },
  { key: "other", label: "Other" },
];

function isValidCollectionEntry(entry)
{
  return Boolean(entry && typeof entry === "object" && typeof entry.name === "string" && entry.name.trim());
}

function getDerivedSheetStatus(sheet)
{
  const progress = getSheetProgressState(sheet);

  if (sheet.isActive)
  {
    return "active";
  }

  if (progress.complete)
  {
    return "complete";
  }

  if (progress.done > 0 || progress.tracked > 0)
  {
    return "in_progress";
  }

  return "not_started";
}

function getStatusLabel(status)
{
  if (status === "active")
  {
    return "Active";
  }

  if (status === "in_progress")
  {
    return "Partially Complete";
  }

  if (status === "complete")
  {
    return "Complete";
  }

  return "Ready to Start";
}

function getStatusPriority(status)
{
  if (status === "active")
  {
    return 0;
  }

  if (status === "in_progress")
  {
    return 1;
  }

  if (status === "not_started")
  {
    return 2;
  }

  return 3;
}

function getStatusVisualStyle(status)
{
  if (status === "active")
  {
    return {
      border: "1px solid rgba(245,158,11,0.34)",
      background: "linear-gradient(180deg, rgba(245,158,11,0.14), rgba(255,255,255,0.04))",
      boxShadow: "0 0 0 1px rgba(245,158,11,0.12), 0 10px 24px rgba(0,0,0,0.12)",
      chipBackground: "rgba(245,158,11,0.2)",
    };
  }

  if (status === "in_progress")
  {
    return {
      border: "1px solid rgba(96,165,250,0.28)",
      background: "linear-gradient(180deg, rgba(59,130,246,0.1), rgba(255,255,255,0.03))",
      boxShadow: "0 10px 24px rgba(0,0,0,0.12)",
      chipBackground: "rgba(59,130,246,0.16)",
    };
  }

  if (status === "complete")
  {
    return {
      border: "1px solid rgba(148,163,184,0.16)",
      background: "linear-gradient(180deg, rgba(120,113,108,0.16), rgba(148,163,184,0.04))",
      boxShadow: "0 10px 24px rgba(0,0,0,0.08)",
      chipBackground: "rgba(120,113,108,0.22)",
      opacity: 0.72,
    };
  }

  return {
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.03)",
    boxShadow: "0 10px 24px rgba(0,0,0,0.12)",
    chipBackground: "rgba(255,255,255,0.08)",
  };
}

function getIslandCompletionPalette(islandName = "")
{
  return getWorldVisualPalette(islandName);
}

function getIslandCardVisualStyle(sheet, status)
{
  const baseStyle = getStatusVisualStyle(status);
  const palette = getIslandCompletionPalette(sheet?.island || "");
  const isLocked = Boolean(sheet?.isLocked);

  if (isLocked)
  {
    return {
      border: "1px solid rgba(148,163,184,0.16)",
      background: "linear-gradient(180deg, rgba(71,85,105,0.14), rgba(255,255,255,0.02))",
      boxShadow: "0 10px 24px rgba(0,0,0,0.1)",
      chipBackground: "rgba(100,116,139,0.16)",
      opacity: 0.68,
    };
  }

  if (status === "complete")
  {
    return {
      ...baseStyle,
      border: `1px solid ${palette.border}`,
      background: `linear-gradient(180deg, ${palette.wash}, rgba(255,255,255,0.045))`,
      boxShadow: `0 0 0 1px ${palette.accent}, 0 0 18px ${palette.glow}, 0 0 46px ${palette.glow}, 0 18px 36px rgba(0,0,0,0.18)`,
      chipBackground: `linear-gradient(180deg, ${palette.accent}, rgba(255,255,255,0.06))`,
      opacity: 1,
    };
  }

  const statusWashByState = {
    active: "rgba(255,255,255,0.02)",
    in_progress: "rgba(255,255,255,0.03)",
    not_started: "rgba(255,255,255,0.015)",
  };
  const statusEdgeByState = {
    active: "rgba(255,255,255,0.1)",
    in_progress: "rgba(255,255,255,0.08)",
    not_started: "rgba(255,255,255,0.06)",
  };

  return {
    border: `1px solid ${palette.border}`,
    background: `linear-gradient(180deg, ${palette.wash}, ${statusWashByState[status] || "rgba(255,255,255,0.02)"})`,
    boxShadow: `0 0 0 1px ${statusEdgeByState[status] || "rgba(255,255,255,0.06)"}, 0 0 16px ${palette.glow}, 0 0 38px ${palette.glow}, 0 16px 32px rgba(0,0,0,0.16)`,
    chipBackground: `linear-gradient(180deg, ${palette.accent}, rgba(255,255,255,0.06))`,
    opacity: 1,
  };
}

function getCollectionWorldGroupSortRank(groupKey)
{
  const order = {
    natural: 0,
    fire: 1,
    magical: 2,
    ethereal: 3,
    other: 4,
    mirror: 5,
  };

  return Number.isFinite(order[groupKey]) ? order[groupKey] : 99;
}

function getSheetSortPriority(sheet)
{
  const parsedPriority = Number(sheet.priority);

  return Number.isFinite(parsedPriority) ? parsedPriority : Number.MAX_SAFE_INTEGER;
}

function getSheetSortName(sheet)
{
  if (sheet.type === "island")
  {
    return sheet.island || sheet.sheetTitle || "";
  }

  return sheet.templateName || sheet.monsterName || sheet.displayName || sheet.sheetTitle || "";
}

function getSheetActivationOrderValue(sheet)
{
  return typeof sheet?.activatedAt === "string" ? sheet.activatedAt : "";
}

function compareSheetsByOperationalFallback(a, b)
{
  const priorityDelta = getSheetSortPriority(a) - getSheetSortPriority(b);

  if (priorityDelta !== 0)
  {
    return priorityDelta;
  }

  const nameComparison = getSheetSortName(a).localeCompare(getSheetSortName(b));

  if (nameComparison !== 0)
  {
    return nameComparison;
  }

  return Number(a.instanceNumber || 0) - Number(b.instanceNumber || 0);
}

function sortSheetsByOperationalOrder(a, b)
{
  const aStatus = getDerivedSheetStatus(a);
  const bStatus = getDerivedSheetStatus(b);
  const statusPriorityDelta = getStatusPriority(aStatus) - getStatusPriority(bStatus);

  if (statusPriorityDelta !== 0)
  {
    return statusPriorityDelta;
  }

  if (aStatus === "active")
  {
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
  }

  return compareSheetsByOperationalFallback(a, b);
}

function matchesStatusFilter(statusOrSheet, statusFilter)
{
  if (statusFilter === "all")
  {
    return true;
  }

  if (typeof statusOrSheet === "string")
  {
    return statusOrSheet === statusFilter;
  }

  return getDerivedSheetStatus(statusOrSheet) === statusFilter;
}

function getEmptyStateCopy(statusFilter)
{
  if (statusFilter === "active")
  {
    return "No active sheets right now.";
  }

  if (statusFilter === "in_progress")
  {
    return "Nothing in progress.";
  }

  if (statusFilter === "not_started")
  {
    return "No not-started sheets here.";
  }

  if (statusFilter === "complete")
  {
    return "No completed collections yet.";
  }

  return "Nothing to show here yet.";
}

function getVesselGroupKey(sheet)
{
  const collectionKey = sheet.collectionKey || "";

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

function getVesselGroupLabel(groupKey)
{
  if (groupKey === "amber")
  {
    return "Amber";
  }

  if (groupKey === "wublin")
  {
    return "Wublin";
  }

  if (groupKey === "celestial")
  {
    return "Celestial";
  }

  return "Other";
}

function getCollectionEntriesForFamily(familyKey, collectionsByKey)
{
  const normalizeEntries = (collectionKey) =>
  {
    const rawEntries = collectionsByKey.get(collectionKey)?.entries;

    return Array.isArray(rawEntries) ? rawEntries.filter(isValidCollectionEntry) : [];
  };

  if (familyKey === "amber")
  {
    return normalizeEntries("amber_island");
  }

  if (familyKey === "wublin")
  {
    return normalizeEntries("wublins");
  }

  if (familyKey === "celestial")
  {
    return normalizeEntries("celestials");
  }

  return [];
}

function getCollectionEntryRarityRank(entry)
{
  if (entry?.rarity === "common")
  {
    return 0;
  }

  if (entry?.rarity === "rare")
  {
    return 1;
  }

  if (entry?.rarity === "epic")
  {
    return 2;
  }

  return 3;
}

function getCollectionFamilyKey(collectionKey)
{
  if (collectionKey === "amber_island")
  {
    return "amber";
  }

  if (collectionKey === "wublins")
  {
    return "wublin";
  }

  if (collectionKey === "celestials")
  {
    return "celestial";
  }

  return "other";
}

function getCollectionEntryMatchingSheets(entry, familySheets)
{
  return familySheets.filter((sheet) =>
  {
    const candidateName =
      sheet.templateName || sheet.monsterName || sheet.displayName || sheet.sheetTitle || "";

    return candidateName === entry.name;
  });
}

function compareCollectionEntryGroups(a, b)
{
  const statusPriorityDelta =
    getStatusPriority(getCollectionEntryStatus(a.entry, a.instances))
    - getStatusPriority(getCollectionEntryStatus(b.entry, b.instances));

  if (statusPriorityDelta !== 0)
  {
    return statusPriorityDelta;
  }

  const rarityDelta = getCollectionEntryRarityRank(a.entry) - getCollectionEntryRarityRank(b.entry);

  if (rarityDelta !== 0)
  {
    return rarityDelta;
  }

  return (a.entry?.name || "").localeCompare(b.entry?.name || "");
}

function getVesselTemplateProgress(instances)
{
  const totals = instances.reduce(
    (summary, sheet) =>
    {
      const progress = getSheetProgressState(sheet);
      const sheetStatus = getDerivedSheetStatus(sheet);

      return {
        required: summary.required + progress.total,
        done: summary.done + progress.done,
        tracked: summary.tracked + progress.tracked,
        activeCount: summary.activeCount + (sheetStatus === "active" ? 1 : 0),
        inProgressCount: summary.inProgressCount + (sheetStatus === "in_progress" ? 1 : 0),
        completeCount: summary.completeCount + (sheetStatus === "complete" ? 1 : 0),
      };
    },
    {
      required: 0,
      done: 0,
      tracked: 0,
      activeCount: 0,
      inProgressCount: 0,
      completeCount: 0,
    }
  );

  return {
    instanceCount: instances.length,
    activeCount: totals.activeCount,
    inProgressCount: totals.inProgressCount,
    completeCount: totals.completeCount,
    progress: {
      done: totals.done,
      total: totals.required,
      percent: totals.required ? Math.round((totals.done / totals.required) * 100) : 0,
      trackedPercent: totals.required ? Math.round((totals.tracked / totals.required) * 100) : 0,
    },
    hasCompletedInstance: totals.completeCount > 0,
  };
}

function getVisibleTemplateInstanceLabel(sheet, visibleInstances)
{
  const baseName = sheet.templateName || sheet.monsterName || sheet.displayName || sheet.sheetTitle || "";

  if (!Array.isArray(visibleInstances) || visibleInstances.length <= 1)
  {
    return baseName;
  }

  return `${baseName} #${Number(sheet.instanceNumber || 1)}`;
}

function renderSectionHeader({
  title,
  subtitle,
  count,
})
{
  return (
    <div
      style={{
        display: "grid",
        gap: "6px",
        textAlign: "left",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: "10px",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div style={{ fontSize: "13px", opacity: 0.68, letterSpacing: "0.08em" }}>
          {`${title.toUpperCase()} (${count})`}
        </div>
      </div>
      {subtitle && (
        <div style={{ fontSize: "13px", opacity: 0.64 }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}

function VesselSheetCard({
  sheet,
  onOpenSheet,
  onCreateAnotherSheetInstance,
})
{
  const progress = getSheetProgressState(sheet);
  const status = getDerivedSheetStatus(sheet);
  const visualStyle = getStatusVisualStyle(status);

  return (
    <div
      key={sheet.key}
      style={{
        border: visualStyle.border,
        borderRadius: "16px",
        padding: "16px",
        background: visualStyle.background,
        boxShadow: visualStyle.boxShadow,
        opacity: visualStyle.opacity ?? 1,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "12px",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ fontSize: "22px", fontWeight: 700 }}>
            {sheet.monsterName}
          </div>
          <div style={{ marginTop: "4px", fontSize: "13px", opacity: 0.72 }}>
            {sheet.collectionName}
          </div>
          <div style={{ marginTop: "4px", fontSize: "13px", opacity: 0.72 }}>
            {sheet.sheetTitle}
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          <div
            style={{
              display: "inline-flex",
              padding: "6px 10px",
              borderRadius: "999px",
              border: "1px solid rgba(255,255,255,0.1)",
              background: visualStyle.chipBackground,
              fontSize: "12px",
              fontWeight: 700,
              marginBottom: "8px",
            }}
          >
            {getStatusLabel(status)}
          </div>
          <div style={{ fontSize: "14px", fontWeight: 700 }}>
            {progress.done} / {progress.total}
          </div>
          <div style={{ marginTop: "4px", fontSize: "13px", opacity: 0.72 }}>
            {progress.percent}% complete
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: "12px",
          display: "flex",
          justifyContent: "space-between",
          gap: "10px",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <div style={{ fontSize: "13px", opacity: 0.72 }}>
          {progress.trackedPercent}% tracked
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {sheet.supportsMultipleInstances && (
            <button
              style={actionButtonStyle}
              onClick={() => onCreateAnotherSheetInstance?.(sheet.key)}
            >
              Create New Instance
            </button>
          )}

          <button
            style={actionButtonStyle}
            onClick={() => onOpenSheet(sheet.key)}
          >
            Open
          </button>
        </div>
      </div>
    </div>
  );
}

function VesselTemplateCard({
  collectionKey,
  entry,
  instances,
  onOpenSheet,
  onCreateAnotherSheetInstance,
  onDeleteSheetInstance,
  getDeleteInstanceBlockState,
  onUpdateCollectionEntryStatus,
})
{
  const sortedInstances = [...instances].sort(sortSheetsByOperationalOrder);
  const primaryInstance = sortedInstances[0] || null;
  const activeInstance = sortedInstances.find((sheet) => sheet.isActive) || null;
  const totals = getVesselTemplateProgress(sortedInstances);
  const familyKey = getCollectionFamilyKey(collectionKey);
  const familyLabel = getVesselGroupLabel(familyKey);
  const status = getCollectionEntryStatus(entry, sortedInstances);
  const visualStyle = getStatusVisualStyle(status);
  const statusSummaryParts = [];
  const progressDone = sortedInstances.length > 0 ? totals.progress.done : status === "complete" ? 1 : 0;
  const progressTotal = sortedInstances.length > 0 ? totals.progress.total : 1;
  const progressPercent = sortedInstances.length > 0 ? totals.progress.percent : status === "complete" ? 100 : 0;
  const trackedPercent = sortedInstances.length > 0 ? totals.progress.trackedPercent : status === "in_progress" ? 100 : 0;
  const rarityLabel = entry?.rarity === "common"
    ? "collection entry"
    : `${entry?.rarity || "special"} collection entry`;

  if (status === "complete")
  {
    statusSummaryParts.push("collection unlocked");
  }

  if (sortedInstances.length > 0)
  {
    statusSummaryParts.push(`${totals.instanceCount} tracked run${totals.instanceCount === 1 ? "" : "s"}`);
  }
  else
  {
    statusSummaryParts.push("no tracked runs yet");
  }

  if (totals.activeCount > 0)
  {
    statusSummaryParts.push(`${totals.activeCount} active`);
  }

  if (totals.inProgressCount > 0)
  {
    statusSummaryParts.push(`${totals.inProgressCount} partially complete`);
  }

  if (totals.completeCount > 0)
  {
    statusSummaryParts.push(`${totals.completeCount} completed run${totals.completeCount === 1 ? "" : "s"}`);
  }

  return (
    <div
      key={`${collectionKey}:${entry.name}`}
      style={{
        border: visualStyle.border,
        borderRadius: "16px",
        padding: "16px",
        background: visualStyle.background,
        boxShadow: visualStyle.boxShadow,
        opacity: visualStyle.opacity ?? 1,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "12px",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ fontSize: "22px", fontWeight: 700 }}>
            {entry.name}
          </div>
          <div style={{ marginTop: "4px", fontSize: "13px", opacity: 0.72 }}>
            {familyLabel} · {rarityLabel}
          </div>
          <div style={{ marginTop: "4px", fontSize: "13px", opacity: 0.72 }}>
            {statusSummaryParts.join(" · ")}
          </div>
          <div style={{ marginTop: "4px", fontSize: "13px", opacity: 0.72 }}>
            {Number(primaryInstance?.timeLimitDays || 0) > 0
              ? `${primaryInstance.timeLimitDays}d limit`
              : "No time limit data"}
            {Number(primaryInstance?.totalEggs || 0) > 0 ? ` · ${primaryInstance.totalEggs} eggs` : ""}
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          <div
            style={{
              display: "inline-flex",
              padding: "6px 10px",
              borderRadius: "999px",
              border: "1px solid rgba(255,255,255,0.1)",
              background: visualStyle.chipBackground,
              fontSize: "12px",
              fontWeight: 700,
              marginBottom: "8px",
            }}
          >
            {getStatusLabel(status)}
          </div>
          <div style={{ fontSize: "14px", fontWeight: 700 }}>
            {progressDone} / {progressTotal}
          </div>
          <div style={{ marginTop: "4px", fontSize: "13px", opacity: 0.72 }}>
            {progressPercent}% complete
          </div>
        </div>
      </div>

      {sortedInstances.length > 0 && (
        <div
          style={{
            marginTop: "12px",
            display: "grid",
            gap: "8px",
          }}
        >
          {sortedInstances.map((sheet) =>
          {
            const instanceStatus = getDerivedSheetStatus(sheet);
            const instanceProgress = getSheetProgressState(sheet);
            const instanceVisualStyle = getStatusVisualStyle(instanceStatus);
            const instanceLabel = getVisibleTemplateInstanceLabel(sheet, sortedInstances);
            const deleteBlockState = getDeleteInstanceBlockState?.(sheet.key) || {
              kind: "",
              reason: "",
            };
            const deleteBlockReason = deleteBlockState.reason || "";
            const canDelete = !deleteBlockReason;
            const shouldShowDeleteWarning = deleteBlockReason
              && deleteBlockState.kind !== "last_instance"
              && deleteBlockState.kind !== "active";

            return (
              <div
                key={sheet.key}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "12px",
                  alignItems: "center",
                  flexWrap: "wrap",
                  padding: "10px 12px",
                  borderRadius: "14px",
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.04)",
                }}
              >
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 700 }}>
                    {instanceLabel}
                  </div>
                  <div style={{ marginTop: "4px", fontSize: "12px", opacity: 0.7 }}>
                    {getStatusLabel(instanceStatus)} · {instanceProgress.done} / {instanceProgress.total} · {instanceProgress.percent}% complete
                  </div>
                  {shouldShowDeleteWarning && (
                    <div style={{ marginTop: "4px", fontSize: "12px", opacity: 0.72, color: "rgba(252,165,165,0.95)" }}>
                      Delete blocked: {deleteBlockReason}
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                  <div
                    style={{
                      display: "inline-flex",
                      padding: "5px 9px",
                      borderRadius: "999px",
                      border: "1px solid rgba(255,255,255,0.08)",
                      background: instanceVisualStyle.chipBackground,
                      fontSize: "11px",
                      fontWeight: 700,
                    }}
                    title={instanceStatus === "active"
                      ? "This run is already driving operational work."
                      : "This run stays tracked as part of the collection catalog."}
                  >
                    {instanceStatus === "not_started" ? "Tracked" : getStatusLabel(instanceStatus)}
                  </div>

                  <button
                    style={compactActionButtonStyle}
                    onClick={() => onOpenSheet(sheet.key)}
                  >
                    Open
                  </button>

                  <button
                    style={{
                      ...compactDangerButtonStyle,
                      opacity: canDelete ? 1 : 0.5,
                      cursor: canDelete ? "pointer" : "not-allowed",
                    }}
                    onClick={() => onDeleteSheetInstance?.(sheet.key)}
                    disabled={!canDelete}
                    title={deleteBlockReason || "Delete this tracked instance"}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div
        style={{
          marginTop: "12px",
          display: "flex",
          justifyContent: "space-between",
          gap: "10px",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <div style={{ fontSize: "13px", opacity: 0.72 }}>
          {sortedInstances.length > 0
            ? `${trackedPercent}% tracked across all current runs`
            : status === "complete"
              ? "Collected in your tracker"
              : status === "in_progress"
                ? "Marked partially complete"
                : "Collection entry not started yet"}
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {activeInstance ? (
            <button
              style={{
                ...actionButtonStyle,
                background: "rgba(245,158,11,0.18)",
                border: "1px solid rgba(245,158,11,0.22)",
              }}
              onClick={() => onOpenSheet(activeInstance.key)}
            >
              Open Active
            </button>
          ) : primaryInstance ? (
            <button
              style={actionButtonStyle}
              onClick={() => onOpenSheet(primaryInstance.key)}
            >
              Open Run
            </button>
          ) : null}

          {primaryInstance && (
            <button
              style={actionButtonStyle}
              onClick={() => onCreateAnotherSheetInstance?.(primaryInstance.key)}
            >
              {totals.hasCompletedInstance ? "Create New Run" : "Create Another Run"}
            </button>
          )}

          {status !== "complete" && (
            <button
              style={{
                ...actionButtonStyle,
                background: "rgba(34,197,94,0.16)",
                border: "1px solid rgba(34,197,94,0.18)",
              }}
              onClick={() => onUpdateCollectionEntryStatus?.(collectionKey, entry.name, "complete")}
            >
              Mark Collected
            </button>
          )}

          {status !== "in_progress" && status !== "complete" && (
            <button
              style={actionButtonStyle}
              onClick={() => onUpdateCollectionEntryStatus?.(collectionKey, entry.name, "in_progress")}
            >
              Mark Partial
            </button>
          )}

          {status !== "not_started" && (
            <button
              style={actionButtonStyle}
              onClick={() => onUpdateCollectionEntryStatus?.(collectionKey, entry.name, "not_started")}
            >
              Clear Status
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function IslandSheetCard({
  sheet,
  onOpenSheet,
})
{
  const progress = getSheetProgressState(sheet);
  const status = getDerivedSheetStatus(sheet);
  const visualStyle = getIslandCardVisualStyle(sheet, status);

  return (
    <div
      key={sheet.key}
      style={{
        border: visualStyle.border,
        borderRadius: "16px",
        padding: "16px",
        background: visualStyle.background,
        boxShadow: visualStyle.boxShadow,
        opacity: visualStyle.opacity ?? 1,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "12px",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ fontSize: "22px", fontWeight: 700 }}>{sheet.island}</div>
          <div style={{ marginTop: "4px", fontSize: "13px", opacity: 0.72 }}>
            {progress.done} / {progress.total} collected
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          <div
            style={{
              display: "inline-flex",
              padding: "6px 10px",
              borderRadius: "999px",
              border: "1px solid rgba(255,255,255,0.1)",
              background: visualStyle.chipBackground,
              fontSize: "12px",
              fontWeight: 700,
              marginBottom: "8px",
            }}
          >
            {getStatusLabel(status)}
          </div>
          <div style={{ fontSize: "14px", fontWeight: 700 }}>
            {progress.percent}% complete
          </div>
          <div style={{ marginTop: "4px", fontSize: "13px", opacity: 0.72 }}>
            {progress.trackedPercent}% tracked
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: "12px",
          display: "flex",
          justifyContent: "space-between",
          gap: "10px",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <div style={{ fontSize: "13px", opacity: 0.72 }}>
          {sheet.isActive ? "Currently driving operational work" : "Collection sheet stays tracked here"}
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button
            style={actionButtonStyle}
            onClick={() => onOpenSheet(sheet.key)}
          >
            Open
          </button>
        </div>
      </div>
    </div>
  );
}

function CollectionWorldCard({
  world,
  onOpenWorld,
  onOpenSheet,
})
{
  const visualStyle = getIslandCardVisualStyle(
    { island: world.name || world.title, isLocked: world.isLocked },
    world.status
  );
  const worldArt = COLLECTION_WORLD_ART[world.title] || null;
  const pinScale = worldArt?.pinScale || 1.28;

  const primaryAction = world.kind === "island"
    ? () => onOpenSheet(world.sheetKey)
    : () => onOpenWorld(world.key);
  const isClickable = true;
  const showCenteredWorldArt = Boolean(worldArt?.pin);
  const statusLabel = world.isLocked
    ? "Locked"
    : world.status === "complete"
      ? "Complete"
      : "Active";

  return (
    <div
      style={{
        border: visualStyle.border,
        borderRadius: "18px",
        padding: "18px",
        background: visualStyle.background,
        boxShadow: visualStyle.boxShadow,
        opacity: visualStyle.opacity ?? 1,
        minHeight: "292px",
        display: "grid",
        gridTemplateRows: "auto auto auto 1fr auto",
        gap: "12px",
        position: "relative",
        overflow: "hidden",
        cursor: isClickable ? "pointer" : "default",
        transition: "transform 140ms ease, box-shadow 140ms ease, border-color 140ms ease",
        textAlign: "left",
      }}
      onClick={isClickable ? primaryAction : undefined}
      onKeyDown={isClickable
        ? (event) =>
        {
          if (event.key === "Enter" || event.key === " ")
          {
            event.preventDefault();
            primaryAction();
          }
        }
        : undefined}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
    >
      <div
        style={{
          display: "grid",
          gap: "6px",
          alignContent: "start",
        }}
      >
        <div style={{ fontSize: "26px", fontWeight: 800, lineHeight: 1.02 }}>
          {world.title}
        </div>
        <div style={{ fontSize: "14px", opacity: 0.76, lineHeight: 1.4 }}>
          {world.subtitle}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "12px",
          alignItems: "start",
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            display: "grid",
            gap: "4px",
            minWidth: "110px",
          }}
        >
          <div style={{ fontSize: "30px", fontWeight: 800, lineHeight: 1 }}>
            {world.summaryValue}
          </div>
          <div style={{ fontSize: "14px", opacity: 0.76 }}>
            {world.summaryLabel}
          </div>
        </div>

        <div
          style={{
            display: "grid",
            alignContent: "start",
            justifyItems: "end",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              padding: "6px 10px",
              borderRadius: "999px",
              border: "1px solid rgba(255,255,255,0.1)",
              background: visualStyle.chipBackground,
              fontSize: "13px",
              fontWeight: 700,
            }}
          >
            {statusLabel}
          </div>
        </div>
      </div>

      <div
        style={{
          display: showCenteredWorldArt ? "flex" : "none",
          justifyContent: "center",
          alignItems: "center",
          minHeight: showCenteredWorldArt ? "124px" : "0",
        }}
      >
        {showCenteredWorldArt && (
          <div
            style={{
              width: "160px",
              height: "160px",
              borderRadius: "999px",
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.12)",
              display: "grid",
              placeItems: "center",
              boxShadow: "0 10px 24px rgba(0,0,0,0.14)",
              backdropFilter: "blur(6px)",
              flexShrink: 0,
            }}
          >
            <img
              src={worldArt.pin}
              alt={`${world.title} pin`}
              style={{
                width: "112px",
                height: "112px",
                objectFit: "contain",
                transform: `scale(${pinScale})`,
                transformOrigin: "center",
              }}
            />
          </div>
        )}
      </div>

      <div
        style={{
          display: "grid",
          gap: "10px",
          alignContent: "end",
        }}
      >
        <div
          style={{
            fontSize: "14px",
            opacity: 0.76,
            minHeight: "36px",
            display: "grid",
            alignContent: "center",
            textAlign: "left",
          }}
        >
          {world.supportingCopy}
        </div>
        <div
          style={{
            fontSize: "13px",
            fontWeight: 700,
            opacity: 0.68,
            textAlign: "center",
            justifySelf: "center",
          }}
        >
          {world.isLocked ? "Tap to preview" : "Tap to open"}
        </div>
      </div>
    </div>
  );
}

export default function Collections({
  sheets,
  collectionsData,
  islandStates,
  initialWorldKey = "",
  onClearInitialWorldKey,
  onOpenCollectionWorld,
  onOpenSheet,
  onCreateAnotherSheetInstance,
  onDeleteSheetInstance,
  getDeleteInstanceBlockState,
  onUpdateCollectionEntryStatus,
})
{
  const [statusFilter, setStatusFilter] = useState("all");
  const [showScrollTop, setShowScrollTop] = useState(false);
  const safeSheets = Array.isArray(sheets) ? sheets.filter(Boolean) : [];
  const safeCollectionsData = Array.isArray(collectionsData) && collectionsData.length > 0
    ? collectionsData.filter((collection) => collection && typeof collection === "object")
    : COLLECTIONS.filter((collection) => collection && typeof collection === "object");

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

  function handleScrollToTop()
  {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  const vesselSheets = useMemo(
    () => safeSheets.filter((sheet) => (sheet.type || "vessel") === "vessel"),
    [safeSheets]
  );
  const islandSheets = useMemo(
    () => safeSheets.filter((sheet) => sheet.type === "island"),
    [safeSheets]
  );

  const collectionsByKey = useMemo(
    () => new Map(safeCollectionsData.map((collection) => [collection.key, collection])),
    [safeCollectionsData]
  );

  const vesselGroups = useMemo(() =>
  {
    const grouped = {
      amber: [],
      wublin: [],
      celestial: [],
      other: [],
    };

    vesselSheets.forEach((sheet) =>
    {
      grouped[getVesselGroupKey(sheet)].push(sheet);
    });

    return grouped;
  }, [vesselSheets]);

  const vesselCollectionEntryGroups = useMemo(() =>
  {
    return {
      amber: getCollectionEntriesForFamily("amber", collectionsByKey)
        .map((entry) => ({
          entry,
          instances: getCollectionEntryMatchingSheets(entry, vesselGroups.amber),
        }))
        .filter(({ entry, instances }) => matchesStatusFilter(getCollectionEntryStatus(entry, instances), statusFilter))
        .sort(compareCollectionEntryGroups),
      wublin: getCollectionEntriesForFamily("wublin", collectionsByKey)
        .map((entry) => ({
          entry,
          instances: getCollectionEntryMatchingSheets(entry, vesselGroups.wublin),
        }))
        .filter(({ entry, instances }) => matchesStatusFilter(getCollectionEntryStatus(entry, instances), statusFilter))
        .sort(compareCollectionEntryGroups),
      celestial: getCollectionEntriesForFamily("celestial", collectionsByKey)
        .map((entry) => ({
          entry,
          instances: getCollectionEntryMatchingSheets(entry, vesselGroups.celestial),
        }))
        .filter(({ entry, instances }) => matchesStatusFilter(getCollectionEntryStatus(entry, instances), statusFilter))
        .sort(compareCollectionEntryGroups),
      other: [],
    };
  }, [collectionsByKey, statusFilter, vesselGroups]);
  const islandGroupByName = useMemo(
    () => new Map(ISLAND_STATE_DEFAULTS.map((island) => [island.name, island.group || "other"])),
    []
  );
  const islandProfileByName = useMemo(
    () => new Map(ISLAND_STATE_DEFAULTS.map((island) => [island.name, island])),
    []
  );
  const islandStateByName = useMemo(
    () => new Map(
      (Array.isArray(islandStates) ? islandStates : [])
        .filter((island) => island && typeof island === "object" && island.name)
        .map((island) => [island.name, island])
    ),
    [islandStates]
  );
  const islandGroupLabelByKey = useMemo(
    () => new Map(ISLAND_GROUPS.map((group) => [group.key, group.label])),
    []
  );

  const specialWorlds = useMemo(() =>
  {
    const buildWorld = ({
      key,
      familyKey,
      collectionKey,
      title,
      subtitle,
      chips,
      sectionKey,
      sectionTitle,
    }) =>
    {
      const groups = vesselCollectionEntryGroups[familyKey] || [];

      if (groups.length === 0)
      {
        return null;
      }

      const statuses = groups.map(({ entry, instances }) => getCollectionEntryStatus(entry, instances));
      const completeCount = statuses.filter((status) => status === "complete").length;
      const trackedCount = statuses.filter((status) => status !== "not_started").length;
      const activeCount = statuses.filter((status) => status === "active").length;
      const inProgressCount = statuses.filter((status) => status === "in_progress").length;
      const worldStatus = activeCount > 0
        ? "active"
        : inProgressCount > 0
          ? "in_progress"
          : completeCount === groups.length
            ? "complete"
            : "not_started";

      if (!matchesStatusFilter(worldStatus, statusFilter))
      {
        return null;
      }

      return {
        key,
        kind: "special",
        familyKey,
        collectionKey,
        title,
        subtitle,
        chips,
        sectionKey,
        sectionTitle,
        status: worldStatus,
        isLocked: islandStateByName.get(title)?.isUnlocked === false,
        count: groups.length,
        summaryValue: `${completeCount} / ${groups.length}`,
        summaryLabel: "species complete",
        supportingCopy: trackedCount > 0
          ? `${trackedCount} species tracked across this world.`
          : "No tracked species here yet.",
        cards: groups.map(({ entry, instances }) => (
          <VesselTemplateCard
            key={`${familyKey}:${entry.name}`}
            collectionKey={collectionKey}
            entry={entry}
            instances={instances}
            onOpenSheet={onOpenSheet}
            onCreateAnotherSheetInstance={onCreateAnotherSheetInstance}
            onDeleteSheetInstance={onDeleteSheetInstance}
            getDeleteInstanceBlockState={getDeleteInstanceBlockState}
            onUpdateCollectionEntryStatus={onUpdateCollectionEntryStatus}
          />
        )),
      };
    };

    return [
      buildWorld({
        key: "amber_island",
        familyKey: "amber",
        collectionKey: "amber_island",
        title: "Amber Island",
        subtitle: "Relic-fueled vessel collection with tracked runs nested under each monster.",
        chips: ["Vessels", "Relics", "Limited"],
        sectionKey: "special",
        sectionTitle: "Special Islands",
      }),
      buildWorld({
        key: "wublin_island",
        familyKey: "wublin",
        collectionKey: "wublins",
        title: "Wublin Island",
        subtitle: "Nested Wublin collection runs with statue-first progress and variants together.",
        chips: ["Zap", "Statues", "Timed"],
        sectionKey: "special",
        sectionTitle: "Special Islands",
      }),
      buildWorld({
        key: "celestial_island",
        familyKey: "celestial",
        collectionKey: "celestials",
        title: "Celestial Island",
        subtitle: "Celestial revival collection space with its own special progression flow.",
        chips: ["Zap", "Monthly", "Celestials"],
        sectionKey: "special",
        sectionTitle: "Special Islands",
      }),
    ].filter(Boolean);
  }, [
    getDeleteInstanceBlockState,
    onCreateAnotherSheetInstance,
    onDeleteSheetInstance,
    onOpenSheet,
    onUpdateCollectionEntryStatus,
    statusFilter,
    vesselCollectionEntryGroups,
  ]);

  const collectionWorldSections = useMemo(() =>
  {
    const islandWorlds = islandSheets
      .sort((a, b) =>
      {
        const aLocked = islandStateByName.get(a.island)?.isUnlocked === false;
        const bLocked = islandStateByName.get(b.island)?.isUnlocked === false;

        if (aLocked !== bLocked)
        {
          return aLocked ? 1 : -1;
        }

        const groupDelta =
          getCollectionWorldGroupSortRank(islandGroupByName.get(a.island))
          - getCollectionWorldGroupSortRank(islandGroupByName.get(b.island));

        if (groupDelta !== 0)
        {
          return groupDelta;
        }

        return compareSheetsByOperationalFallback(a, b);
      })
      .map((sheet) =>
      {
        const progress = getSheetProgressState(sheet);
        const groupKey = islandGroupByName.get(sheet.island) || "other";
        const groupLabel = islandGroupLabelByKey.get(groupKey) || "Other";
        const islandProfile = islandProfileByName.get(sheet.island);
        const islandState = islandStateByName.get(sheet.island);
        const isLocked = islandState?.isUnlocked === false;
        const islandWorldStatus = isLocked
          ? "not_started"
          : progress.total > 0 && progress.done >= progress.total
            ? "complete"
            : "active";
        const chips = [
          groupLabel,
          ...(sheet.island?.includes("Mirror") ? ["Mirror"] : []),
          ...((sheet.island === "Seasonal Shanty") ? ["Seasonal"] : []),
          "Checklist",
        ].filter(Boolean);

        return {
          key: `island:${sheet.key}`,
          kind: "island",
          sheetKey: sheet.key,
          name: sheet.island,
          title: sheet.island,
          subtitle: `${groupLabel} collection world with its own checklist-first sheet.`,
          chips,
          sectionKey: "worlds",
          sectionTitle: "Collection Worlds",
          status: islandWorldStatus,
          isLocked,
          summaryValue: `${progress.done} / ${progress.total}`,
          summaryLabel: "collected",
          supportingCopy: isLocked
            ? "Unlock this island in Island Manager to start tracking it here."
            : `${progress.trackedPercent}% tracked across the standing collection sheet.`,
        };
      })
      .filter((world) => matchesStatusFilter(world.status, statusFilter));

    const groupedSections = [
      {
        key: "worlds",
        title: "Collection Worlds",
        subtitle: "Browse the islands and worlds you actually collect for, not just how the tracker was built.",
        worlds: [...islandWorlds, ...specialWorlds.filter((world) => world.sectionKey === "worlds")],
      },
      {
        key: "special",
        title: "Special Islands",
        subtitle: "Dedicated collection worlds with their own nested mechanics and tracking rules.",
        worlds: specialWorlds.filter((world) => world.sectionKey === "special"),
      },
    ].filter((section) => section.worlds.length > 0);

    return groupedSections;
  }, [
    islandGroupByName,
    islandGroupLabelByKey,
    islandProfileByName,
    islandStateByName,
    islandSheets,
    specialWorlds,
    statusFilter,
  ]);

  const allCollectionWorlds = useMemo(
    () => collectionWorldSections.flatMap((section) => section.worlds),
    [collectionWorldSections]
  );

  const selectedWorld = useMemo(
    () => allCollectionWorlds.find((world) => world.key === initialWorldKey) || null,
    [allCollectionWorlds, initialWorldKey]
  );

  return (
    <div className="page-surface">
      <div className="responsive-page-card" style={pageCardStyle}>
        <div
          style={{
            display: "grid",
            gap: "16px",
            justifyItems: "center",
          }}
        >
          <div
            style={{
              display: "grid",
              gap: "8px",
              textAlign: "center",
              maxWidth: selectedWorld ? "760px" : "860px",
              width: "100%",
              justifyItems: "center",
            }}
          >
            {selectedWorld && (
              <button
                style={{ ...actionButtonStyle, width: "fit-content", justifySelf: "center" }}
                onClick={() =>
                {
                  onClearInitialWorldKey?.();
                }}
              >
                Back to Collection Worlds
              </button>
            )}

            <div style={{ fontSize: "32px", fontWeight: 800, letterSpacing: "-0.02em" }}>
              {selectedWorld ? selectedWorld.title : "Collections"}
            </div>
            <div style={{ opacity: 0.75, maxWidth: "860px", lineHeight: 1.45 }}>
              {selectedWorld
                ? selectedWorld.subtitle
                : "Browse by collection world first, then jump into the mechanic-heavy surfaces that need their own nested views."}
            </div>
          </div>

        </div>

        {selectedWorld && COLLECTION_WORLD_ART[selectedWorld.title]?.icon && (
          <div
            style={{
              marginTop: "4px",
              width: "78px",
              height: "78px",
              borderRadius: "22px",
              border: "1px solid rgba(255,255,255,0.1)",
              background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.18), rgba(255,255,255,0.04))",
              display: "grid",
              placeItems: "center",
              boxShadow: "0 14px 28px rgba(0,0,0,0.18)",
              justifySelf: "center",
            }}
          >
            <img
              src={COLLECTION_WORLD_ART[selectedWorld.title].icon}
              alt={`${selectedWorld.title} icon`}
              style={{
                width: "58px",
                height: "58px",
                objectFit: "contain",
              }}
            />
          </div>
        )}

        <div className="collections-filter-stack">
          <div>
            <div className="collections-filter-label">Status</div>
            <div className="collections-mobile-filter" style={{ marginTop: "8px" }}>
              <select
                style={filterSelectStyle}
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                {STATUS_FILTER_OPTIONS.map((filter) => (
                  <option key={`status-select-${filter.key}`} value={filter.key}>
                    {filter.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="screen-card-actions collections-filter-options" style={{ marginTop: "8px", gap: "8px" }}>
              {STATUS_FILTER_OPTIONS.map((filter) => (
                <button
                  key={filter.key}
                  style={{
                    ...filterButtonStyle,
                    background: statusFilter === filter.key
                      ? "rgba(255,255,255,0.18)"
                      : filterButtonStyle.background,
                  }}
                  onClick={() => setStatusFilter(filter.key)}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ fontSize: "13px", opacity: 0.64, textAlign: "left" }}>
            {selectedWorld
              ? "Species stay collection-first here, while duplicate tracked runs remain nested underneath when that world needs them."
              : "Standard islands jump into their checklist sheet. Special worlds like Amber and Wublin stay here with their own nested interfaces."}
          </div>
        </div>
      </div>

      {showScrollTop && (
        <button
          className="page-scroll-top"
          style={{
            ...compactActionButtonStyle,
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

      {selectedWorld ? (
        <div style={{ display: "grid", gap: "16px" }}>
          {!selectedWorld.cards || selectedWorld.cards.length === 0 ? (
            <div className="responsive-section-card" style={sectionCardStyle}>
              <div style={{ opacity: 0.68 }}>
                {getEmptyStateCopy(statusFilter)}
              </div>
            </div>
          ) : (
            <div className="responsive-section-card" style={sectionCardStyle}>
              {renderSectionHeader({
                title: selectedWorld.title,
                subtitle: selectedWorld.supportingCopy,
                count: selectedWorld.count,
              })}

              <div className="collections-card-grid" style={{ marginTop: "12px" }}>
                {selectedWorld.cards}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: "grid", gap: "16px" }}>
          {collectionWorldSections.length === 0 ? (
            <div className="responsive-section-card" style={sectionCardStyle}>
              <div style={{ opacity: 0.68 }}>
                {getEmptyStateCopy(statusFilter)}
              </div>
            </div>
          ) : (
            collectionWorldSections.map((section) => (
              <div key={section.key} className="responsive-section-card" style={sectionCardStyle}>
                {renderSectionHeader({
                  title: section.title,
                  subtitle: section.subtitle,
                  count: section.worlds.length,
                })}

                <div className="collection-world-grid" style={{ marginTop: "12px" }}>
                  {section.worlds.map((world) => (
                    <CollectionWorldCard
                      key={world.key}
                      world={world}
                      onOpenWorld={onOpenCollectionWorld}
                      onOpenSheet={onOpenSheet}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
