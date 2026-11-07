import { getCollection } from "astro:content";

const [courseEntries, lessonEntries, quizEntries] = await Promise.all([
  getCollection("courses"), getCollection("course-lessons"), getCollection("quizzes"),
]);

const lessonBySlug = new Map(lessonEntries.map(entry => [entry.data.slug, entry]));
const quizBySlug = new Map(quizEntries.map(entry => [entry.data.slug, entry]));
export const courses = courseEntries.slice().sort((left, right) => {
  return right.data.createdAt.getTime() - left.data.createdAt.getTime() || left.data.slug.localeCompare(right.data.slug);
});
export function getCourse(slug: string) { return courses.find(course => course.data.slug === slug); }
export function getQuiz(slug?: string) { return slug ? quizBySlug.get(slug) : undefined; }
export function getCourseLessons(course: typeof courseEntries[number]) {
  return course.data.lessons.flatMap(row => {
    const lesson = lessonBySlug.get(row.lesson);
    return lesson ? [{ lesson, quiz: getQuiz(row.quiz) }] : [];
  });
}
export function lessonHref(courseSlug: string, lessonSlug: string) {
  return `/courses/${courseSlug}/${lessonSlug}/`;
}
