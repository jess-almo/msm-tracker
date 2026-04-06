import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

function runGit(args, options = {})
{
  const result = spawnSync("git", args, {
    cwd: options.cwd,
    encoding: "utf8",
  });

  if (result.status !== 0)
  {
    const message = result.stderr?.trim() || result.stdout?.trim() || `git ${args.join(" ")} failed`;
    throw new Error(message);
  }

  return result.stdout.trim();
}

function tryGit(args, options = {})
{
  const result = spawnSync("git", args, {
    cwd: options.cwd,
    encoding: "utf8",
  });

  return {
    ok: result.status === 0,
    stdout: result.stdout.trim(),
    stderr: result.stderr.trim(),
  };
}

function parseLatestReleasedVersion(changelogText)
{
  const match = changelogText.match(/^## \[(?!Unreleased)([^\]]+)\]/m);
  return match ? match[1] : null;
}

const dryRun = process.argv.includes("--dry-run");
const repoRoot = process.cwd();
const packageJsonPath = path.join(repoRoot, "package.json");
const changelogPath = path.join(repoRoot, "CHANGELOG.md");

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
const changelogText = fs.readFileSync(changelogPath, "utf8");
const latestReleasedVersion = parseLatestReleasedVersion(changelogText);
const currentVersion = packageJson.version;
const tagName = `v${currentVersion}`;

if (latestReleasedVersion !== currentVersion)
{
  throw new Error(
    `package.json version ${currentVersion} does not match latest released changelog version ${latestReleasedVersion}. Run release prep first.`
  );
}

const workingTreeStatus = runGit(["status", "--porcelain"], { cwd: repoRoot });

if (workingTreeStatus && !dryRun)
{
  throw new Error("Working tree is not clean. Commit or stash changes before tagging a release.");
}

const headCommit = runGit(["rev-parse", "HEAD"], { cwd: repoRoot });
const existingTagCommit = tryGit(["rev-list", "-n", "1", tagName], { cwd: repoRoot });

if (existingTagCommit.ok && existingTagCommit.stdout && existingTagCommit.stdout !== headCommit)
{
  throw new Error(
    `${tagName} already exists and points to ${existingTagCommit.stdout}, not the current HEAD ${headCommit}.`
  );
}

if (dryRun)
{
  console.log(`Dry run for ${tagName}`);
  console.log(`- package.json version matches latest released changelog version: ${currentVersion}`);
  console.log(`- current HEAD: ${headCommit}`);
  console.log(`- working tree clean: ${workingTreeStatus ? "No" : "Yes"}`);
  console.log(`- local tag exists: ${existingTagCommit.ok ? "Yes" : "No"}`);
  console.log(existingTagCommit.ok
    ? `- local tag target: ${existingTagCommit.stdout}`
    : `- would create annotated tag ${tagName} at HEAD`);
  console.log(`- would push: refs/tags/${tagName}`);
  process.exit(0);
}

if (!existingTagCommit.ok)
{
  runGit(["tag", "-a", tagName, headCommit, "-m", tagName], { cwd: repoRoot });
  console.log(`Created annotated tag ${tagName} at ${headCommit}.`);
}
else
{
  console.log(`${tagName} already exists at ${existingTagCommit.stdout}.`);
}

runGit(["push", "origin", `refs/tags/${tagName}`], { cwd: repoRoot });
console.log(`Pushed ${tagName} to origin.`);
