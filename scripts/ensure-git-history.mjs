import { execFileSync } from "node:child_process";

function git(args) {
  return execFileSync("git", args, {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function tryGit(args) {
  try {
    return git(args);
  } catch {
    return "";
  }
}

if (tryGit(["rev-parse", "--is-inside-work-tree"]) !== "true") {
  process.exit(0);
}

if (tryGit(["rev-parse", "--is-shallow-repository"]) !== "true") {
  process.exit(0);
}

try {
  git(["fetch", "--unshallow", "--tags", "--quiet"]);
} catch {
  tryGit(["fetch", "--depth=100000", "--tags", "--quiet"]);
}
