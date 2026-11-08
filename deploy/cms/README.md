# Mockachino CMS on the NAS

The existing Astro site stays static on Cloudflare Pages. Payload is a separate
Next.js application in `cms/`, with a persistent SQLite database and uploaded
files on the NAS. Publishing, unpublishing, or deleting content changes the
published snapshot. A NAS worker observes the committed snapshot and requests a
Cloudflare Pages build. Draft edits do not appear in the snapshot.

## Content ownership

After cutover, edit website content in Payload at
`https://cms.mockachino.app/admin`. Payload owns all seven content collections.
Keep `sourcePath` stable: it preserves the original collection filename. Article
slugs, original publication dates, formatting, and `/images/...` references are
preserved. Edit the Content field with Payload's Lexical visual editor: use the
toolbar for formatting, Upload for images from the media library, and the slash
menu for code blocks and video embeds. Imported images are linked to their media
records and keep their original alternative text. YouTube and Giphy embeds have
editable titles, URLs, and previews. Original images remain in the Astro
repository as well as the media library.

## Writing wiki posts

The wiki editor starts with Topic → Category → Tags. Categories are filtered by
the selected topic, and tags use the existing tag catalogue instead of a JSON
input. Add a shared tag with the inline New tag control, or manage tags and
categories in their corresponding collections. Publish categories before using
them in a published article.

For a new post, the CMS generates its article ID and content filename. The ID is
hidden from the editor and retained internally for content filenames, exports, and
legacy compatibility. The CMS also creates a title-based URL slug and initial
publication/update dates; the filename and URL remain stable when the title, topic,
or category changes. Existing IDs, filenames, URL slugs, and dates are preserved
when an article is opened or saved without content changes. Drafts can be saved
while the article is still in progress. Publication validates the selected
topic/category/tags together.

To backdate a wiki post, expand Publishing details and set Publication date to
the intended date, then publish the changes. Saving as a draft keeps that date
edit private until the draft is published. The website uses this date for the
article's publication date; its article ID, filename and URL remain stable.
Content updated date is still automatic. New posts receive a default publication
date if none is entered, and an omitted or cleared date keeps the existing value.
Backdating changes date metadata, while scheduled publishing controls when the
post becomes public. A scheduled publish includes the latest saved date edit.

The original Markdown is retained in a hidden, read-only `body` field as a
recovery copy. `content` is the editable rich text source. The published snapshot
serializes rich text into the site's Markdown pipeline so Astro retains heading
anchors, syntax highlighting, glossary tooltips, and existing styling. The
serializer rejects unsupported editor nodes instead of dropping them.

Do not run the former Notion-to-Markdown publishing job against this checkout.
Notion can still be used for planning; it is no longer this website's publishing
source. The checked-in Markdown is a fallback and initial migration snapshot;
production builds replace CMS-managed paths with published CMS content. Deleted
or unpublished CMS documents are removed from build output, including clean CI
checkouts. Unmanaged local files are protected from overwrite.

## First deployment

Use a current Node 22 release. From the repository root:

```sh
npm ci
npm run test:cms
npm run cms:bundle
cd cms
npm ci
npm run typecheck
npm test
npm run build
```

On the NAS, place this repository under
`/home/mockachino/apps/mockachino-blog`. Create `deploy/cms/.env` from the example
with a stable random `PAYLOAD_SECRET`, initial administrator email, and strong
password. Keep this file mode 600 and outside Git. The initial user is created
only when the user collection is empty. Public registration is disabled.

```sh
cd deploy/cms
docker compose build cms
docker compose up -d cms
# Import manifest + public assets must exist in the NAS checkout.
docker compose run --rm --no-deps -v "$(pwd)/../../work/cms-seed:/seed/manifest:ro" -v "$(pwd)/../../public:/seed/public:ro" cms npm exec -- tsx scripts/import.ts /seed/manifest/content.json /seed/public
```

For import, mount the generated manifest and public directory read-only into a
one-shot container using the same image, environment and database volume. The
importer checks all asset checksums before writes, skips existing entries, and
writes `/data/import-complete` only after every collection and media file is
imported. The public snapshot returns 503 before that marker exists. An interrupted
import can be resumed; rerunning it never overwrites later CMS edits.

## Cloudflare

Keep the existing remotely managed `nas-linux` tunnel and its other routes.
Add only `cms.mockachino.app` pointing to `http://127.0.0.1:3030`. The host service
runs cloudflared, so the origin port binds to loopback, with no router forwarding.
Payload protects editing and user endpoints with authentication; only published
content and public media are readable anonymously.

For the existing `mockachino-blog` Pages project:

- Keep production branch `main`, build command `npm run build`, output `dist`.
- Set production `CMS_URL=https://cms.mockachino.app`.
- Create a deploy hook for `main`. Store its secret URL only in the NAS `.env` as
  `CLOUDFLARE_PAGES_DEPLOY_HOOK`.
- After the CMS-aware frontend is deployed, start `publish-worker`. It waits for a stable
  published snapshot across two polls and requests a build. Only a matching
  `cms-revision.json` marker on the live website acknowledges success. Failed
  builds are retried after ten minutes, with pending state persisted on the NAS.

A configured CMS fetch failure fails the build and leaves the previous Pages
release live. Without `CMS_URL`, local development uses checked-in Markdown.
To use the live CMS locally, create a root `.env` with the same CMS_URL and
restart `npm run dev`. The dev launcher syncs published content before starting
Astro, then checks for changes every 15 seconds. Changed content is synced for
Astro's normal live reload; unchanged snapshots do not rewrite files. A later
CMS outage keeps the last synced content and retries. Without CMS_URL there is
no polling. You can also refresh manually with `npm run cms:sync`.

## Courses, lessons and quizzes

Courses have their own articles in Course Lessons, separate from the wiki. In
the Courses editor, choose the topic, category and tags, write the introduction,
then arrange lesson references in reading order. Each lesson can have an optional
quiz in that course, and the course can also have an optional final quiz. Reuse
the normal rich text editor for introductions and lesson bodies, including
images, code and supported video embeds. Technical IDs, filenames and stable
URLs are generated automatically.

Create and publish the lessons and any quizzes before publishing their parent
course. Quiz questions need at least two answers, exactly one correct answer,
and an explanation. Drafts can be saved while incomplete. Course publication
validates its references; if a referenced lesson or quiz is later unpublished,
the public export removes that lesson or quiz link rather than exposing a draft
or leaving a broken course link. New course content supports scheduling and
editable publication dates through the existing jobs worker.

The website lists courses at `/courses/`, each course at `/courses/<course>/`,
and its lessons at `/courses/<course>/<lesson>/`. Lesson pages follow the course's
reading order and offer previous/next navigation. Quizzes are browser-based
multiple-choice self-checks with scores, correct answers and explanations; there
are no learner accounts or saved attempts. Answer keys are public content in
the static website, so these quizzes are not secure assessments.

The CMS exports snapshot version 2 with `courses`, `course-lessons` and `quizzes`
alongside the original seven collections. The frontend accepts the previous
version 1 during rollout without changing its revision hash. Deploy that
compatible frontend first and verify `/courses/`, then migrate and deploy the
CMS and jobs worker. Do not downgrade to an older snapshot after new course
content has been synced: the sync guard protects against deleting it silently.
Back up and rehearse migrations against a database copy before the NAS upgrade.

## Scheduled publishing

Wiki posts support Payload's native scheduled publish and unpublish controls.
Save the draft, choose the scheduling action in the editor, select its date and
time, and confirm the schedule. The timezone defaults to Europe/London and can
be changed in that dialog. The job publishes the latest saved draft at execution
time, including edits saved after scheduling. Review the time shown in the dialog:
the saved job uses an absolute UTC instant, so daylight saving changes do not
move an already scheduled publication. Manage or cancel pending events from
the post's scheduling controls.

`jobs-worker` uses the same CMS image, secret, and local SQLite volume. One
worker checks the default queue every minute and processes up to 20 due jobs.
It starts after the CMS is healthy, so database migrations finish first, and
restarts automatically with Docker. No public job-run endpoint or additional
Cloudflare route is required. Keep exactly one jobs worker for this SQLite
deployment.

Publishing changes the public CMS snapshot. The separate `publish-worker`
requests the Astro/Cloudflare Pages rebuild; the post becomes visible on the
website when that deployment completes. This includes the normal queue polling
and build delay, so a scheduled time is the CMS publication time rather than an
exact website release time. Due jobs queued during a NAS outage run when the
worker returns.

Before deploying the scheduling schema, take a backup and rehearse its migration
on a restored database. Start or update the services together:

```sh
docker compose up -d --wait cms jobs-worker publish-worker
docker compose logs --tail 100 jobs-worker
```

Inspect failed jobs in Payload's jobs collection and the worker logs. Payload's
native schedule task does not automatically retry a failed task. After fixing
the cause, cancel/recreate that scheduled event. A hard worker interruption can
leave a claimed job marked as processing: stop the worker, back up the database,
and inspect the individual job before repairing or replacing it. Never reset
all processing jobs blindly. Roll back the app and database together if a
scheduling schema migration needs to be undone.

## Rich text migration

Take a database/media backup and retain the current image before upgrading.
Deploy the backwards-compatible Astro embed renderer first, then stop the publish
worker while the schema and content migration run. Migration reads the current
CMS database, including drafts; it never replaces it from the checked-in seed.
Run the migration on a restored backup first. For the NAS cutover, after the new
image is built and a fresh backup is saved:

```sh
cd deploy/cms
docker compose stop publish-worker cms
docker compose run --rm --no-deps cms npm run payload -- migrate
docker compose run --rm --no-deps cms npm run migrate:richtext -- --dry-run --report=/data/richtext-dry-run.json
# Verify the dry-run before/forcedAfter snapshots before applying any content change.
docker compose run --rm --no-deps cms npm run migrate:richtext -- --report=/data/richtext-migration.json
docker compose up -d --wait cms
# Verify the live published snapshot and the visual editor, then resume publishing.
docker compose up -d publish-worker
```

The migration is transactional and repeatable. It keeps existing rich text edits,
original Markdown, editorial dates, published state, and newer unpublished drafts.
Its restricted report contains the pre-migration and forced-conversion snapshots.
Compare the snapshots using:

```sh
npm run cms:verify-richtext -- before-published.json after-published.json
```

This checks rendered formatting, heading IDs, links, image URLs and alt text,
video URLs and titles, code, glossary behavior, and document metadata. The
`cms:verify` command uses the same semantic checks; pass `--exact` when checking
an original Markdown import. After deployment, verify CMS health, the editor,
public draft isolation, and the live site revision marker before resuming normal
editing. Keep the pre-migration backup for recovery.

## Operations and recovery

```sh
cd /home/mockachino/apps/mockachino-blog/deploy/cms
docker compose ps
docker compose logs --tail 100 cms jobs-worker publish-worker
./backup.sh
docker compose restart cms
```

`backup.sh` uses SQLite's online backup API, then copies media and the private
environment file into a dated, restricted NAS backup directory. Keep these
backups private. Before updates, take a backup and preserve the current image.
Restore a backup into a stopped service's database volume and restore matching
media/environment; never remove the named volumes to update the app.

Do not run `docker compose down -v`. Keep the stable Payload secret across
restarts. There is no SMTP provider configured initially: an existing admin can
manage accounts, and initial credentials are held in the restricted NAS `.env`.
Configure an email adapter before relying on email password reset.
