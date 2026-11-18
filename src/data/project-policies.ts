import { getCollection } from "astro:content";
import { getProject } from "./projects";

const entries = await getCollection("project-policies");
const keys = new Set<string>();
export const projectPolicies = entries.map(entry => {
  const project = getProject(entry.data.project);
  const key = `${entry.data.project}:${entry.data.type}`;
  if (!project || keys.has(key)) throw new Error(`Invalid or duplicate project policy: ${key}`);
  keys.add(key);
  return { entry, project, type: entry.data.type, url: `/projects/${project.slug}/${entry.data.type}/` };
});
export function getProjectPolicies(slug: string) {
  return projectPolicies.filter(policy => policy.project.slug === slug);
}
