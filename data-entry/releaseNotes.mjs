import fs from "node:fs";
import path from "node:path";

function parseVersionSections(changelogText)
{
  const lines = changelogText.split("\n");
  const sections = [];
  let current = null;

  for (const line of lines)
  {
    const versionMatch = line.match(/^## \[([^\]]+)\]/);

    if (versionMatch)
    {
      if (current)
      {
        sections.push(current);
      }

      current = {
        version: versionMatch[1],
        lines: [],
      };

      continue;
    }

    if (current)
    {
      current.lines.push(line);
    }
  }

  if (current)
  {
    sections.push(current);
  }

  return sections;
}

function buildReleaseNotes(section)
{
  const bodyLines = section.lines
    .map((line) => line.replace(/\s+$/g, ""))
    .filter((line, index, lines) =>
    {
      if (index === 0 && line.trim() === "")
      {
        return false;
      }

      if (index === lines.length - 1 && line.trim() === "")
      {
        return false;
      }

      return true;
    });

  return `${bodyLines.join("\n").trim()}\n`;
}

const repoRoot = process.cwd();
const packageJsonPath = path.join(repoRoot, "package.json");
const changelogPath = path.join(repoRoot, "CHANGELOG.md");
const outputPath = path.join(repoRoot, "data-entry", "_releaseNotes.md");

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
const changelogText = fs.readFileSync(changelogPath, "utf8");
const versionSections = parseVersionSections(changelogText);
const targetVersion = process.argv[2] || packageJson.version;
const section = versionSections.find((entry) => entry.version === targetVersion);

if (!section)
{
  throw new Error(`Could not find version section [${targetVersion}] in CHANGELOG.md.`);
}

const releaseNotes = buildReleaseNotes(section);

fs.writeFileSync(outputPath, releaseNotes, "utf8");

console.log(`Wrote release notes for ${targetVersion} to ${path.relative(repoRoot, outputPath)}.`);
console.log("");
console.log(releaseNotes);
