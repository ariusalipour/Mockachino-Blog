import { getCollection, type CollectionEntry } from "astro:content";

export interface Project {
  slug: string;
  name: string;
  summary: string;
  status: string;
  startedAt: string;
  updatedAt: string;
  repository?: string;
  repositoryPublic: boolean;
  liveUrl?: string;
  platforms: string[];
  stack: string[];
  tags: string[];
}

export interface ProjectUpdate {
  slug: string;
  project: string;
  title: string;
  summary: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
}

type ProjectContentEntry = CollectionEntry<"projects">;
type ProjectUpdateContentEntry = CollectionEntry<"project-updates">;

function updateSlug(entry: ProjectUpdateContentEntry) {
  return entry.data.slug ?? entry.slug.split("/").at(-1) ?? entry.slug;
}

function normalizeProject(entry: ProjectContentEntry): Project {
  return {
    slug: entry.slug,
    name: entry.data.name,
    summary: entry.data.summary,
    status: entry.data.status,
    startedAt: entry.data.startedAt.toISOString(),
    updatedAt: entry.data.updatedAt.toISOString(),
    repository: entry.data.repository,
    repositoryPublic: entry.data.repositoryPublic,
    liveUrl: entry.data.liveUrl,
    platforms: [...entry.data.platforms],
    stack: [...entry.data.stack],
    tags: [...entry.data.tags],
  };
}

function normalizeProjectUpdate(entry: ProjectUpdateContentEntry): ProjectUpdate {
  return {
    slug: updateSlug(entry),
    project: entry.data.project,
    title: entry.data.title,
    summary: entry.data.summary,
    createdAt: entry.data.createdAt.toISOString(),
    updatedAt: entry.data.updatedAt.toISOString(),
    tags: [...entry.data.tags],
  };
}

const [projectContentEntries, projectUpdateContentEntries] = await Promise.all([
  getCollection("projects"),
  getCollection("project-updates"),
]);

const sortedProjectEntries = projectContentEntries.slice().sort((left, right) => left.slug.localeCompare(right.slug));
const sortedProjectUpdateEntries = projectUpdateContentEntries.slice().sort((left, right) => {
  const updatedDiff = right.data.updatedAt.getTime() - left.data.updatedAt.getTime();
  if (updatedDiff !== 0) return updatedDiff;
  return left.slug.localeCompare(right.slug);
});

const projectContentBySlug = new Map(sortedProjectEntries.map((entry) => [entry.slug, entry]));
const projectUpdateContentByKey = new Map(
  sortedProjectUpdateEntries.map((entry) => [`${entry.data.project}:${updateSlug(entry)}`, entry]),
);

export const projects = sortedProjectEntries.map(normalizeProject);
export const projectUpdates = sortedProjectUpdateEntries.map(normalizeProjectUpdate);

export function getProject(slug: string) {
  return projects.find((project) => project.slug === slug);
}

export function getProjectContentEntry(slug: string) {
  return projectContentBySlug.get(slug);
}

export function getProjectUpdates(projectSlug: string) {
  return projectUpdates.filter((update) => update.project === projectSlug);
}

export function getProjectUpdate(projectSlug: string, updateSlugValue: string) {
  return projectUpdates.find((update) => update.project === projectSlug && update.slug === updateSlugValue);
}

export function getProjectUpdateContentEntry(projectSlug: string, updateSlugValue: string) {
  return projectUpdateContentByKey.get(`${projectSlug}:${updateSlugValue}`);
}
