import fs from "node:fs";
import path from "node:path";

import { MONSTER_REQUIREMENTS } from "../src/data/monsterRequirements.js";
import { MONSTER_DIRECTORY } from "../src/data/monsterDatabase.js";
import { BREEDING_COMBOS_ALL } from "../src/data/breedingCombos.js";
import { getMonsterBreedingIslands } from "../src/utils/monsterMetadata.js";

function uniqueSorted(values)
{
  return [...new Set((values || []).filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function titleCase(value)
{
  return String(value || "")
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getPopulatedRequirementSystems()
{
  return Object.entries(MONSTER_REQUIREMENTS)
    .filter(([, targets]) => Object.keys(targets || {}).length > 0)
    .map(([systemKey]) => systemKey);
}

function getBestBreedingEntry(entries)
{
  if (!entries || entries.length === 0)
  {
    return null;
  }

  return [...entries].sort((a, b) =>
  {
    const aHasCombo = Number((a.combinations || []).length > 0 || (a.genericCombinations || []).length > 0);
    const bHasCombo = Number((b.combinations || []).length > 0 || (b.genericCombinations || []).length > 0);
    const comboDifference = bHasCombo - aHasCombo;

    if (comboDifference !== 0)
    {
      return comboDifference;
    }

    const aHasTime = Number(Boolean(a.breedingTime));
    const bHasTime = Number(Boolean(b.breedingTime));
    const timeDifference = bHasTime - aHasTime;

    if (timeDifference !== 0)
    {
      return timeDifference;
    }

    const aHasEnhanced = Number(Boolean(a.enhancedBreedingTime));
    const bHasEnhanced = Number(Boolean(b.enhancedBreedingTime));
    const enhancedDifference = bHasEnhanced - aHasEnhanced;

    if (enhancedDifference !== 0)
    {
      return enhancedDifference;
    }

    return (a.monsterName || "").localeCompare(b.monsterName || "");
  })[0];
}

function getCoverageType(entry)
{
  if (!entry)
  {
    return "missing";
  }

  const hasCombo = (entry.combinations || []).length > 0 || (entry.genericCombinations || []).length > 0;
  const hasTime = Boolean(entry.breedingTime);

  if (hasCombo && hasTime)
  {
    return "combo_with_time";
  }

  if (hasCombo)
  {
    return "combo_missing_time";
  }

  if (hasTime)
  {
    return "time_only";
  }

  return "metadata_only";
}

function formatPercent(value, total)
{
  if (!total)
  {
    return "0.0%";
  }

  return `${((value / total) * 100).toFixed(1)}%`;
}

function formatList(values)
{
  return values.length > 0 ? values.join(", ") : "None";
}

function formatMonsterRow(monster)
{
  return `| ${monster.monsterName} | ${monster.totalRequired} | ${monster.referenceCount} | ${monster.systems.join(", ")} | ${monster.coverageType} | ${monster.breedableIslands.length > 0 ? monster.breedableIslands.join(", ") : "—"} |`;
}

const repoRoot = process.cwd();
const importedBreedingPath = path.join(repoRoot, "src", "data", "breedingCombosImported.json");
const jsonOutputPath = path.join(repoRoot, "data-entry", "operationalBreedingCoverage.json");
const markdownOutputPath = path.join(repoRoot, "data-entry", "operationalBreedingCoverage.md");

const importedBreedingData = JSON.parse(fs.readFileSync(importedBreedingPath, "utf8"));
const runtimeBreedingEntries = BREEDING_COMBOS_ALL.reduce((entryMap, entry) =>
{
  const currentEntries = entryMap.get(entry.monsterName) || [];
  currentEntries.push(entry);
  entryMap.set(entry.monsterName, currentEntries);
  return entryMap;
}, new Map());

const requirementSystems = getPopulatedRequirementSystems();
const requirementMonsterMap = new Map();

requirementSystems.forEach((systemKey) =>
{
  const targets = MONSTER_REQUIREMENTS[systemKey] || {};

  Object.entries(targets).forEach(([targetMonsterName, requirements]) =>
  {
    (requirements || []).forEach((requirement) =>
    {
      const current = requirementMonsterMap.get(requirement.name) || {
        monsterName: requirement.name,
        systems: new Set(),
        targetMonsterNames: new Set(),
        referenceCount: 0,
        totalRequired: 0,
        requirementIslands: new Set(),
      };

      current.systems.add(systemKey);
      current.targetMonsterNames.add(targetMonsterName);
      current.referenceCount += 1;
      current.totalRequired += Number(requirement.count || 0);
      current.requirementIslands.add(requirement.island || "");

      requirementMonsterMap.set(requirement.name, current);
    });
  });
});

const auditedMonsters = [...requirementMonsterMap.values()]
  .map((monster) =>
  {
    const runtimeMonsterEntry = MONSTER_DIRECTORY[monster.monsterName] || null;
    const bestBreedingEntry = getBestBreedingEntry(runtimeBreedingEntries.get(monster.monsterName) || []);
    const breedableIslands = runtimeMonsterEntry ? getMonsterBreedingIslands(monster.monsterName) : [];
    const coverageType = getCoverageType(bestBreedingEntry);
    const hasRequiredRuntimeFields = Boolean(runtimeMonsterEntry)
      && breedableIslands.length > 0
      && ["combo_with_time", "time_only"].includes(coverageType);

    return {
      monsterName: monster.monsterName,
      systems: [...monster.systems].sort((a, b) => a.localeCompare(b)),
      targetMonsterNames: [...monster.targetMonsterNames].sort((a, b) => a.localeCompare(b)),
      referenceCount: monster.referenceCount,
      totalRequired: monster.totalRequired,
      requirementIslands: [...monster.requirementIslands].filter(Boolean).sort((a, b) => a.localeCompare(b)),
      inMonsterDatabase: Boolean(runtimeMonsterEntry),
      breedableIslands,
      coverageType,
      hasBreedingTime: Boolean(bestBreedingEntry?.breedingTime),
      hasEnhancedBreedingTime: Boolean(bestBreedingEntry?.enhancedBreedingTime),
      breedingDataSource: bestBreedingEntry
        ? (
          importedBreedingData.importedCombos.some((entry) => entry.monsterName === monster.monsterName)
            ? "imported_combo"
            : importedBreedingData.timeOnlyEntries.some((entry) => entry.monsterName === monster.monsterName)
              ? "imported_time_only"
              : "hand_authored"
        )
        : "missing",
      isOperationallyComplete: hasRequiredRuntimeFields,
    };
  })
  .sort((a, b) =>
  {
    const requiredDifference = b.totalRequired - a.totalRequired;

    if (requiredDifference !== 0)
    {
      return requiredDifference;
    }

    return a.monsterName.localeCompare(b.monsterName);
  });

const totalRequirementMonsters = auditedMonsters.length;
const comboWithTimeMonsters = auditedMonsters.filter((monster) => monster.coverageType === "combo_with_time");
const timeOnlyMonsters = auditedMonsters.filter((monster) => monster.coverageType === "time_only");
const comboMissingTimeMonsters = auditedMonsters.filter((monster) => monster.coverageType === "combo_missing_time");
const missingBreedingDataMonsters = auditedMonsters.filter((monster) => monster.coverageType === "missing" || monster.coverageType === "metadata_only");
const missingMonsterDatabaseEntries = auditedMonsters.filter((monster) => !monster.inMonsterDatabase);
const missingBreedabilityEntries = auditedMonsters.filter((monster) => monster.inMonsterDatabase && monster.breedableIslands.length === 0);
const missingEnhancedTimeMonsters = auditedMonsters.filter((monster) =>
{
  return monster.isOperationallyComplete && !monster.hasEnhancedBreedingTime;
});
const operationallyCompleteMonsters = auditedMonsters.filter((monster) => monster.isOperationallyComplete);

const blockingGapMonsters = auditedMonsters.filter((monster) =>
{
  return !monster.inMonsterDatabase
    || monster.breedableIslands.length === 0
    || ["missing", "metadata_only", "combo_missing_time"].includes(monster.coverageType);
});

const operationalTarget = {
  name: "Operational breeding coverage for tracked requirement monsters",
  includedSystems: requirementSystems,
  definition: [
    "The monster exists in the runtime monster database.",
    "The monster has at least one explicit breeding island in runtime metadata.",
    "The runtime breeding dataset includes a standard breeding time, supplied either by combo coverage or by time-only coverage.",
  ],
};

const auditOutput = {
  generatedAt: new Date().toISOString(),
  target: operationalTarget,
  summary: {
    totalRequirementMonsters,
    operationallyCompleteCount: operationallyCompleteMonsters.length,
    operationallyCompletePercent: formatPercent(operationallyCompleteMonsters.length, totalRequirementMonsters),
    comboWithTimeCount: comboWithTimeMonsters.length,
    timeOnlyCount: timeOnlyMonsters.length,
    comboMissingTimeCount: comboMissingTimeMonsters.length,
    missingBreedingDataCount: missingBreedingDataMonsters.length,
    missingMonsterDatabaseEntryCount: missingMonsterDatabaseEntries.length,
    missingBreedabilityCount: missingBreedabilityEntries.length,
    missingEnhancedTimeCount: missingEnhancedTimeMonsters.length,
    isOperationallyComplete: blockingGapMonsters.length === 0,
    isExactComboComplete: timeOnlyMonsters.length === 0 && comboMissingTimeMonsters.length === 0 && missingBreedingDataMonsters.length === 0,
  },
  parserBacklog: {
    unknownParsedComboNames: importedBreedingData.skipped?.unknownParsedComboNames || [],
    unknownParsedTimeNames: importedBreedingData.skipped?.unknownParsedTimeNames || [],
    ambiguousTimeOnlyMonsterNames: importedBreedingData.skipped?.ambiguousTimeOnlyMonsterNames || [],
  },
  blockingGapMonsters,
  timeOnlyMonsters,
  missingEnhancedTimeMonsters,
  auditedMonsters,
};

const markdown = `# Operational Breeding Coverage Audit

Generated: ${auditOutput.generatedAt}

## Target

- Included systems: ${operationalTarget.includedSystems.map(titleCase).join(", ")}
- Operational completeness means:
  - runtime monster database entry exists
  - explicit breeding-island metadata exists
  - runtime breeding data includes a standard breeding time through combo coverage or time-only coverage

## Summary

- Unique requirement monsters: ${totalRequirementMonsters}
- Operationally complete: ${auditOutput.summary.operationallyCompleteCount}/${totalRequirementMonsters} (${auditOutput.summary.operationallyCompletePercent})
- Combo coverage with time: ${auditOutput.summary.comboWithTimeCount}
- Time-only coverage: ${auditOutput.summary.timeOnlyCount}
- Combo coverage missing time: ${auditOutput.summary.comboMissingTimeCount}
- Missing runtime breeding data: ${auditOutput.summary.missingBreedingDataCount}
- Missing monster database entries: ${auditOutput.summary.missingMonsterDatabaseEntryCount}
- Missing breeding-island metadata: ${auditOutput.summary.missingBreedabilityCount}
- Missing enhanced times (quality-only gap): ${auditOutput.summary.missingEnhancedTimeCount}
- Operational completeness achieved: ${auditOutput.summary.isOperationallyComplete ? "Yes" : "No"}
- Exact combo completeness achieved: ${auditOutput.summary.isExactComboComplete ? "Yes" : "No"}

## Blocking Gaps

${blockingGapMonsters.length === 0
  ? "- None. All currently tracked requirement monsters meet the operational completeness target."
  : [
      "| Monster | Total Required | References | Systems | Coverage | Breedable On |",
      "| --- | ---: | ---: | --- | --- | --- |",
      ...blockingGapMonsters.map(formatMonsterRow),
    ].join("\n")}

## Time-Only Coverage (Operationally Complete, Still Worth Upgrading)

${timeOnlyMonsters.length === 0
  ? "- None."
  : [
      "| Monster | Total Required | References | Systems | Coverage | Breedable On |",
      "| --- | ---: | ---: | --- | --- | --- |",
      ...timeOnlyMonsters.map(formatMonsterRow),
    ].join("\n")}

## Missing Enhanced Times (Quality Gaps Only)

${missingEnhancedTimeMonsters.length === 0
  ? "- None."
  : [
      "| Monster | Total Required | References | Systems | Coverage | Breedable On |",
      "| --- | ---: | ---: | --- | --- | --- |",
      ...missingEnhancedTimeMonsters.map(formatMonsterRow),
    ].join("\n")}

## Parser / Promotion Backlog

- Unknown parsed combo names not yet modeled in the runtime monster database: ${auditOutput.parserBacklog.unknownParsedComboNames.length}
- Unknown parsed time names not yet modeled in the runtime monster database: ${auditOutput.parserBacklog.unknownParsedTimeNames.length}
- Ambiguous time-only candidates intentionally skipped during promotion: ${auditOutput.parserBacklog.ambiguousTimeOnlyMonsterNames.length}

### Ambiguous Time-Only Monsters

- ${formatList(auditOutput.parserBacklog.ambiguousTimeOnlyMonsterNames)}

### Unknown Parsed Time Names

- ${formatList(auditOutput.parserBacklog.unknownParsedTimeNames.slice(0, 40))}
${auditOutput.parserBacklog.unknownParsedTimeNames.length > 40 ? `- ...and ${auditOutput.parserBacklog.unknownParsedTimeNames.length - 40} more` : ""}
`;

fs.writeFileSync(jsonOutputPath, `${JSON.stringify(auditOutput, null, 2)}\n`, "utf8");
fs.writeFileSync(markdownOutputPath, `${markdown.trim()}\n`, "utf8");

console.log(
  `Audited ${totalRequirementMonsters} requirement monsters. `
  + `${operationallyCompleteMonsters.length} meet the operational coverage target; `
  + `${blockingGapMonsters.length} blocking gaps remain; `
  + `${timeOnlyMonsters.length} are time-only complete.`
);
