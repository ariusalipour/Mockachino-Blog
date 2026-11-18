import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`project_policies\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`source_path\` text,
  	\`project\` text,
  	\`type\` text,
  	\`title\` text,
  	\`effective_at\` text,
  	\`revised_at\` text,
  	\`content\` text,
  	\`body\` text,
  	\`content_migration\` text,
  	\`extra_frontmatter\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`_status\` text DEFAULT 'draft'
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`project_policies_source_path_idx\` ON \`project_policies\` (\`source_path\`);`)
  await db.run(sql`CREATE INDEX \`project_policies_project_idx\` ON \`project_policies\` (\`project\`);`)
  await db.run(sql`CREATE INDEX \`project_policies_updated_at_idx\` ON \`project_policies\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`project_policies_created_at_idx\` ON \`project_policies\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`project_policies__status_idx\` ON \`project_policies\` (\`_status\`);`)
  await db.run(sql`CREATE TABLE \`_project_policies_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`parent_id\` integer,
  	\`version_source_path\` text,
  	\`version_project\` text,
  	\`version_type\` text,
  	\`version_title\` text,
  	\`version_effective_at\` text,
  	\`version_revised_at\` text,
  	\`version_content\` text,
  	\`version_body\` text,
  	\`version_content_migration\` text,
  	\`version_extra_frontmatter\` text,
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`version__status\` text DEFAULT 'draft',
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`latest\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`project_policies\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`_project_policies_v_parent_idx\` ON \`_project_policies_v\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_project_policies_v_version_version_source_path_idx\` ON \`_project_policies_v\` (\`version_source_path\`);`)
  await db.run(sql`CREATE INDEX \`_project_policies_v_version_version_project_idx\` ON \`_project_policies_v\` (\`version_project\`);`)
  await db.run(sql`CREATE INDEX \`_project_policies_v_version_version_updated_at_idx\` ON \`_project_policies_v\` (\`version_updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_project_policies_v_version_version_created_at_idx\` ON \`_project_policies_v\` (\`version_created_at\`);`)
  await db.run(sql`CREATE INDEX \`_project_policies_v_version_version__status_idx\` ON \`_project_policies_v\` (\`version__status\`);`)
  await db.run(sql`CREATE INDEX \`_project_policies_v_created_at_idx\` ON \`_project_policies_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`_project_policies_v_updated_at_idx\` ON \`_project_policies_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_project_policies_v_latest_idx\` ON \`_project_policies_v\` (\`latest\`);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`project_policies_id\` integer REFERENCES project_policies(id);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_project_policies_id_idx\` ON \`payload_locked_documents_rels\` (\`project_policies_id\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`project_policies\`;`)
  await db.run(sql`DROP TABLE \`_project_policies_v\`;`)
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
  	\`courses_id\` integer,
  	\`course_lessons_id\` integer,
  	\`quizzes_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_locked_documents\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`topics_id\`) REFERENCES \`topics\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`categories_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`tags_id\`) REFERENCES \`tags\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`glossary_id\`) REFERENCES \`glossary\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`wiki_id\`) REFERENCES \`wiki\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`projects_id\`) REFERENCES \`projects\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`project_updates_id\`) REFERENCES \`project_updates\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`courses_id\`) REFERENCES \`courses\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`course_lessons_id\`) REFERENCES \`course_lessons\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`quizzes_id\`) REFERENCES \`quizzes\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_payload_locked_documents_rels\`("id", "order", "parent_id", "path", "users_id", "media_id", "topics_id", "categories_id", "tags_id", "glossary_id", "wiki_id", "projects_id", "project_updates_id", "courses_id", "course_lessons_id", "quizzes_id") SELECT "id", "order", "parent_id", "path", "users_id", "media_id", "topics_id", "categories_id", "tags_id", "glossary_id", "wiki_id", "projects_id", "project_updates_id", "courses_id", "course_lessons_id", "quizzes_id" FROM \`payload_locked_documents_rels\`;`)
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
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_courses_id_idx\` ON \`payload_locked_documents_rels\` (\`courses_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_course_lessons_id_idx\` ON \`payload_locked_documents_rels\` (\`course_lessons_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_quizzes_id_idx\` ON \`payload_locked_documents_rels\` (\`quizzes_id\`);`)
}
