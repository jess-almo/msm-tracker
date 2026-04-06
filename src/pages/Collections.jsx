import React, { useMemo, useState } from "react";
import { ISLAND_GROUPS, ISLAND_STATE_DEFAULTS } from "../data/islands";

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
  { key: "in_progress", label: "In Progress" },
  { key: "not_started", label: "Not Started" },
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
    return "In Progress";
  }

  if (status === "complete")
  {
    return "Complete";
  }

  return "Not Started";
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

function isCommonWublinSheet(sheet)
{
  if (getVesselGroupKey(sheet) !== "wublin")
  {
    return false;
  }

  const name = sheet.templateName || sheet.monsterName || "";

  return !name.startsWith("Rare ") && !name.startsWith("Epic ");
}

function getTemplateStatus(instances)
{
  const statuses = instances.map((sheet) => getDerivedSheetStatus(sheet));

  if (statuses.includes("active"))
  {
    return "active";
  }

  if (statuses.includes("in_progress"))
  {
    return "in_progress";
  }

  if (statuses.includes("not_started"))
  {
    return "not_started";
  }

  return "complete";
}

function getWublinTemplateSortSummary(instances)
{
  const sortedInstances = [...instances].sort(sortSheetsByOperationalOrder);
  const primaryInstance = sortedInstances[0];
  const status = getTemplateStatus(sortedInstances);

  return {
    key: primaryInstance?.templateKey || primaryInstance?.monsterName || "",
    name: primaryInstance?.templateName || primaryInstance?.monsterName || "",
    status,
    priority: getSheetSortPriority(primaryInstance),
  };
}

function getWublinTemplateProgress(instances)
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

function getVisibleWublinInstanceLabel(sheet, visibleInstances)
{
  const baseName = sheet.templateName || sheet.monsterName || sheet.displayName || sheet.sheetTitle || "";

  if (!Array.isArray(visibleInstances) || visibleInstances.length <= 1)
  {
    return baseName;
  }

  return `${baseName} #${Number(sheet.instanceNumber || 1)}`;
}

function sortWublinTemplateGroups(a, b)
{
  const aSummary = getWublinTemplateSortSummary(a);
  const bSummary = getWublinTemplateSortSummary(b);
  const statusPriorityDelta = getStatusPriority(aSummary.status) - getStatusPriority(bSummary.status);

  if (statusPriorityDelta !== 0)
  {
    return statusPriorityDelta;
  }

  if (aSummary.status === "active")
  {
    const aActivatedAt = getSheetActivationOrderValue(
      [...a].sort(sortSheetsByOperationalOrder).find((sheet) => sheet.isActive) || null
    );
    const bActivatedAt = getSheetActivationOrderValue(
      [...b].sort(sortSheetsByOperationalOrder).find((sheet) => sheet.isActive) || null
    );

    if (aActivatedAt && bActivatedAt && aActivatedAt !== bActivatedAt)
    {
      return aActivatedAt.localeCompare(bActivatedAt);
    }

    if (aActivatedAt !== bActivatedAt)
    {
      return aActivatedAt ? -1 : 1;
    }
  }

  const priorityDelta = aSummary.priority - bSummary.priority;

  if (priorityDelta !== 0)
  {
    return priorityDelta;
  }

  const aName = aSummary.name || "";
  const bName = bSummary.name || "";

  return aName.localeCompare(bName);
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
        display: "flex",
        justifyContent: "space-between",
        gap: "12px",
        alignItems: "flex-start",
        flexWrap: "wrap",
      }}
    >
      <div>
        <div style={{ fontSize: "13px", opacity: 0.68, letterSpacing: "0.08em" }}>
          {title.toUpperCase()}
        </div>
        {subtitle && (
          <div style={{ marginTop: "6px", fontSize: "13px", opacity: 0.64 }}>
            {subtitle}
          </div>
        )}
      </div>

      <div
        style={{
          display: "inline-flex",
          padding: "6px 10px",
          borderRadius: "999px",
          border: "1px solid rgba(255,255,255,0.1)",
          background: "rgba(255,255,255,0.06)",
          fontSize: "12px",
          fontWeight: 700,
        }}
      >
        {count}
      </div>
    </div>
  );
}

function VesselSheetCard({
  sheet,
  onOpenSheet,
  onCreateAnotherSheetInstance,
})
{
  const progress = getSheetState(sheet);
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

function WublinTemplateCard({
  instances,
  onOpenSheet,
  onCreateAnotherSheetInstance,
  onDeleteSheetInstance,
  getDeleteInstanceBlockState,
  onToggleSheetActive,
})
{
  const [confirmDeactivateKey, setConfirmDeactivateKey] = useState(null);
  const sortedInstances = [...instances].sort(sortSheetsByOperationalOrder);
  const primaryInstance = sortedInstances[0];
  const summary = getWublinTemplateSortSummary(sortedInstances);
  const totals = getWublinTemplateProgress(sortedInstances);
  const visualStyle = getStatusVisualStyle(summary.status);
  const statusSummaryParts = [
    `${totals.instanceCount} tracked run${totals.instanceCount === 1 ? "" : "s"}`,
  ];

  if (totals.activeCount > 0)
  {
    statusSummaryParts.push(`${totals.activeCount} active`);
  }

  if (totals.inProgressCount > 0)
  {
    statusSummaryParts.push(`${totals.inProgressCount} in progress`);
  }

  if (totals.completeCount > 0)
  {
    statusSummaryParts.push(`${totals.completeCount} complete`);
  }

  return (
    <div
      key={summary.key}
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
            {summary.name}
          </div>
          <div style={{ marginTop: "4px", fontSize: "13px", opacity: 0.72 }}>
            {primaryInstance.collectionName} · Common Wublin template
          </div>
          <div style={{ marginTop: "4px", fontSize: "13px", opacity: 0.72 }}>
            {statusSummaryParts.join(" · ")}
          </div>
          <div style={{ marginTop: "4px", fontSize: "13px", opacity: 0.72 }}>
            {Number(primaryInstance.timeLimitDays || 0) > 0
              ? `${primaryInstance.timeLimitDays}d limit`
              : "No time limit data"}
            {Number(primaryInstance.totalEggs || 0) > 0 ? ` · ${primaryInstance.totalEggs} eggs` : ""}
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
            {getStatusLabel(summary.status)}
          </div>
          <div style={{ fontSize: "14px", fontWeight: 700 }}>
            {totals.progress.done} / {totals.progress.total}
          </div>
          <div style={{ marginTop: "4px", fontSize: "13px", opacity: 0.72 }}>
            {totals.progress.percent}% complete
          </div>
        </div>
      </div>

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
          const instanceLabel = getVisibleWublinInstanceLabel(sheet, sortedInstances);
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
          {totals.progress.trackedPercent}% tracked across all current runs
        </div>

        <button
          style={actionButtonStyle}
          onClick={() => onCreateAnotherSheetInstance?.(primaryInstance.key)}
        >
          {totals.hasCompletedInstance ? "Create New Instance" : "Create Another Instance"}
        </button>
      </div>
    </div>
  );
}

function IslandSheetCard({
  sheet,
  onOpenSheet,
})
{
  const progress = getSheetState(sheet);
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

        <button
          style={actionButtonStyle}
          onClick={() => onOpenSheet(sheet.key)}
        >
          Open Collection
        </button>
      </div>
    </div>
  );
}

export default function Collections({
  sheets,
  onOpenSheet,
  onCreateAnotherSheetInstance,
  onDeleteSheetInstance,
  getDeleteInstanceBlockState,
  onToggleSheetActive,
})
{
  const [activeTab, setActiveTab] = useState("vessels");
  const [statusFilter, setStatusFilter] = useState("all");
  const [vesselFamilyFilter, setVesselFamilyFilter] = useState("all");

  const vesselSheets = useMemo(
    () => sheets.filter((sheet) => (sheet.type || "vessel") === "vessel"),
    [sheets]
  );
  const islandSheets = useMemo(
    () => sheets.filter((sheet) => sheet.type === "island"),
    [sheets]
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

  const standardVesselGroups = useMemo(() =>
  {
    return {
      amber: vesselGroups.amber
        .filter((sheet) => matchesStatusFilter(sheet, statusFilter))
        .sort(sortSheetsByOperationalOrder),
      celestial: vesselGroups.celestial
        .filter((sheet) => matchesStatusFilter(sheet, statusFilter))
        .sort(sortSheetsByOperationalOrder),
      other: vesselGroups.other
        .filter((sheet) => matchesStatusFilter(sheet, statusFilter))
        .sort(sortSheetsByOperationalOrder),
    };
  }, [statusFilter, vesselGroups]);

  const visibleWublinTemplateGroups = useMemo(() =>
  {
    const groupedTemplates = new Map();

    vesselGroups.wublin
      .filter(isCommonWublinSheet)
      .forEach((sheet) =>
      {
        const templateKey = sheet.templateKey || sheet.templateName || sheet.monsterName;
        const existing = groupedTemplates.get(templateKey) || [];

        groupedTemplates.set(templateKey, [...existing, sheet]);
      });

    return Array.from(groupedTemplates.values())
      .map((instances) => [...instances].sort(sortSheetsByOperationalOrder))
      .filter((instances) => matchesStatusFilter(getTemplateStatus(instances), statusFilter))
      .sort(sortWublinTemplateGroups);
  }, [statusFilter, vesselGroups.wublin]);

  const vesselFamilyCounts = useMemo(() =>
  {
    const amberCount = standardVesselGroups.amber.length;
    const wublinCount = visibleWublinTemplateGroups.length;
    const celestialCount = standardVesselGroups.celestial.length;
    const otherCount = standardVesselGroups.other.length;

    return {
      all: amberCount + wublinCount + celestialCount + otherCount,
      amber: amberCount,
      wublin: wublinCount,
      celestial: celestialCount,
      other: otherCount,
    };
  }, [standardVesselGroups, visibleWublinTemplateGroups]);

  const visibleVesselSections = useMemo(() =>
  {
    const sections = [
      {
        key: "amber",
        title: "Amber",
        subtitle: "Priority-sorted vessel sheets for active Amber work.",
        count: standardVesselGroups.amber.length,
        cards: standardVesselGroups.amber.map((sheet) => (
          <VesselSheetCard
            key={sheet.key}
            sheet={sheet}
            onOpenSheet={onOpenSheet}
            onCreateAnotherSheetInstance={onCreateAnotherSheetInstance}
          />
        )),
      },
      {
        key: "wublin",
        title: "Common Wublins",
        subtitle: "Species-first browsing for common Wublin templates, with tracked runs nested underneath.",
        count: visibleWublinTemplateGroups.length,
        cards: visibleWublinTemplateGroups.map((instances) => (
          <WublinTemplateCard
            key={instances[0]?.templateKey || instances[0]?.monsterName}
            instances={instances}
            onOpenSheet={onOpenSheet}
            onCreateAnotherSheetInstance={onCreateAnotherSheetInstance}
            onDeleteSheetInstance={onDeleteSheetInstance}
            getDeleteInstanceBlockState={getDeleteInstanceBlockState}
            onToggleSheetActive={onToggleSheetActive}
          />
        )),
      },
      {
        key: "celestial",
        title: "Celestial",
        subtitle: "Reserved for current Celestial tracking sheets.",
        count: standardVesselGroups.celestial.length,
        cards: standardVesselGroups.celestial.map((sheet) => (
          <VesselSheetCard
            key={sheet.key}
            sheet={sheet}
            onOpenSheet={onOpenSheet}
            onCreateAnotherSheetInstance={onCreateAnotherSheetInstance}
          />
        )),
      },
      {
        key: "other",
        title: "Other",
        subtitle: "Other vessel-style tracking families that reuse the shared sheet backbone.",
        count: standardVesselGroups.other.length,
        cards: standardVesselGroups.other.map((sheet) => (
          <VesselSheetCard
            key={sheet.key}
            sheet={sheet}
            onOpenSheet={onOpenSheet}
            onCreateAnotherSheetInstance={onCreateAnotherSheetInstance}
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
    standardVesselGroups,
    vesselFamilyFilter,
    visibleWublinTemplateGroups,
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

        <div className="screen-card-actions" style={{ marginTop: "16px" }}>
          <button
            style={{
              ...tabStyle,
              background: activeTab === "vessels" ? "rgba(245,158,11,0.18)" : tabStyle.background,
            }}
            onClick={() => setActiveTab("vessels")}
          >
            Vessels ({vesselSheets.length})
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

        <div className="screen-card-actions" style={{ marginTop: "16px", gap: "8px" }}>
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

        {activeTab === "vessels" && (
          <>
            <div className="screen-card-actions" style={{ marginTop: "16px", gap: "8px" }}>
              {VESSEL_FAMILY_FILTER_OPTIONS.map((filter) => (
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

            <div style={{ marginTop: "10px", fontSize: "13px", opacity: 0.64 }}>
              Common Wublins only are shown in this vessel browser for now. Rare and Epic Wublin support can layer in later without changing the instance model.
            </div>
          </>
        )}
      </div>

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

                <div style={{ marginTop: "12px", display: "grid", gap: "12px" }}>
                  {section.count === 0 ? (
                    <div style={{ opacity: 0.64 }}>
                      {statusFilter === "all"
                        ? `No ${section.title.toLowerCase()} sheets yet.`
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

                <div style={{ marginTop: "12px", display: "grid", gap: "12px" }}>
                  {group.sheets.map((sheet) => (
                    <IslandSheetCard
                      key={sheet.key}
                      sheet={sheet}
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
