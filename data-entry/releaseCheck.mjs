import fs from "node:fs";
import path from "node:path";

const STANDARD_RELEASE_BULLET_THRESHOLD = 8;
const COMPLETENESS_RELEASE_BULLET_THRESHOLD = 4;
const MINOR_RELEASE_BULLET_THRESHOLD = 10;

function readJson(filePath)
{
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readUnreleasedSection(changelogText)
{
  const startIndex = changelogText.indexOf("## [Unreleased]");

  if (startIndex === -1)
  {
    throw new Error("CHANGELOG.md is missing the [Unreleased] heading.");
  }

  const remaining = changelogText.slice(startIndex + "## [Unreleased]".length);
  const nextHeadingIndex = remaining.search(/\n## \[/);

  return (nextHeadingIndex === -1 ? remaining : remaining.slice(0, nextHeadingIndex)).trim();
}

function countBullets(markdownSection)
{
  return markdownSection
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "))
    .length;
}

function parseLatestReleasedVersion(changelogText)
{
  const match = changelogText.match(/^## \[(?!Unreleased)([^\]]+)\]/m);
  return match ? match[1] : null;
}

function parseSemver(version)
{
  const match = String(version || "").trim().match(/^(\d+)\.(\d+)\.(\d+)$/);

  if (!match)
  {
    throw new Error(`Unsupported version format: ${version}`);
  }

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
}

function formatSemver(version)
{
  return `${version.major}.${version.minor}.${version.patch}`;
}

function getSuggestedNextVersion(currentVersion, shouldSuggestMinor)
{
  const parsed = parseSemver(currentVersion);

  if (parsed.major === 0)
  {
    return shouldSuggestMinor
      ? formatSemver({ major: 0, minor: parsed.minor + 1, patch: 0 })
      : formatSemver({ major: 0, minor: parsed.minor, patch: parsed.patch + 1 });
  }

  return shouldSuggestMinor
    ? formatSemver({ major: parsed.major, minor: parsed.minor + 1, patch: 0 })
    : formatSemver({ major: parsed.major, minor: parsed.minor, patch: parsed.patch + 1 });
}

const repoRoot = process.cwd();
const packageJsonPath = path.join(repoRoot, "package.json");
const changelogPath = path.join(repoRoot, "CHANGELOG.md");
const auditPath = path.join(repoRoot, "data-entry", "operationalBreedingCoverage.json");

const packageJson = readJson(packageJsonPath);
const changelogText = fs.readFileSync(changelogPath, "utf8");
const auditOutput = fs.existsSync(auditPath) ? readJson(auditPath) : null;
const unreleasedSection = readUnreleasedSection(changelogText);
const unreleasedBulletCount = countBullets(unreleasedSection);
const latestReleasedVersion = parseLatestReleasedVersion(changelogText);
const operationalCompletenessAchieved = Boolean(auditOutput?.summary?.isOperationallyComplete);
const shouldRecommendRelease = unreleasedBulletCount >= STANDARD_RELEASE_BULLET_THRESHOLD
  || (operationalCompletenessAchieved && unreleasedBulletCount >= COMPLETENESS_RELEASE_BULLET_THRESHOLD);
const shouldSuggestMinor = operationalCompletenessAchieved || unreleasedBulletCount >= MINOR_RELEASE_BULLET_THRESHOLD;
const suggestedVersion = getSuggestedNextVersion(packageJson.version, shouldSuggestMinor);

console.log(`Current package version: ${packageJson.version}`);
console.log(`Latest released changelog version: ${latestReleasedVersion || "None"}`);
console.log(`Unreleased notable bullet count: ${unreleasedBulletCount}`);
console.log(`Operational completeness achieved: ${operationalCompletenessAchieved ? "Yes" : "No"}`);
console.log(`Release recommendation: ${shouldRecommendRelease ? "Yes" : "No"}`);
console.log(`Suggested next version: ${suggestedVersion}`);
console.log("");
console.log("Release thresholds:");
console.log(`- Standard release suggestion: ${STANDARD_RELEASE_BULLET_THRESHOLD}+ unreleased bullets`);
console.log(`- Reduced threshold after operational completeness: ${COMPLETENESS_RELEASE_BULLET_THRESHOLD}+ unreleased bullets`);
console.log("");

if (!auditOutput)
{
  console.log("Operational audit not found. Run `npm run audit:operational-data` before trusting the release recommendation.");
}
else if (!operationalCompletenessAchieved)
{
  console.log(`Blocking operational gaps remaining: ${auditOutput.blockingGapMonsters.length}`);
}
else
{
  console.log("Operational breeding coverage target is currently satisfied.");
}
