import React, { useEffect, useMemo, useState } from "react";
import { ISLAND_GROUPS, ISLAND_STATE_DEFAULTS } from "../data/islands";
import { COLLECTIONS } from "../data/collections";

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

function getSheetProgress(sheet)
{
  const total = sheet.monsters.reduce((sum, monster) => sum + Number(monster.required || 0), 0);
  const done = sheet.monsters.reduce((sum, monster) => sum + Number(monster.zapped || 0), 0);

  return {
    done,
    total,
    percent: total ? Math.round((done / total) * 100) : 0,
  };
}

function getSheetState(sheet)
{
  const progress = getSheetProgress(sheet);
  const tracked = sheet.monsters.reduce(
    (sum, monster) => sum + Number(monster.zapped || 0) + Number(monster.breeding || 0),
    0
  );

  return {
    ...progress,
    tracked,
    trackedPercent: progress.total ? Math.round((tracked / progress.total) * 100) : 0,
    complete: progress.total > 0 && progress.done >= progress.total,
  };
}

function getDerivedSheetStatus(sheet)
{
  const progress = getSheetState(sheet);

  if (sheet.isActive)
  {
    return "active";
  }

  if (progress.complete || sheet.isCollected)
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
  if (familyKey === "amber")
  {
    return collectionsByKey.get("amber_island")?.entries || [];
  }

  if (familyKey === "wublin")
  {
    return collectionsByKey.get("wublins")?.entries || [];
  }

  if (familyKey === "celestial")
  {
    return collectionsByKey.get("celestials")?.entries || [];
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

function canActivateSheet(sheet)
{
  const status = getDerivedSheetStatus(sheet);

  return status !== "complete" && !sheet.isActive;
}

function getActivationButtonLabel(sheet)
{
  if (sheet.isActive)
  {
    return "Deactivate";
  }

  return getDerivedSheetStatus(sheet) === "in_progress" ? "Activate Run" : "Activate";
}

function getVesselTemplateProgress(instances)
{
  const totals = instances.reduce(
    (summary, sheet) =>
    {
      const progress = getSheetState(sheet);
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

function getCollectionEntryStatus(entry, instances)
{
  if (entry?.collected)
  {
    return "complete";
  }

  if (instances.some((sheet) => sheet.isCollected || getSheetState(sheet).complete))
  {
    return "complete";
  }

  if (instances.some((sheet) => sheet.isActive))
  {
    return "active";
  }

  if (
    entry?.status === "in_progress"
    || entry?.status === "partial"
    || entry?.status === "partially_complete"
    || instances.some((sheet) =>
    {
      const progress = getSheetState(sheet);

      return progress.done > 0 || progress.tracked > 0;
    })
  )
  {
    return "in_progress";
  }

  return "not_started";
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
  onToggleSheetActive,
})
{
  const progress = getSheetState(sheet);
  const status = getDerivedSheetStatus(sheet);
  const visualStyle = getStatusVisualStyle(status);
  const showActivationButton = status !== "complete";

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
          {showActivationButton && (
            <button
              style={{
                ...actionButtonStyle,
                background: sheet.isActive ? "rgba(245,158,11,0.18)" : "rgba(34,197,94,0.16)",
                border: sheet.isActive
                  ? "1px solid rgba(245,158,11,0.22)"
                  : "1px solid rgba(34,197,94,0.18)",
              }}
              onClick={() => onToggleSheetActive?.(sheet.key)}
            >
              {getActivationButtonLabel(sheet)}
            </button>
          )}

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
  onToggleSheetActive,
  onUpdateCollectionEntryStatus,
})
{
  const [confirmDeactivateKey, setConfirmDeactivateKey] = useState(null);
  const sortedInstances = [...instances].sort(sortSheetsByOperationalOrder);
  const primaryInstance = sortedInstances[0] || null;
  const activeInstance = sortedInstances.find((sheet) => sheet.isActive) || null;
  const activatableInstance = sortedInstances.find((sheet) => canActivateSheet(sheet)) || null;
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
            const instanceProgress = getSheetState(sheet);
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
            const isConfirmingDeactivate = confirmDeactivateKey === sheet.key;

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
                  {instanceStatus === "active" ? (
                    isConfirmingDeactivate ? (
                      <>
                        <button
                          style={{
                            ...compactActionButtonStyle,
                            background: "rgba(239,68,68,0.16)",
                          }}
                          onClick={() =>
                          {
                            onToggleSheetActive?.(sheet.key);
                            setConfirmDeactivateKey(null);
                          }}
                        >
                          Confirm Deactivate
                        </button>
                        <button
                          style={compactActionButtonStyle}
                          onClick={() => setConfirmDeactivateKey(null)}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        style={{
                          ...compactActionButtonStyle,
                          border: "1px solid rgba(245,158,11,0.2)",
                          background: instanceVisualStyle.chipBackground,
                        }}
                        onClick={() => setConfirmDeactivateKey(sheet.key)}
                        title="Deactivate this active instance"
                      >
                        Active
                      </button>
                    )
                  ) : instanceStatus === "not_started" ? (
                    <button
                      style={{
                        ...compactActionButtonStyle,
                        border: "1px solid rgba(34,197,94,0.2)",
                        background: "rgba(34,197,94,0.16)",
                      }}
                      onClick={() => onToggleSheetActive?.(sheet.key)}
                      title="Activate this tracked instance"
                    >
                      Activate
                    </button>
                  ) : (
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
                    >
                      {getStatusLabel(instanceStatus)}
                    </div>
                  )}

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
          ) : activatableInstance ? (
            <button
              style={{
                ...actionButtonStyle,
                background: "rgba(34,197,94,0.16)",
                border: "1px solid rgba(34,197,94,0.18)",
              }}
              onClick={() => onToggleSheetActive?.(activatableInstance.key)}
            >
              Activate Next Run
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
  onToggleSheetActive,
})
{
  const progress = getSheetState(sheet);
  const status = getDerivedSheetStatus(sheet);
  const visualStyle = getStatusVisualStyle(status);
  const showActivationButton = status !== "complete";

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
          {sheet.isActive ? "Active collection sheet" : "Collection tracker"}
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {showActivationButton && (
            <button
              style={{
                ...actionButtonStyle,
                background: sheet.isActive ? "rgba(245,158,11,0.18)" : "rgba(34,197,94,0.16)",
                border: sheet.isActive
                  ? "1px solid rgba(245,158,11,0.22)"
                  : "1px solid rgba(34,197,94,0.18)",
              }}
              onClick={() => onToggleSheetActive?.(sheet.key)}
            >
              {getActivationButtonLabel(sheet)}
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

export default function Collections({
  sheets,
  collectionsData,
  onOpenSheet,
  onCreateAnotherSheetInstance,
  onDeleteSheetInstance,
  getDeleteInstanceBlockState,
  onToggleSheetActive,
  onUpdateCollectionEntryStatus,
})
{
  const [activeTab, setActiveTab] = useState("vessels");
  const [statusFilter, setStatusFilter] = useState("all");
  const [vesselFamilyFilter, setVesselFamilyFilter] = useState("all");
  const [showScrollTop, setShowScrollTop] = useState(false);

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
    () => sheets.filter((sheet) => (sheet.type || "vessel") === "vessel"),
    [sheets]
  );
  const islandSheets = useMemo(
    () => sheets.filter((sheet) => sheet.type === "island"),
    [sheets]
  );

  const collectionsByKey = useMemo(
    () => new Map((collectionsData || []).map((collection) => [collection.key, collection])),
    [collectionsData]
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

  const vesselFamilyCounts = useMemo(() =>
  {
    const amberCount = vesselCollectionEntryGroups.amber.length;
    const wublinCount = vesselCollectionEntryGroups.wublin.length;
    const celestialCount = vesselCollectionEntryGroups.celestial.length;
    const otherCount = vesselCollectionEntryGroups.other.length;

    return {
      all: amberCount + wublinCount + celestialCount + otherCount,
      amber: amberCount,
      wublin: wublinCount,
      celestial: celestialCount,
      other: otherCount,
    };
  }, [vesselCollectionEntryGroups]);

  const visibleVesselFamilyFilterOptions = useMemo(() =>
  {
    return VESSEL_FAMILY_FILTER_OPTIONS.filter((filter) =>
    {
      if (filter.key === "all")
      {
        return true;
      }

      return Number(vesselFamilyCounts[filter.key] || 0) > 0;
    });
  }, [vesselFamilyCounts]);

  const visibleVesselSections = useMemo(() =>
  {
    const sectionSubtitles = {
      amber: "Collection-first browsing for Amber monsters, with tracked runs nested underneath each species.",
      wublin: "Collection-first browsing for Wublin monsters and variants, with tracked runs nested underneath each species.",
      celestial: "Collection-first browsing for Celestial monsters and future tracked runs.",
      other: "Grouped species view for any other vessel-style families that reuse the shared sheet backbone.",
    };
    const sections = [
      {
        key: "amber",
        title: "Amber",
        subtitle: sectionSubtitles.amber,
        count: vesselCollectionEntryGroups.amber.length,
        cards: vesselCollectionEntryGroups.amber.map(({ entry, instances }) => (
          <VesselTemplateCard
            key={`amber:${entry.name}`}
            collectionKey="amber_island"
            entry={entry}
            instances={instances}
            onOpenSheet={onOpenSheet}
            onCreateAnotherSheetInstance={onCreateAnotherSheetInstance}
            onDeleteSheetInstance={onDeleteSheetInstance}
            getDeleteInstanceBlockState={getDeleteInstanceBlockState}
            onToggleSheetActive={onToggleSheetActive}
            onUpdateCollectionEntryStatus={onUpdateCollectionEntryStatus}
          />
        )),
      },
      {
        key: "wublin",
        title: "Wublins",
        subtitle: sectionSubtitles.wublin,
        count: vesselCollectionEntryGroups.wublin.length,
        cards: vesselCollectionEntryGroups.wublin.map(({ entry, instances }) => (
          <VesselTemplateCard
            key={`wublins:${entry.name}`}
            collectionKey="wublins"
            entry={entry}
            instances={instances}
            onOpenSheet={onOpenSheet}
            onCreateAnotherSheetInstance={onCreateAnotherSheetInstance}
            onDeleteSheetInstance={onDeleteSheetInstance}
            getDeleteInstanceBlockState={getDeleteInstanceBlockState}
            onToggleSheetActive={onToggleSheetActive}
            onUpdateCollectionEntryStatus={onUpdateCollectionEntryStatus}
          />
        )),
      },
      {
        key: "celestial",
        title: "Celestial",
        subtitle: sectionSubtitles.celestial,
        count: vesselCollectionEntryGroups.celestial.length,
        cards: vesselCollectionEntryGroups.celestial.map(({ entry, instances }) => (
          <VesselTemplateCard
            key={`celestials:${entry.name}`}
            collectionKey="celestials"
            entry={entry}
            instances={instances}
            onOpenSheet={onOpenSheet}
            onCreateAnotherSheetInstance={onCreateAnotherSheetInstance}
            onDeleteSheetInstance={onDeleteSheetInstance}
            getDeleteInstanceBlockState={getDeleteInstanceBlockState}
            onToggleSheetActive={onToggleSheetActive}
            onUpdateCollectionEntryStatus={onUpdateCollectionEntryStatus}
          />
        )),
      },
      {
        key: "other",
        title: "Other",
        subtitle: sectionSubtitles.other,
        count: vesselCollectionEntryGroups.other.length,
        cards: vesselCollectionEntryGroups.other.map(({ entry, instances }) => (
          <VesselTemplateCard
            key={`other:${entry.name}`}
            collectionKey="other"
            entry={entry}
            instances={instances}
            onOpenSheet={onOpenSheet}
            onCreateAnotherSheetInstance={onCreateAnotherSheetInstance}
            onDeleteSheetInstance={onDeleteSheetInstance}
            getDeleteInstanceBlockState={getDeleteInstanceBlockState}
            onToggleSheetActive={onToggleSheetActive}
            onUpdateCollectionEntryStatus={onUpdateCollectionEntryStatus}
          />
        )),
      },
    ];

    return sections.filter((section) =>
    {
      if (vesselFamilyFilter !== "all")
      {
        return section.key === vesselFamilyFilter;
      }

      return section.count > 0;
    });
  }, [
    onCreateAnotherSheetInstance,
    onDeleteSheetInstance,
    getDeleteInstanceBlockState,
    onOpenSheet,
    onToggleSheetActive,
    onUpdateCollectionEntryStatus,
    vesselFamilyFilter,
    vesselCollectionEntryGroups,
  ]);

  const islandGroupByName = useMemo(
    () => new Map(ISLAND_STATE_DEFAULTS.map((island) => [island.name, island.group || "other"])),
    []
  );

  const groupedIslandSheets = useMemo(() =>
  {
    return ISLAND_GROUPS.map((group) => ({
      ...group,
      sheets: islandSheets
        .filter((sheet) => islandGroupByName.get(sheet.island) === group.key)
        .filter((sheet) => matchesStatusFilter(sheet, statusFilter))
        .sort(sortSheetsByOperationalOrder),
    })).filter((group) => group.sheets.length > 0);
  }, [islandGroupByName, islandSheets, statusFilter]);

  return (
    <div className="page-surface">
      <div className="responsive-page-card" style={pageCardStyle}>
        <div style={{ fontSize: "32px", fontWeight: 800, letterSpacing: "-0.02em" }}>
          Collections
        </div>
        <div style={{ marginTop: "8px", opacity: 0.75 }}>
          Track vessels and island completion without leaving the main sheet system.
        </div>

        <div className="collections-filter-stack">
          <div>
            <div className="collections-filter-label">Browser</div>
            <div className="screen-card-actions" style={{ marginTop: "8px" }}>
              <button
                style={{
                  ...tabStyle,
                  background: activeTab === "vessels" ? "rgba(245,158,11,0.18)" : tabStyle.background,
                }}
                onClick={() => setActiveTab("vessels")}
              >
                Vessels ({vesselFamilyCounts.all})
              </button>
              <button
                style={{
                  ...tabStyle,
                  background: activeTab === "islands" ? "rgba(59,130,246,0.18)" : tabStyle.background,
                }}
                onClick={() => setActiveTab("islands")}
              >
                Islands ({islandSheets.length})
              </button>
            </div>
          </div>

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

        {activeTab === "vessels" && (
          <>
            <div>
              <div className="collections-filter-label">Family</div>
              <div className="collections-mobile-filter" style={{ marginTop: "8px" }}>
                <select
                  style={filterSelectStyle}
                  value={vesselFamilyFilter}
                  onChange={(event) => setVesselFamilyFilter(event.target.value)}
                >
                  {visibleVesselFamilyFilterOptions.map((filter) => (
                    <option key={`family-select-${filter.key}`} value={filter.key}>
                      {`${filter.label} (${vesselFamilyCounts[filter.key] || 0})`}
                    </option>
                  ))}
                </select>
              </div>
              <div className="screen-card-actions collections-filter-options" style={{ marginTop: "8px", gap: "8px" }}>
                {visibleVesselFamilyFilterOptions.map((filter) => (
                  <button
                    key={filter.key}
                    style={{
                      ...filterButtonStyle,
                      background: vesselFamilyFilter === filter.key
                        ? "rgba(245,158,11,0.18)"
                        : filterButtonStyle.background,
                    }}
                    onClick={() => setVesselFamilyFilter(filter.key)}
                  >
                    {filter.label} ({vesselFamilyCounts[filter.key] || 0})
                  </button>
                ))}
              </div>
            </div>

            <div style={{ fontSize: "13px", opacity: 0.64 }}>
              Collections consolidate each species once here, while keeping duplicate tracked runs nested underneath it.
            </div>
          </>
        )}
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

      {activeTab === "vessels" ? (
        <div style={{ display: "grid", gap: "16px" }}>
          {visibleVesselSections.length === 0 ? (
            <div style={sectionCardStyle}>
              <div style={{ opacity: 0.68 }}>
                {vesselFamilyFilter === "all"
                  ? getEmptyStateCopy(statusFilter)
                  : `No ${getVesselGroupLabel(vesselFamilyFilter).toLowerCase()} vessel sheets match the current filter.`}
              </div>
            </div>
          ) : (
            visibleVesselSections.map((section) => (
              <div key={section.key} style={sectionCardStyle}>
                {renderSectionHeader({
                  title: section.title,
                  subtitle: section.subtitle,
                  count: section.count,
                })}

                <div
                  className="collections-card-grid"
                  style={{ marginTop: "12px" }}
                >
                  {section.count === 0 ? (
                    <div style={{ opacity: 0.64 }}>
                      {statusFilter === "all"
                        ? `No ${section.title.toLowerCase()} collection entries yet.`
                        : getEmptyStateCopy(statusFilter)}
                    </div>
                  ) : section.cards}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div style={{ display: "grid", gap: "16px" }}>
          {groupedIslandSheets.length === 0 ? (
            <div style={sectionCardStyle}>
              <div style={{ opacity: 0.68 }}>
                {getEmptyStateCopy(statusFilter)}
              </div>
            </div>
          ) : (
            groupedIslandSheets.map((group) => (
              <div key={group.key} style={sectionCardStyle}>
                {renderSectionHeader({
                  title: group.label,
                  subtitle: "Tracked island collection sheets for this region.",
                  count: group.sheets.length,
                })}

                <div className="collections-card-grid" style={{ marginTop: "12px" }}>
                  {group.sheets.map((sheet) => (
                    <IslandSheetCard
                      key={sheet.key}
                      sheet={sheet}
                      onOpenSheet={onOpenSheet}
                      onToggleSheetActive={onToggleSheetActive}
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
