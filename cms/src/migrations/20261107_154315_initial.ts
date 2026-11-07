import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`users_sessions\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`created_at\` text,
  	\`expires_at\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`users_sessions_order_idx\` ON \`users_sessions\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`users_sessions_parent_id_idx\` ON \`users_sessions\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`users\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`email\` text NOT NULL,
  	\`reset_password_token\` text,
  	\`reset_password_expiration\` text,
  	\`salt\` text,
  	\`hash\` text,
  	\`reset_password_requested_at\` text,
  	\`login_attempts\` numeric DEFAULT 0,
  	\`lock_until\` text
  );
  `)
  await db.run(sql`CREATE INDEX \`users_updated_at_idx\` ON \`users\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`users_created_at_idx\` ON \`users\` (\`created_at\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`users_email_idx\` ON \`users\` (\`email\`);`)
  await db.run(sql`CREATE TABLE \`media\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`alt\` text,
  	\`source_path\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`url\` text,
  	\`thumbnail_u_r_l\` text,
  	\`filename\` text,
  	\`mime_type\` text,
  	\`filesize\` numeric,
  	\`width\` numeric,
  	\`height\` numeric,
  	\`focal_x\` numeric,
  	\`focal_y\` numeric
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`media_source_path_idx\` ON \`media\` (\`source_path\`);`)
  await db.run(sql`CREATE INDEX \`media_updated_at_idx\` ON \`media\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`media_created_at_idx\` ON \`media\` (\`created_at\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`media_filename_idx\` ON \`media\` (\`filename\`);`)
  await db.run(sql`CREATE TABLE \`topics\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`source_path\` text,
  	\`name\` text,
  	\`short_name\` text,
  	\`strapline\` text,
  	\`accent\` text,
  	\`icon\` text,
  	\`home_stats_reviews\` numeric,
  	\`home_stats_articles\` numeric,
  	\`home_stats_guides\` numeric,
  	\`body\` text,
  	\`extra_frontmatter\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`_status\` text DEFAULT 'draft'
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`topics_source_path_idx\` ON \`topics\` (\`source_path\`);`)
  await db.run(sql`CREATE INDEX \`topics_updated_at_idx\` ON \`topics\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`topics_created_at_idx\` ON \`topics\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`topics__status_idx\` ON \`topics\` (\`_status\`);`)
  await db.run(sql`CREATE TABLE \`_topics_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`parent_id\` integer,
  	\`version_source_path\` text,
  	\`version_name\` text,
  	\`version_short_name\` text,
  	\`version_strapline\` text,
  	\`version_accent\` text,
  	\`version_icon\` text,
  	\`version_home_stats_reviews\` numeric,
  	\`version_home_stats_articles\` numeric,
  	\`version_home_stats_guides\` numeric,
  	\`version_body\` text,
  	\`version_extra_frontmatter\` text,
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`version__status\` text DEFAULT 'draft',
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`latest\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`topics\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`_topics_v_parent_idx\` ON \`_topics_v\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_topics_v_version_version_source_path_idx\` ON \`_topics_v\` (\`version_source_path\`);`)
  await db.run(sql`CREATE INDEX \`_topics_v_version_version_updated_at_idx\` ON \`_topics_v\` (\`version_updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_topics_v_version_version_created_at_idx\` ON \`_topics_v\` (\`version_created_at\`);`)
  await db.run(sql`CREATE INDEX \`_topics_v_version_version__status_idx\` ON \`_topics_v\` (\`version__status\`);`)
  await db.run(sql`CREATE INDEX \`_topics_v_created_at_idx\` ON \`_topics_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`_topics_v_updated_at_idx\` ON \`_topics_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_topics_v_latest_idx\` ON \`_topics_v\` (\`latest\`);`)
  await db.run(sql`CREATE TABLE \`categories\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`source_path\` text,
  	\`topic\` text,
  	\`name\` text,
  	\`description\` text,
  	\`body\` text,
  	\`extra_frontmatter\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`_status\` text DEFAULT 'draft'
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`categories_source_path_idx\` ON \`categories\` (\`source_path\`);`)
  await db.run(sql`CREATE INDEX \`categories_updated_at_idx\` ON \`categories\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`categories_created_at_idx\` ON \`categories\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`categories__status_idx\` ON \`categories\` (\`_status\`);`)
  await db.run(sql`CREATE TABLE \`_categories_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`parent_id\` integer,
  	\`version_source_path\` text,
  	\`version_topic\` text,
  	\`version_name\` text,
  	\`version_description\` text,
  	\`version_body\` text,
  	\`version_extra_frontmatter\` text,
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`version__status\` text DEFAULT 'draft',
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`latest\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`_categories_v_parent_idx\` ON \`_categories_v\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_categories_v_version_version_source_path_idx\` ON \`_categories_v\` (\`version_source_path\`);`)
  await db.run(sql`CREATE INDEX \`_categories_v_version_version_updated_at_idx\` ON \`_categories_v\` (\`version_updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_categories_v_version_version_created_at_idx\` ON \`_categories_v\` (\`version_created_at\`);`)
  await db.run(sql`CREATE INDEX \`_categories_v_version_version__status_idx\` ON \`_categories_v\` (\`version__status\`);`)
  await db.run(sql`CREATE INDEX \`_categories_v_created_at_idx\` ON \`_categories_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`_categories_v_updated_at_idx\` ON \`_categories_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_categories_v_latest_idx\` ON \`_categories_v\` (\`latest\`);`)
  await db.run(sql`CREATE TABLE \`tags\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`source_path\` text,
  	\`label\` text,
  	\`body\` text,
  	\`extra_frontmatter\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`_status\` text DEFAULT 'draft'
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`tags_source_path_idx\` ON \`tags\` (\`source_path\`);`)
  await db.run(sql`CREATE INDEX \`tags_updated_at_idx\` ON \`tags\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`tags_created_at_idx\` ON \`tags\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`tags__status_idx\` ON \`tags\` (\`_status\`);`)
  await db.run(sql`CREATE TABLE \`_tags_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`parent_id\` integer,
  	\`version_source_path\` text,
  	\`version_label\` text,
  	\`version_body\` text,
  	\`version_extra_frontmatter\` text,
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`version__status\` text DEFAULT 'draft',
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`latest\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`tags\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`_tags_v_parent_idx\` ON \`_tags_v\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_tags_v_version_version_source_path_idx\` ON \`_tags_v\` (\`version_source_path\`);`)
  await db.run(sql`CREATE INDEX \`_tags_v_version_version_updated_at_idx\` ON \`_tags_v\` (\`version_updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_tags_v_version_version_created_at_idx\` ON \`_tags_v\` (\`version_created_at\`);`)
  await db.run(sql`CREATE INDEX \`_tags_v_version_version__status_idx\` ON \`_tags_v\` (\`version__status\`);`)
  await db.run(sql`CREATE INDEX \`_tags_v_created_at_idx\` ON \`_tags_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`_tags_v_updated_at_idx\` ON \`_tags_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_tags_v_latest_idx\` ON \`_tags_v\` (\`latest\`);`)
  await db.run(sql`CREATE TABLE \`glossary\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`source_path\` text,
  	\`term\` text,
  	\`definition\` text,
  	\`body\` text,
  	\`extra_frontmatter\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`_status\` text DEFAULT 'draft'
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`glossary_source_path_idx\` ON \`glossary\` (\`source_path\`);`)
  await db.run(sql`CREATE INDEX \`glossary_updated_at_idx\` ON \`glossary\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`glossary_created_at_idx\` ON \`glossary\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`glossary__status_idx\` ON \`glossary\` (\`_status\`);`)
  await db.run(sql`CREATE TABLE \`_glossary_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`parent_id\` integer,
  	\`version_source_path\` text,
  	\`version_term\` text,
  	\`version_definition\` text,
  	\`version_body\` text,
  	\`version_extra_frontmatter\` text,
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`version__status\` text DEFAULT 'draft',
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`latest\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`glossary\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`_glossary_v_parent_idx\` ON \`_glossary_v\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_glossary_v_version_version_source_path_idx\` ON \`_glossary_v\` (\`version_source_path\`);`)
  await db.run(sql`CREATE INDEX \`_glossary_v_version_version_updated_at_idx\` ON \`_glossary_v\` (\`version_updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_glossary_v_version_version_created_at_idx\` ON \`_glossary_v\` (\`version_created_at\`);`)
  await db.run(sql`CREATE INDEX \`_glossary_v_version_version__status_idx\` ON \`_glossary_v\` (\`version__status\`);`)
  await db.run(sql`CREATE INDEX \`_glossary_v_created_at_idx\` ON \`_glossary_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`_glossary_v_updated_at_idx\` ON \`_glossary_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_glossary_v_latest_idx\` ON \`_glossary_v\` (\`latest\`);`)
  await db.run(sql`CREATE TABLE \`wiki\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`source_path\` text,
  	\`article_id\` text,
  	\`slug\` text,
  	\`title\` text,
  	\`summary\` text,
  	\`kind\` text,
  	\`topic\` text,
  	\`category\` text,
  	\`authored_at\` text,
  	\`revised_at\` text,
  	\`tags\` text DEFAULT '[]',
  	\`featured_image_src\` text,
  	\`featured_image_alt\` text,
  	\`body\` text,
  	\`extra_frontmatter\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`_status\` text DEFAULT 'draft'
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`wiki_source_path_idx\` ON \`wiki\` (\`source_path\`);`)
  await db.run(sql`CREATE INDEX \`wiki_updated_at_idx\` ON \`wiki\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`wiki_created_at_idx\` ON \`wiki\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`wiki__status_idx\` ON \`wiki\` (\`_status\`);`)
  await db.run(sql`CREATE TABLE \`_wiki_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`parent_id\` integer,
  	\`version_source_path\` text,
  	\`version_article_id\` text,
  	\`version_slug\` text,
  	\`version_title\` text,
  	\`version_summary\` text,
  	\`version_kind\` text,
  	\`version_topic\` text,
  	\`version_category\` text,
  	\`version_authored_at\` text,
  	\`version_revised_at\` text,
  	\`version_tags\` text DEFAULT '[]',
  	\`version_featured_image_src\` text,
  	\`version_featured_image_alt\` text,
  	\`version_body\` text,
  	\`version_extra_frontmatter\` text,
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`version__status\` text DEFAULT 'draft',
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`latest\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`wiki\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`_wiki_v_parent_idx\` ON \`_wiki_v\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_wiki_v_version_version_source_path_idx\` ON \`_wiki_v\` (\`version_source_path\`);`)
  await db.run(sql`CREATE INDEX \`_wiki_v_version_version_updated_at_idx\` ON \`_wiki_v\` (\`version_updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_wiki_v_version_version_created_at_idx\` ON \`_wiki_v\` (\`version_created_at\`);`)
  await db.run(sql`CREATE INDEX \`_wiki_v_version_version__status_idx\` ON \`_wiki_v\` (\`version__status\`);`)
  await db.run(sql`CREATE INDEX \`_wiki_v_created_at_idx\` ON \`_wiki_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`_wiki_v_updated_at_idx\` ON \`_wiki_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_wiki_v_latest_idx\` ON \`_wiki_v\` (\`latest\`);`)
  await db.run(sql`CREATE TABLE \`projects\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`source_path\` text,
  	\`name\` text,
  	\`summary\` text,
  	\`status\` text,
  	\`revised_at\` text,
  	\`repository\` text,
  	\`live_url\` text,
  	\`tags\` text DEFAULT '[]',
  	\`body\` text,
  	\`extra_frontmatter\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`_status\` text DEFAULT 'draft'
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`projects_source_path_idx\` ON \`projects\` (\`source_path\`);`)
  await db.run(sql`CREATE INDEX \`projects_updated_at_idx\` ON \`projects\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`projects_created_at_idx\` ON \`projects\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`projects__status_idx\` ON \`projects\` (\`_status\`);`)
  await db.run(sql`CREATE TABLE \`_projects_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`parent_id\` integer,
  	\`version_source_path\` text,
  	\`version_name\` text,
  	\`version_summary\` text,
  	\`version_status\` text,
  	\`version_revised_at\` text,
  	\`version_repository\` text,
  	\`version_live_url\` text,
  	\`version_tags\` text DEFAULT '[]',
  	\`version_body\` text,
  	\`version_extra_frontmatter\` text,
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`version__status\` text DEFAULT 'draft',
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`latest\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`projects\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`_projects_v_parent_idx\` ON \`_projects_v\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_projects_v_version_version_source_path_idx\` ON \`_projects_v\` (\`version_source_path\`);`)
  await db.run(sql`CREATE INDEX \`_projects_v_version_version_updated_at_idx\` ON \`_projects_v\` (\`version_updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_projects_v_version_version_created_at_idx\` ON \`_projects_v\` (\`version_created_at\`);`)
  await db.run(sql`CREATE INDEX \`_projects_v_version_version__status_idx\` ON \`_projects_v\` (\`version__status\`);`)
  await db.run(sql`CREATE INDEX \`_projects_v_created_at_idx\` ON \`_projects_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`_projects_v_updated_at_idx\` ON \`_projects_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_projects_v_latest_idx\` ON \`_projects_v\` (\`latest\`);`)
  await db.run(sql`CREATE TABLE \`project_updates\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`source_path\` text,
  	\`project\` text,
  	\`slug\` text,
  	\`title\` text,
  	\`summary\` text,
  	\`authored_at\` text,
  	\`revised_at\` text,
  	\`tags\` text DEFAULT '[]',
  	\`body\` text,
  	\`extra_frontmatter\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`_status\` text DEFAULT 'draft'
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`project_updates_source_path_idx\` ON \`project_updates\` (\`source_path\`);`)
  await db.run(sql`CREATE INDEX \`project_updates_updated_at_idx\` ON \`project_updates\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`project_updates_created_at_idx\` ON \`project_updates\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`project_updates__status_idx\` ON \`project_updates\` (\`_status\`);`)
  await db.run(sql`CREATE TABLE \`_project_updates_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`parent_id\` integer,
  	\`version_source_path\` text,
  	\`version_project\` text,
  	\`version_slug\` text,
  	\`version_title\` text,
  	\`version_summary\` text,
  	\`version_authored_at\` text,
  	\`version_revised_at\` text,
  	\`version_tags\` text DEFAULT '[]',
  	\`version_body\` text,
  	\`version_extra_frontmatter\` text,
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`version__status\` text DEFAULT 'draft',
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`latest\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`project_updates\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`_project_updates_v_parent_idx\` ON \`_project_updates_v\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_project_updates_v_version_version_source_path_idx\` ON \`_project_updates_v\` (\`version_source_path\`);`)
  await db.run(sql`CREATE INDEX \`_project_updates_v_version_version_updated_at_idx\` ON \`_project_updates_v\` (\`version_updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_project_updates_v_version_version_created_at_idx\` ON \`_project_updates_v\` (\`version_created_at\`);`)
  await db.run(sql`CREATE INDEX \`_project_updates_v_version_version__status_idx\` ON \`_project_updates_v\` (\`version__status\`);`)
  await db.run(sql`CREATE INDEX \`_project_updates_v_created_at_idx\` ON \`_project_updates_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`_project_updates_v_updated_at_idx\` ON \`_project_updates_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_project_updates_v_latest_idx\` ON \`_project_updates_v\` (\`latest\`);`)
  await db.run(sql`CREATE TABLE \`payload_kv\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`key\` text NOT NULL,
  	\`data\` text NOT NULL
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`payload_kv_key_idx\` ON \`payload_kv\` (\`key\`);`)
  await db.run(sql`CREATE TABLE \`payload_locked_documents\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`global_slug\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_global_slug_idx\` ON \`payload_locked_documents\` (\`global_slug\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_updated_at_idx\` ON \`payload_locked_documents\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_created_at_idx\` ON \`payload_locked_documents\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`payload_locked_documents_rels\` (
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
  await db.run(sql`CREATE TABLE \`payload_preferences\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`key\` text,
  	\`value\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_preferences_key_idx\` ON \`payload_preferences\` (\`key\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_updated_at_idx\` ON \`payload_preferences\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_created_at_idx\` ON \`payload_preferences\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`payload_preferences_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`users_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_preferences\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_preferences_rels_order_idx\` ON \`payload_preferences_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_rels_parent_idx\` ON \`payload_preferences_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_rels_path_idx\` ON \`payload_preferences_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_rels_users_id_idx\` ON \`payload_preferences_rels\` (\`users_id\`);`)
  await db.run(sql`CREATE TABLE \`payload_migrations\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text,
  	\`batch\` numeric,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_migrations_updated_at_idx\` ON \`payload_migrations\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`payload_migrations_created_at_idx\` ON \`payload_migrations\` (\`created_at\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`users_sessions\`;`)
  await db.run(sql`DROP TABLE \`users\`;`)
  await db.run(sql`DROP TABLE \`media\`;`)
  await db.run(sql`DROP TABLE \`topics\`;`)
  await db.run(sql`DROP TABLE \`_topics_v\`;`)
  await db.run(sql`DROP TABLE \`categories\`;`)
  await db.run(sql`DROP TABLE \`_categories_v\`;`)
  await db.run(sql`DROP TABLE \`tags\`;`)
  await db.run(sql`DROP TABLE \`_tags_v\`;`)
  await db.run(sql`DROP TABLE \`glossary\`;`)
  await db.run(sql`DROP TABLE \`_glossary_v\`;`)
  await db.run(sql`DROP TABLE \`wiki\`;`)
  await db.run(sql`DROP TABLE \`_wiki_v\`;`)
  await db.run(sql`DROP TABLE \`projects\`;`)
  await db.run(sql`DROP TABLE \`_projects_v\`;`)
  await db.run(sql`DROP TABLE \`project_updates\`;`)
  await db.run(sql`DROP TABLE \`_project_updates_v\`;`)
  await db.run(sql`DROP TABLE \`payload_kv\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_preferences\`;`)
  await db.run(sql`DROP TABLE \`payload_preferences_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_migrations\`;`)
}
