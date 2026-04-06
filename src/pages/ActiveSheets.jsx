import React, { useMemo } from "react";

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

const actionButtonStyle = {
  padding: "8px 14px",
  borderRadius: "12px",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.08)",
  color: "inherit",
  cursor: "pointer",
  fontWeight: 700,
};

function renderGoalCard(goal, onOpenSheet)
{
  return (
    <div
      key={goal.key}
      style={{
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "16px",
        padding: "16px",
        background: goal.complete
          ? "linear-gradient(180deg, rgba(34,197,94,0.14), rgba(255,255,255,0.02))"
          : "linear-gradient(180deg, rgba(245,158,11,0.08), rgba(255,255,255,0.03))",
      }}
    >
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
          <div style={{ fontSize: "22px", fontWeight: 700 }}>{goal.name}</div>
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
              ? "rgba(34,197,94,0.18)"
              : "rgba(255,255,255,0.08)",
            fontSize: "12px",
            fontWeight: 700,
          }}
        >
          {goal.complete ? "Complete" : `${goal.remaining} left`}
        </div>
      </div>

      <div style={{ marginTop: "12px", display: "grid", gap: "6px", fontSize: "14px", opacity: 0.84 }}>
        <div>{goal.progress}% fulfilled</div>
        <div>{goal.trackedProgress}% tracked</div>
      </div>

      <div className="screen-card-actions" style={{ marginTop: "14px", justifyContent: "flex-end" }}>
        <button
          type="button"
          style={actionButtonStyle}
          onClick={() => onOpenSheet(goal.key)}
        >
          Open Sheet
        </button>
      </div>
    </div>
  );
}

export default function ActiveSheetsPage({
  goals = [],
  onOpenSheet,
  onOpenCollections,
})
{
  const vesselGoals = useMemo(
    () => goals.filter((goal) => goal.type === "vessel"),
    [goals]
  );
  const islandGoals = useMemo(
    () => goals.filter((goal) => goal.type === "island"),
    [goals]
  );

  return (
    <div className="page-surface">
      <div className="responsive-page-card" style={pageCardStyle}>
        <div style={{ fontSize: "32px", fontWeight: 800, letterSpacing: "-0.02em" }}>
          Active Sheets
        </div>
        <div style={{ marginTop: "8px", opacity: 0.75 }}>
          Fast access to the goals that are currently driving queue and island work.
        </div>

        <div className="screen-card-actions" style={{ marginTop: "16px" }}>
          <div style={{ ...actionButtonStyle, cursor: "default" }}>
            {goals.length} active total
          </div>
          <div style={{ ...actionButtonStyle, cursor: "default" }}>
            {vesselGoals.length} vessels
          </div>
          <div style={{ ...actionButtonStyle, cursor: "default" }}>
            {islandGoals.length} island collections
          </div>
        </div>

        {goals.length === 0 && (
          <div style={{ marginTop: "18px", display: "grid", gap: "12px" }}>
            <div style={{ opacity: 0.72 }}>
              No active sheets yet. Activate a sheet from Collections when you want it to start driving operational work.
            </div>
            <div>
              <button type="button" style={actionButtonStyle} onClick={onOpenCollections}>
                Open Collections
              </button>
            </div>
          </div>
        )}
      </div>

      {goals.length > 0 && (
        <>
          <div className="responsive-section-card" style={sectionCardStyle}>
            <div style={{ fontSize: "13px", opacity: 0.68, letterSpacing: "0.08em" }}>
              VESSELS
            </div>
            <div style={{ marginTop: "8px", display: "grid", gap: "12px" }}>
              {vesselGoals.length === 0
                ? <div style={{ opacity: 0.64 }}>No active vessel sheets right now.</div>
                : vesselGoals.map((goal) => renderGoalCard(goal, onOpenSheet))}
            </div>
          </div>

          <div className="responsive-section-card" style={sectionCardStyle}>
            <div style={{ fontSize: "13px", opacity: 0.68, letterSpacing: "0.08em" }}>
              ISLAND COLLECTIONS
            </div>
            <div style={{ marginTop: "8px", display: "grid", gap: "12px" }}>
              {islandGoals.length === 0
                ? <div style={{ opacity: 0.64 }}>No active island collection sheets right now.</div>
                : islandGoals.map((goal) => renderGoalCard(goal, onOpenSheet))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
