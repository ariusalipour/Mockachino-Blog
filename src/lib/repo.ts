import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

interface CommitActivityCell {
  date: string;
  count: number;
}

export interface RepoStatus {
  version: string;
  lastCommitDate: string;
  lastCommitMessage: string;
  lastCommitHash: string;
  activity: CommitActivityCell[][];
  totalCommitsInWindow: number;
}

function runGit(command: string) {
  try {
    return execSync(command, {
      cwd: process.cwd(),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "";
  }
}

function buildActivityGrid(windowDays = 84) {
  const now = new Date();
  const counts = new Map<string, number>();
  const commitDates = runGit(`git log --since="${windowDays} days ago" --date=short --pretty=format:%ad`)
    .split(/\r?\n/)
    .filter(Boolean);

  for (const date of commitDates) {
    counts.set(date, (counts.get(date) ?? 0) + 1);
  }

  const days: CommitActivityCell[] = [];

  for (let index = windowDays - 1; index >= 0; index -= 1) {
    const date = new Date(now);
    date.setUTCDate(now.getUTCDate() - index);
    const key = date.toISOString().slice(0, 10);

    days.push({
      date: key,
      count: counts.get(key) ?? 0,
    });
  }

  const columns: CommitActivityCell[][] = [];

  for (let index = 0; index < days.length; index += 7) {
    columns.push(days.slice(index, index + 7));
  }

  return {
    activity: columns,
    totalCommitsInWindow: commitDates.length,
  };
}

function readVersion() {
  try {
    const packageJson = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8"));
    return packageJson.version ?? "1.0.0";
  } catch {
    return "1.0.0";
  }
}

export function getRepoStatus(): RepoStatus {
  const lastCommit = runGit('git log -1 --date=iso --pretty=format:"%H|%ad|%s"');
  const [lastCommitHash = "unknown", lastCommitDate = new Date().toISOString(), lastCommitMessage = "No commit metadata"] =
    lastCommit.split("|");

  return {
    version: readVersion(),
    lastCommitDate,
    lastCommitMessage,
    lastCommitHash,
    ...buildActivityGrid(),
  };
}
