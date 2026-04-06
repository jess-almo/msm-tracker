import { BREEDING_COMBOS_ALL } from "../data/breedingCombos";

const BREEDING_COMBO_INDEX = new Map(
  BREEDING_COMBOS_ALL.map((entry) => [entry.monsterName, entry])
);

export function getBreedingComboByMonsterName(name)
{
  return BREEDING_COMBO_INDEX.get(name) || null;
}

export function getBreedableIslandsForMonster(name)
{
  return getBreedingComboByMonsterName(name)?.breedableOn || [];
}

export function getBestBreedingCombos(name)
{
  return getBreedingComboByMonsterName(name)?.combinations || [];
}

export function getBreedingTimeDataByMonsterName(name)
{
  const combo = getBreedingComboByMonsterName(name);

  if (!combo)
  {
    return null;
  }

  return {
    breedingTime: combo.breedingTime || null,
    enhancedBreedingTime: combo.enhancedBreedingTime || null,
  };
}

function normalizeName(value)
{
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function normalizePair(parentA, parentB)
{
  return [parentA, parentB]
    .map(normalizeName)
    .filter(Boolean)
    .sort();
}

function combinationMatchesPair(combination, normalizedPair)
{
  if (!Array.isArray(combination) || combination.length !== 2 || normalizedPair.length !== 2)
  {
    return false;
  }

  const normalizedCombination = combination
    .map(normalizeName)
    .filter(Boolean)
    .sort();

  if (normalizedCombination.length !== 2)
  {
    return false;
  }

  return (
    normalizedCombination[0] === normalizedPair[0]
    && normalizedCombination[1] === normalizedPair[1]
  );
}

function entryHasObservedTime(entry, observedTime)
{
  if (!entry || !observedTime)
  {
    return false;
  }

  return (
    entry.breedingTime === observedTime
    || entry.enhancedBreedingTime === observedTime
  );
}

export function getPossibleBreedingResultsByParents(parentA, parentB, islandName = "")
{
  const normalizedPair = normalizePair(parentA, parentB);

  if (normalizedPair.length !== 2)
  {
    return [];
  }

  return BREEDING_COMBOS_ALL.filter((entry) =>
  {
    if (islandName && Array.isArray(entry.breedableOn) && !entry.breedableOn.includes(islandName))
    {
      return false;
    }

    return Array.isArray(entry.combinations)
      && entry.combinations.some((combination) => combinationMatchesPair(combination, normalizedPair));
  });
}

export function inferBreedingOutcomeFromParents({
  parentA,
  parentB,
  islandName = "",
  observedTime = "",
})
{
  const candidates = getPossibleBreedingResultsByParents(parentA, parentB, islandName);
  const timerMatchedCandidates = observedTime
    ? candidates.filter((entry) => entryHasObservedTime(entry, observedTime))
    : candidates;
  const resolvedCandidates = timerMatchedCandidates.length > 0 ? timerMatchedCandidates : candidates;
  const resolvedResult = resolvedCandidates.length === 1 ? resolvedCandidates[0] : null;
  const timerOptions = Array.from(
    new Set(
      candidates.flatMap((entry) => [entry.breedingTime, entry.enhancedBreedingTime].filter(Boolean))
    )
  );

  return {
    candidates,
    timerMatchedCandidates,
    timerOptions,
    resolution: resolvedResult ? "exact" : "mystery",
    resultName: resolvedResult?.monsterName || "Mystery Egg",
    resultEntry: resolvedResult || null,
  };
}
