import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`courses_lessons\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`lesson_id\` integer,
  	\`quiz_id\` integer,
  	FOREIGN KEY (\`lesson_id\`) REFERENCES \`course_lessons\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`quiz_id\`) REFERENCES \`quizzes\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`courses\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`courses_lessons_order_idx\` ON \`courses_lessons\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`courses_lessons_parent_id_idx\` ON \`courses_lessons\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`courses_lessons_lesson_idx\` ON \`courses_lessons\` (\`lesson_id\`);`)
  await db.run(sql`CREATE INDEX \`courses_lessons_quiz_idx\` ON \`courses_lessons\` (\`quiz_id\`);`)
  await db.run(sql`CREATE TABLE \`courses\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`topic\` text,
  	\`category\` text,
  	\`tags\` text DEFAULT '[]',
  	\`title\` text,
  	\`summary\` text,
  	\`content\` text,
  	\`featured_image_src\` text,
  	\`featured_image_alt\` text,
  	\`final_quiz_id\` integer,
  	\`source_path\` text,
  	\`course_id\` text,
  	\`slug\` text,
  	\`authored_at\` text,
  	\`revised_at\` text,
  	\`extra_frontmatter\` text,
  	\`body\` text,
  	\`content_migration\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`_status\` text DEFAULT 'draft',
  	FOREIGN KEY (\`final_quiz_id\`) REFERENCES \`quizzes\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`courses_final_quiz_idx\` ON \`courses\` (\`final_quiz_id\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`courses_source_path_idx\` ON \`courses\` (\`source_path\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`courses_slug_idx\` ON \`courses\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`courses_updated_at_idx\` ON \`courses\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`courses_created_at_idx\` ON \`courses\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`courses__status_idx\` ON \`courses\` (\`_status\`);`)
  await db.run(sql`CREATE TABLE \`_courses_v_version_lessons\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`lesson_id\` integer,
  	\`quiz_id\` integer,
  	\`_uuid\` text,
  	FOREIGN KEY (\`lesson_id\`) REFERENCES \`course_lessons\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`quiz_id\`) REFERENCES \`quizzes\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_courses_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_courses_v_version_lessons_order_idx\` ON \`_courses_v_version_lessons\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_courses_v_version_lessons_parent_id_idx\` ON \`_courses_v_version_lessons\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_courses_v_version_lessons_lesson_idx\` ON \`_courses_v_version_lessons\` (\`lesson_id\`);`)
  await db.run(sql`CREATE INDEX \`_courses_v_version_lessons_quiz_idx\` ON \`_courses_v_version_lessons\` (\`quiz_id\`);`)
  await db.run(sql`CREATE TABLE \`_courses_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`parent_id\` integer,
  	\`version_topic\` text,
  	\`version_category\` text,
  	\`version_tags\` text DEFAULT '[]',
  	\`version_title\` text,
  	\`version_summary\` text,
  	\`version_content\` text,
  	\`version_featured_image_src\` text,
  	\`version_featured_image_alt\` text,
  	\`version_final_quiz_id\` integer,
  	\`version_source_path\` text,
  	\`version_course_id\` text,
  	\`version_slug\` text,
  	\`version_authored_at\` text,
  	\`version_revised_at\` text,
  	\`version_extra_frontmatter\` text,
  	\`version_body\` text,
  	\`version_content_migration\` text,
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`version__status\` text DEFAULT 'draft',
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`latest\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`courses\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`version_final_quiz_id\`) REFERENCES \`quizzes\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`_courses_v_parent_idx\` ON \`_courses_v\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_courses_v_version_version_final_quiz_idx\` ON \`_courses_v\` (\`version_final_quiz_id\`);`)
  await db.run(sql`CREATE INDEX \`_courses_v_version_version_source_path_idx\` ON \`_courses_v\` (\`version_source_path\`);`)
  await db.run(sql`CREATE INDEX \`_courses_v_version_version_slug_idx\` ON \`_courses_v\` (\`version_slug\`);`)
  await db.run(sql`CREATE INDEX \`_courses_v_version_version_updated_at_idx\` ON \`_courses_v\` (\`version_updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_courses_v_version_version_created_at_idx\` ON \`_courses_v\` (\`version_created_at\`);`)
  await db.run(sql`CREATE INDEX \`_courses_v_version_version__status_idx\` ON \`_courses_v\` (\`version__status\`);`)
  await db.run(sql`CREATE INDEX \`_courses_v_created_at_idx\` ON \`_courses_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`_courses_v_updated_at_idx\` ON \`_courses_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_courses_v_latest_idx\` ON \`_courses_v\` (\`latest\`);`)
  await db.run(sql`CREATE TABLE \`course_lessons\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text,
  	\`summary\` text,
  	\`content\` text,
  	\`featured_image_src\` text,
  	\`featured_image_alt\` text,
  	\`source_path\` text,
  	\`lesson_id\` text,
  	\`slug\` text,
  	\`authored_at\` text,
  	\`revised_at\` text,
  	\`extra_frontmatter\` text,
  	\`body\` text,
  	\`content_migration\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`_status\` text DEFAULT 'draft'
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`course_lessons_source_path_idx\` ON \`course_lessons\` (\`source_path\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`course_lessons_slug_idx\` ON \`course_lessons\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`course_lessons_updated_at_idx\` ON \`course_lessons\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`course_lessons_created_at_idx\` ON \`course_lessons\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`course_lessons__status_idx\` ON \`course_lessons\` (\`_status\`);`)
  await db.run(sql`CREATE TABLE \`_course_lessons_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`parent_id\` integer,
  	\`version_title\` text,
  	\`version_summary\` text,
  	\`version_content\` text,
  	\`version_featured_image_src\` text,
  	\`version_featured_image_alt\` text,
  	\`version_source_path\` text,
  	\`version_lesson_id\` text,
  	\`version_slug\` text,
  	\`version_authored_at\` text,
  	\`version_revised_at\` text,
  	\`version_extra_frontmatter\` text,
  	\`version_body\` text,
  	\`version_content_migration\` text,
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`version__status\` text DEFAULT 'draft',
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`latest\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`course_lessons\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`_course_lessons_v_parent_idx\` ON \`_course_lessons_v\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_course_lessons_v_version_version_source_path_idx\` ON \`_course_lessons_v\` (\`version_source_path\`);`)
  await db.run(sql`CREATE INDEX \`_course_lessons_v_version_version_slug_idx\` ON \`_course_lessons_v\` (\`version_slug\`);`)
  await db.run(sql`CREATE INDEX \`_course_lessons_v_version_version_updated_at_idx\` ON \`_course_lessons_v\` (\`version_updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_course_lessons_v_version_version_created_at_idx\` ON \`_course_lessons_v\` (\`version_created_at\`);`)
  await db.run(sql`CREATE INDEX \`_course_lessons_v_version_version__status_idx\` ON \`_course_lessons_v\` (\`version__status\`);`)
  await db.run(sql`CREATE INDEX \`_course_lessons_v_created_at_idx\` ON \`_course_lessons_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`_course_lessons_v_updated_at_idx\` ON \`_course_lessons_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_course_lessons_v_latest_idx\` ON \`_course_lessons_v\` (\`latest\`);`)
  await db.run(sql`CREATE TABLE \`quizzes_questions_answers\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`text\` text,
  	\`correct\` integer DEFAULT false,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`quizzes_questions\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`quizzes_questions_answers_order_idx\` ON \`quizzes_questions_answers\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`quizzes_questions_answers_parent_id_idx\` ON \`quizzes_questions_answers\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`quizzes_questions\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`question\` text,
  	\`explanation\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`quizzes\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`quizzes_questions_order_idx\` ON \`quizzes_questions\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`quizzes_questions_parent_id_idx\` ON \`quizzes_questions\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`quizzes\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text,
  	\`source_path\` text,
  	\`quiz_id\` text,
  	\`slug\` text,
  	\`authored_at\` text,
  	\`revised_at\` text,
  	\`extra_frontmatter\` text,
  	\`body\` text,
  	\`content_migration\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`_status\` text DEFAULT 'draft'
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`quizzes_source_path_idx\` ON \`quizzes\` (\`source_path\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`quizzes_slug_idx\` ON \`quizzes\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`quizzes_updated_at_idx\` ON \`quizzes\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`quizzes_created_at_idx\` ON \`quizzes\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`quizzes__status_idx\` ON \`quizzes\` (\`_status\`);`)
  await db.run(sql`CREATE TABLE \`_quizzes_v_version_questions_answers\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`text\` text,
  	\`correct\` integer DEFAULT false,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_quizzes_v_version_questions\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_quizzes_v_version_questions_answers_order_idx\` ON \`_quizzes_v_version_questions_answers\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_quizzes_v_version_questions_answers_parent_id_idx\` ON \`_quizzes_v_version_questions_answers\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_quizzes_v_version_questions\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`question\` text,
  	\`explanation\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_quizzes_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_quizzes_v_version_questions_order_idx\` ON \`_quizzes_v_version_questions\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_quizzes_v_version_questions_parent_id_idx\` ON \`_quizzes_v_version_questions\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_quizzes_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`parent_id\` integer,
  	\`version_title\` text,
  	\`version_source_path\` text,
  	\`version_quiz_id\` text,
  	\`version_slug\` text,
  	\`version_authored_at\` text,
  	\`version_revised_at\` text,
  	\`version_extra_frontmatter\` text,
  	\`version_body\` text,
  	\`version_content_migration\` text,
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`version__status\` text DEFAULT 'draft',
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`latest\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`quizzes\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`_quizzes_v_parent_idx\` ON \`_quizzes_v\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_quizzes_v_version_version_source_path_idx\` ON \`_quizzes_v\` (\`version_source_path\`);`)
  await db.run(sql`CREATE INDEX \`_quizzes_v_version_version_slug_idx\` ON \`_quizzes_v\` (\`version_slug\`);`)
  await db.run(sql`CREATE INDEX \`_quizzes_v_version_version_updated_at_idx\` ON \`_quizzes_v\` (\`version_updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_quizzes_v_version_version_created_at_idx\` ON \`_quizzes_v\` (\`version_created_at\`);`)
  await db.run(sql`CREATE INDEX \`_quizzes_v_version_version__status_idx\` ON \`_quizzes_v\` (\`version__status\`);`)
  await db.run(sql`CREATE INDEX \`_quizzes_v_created_at_idx\` ON \`_quizzes_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`_quizzes_v_updated_at_idx\` ON \`_quizzes_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_quizzes_v_latest_idx\` ON \`_quizzes_v\` (\`latest\`);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`courses_id\` integer REFERENCES courses(id);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`course_lessons_id\` integer REFERENCES course_lessons(id);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`quizzes_id\` integer REFERENCES quizzes(id);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_courses_id_idx\` ON \`payload_locked_documents_rels\` (\`courses_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_course_lessons_id_idx\` ON \`payload_locked_documents_rels\` (\`course_lessons_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_quizzes_id_idx\` ON \`payload_locked_documents_rels\` (\`quizzes_id\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`courses_lessons\`;`)
  await db.run(sql`DROP TABLE \`courses\`;`)
  await db.run(sql`DROP TABLE \`_courses_v_version_lessons\`;`)
  await db.run(sql`DROP TABLE \`_courses_v\`;`)
  await db.run(sql`DROP TABLE \`course_lessons\`;`)
  await db.run(sql`DROP TABLE \`_course_lessons_v\`;`)
  await db.run(sql`DROP TABLE \`quizzes_questions_answers\`;`)
  await db.run(sql`DROP TABLE \`quizzes_questions\`;`)
  await db.run(sql`DROP TABLE \`quizzes\`;`)
  await db.run(sql`DROP TABLE \`_quizzes_v_version_questions_answers\`;`)
  await db.run(sql`DROP TABLE \`_quizzes_v_version_questions\`;`)
  await db.run(sql`DROP TABLE \`_quizzes_v\`;`)
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_payload_locked_documents_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`users_id\` integer,
  	\`media_id\` integer,
  	\`topics_id\` integer,
  	\`categories_id\` integer,
  	\`tags_id\` integer,
  	\`glossary_id\` integer,
  	\`wiki_id\` integer,
  	\`projects_id\` integer,
  	\`project_updates_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_locked_documents\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`topics_id\`) REFERENCES \`topics\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`categories_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`tags_id\`) REFERENCES \`tags\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`glossary_id\`) REFERENCES \`glossary\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`wiki_id\`) REFERENCES \`wiki\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`projects_id\`) REFERENCES \`projects\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`project_updates_id\`) REFERENCES \`project_updates\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_payload_locked_documents_rels\`("id", "order", "parent_id", "path", "users_id", "media_id", "topics_id", "categories_id", "tags_id", "glossary_id", "wiki_id", "projects_id", "project_updates_id") SELECT "id", "order", "parent_id", "path", "users_id", "media_id", "topics_id", "categories_id", "tags_id", "glossary_id", "wiki_id", "projects_id", "project_updates_id" FROM \`payload_locked_documents_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents_rels\`;`)
  await db.run(sql`ALTER TABLE \`__new_payload_locked_documents_rels\` RENAME TO \`payload_locked_documents_rels\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_order_idx\` ON \`payload_locked_documents_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_parent_idx\` ON \`payload_locked_documents_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_path_idx\` ON \`payload_locked_documents_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_users_id_idx\` ON \`payload_locked_documents_rels\` (\`users_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_media_id_idx\` ON \`payload_locked_documents_rels\` (\`media_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_topics_id_idx\` ON \`payload_locked_documents_rels\` (\`topics_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_categories_id_idx\` ON \`payload_locked_documents_rels\` (\`categories_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_tags_id_idx\` ON \`payload_locked_documents_rels\` (\`tags_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_glossary_id_idx\` ON \`payload_locked_documents_rels\` (\`glossary_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_wiki_id_idx\` ON \`payload_locked_documents_rels\` (\`wiki_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_projects_id_idx\` ON \`payload_locked_documents_rels\` (\`projects_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_project_updates_id_idx\` ON \`payload_locked_documents_rels\` (\`project_updates_id\`);`)
}
