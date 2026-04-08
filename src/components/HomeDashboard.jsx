import React, { useRef } from "react";

const pageCardStyle = {
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: "18px",
  padding: "18px",
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.025))",
  boxShadow: "0 12px 30px rgba(0,0,0,0.18)",
};

const statButtonStyle = {
  ...pageCardStyle,
  display: "grid",
  gap: "4px",
  textAlign: "left",
  color: "inherit",
  cursor: "pointer",
  width: "100%",
};

const worldCardStyle = {
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: "16px",
  padding: "16px",
  background: "rgba(255,255,255,0.035)",
  color: "inherit",
  cursor: "pointer",
  textAlign: "left",
  display: "grid",
  gap: "10px",
};

function getActionCardAccent(label)
{
  switch (label)
  {
    case "NEED NOW":
      return {
        border: "rgba(59,130,246,0.26)",
        background: "linear-gradient(180deg, rgba(59,130,246,0.12), rgba(255,255,255,0.03))",
        glow: "0 14px 34px rgba(37,99,235,0.12)",
      };
    case "BREEDABLE":
      return {
        border: "rgba(16,185,129,0.24)",
        background: "linear-gradient(180deg, rgba(16,185,129,0.12), rgba(255,255,255,0.03))",
        glow: "0 14px 34px rgba(5,150,105,0.12)",
      };
    case "ACTIVE EGGS":
      return {
        border: "rgba(168,85,247,0.24)",
        background: "linear-gradient(180deg, rgba(168,85,247,0.11), rgba(255,255,255,0.03))",
        glow: "0 14px 34px rgba(147,51,234,0.11)",
      };
    case "READY NOW":
      return {
        border: "rgba(245,158,11,0.26)",
        background: "linear-gradient(180deg, rgba(245,158,11,0.12), rgba(255,255,255,0.03))",
        glow: "0 14px 34px rgba(217,119,6,0.13)",
      };
    case "BLOCKED":
      return {
        border: "rgba(239,68,68,0.24)",
        background: "linear-gradient(180deg, rgba(239,68,68,0.11), rgba(255,255,255,0.03))",
        glow: "0 14px 34px rgba(220,38,38,0.11)",
      };
    case "ACTIVE VESSELS":
      return {
        border: "rgba(245,158,11,0.22)",
        background: "linear-gradient(180deg, rgba(245,158,11,0.1), rgba(255,255,255,0.03))",
        glow: "0 14px 34px rgba(180,83,9,0.1)",
      };
    case "ISLAND COLLECTIONS":
      return {
        border: "rgba(34,197,94,0.24)",
        background: "linear-gradient(180deg, rgba(34,197,94,0.1), rgba(255,255,255,0.03))",
        glow: "0 14px 34px rgba(22,163,74,0.11)",
      };
    case "BREEDER SPACE":
      return {
        border: "rgba(14,165,233,0.22)",
        background: "linear-gradient(180deg, rgba(14,165,233,0.1), rgba(255,255,255,0.03))",
        glow: "0 14px 34px rgba(2,132,199,0.1)",
      };
    case "NURSERY SPACE":
      return {
        border: "rgba(99,102,241,0.22)",
        background: "linear-gradient(180deg, rgba(99,102,241,0.1), rgba(255,255,255,0.03))",
        glow: "0 14px 34px rgba(79,70,229,0.1)",
      };
    default:
      return {
        border: "rgba(255,255,255,0.12)",
        background: pageCardStyle.background,
        glow: pageCardStyle.boxShadow,
      };
  }
}

function getWorldCardAccent(world)
{
  const chips = new Set(world.chips || []);

  if (chips.has("Natural"))
  {
    return {
      border: "rgba(34,197,94,0.28)",
      background: "linear-gradient(180deg, rgba(34,197,94,0.12), rgba(255,255,255,0.03))",
      glow: "0 16px 36px rgba(22,163,74,0.11)",
    };
  }

  if (chips.has("Fire"))
  {
    return {
      border: "rgba(249,115,22,0.28)",
      background: "linear-gradient(180deg, rgba(249,115,22,0.12), rgba(255,255,255,0.03))",
      glow: "0 16px 36px rgba(194,65,12,0.12)",
    };
  }

  if (chips.has("Magical"))
  {
    return {
      border: "rgba(168,85,247,0.28)",
      background: "linear-gradient(180deg, rgba(168,85,247,0.11), rgba(255,255,255,0.03))",
      glow: "0 16px 36px rgba(147,51,234,0.11)",
    };
  }

  if (chips.has("Ethereal"))
  {
    return {
      border: "rgba(45,212,191,0.26)",
      background: "linear-gradient(180deg, rgba(45,212,191,0.1), rgba(255,255,255,0.03))",
      glow: "0 16px 36px rgba(13,148,136,0.11)",
    };
  }

  if (chips.has("Mirror") || chips.has("Mirror Islands"))
  {
    return {
      border: "rgba(96,165,250,0.24)",
      background: "linear-gradient(180deg, rgba(96,165,250,0.1), rgba(255,255,255,0.03))",
      glow: "0 16px 36px rgba(59,130,246,0.1)",
    };
  }

  if (chips.has("Zap") || world.title.includes("Wublin"))
  {
    return {
      border: "rgba(45,212,191,0.28)",
      background: "linear-gradient(180deg, rgba(20,184,166,0.11), rgba(255,255,255,0.03))",
      glow: "0 16px 36px rgba(13,148,136,0.11)",
    };
  }

  if (chips.has("Vessels") || world.title.includes("Amber"))
  {
    return {
      border: "rgba(245,158,11,0.28)",
      background: "linear-gradient(180deg, rgba(245,158,11,0.11), rgba(255,255,255,0.03))",
      glow: "0 16px 36px rgba(180,83,9,0.11)",
    };
  }

  return {
    border: "rgba(255,255,255,0.12)",
    background: worldCardStyle.background,
    glow: "0 14px 34px rgba(0,0,0,0.16)",
  };
}

function getSectionTone(kind)
{
  switch (kind)
  {
    case "command":
      return {
        border: "1px solid rgba(96,165,250,0.16)",
        background: "linear-gradient(180deg, rgba(96,165,250,0.07), rgba(255,255,255,0.025))",
      };
    case "collections":
      return {
        border: "1px solid rgba(34,197,94,0.16)",
        background: "linear-gradient(180deg, rgba(34,197,94,0.06), rgba(255,255,255,0.025))",
      };
    case "focus":
      return {
        border: "1px solid rgba(245,158,11,0.16)",
        background: "linear-gradient(180deg, rgba(245,158,11,0.06), rgba(255,255,255,0.025))",
      };
    case "queue":
      return {
        border: "1px solid rgba(168,85,247,0.16)",
        background: "linear-gradient(180deg, rgba(168,85,247,0.06), rgba(255,255,255,0.025))",
      };
    default:
      return {
        border: pageCardStyle.border,
        background: pageCardStyle.background,
      };
  }
}

function DashboardActionCard({
  label,
  value,
  description,
  onClick,
})
{
  const accent = getActionCardAccent(label);

  return (
    <button
      type="button"
      className="dashboard-action-card"
      style={{
        ...statButtonStyle,
        border: `1px solid ${accent.border}`,
        background: accent.background,
        boxShadow: accent.glow,
      }}
      onClick={onClick}
    >
      <div style={{ fontSize: "13px", opacity: 0.7, letterSpacing: "0.06em" }}>
        {label}
      </div>
      <div style={{ marginTop: "8px", fontSize: "26px", fontWeight: 700 }}>
        {value}
      </div>
      <div style={{ marginTop: "6px", opacity: 0.72 }}>
        {description}
      </div>
    </button>
  );
}

function FocusCard({
  goal,
  onOpenSheet,
})
{
  return (
    <button
      type="button"
      className="focus-goal-card"
      onClick={() => onOpenSheet(goal.key)}
      style={{
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: "16px",
        padding: "16px",
        background: goal.complete
          ? "linear-gradient(180deg, rgba(34,197,94,0.16), rgba(34,197,94,0.06))"
          : "rgba(255,255,255,0.035)",
        cursor: "pointer",
        color: "inherit",
        textAlign: "left",
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
    </button>
  );
}

function BackupPanel({
  backupMessage,
  isImporting,
  onExportBackup,
  onImportBackup,
})
{
  const inputRef = useRef(null);

  return (
    <div className="responsive-page-card" style={{ ...pageCardStyle, display: "grid", gap: "14px" }}>
      <div>
        <div style={{ fontSize: "14px", opacity: 0.7, letterSpacing: "0.06em" }}>
          BACKUP
        </div>
        <div style={{ marginTop: "6px", fontSize: "24px", fontWeight: 700 }}>
          Export or restore the tracker state
        </div>
        <div style={{ marginTop: "8px", opacity: 0.76 }}>
          Keep a JSON backup before device changes or risky cleanup. Imports merge the saved state back into the current app model and preserve future defaults where possible.
        </div>
      </div>

      <div className="screen-card-actions">
        <button
          type="button"
          className="dashboard-secondary-action"
          onClick={onExportBackup}
        >
          Export Backup
        </button>
        <button
          type="button"
          className="dashboard-secondary-action"
          onClick={() => inputRef.current?.click()}
          disabled={isImporting}
        >
          {isImporting ? "Importing..." : "Import Backup"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={async (event) =>
          {
            const file = event.target.files?.[0];

            if (file)
            {
              await onImportBackup(file);
            }

            event.target.value = "";
          }}
        />
      </div>

      {backupMessage && (
        <div
          className={backupMessage.kind === "error" ? "backup-message backup-message-error" : "backup-message"}
        >
          {backupMessage.text}
        </div>
      )}
    </div>
  );
}

function DashboardCollectionWorldCard({
  world,
  onOpenCollectionWorld,
  onOpenSheet,
})
{
  const accent = getWorldCardAccent(world);
  const handleClick = () =>
  {
    if (world.kind === "sheet")
    {
      onOpenSheet(world.targetKey);
      return;
    }

    onOpenCollectionWorld(world.targetKey);
  };

  return (
    <button
      type="button"
      className="focus-goal-card"
      onClick={handleClick}
      style={{
        ...worldCardStyle,
        border: `1px solid ${accent.border}`,
        background: accent.background,
        boxShadow: accent.glow,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "10px",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div style={{ fontSize: "20px", fontWeight: 700 }}>{world.title}</div>
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
          {world.status === "active"
            ? "Active"
            : world.status === "in_progress"
              ? "In Progress"
              : world.status === "complete"
                ? "Complete"
                : "Ready"}
        </div>
      </div>

      <div style={{ fontSize: "14px", opacity: 0.84 }}>
        {world.summaryValue} {world.summaryLabel}
      </div>

      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {world.chips.slice(0, 3).map((chip) => (
          <span
            key={`${world.key}:${chip}`}
            style={{
              padding: "6px 10px",
              borderRadius: "999px",
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.06)",
              fontSize: "12px",
              fontWeight: 700,
            }}
          >
            {chip}
          </span>
        ))}
      </div>

      <div style={{ fontSize: "13px", opacity: 0.72 }}>
        {world.supportingCopy}
      </div>

      <div style={{ fontSize: "12px", opacity: 0.62 }}>
        {world.kind === "sheet" ? "Open checklist sheet" : "Open collection world"}
      </div>
    </button>
  );
}

export default function HomeDashboard({
  needNowIslandCount,
  breedableIslandCount,
  activeIslandSessionCount,
  readyQueuePressureCount,
  blockedQueuePressureCount,
  activeVesselSummary,
  islandCollectionProgress,
  islandCapacitySummary,
  topReadyQueueItems,
  topBlockedQueueItems,
  collectionWorldHighlights,
  onOpenIslandPlanner,
  onOpenActiveSheets,
  onOpenCollections,
  onOpenCollectionWorld,
  onOpenQueue,
  onOpenSheet,
  onExportBackup,
  onImportBackup,
  backupMessage,
  isImporting,
})
{
  const commandTone = getSectionTone("command");
  const collectionTone = getSectionTone("collections");
  const focusTone = getSectionTone("focus");
  const queueTone = getSectionTone("queue");

  function handleOpenQueueItem(item)
  {
    if (item?.sheetKey)
    {
      onOpenSheet(item.sheetKey);
      return;
    }

    onOpenQueue();
  }

  return (
    <div className="page-surface" style={{ gap: "16px" }}>
      <div
        className="responsive-page-card"
        style={{
          ...pageCardStyle,
          ...commandTone,
          display: "grid",
          gap: "16px",
        }}
      >
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
          <DashboardActionCard
            label="NEED NOW"
            value={needNowIslandCount}
            description="islands with tracked work waiting"
            onClick={onOpenIslandPlanner}
          />
          <DashboardActionCard
            label="BREEDABLE"
            value={breedableIslandCount}
            description="islands with open breeder space"
            onClick={onOpenIslandPlanner}
          />
          <DashboardActionCard
            label="ACTIVE EGGS"
            value={activeIslandSessionCount}
            description="breeding or nursery sessions in motion"
            onClick={onOpenIslandPlanner}
          />
          <DashboardActionCard
            label="READY NOW"
            value={readyQueuePressureCount}
            description="breedable eggs currently actionable in queue order"
            onClick={onOpenQueue}
          />
          <DashboardActionCard
            label="BLOCKED"
            value={blockedQueuePressureCount}
            description="needed eggs currently stuck behind island constraints"
            onClick={onOpenQueue}
          />
        </div>

        <div style={{ fontSize: "13px", opacity: 0.68 }}>
          If you just opened the app on mobile, start with <strong>Island Manager</strong> for live capacity, then drop into <strong>Active Sheets</strong> when you need the exact row-level work.
        </div>
      </div>

      <div
        className="responsive-page-card"
        style={{
          ...pageCardStyle,
          ...collectionTone,
          display: "grid",
          gap: "14px",
        }}
      >
        <div>
          <div style={{ fontSize: "14px", opacity: 0.7, letterSpacing: "0.06em" }}>
            COLLECTION WORLDS
          </div>
          <div style={{ marginTop: "6px", fontSize: "24px", fontWeight: 700 }}>
            Where collection pressure is piling up
          </div>
          <div style={{ marginTop: "8px", opacity: 0.76 }}>
            Jump straight into the worlds that are furthest behind or currently driving the collection side of the tracker.
          </div>
        </div>

        {collectionWorldHighlights.length === 0 ? (
          <div style={{ opacity: 0.72 }}>
            No collection worlds need attention right now.
          </div>
        ) : (
          <div className="dashboard-stat-grid" style={{ alignItems: "start" }}>
            {collectionWorldHighlights.map((world) => (
              <DashboardCollectionWorldCard
                key={world.key}
                world={world}
                onOpenCollectionWorld={onOpenCollectionWorld}
                onOpenSheet={onOpenSheet}
              />
            ))}
          </div>
        )}
      </div>

      <div className="dashboard-stat-grid">
        <DashboardActionCard
          label="ACTIVE VESSELS"
          value={activeVesselSummary.length}
          description={
            activeVesselSummary.length === 0
              ? "No active vessel sheets"
              : "Vessel sheets currently demanding attention"
          }
          onClick={onOpenActiveSheets}
        />
        <DashboardActionCard
          label="ISLAND COLLECTIONS"
          value={`${islandCollectionProgress.complete} / ${islandCollectionProgress.total}`}
          description={`${islandCollectionProgress.percent}% island collections complete`}
          onClick={onOpenCollections}
        />
        <DashboardActionCard
          label="BREEDER SPACE"
          value={`${islandCapacitySummary.freeBreeders} free`}
          description={`${islandCapacitySummary.totalBreeders} total breeders across unlocked islands`}
          onClick={onOpenIslandPlanner}
        />
        <DashboardActionCard
          label="NURSERY SPACE"
          value={`${islandCapacitySummary.freeNurseries} free`}
          description={`${islandCapacitySummary.totalNurseries} total nurseries across unlocked islands`}
          onClick={onOpenIslandPlanner}
        />
      </div>

      <BackupPanel
        backupMessage={backupMessage}
        isImporting={isImporting}
        onExportBackup={onExportBackup}
        onImportBackup={onImportBackup}
      />

      <div
        className="responsive-page-card"
        style={{
          ...pageCardStyle,
          ...focusTone,
          display: "grid",
          gap: "14px",
        }}
      >
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
              <FocusCard
                key={goal.key}
                goal={goal}
                onOpenSheet={onOpenSheet}
              />
            ))}
          </div>
        )}
      </div>

      <div
        className="responsive-page-card"
        style={{
          ...pageCardStyle,
          ...queueTone,
          display: "grid",
          gap: "14px",
        }}
      >
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

        {topReadyQueueItems.length === 0 && topBlockedQueueItems.length === 0 ? (
          <div style={{ opacity: 0.72 }}>No active breeding pressure right now.</div>
        ) : (
          <div className="dashboard-stat-grid" style={{ alignItems: "start" }}>
            <div style={{ display: "grid", gap: "10px" }}>
              <div style={{ fontSize: "13px", opacity: 0.7, letterSpacing: "0.06em" }}>
                READY NOW
              </div>
              {topReadyQueueItems.length === 0 ? (
                <div style={{ opacity: 0.68 }}>Nothing breedable is ready on an open island yet.</div>
              ) : (
                topReadyQueueItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="focus-goal-card"
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "12px",
                      flexWrap: "wrap",
                      padding: "14px 16px",
                      borderRadius: "14px",
                      background: "rgba(245,158,11,0.08)",
                      border: "1px solid rgba(245,158,11,0.12)",
                      color: "inherit",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                    onClick={() => handleOpenQueueItem(item)}
                  >
                    <div>
                      <div style={{ fontSize: "18px", fontWeight: 700 }}>{item.name}</div>
                      <div style={{ marginTop: "4px", fontSize: "13px", opacity: 0.72 }}>
                        {item.island || (item.islands || []).join(" / ")}
                      </div>
                      <div style={{ marginTop: "6px", fontSize: "12px", opacity: 0.62 }}>
                        {item.sheetTitle ? `Open ${item.sheetTitle}` : "Open Breeding Queue"}
                      </div>
                    </div>

                    <div
                      style={{
                        padding: "6px 12px",
                        borderRadius: "999px",
                        border: "1px solid rgba(245,158,11,0.14)",
                        background: "rgba(245,158,11,0.14)",
                        fontSize: "12px",
                        fontWeight: 700,
                      }}
                    >
                      Need {item.actualRemaining}
                    </div>
                  </button>
                ))
              )}
            </div>

            <div style={{ display: "grid", gap: "10px" }}>
              <div style={{ fontSize: "13px", opacity: 0.7, letterSpacing: "0.06em" }}>
                BLOCKED PIPELINE
              </div>
              {topBlockedQueueItems.length === 0 ? (
                <div style={{ opacity: 0.68 }}>No tracked demand is blocked right now.</div>
              ) : (
                topBlockedQueueItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="focus-goal-card"
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "12px",
                      flexWrap: "wrap",
                      padding: "14px 16px",
                      borderRadius: "14px",
                      background: "rgba(239,68,68,0.08)",
                      border: "1px solid rgba(239,68,68,0.12)",
                      color: "inherit",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                    onClick={() => handleOpenQueueItem(item)}
                  >
                    <div>
                      <div style={{ fontSize: "18px", fontWeight: 700 }}>{item.name}</div>
                      <div style={{ marginTop: "4px", fontSize: "13px", opacity: 0.72 }}>
                        {item.blockReason}
                      </div>
                      <div style={{ marginTop: "6px", fontSize: "12px", opacity: 0.62 }}>
                        {item.sheetTitle ? `Open ${item.sheetTitle}` : "Open Breeding Queue"}
                      </div>
                    </div>

                    <div
                      style={{
                        padding: "6px 12px",
                        borderRadius: "999px",
                        border: "1px solid rgba(239,68,68,0.14)",
                        background: "rgba(239,68,68,0.14)",
                        fontSize: "12px",
                        fontWeight: 700,
                      }}
                    >
                      Need {item.actualRemaining}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
