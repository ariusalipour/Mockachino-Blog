import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

interface CommitActivityCell {
  date: string;
  count: number;
}

export interface RepoStatus {
  version: string;
  lastCommitDate: string;
  lastCommitDisplayDate: string;
  lastCommitMessage: string;
  lastCommitHash: string;
  activity: CommitActivityCell[][];
  totalCommits: number;
  totalCommitsInWindow: number;
  windowWeeks: number;
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

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDisplayDate(dateValue: string) {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Unavailable";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Europe/London",
  }).format(date);
}

function buildActivityGrid(windowWeeks = 16) {
  const windowDays = windowWeeks * 7;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const counts = new Map<string, number>();
  const commitDates = runGit(`git log --since="${windowDays} days ago" --date=short --pretty=format:%ad`)
    .split(/\r?\n/)
    .filter(Boolean);

  for (const date of commitDates) {
    counts.set(date, (counts.get(date) ?? 0) + 1);
  }

  const days: CommitActivityCell[] = [];

  for (let index = windowDays - 1; index >= 0; index -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - index);
    const key = toDateKey(date);

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
    windowWeeks,
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
  const lastCommit = runGit('git log -1 --date=iso-strict --pretty=format:"%H|%ad|%s"');
  const [lastCommitHash = "unknown", lastCommitDate = "", lastCommitMessage = "No commit metadata"] =
    lastCommit.split("|");
  const totalCommits = Number.parseInt(runGit("git rev-list --count HEAD"), 10) || 0;

  return {
    version: readVersion(),
    lastCommitDate,
    lastCommitDisplayDate: formatDisplayDate(lastCommitDate),
    lastCommitMessage,
    lastCommitHash,
    totalCommits,
    ...buildActivityGrid(),
  };
}
