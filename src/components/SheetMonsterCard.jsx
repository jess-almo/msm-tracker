import React, { useMemo, useState } from "react";
import {
  getElementChipStyle,
  getMonsterBreedingIslands,
  getMonsterMetadata,
  getMonsterPortrait,
  isRealBreedingIsland,
} from "../utils/monsterMetadata";

const cardStyle = {
  border: "1px solid rgba(255,255,255,0.12)",
  padding: "18px",
  margin: "16px 0",
  borderRadius: "18px",
  background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.025))",
  boxShadow: "0 12px 30px rgba(0,0,0,0.18)",
  backdropFilter: "blur(6px)",
};

const buttonStyle = {
  width: "32px",
  height: "32px",
  borderRadius: "10px",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.12)",
  color: "inherit",
  cursor: "pointer",
  fontSize: "16px",
  lineHeight: 1,
  fontWeight: 700,
  boxShadow: "0 6px 16px rgba(0,0,0,0.14)",
};

const primaryButtonStyle = {
  padding: "10px 14px",
  borderRadius: "12px",
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.1)",
  color: "inherit",
  cursor: "pointer",
  fontWeight: 700,
};

const secondaryButtonStyle = {
  ...primaryButtonStyle,
  background: "rgba(255,255,255,0.06)",
  fontWeight: 600,
};

function getCollectionFocusRankValue(value)
{
  const parsedValue = Number(value);

  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : null;
}

function getBreedAvailability({
  isSheetActive,
  remaining,
  islandName,
  islandPlannerByName,
})
{
  if (!isSheetActive)
  {
    return { disabled: true, reason: "Activate sheet" };
  }

  if (remaining <= 0)
  {
    return { disabled: true, reason: "Covered" };
  }

  const islandEntry = islandPlannerByName?.get?.(islandName);

  if (!islandEntry)
  {
    return { disabled: true, reason: "Blocked" };
  }

  if (!islandEntry.isUnlocked)
  {
    return { disabled: true, reason: "Locked" };
  }

  if (Number(islandEntry.freeSlots || 0) <= 0)
  {
    return { disabled: true, reason: "No slot" };
  }

  return {
    disabled: false,
    reason: `${islandEntry.freeSlots} free`,
  };
}

function MetadataRow({ label, value })
{
  return (
    <div className="sheet-monster-meta-row">
      <div className="sheet-monster-meta-label">{label}</div>
      <div>{value}</div>
    </div>
  );
}

function ManualAdjustRow({
  label,
  value,
  onDecrease,
  onIncrease,
})
{
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        flexWrap: "wrap",
      }}
    >
      <span style={{ minWidth: "74px", fontSize: "13px", fontWeight: 700, opacity: 0.74 }}>
        {label}
      </span>
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          padding: "6px 10px",
          borderRadius: "999px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <button type="button" style={buttonStyle} onClick={onDecrease}>-</button>
        <span style={{ minWidth: "18px", textAlign: "center", fontWeight: 700 }}>{value}</span>
        <button type="button" style={buttonStyle} onClick={onIncrease}>+</button>
      </div>
    </div>
  );
}

export default function SheetMonsterCard({
  monster,
  monsterIndex,
  sheetKey,
  isIslandSheet,
  compact = false,
  isSheetActive,
  breedingSessions,
  islandPlannerByName,
  onAdjustMonster,
  onToggleCollectionFocus,
  onBreedOnIsland,
  onZapReady,
})
{
  const [showBreedOptions, setShowBreedOptions] = useState(false);
  const remaining = Math.max(0, monster.required - monster.zapped - monster.breeding);
  const actualRemaining = Math.max(0, monster.required - monster.zapped);
  const trackedCount = Math.min(monster.required, monster.zapped + monster.breeding);
  const progress = monster.required
    ? Math.round((trackedCount / monster.required) * 100)
    : 0;
  const isComplete = monster.zapped >= monster.required;
  const metadata = getMonsterMetadata(monster.name);
  const portraitSrc = getMonsterPortrait(monster.name);
  const validBreedingIslands = getMonsterBreedingIslands(monster.name);
  const acquisitionType = monster.acquisitionType || "breed";
  const collectionFocusRank = getCollectionFocusRankValue(monster.collectionFocusRank);
  const isCollectionFocused = collectionFocusRank !== null;
  const showInOperations = monster.showInOperations !== false;
  const collectionIslandLabel = isRealBreedingIsland(monster.requirementIsland)
    ? monster.requirementIsland
    : (isRealBreedingIsland(monster.island) ? monster.island : "");
  const shouldShowIslandBreedOptions = !isIslandSheet || showInOperations;
  const canStartBreedingFromSheet = shouldShowIslandBreedOptions && validBreedingIslands.length > 0;
  const assignedZapReadySessions = useMemo(
    () =>
      breedingSessions.filter((session) =>
      {
        return (
          (session.status === "breeding" || session.status === "nursery") &&
          session.sheetId === sheetKey &&
          session.monsterId === monster.name
        );
      }),
    [breedingSessions, monster.name, sheetKey]
  );
  const metadataLabel = isIslandSheet
    ? (
      acquisitionType === "breed"
        ? "Collection island"
        : acquisitionType === "keys"
          ? "Acquired with keys"
          : acquisitionType === "market_relics"
            ? "Acquired with relics"
            : acquisitionType === "seasonal"
              ? "Seasonal availability"
              : "Collection source"
    )
    : "Breeds on";
  const metadataValue = isIslandSheet
    ? (
      collectionIslandLabel
        ? (
          acquisitionType === "breed"
            ? collectionIslandLabel
            : `${collectionIslandLabel}${acquisitionType === "seasonal" ? " · enable when available" : ""}`
        )
        : "Collection-only entry"
    )
    : (
      validBreedingIslands.length > 0
        ? validBreedingIslands.join(" · ")
        : (isRealBreedingIsland(monster.island) ? monster.island : "No verified breeding islands")
    );
  const breedButtonLabel = isIslandSheet
    ? (showInOperations ? "Plan on island" : null)
    : "Breed on...";

  if (compact && isIslandSheet)
  {
    return (
      <div
        className="sheet-monster-card"
        style={{
          border: isCollectionFocused
            ? "1px solid rgba(251,191,36,0.55)"
            : "1px solid rgba(255,255,255,0.1)",
          borderRadius: "16px",
          padding: "14px",
          background: isComplete
            ? "linear-gradient(180deg, rgba(34,197,94,0.12), rgba(255,255,255,0.035))"
            : "rgba(255,255,255,0.035)",
          boxShadow: isCollectionFocused
            ? "0 14px 28px rgba(0,0,0,0.16), 0 0 0 1px rgba(251,191,36,0.12)"
            : "0 10px 24px rgba(0,0,0,0.12)",
          display: "grid",
          gap: "10px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "10px",
            alignItems: "flex-start",
          }}
        >
          <div style={{ minWidth: 0, display: "flex", gap: "14px", alignItems: "center" }}>
            {portraitSrc && (
              <div
                style={{
                  width: "76px",
                  height: "76px",
                  borderRadius: "18px",
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.12), rgba(255,255,255,0.03))",
                  display: "grid",
                  placeItems: "center",
                  overflow: "hidden",
                  boxShadow: "0 10px 20px rgba(0,0,0,0.14)",
                  flexShrink: 0,
                }}
              >
                <img
                  src={portraitSrc}
                  alt={monster.name}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    padding: "5px",
                  }}
                />
              </div>
            )}

            <div style={{ fontSize: "22px", fontWeight: 700, lineHeight: 1.08, minWidth: 0 }}>
              <div>{monster.name}</div>
              <div style={{ marginTop: "4px", fontSize: "12px", opacity: 0.66, fontWeight: 500 }}>
                {metadataValue}
              </div>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gap: "8px",
              justifyItems: "end",
            }}
          >
            {isCollectionFocused && (
              <button
                type="button"
                style={{
                  ...secondaryButtonStyle,
                  padding: "6px 10px",
                  borderRadius: "999px",
                  background: "rgba(251,191,36,0.16)",
                  border: "1px solid rgba(251,191,36,0.35)",
                  fontSize: "12px",
                  fontWeight: 700,
                }}
                onClick={() => onToggleCollectionFocus?.(monsterIndex)}
              >
                Focus #{collectionFocusRank}
              </button>
            )}
            {!isCollectionFocused && (
              <button
                type="button"
                style={{
                  ...secondaryButtonStyle,
                  padding: "6px 10px",
                  borderRadius: "999px",
                  fontSize: "12px",
                  fontWeight: 700,
                }}
                onClick={() => onToggleCollectionFocus?.(monsterIndex)}
              >
                Focus
              </button>
            )}
            <div
              style={{
                padding: "6px 10px",
                borderRadius: "999px",
                border: "1px solid rgba(255,255,255,0.1)",
                background: isComplete ? "rgba(34,197,94,0.16)" : "rgba(255,255,255,0.08)",
                fontSize: "12px",
                fontWeight: 700,
                whiteSpace: "nowrap",
              }}
            >
              {isComplete ? "Collected" : `${actualRemaining} left`}
            </div>
          </div>
        </div>

        {metadata?.elements?.length > 0 && (
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {metadata.elements.map((element) => (
              <span key={`${monster.name}-${element}`} style={getElementChipStyle(element)}>
                {element}
              </span>
            ))}
          </div>
        )}

        <div style={{ fontSize: "13px", opacity: 0.72 }}>
          {isComplete
            ? `${monster.required}/${monster.required} collected`
            : `${monster.zapped}/${monster.required} collected`}
          {!isComplete && monster.breeding > 0 ? ` · ${monster.breeding} waiting to hatch` : ""}
          {!isComplete && monster.breeding <= 0 ? ` · ${actualRemaining} left to place` : ""}
          {isCollectionFocused ? ` · in island focus` : ""}
        </div>

        <div
          style={{
            height: "9px",
            borderRadius: "999px",
            background: "rgba(255,255,255,0.07)",
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div
            style={{
              width: `${Math.min(progress, 100)}%`,
              height: "100%",
              borderRadius: "999px",
              background: isComplete
                ? "linear-gradient(90deg, rgba(34,197,94,0.98), rgba(74,222,128,0.85))"
                : "linear-gradient(90deg, rgba(34,197,94,0.88), rgba(187,247,208,0.5))",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {!isComplete && (
            <button
              type="button"
              style={{
                ...primaryButtonStyle,
                padding: "8px 12px",
                background: "rgba(34,197,94,0.16)",
              }}
              onClick={() => onAdjustMonster?.(monsterIndex, "zapped", 1)}
            >
              Mark Collected
            </button>
          )}
          {isComplete && (
            <button
              type="button"
              style={{
                ...secondaryButtonStyle,
                padding: "6px 10px",
                background: "rgba(239,68,68,0.1)",
                fontSize: "12px",
              }}
              onClick={() => onAdjustMonster?.(monsterIndex, "zapped", -1)}
            >
              Undo
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="sheet-monster-card"
      style={{
        ...cardStyle,
        opacity: isComplete ? 0.74 : 1,
      }}
    >
      <div className="sheet-monster-body">
        <div className="sheet-monster-header">
          <div style={{ minWidth: 0 }}>
            <div
              className="sheet-monster-title"
              style={{ fontSize: "28px", fontWeight: 700, lineHeight: 1.08 }}
            >
              {monster.name}
            </div>
          </div>

          <div
            style={{
              padding: "7px 12px",
              borderRadius: "999px",
              border: "1px solid rgba(255,255,255,0.1)",
              background: isComplete ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.08)",
              fontSize: "13px",
              fontWeight: 700,
              letterSpacing: "0.02em",
              whiteSpace: "nowrap",
            }}
          >
            {isComplete ? "Complete" : `${progress}% tracked`}
          </div>
        </div>

        <div style={{ display: "grid", gap: "8px" }}>
          <MetadataRow label={metadataLabel} value={<span>{metadataValue}</span>} />
          <MetadataRow
            label="Elements"
            value={
              metadata?.elements?.length > 0
                ? (
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", minHeight: "28px" }}>
                    {metadata.elements.map((element) => (
                      <span key={`${monster.name}-${element}`} style={getElementChipStyle(element)}>
                        {element}
                      </span>
                    ))}
                  </div>
                )
                : <span>—</span>
            }
          />
          <MetadataRow label="Combo" value={<span>{metadata?.combo || "—"}</span>} />
          <MetadataRow
            label="Progress"
            value={
              <span>
                {isIslandSheet
                  ? `Needed ${monster.required} · Collected ${monster.zapped} · Tracked ${trackedCount} · Left to place ${actualRemaining}`
                  : `Required ${monster.required} · Zapped ${monster.zapped} · Breeding ${monster.breeding} · Remaining ${remaining}`}
              </span>
            }
          />
        </div>

        <div>
          <div
            style={{
              height: "10px",
              borderRadius: "999px",
              background: "rgba(255,255,255,0.07)",
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div
              style={{
                width: `${Math.min(progress, 100)}%`,
                height: "100%",
                borderRadius: "999px",
                background: isComplete
                  ? "linear-gradient(90deg, rgba(34,197,94,0.95), rgba(74,222,128,0.8))"
                  : "linear-gradient(90deg, rgba(34,197,94,0.85), rgba(187,247,208,0.45))",
              }}
            />
          </div>
        </div>

        <div style={{ display: "grid", gap: "10px" }}>
          <div className="sheet-monster-actions">
            {breedButtonLabel && (
              <button
                type="button"
                style={{
                  ...primaryButtonStyle,
                  background: showBreedOptions ? "rgba(245,158,11,0.18)" : primaryButtonStyle.background,
                  opacity: canStartBreedingFromSheet ? 1 : 0.6,
                }}
                onClick={() => setShowBreedOptions((current) => !current)}
                disabled={!canStartBreedingFromSheet}
              >
                {breedButtonLabel}
              </button>
            )}

            {assignedZapReadySessions.length > 0 && (
              <button
                type="button"
                style={{
                  ...primaryButtonStyle,
                  background: "rgba(34,197,94,0.18)",
                }}
                onClick={() =>
                  onZapReady?.(
                    monsterIndex,
                    assignedZapReadySessions[0].id,
                    assignedZapReadySessions[0].islandId
                  )
                }
              >
                Zap Ready{assignedZapReadySessions.length > 1 ? ` (${assignedZapReadySessions.length})` : ""}
              </button>
            )}

            {!isSheetActive && (
              <div style={{ fontSize: "12px", opacity: 0.7 }}>
                {showInOperations
                  ? "Activate this sheet before starting new linked breeding here."
                  : "This collection entry is tracked here without driving live operations."}
              </div>
            )}
            {isSheetActive && isIslandSheet && !showInOperations && (
              <div style={{ fontSize: "12px", opacity: 0.7 }}>
                This collection entry stays visible here but does not use the operational planner.
              </div>
            )}
          </div>

          {showBreedOptions && canStartBreedingFromSheet && (
            <div
              className="sheet-monster-breed-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
                gap: "8px",
              }}
            >
              {(isIslandSheet ? [collectionIslandLabel].filter(Boolean) : validBreedingIslands).map((islandName) =>
              {
                const availability = getBreedAvailability({
                  isSheetActive,
                  remaining,
                  islandName,
                  islandPlannerByName,
                });

                return (
                  <button
                    key={`${monster.name}-${islandName}`}
                    type="button"
                    style={{
                      ...secondaryButtonStyle,
                      display: "grid",
                      gap: "4px",
                      justifyItems: "start",
                      textAlign: "left",
                      opacity: availability.disabled ? 0.52 : 1,
                      cursor: availability.disabled ? "not-allowed" : "pointer",
                    }}
                    onClick={() =>
                    {
                      if (availability.disabled)
                      {
                        return;
                      }

                      onBreedOnIsland?.(monsterIndex, islandName);
                      setShowBreedOptions(false);
                    }}
                    disabled={availability.disabled}
                  >
                    <span style={{ fontSize: "14px", fontWeight: 700 }}>{islandName}</span>
                    <span style={{ fontSize: "12px", opacity: 0.72 }}>{availability.reason}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <details
          style={{
            marginTop: "2px",
            padding: "12px",
            borderRadius: "14px",
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.03)",
            opacity: 0.82,
          }}
        >
          <summary style={{ cursor: "pointer", fontSize: "13px", fontWeight: 700 }}>
            Manual fallback controls
          </summary>

          <div style={{ marginTop: "10px", fontSize: "12px", opacity: 0.68 }}>
            Use these only when linked breeding/session flow cannot represent what you need yet.
          </div>

          <div style={{ marginTop: "12px", display: "grid", gap: "10px" }}>
            <ManualAdjustRow
              label={isIslandSheet ? "Collected" : "Zapped"}
              value={monster.zapped}
              onDecrease={() => onAdjustMonster?.(monsterIndex, "zapped", -1)}
              onIncrease={() => onAdjustMonster?.(monsterIndex, "zapped", 1)}
            />

            <ManualAdjustRow
              label={isIslandSheet ? "Planned" : "Breeding"}
              value={monster.breeding}
              onDecrease={() => onAdjustMonster?.(monsterIndex, "breeding", -1)}
              onIncrease={() => onAdjustMonster?.(monsterIndex, "breeding", 1)}
            />
          </div>
        </details>
      </div>
    </div>
  );
}
