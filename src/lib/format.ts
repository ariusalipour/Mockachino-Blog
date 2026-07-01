import { getCategory, getTopic, type EntryKind, type TopicId } from "../data/wiki";

export function formatDate(dateValue: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(dateValue));
}

export function formatDateTime(dateValue: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(dateValue));
}

export function formatRelativeTime(dateValue: string) {
  const delta = Date.now() - Date.parse(dateValue);
  const hours = Math.max(1, Math.floor(delta / 3_600_000));

  if (hours < 24) return `${hours} hours ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} days ago`;

  const months = Math.floor(days / 30);
  return `${months} months ago`;
}

export function formatKind(kind: EntryKind) {
  return kind.toUpperCase();
}

export function formatTopicCategory(topicId: TopicId, categoryId: string) {
  const topic = getTopic(topicId);
  const category = getCategory(topicId, categoryId);

  return `${topic?.name ?? topicId} / ${category?.name ?? categoryId}`;
}
