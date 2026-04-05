import { BREEDING_COMBOS_NATURAL } from "../data/breedingCombos";

const BREEDING_COMBO_INDEX = new Map(
  BREEDING_COMBOS_NATURAL.map((entry) => [entry.monsterName, entry])
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
