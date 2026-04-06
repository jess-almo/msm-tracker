import { MONSTER_DATABASE } from "../data/monsterDatabase";
import { MONSTER_REQUIREMENTS } from "../data/monsterRequirements";

const RARE_PREFIX = "Rare ";
const EPIC_PREFIX = "Epic ";
const UNKNOWN_ELEMENT_COUNT = 99;

function startsWithPrefix(value, prefix)
{
  return typeof value === "string" && value.startsWith(prefix);
}

function getBaseMonsterName(monsterName)
{
  if (startsWithPrefix(monsterName, RARE_PREFIX))
  {
    return monsterName.slice(RARE_PREFIX.length);
  }

  if (startsWithPrefix(monsterName, EPIC_PREFIX))
  {
    return monsterName.slice(EPIC_PREFIX.length);
  }

  return monsterName;
}

function getMonsterElementCount(monsterName)
{
  const exactMonster = MONSTER_DATABASE[monsterName];
  const baseMonster = MONSTER_DATABASE[getBaseMonsterName(monsterName)];
  const sourceMonster = [exactMonster, baseMonster].find((monster) =>
    Array.isArray(monster?.elements) && monster.elements.length > 0
  );

  return sourceMonster ? sourceMonster.elements.length : UNKNOWN_ELEMENT_COUNT;
}

function getMonsterRarityRank(monsterName)
{
  if (startsWithPrefix(monsterName, EPIC_PREFIX))
  {
    return 2;
  }

  if (startsWithPrefix(monsterName, RARE_PREFIX))
  {
    return 1;
  }

  return 0;
}

const MONSTER_REQUIREMENT_USAGE = Object.entries(MONSTER_REQUIREMENTS).reduce((usageMap, [systemKey, targets]) =>
{
  Object.values(targets || {}).forEach((requirementList) =>
  {
    (requirementList || []).forEach((item) =>
    {
      const currentUsage = usageMap.get(item.name) || [];

      if (!currentUsage.includes(systemKey))
      {
        usageMap.set(item.name, [...currentUsage, systemKey].sort((a, b) => a.localeCompare(b)));
      }
    });
  });

  return usageMap;
}, new Map());

export function getMonsterRequirementUsage(monsterName)
{
  return MONSTER_REQUIREMENT_USAGE.get(monsterName) || [];
}

export function isEpicMonsterName(monsterName)
{
  return startsWithPrefix(monsterName, EPIC_PREFIX);
}

export function compareMonsterNamesByPriority(
  leftName,
  rightName,
  { preferRequirementUsage = true } = {}
)
{
  const leftUsageCount = preferRequirementUsage ? getMonsterRequirementUsage(leftName).length : 0;
  const rightUsageCount = preferRequirementUsage ? getMonsterRequirementUsage(rightName).length : 0;

  if (leftUsageCount !== rightUsageCount)
  {
    return rightUsageCount - leftUsageCount;
  }

  const rarityDifference = getMonsterRarityRank(leftName) - getMonsterRarityRank(rightName);

  if (rarityDifference !== 0)
  {
    return rarityDifference;
  }

  const elementDifference = getMonsterElementCount(leftName) - getMonsterElementCount(rightName);

  if (elementDifference !== 0)
  {
    return elementDifference;
  }

  return (leftName || "").localeCompare(rightName || "");
}

export function compareMonsterEntriesByPriority(
  leftMonster,
  rightMonster,
  options = {}
)
{
  return compareMonsterNamesByPriority(
    leftMonster?.name || "",
    rightMonster?.name || "",
    options
  );
}
