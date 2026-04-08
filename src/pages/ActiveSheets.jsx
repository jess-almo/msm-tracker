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

function getGoalOperationalLabel(goal)
{
  if (goal.complete)
  {
    return "Collected";
  }

  if ((goal.trackedProgress || 0) > (goal.progress || 0))
  {
    return "In Motion";
  }

  if ((goal.progress || 0) > 0)
  {
    return "Progress";
  }

  return "Ready to Start";
}

function getGoalCardTone(goal)
{
  if (goal.complete)
  {
    return {
      border: "1px solid rgba(34,197,94,0.22)",
      background: "linear-gradient(180deg, rgba(34,197,94,0.14), rgba(255,255,255,0.02))",
      chipBackground: "rgba(34,197,94,0.18)",
    };
  }

  if ((goal.trackedProgress || 0) > (goal.progress || 0))
  {
    return {
      border: "1px solid rgba(59,130,246,0.2)",
      background: "linear-gradient(180deg, rgba(59,130,246,0.1), rgba(255,255,255,0.03))",
      chipBackground: "rgba(59,130,246,0.16)",
    };
  }

  return {
    border: "1px solid rgba(245,158,11,0.18)",
    background: "linear-gradient(180deg, rgba(245,158,11,0.08), rgba(255,255,255,0.03))",
    chipBackground: "rgba(255,255,255,0.08)",
  };
}

function renderGoalCard(goal, onOpenSheet)
{
  const tone = getGoalCardTone(goal);
  const statusLabel = getGoalOperationalLabel(goal);

  return (
    <div
      key={goal.key}
      onClick={() => onOpenSheet(goal.key)}
      style={{
        border: tone.border,
        borderRadius: "16px",
        padding: "16px",
        background: tone.background,
        cursor: "pointer",
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
            background: tone.chipBackground,
            fontSize: "12px",
            fontWeight: 700,
          }}
        >
          {goal.complete ? "Complete" : statusLabel}
        </div>
      </div>

      <div style={{ marginTop: "12px", display: "grid", gap: "6px", fontSize: "14px", opacity: 0.84 }}>
        <div>{goal.remaining} left</div>
        <div>{goal.progress}% fulfilled · {goal.trackedProgress}% tracked</div>
      </div>

      <div className="screen-card-actions" style={{ marginTop: "14px", justifyContent: "flex-end" }}>
        <button
          type="button"
          style={actionButtonStyle}
          onClick={(event) =>
          {
            event.stopPropagation();
            onOpenSheet(goal.key);
          }}
        >
          Open Sheet
        </button>
      </div>
    </div>
  );
}

function renderFocusedGoalCard(goal, onOpenSheet, onMoveGoalUp, onMoveGoalDown, canMoveUp, canMoveDown)
{
  const tone = getGoalCardTone(goal);
  const statusLabel = getGoalOperationalLabel(goal);

  return (
    <div
      key={goal.key}
      style={{
        border: tone.border,
        borderRadius: "16px",
        padding: "16px",
        background: tone.background,
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
          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ fontSize: "22px", fontWeight: 700 }}>{goal.name}</div>
            <div
              style={{
                padding: "5px 10px",
                borderRadius: "999px",
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.08)",
                fontSize: "11px",
                fontWeight: 700,
              }}
            >
              Focus #{goal.focusRank || "—"}
            </div>
          </div>
          <div style={{ marginTop: "4px", fontSize: "13px", opacity: 0.72 }}>
            {goal.collectionName} · {goal.title}
          </div>
        </div>

        <div
          style={{
            padding: "6px 12px",
            borderRadius: "999px",
            border: "1px solid rgba(255,255,255,0.1)",
            background: tone.chipBackground,
            fontSize: "12px",
            fontWeight: 700,
          }}
        >
          {goal.complete ? "Complete" : statusLabel}
        </div>
      </div>

      <div style={{ marginTop: "12px", display: "grid", gap: "6px", fontSize: "14px", opacity: 0.84 }}>
        <div>{goal.remaining} left</div>
        <div>{goal.progress}% fulfilled · {goal.trackedProgress}% tracked</div>
      </div>

      <div className="screen-card-actions" style={{ marginTop: "14px", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button
            type="button"
            style={{
              ...actionButtonStyle,
              opacity: canMoveUp ? 1 : 0.5,
              cursor: canMoveUp ? "pointer" : "not-allowed",
            }}
            onClick={() => onMoveGoalUp?.(goal.key)}
            disabled={!canMoveUp}
          >
            Move Up
          </button>
          <button
            type="button"
            style={{
              ...actionButtonStyle,
              opacity: canMoveDown ? 1 : 0.5,
              cursor: canMoveDown ? "pointer" : "not-allowed",
            }}
            onClick={() => onMoveGoalDown?.(goal.key)}
            disabled={!canMoveDown}
          >
            Move Down
          </button>
        </div>

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
  onMoveGoalUp,
  onMoveGoalDown,
  focusLimit = 5,
})
{
  const vesselGoals = useMemo(
    () => goals.filter((goal) => goal.type === "vessel" && !goal.complete),
    [goals]
  );
  const islandGoals = useMemo(
    () => goals.filter((goal) => goal.type === "island" && !goal.complete),
    [goals]
  );
  const incompleteGoals = useMemo(
    () => goals.filter((goal) => !goal.complete),
    [goals]
  );
  const inMotionGoals = useMemo(
    () => goals.filter((goal) => !goal.complete && (goal.trackedProgress || 0) > (goal.progress || 0)),
    [goals]
  );
  const readyToStartGoals = useMemo(
    () => goals.filter((goal) => !goal.complete && (goal.progress || 0) === 0 && (goal.trackedProgress || 0) === 0),
    [goals]
  );
  const collectedGoals = useMemo(
    () => goals.filter((goal) => goal.complete),
    [goals]
  );
  const remainingTotal = useMemo(
    () => incompleteGoals.reduce((sum, goal) => sum + Number(goal.remaining || 0), 0),
    [incompleteGoals]
  );
  const focusedGoalCount = goals.length;

  return (
    <div className="page-surface">
      <div className="responsive-page-card" style={pageCardStyle}>
        <div style={{ fontSize: "32px", fontWeight: 800, letterSpacing: "-0.02em" }}>
          Active Sheets
        </div>
        <div style={{ marginTop: "8px", opacity: 0.75 }}>
          Fast access to the goals that are currently driving queue and island work.
        </div>

        <div className="dashboard-command-grid" style={{ marginTop: "16px" }}>
          <div style={{ ...sectionCardStyle, padding: "14px", borderRadius: "16px" }}>
            <div style={{ fontSize: "13px", opacity: 0.7, letterSpacing: "0.06em" }}>
              NEED NOW
            </div>
            <div style={{ marginTop: "8px", fontSize: "24px", fontWeight: 700 }}>
              {focusedGoalCount} / {focusLimit}
            </div>
            <div style={{ marginTop: "6px", opacity: 0.72 }}>
              focused operational sheets in rotation
            </div>
          </div>

          <div style={{ ...sectionCardStyle, padding: "14px", borderRadius: "16px" }}>
            <div style={{ fontSize: "13px", opacity: 0.7, letterSpacing: "0.06em" }}>
              IN MOTION
            </div>
            <div style={{ marginTop: "8px", fontSize: "24px", fontWeight: 700 }}>
              {inMotionGoals.length}
            </div>
            <div style={{ marginTop: "6px", opacity: 0.72 }}>
              sheets with tracked work ahead of zaps
            </div>
          </div>

          <div style={{ ...sectionCardStyle, padding: "14px", borderRadius: "16px" }}>
            <div style={{ fontSize: "13px", opacity: 0.7, letterSpacing: "0.06em" }}>
              READY TO START
            </div>
            <div style={{ marginTop: "8px", fontSize: "24px", fontWeight: 700 }}>
              {readyToStartGoals.length}
            </div>
            <div style={{ marginTop: "6px", opacity: 0.72 }}>
              active sheets with no progress logged yet
            </div>
          </div>

          <div style={{ ...sectionCardStyle, padding: "14px", borderRadius: "16px" }}>
            <div style={{ fontSize: "13px", opacity: 0.7, letterSpacing: "0.06em" }}>
              REMAINING
            </div>
            <div style={{ marginTop: "8px", fontSize: "24px", fontWeight: 700 }}>
              {remainingTotal}
            </div>
            <div style={{ marginTop: "6px", opacity: 0.72 }}>
              total eggs or collection entries still outstanding
            </div>
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
              {`VESSELS (${vesselGoals.length})`}
            </div>
            <div style={{ marginTop: "6px", fontSize: "13px", opacity: 0.64 }}>
              Goal sheets currently driving queue and zapping pressure.
            </div>
            <div className="collections-card-grid" style={{ marginTop: "12px" }}>
              {vesselGoals.length === 0
                ? <div style={{ opacity: 0.64 }}>No active vessel sheets right now.</div>
                : vesselGoals.map((goal, index) =>
                  renderFocusedGoalCard(
                    goal,
                    onOpenSheet,
                    onMoveGoalUp,
                    onMoveGoalDown,
                    index > 0,
                    index < vesselGoals.length - 1
                  )
                )}
            </div>
          </div>

          <div className="responsive-section-card" style={sectionCardStyle}>
            <div style={{ fontSize: "13px", opacity: 0.68, letterSpacing: "0.08em" }}>
              {`ISLAND COLLECTIONS (${islandGoals.length})`}
            </div>
            <div style={{ marginTop: "6px", fontSize: "13px", opacity: 0.64 }}>
              Base island ownership trackers that are currently part of the working set.
            </div>
            <div className="collections-card-grid" style={{ marginTop: "12px" }}>
              {islandGoals.length === 0
                ? <div style={{ opacity: 0.64 }}>No active island collection sheets right now.</div>
                : islandGoals.map((goal, index) =>
                  renderFocusedGoalCard(
                    goal,
                    onOpenSheet,
                    onMoveGoalUp,
                    onMoveGoalDown,
                    vesselGoals.length + index > 0,
                    vesselGoals.length + index < goals.length - 1
                  )
                )}
            </div>
          </div>

          {collectedGoals.length > 0 && (
            <div className="responsive-section-card" style={sectionCardStyle}>
              <div style={{ fontSize: "13px", opacity: 0.68, letterSpacing: "0.08em" }}>
                {`COLLECTED (${collectedGoals.length})`}
              </div>
              <div style={{ marginTop: "6px", fontSize: "13px", opacity: 0.64 }}>
                Finished active sheets that still stay visible here for quick reopening.
              </div>
              <div className="collections-card-grid" style={{ marginTop: "12px" }}>
                {collectedGoals.map((goal) => renderGoalCard(goal, onOpenSheet))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
