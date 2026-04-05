export const ISLAND_GROUPS = [
  { key: "natural", label: "Natural" },
  { key: "fire", label: "Fire" },
  { key: "magical", label: "Magical" },
  { key: "ethereal", label: "Ethereal" },
  { key: "mirror", label: "Mirror Islands" },
  { key: "other", label: "Other" },
];

function createIslandKey(name)
{
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "_");
}

const ISLAND_OPERATIONAL_OVERRIDES = {
  "Amber Island": {
    supportsStandardBreeding: false,
    supportsNursery: false,
    capabilityTags: ["Vessels", "Zapping"],
    operationalNote: "Tracks vessel zaps instead of a standard breeding or nursery loop.",
  },
  "Magical Sanctum": {
    supportsStandardBreeding: true,
    supportsNursery: true,
    capabilityTags: ["Sanctum Breeding"],
    operationalNote: "Runs a standard breeding loop for Magical Sanctum monsters.",
  },
  "Magical Nexus": {
    supportsStandardBreeding: false,
    supportsNursery: false,
    capabilityTags: ["Stair Shaper"],
    operationalNote: "No breeding or nursery here. Use it for Stair Shaper progression instead.",
  },
  "Ethereal Workshop": {
    supportsStandardBreeding: false,
    supportsNursery: false,
    capabilityTags: ["Synthesizer", "Attunement"],
    operationalNote: "Uses synthesis and attunement instead of the normal breeding loop.",
  },
  "Ethereal Islets": {
    supportsStandardBreeding: false,
    supportsNursery: false,
    capabilityTags: ["Workshop Support"],
    operationalNote: "Support space for the Workshop, not a standard breeding island.",
  },
  Gold: {
    supportsStandardBreeding: false,
    supportsNursery: false,
    capabilityTags: ["Placement"],
    operationalNote: "Placement-focused island with no breeding or nursery capacity.",
  },
  Tribal: {
    supportsStandardBreeding: false,
    supportsNursery: false,
    capabilityTags: ["Tribe Monster"],
    operationalNote: "Tracks tribe donation progress instead of breeding or nursery work.",
  },
  Composer: {
    supportsStandardBreeding: false,
    supportsNursery: false,
    capabilityTags: ["Composer"],
    operationalNote: "Composition island with no breeding or nursery loop.",
  },
  Colossingum: {
    supportsStandardBreeding: false,
    supportsNursery: false,
    capabilityTags: ["Training", "Incubation"],
    operationalNote: "Uses training and Colossingum progression, not the standard breeding loop.",
  },
  "Wublin Island": {
    supportsStandardBreeding: false,
    supportsNursery: false,
    capabilityTags: ["Statues", "Zapping"],
    operationalNote: "Statue and zapping flow only. Eggs are zapped here instead of bred or incubated.",
  },
  "Celestial Island": {
    supportsStandardBreeding: false,
    supportsNursery: false,
    capabilityTags: ["Celestials", "Zapping"],
    operationalNote: "Celestial revival uses zapping, not standard breeding or nursery capacity.",
  },
  "Paironormal Carnival": {
    supportsStandardBreeding: false,
    supportsNursery: false,
    capabilityTags: ["Event"],
    operationalNote: "Event island with no standard breeding or nursery loop.",
  },
};

export function getIslandOperationalProfile(name, type = "special")
{
  const defaultSupportsBreeding = type === "breeding";
  const defaultSupportsNursery = type === "breeding";

  return {
    supportsStandardBreeding: defaultSupportsBreeding,
    supportsNursery: defaultSupportsNursery,
    capabilityTags: defaultSupportsBreeding ? ["Breeding", "Nursery"] : [],
    operationalNote: defaultSupportsBreeding
      ? "Standard breeding island with breeder and nursery capacity."
      : "Special island workflow.",
    ...(ISLAND_OPERATIONAL_OVERRIDES[name] || {}),
  };
}

function createIslandState({
  name,
  group,
  type,
  isMirror = false,
  isUnlocked = false,
  breedingStructures,
  nurseries,
  maxBreedingStructures,
  maxNurseries,
})
{
  const profile = getIslandOperationalProfile(name, type);
  const minimumBreedingStructures = profile.supportsStandardBreeding ? 1 : 0;
  const minimumNurseries = profile.supportsNursery ? 1 : 0;
  const defaultMaxBreedingStructures = profile.supportsStandardBreeding
    ? Math.max(Number(maxBreedingStructures ?? 2), minimumBreedingStructures)
    : 0;
  const defaultMaxNurseries = profile.supportsNursery
    ? Math.max(Number(maxNurseries ?? 2), minimumNurseries)
    : 0;
  const defaultBreedingStructures = Math.max(
    minimumBreedingStructures,
    Math.min(
      Number(breedingStructures ?? minimumBreedingStructures),
      defaultMaxBreedingStructures
    )
  );
  const defaultNurseries = Math.max(
    minimumNurseries,
    Math.min(Number(nurseries ?? minimumNurseries), defaultMaxNurseries)
  );

  return {
    key: createIslandKey(name),
    name,
    group,
    type,
    isMirror,
    isUnlocked,
    maxBreedingStructures: defaultMaxBreedingStructures,
    maxNurseries: defaultMaxNurseries,
    breedingStructures: defaultBreedingStructures,
    nurseries: defaultNurseries,
  };
}

export const ISLAND_STATE_DEFAULTS = [
  createIslandState({ name: "Plant", group: "natural", type: "breeding" }),
  createIslandState({ name: "Cold", group: "natural", type: "breeding" }),
  createIslandState({ name: "Air", group: "natural", type: "breeding" }),
  createIslandState({ name: "Water", group: "natural", type: "breeding" }),
  createIslandState({ name: "Earth", group: "natural", type: "breeding" }),

  createIslandState({ name: "Fire Haven", group: "fire", type: "breeding" }),
  createIslandState({ name: "Fire Oasis", group: "fire", type: "breeding" }),
  createIslandState({ name: "Amber Island", group: "fire", type: "special" }),

  createIslandState({ name: "Light", group: "magical", type: "breeding" }),
  createIslandState({ name: "Psychic", group: "magical", type: "breeding" }),
  createIslandState({ name: "Faerie", group: "magical", type: "breeding" }),
  createIslandState({ name: "Bone", group: "magical", type: "breeding" }),
  createIslandState({ name: "Magical Sanctum", group: "magical", type: "special" }),
  createIslandState({ name: "Magical Nexus", group: "magical", type: "special" }),

  createIslandState({ name: "Ethereal Island", group: "ethereal", type: "breeding" }),
  createIslandState({ name: "Ethereal Workshop", group: "ethereal", type: "special" }),
  createIslandState({ name: "Ethereal Islets", group: "ethereal", type: "special" }),

  createIslandState({ name: "Mirror Plant", group: "mirror", type: "breeding", isMirror: true }),
  createIslandState({ name: "Mirror Cold", group: "mirror", type: "breeding", isMirror: true }),
  createIslandState({ name: "Mirror Air", group: "mirror", type: "breeding", isMirror: true }),
  createIslandState({ name: "Mirror Water", group: "mirror", type: "breeding", isMirror: true }),
  createIslandState({ name: "Mirror Earth", group: "mirror", type: "breeding", isMirror: true }),
  createIslandState({ name: "Mirror Light", group: "mirror", type: "breeding", isMirror: true }),
  createIslandState({ name: "Mirror Psychic", group: "mirror", type: "breeding", isMirror: true }),
  createIslandState({ name: "Mirror Faerie", group: "mirror", type: "breeding", isMirror: true }),
  createIslandState({ name: "Mirror Bone", group: "mirror", type: "breeding", isMirror: true }),

  createIslandState({ name: "Shugabush", group: "other", type: "breeding" }),
  createIslandState({ name: "Gold", group: "other", type: "support" }),
  createIslandState({ name: "Tribal", group: "other", type: "support" }),
  createIslandState({ name: "Composer", group: "other", type: "support" }),
  createIslandState({ name: "Colossingum", group: "other", type: "support" }),
  createIslandState({ name: "Wublin Island", group: "other", type: "special" }),
  createIslandState({ name: "Celestial Island", group: "other", type: "special" }),
  createIslandState({ name: "Seasonal Shanty", group: "other", type: "breeding" }),
  createIslandState({ name: "Paironormal Carnival", group: "other", type: "special" }),
];

export function mergeIslandStates(defaultStates, savedStates, legacySlotCounts = {})
{
  const savedStateByKey = new Map(
    Array.isArray(savedStates)
      ? savedStates.map((state) => [state.key || createIslandKey(state.name || ""), state])
      : []
  );

  const mergedStates = defaultStates.map((defaultState) =>
  {
    const savedState = savedStateByKey.get(defaultState.key);
    const legacySlots = Number(legacySlotCounts[defaultState.name] || 0);
    const profile = getIslandOperationalProfile(defaultState.name, defaultState.type);
    const minimumBreedingStructures = profile.supportsStandardBreeding ? 1 : 0;
    const minimumNurseries = profile.supportsNursery ? 1 : 0;
    const normalizedMaxBreedingStructures = profile.supportsStandardBreeding
      ? Math.max(
        minimumBreedingStructures,
        Number(defaultState.maxBreedingStructures || 0)
      )
      : 0;
    const normalizedMaxNurseries = profile.supportsNursery
      ? Math.max(
        minimumNurseries,
        Number(defaultState.maxNurseries || 0)
      )
      : 0;
    const nextBreedingStructures = Number(
      savedState?.breedingStructures ??
      (profile.supportsStandardBreeding && legacySlots > 0
        ? legacySlots
        : defaultState.breedingStructures)
    );
    const nextNurseries = Number(savedState?.nurseries ?? defaultState.nurseries);

    return {
      ...defaultState,
      ...savedState,
      key: defaultState.key,
      name: defaultState.name,
      group: defaultState.group,
      type: defaultState.type,
      isMirror: defaultState.isMirror,
      maxBreedingStructures: normalizedMaxBreedingStructures,
      maxNurseries: normalizedMaxNurseries,
      breedingStructures: Math.max(
        minimumBreedingStructures,
        Math.min(
          normalizedMaxBreedingStructures,
          nextBreedingStructures || minimumBreedingStructures
        )
      ),
      nurseries: Math.max(
        minimumNurseries,
        Math.min(normalizedMaxNurseries, nextNurseries || minimumNurseries)
      ),
      isUnlocked: savedState?.isUnlocked ?? defaultState.isUnlocked,
    };
  });

  const knownKeys = new Set(mergedStates.map((state) => state.key));
  const extraSavedStates = Array.isArray(savedStates)
    ? savedStates
        .filter((state) => state?.key && !knownKeys.has(state.key))
        .map((state) =>
        {
          const profile = getIslandOperationalProfile(state.name, state.type || "special");
          const minimumBreedingStructures = profile.supportsStandardBreeding ? 1 : 0;
          const minimumNurseries = profile.supportsNursery ? 1 : 0;
          const maxBreedingStructures = profile.supportsStandardBreeding
            ? Math.max(
              minimumBreedingStructures,
              Number(state.maxBreedingStructures || state.breedingStructures || 1)
            )
            : 0;
          const maxNurseries = profile.supportsNursery
            ? Math.max(
              minimumNurseries,
              Number(state.maxNurseries || state.nurseries || 1)
            )
            : 0;

          return {
            ...state,
            group: state.group || "other",
            type: state.type || "special",
            isMirror: Boolean(state.isMirror),
            maxBreedingStructures,
            maxNurseries,
            breedingStructures: Math.max(
              minimumBreedingStructures,
              Math.min(
                maxBreedingStructures,
                Number(state.breedingStructures ?? minimumBreedingStructures)
              )
            ),
            nurseries: Math.max(
              minimumNurseries,
              Math.min(
                maxNurseries,
                Number(state.nurseries ?? minimumNurseries)
              )
            ),
          };
        })
    : [];

  return [...mergedStates, ...extraSavedStates];
}
