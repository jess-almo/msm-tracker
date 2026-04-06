import fs from "node:fs";
import path from "node:path";

function normalizeLineEndings(value)
{
  return value.replace(/\r\n/g, "\n");
}

function uniqueValues(values)
{
  return [...new Set((values || []).filter(Boolean))];
}

function sortByMonsterName(a, b)
{
  return (a.monsterName || "").localeCompare(b.monsterName || "");
}

function normalizeMonsterName(value)
{
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function extractMonsterNames(fileText, pattern)
{
  return [...new Set(
    [...normalizeLineEndings(fileText).matchAll(pattern)].map((match) => match[1])
  )];
}

function buildMonsterNameMap(monsterNames)
{
  return monsterNames.reduce((nameMap, monsterName) =>
  {
    nameMap.set(normalizeMonsterName(monsterName), monsterName);
    return nameMap;
  }, new Map());
}

function canonicalizeCandidateRecords(records, monsterNameMap)
{
  const unknownNames = [];
  const canonicalizedRecords = [];

  records.forEach((record) =>
  {
    const canonicalName = monsterNameMap.get(normalizeMonsterName(record.monsterName));

    if (!canonicalName)
    {
      unknownNames.push(record.monsterName);
      return;
    }

    canonicalizedRecords.push({
      ...record,
      monsterName: canonicalName,
    });
  });

  return {
    canonicalizedRecords,
    unknownNames: uniqueValues(unknownNames),
  };
}

function normalizeCombination(combination)
{
  if (!Array.isArray(combination))
  {
    return [];
  }

  return combination.filter(Boolean);
}

function normalizeCombinationList(combinations)
{
  const seen = new Set();

  return (combinations || [])
    .map(normalizeCombination)
    .filter((combination) => combination.length > 0)
    .filter((combination) =>
    {
      const key = JSON.stringify(combination);

      if (seen.has(key))
      {
        return false;
      }

      seen.add(key);
      return true;
    });
}

function scoreComboRecord(record)
{
  return (
    (Array.isArray(record.combinations) ? record.combinations.length * 100 : 0)
    + (Array.isArray(record.genericCombinations) ? record.genericCombinations.length * 20 : 0)
    + (Array.isArray(record.breedableOn) ? record.breedableOn.length * 5 : 0)
    + (Array.isArray(record.elements) ? record.elements.length * 3 : 0)
    + (record.breedingTime ? 2 : 0)
    + (record.enhancedBreedingTime ? 2 : 0)
    + (record.notes ? 1 : 0)
    + (record.parserConfidence === "high" ? 2 : 0)
  );
}

function chooseBestRecord(records, scoreFn)
{
  return [...records].sort((a, b) =>
  {
    const scoreDifference = scoreFn(b) - scoreFn(a);

    if (scoreDifference !== 0)
    {
      return scoreDifference;
    }

    return Number(a.sourceLine || 0) - Number(b.sourceLine || 0);
  })[0];
}

function uniqueNonNull(values)
{
  return uniqueValues(values.filter((value) => value !== null && value !== undefined));
}

function getResolvedScalar(records, fieldName, fallbackValue = null)
{
  const values = uniqueNonNull(records.map((record) => record[fieldName]));

  if (values.length === 1)
  {
    return values[0];
  }

  return fallbackValue;
}

function groupByMonsterName(records)
{
  return records.reduce((groups, record) =>
  {
    const current = groups.get(record.monsterName) || [];
    current.push(record);
    groups.set(record.monsterName, current);
    return groups;
  }, new Map());
}

function mergeComboRecords(records)
{
  const bestRecord = chooseBestRecord(records, scoreComboRecord);
  const notes = uniqueNonNull(records.map((record) => record.notes));

  return {
    monsterName: bestRecord.monsterName,
    rarity: getResolvedScalar(records, "rarity", bestRecord.rarity || "Common"),
    category: getResolvedScalar(records, "category", bestRecord.category || null),
    subclass: getResolvedScalar(records, "subclass", bestRecord.subclass || null),
    elements: uniqueValues(records.flatMap((record) => record.elements || [])),
    breedableOn: uniqueValues(records.flatMap((record) => record.breedableOn || [])),
    combinations: normalizeCombinationList(records.flatMap((record) => record.combinations || [])),
    genericCombinations: uniqueValues(records.flatMap((record) => record.genericCombinations || [])),
    breedingTime: getResolvedScalar(records, "breedingTime", bestRecord.breedingTime || null),
    enhancedBreedingTime: getResolvedScalar(records, "enhancedBreedingTime", bestRecord.enhancedBreedingTime || null),
    notes: notes.length > 0 ? notes.join(" | ") : null,
    sourceLine: bestRecord.sourceLine || null,
    parserConfidence: getResolvedScalar(records, "parserConfidence", bestRecord.parserConfidence || "medium"),
  };
}

function getTimeKey(record)
{
  return JSON.stringify([
    record.standardTime || record.breedingTime || null,
    record.enhancedTime || record.enhancedBreedingTime || null,
  ]);
}

function buildTimeOnlyEntry(record)
{
  return {
    monsterName: record.monsterName,
    rarity: record.rarity || "Common",
    category: null,
    subclass: null,
    elements: [],
    breedableOn: [],
    combinations: [],
    genericCombinations: [],
    breedingTime: record.standardTime || record.breedingTime || null,
    enhancedBreedingTime: record.enhancedTime || record.enhancedBreedingTime || null,
    notes: "Imported as time-only candidate from parsed breeding research.",
    sourceLine: record.sourceLine || null,
    parserConfidence: record.parserConfidence || "medium",
  };
}

const repoRoot = process.cwd();
const parsedPath = path.join(repoRoot, "data-entry", "parsedBreedingData.json");
const currentBreedingDataPath = path.join(repoRoot, "src", "data", "breedingCombos.js");
const monsterDatabasePath = path.join(repoRoot, "src", "data", "monsterDatabase.js");
const outputPath = path.join(repoRoot, "src", "data", "breedingCombosImported.json");

const parsedData = JSON.parse(fs.readFileSync(parsedPath, "utf8"));
const currentBreedingDataSource = fs.readFileSync(currentBreedingDataPath, "utf8");
const monsterDatabaseSource = fs.readFileSync(monsterDatabasePath, "utf8");

const existingProductionMonsterNames = new Set(extractMonsterNames(
  currentBreedingDataSource,
  /monsterName:\s*"([^"]+)"/g
));
const runtimeMonsterNames = extractMonsterNames(
  monsterDatabaseSource,
  /name:\s*"([^"]+)"/g
);
const runtimeMonsterNameMap = buildMonsterNameMap(runtimeMonsterNames);

const allComboCandidates = parsedData?.candidateData?.comboCandidates || [];
const allTimeCandidates = parsedData?.candidateData?.timeCandidates || [];
const {
  canonicalizedRecords: canonicalizedComboCandidates,
  unknownNames: unknownParsedComboNames,
} = canonicalizeCandidateRecords(allComboCandidates, runtimeMonsterNameMap);
const {
  canonicalizedRecords: canonicalizedTimeCandidates,
  unknownNames: unknownParsedTimeNames,
} = canonicalizeCandidateRecords(allTimeCandidates, runtimeMonsterNameMap);

const importedCombos = [...groupByMonsterName(canonicalizedComboCandidates).entries()]
  .filter(([monsterName]) => !existingProductionMonsterNames.has(monsterName))
  .map(([, records]) => mergeComboRecords(records))
  .sort(sortByMonsterName);

const namesAfterImportedCombos = new Set([
  ...existingProductionMonsterNames,
  ...importedCombos.map((record) => record.monsterName),
]);

const ambiguousTimeOnlyMonsterNames = [];

const timeOnlyEntries = [...groupByMonsterName(canonicalizedTimeCandidates).entries()]
  .filter(([monsterName]) => !namesAfterImportedCombos.has(monsterName))
  .map(([monsterName, records]) =>
  {
    const distinctTimeKeys = uniqueValues(records.map(getTimeKey));

    if (distinctTimeKeys.length !== 1)
    {
      ambiguousTimeOnlyMonsterNames.push(monsterName);
      return null;
    }

    const bestRecord = chooseBestRecord(
      records,
      (record) => (record.parserConfidence === "high" ? 2 : 0) + (record.enhancedTime ? 1 : 0)
    );

    return buildTimeOnlyEntry(bestRecord);
  })
  .filter(Boolean)
  .sort(sortByMonsterName);

const output = {
  source: "data-entry/parsedBreedingData.json",
  generatedAt: new Date().toISOString(),
  importedCombos,
  timeOnlyEntries,
  skipped: {
    unknownParsedComboNames,
    unknownParsedTimeNames,
    ambiguousTimeOnlyMonsterNames: ambiguousTimeOnlyMonsterNames.sort((a, b) => a.localeCompare(b)),
  },
};

fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");

console.log(
  `Promoted ${importedCombos.length} combo entries and ${timeOnlyEntries.length} time-only entries into src/data/breedingCombosImported.json. `
  + `Skipped ${unknownParsedComboNames.length} unknown combo names, ${unknownParsedTimeNames.length} unknown time names, `
  + `and ${ambiguousTimeOnlyMonsterNames.length} ambiguous time-only monsters.`
);
