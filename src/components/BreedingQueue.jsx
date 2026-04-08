import React, { useMemo, useState } from "react";
import {
  formatCategoryLabel,
  getElementChipStyle,
  getMonsterMetadata,
} from "../utils/monsterMetadata";
import {
  buildBreedingNowEntriesFromSessions,
  buildBlockedBreedingQueue,
  buildReadyBreedingQueue,
} from "../utils/queue";

const cardStyle = {
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "16px",
  padding: "16px",
  background: "rgba(255,255,255,0.035)",
  boxShadow: "0 10px 24px rgba(0,0,0,0.12)",
};

const actionButtonStyle = {
  padding: "8px 12px",
  borderRadius: "10px",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "inherit",
  cursor: "pointer",
  fontWeight: 700,
};

const tabStyle = {
  padding: "8px 14px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.08)",
  color: "inherit",
  cursor: "pointer",
  fontWeight: 700,
};

function compareOperationalItems(a, b)
{
  if ((a.islandOrder ?? 999) !== (b.islandOrder ?? 999))
  {
    return (a.islandOrder ?? 999) - (b.islandOrder ?? 999);
  }

  if ((a.activatedOrder ?? 999) !== (b.activatedOrder ?? 999))
  {
    return (a.activatedOrder ?? 999) - (b.activatedOrder ?? 999);
  }

  if ((a.sheetPriority ?? 999) !== (b.sheetPriority ?? 999))
  {
    return (a.sheetPriority ?? 999) - (b.sheetPriority ?? 999);
  }

  if ((a.sheetTitle || "") !== (b.sheetTitle || ""))
  {
    return (a.sheetTitle || "").localeCompare(b.sheetTitle || "");
  }

  if ((a.island || "") !== (b.island || ""))
  {
    return (a.island || "").localeCompare(b.island || "");
  }

  if ((a.monsterIndex ?? 999) !== (b.monsterIndex ?? 999))
  {
    return (a.monsterIndex ?? 999) - (b.monsterIndex ?? 999);
  }

  return a.name.localeCompare(b.name);
}

function QueueCard({
  entry,
  actionLabel,
  actionTone,
  onAction,
  statusLine,
  detailLine,
})
{
  return (
    <div style={cardStyle}>
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
          <div style={{ fontSize: "24px", fontWeight: 700 }}>{entry.name}</div>

          <div style={{ marginTop: "4px", fontSize: "14px", opacity: 0.78 }}>
            Island: {entry.island || "—"}
          </div>

          <div style={{ marginTop: "4px", fontSize: "14px", opacity: 0.78 }}>
            Sheet: {entry.sheetTitle}
          </div>

          {entry.metadata?.elements?.length > 0 && (
            <div style={{ marginTop: "10px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {entry.metadata.elements.map((element) => (
                <span key={`${entry.id}-${entry.island}-${element}`} style={getElementChipStyle(element)}>
                  {element}
                </span>
              ))}
            </div>
          )}

          {(entry.metadata?.combo || entry.metadata?.category) && (
            <div style={{ marginTop: "8px", fontSize: "13px", opacity: 0.72 }}>
              {entry.metadata?.combo && `Combo: ${entry.metadata.combo}`}
              {entry.metadata?.combo && entry.metadata?.category && " · "}
              {entry.metadata?.category && `Category: ${formatCategoryLabel(entry.metadata.category)}`}
            </div>
          )}

          <div style={{ marginTop: "8px", fontSize: "14px", opacity: 0.72 }}>
            {statusLine}
          </div>

          {detailLine && (
            <div style={{ marginTop: "6px", fontSize: "13px", opacity: 0.64 }}>
              {detailLine}
            </div>
          )}
        </div>

        {actionLabel && onAction ? (
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button
              style={{
                ...actionButtonStyle,
                background: actionTone,
              }}
              onClick={onAction}
            >
              {actionLabel}
            </button>
          </div>
        ) : (
          <div
            style={{
              display: "inline-flex",
              padding: "8px 12px",
              borderRadius: "999px",
              border: "1px solid rgba(239,68,68,0.16)",
              background: "rgba(239,68,68,0.1)",
              fontSize: "12px",
              fontWeight: 700,
            }}
          >
            Blocked
          </div>
        )}
      </div>
    </div>
  );
}

export default function BreedingQueue({
  sheets,
  breedingSessions,
  islandPlannerData,
  onZapBreedingSession,
  onBreedFromQueue,
})
{
  const readyQueueEntries = useMemo(
    () => buildReadyBreedingQueue(sheets, islandPlannerData),
    [sheets, islandPlannerData]
  );
  const blockedQueueEntries = useMemo(
    () => buildBlockedBreedingQueue(sheets, islandPlannerData),
    [sheets, islandPlannerData]
  );
  const breedingNowEntries = useMemo(
    () => buildBreedingNowEntriesFromSessions(breedingSessions, sheets),
    [breedingSessions, sheets]
  );
  const islandPlannerByName = useMemo(
    () => new Map((islandPlannerData || []).map((island) => [island.island, island])),
    [islandPlannerData]
  );

  const enrichedReadyItems = useMemo(() =>
  {
    return readyQueueEntries.map((entry) => ({
      ...entry,
      metadata: getMonsterMetadata(entry.name),
    }));
  }, [readyQueueEntries]);
  const enrichedBlockedItems = useMemo(() =>
  {
    return blockedQueueEntries.map((entry) => ({
      ...entry,
      metadata: getMonsterMetadata(entry.name),
      islandOrder: islandPlannerByName.get(entry.island)?.orderIndex ?? entry.islandOrder ?? 999,
    }));
  }, [blockedQueueEntries, islandPlannerByName]);

  const enrichedBreedingNow = useMemo(() =>
  {
    return breedingNowEntries.map((entry) => ({
      ...entry,
      metadata: getMonsterMetadata(entry.name),
      islandOrder: islandPlannerByName.get(entry.island)?.orderIndex ?? 999,
    }));
  }, [breedingNowEntries, islandPlannerByName]);

  const zapItems = useMemo(
    () =>
      enrichedBreedingNow
        .filter((entry) => entry.status === "breeding" && entry.sheetKey && entry.sessionIds.length > 0)
        .sort(compareOperationalItems),
    [enrichedBreedingNow]
  );
  const breedItems = useMemo(
    () => [...enrichedReadyItems].sort(compareOperationalItems),
    [enrichedReadyItems]
  );
  const blockedItems = useMemo(
    () => [...enrichedBlockedItems].sort(compareOperationalItems),
    [enrichedBlockedItems]
  );
  const nurseryCount = useMemo(
    () =>
      enrichedBreedingNow
        .filter((entry) => entry.status === "nursery")
        .reduce((total, entry) => total + entry.count, 0),
    [enrichedBreedingNow]
  );
  const unassignedBreedingCount = useMemo(
    () =>
      enrichedBreedingNow
        .filter((entry) => entry.status === "breeding" && !entry.sheetKey)
        .reduce((total, entry) => total + entry.count, 0),
    [enrichedBreedingNow]
  );
  const defaultMode = zapItems.length > 0
    ? "zap"
    : breedItems.length > 0
      ? "breed"
      : "blocked";
  const [activeMode, setActiveMode] = useState(defaultMode);
  const showingZapRun = activeMode === "zap";
  const showingBreedRun = activeMode === "breed";
  const currentEntries = showingZapRun ? zapItems : showingBreedRun ? breedItems : blockedItems;
  const currentModeLabel = showingZapRun
    ? "Ready to Zap"
    : showingBreedRun
      ? "Ready to Breed"
      : "Pipeline Blocked";

  return (
    <div
      className="responsive-page-card"
      style={{
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: "22px",
        marginBottom: "28px",
        background: "linear-gradient(180deg, rgba(255,255,255,0.065), rgba(255,255,255,0.025))",
        boxShadow: "0 18px 40px rgba(0,0,0,0.2)",
        backdropFilter: "blur(8px)",
      }}
    >
      <div>
        <div
          style={{
            fontSize: "32px",
            fontWeight: 800,
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
          }}
        >
          Breeding Queue
        </div>
        <div style={{ marginTop: "6px", opacity: 0.75 }}>
          Clear tracked eggs that are ready to leave the board, then refill open breeders in player order.
        </div>
      </div>

      <div style={{ marginTop: "16px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <button
          style={{
            ...tabStyle,
            background: showingZapRun ? "rgba(59,130,246,0.18)" : tabStyle.background,
          }}
          onClick={() => setActiveMode("zap")}
        >
          Ready to Zap ({zapItems.length})
        </button>
        <button
          style={{
            ...tabStyle,
            background: showingZapRun ? tabStyle.background : "rgba(245,158,11,0.18)",
          }}
          onClick={() => setActiveMode("breed")}
        >
          Ready to Breed ({breedItems.length})
        </button>
        <button
          style={{
            ...tabStyle,
            background: activeMode === "blocked" ? "rgba(239,68,68,0.16)" : tabStyle.background,
          }}
          onClick={() => setActiveMode("blocked")}
        >
          Pipeline Blocked ({blockedItems.length})
        </button>
      </div>

      <div style={{ marginTop: "16px", fontSize: "18px", fontWeight: 700 }}>
        {`${currentModeLabel} · ${currentEntries.length} remaining`}
      </div>

      {(unassignedBreedingCount > 0 || nurseryCount > 0) && (
        <div style={{ marginTop: "8px", fontSize: "13px", opacity: 0.7 }}>
          {unassignedBreedingCount > 0 && `${unassignedBreedingCount} unassigned breeder egg${unassignedBreedingCount === 1 ? "" : "s"}`}
          {unassignedBreedingCount > 0 && nurseryCount > 0 && " · "}
          {nurseryCount > 0 && `${nurseryCount} hatching egg${nurseryCount === 1 ? "" : "s"}`}
        </div>
      )}

      {currentEntries.length === 0 ? (
        <div style={{ marginTop: "16px", opacity: 0.75 }}>
          {showingZapRun
            ? "No tracked breeder-side eggs are ready to clear right now."
            : showingBreedRun
              ? "No tracked queue work is currently ready to breed on an open island."
              : "Nothing is currently blocked once valid breeding islands and open slots are checked."}
        </div>
      ) : (
        <div style={{ marginTop: "16px", display: "grid", gap: "12px" }}>
          {showingZapRun
            ? currentEntries.map((entry) => (
                <QueueCard
                  key={entry.id}
                  entry={entry}
                  actionLabel="Zap"
                  actionTone="rgba(59,130,246,0.14)"
                  onAction={() => onZapBreedingSession(entry)}
                  statusLine={`Breeder egg ready${entry.count > 1 ? ` · ${entry.count} eggs grouped` : ""} · Zapped ${entry.zapped}/${entry.required}`}
                />
              ))
            : showingBreedRun
              ? currentEntries.map((entry) => (
                  <QueueCard
                    key={entry.id}
                    entry={entry}
                    actionLabel="Breed"
                    actionTone="rgba(245,158,11,0.14)"
                    onAction={() => onBreedFromQueue(entry)}
                    statusLine={`Need ${entry.remaining} more · Zapped ${entry.zapped}/${entry.required} · Breeding ${entry.breeding}/${entry.required}`}
                  />
                ))
              : currentEntries.map((entry) => (
                  <QueueCard
                    key={entry.id}
                    entry={entry}
                    statusLine={`Need ${entry.remaining} more · ${entry.blockReason}`}
                    detailLine={entry.blockDetails}
                  />
                ))}
        </div>
      )}
    </div>
  );
}
