import { BREEDING_COMBOS_NATURAL } from "../data/breedingCombos";
import { getMonsterBreedingIslands } from "./monsterMetadata";

const BREEDING_TIME_BY_MONSTER = new Map(
  BREEDING_COMBOS_NATURAL.map((entry) => [entry.monsterName, entry])
);

function parseDurationToHours(duration)
{
  if (typeof duration !== "string" || !duration.trim())
  {
    return null;
  }

  const normalized = duration.trim().toLowerCase();
  const matches = [...normalized.matchAll(/(\d+(?:\.\d+)?)\s*([dhms])/g)];

  if (matches.length === 0)
  {
    return null;
  }

  let totalHours = 0;

  matches.forEach((match) =>
  {
    const value = Number(match[1]);
    const unit = match[2];

    if (!Number.isFinite(value))
    {
      return;
    }

    if (unit === "d")
    {
      totalHours += value * 24;
      return;
    }

    if (unit === "h")
    {
      totalHours += value;
      return;
    }

    if (unit === "m")
    {
      totalHours += value / 60;
      return;
    }

    if (unit === "s")
    {
      totalHours += value / 3600;
    }
  });

  return totalHours > 0 ? totalHours : null;
}

function roundHours(value)
{
  if (!Number.isFinite(value))
  {
    return null;
  }

  return Math.round(value * 100) / 100;
}

function getStandardBreedingHours(monsterName)
{
  const entry = BREEDING_TIME_BY_MONSTER.get(monsterName);

  if (!entry)
  {
    return null;
  }

  return parseDurationToHours(entry.breedingTime);
}

function getRemainingEggs(monster)
{
  return Math.max(
    0,
    Number(monster.required || 0) -
      Number(monster.zapped || 0) -
      Number(monster.breeding || 0)
  );
}

function createBreederSlots(totalSlots, reservedUnknownSlots)
{
  const usableSlots = Math.max(0, totalSlots - reservedUnknownSlots);
  return Array.from({ length: usableSlots }, () => 0);
}

function scheduleDurationOnIsland(slots, durationHours)
{
  if (!Array.isArray(slots) || slots.length === 0 || !Number.isFinite(durationHours))
  {
    return false;
  }

  let slotIndex = 0;

  for (let index = 1; index < slots.length; index += 1)
  {
    if (slots[index] < slots[slotIndex])
    {
      slotIndex = index;
    }
  }

  slots[slotIndex] += durationHours;
  return true;
}

function formatIslandLoads(islandLoads)
{
  return Object.entries(islandLoads)
    .map(([island, slots]) => ({
      island,
      hours: roundHours(Math.max(0, ...slots, 0)),
    }))
    .sort((a, b) => b.hours - a.hours || a.island.localeCompare(b.island))
    .filter((entry) => entry.hours > 0);
}

function getRelevantActiveBreedingSessions(sheet, breedingSessions)
{
  return (Array.isArray(breedingSessions) ? breedingSessions : []).filter((session) =>
  {
    return (
      session?.status === "breeding" &&
      session.sheetId === sheet.key
    );
  });
}

function createCapacityMap(islandStates, activeSessions)
{
  const activeSessionsByIsland = activeSessions.reduce((map, session) =>
  {
    const next = map;
    const existing = next.get(session.islandId) || [];
    existing.push(session);
    next.set(session.islandId, existing);
    return next;
  }, new Map());

  const capacityByIsland = new Map();

  (Array.isArray(islandStates) ? islandStates : []).forEach((islandState) =>
  {
    const totalBreeders = islandState.isUnlocked
      ? Math.max(0, Number(islandState.breedingStructures || 0))
      : 0;
    const islandSessions = activeSessionsByIsland.get(islandState.name) || [];
    const unknownDurationSessions = islandSessions.filter(
      (session) => !Number.isFinite(getStandardBreedingHours(session.monsterId))
    );
    const coveredSessions = islandSessions.filter((session) =>
      Number.isFinite(getStandardBreedingHours(session.monsterId))
    );
    const slots = createBreederSlots(totalBreeders, unknownDurationSessions.length);

    coveredSessions.forEach((session) =>
    {
      scheduleDurationOnIsland(slots, getStandardBreedingHours(session.monsterId));
    });

    capacityByIsland.set(islandState.name, {
      totalBreeders,
      unknownActiveBlockers: unknownDurationSessions.length,
      coveredActiveSessions: coveredSessions.length,
      slots,
    });
  });

  return capacityByIsland;
}

function uniqueSorted(values)
{
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

// Output is intentionally explicit so UI can surface partial coverage without inventing certainty.
export function buildVesselFeasibilityEstimate({
  sheet,
  islandStates = [],
  breedingSessions = [],
  deadlineHoursRemaining = null,
} = {})
{
  const isVesselSheet = sheet?.type !== "island";
  const numericDeadline = Number(deadlineHoursRemaining);
  const normalizedDeadline = Number.isFinite(numericDeadline) && numericDeadline >= 0
    ? numericDeadline
    : null;

  if (!sheet || !isVesselSheet)
  {
    return {
      sheetId: sheet?.key || null,
      sheetName: sheet?.sheetTitle || sheet?.monsterName || "Unknown",
      totalRemainingEggs: 0,
      coveredRemainingEggs: 0,
      uncoveredMonsters: [],
      coverageRatio: 0,
      estimateMode: "insufficient_data",
      breederOnlyEstimateHours: null,
      bottleneckIslands: [],
      assumedBreederCapacities: [],
      activeSessionCredits: {
        coveredBreedingSessions: 0,
        uncoveredBreedingSessions: 0,
      },
      deadlineHoursRemaining: normalizedDeadline,
      feasible: null,
      marginHours: null,
      confidenceNotes: ["Estimator is only available for vessel sheets."],
      failureMeaning: "If not completed before active timer expiry, this vessel attempt is lost.",
      blockedByCapacityMonsters: [],
    };
  }

  const relevantActiveSessions = getRelevantActiveBreedingSessions(sheet, breedingSessions);
  const capacityByIsland = createCapacityMap(islandStates, relevantActiveSessions);
  const islandLoads = Object.fromEntries(
    Array.from(capacityByIsland.entries()).map(([island, entry]) => [island, [...entry.slots]])
  );

  const uncoveredMonsters = [];
  const blockedByCapacityMonsters = [];
  let totalRemainingEggs = 0;
  let coveredRemainingEggs = 0;

  sheet.monsters.forEach((monster) =>
  {
    const remainingEggs = getRemainingEggs(monster);

    if (remainingEggs <= 0)
    {
      return;
    }

    totalRemainingEggs += remainingEggs;

    const durationHours = getStandardBreedingHours(monster.name);
    const eligibleIslands = getMonsterBreedingIslands(monster.name).filter((islandName) =>
    {
      const capacity = capacityByIsland.get(islandName);
      return capacity && capacity.totalBreeders > 0 && islandLoads[islandName]?.length > 0;
    });

    if (!Number.isFinite(durationHours))
    {
      uncoveredMonsters.push(monster.name);
      return;
    }

    if (eligibleIslands.length === 0)
    {
      blockedByCapacityMonsters.push(monster.name);
      return;
    }

    coveredRemainingEggs += remainingEggs;

    for (let count = 0; count < remainingEggs; count += 1)
    {
      let bestIsland = eligibleIslands[0];
      let bestFinishTime = Math.min(...islandLoads[bestIsland]) + durationHours;

      eligibleIslands.slice(1).forEach((islandName) =>
      {
        const finishTime = Math.min(...islandLoads[islandName]) + durationHours;

        if (finishTime < bestFinishTime)
        {
          bestFinishTime = finishTime;
          bestIsland = islandName;
        }
      });

      scheduleDurationOnIsland(islandLoads[bestIsland], durationHours);
    }
  });

  const bottleneckIslands = formatIslandLoads(islandLoads);
  const breederOnlyEstimateHours = bottleneckIslands.length > 0
    ? bottleneckIslands[0].hours
    : 0;
  const unknownActiveBlockers = Array.from(capacityByIsland.values()).reduce(
    (sum, entry) => sum + entry.unknownActiveBlockers,
    0
  );
  const coveredActiveSessions = Array.from(capacityByIsland.values()).reduce(
    (sum, entry) => sum + entry.coveredActiveSessions,
    0
  );
  const estimateMode =
    totalRemainingEggs === 0
      ? "exact"
      : coveredRemainingEggs === 0
        ? "insufficient_data"
        : (
            uncoveredMonsters.length === 0 &&
            blockedByCapacityMonsters.length === 0 &&
            unknownActiveBlockers === 0
          )
          ? "exact"
          : "partial";
  const feasible =
    normalizedDeadline === null || estimateMode !== "exact"
      ? null
      : breederOnlyEstimateHours <= normalizedDeadline;
  const marginHours =
    normalizedDeadline === null || estimateMode !== "exact"
      ? null
      : roundHours(normalizedDeadline - breederOnlyEstimateHours);

  const confidenceNotes = [];

  if (estimateMode === "exact")
  {
    confidenceNotes.push(
      "Standard breeding times are fully covered for the remaining eggs and current active breeder blockers on this vessel."
    );
  }

  if (estimateMode === "partial")
  {
    confidenceNotes.push(
      "Estimate is partial because some remaining work or active breeder blockers do not have full timing coverage."
    );
  }

  if (estimateMode === "insufficient_data")
  {
    confidenceNotes.push(
      "The current project data does not contain enough breeding-time coverage to estimate this vessel truthfully."
    );
  }

  if (unknownActiveBlockers > 0)
  {
    confidenceNotes.push(
      "Active breeder sessions with unknown remaining durations were detected and prevent a full-confidence estimate."
    );
  }

  if (blockedByCapacityMonsters.length > 0)
  {
    confidenceNotes.push(
      "Some covered monsters currently have no unlocked breeder capacity on any eligible island."
    );
  }

  confidenceNotes.push(
    "Enhanced breeding times exist for some monsters in the data, but this estimator currently assumes standard breeding times because the app does not track enhancement state."
  );

  confidenceNotes.push(
    "Nursery movement is not included in the time estimate because the app does not store nursery duration timers."
  );

  confidenceNotes.push(
    "Shop timers and active vessel deadlines are not stored in app state; any deadline comparison uses the provided hours-remaining input only."
  );

  return {
    sheetId: sheet.key,
    sheetName: sheet.sheetTitle || sheet.monsterName,
    totalRemainingEggs,
    coveredRemainingEggs,
    uncoveredMonsters: uniqueSorted(uncoveredMonsters),
    coverageRatio: totalRemainingEggs > 0
      ? roundHours(coveredRemainingEggs / totalRemainingEggs)
      : 1,
    estimateMode,
    breederOnlyEstimateHours: roundHours(breederOnlyEstimateHours),
    bottleneckIslands,
    assumedBreederCapacities: Array.from(capacityByIsland.entries())
      .map(([island, entry]) => ({
        island,
        totalBreeders: entry.totalBreeders,
        unknownActiveBlockers: entry.unknownActiveBlockers,
        coveredActiveSessions: entry.coveredActiveSessions,
        usableBreeders: entry.slots.length,
      }))
      .filter((entry) => entry.totalBreeders > 0)
      .sort((a, b) => a.island.localeCompare(b.island)),
    activeSessionCredits: {
      coveredBreedingSessions: coveredActiveSessions,
      uncoveredBreedingSessions: unknownActiveBlockers,
    },
    deadlineHoursRemaining: normalizedDeadline,
    feasible,
    marginHours,
    confidenceNotes,
    failureMeaning: "If not completed before active timer expiry, this vessel attempt is lost.",
    blockedByCapacityMonsters: uniqueSorted(blockedByCapacityMonsters),
  };
}
