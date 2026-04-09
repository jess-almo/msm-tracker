import { MONSTER_DIRECTORY } from "../data/monsterDatabase.js";

export const ELEMENT_COLORS = {
  Plant: "rgba(108, 214, 55, 0.24)",
  Fire: "rgba(255, 114, 36, 0.24)",
  Water: "rgba(49, 214, 237, 0.24)",
  Cold: "rgba(190, 235, 255, 0.24)",
  Air: "rgba(228, 231, 238, 0.22)",
  Earth: "rgba(171, 153, 126, 0.24)",
  Light: "rgba(255, 212, 77, 0.24)",
  Psychic: "rgba(232, 90, 255, 0.24)",
  Faerie: "rgba(145, 240, 255, 0.24)",
  Bone: "rgba(198, 188, 174, 0.22)",
  Plasma: "rgba(255, 88, 204, 0.22)",
  Shadow: "rgba(109, 111, 133, 0.24)",
  Mech: "rgba(173, 181, 197, 0.22)",
  Crystal: "rgba(178, 126, 255, 0.24)",
  Poison: "rgba(160, 204, 46, 0.24)",
  Electricity: "rgba(80, 190, 255, 0.28)",
  Celestial: "rgba(132, 196, 255, 0.24)",
  Dipster: "rgba(118, 191, 73, 0.24)",
  Titansoul: "rgba(255, 154, 74, 0.22)",
  Legendary: "rgba(255, 207, 79, 0.26)",
  Mythical: "rgba(188, 132, 255, 0.24)",
  Dream: "rgba(124, 221, 255, 0.24)",
  Control: "rgba(199, 126, 220, 0.22)",
  Hoax: "rgba(125, 133, 241, 0.22)",
  Ruin: "rgba(240, 112, 112, 0.22)",
  Depths: "rgba(66, 196, 191, 0.22)",
};

const elementChipBaseStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
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

const ELECTRICITY_MONSTERS = new Set([
  "Wubbox",
  "Rare Wubbox",
  "Epic Wubbox",
  "Brump",
  "Rare Brump",
  "Epic Brump",
  "Zynth",
  "Rare Zynth",
  "Epic Zynth",
  "Poewk",
  "Rare Poewk",
  "Epic Poewk",
  "Thwok",
  "Rare Thwok",
  "Epic Thwok",
  "Dwumrohl",
  "Rare Dwumrohl",
  "Epic Dwumrohl",
  "Zuuker",
  "Rare Zuuker",
  "Epic Zuuker",
  "Screemu",
  "Rare Screemu",
  "Tympa",
  "Rare Tympa",
  "Epic Tympa",
  "Dermit",
  "Rare Dermit",
  "Epic Dermit",
  "Gheegur",
  "Rare Gheegur",
  "Epic Gheegur",
  "Whajje",
  "Rare Whajje",
  "Creepuscule",
  "Rare Creepuscule",
  "Blipsqueak",
  "Rare Blipsqueak",
  "Epic Blipsqueak",
  "Scargo",
  "Rare Scargo",
  "Astropod",
  "Rare Astropod",
  "Pixolotl",
  "Rare Pixolotl",
  "Bona-Petite",
  "Rare Bona-Petite",
  "Maulch",
  "Rare Maulch",
  "Fleechwurm",
  "Rare Fleechwurm",
  "Epic Fleechwurm",
]);

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

  const metadata = MONSTER_DIRECTORY[name];

  if (!metadata)
  {
    return null;
  }

  return {
    ...metadata,
    elements: getResolvedMonsterElements(name, metadata),
  };
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

export function getElementChipStyle(element, isSelected = false)
{
  return {
    ...elementChipBaseStyle,
    background: ELEMENT_COLORS[element] || "rgba(255,255,255,0.08)",
    border: isSelected
      ? "1px solid rgba(255,255,255,0.4)"
      : elementChipBaseStyle.border,
    boxShadow: isSelected
      ? "0 0 0 1px rgba(255,255,255,0.14), 0 0 18px rgba(255,255,255,0.12), inset 0 1px 0 rgba(255,255,255,0.12)"
      : elementChipBaseStyle.boxShadow,
    transform: isSelected ? "translateY(-1px)" : "none",
  };
}

export function getElementAuraStyle(elements = [])
{
  const glowStops = Array.from(
    new Set(
      elements
        .map((element) => ELEMENT_COLORS[element])
        .filter(Boolean)
    )
  );

  if (glowStops.length === 0)
  {
    return {
      border: "1px solid rgba(255,255,255,0.08)",
      background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.12), rgba(255,255,255,0.03))",
      boxShadow: "0 10px 20px rgba(0,0,0,0.14)",
    };
  }

  if (glowStops.length === 1)
  {
    return {
      border: "1px solid rgba(255,255,255,0.16)",
      background: `radial-gradient(circle at 30% 24%, ${glowStops[0]}, rgba(255,255,255,0.03) 72%)`,
      boxShadow: `0 10px 20px rgba(0,0,0,0.14), 0 0 24px ${glowStops[0]}`,
    };
  }

  const anchorPoints = [
    "20% 18%",
    "82% 22%",
    "24% 82%",
    "78% 80%",
    "50% 10%",
    "50% 90%",
    "10% 50%",
    "90% 50%",
  ];
  const radialLayers = glowStops
    .map((color, index) =>
    {
      const anchor = anchorPoints[index % anchorPoints.length];
      return `radial-gradient(circle at ${anchor}, ${color} 0%, rgba(255,255,255,0.02) 34%, transparent 62%)`;
    })
    .join(", ");
  const shadowLayers = glowStops
    .map((color, index) => `0 0 ${24 + index * 3}px ${color}`)
    .join(", ");

  return {
    border: "1px solid rgba(255,255,255,0.18)",
    background: `${radialLayers}, radial-gradient(circle at center, rgba(255,255,255,0.08) 0%, rgba(18,20,28,0.16) 52%, rgba(18,20,28,0.04) 70%, transparent 84%)`,
    boxShadow: `0 10px 20px rgba(0,0,0,0.14), ${shadowLayers}`,
  };
}

function getResolvedMonsterElements(name, metadata)
{
  const baseElements = Array.isArray(metadata?.elements)
    ? metadata.elements.filter(Boolean)
    : [];

  if (baseElements.length > 0)
  {
    return Array.from(new Set(baseElements));
  }

  if (ELECTRICITY_MONSTERS.has(name))
  {
    return ["Electricity"];
  }

  return [];
}

function normalizeElementAssetName(element)
{
  return String(element || "")
    .trim()
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const AVAILABLE_ELEMENT_ICONS = new Set([
  "air",
  "anniversary-month",
  "beat-hereafter",
  "bone",
  "celestial",
  "cloverspell",
  "cold",
  "control",
  "crescendo-moon",
  "crystal",
  "depths",
  "dipster",
  "dream",
  "earth",
  "echoes-of-eco",
  "eggs-travaganza",
  "electricity",
  "faerie",
  "feast-ember",
  "festival-of-yay",
  "fire",
  "hoax",
  "legendary",
  "life-formula",
  "light",
  "mech",
  "mindboggle",
  "mythical",
  "perplexplore",
  "plant",
  "plasma",
  "poison",
  "psychic",
  "ruin",
  "season-of-love",
  "shadow",
  "skypainting",
  "spooktacle",
  "summersong",
  "titansoul",
  "water",
]);

const ELEMENT_ICON_ALIASES = {
  "anniversary-month": "anniversary-month",
  "beat-hereafter": "beat-hereafter",
  celestial: "celestial",
  cloverspell: "cloverspell",
  "crescendo-moon": "crescendo-moon",
  "eggs-travaganza": "eggs-travaganza",
  dipster: "dipster",
  dream: "dream",
  "echoes-of-eco": "echoes-of-eco",
  electricity: "electricity",
  "faerie": "faerie",
  "feast-ember": "feast-ember",
  "festival-of-yay": "festival-of-yay",
  legendary: "legendary",
  "life-formula": "life-formula",
  mindboggle: "mindboggle",
  mythical: "mythical",
  perplexplore: "perplexplore",
  "season-of-love": "season-of-love",
  skypainting: "skypainting",
  spooktacle: "spooktacle",
  summersong: "summersong",
  titansoul: "titansoul",
};

export function getElementIconPath(element)
{
  const assetKey = normalizeElementAssetName(element);
  const resolvedAssetKey = ELEMENT_ICON_ALIASES[assetKey] || assetKey;

  if (!AVAILABLE_ELEMENT_ICONS.has(resolvedAssetKey))
  {
    return "";
  }

  return `/monsters/elements/${encodeURIComponent(resolvedAssetKey)}.png`;
}

function normalizeMonsterAssetName(name)
{
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const AVAILABLE_MONSTER_PORTRAITS = new Set([
  "anglow",
  "barrb",
  "bbli-zard",
  "bowgart",
  "buzzinga",
  "candelavra",
  "clamble",
  "congle",
  "cybop",
  "dandidoo",
  "deedge",
  "do",
  "drumpler",
  "entbrat",
  "fa",
  "floogull",
  "flowah",
  "furcorn",
  "fwog",
  "ghazt",
  "gjoob",
  "glowl",
  "grumpyre",
  "hoola",
  "humbug",
  "hyehehe",
  "jeeode",
  "kayna",
  "la",
  "maggpi",
  "mammot",
  "maw",
  "mi",
  "noggin",
  "oaktopus",
  "pango",
  "parlsona",
  "pompom",
  "potbelly",
  "pummel",
  "punkleton",
  "quarrister",
  "quibble",
  "re",
  "reebro",
  "reedling",
  "repatillo",
  "riff",
  "schmoochle",
  "scups",
  "shellbeat",
  "shrubb",
  "shugabush",
  "sol",
  "spunge",
  "stogg",
  "stoowarb",
  "strombonin",
  "t-rox",
  "tawkerr",
  "thumpies",
  "ti",
  "toe-jammer",
  "tring",
  "tweedle",
  "wubbox",
  "yawstrich",
  "yool",
]);

const MONSTER_PORTRAIT_ALIASES = {
  "bbli-zard": "bbli-zard",
  "bbli-ard": "bbli-zard",
  "g-joob": "gjoob",
  mammott: "mammot",
};

export function getMonsterPortrait(name)
{
  const assetKey = normalizeMonsterAssetName(name);
  const resolvedAssetKey = MONSTER_PORTRAIT_ALIASES[assetKey] || assetKey;

  if (!AVAILABLE_MONSTER_PORTRAITS.has(resolvedAssetKey))
  {
    return "";
  }

  return `/monsters/portraits/${encodeURIComponent(resolvedAssetKey)}.png`;
}
