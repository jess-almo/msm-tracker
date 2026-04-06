import fs from "node:fs";
import path from "node:path";

const KNOWN_PAGE_TITLES = [
  "Epic Monsters",
  "Breeding",
  "Breeding Combinations",
  "Rare Monsters",
  "Breeding Times",
];

const COMBO_CATEGORY_MAP = new Map([
  ["Natural Monsters", "Natural"],
  ["Fire Monsters", "Fire"],
  ["Magical Monsters", "Magical"],
  ["Ethereal Monsters", "Ethereal"],
  ["Seasonal Monsters", "Seasonal"],
  ["Mythical Monsters", "Mythical"],
  ["Paironormal Monsters", "Paironormal"],
  ["Legendary Monsters", "Legendary"],
  ["Rare Monsters", "Rare"],
]);

const COMBO_SUBCLASS_MAP = new Map([
  ["Single Element Monsters", "Single Element"],
  ["Single-Element Monster", "Single Element"],
  ["Double Element Monsters", "Double Element"],
  ["Triple Element Monsters", "Triple Element"],
  ["Quad Element Monsters", "Quad Element"],
  ["Core Seasonals", "Core Seasonals"],
  ["Aux. Seasonals and Jam Boree", "Auxiliary Seasonals"],
  ["Shugafam", "Shugafam"],
  ["Others", "Others"],
]);

const COMBO_IGNORED_LINES = new Set([
  "Monster",
  "Breeding",
  "Combination(s)",
  "Breeding Time",
  "(Enhanced)",
  "Island(s)",
  "List of Monsters",
  "Contents",
  "Save",
  "View source",
]);

const TIME_TABLE_HEADER_LINES = new Set([
  "Times",
  "Monsters Standard",
  "(+Bonus) Enhanced",
  "(+Bonus) Standard+Skin",
  "(+Bonus) Enhanced+Skin",
  "(+Bonus)",
]);

const FACT_DEFINITIONS = {
  coreBreeding: [
    {
      id: "breed_requires_two_species",
      search: "To breed, select two Monsters of different species that are at least level 4",
      fact: "Standard breeding requires two different monster species, each at least level 4.",
    },
    {
      id: "repeated_element_can_fail_into_parent",
      search: "If an Element is repeated, the resulting Monster will be one of its parents.",
      fact: "If the selected parents repeat an element, the result can collapse into one of the parents instead of producing a new combined outcome.",
    },
    {
      id: "special_monsters_use_specific_parents",
      search: "Some special Monsters like Ethereals, Legendary Monsters, Mythicals, Seasonals, and Epics",
      fact: "Special classes such as Ethereals, Legendaries, Mythicals, Seasonals, and Epics rely on specific monster pairs rather than pure element-union rules.",
    },
    {
      id: "higher_levels_raise_rare_odds",
      search: "Monster levels then adjust these chances.",
      fact: "Levels above 4 improve odds for rarer outcomes, but they do not guarantee success.",
    },
    {
      id: "torches_shift_odds",
      search: "Wishing Torches further modify the odds by shifting probability from common results to the rarest possible result",
      fact: "Wishing Torches shift probability from common outcomes toward rarer outcomes; they do not create new results.",
    },
    {
      id: "rare_check_after_base_result",
      search: "After the game selects a breeding result, it may perform an additional check to see if that result becomes a Rare variant",
      fact: "Rare result checks happen after the base breeding result is chosen, so Rare availability is layered on top of the normal result pool.",
    },
    {
      id: "natural_doubles_guaranteed",
      search: "Natural Doubles have a 100% success rate",
      fact: "Natural Double-Element monsters are guaranteed results and cannot fail into a parent.",
    },
    {
      id: "triples_not_guaranteed",
      search: "Triple-Element Monsters are not guaranteed",
      fact: "Triple-Element breeding is not guaranteed and can fail into one of the parents.",
    },
    {
      id: "triple_plus_single_beats_double_plus_double_for_quads",
      search: "Breeding a Triple with a Single is much more successful than breeding two Doubles.",
      fact: "For Quad-Element targets, Triple + Single is generally a better choice than Double + Double.",
    },
    {
      id: "common_plus_rare_same_species_is_guaranteed",
      search: "When a Common Monster is bred with its Rare counterpart, the result will be a 100% success rate.",
      fact: "Common + Rare of the same monster guarantees that monster's Common result.",
    },
    {
      id: "special_classes_are_island_bound",
      search: "special-classed Monsters can only breed on their own Island",
      fact: "Special classes are island-bound for breeding, such as Shugabush on Shugabush Island, Ethereals on Ethereal Island, Mythicals on Mythical Island, and Seasonals on Seasonal Shanty.",
    },
  ],
  rareBreeding: [
    {
      id: "rares_limited_time_variants",
      search: "Rare Monsters are an elusive class of Monsters that are unique variants of regular Monsters that are only available during limited-time promotions.",
      fact: "Rares are limited-time variants that usually share song, animation, and breeding combination with their Common counterparts while taking longer to breed and hatch.",
    },
    {
      id: "rare_combos_same_except_singles",
      search: "Rare Monsters are special variants of existing Monsters that have a lower chance to obtain and only available for limited times.",
      fact: "Most Rares use the same breeding combination as their Common counterpart, except Rare Single-Element monsters, which use specific Triple-Element pair rules.",
    },
    {
      id: "rare_egg_timer_identification",
      search: "Players will have to pay special attention to breeding and incubation times so that they know when a Rare is on its way!",
      fact: "Breeding and incubation time are part of Rare identification, especially because Rare eggs historically matched Common egg designs.",
    },
    {
      id: "rare_with_rare_not_proven_better",
      search: "Rares can be bred with one another, but no evidence suggests that this offers a higher chance of successfully breeding a Rare.",
      fact: "Breeding Rare + Rare is possible, but the inbox material does not support treating it as a better Rare-chance strategy.",
    },
    {
      id: "rare_with_common_same_species_possible",
      search: "Rares can be bred with their common counterparts.",
      fact: "Rare + Common of the same species is valid once you already own the Rare, and it can be used to duplicate that monster during the Rare's availability window.",
    },
    {
      id: "shugabush_rare_pairs_have_multiple_outcomes",
      search: "bred on Shugabush Island by breeding their Common counterpart with the Shugabush",
      fact: "On Shugabush Island, Common/Rare natural plus Shugabush pairings can branch into multiple outcomes, including Common, Rare, Shugabush, or Shugafam results.",
    },
    {
      id: "rare_ethereal_workshop_not_bred",
      search: "On Ethereal Workshop, Monsters cannot be bred. Instead, Rares are obtained by evolving a Common Monster into a Rare",
      fact: "Rarethereals on Ethereal Workshop are not bred in a normal structure; they are evolved through the Rarefied Attunement Structure.",
    },
  ],
  rareTiming: [
    {
      id: "rare_single_natural_time",
      search: "Rare Single-Element Naturals have breeding times of 6 hours.",
      fact: "Rare Single-Element Naturals use a 6 hour breeding time pattern.",
    },
    {
      id: "rare_drumpler_maw_exception",
      search: "Rare Drumpler and Rare Maw's breeding time multiplier is 2.25.",
      fact: "Rare Drumpler and Rare Maw are exceptions to the usual Rare timing pattern and resolve to 1 hour 7 minutes 30 seconds.",
    },
    {
      id: "rare_fwog_exception",
      search: "Rare Fwog's breeding time multiplier is 2.5.",
      fact: "Rare Fwog is another Rare Double exception, resolving to 1 hour 15 minutes.",
    },
    {
      id: "most_rare_naturals_pattern",
      search: "The breeding times for most Rare Naturals, as well as Single Element Rarethereals on the Natural Islands, are usually the Common’s breeding time multiplied by 1.25, and adding 30 minutes.",
      fact: "Most Rare Naturals follow a common timing rule: Common breeding time times 1.25, plus 30 minutes.",
    },
    {
      id: "rare_natural_doubles_time",
      search: "Besides Rare Drumpler, Rare Fwog, and Rare Maw, Double-Element Naturals take 10 hours and 30 minutes.",
      fact: "Most Rare Natural Doubles take 10 hours and 30 minutes.",
    },
    {
      id: "rare_natural_triples_time",
      search: "All Rare Triple-Element Naturals besides Rare T-Rox take 15 hours and 30 minutes.",
      fact: "Most Rare Natural Triples take 15 hours and 30 minutes.",
    },
    {
      id: "rare_trox_exception",
      search: "Rare T-Rox instead takes only 10 hours and 30 minutes",
      fact: "Rare T-Rox is a Rare Triple exception and only takes 10 hours and 30 minutes.",
    },
    {
      id: "rare_natural_quads_time",
      search: "All Rare Quad-Element Naturals take 1 day, 6 hours, and 30 minutes.",
      fact: "Rare Natural Quads take 1 day, 6 hours, and 30 minutes.",
    },
    {
      id: "rare_fire_double_time",
      search: "This means that the Rare Double-Element Fire Hybrids take 13 hours and 30 minutes.",
      fact: "Rare Fire Double-Element Hybrids take 13 hours and 30 minutes.",
    },
    {
      id: "rare_fire_triple_time",
      search: "The Rare Triple-Element Fire Hybrids take 1 day, 2 hours and 30 minutes.",
      fact: "Rare Fire Triple-Element Hybrids take 1 day, 2 hours and 30 minutes.",
    },
    {
      id: "rare_fire_quad_time",
      search: "Rare Quad-Element Fire Hybrids take 2 days, 4 hours and 30 minutes.",
      fact: "Rare Fire Quad-Element Hybrids take 2 days, 4 hours and 30 minutes.",
    },
    {
      id: "rare_quint_time",
      search: "That means they take 3 days, 23 hours and 30 minutes to incubate.",
      fact: "Rare Quint-Element Fire Hybrids and Rare Mimic use a 3 day 23 hour 30 minute timing rule.",
    },
    {
      id: "rare_magical_double_time",
      search: "This means that the Rare Double-Element Magicals take 12 hours and 30 minutes.",
      fact: "Rare Double-Element Magicals take 12 hours and 30 minutes.",
    },
    {
      id: "rare_magical_triple_time",
      search: "The Rare Triple-Element Magicals take 1 day, 1 hour and 30 minutes.",
      fact: "Rare Triple-Element Magicals take 1 day, 1 hour and 30 minutes.",
    },
  ],
};

Object.assign(FACT_DEFINITIONS, {
  rareTiming: [
    ...FACT_DEFINITIONS.rareTiming,
    {
      id: "rare_magical_impure_quad_time",
      search: "This means that it would take 1 day, 18 hours, 30 minutes to breed/incubate.",
      fact: "Rare Quad-Element Impure Magicals take 1 day, 18 hours, 30 minutes.",
    },
    {
      id: "rare_rarethereal_natural_time",
      search: "Single Element Rarethereals on the regular and Mirror Natural Islands take 1 day, 21 hours, and 30 minutes.",
      fact: "Single-Element Rarethereals on regular or Mirror Natural Islands take 1 day, 21 hours, and 30 minutes.",
    },
    {
      id: "rare_rarethereal_ethereal_time",
      search: "Single Element Rarethereals on Ethereal Island have a multiplier of 1.2638",
      fact: "Single-Element Rarethereals on Ethereal Island use a distinct 12 hour 38 minute 20 second timing pattern.",
    },
    {
      id: "rare_double_rarethereal_time",
      search: "Double Element Rarethereals (besides Rare Fung Pray) and Rare Wubbox have a multiplier of 1.25",
      fact: "Most Double-Element Rarethereals and Rare Wubbox follow a 1.25 timing multiplier without the extra 30 minutes seen on most other Rares.",
    },
  ],
  epicBreeding: [
    {
      id: "epics_limited_time",
      search: "Epic Monsters, similar to their Rare counterparts are only available for breeding and buying at select times.",
      fact: "Epics are limited-time breeding or purchase targets.",
    },
    {
      id: "epics_unique_combo_per_island",
      search: "Each Epic will have its own unique Breeding combination per Island.",
      fact: "Each Epic has its own island-specific breeding combination.",
    },
    {
      id: "epics_not_required_to_have_rare_first",
      search: "Rare Monsters are not required to breed or unlock an Epic Monster",
      fact: "Owning the Rare version is not required to breed or unlock an Epic.",
    },
    {
      id: "epics_cannot_be_parents",
      search: "Unlike Rares, Epics are incapable of breeding, and will not show up in the list of possible \"parents\" in a Breeding Structure.",
      fact: "Epics cannot be used as breeding parents and should not appear in parent-selection UI.",
    },
    {
      id: "epic_patterns_exist",
      search: "Epic Monsters follow a set pattern for their breeding combination.",
      fact: "Epic breeding does follow pattern families by monster class and island, but the exact combination data still belongs in a dedicated combo dataset.",
    },
    {
      id: "epic_time_patterns_exist",
      search: "Besides Epic Seasonals and Epic Mythicals, all Epic Natural and Fire Monsters have a well-rounded breeding time",
      fact: "Epic Natural and Fire monsters follow broad timing patterns, but those patterns are not a substitute for storing per-monster times.",
    },
    {
      id: "amber_epics_not_bred",
      search: "On Amber Island, Monsters cannot be bred. Instead, Epics are obtained by evolving",
      fact: "Amber Island Epics are obtained through Crucible evolution rather than breeding.",
    },
    {
      id: "wublin_epics_not_bred",
      search: "On Wublin Island, Monsters cannot be bred. Instead, Epics are obtained by unlocking a Rare Wublin's evolutionary potential",
      fact: "Wublin Island Epics are not bred directly; they follow Rare Wublin evolution plus inventory filling.",
    },
  ],
  timerAndIdentification: [
    {
      id: "post_37_time_format",
      search: "After version 3.7.0, all times in game changed format.",
      fact: "Modern in-game time format is `Xd Xh Xm`, with seconds only shown for times below one day.",
    },
    {
      id: "lookup_time_when_unsure",
      search: "If you are unsure of what Monster you bred, try looking up the closest matching time in the table below",
      fact: "Timer lookup is a valid identification tool when the result is uncertain.",
    },
    {
      id: "same_time_needs_context",
      search: "Many Monsters have the same times, but for most of them you can think logically to tell them apart.",
      fact: "Timer alone is not always enough; island and actual parent pair are also needed to narrow outcomes.",
    },
    {
      id: "some_results_not_distinguishable",
      search: "Other Monsters can't be told apart at all, such as the Shugafam on Shugabush Island",
      fact: "Some breeding outcomes cannot be distinguished from time alone at all, so a truthful `Mystery Egg` state is sometimes necessary.",
    },
    {
      id: "rare_shared_timer_overlap",
      search: "An example would be a Rare event where both Rare Noggin and Rare Mammott may result",
      fact: "Rare event overlaps can produce multiple possible monsters with the same timer, which means timer-based inference still has hard ambiguity cases.",
    },
  ],
  timeModifiers: [
    {
      id: "colossal_conundra_multiplier",
      search: "Since 3.8.4, the Colossal Conundra can include time reduction Boosts. These Boosts apply multiplicatively on top of other boosts.",
      fact: "Colossal Conundra time reduction boosts stack multiplicatively with other reductions rather than adding directly.",
    },
    {
      id: "colossingum_ethereal_time",
      search: "Single-Element Ethereal Monsters on The Colossingum have the same incubation time that they have on the Natural Islands.",
      fact: "Single-Element Ethereals on The Colossingum use the same incubation time as they do on the Natural Islands.",
    },
  ],
});

const FUTURE_INBOX_FORMAT = {
  bestPerMonsterFields: [
    "monster name",
    "class or rarity",
    "breedable as result",
    "usable as parent",
    "island",
    "breeding combo",
    "breeding time",
    "enhanced breeding time",
    "availability note",
    "special exception note",
  ],
  usefulMechanicTopics: [
    "breeding rules",
    "timer ambiguity rules",
    "time reduction math",
    "limited-time availability behavior",
    "special island exceptions",
  ],
  recommendedDumpStyle: [
    "paste one whole wiki page block at a time when using raw dumps",
    "or use a small structured per-monster format when you already know the exact facts you want preserved",
    "the parser will archive processed page dumps and remove them from the live inbox",
  ],
  ignoreNoise: [
    "lore or flavor prose",
    "release history timelines unless availability logic depends on them",
    "gallery text",
    "currency and sale values unless a feature explicitly needs them",
    "repeated icon labels",
    "long trivia sections",
  ],
};

const RESEARCH_BACKLOG = [
  {
    topic: "Promote validated combo candidates",
    note: "The parser now extracts structured combo candidates from raw Breeding Combinations dumps, but those candidates should still be reviewed before promotion into src/data/breedingCombos.js.",
  },
  {
    topic: "Promote validated breeding-time candidates",
    note: "The parser now extracts grouped breeding-time candidates from raw Breeding Times dumps, but they remain research data until reviewed against runtime needs.",
  },
  {
    topic: "Epic breeding combinations page",
    note: "The inbox captured Epic mechanics rules, but full per-island Epic combo extraction still needs a dedicated page dump and parser pass.",
  },
  {
    topic: "Limited-time availability",
    note: "Breeding Availability still needs its own structured dataset if the app later supports event-aware or time-window sheets.",
  },
  {
    topic: "Manual breed UI follow-up",
    note: "Epics should be excluded from parent pickers, and parent options should be sorted by breeding usefulness rather than alphabetically.",
  },
];

function normalizeLineEndings(value)
{
  return value.replace(/\r\n/g, "\n");
}

function normalizeWhitespace(value)
{
  return value.replace(/\s+/g, " ").trim();
}

function collapseBlankLines(value)
{
  return value.replace(/\n{3,}/g, "\n\n");
}

function uniqueValues(values)
{
  return [...new Set(values.filter(Boolean))];
}

function parseRarity(monsterName)
{
  if (monsterName.startsWith("Epic "))
  {
    return "Epic";
  }

  if (monsterName.startsWith("Rare "))
  {
    return "Rare";
  }

  return "Common";
}

function findSourceLine(lines, search)
{
  const lineIndex = lines.findIndex((line) => line.includes(search));

  if (lineIndex === -1)
  {
    return null;
  }

  return {
    line: lineIndex + 1,
    text: normalizeWhitespace(lines[lineIndex]),
  };
}

function createFact(lines, definition)
{
  const source = findSourceLine(lines, definition.search);

  if (!source)
  {
    return null;
  }

  return {
    id: definition.id,
    fact: definition.fact,
    sourceLine: source.line,
    sourceText: source.text,
  };
}

function buildMarkdownSection(title, facts)
{
  if (facts.length === 0)
  {
    return `## ${title}\n\nNo extracted facts were found for this section.\n`;
  }

  const lines = [`## ${title}`, ""];

  facts.forEach((fact) =>
  {
    lines.push(`- ${fact.fact}`);
    lines.push(`  - Source: line ${fact.sourceLine}`);
    lines.push(`  - Evidence: ${fact.sourceText}`);
  });

  lines.push("");

  return lines.join("\n");
}

function loadExistingOutput(outputPath)
{
  if (!fs.existsSync(outputPath))
  {
    return null;
  }

  try
  {
    return JSON.parse(fs.readFileSync(outputPath, "utf8"));
  }
  catch
  {
    return null;
  }
}

function mergeFacts(existingFactsByCategory = {}, newFactsByCategory = {})
{
  const merged = {};
  const categories = uniqueValues([
    ...Object.keys(existingFactsByCategory),
    ...Object.keys(newFactsByCategory),
  ]);

  categories.forEach((category) =>
  {
    const mergedById = new Map();

    (existingFactsByCategory[category] || []).forEach((fact) =>
    {
      mergedById.set(fact.id, fact);
    });

    (newFactsByCategory[category] || []).forEach((fact) =>
    {
      mergedById.set(fact.id, fact);
    });

    merged[category] = [...mergedById.values()].sort((a, b) =>
    {
      if ((a.sourceLine || 0) !== (b.sourceLine || 0))
      {
        return (a.sourceLine || 0) - (b.sourceLine || 0);
      }

      return a.id.localeCompare(b.id);
    });
  });

  return merged;
}

function mergeRecords(existingRecords, newRecords, getKey)
{
  const mergedByKey = new Map();

  existingRecords.forEach((record) =>
  {
    mergedByKey.set(getKey(record), record);
  });

  newRecords.forEach((record) =>
  {
    mergedByKey.set(getKey(record), record);
  });

  return [...mergedByKey.values()];
}

function extractPageSections(lines)
{
  const starts = [];

  for (let index = 0; index < lines.length - 1; index += 1)
  {
    const line = normalizeWhitespace(lines[index]);
    const nextLine = normalizeWhitespace(lines[index + 1] || "");

    if (KNOWN_PAGE_TITLES.includes(line) && nextLine === "Talk")
    {
      starts.push({
        title: line,
        startIndex: index,
      });
    }
  }

  return starts.map((sectionStart, index) =>
  {
    const nextSection = starts[index + 1];
    const endIndex = nextSection ? nextSection.startIndex - 1 : lines.length - 1;

    return {
      title: sectionStart.title,
      startIndex: sectionStart.startIndex,
      endIndex,
      lines: lines.slice(sectionStart.startIndex, endIndex + 1),
    };
  });
}

function stripProcessedSections(lines, sections)
{
  if (sections.length === 0)
  {
    return lines;
  }

  const sortedSections = [...sections].sort((a, b) => a.startIndex - b.startIndex);
  const remaining = [];
  let cursor = 0;

  sortedSections.forEach((section) =>
  {
    if (cursor < section.startIndex)
    {
      remaining.push(...lines.slice(cursor, section.startIndex));
    }

    cursor = section.endIndex + 1;
  });

  if (cursor < lines.length)
  {
    remaining.push(...lines.slice(cursor));
  }

  return remaining;
}

function buildTrimmedInboxText(remainingLines)
{
  const trimmed = collapseBlankLines(remainingLines.join("\n")).trim();

  if (trimmed)
  {
    return `${trimmed}\n`;
  }

  return [
    "# MSM Tracker Inbox",
    "",
    "Drop new raw research or wiki dumps below.",
    "",
    "Processed page dumps are automatically moved to `data-entry/inboxArchive.md` by `data-entry/parseInboxResearch.mjs`.",
    "",
  ].join("\n");
}

function appendArchive(archivePath, sections)
{
  if (sections.length === 0)
  {
    return;
  }

  const existingArchive = fs.existsSync(archivePath)
    ? fs.readFileSync(archivePath, "utf8").trimEnd()
    : [
      "# Inbox Archive",
      "",
      "Processed raw page dumps are moved here by `data-entry/parseInboxResearch.mjs`.",
    ].join("\n");

  const timestamp = new Date().toISOString();
  const entryLines = [
    `## ${timestamp}`,
    "",
  ];

  sections.forEach((section) =>
  {
    entryLines.push(`### ${section.title}`);
    entryLines.push("");
    entryLines.push(`Source lines: ${section.startIndex + 1}-${section.endIndex + 1}`);
    entryLines.push("");
    entryLines.push("```text");
    entryLines.push(section.lines.join("\n"));
    entryLines.push("```");
    entryLines.push("");
  });

  fs.writeFileSync(
    archivePath,
    `${existingArchive}\n\n${entryLines.join("\n").trimEnd()}\n`,
    "utf8"
  );
}

function extractElements(line)
{
  return uniqueValues(
    [...line.matchAll(/([A-Za-z' -]+) Element/g)].map((match) => normalizeWhitespace(match[1]))
  );
}

function normalizeIslandName(value)
{
  return normalizeWhitespace(value.replace(/ Island$/, ""));
}

function extractIslands(line)
{
  return uniqueValues(
    [...line.matchAll(/([A-Za-z' -]+?) Icon/g)].map((match) => normalizeIslandName(match[1]))
  );
}

function looksLikePageBoundary(lines, index)
{
  const line = normalizeWhitespace(lines[index] || "");
  const nextLine = normalizeWhitespace(lines[index + 1] || "");

  return KNOWN_PAGE_TITLES.includes(line) && nextLine === "Talk";
}

function isComboMonsterStart(lines, index)
{
  const currentLine = normalizeWhitespace(lines[index] || "");
  const nextLine = normalizeWhitespace(lines[index + 1] || "");

  if (!currentLine || currentLine !== nextLine)
  {
    return false;
  }

  if (COMBO_CATEGORY_MAP.has(currentLine) || COMBO_SUBCLASS_MAP.has(currentLine))
  {
    return false;
  }

  return !COMBO_IGNORED_LINES.has(currentLine);
}

function splitStandardTimeLine(line)
{
  const match = line.match(/^(.*?)(\d+\s*(?:d|h|m|s)(?:\s+\d+\s*(?:h|m|s))*)$/);

  if (!match)
  {
    return null;
  }

  return {
    label: normalizeWhitespace(match[1]),
    time: normalizeWhitespace(match[2]),
  };
}

function splitEnhancedComboLine(line)
{
  const match = line.match(/^\(([^)]+)\)\s*(.*)$/);

  if (!match)
  {
    return null;
  }

  return {
    time: normalizeWhitespace(match[1]),
    trailing: normalizeWhitespace(match[2]),
  };
}

function normalizeComboText(line)
{
  const normalized = normalizeWhitespace(line);

  if (
    !normalized
    || normalized.includes("Portrait")
    || normalized.includes("Prize Portrait")
    || COMBO_IGNORED_LINES.has(normalized)
  )
  {
    return null;
  }

  return normalized;
}

function parseParentPairText(text)
{
  if (!text || text.includes("Portrait"))
  {
    return null;
  }

  const parts = text.includes(" and ")
    ? text.split(/\s+and\s+/)
    : text.includes(" + ")
      ? text.split(/\s+\+\s+/)
      : null;

  if (!parts || parts.length !== 2)
  {
    return null;
  }

  return parts.map((part) => normalizeWhitespace(part));
}

function classifyParserConfidence(record)
{
  if (
    record.breedingTime
    && record.enhancedBreedingTime
    && (record.combinations.length > 0 || record.genericCombinations.length > 0)
    && record.breedableOn.length > 0
  )
  {
    return "high";
  }

  if (record.breedingTime && record.enhancedBreedingTime)
  {
    return "medium";
  }

  return "low";
}

function parseComboEntry({ monsterName, blockLines, category, subclass, sourceLine })
{
  const elements = [];
  const rawCombinationLines = [];
  const islands = [];
  const notes = [];
  let breedingTime = null;
  let enhancedBreedingTime = null;

  blockLines.forEach((rawLine) =>
  {
    const line = normalizeWhitespace(rawLine);

    if (!line)
    {
      return;
    }

    const elementMatches = extractElements(line);

    if (elementMatches.length > 0)
    {
      elements.push(...elementMatches);
      return;
    }

    if (!breedingTime)
    {
      const timeMatch = splitStandardTimeLine(line);

      if (timeMatch)
      {
        if (timeMatch.label)
        {
          rawCombinationLines.push(timeMatch.label);
        }

        breedingTime = timeMatch.time;
        return;
      }

      const comboText = normalizeComboText(line);

      if (comboText)
      {
        rawCombinationLines.push(comboText);
      }

      return;
    }

    if (!enhancedBreedingTime)
    {
      const enhancedMatch = splitEnhancedComboLine(line);

      if (enhancedMatch)
      {
        enhancedBreedingTime = enhancedMatch.time;
        islands.push(...extractIslands(enhancedMatch.trailing));
        return;
      }
    }

    const islandMatches = extractIslands(line);

    if (islandMatches.length > 0)
    {
      islands.push(...islandMatches);
      return;
    }

    if (!COMBO_IGNORED_LINES.has(line))
    {
      notes.push(line);
    }
  });

  const combinations = [];
  const genericCombinations = [];

  uniqueValues(rawCombinationLines).forEach((line) =>
  {
    const pair = parseParentPairText(line);

    if (pair)
    {
      combinations.push(pair);
      return;
    }

    genericCombinations.push(line);
  });

  const record = {
    monsterName,
    rarity: parseRarity(monsterName),
    category,
    subclass,
    elements: uniqueValues(elements),
    breedableOn: uniqueValues(islands),
    combinations,
    genericCombinations: uniqueValues(genericCombinations),
    breedingTime,
    enhancedBreedingTime,
    notes: uniqueValues(notes).join(" ") || null,
    sourceLine,
  };

  return {
    ...record,
    parserConfidence: classifyParserConfidence(record),
  };
}

function parseComboCandidates(section)
{
  if (!section)
  {
    return [];
  }

  const lines = section.lines;
  const listIndexes = [];

  lines.forEach((line, index) =>
  {
    if (normalizeWhitespace(line) === "List of Monsters")
    {
      listIndexes.push(index);
    }
  });

  const parseStartIndex = listIndexes[1] ?? listIndexes[0] ?? 0;
  let currentCategory = null;
  let currentSubclass = null;
  const candidates = [];

  for (let index = parseStartIndex; index < lines.length; index += 1)
  {
    if (looksLikePageBoundary(lines, index))
    {
      break;
    }

    const line = normalizeWhitespace(lines[index]);

    if (!line)
    {
      continue;
    }

    if (COMBO_CATEGORY_MAP.has(line))
    {
      currentCategory = COMBO_CATEGORY_MAP.get(line);
      currentSubclass = null;
      continue;
    }

    if (COMBO_SUBCLASS_MAP.has(line))
    {
      currentSubclass = COMBO_SUBCLASS_MAP.get(line);
      continue;
    }

    if (!isComboMonsterStart(lines, index))
    {
      continue;
    }

    const blockLines = [];
    let blockIndex = index + 2;

    while (blockIndex < lines.length)
    {
      const blockLine = normalizeWhitespace(lines[blockIndex]);

      if (
        looksLikePageBoundary(lines, blockIndex)
        || COMBO_CATEGORY_MAP.has(blockLine)
        || COMBO_SUBCLASS_MAP.has(blockLine)
        || isComboMonsterStart(lines, blockIndex)
      )
      {
        break;
      }

      blockLines.push(lines[blockIndex]);
      blockIndex += 1;
    }

    const record = parseComboEntry({
      monsterName: line,
      blockLines,
      category: currentCategory,
      subclass: currentSubclass,
      sourceLine: section.startIndex + index + 1,
    });

    if (
      record.breedingTime
      || record.enhancedBreedingTime
      || record.combinations.length > 0
      || record.genericCombinations.length > 0
    )
    {
      candidates.push(record);
    }

    index = blockIndex - 1;
  }

  return candidates;
}

function cleanTimeMonsterName(line)
{
  const normalized = normalizeWhitespace(line);

  if (
    !normalized
    || normalized.startsWith("(")
    || TIME_TABLE_HEADER_LINES.has(normalized)
    || normalized.includes("time effect")
    || normalized.endsWith(":")
  )
  {
    return null;
  }

  return normalizeWhitespace(normalized.replace(/\s+[A-Za-z' -]+ Icon$/, ""));
}

function parseTimeDetails(detailLines)
{
  const normalizedRows = detailLines.map((line) => normalizeWhitespace(line)).filter(Boolean);
  const parsed = {
    rawDetailRows: normalizedRows,
    standardBonusTime: null,
    enhancedTime: null,
    enhancedBonusTime: null,
    standardSkinTime: null,
    standardSkinBonusTime: null,
    enhancedSkinTime: null,
    enhancedSkinBonusTime: null,
  };

  const rowOne = normalizedRows[0]?.match(/^\(([^)]+)\)\s+(.+)$/);
  const rowTwo = normalizedRows[1]?.match(/^\(([^)]+)\)\s+(.+)$/);
  const rowThree = normalizedRows[2]?.match(/^\(([^)]+)\)\s+(.+)$/);
  const rowFour = normalizedRows[3]?.match(/^\(([^)]+)\)$/);

  if (rowOne)
  {
    parsed.standardBonusTime = normalizeWhitespace(rowOne[1]);
    parsed.enhancedTime = normalizeWhitespace(rowOne[2]);
  }

  if (rowTwo)
  {
    parsed.enhancedBonusTime = normalizeWhitespace(rowTwo[1]);
    parsed.standardSkinTime = normalizeWhitespace(rowTwo[2]);
  }

  if (rowThree)
  {
    parsed.standardSkinBonusTime = normalizeWhitespace(rowThree[1]);
    parsed.enhancedSkinTime = normalizeWhitespace(rowThree[2]);
  }

  if (rowFour)
  {
    parsed.enhancedSkinBonusTime = normalizeWhitespace(rowFour[1]);
  }

  return parsed;
}

function parseTimeCandidates(section)
{
  if (!section)
  {
    return [];
  }

  const lines = section.lines;
  const timesHeadingIndex = lines.findIndex((line) => normalizeWhitespace(line) === "Times");

  if (timesHeadingIndex === -1)
  {
    return [];
  }

  const candidates = [];
  const pendingMonsterNames = [];
  let index = timesHeadingIndex + 6;

  while (index < lines.length)
  {
    if (looksLikePageBoundary(lines, index))
    {
      break;
    }

    const line = normalizeWhitespace(lines[index]);

    if (!line)
    {
      index += 1;
      continue;
    }

    const timeMatch = splitStandardTimeLine(line);

    if (timeMatch && !line.startsWith("("))
    {
      const finalName = cleanTimeMonsterName(timeMatch.label);

      if (finalName)
      {
        pendingMonsterNames.push(finalName);
      }

      const detailLines = [];
      let detailIndex = index + 1;

      while (detailIndex < lines.length)
      {
        const detailLine = normalizeWhitespace(lines[detailIndex]);

        if (!detailLine.startsWith("("))
        {
          break;
        }

        detailLines.push(detailLine);
        detailIndex += 1;

        if (detailLines.length === 4)
        {
          break;
        }
      }

      const detail = parseTimeDetails(detailLines);
      const groupSourceLine = section.startIndex + index + 1;

      uniqueValues(pendingMonsterNames).forEach((monsterName) =>
      {
        candidates.push({
          monsterName,
          rarity: parseRarity(monsterName),
          standardTime: timeMatch.time,
          enhancedTime: detail.enhancedTime,
          standardBonusTime: detail.standardBonusTime,
          enhancedBonusTime: detail.enhancedBonusTime,
          standardSkinTime: detail.standardSkinTime,
          standardSkinBonusTime: detail.standardSkinBonusTime,
          enhancedSkinTime: detail.enhancedSkinTime,
          enhancedSkinBonusTime: detail.enhancedSkinBonusTime,
          rawDetailRows: detail.rawDetailRows,
          sourceLine: groupSourceLine,
          parserConfidence: detail.enhancedTime ? "high" : "medium",
        });
      });

      pendingMonsterNames.length = 0;
      index = detailIndex;
      continue;
    }

    if (!line.startsWith("(") && !TIME_TABLE_HEADER_LINES.has(line))
    {
      const monsterName = cleanTimeMonsterName(line);

      if (monsterName)
      {
        pendingMonsterNames.push(monsterName);
      }
    }

    index += 1;
  }

  return candidates;
}

function buildCurrentFacts(lines)
{
  const missingFacts = [];
  const factsByCategory = Object.fromEntries(
    Object.entries(FACT_DEFINITIONS).map(([category, definitions]) =>
    {
      const facts = definitions.map((definition) =>
      {
        const fact = createFact(lines, definition);

        if (!fact)
        {
          missingFacts.push(definition.id);
        }

        return fact;
      }).filter(Boolean);

      return [category, facts];
    })
  );

  return {
    factsByCategory,
    missingFacts,
  };
}

function buildComboKey(record)
{
  return [
    record.monsterName,
    record.category,
    record.subclass,
    record.breedingTime,
    record.enhancedBreedingTime,
    record.combinations.map((pair) => pair.join(" + ")).join(" | "),
    record.genericCombinations.join(" | "),
    record.breedableOn.join(" | "),
  ].join("::");
}

function buildTimeKey(record)
{
  return [
    record.monsterName,
    record.standardTime,
    record.enhancedTime,
    record.standardSkinTime,
    record.enhancedSkinTime,
  ].join("::");
}

function summarizeCandidates(comboCandidates, timeCandidates)
{
  const combosByRarity = comboCandidates.reduce((summary, record) =>
  {
    const rarity = record.rarity || "Common";
    summary[rarity] = (summary[rarity] || 0) + 1;
    return summary;
  }, {});

  const combosByCategory = comboCandidates.reduce((summary, record) =>
  {
    const category = record.category || "Unknown";
    summary[category] = (summary[category] || 0) + 1;
    return summary;
  }, {});

  const timesByRarity = timeCandidates.reduce((summary, record) =>
  {
    const rarity = record.rarity || "Common";
    summary[rarity] = (summary[rarity] || 0) + 1;
    return summary;
  }, {});

  return {
    comboCandidateCount: comboCandidates.length,
    timeCandidateCount: timeCandidates.length,
    combosByRarity,
    combosByCategory,
    timesByRarity,
  };
}

function buildOutput({ lines, existingOutput, processedSections, remainingInboxLineCount })
{
  const currentFacts = buildCurrentFacts(lines);
  const comboCandidates = parseComboCandidates(
    processedSections.find((section) => section.title === "Breeding Combinations")
  );
  const timeCandidates = parseTimeCandidates(
    processedSections.find((section) => section.title === "Breeding Times")
  );

  const mergedFacts = mergeFacts(
    existingOutput?.factsByCategory || {},
    currentFacts.factsByCategory
  );

  const mergedComboCandidates = mergeRecords(
    existingOutput?.candidateData?.comboCandidates || [],
    comboCandidates,
    buildComboKey
  );

  const mergedTimeCandidates = mergeRecords(
    existingOutput?.candidateData?.timeCandidates || [],
    timeCandidates,
    buildTimeKey
  );

  return {
    sourceFile: "data-entry/inbox.txt",
    archiveFile: "data-entry/inboxArchive.md",
    focus: "breeding_research_pipeline",
    generatedAt: new Date().toISOString().slice(0, 10),
    factsByCategory: mergedFacts,
    candidateData: {
      comboCandidates: mergedComboCandidates,
      timeCandidates: mergedTimeCandidates,
      summary: summarizeCandidates(mergedComboCandidates, mergedTimeCandidates),
    },
    latestRun: {
      processedSectionTitles: processedSections.map((section) => section.title),
      newMechanicsFactCount: Object.values(currentFacts.factsByCategory)
        .reduce((sum, facts) => sum + facts.length, 0),
      newComboCandidateCount: comboCandidates.length,
      newTimeCandidateCount: timeCandidates.length,
      remainingInboxLineCount,
    },
    processedInboxSections: [
      ...(existingOutput?.processedInboxSections || []),
      ...processedSections.map((section) => ({
        title: section.title,
        startLine: section.startIndex + 1,
        endLine: section.endIndex + 1,
        processedAt: new Date().toISOString(),
      })),
    ],
    futureInboxFormat: FUTURE_INBOX_FORMAT,
    researchBacklog: RESEARCH_BACKLOG,
    missingFactDefinitions: uniqueValues([
      ...(existingOutput?.missingFactDefinitions || []),
      ...currentFacts.missingFacts,
    ]),
    remainingInboxLineCount,
  };
}

function buildMarkdown(output)
{
  const sections = [
    "# Inbox Research Reference",
    "",
    "This file is generated from `data-entry/inbox.txt` by `data-entry/parseInboxResearch.mjs`.",
    "The parser merges new extractions into structured reference output, archives processed raw page dumps, and trims them out of the live inbox.",
    "",
    "## Latest Run",
    "",
    `- Processed sections: ${output.latestRun.processedSectionTitles.join(", ") || "none"}`,
    `- New mechanics facts found: ${output.latestRun.newMechanicsFactCount}`,
    `- New combo candidates found: ${output.latestRun.newComboCandidateCount}`,
    `- New time candidates found: ${output.latestRun.newTimeCandidateCount}`,
    `- Remaining inbox lines: ${output.latestRun.remainingInboxLineCount}`,
    "",
    "## Structured Candidate Summary",
    "",
    `- Combo candidates stored: ${output.candidateData.summary.comboCandidateCount}`,
    `- Time candidates stored: ${output.candidateData.summary.timeCandidateCount}`,
    `- Combo candidates by rarity: ${Object.entries(output.candidateData.summary.combosByRarity).map(([key, value]) => `${key} ${value}`).join(" · ") || "none"}`,
    `- Combo candidates by category: ${Object.entries(output.candidateData.summary.combosByCategory).map(([key, value]) => `${key} ${value}`).join(" · ") || "none"}`,
    `- Time candidates by rarity: ${Object.entries(output.candidateData.summary.timesByRarity).map(([key, value]) => `${key} ${value}`).join(" · ") || "none"}`,
    "",
    buildMarkdownSection("Core Breeding Mechanics", output.factsByCategory.coreBreeding || []),
    buildMarkdownSection("Rare Breeding Rules", output.factsByCategory.rareBreeding || []),
    buildMarkdownSection("Rare Timing Rules", output.factsByCategory.rareTiming || []),
    buildMarkdownSection("Epic Breeding Rules", output.factsByCategory.epicBreeding || []),
    buildMarkdownSection("Timer And Identification Rules", output.factsByCategory.timerAndIdentification || []),
    buildMarkdownSection("Time Modifier Rules", output.factsByCategory.timeModifiers || []),
    "## Future Inbox Format",
    "",
    "Useful per-monster fields to dump into `inbox.txt`:",
    ...output.futureInboxFormat.bestPerMonsterFields.map((item) => `- ${item}`),
    "",
    "Useful mechanics topics to dump into `inbox.txt`:",
    ...output.futureInboxFormat.usefulMechanicTopics.map((item) => `- ${item}`),
    "",
    "Recommended dump style:",
    ...output.futureInboxFormat.recommendedDumpStyle.map((item) => `- ${item}`),
    "",
    "Noise to avoid unless a feature explicitly needs it:",
    ...output.futureInboxFormat.ignoreNoise.map((item) => `- ${item}`),
    "",
    "## Research Backlog",
    "",
    ...output.researchBacklog.map((item) => `- ${item.topic}: ${item.note}`),
    "",
  ];

  return sections.join("\n");
}

const repoRoot = process.cwd();
const inboxPath = path.join(repoRoot, "data-entry", "inbox.txt");
const archivePath = path.join(repoRoot, "data-entry", "inboxArchive.md");
const jsonOutputPath = path.join(repoRoot, "data-entry", "parsedBreedingData.json");
const markdownOutputPath = path.join(repoRoot, "data-entry", "gameMechanicsReference.md");
const rawInbox = normalizeLineEndings(fs.readFileSync(inboxPath, "utf8"));
const lines = rawInbox.split("\n");
const existingOutput = loadExistingOutput(jsonOutputPath);
const pageSections = extractPageSections(lines);
const processedSections = pageSections.filter((section) => KNOWN_PAGE_TITLES.includes(section.title));
const trimmedInboxLines = stripProcessedSections(lines, processedSections);
const trimmedInboxText = buildTrimmedInboxText(trimmedInboxLines);
const remainingInboxLineCount = trimmedInboxText.split("\n").length;
const output = buildOutput({
  lines,
  existingOutput,
  processedSections,
  remainingInboxLineCount,
});
const markdown = buildMarkdown(output);

appendArchive(archivePath, processedSections);
fs.writeFileSync(jsonOutputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
fs.writeFileSync(markdownOutputPath, `${markdown}\n`, "utf8");
fs.writeFileSync(inboxPath, trimmedInboxText, "utf8");

console.log(
  `Processed ${processedSections.length} inbox page dump(s), stored ${output.candidateData.summary.comboCandidateCount} combo candidates and ${output.candidateData.summary.timeCandidateCount} time candidates, and trimmed inbox.txt to ${remainingInboxLineCount} lines`
);
