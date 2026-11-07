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
input. Manage new categories and tags in their corresponding collections and
publish them before assigning them to a published article.

For a new post, the CMS generates its article ID and content filename. It creates
a title-based URL slug and the initial publication/update dates; the URL and
identifiers then stay stable when the title, topic, or category changes. Technical
values are shown read-only in a collapsed section. Existing article IDs,
filenames, URL slugs, and dates are preserved when an article is simply opened or
saved without content changes. Drafts can be saved while the article is still
in progress. Publication validates the selected topic/category/tags together.

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
restart `npm run dev`; to refresh content in a running local session, run
`npm run cms:sync` (or restart the dev command).

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
docker compose logs --tail 100 cms publish-worker
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
