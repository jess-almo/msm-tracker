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

function DashboardActionCard({
  label,
  value,
  description,
  onClick,
})
{
  return (
    <button
      type="button"
      className="dashboard-action-card"
      style={statButtonStyle}
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

export default function HomeDashboard({
  needNowIslandCount,
  breedableIslandCount,
  activeIslandSessionCount,
  queuePressureCount,
  activeVesselSummary,
  islandCollectionProgress,
  islandCapacitySummary,
  topQueueItems,
  onOpenIslandPlanner,
  onOpenActiveSheets,
  onOpenCollections,
  onOpenQueue,
  onOpenSheet,
  onExportBackup,
  onImportBackup,
  backupMessage,
  isImporting,
})
{
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
      <div className="responsive-page-card" style={{ ...pageCardStyle, display: "grid", gap: "16px" }}>
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
            label="QUEUE PRESSURE"
            value={queuePressureCount}
            description="tracked eggs still needed across the top queue"
            onClick={onOpenQueue}
          />
        </div>

        <div style={{ fontSize: "13px", opacity: 0.68 }}>
          If you just opened the app on mobile, start with <strong>Island Manager</strong> for live capacity, then drop into <strong>Active Sheets</strong> when you need the exact row-level work.
        </div>
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

      <div className="responsive-page-card" style={{ ...pageCardStyle, display: "grid", gap: "14px" }}>
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

      <div className="responsive-page-card" style={{ ...pageCardStyle, display: "grid", gap: "14px" }}>
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
              <button
                key={item.name}
                type="button"
                className="focus-goal-card"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "12px",
                  flexWrap: "wrap",
                  padding: "14px 16px",
                  borderRadius: "14px",
                  background: "rgba(255,255,255,0.035)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "inherit",
                  cursor: "pointer",
                  textAlign: "left",
                }}
                onClick={() => handleOpenQueueItem(item)}
              >
                <div>
                  <div style={{ fontSize: "18px", fontWeight: 700 }}>{item.name}</div>
                  <div style={{ marginTop: "4px", fontSize: "13px", opacity: 0.72 }}>
                    {(item.islands || []).join(" / ")}
                  </div>
                  <div style={{ marginTop: "6px", fontSize: "12px", opacity: 0.62 }}>
                    {item.sheetTitle ? `Open ${item.sheetTitle}` : "Open Breeding Queue"}
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
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
