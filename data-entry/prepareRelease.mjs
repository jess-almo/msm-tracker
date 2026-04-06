import fs from "node:fs";
import path from "node:path";

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

function compareSemver(a, b)
{
  if (a.major !== b.major)
  {
    return a.major - b.major;
  }

  if (a.minor !== b.minor)
  {
    return a.minor - b.minor;
  }

  return a.patch - b.patch;
}

function readUnreleasedSection(changelogText)
{
  const heading = "## [Unreleased]";
  const startIndex = changelogText.indexOf(heading);

  if (startIndex === -1)
  {
    throw new Error("CHANGELOG.md is missing the [Unreleased] heading.");
  }

  const contentStart = startIndex + heading.length;
  const remaining = changelogText.slice(contentStart);
  const nextHeadingIndex = remaining.search(/\n## \[/);
  const sectionContent = nextHeadingIndex === -1 ? remaining : remaining.slice(0, nextHeadingIndex);
  const trailingContent = nextHeadingIndex === -1 ? "" : remaining.slice(nextHeadingIndex);

  return {
    sectionContent: sectionContent.trim(),
    contentStart,
    trailingContent,
  };
}

const requestedVersion = process.argv[2];

if (!requestedVersion)
{
  console.error("Usage: npm run release:prepare -- <version>");
  process.exit(1);
}

const repoRoot = process.cwd();
const packageJsonPath = path.join(repoRoot, "package.json");
const changelogPath = path.join(repoRoot, "CHANGELOG.md");

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
const changelogText = fs.readFileSync(changelogPath, "utf8");
const currentVersion = parseSemver(packageJson.version);
const nextVersion = parseSemver(requestedVersion);

if (compareSemver(nextVersion, currentVersion) <= 0)
{
  throw new Error(`Requested version ${requestedVersion} must be greater than current version ${packageJson.version}.`);
}

const { sectionContent, contentStart, trailingContent } = readUnreleasedSection(changelogText);

if (!sectionContent || !sectionContent.split("\n").some((line) => line.trim().startsWith("- ")))
{
  throw new Error("The [Unreleased] section has no notable bullet entries to release.");
}

const today = new Date().toISOString().slice(0, 10);
const unreleasedPrefix = changelogText.slice(0, contentStart);
const newChangelog = `${unreleasedPrefix}\n\n## [${requestedVersion}] - ${today}\n\n${sectionContent}${trailingContent}`;

packageJson.version = requestedVersion;

fs.writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`, "utf8");
fs.writeFileSync(changelogPath, newChangelog.replace(/\n{3,}/g, "\n\n"), "utf8");

console.log(`Prepared release ${requestedVersion}.`);
console.log("Updated package.json version and moved [Unreleased] changelog notes into the new release section.");
console.log("Next steps: npm run build, git add, git commit, and git push.");
