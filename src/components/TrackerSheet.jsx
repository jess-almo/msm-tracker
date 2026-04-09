import React, { useMemo } from "react";
import { buildVesselFeasibilityEstimate } from "../utils/vesselFeasibility";
import SheetMonsterCard from "./SheetMonsterCard";

const ISLAND_COLLECTION_ART = {
  Plant: "/monsters/worlds/icons/plant.png",
  Cold: "/monsters/worlds/icons/cold.png",
  Air: "/monsters/worlds/icons/air.png",
  Water: "/monsters/worlds/icons/water.png",
  Earth: "/monsters/worlds/icons/earth.png",
  "Fire Haven": "/monsters/worlds/icons/fire-haven.png",
  "Fire Oasis": "/monsters/worlds/icons/fire-oasis.png",
  Light: "/monsters/worlds/icons/light.png",
  Psychic: "/monsters/worlds/icons/psychic.png",
  Faerie: "/monsters/worlds/icons/faerie.png",
  Bone: "/monsters/worlds/icons/bone.png",
  "Magical Sanctum": "/monsters/worlds/icons/magical-sanctum.png",
  "Ethereal Island": "/monsters/worlds/icons/ethereal-island.png",
};

export default function TrackerSheet({
  data,
  islandStates = [],
  islandPlannerByName = new Map(),
  breedingSessions = [],
  assignableSessions = [],
  onAdjustMonster,
  onToggleCollectionFocus,
  onBreedOnIsland,
  onZapReady,
  onAssignExistingBreeding,
  onActivateAndAssignExistingBreeding,
})
{
  const isIslandSheet = data.type === "island";
  const islandCollectionIcon = isIslandSheet ? ISLAND_COLLECTION_ART[data.island] || "" : "";
  const totals = useMemo(() =>
  {
    const required = data.monsters.reduce((s, m) => s + m.required, 0);
    const zapped = data.monsters.reduce((s, m) => s + m.zapped, 0);
    const breeding = data.monsters.reduce((s, m) => s + m.breeding, 0);
    const tracked = zapped + breeding;
    const progress = required ? Math.round((tracked / required) * 100) : 0;
    const isComplete = zapped >= required;

    return { required, zapped, breeding, tracked, progress, isComplete };
  }, [data]);
  const vesselFeasibility = useMemo(() =>
  {
    if (isIslandSheet)
    {
      return null;
    }

    return buildVesselFeasibilityEstimate({
      sheet: data,
      islandStates,
      breedingSessions,
      deadlineHoursRemaining: null,
    });
  }, [breedingSessions, data, islandStates, isIslandSheet]);

  const cardStyle = {
    border: "1px solid rgba(255,255,255,0.12)",
    padding: "18px",
    margin: "16px 0",
    borderRadius: "18px",
    background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.025))",
    boxShadow: "0 12px 30px rgba(0,0,0,0.18)",
    backdropFilter: "blur(6px)",
  };

  const statRowStyle = {
    marginTop: "12px",
    fontSize: "14px",
    opacity: 0.92,
    padding: "10px 12px",
    borderRadius: "12px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
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

  return (
    <div
      className="page-surface"
      style={{
        maxWidth:"960px",
        margin:"0 auto",
        opacity: data.isActive || isIslandSheet ? 1 : 0.45,
        transition: "opacity 160ms ease",
      }}
    >
      <h2>{data.sheetTitle}</h2>
      {islandCollectionIcon && (
        <div
          style={{
            marginTop: "8px",
            marginBottom: "10px",
            width: "84px",
            height: "84px",
            borderRadius: "24px",
            border: "1px solid rgba(255,255,255,0.1)",
            background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.18), rgba(255,255,255,0.04))",
            display: "grid",
            placeItems: "center",
            boxShadow: "0 14px 28px rgba(0,0,0,0.18)",
            justifySelf: "center",
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          <img
            src={islandCollectionIcon}
            alt={`${data.island} icon`}
            style={{
              width: "62px",
              height: "62px",
              objectFit: "contain",
              display: "block",
            }}
          />
        </div>
      )}
            <div style={{marginTop:"8px", marginBottom:"18px"}}>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", gap:"12px", flexWrap:"wrap", marginBottom:"10px"}}>
          <div style={{fontSize:"18px", opacity:0.9}}>
            {isIslandSheet
              ? `${totals.zapped}/${totals.required} collected · ${totals.breeding} planned`
              : `${totals.zapped}/${totals.required} zapped · ${totals.breeding} breeding`}
          </div>
          <div
            style={{
              padding:"7px 12px",
              borderRadius:"999px",
              border:"1px solid rgba(255,255,255,0.1)",
              background: totals.isComplete ? "rgba(34,197,94,0.18)" : "rgba(255,255,255,0.08)",
              fontSize:"13px",
              fontWeight:700,
              letterSpacing:"0.02em",
            }}
          >
            {totals.isComplete
              ? (isIslandSheet ? "Collection Complete" : "Complete")
              : `${totals.progress}% tracked`}
          </div>
        </div>

        <div
          style={{
            height:"14px",
            borderRadius:"999px",
            background:"rgba(255,255,255,0.07)",
            overflow:"hidden",
            border:"1px solid rgba(255,255,255,0.08)",
            boxShadow:"inset 0 1px 4px rgba(0,0,0,0.16)",
          }}
        >
          <div
            style={{
              width:`${Math.min(totals.progress, 100)}%`,
              height:"100%",
              borderRadius:"999px",
              background: totals.isComplete
                ? "linear-gradient(90deg, rgba(34,197,94,0.98), rgba(74,222,128,0.85))"
                : "linear-gradient(90deg, rgba(34,197,94,0.88), rgba(187,247,208,0.5))",
            }}
          />
        </div>
      </div>

      {!isIslandSheet && vesselFeasibility && (
        <div
          style={{
            ...cardStyle,
            background: "linear-gradient(180deg, rgba(59,130,246,0.12), rgba(255,255,255,0.03))",
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
              <div style={{ fontSize: "20px", fontWeight: 700 }}>Vessel Timing Snapshot</div>
              <div style={{ marginTop: "4px", fontSize: "13px", opacity: 0.72 }}>
                Compact read-only estimate using current known standard breeding times only.
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
              {vesselFeasibility.estimateMode === "insufficient_data"
                ? "Insufficient data"
                : vesselFeasibility.estimateMode === "partial"
                  ? "Partial"
                  : "Exact"}
            </div>
          </div>

          <div
            style={{
              marginTop: "14px",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: "10px",
            }}
          >
            <div style={statRowStyle}>
              Remaining eggs: {vesselFeasibility.totalRemainingEggs}
            </div>
            <div style={statRowStyle}>
              Timing coverage: {Math.round((vesselFeasibility.coverageRatio || 0) * 100)}%
            </div>
            <div style={statRowStyle}>
              Missing timing: {vesselFeasibility.uncoveredMonsters.length}
            </div>
            <div style={statRowStyle}>
              Slowest known island: {vesselFeasibility.bottleneckIslands[0]
                ? `${vesselFeasibility.bottleneckIslands[0].island} ${vesselFeasibility.bottleneckIslands[0].hours}h`
                : "—"}
            </div>
          </div>

          <div style={{ ...statRowStyle, marginTop: "12px" }}>
            {vesselFeasibility.blockedByCapacityMonsters.length > 0
              ? `Blocked by current breeder capacity: ${vesselFeasibility.blockedByCapacityMonsters.join(" · ")}`
              : "No breeder-capacity blockers detected among the monsters with covered timing data."}
          </div>
        </div>
      )}

      {!isIslandSheet && assignableSessions.length > 0 && (
        <div
          style={{
            ...cardStyle,
            background: "linear-gradient(180deg, rgba(245,158,11,0.12), rgba(255,255,255,0.03))",
          }}
        >
          <div style={{ fontSize: "20px", fontWeight: 700 }}>Assign existing breeding</div>
          <div style={{ marginTop: "6px", opacity: 0.76 }}>
            Existing unassigned breeding matches this vessel. Claim it manually instead of starting a new breed.
          </div>

          <div style={{ marginTop: "14px", display: "grid", gap: "10px" }}>
            {assignableSessions.map((session) => (
              <AssignableSessionRow
                key={session.id}
                session={session}
                isSheetActive={data.isActive}
                onAssignExistingBreeding={onAssignExistingBreeding}
                onActivateAndAssignExistingBreeding={onActivateAndAssignExistingBreeding}
                buttonStyle={buttonStyle}
              />
            ))}
          </div>
        </div>
      )}

      <div
        style={
          isIslandSheet
            ? {
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: "12px",
                alignItems: "start",
              }
            : {
                display: "grid",
                gap: "0px",
              }
        }
      >
        {data.monsters.map((monster, monsterIndex) => (
          <SheetMonsterCard
            key={`${data.key}-${monster.name}-${monsterIndex}`}
            monster={monster}
            monsterIndex={monsterIndex}
            sheetKey={data.key}
            isIslandSheet={isIslandSheet}
            compact={isIslandSheet}
            isSheetActive={data.isActive}
            breedingSessions={breedingSessions}
            islandPlannerByName={islandPlannerByName}
            onAdjustMonster={onAdjustMonster}
            onToggleCollectionFocus={onToggleCollectionFocus}
            onBreedOnIsland={onBreedOnIsland}
            onZapReady={onZapReady}
          />
        ))}
      </div>
    </div>
  );
}

function AssignableSessionRow({
  session,
  isSheetActive,
  onAssignExistingBreeding,
  onActivateAndAssignExistingBreeding,
  buttonStyle,
})
{
  const [confirmActivate, setConfirmActivate] = React.useState(false);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "12px",
        flexWrap: "wrap",
        padding: "12px",
        borderRadius: "14px",
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(255,255,255,0.04)",
      }}
    >
      <div>
        <div style={{ fontSize: "18px", fontWeight: 700 }}>{session.monsterId}</div>
        <div style={{ marginTop: "4px", fontSize: "14px", opacity: 0.74 }}>
          Island: {session.islandId} · Unassigned breeding
        </div>
      </div>

      {isSheetActive ? (
        <button
          style={{
            ...buttonStyle,
            width: "auto",
            height: "auto",
            padding: "10px 14px",
            fontSize: "14px",
          }}
          onClick={() => onAssignExistingBreeding?.(session.id)}
        >
          Assign existing breeding
        </button>
      ) : confirmActivate ? (
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button
            style={{
              ...buttonStyle,
              width: "auto",
              height: "auto",
              padding: "10px 14px",
              fontSize: "14px",
            }}
            onClick={() => onActivateAndAssignExistingBreeding?.(session.id)}
          >
            Activate and Assign
          </button>
          <button
            style={{
              ...buttonStyle,
              width: "auto",
              height: "auto",
              padding: "10px 14px",
              fontSize: "14px",
            }}
            onClick={() => setConfirmActivate(false)}
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          style={{
            ...buttonStyle,
            width: "auto",
            height: "auto",
            padding: "10px 14px",
            fontSize: "14px",
          }}
          onClick={() => setConfirmActivate(true)}
        >
          Activate and Assign
        </button>
      )}
    </div>
  );
}
