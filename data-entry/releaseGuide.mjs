import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

function tryGit(args, cwd)
{
  const result = spawnSync("git.exe", args, {
    cwd,
    encoding: "utf8",
  });

  return {
    ok: result.status === 0,
    stdout: String(result.stdout || "").trim(),
    stderr: String(result.stderr || "").trim(),
  };
}

function parseLatestReleasedVersion(changelogText)
{
  const match = changelogText.match(/^## \[(?!Unreleased)([^\]]+)\]/m);
  return match ? match[1] : null;
}

function fileSummary(filePath)
{
  if (!fs.existsSync(filePath))
  {
    return null;
  }

  const stats = fs.statSync(filePath);

  return {
    sizeMb: (stats.size / (1024 * 1024)).toFixed(2),
    modifiedAt: stats.mtime.toISOString(),
  };
}

const repoRoot = process.cwd();
const packageJsonPath = path.join(repoRoot, "package.json");
const changelogPath = path.join(repoRoot, "CHANGELOG.md");
const apkPath = path.join(repoRoot, "android", "app", "build", "outputs", "apk", "debug", "app-debug.apk");

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
const changelogText = fs.readFileSync(changelogPath, "utf8");
const version = packageJson.version;
const latestReleasedVersion = parseLatestReleasedVersion(changelogText);
const tagName = `v${version}`;
const workingTreeStatus = tryGit(["status", "--porcelain"], repoRoot);
const headCommit = tryGit(["rev-parse", "--short", "HEAD"], repoRoot);
const localTag = tryGit(["rev-list", "-n", "1", tagName], repoRoot);
const apk = fileSummary(apkPath);

console.log(`Release guide for ${version}`);
console.log(`- package.json version: ${version}`);
console.log(`- latest released changelog version: ${latestReleasedVersion || "None"}`);
console.log(`- current HEAD: ${headCommit.ok ? headCommit.stdout : "Unavailable"}`);
console.log(`- working tree clean: ${workingTreeStatus.ok ? (workingTreeStatus.stdout ? "No" : "Yes") : "Unavailable"}`);
console.log(`- local tag exists: ${localTag.ok ? "Yes" : "No"}`);
console.log(`- debug APK exists: ${apk ? `Yes (${apk.sizeMb} MB, ${apk.modifiedAt})` : "No"}`);
console.log("");

if (!workingTreeStatus.ok || !headCommit.ok)
{
  console.log("Note: git subprocess checks were unavailable in this environment, so verify `git status` manually before shipping.");
  console.log("");
}

console.log("Recommended next commands:");

if (latestReleasedVersion !== version)
{
  console.log(`1. npm run release:prepare -- ${version}`);
}
else
{
  console.log("1. package.json and changelog are already aligned for the current version.");
}

console.log("2. npm run build");
console.log("3. npm run release:notes");
console.log("4. npm run android:package-debug");
console.log("5. git status");
console.log(`6. git add package.json CHANGELOG.md data-entry/_releaseNotes.md`);
console.log(`7. git commit -m "release-${version}"`);
console.log("8. git push origin main");
console.log("9. npm run release:tag");
console.log(`10. git push origin ${tagName}`);
console.log(`11. gh release create ${tagName} "android\\app\\build\\outputs\\apk\\debug\\app-debug.apk" --title "${version}" --notes-file "data-entry\\_releaseNotes.md"`);
console.log("");
console.log("Keep the actual commit, push, tag, and GitHub release decisions manual.");
