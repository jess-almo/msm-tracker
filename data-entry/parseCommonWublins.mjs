import fs from "node:fs";
import path from "node:path";

const COMMON_WUBLIN_NAMES = [
  "Brump",
  "Zynth",
  "Poewk",
  "Thwok",
  "Dwumrohl",
  "Zuuker",
  "Screemu",
  "Tympa",
  "Dermit",
  "Gheegur",
  "Whajje",
  "Creepuscule",
  "Blipsqueak",
  "Scargo",
  "Astropod",
  "Pixolotl",
  "Bona-Petite",
  "Maulch",
  "Fleechwurm",
];

function escapeRegExp(value)
{
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeWhitespace(value)
{
  return value.replace(/\s+/g, " ").trim();
}

function extractCommonWublinSection(rawInput)
{
  const listStart = rawInput.indexOf("List of Wublins");

  if (listStart === -1)
  {
    throw new Error("Could not find the common Wublin table in data-entry/inbox.txt.");
  }

  const rareSectionStart = rawInput.indexOf("\nRare Wublins\n", listStart);

  if (rareSectionStart === -1)
  {
    return rawInput.slice(listStart);
  }

  return rawInput.slice(listStart, rareSectionStart);
}

function extractSpeciesBlock(section, name, nextName)
{
  const startPattern = new RegExp(`(?:^|\\n)${escapeRegExp(name)}\\n`, "m");
  const startMatch = section.match(startPattern);

  if (!startMatch || startMatch.index === undefined)
  {
    return "";
  }

  const blockStart = startMatch.index;

  if (!nextName)
  {
    return section.slice(blockStart);
  }

  const endPattern = new RegExp(`(?:^|\\n)${escapeRegExp(nextName)}\\n`, "m");
  const trailingSection = section.slice(blockStart + startMatch[0].length);
  const endMatch = trailingSection.match(endPattern);

  if (!endMatch || endMatch.index === undefined)
  {
    return section.slice(blockStart);
  }

  return section.slice(blockStart, blockStart + startMatch[0].length + endMatch.index);
}

function parseSpeciesBlock(name, block)
{
  const normalized = normalizeWhitespace(block);
  const requirements = Array.from(
    normalized.matchAll(/([A-Za-z' -]+)-eggx(\d+)/g)
  ).map((match) => ({
    name: normalizeWhitespace(match[1]),
    count: Number(match[2]),
  }));
  const totalsMatch = normalized.match(/\b(\d+)\s+\d[\d,]*\s+Coins\s+(\d+)\s+days?\b/i);

  return {
    name,
    rarity: "common",
    systemKey: "wublin",
    collectionKey: "wublins",
    totalEggs: totalsMatch ? Number(totalsMatch[1]) : 0,
    timeLimitDays: totalsMatch ? Number(totalsMatch[2]) : 0,
    requirements,
  };
}

function buildOutput(templates)
{
  return {
    sourceFile: "data-entry/inbox.txt",
    focus: "common_wublins_only",
    ignoredSections: [
      "lore",
      "awakening strategy prose",
      "fill prices",
      "release dates",
      "rare wublins",
      "epic wublins",
      "special/non-common sections",
    ],
    templates,
    normalizedRequirementsBySpecies: Object.fromEntries(
      templates.map((template) => [
        template.name,
        template.requirements.map((requirement) => ({
          name: requirement.name,
          count: requirement.count,
          island: "Natural",
          notes: "",
        })),
      ])
    ),
  };
}

const repoRoot = process.cwd();
const inboxPath = path.join(repoRoot, "data-entry", "inbox.txt");
const outputPath = path.join(repoRoot, "data-entry", "parsedWublinTemplates.json");
const rawInbox = fs.readFileSync(inboxPath, "utf8").replace(/\r\n/g, "\n");
const commonSection = extractCommonWublinSection(rawInbox);
const templates = COMMON_WUBLIN_NAMES.map((name, index) =>
{
  const nextName = COMMON_WUBLIN_NAMES[index + 1] || "";
  const block = extractSpeciesBlock(commonSection, name, nextName);

  return parseSpeciesBlock(name, block);
}).filter((template) => template.requirements.length > 0);
const output = buildOutput(templates);

fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");

console.log(
  `Parsed ${templates.length} common Wublin templates into data-entry/parsedWublinTemplates.json`
);
