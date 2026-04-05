import { MONSTER_DIRECTORY } from "../data/monsterDatabase";

export const ELEMENT_COLORS = {
  Plant: "rgba(34,197,94,0.18)",
  Fire: "rgba(239,68,68,0.18)",
  Water: "rgba(59,130,246,0.18)",
  Cold: "rgba(147,197,253,0.18)",
  Air: "rgba(203,213,225,0.18)",
  Earth: "rgba(120,113,108,0.18)",
  Light: "rgba(250,204,21,0.18)",
  Psychic: "rgba(168,85,247,0.18)",
  Faerie: "rgba(244,114,182,0.18)",
  Bone: "rgba(214,211,209,0.18)",
  Plasma: "rgba(236,72,153,0.18)",
  Shadow: "rgba(75,85,99,0.25)",
  Mech: "rgba(148,163,184,0.18)",
  Crystal: "rgba(192,132,252,0.18)",
  Poison: "rgba(132,204,22,0.18)",
  Electricity: "rgba(250,204,21,0.22)",
  Celestial: "rgba(96,165,250,0.18)",
  Dipster: "rgba(45,212,191,0.18)",
  Titansoul: "rgba(251,146,60,0.18)",
  Legendary: "rgba(250,204,21,0.18)",
  Mythical: "rgba(192,132,252,0.18)",
  Dream: "rgba(125,211,252,0.18)",
  Control: "rgba(244,114,182,0.16)",
  Hoax: "rgba(129,140,248,0.16)",
  Ruin: "rgba(248,113,113,0.16)",
  Depths: "rgba(45,212,191,0.16)",
};

const elementChipBaseStyle = {
  display: "inline-flex",
  alignItems: "center",
  padding: "5px 10px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "rgba(255,255,255,0.92)",
  fontSize: "12px",
  fontWeight: 600,
  lineHeight: 1.2,
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
};

export const REAL_BREEDING_ISLANDS = [
  "Plant",
  "Cold",
  "Air",
  "Water",
  "Earth",
  "Fire Haven",
  "Fire Oasis",
  "Amber Island",
  "Light",
  "Psychic",
  "Faerie",
  "Bone",
  "Shugabush",
  "Magical Sanctum",
  "Magical Nexus",
  "Ethereal Island",
  "Ethereal Workshop",
  "Ethereal Islets",
  "Seasonal Shanty",
  "Mirror Plant",
  "Mirror Cold",
  "Mirror Air",
  "Mirror Water",
  "Mirror Earth",
  "Mirror Light",
  "Mirror Psychic",
  "Mirror Faerie",
  "Mirror Bone",
];

const NORMALIZED_MONSTER_ISLAND_MAP = {
  "Plant Island": "Plant",
  "Cold Island": "Cold",
  "Air Island": "Air",
  "Water Island": "Water",
  "Earth Island": "Earth",
  "Fire Haven": "Fire Haven",
  "Fire Oasis": "Fire Oasis",
  "Amber Island": "Amber Island",
  "Light Island": "Light",
  "Psychic Island": "Psychic",
  "Faerie Island": "Faerie",
  "Bone Island": "Bone",
  "Shugabush Island": "Shugabush",
  "Magical Sanctum": "Magical Sanctum",
  "Magical Nexus": "Magical Nexus",
  "Ethereal Island": "Ethereal Island",
  "Ethereal Workshop": "Ethereal Workshop",
  "Ethereal Islets": "Ethereal Islets",
  "Seasonal Shanty": "Seasonal Shanty",
  "Mirror Plant Island": "Mirror Plant",
  "Mirror Cold Island": "Mirror Cold",
  "Mirror Air Island": "Mirror Air",
  "Mirror Water Island": "Mirror Water",
  "Mirror Earth Island": "Mirror Earth",
  "Mirror Light Island": "Mirror Light",
  "Mirror Psychic Island": "Mirror Psychic",
  "Mirror Faerie Island": "Mirror Faerie",
  "Mirror Bone Island": "Mirror Bone",
};

const PRIMARY_BREEDING_ISLAND_OVERRIDES = {
  Noggin: "Plant",
  "Toe Jammer": "Plant",
  Mammott: "Cold",
  Potbelly: "Plant",
  Tweedle: "Air",
  Cybop: "Air",
  Dandidoo: "Cold",
  Furcorn: "Plant",
  Oaktopus: "Plant",
  Shrubb: "Plant",
  "T-Rox": "Plant",
  Bowgart: "Plant",
  Clamble: "Plant",
  PomPom: "Air",
  Scups: "Water",
  Deedge: "Cold",
  Entbrat: "Plant",
  Quarrister: "Earth",
  Riff: "Air",
  Shellbeat: "Water",
  Pango: "Cold",
  Quibble: "Cold",
  Spunge: "Water",
  Thumpies: "Cold",
  Fwog: "Plant",
  Maw: "Plant",
  Drumpler: "Plant",
  Pummel: "Plant",
  Reedling: "Earth",
  Congle: "Cold",
  Kayna: "Fire Haven",
  Glowl: "Fire Haven",
  Flowah: "Fire Haven",
  Stogg: "Fire Haven",
  Phangler: "Fire Oasis",
  Boskus: "Fire Oasis",
  Barrb: "Fire Haven",
  Floogull: "Fire Haven",
  Whaddle: "Fire Oasis",
  Woolabee: "Fire Oasis",
  Repatillo: "Fire Haven",
  Rootitoot: "Psychic",
  Sooza: "Light",
  Thrumble: "Bone",
  Ziggurab: "Bone",
  Wynq: "Fire Oasis",
  Sneyser: "Fire Oasis",
  Tring: "Fire Haven",
};

function getDescriptionIsland(metadata)
{
  const description = metadata?.description || "";
  const match = description.match(/first unlocked on ([A-Za-z' -]+) Island/i);

  if (!match)
  {
    return "";
  }

  return normalizeMonsterIslandName(`${match[1]} Island`);
}

export function getMonsterMetadata(name)
{
  if (typeof name !== "string" || !name.trim())
  {
    return null;
  }

  return MONSTER_DIRECTORY[name] || null;
}

export function normalizeMonsterIslandName(islandName)
{
  if (typeof islandName !== "string" || !islandName.trim())
  {
    return "";
  }

  return NORMALIZED_MONSTER_ISLAND_MAP[islandName] || islandName.trim();
}

export function isRealBreedingIsland(islandName)
{
  return REAL_BREEDING_ISLANDS.includes(islandName);
}

export function getMonsterBreedingIslands(name)
{
  const metadata = getMonsterMetadata(name);
  const breedableOn = Array.isArray(metadata?.breedableOn) ? metadata.breedableOn : [];
  const normalizedIslands = Array.from(
    new Set(
      breedableOn
        .map((islandName) => normalizeMonsterIslandName(islandName))
        .filter((islandName) => isRealBreedingIsland(islandName))
    )
  );

  return normalizedIslands.sort((a, b) =>
  {
    const aIndex = REAL_BREEDING_ISLANDS.indexOf(a);
    const bIndex = REAL_BREEDING_ISLANDS.indexOf(b);

    if (aIndex === -1 && bIndex === -1)
    {
      return a.localeCompare(b);
    }

    if (aIndex === -1)
    {
      return 1;
    }

    if (bIndex === -1)
    {
      return -1;
    }

    return aIndex - bIndex;
  });
}

export function getMonsterPrimaryBreedingIsland(name, preferredIslands = [])
{
  const metadata = getMonsterMetadata(name);
  const breedableIslands = getMonsterBreedingIslands(name);
  const descriptionIsland = getDescriptionIsland(metadata);
  const overrideIsland = PRIMARY_BREEDING_ISLAND_OVERRIDES[name];

  if (overrideIsland && breedableIslands.includes(overrideIsland))
  {
    return overrideIsland;
  }

  if (descriptionIsland && breedableIslands.includes(descriptionIsland))
  {
    return descriptionIsland;
  }

  if (preferredIslands.length > 0)
  {
    const preferredIsland = preferredIslands.find((island) =>
      breedableIslands.includes(island)
    );

    if (preferredIsland)
    {
      return preferredIsland;
    }
  }

  return breedableIslands[0] || "";
}

export function normalizeBreedingAssignments(assignments)
{
  if (!assignments || typeof assignments !== "object")
  {
    return {};
  }

  return Object.fromEntries(
    Object.entries(assignments).filter(([islandName, count]) =>
    {
      return isRealBreedingIsland(islandName) && Number(count || 0) > 0;
    }).map(([islandName, count]) => [islandName, Math.floor(Number(count || 0))])
  );
}

export function getAssignedBreedingTotal(assignments)
{
  return Object.values(normalizeBreedingAssignments(assignments)).reduce(
    (sum, count) => sum + Number(count || 0),
    0
  );
}

export function addBreedingAssignment(assignments, islandName, delta = 1)
{
  const nextAssignments = normalizeBreedingAssignments(assignments);

  if (!isRealBreedingIsland(islandName) || delta <= 0)
  {
    return nextAssignments;
  }

  nextAssignments[islandName] = Number(nextAssignments[islandName] || 0) + delta;
  return normalizeBreedingAssignments(nextAssignments);
}

export function consumeBreedingAssignments(assignments, count, preferredIsland = "")
{
  let remaining = Math.max(0, Number(count || 0));
  const nextAssignments = { ...normalizeBreedingAssignments(assignments) };
  const orderedIslands = [];

  if (isRealBreedingIsland(preferredIsland) && nextAssignments[preferredIsland] > 0)
  {
    orderedIslands.push(preferredIsland);
  }

  Object.keys(nextAssignments)
    .sort((a, b) => REAL_BREEDING_ISLANDS.indexOf(a) - REAL_BREEDING_ISLANDS.indexOf(b))
    .forEach((islandName) =>
    {
      if (!orderedIslands.includes(islandName))
      {
        orderedIslands.push(islandName);
      }
    });

  orderedIslands.forEach((islandName) =>
  {
    if (remaining <= 0)
    {
      return;
    }

    const available = Number(nextAssignments[islandName] || 0);

    if (available <= 0)
    {
      return;
    }

    const used = Math.min(available, remaining);
    const nextValue = available - used;

    if (nextValue > 0)
    {
      nextAssignments[islandName] = nextValue;
    }
    else
    {
      delete nextAssignments[islandName];
    }

    remaining -= used;
  });

  return normalizeBreedingAssignments(nextAssignments);
}

export function trimBreedingAssignments(assignments, maxTotal)
{
  const normalizedAssignments = normalizeBreedingAssignments(assignments);
  const assignedTotal = getAssignedBreedingTotal(normalizedAssignments);

  if (assignedTotal <= maxTotal)
  {
    return normalizedAssignments;
  }

  return consumeBreedingAssignments(
    normalizedAssignments,
    assignedTotal - Math.max(0, Number(maxTotal || 0))
  );
}

export function formatCategoryLabel(category)
{
  if (typeof category !== "string" || !category.trim())
  {
    return "";
  }

  return category
    .trim()
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function getElementChipStyle(element)
{
  return {
    ...elementChipBaseStyle,
    background: ELEMENT_COLORS[element] || "rgba(255,255,255,0.08)",
  };
}
