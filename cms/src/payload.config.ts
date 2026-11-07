import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { contentCollections, Media, Users } from './collections'
import { learningCollections } from './courses'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const secret = process.env.PAYLOAD_SECRET
if (!secret || secret.length < 32) throw new Error('PAYLOAD_SECRET must be a stable secret of at least 32 characters.')
const dataDir = path.resolve(process.env.CMS_DATA_DIR || './data')
mkdirSync(path.join(dataDir, 'media'), { recursive: true })
const serverURL = process.env.CMS_PUBLIC_URL || 'http://localhost:3000'

export default buildConfig({
  serverURL,
  secret,
  admin: { timezones: { defaultTimezone: 'Europe/London' }, user: 'users', importMap: { baseDir: dirname }, meta: { titleSuffix: ' | Mockachino CMS' } },
  collections: [Users, Media, ...contentCollections, ...learningCollections],
  // The dedicated NAS worker runs queued jobs; web processes never start a cron runner.
  jobs: { deleteJobOnComplete: false, access: { run: ({ req }) => Boolean(req.user), queue: ({ req }) => Boolean(req.user), cancel: ({ req }) => Boolean(req.user) } },
  cors: [serverURL],
  csrf: [serverURL],
  db: sqliteAdapter({
    client: { url: process.env.DATABASE_URL || `file:${path.join(dataDir, 'payload.db')}` },
    migrationDir: path.join(dirname, 'migrations'),
    push: process.env.NODE_ENV === 'development',
    transactionOptions: { behavior: 'deferred' },
    wal: true,
    busyTimeout: 5000,
  }),
  sharp,
  typescript: { outputFile: path.join(dirname, 'payload-types.ts') },
  graphQL: { disable: true },
  onInit: async (payload) => {
    const email = process.env.CMS_ADMIN_EMAIL
    const password = process.env.CMS_ADMIN_PASSWORD
    const { totalDocs } = await payload.count({ collection: 'users', overrideAccess: true })
    if (totalDocs === 0 && email && password) {
      if (password.length < 16) throw new Error('CMS_ADMIN_PASSWORD must be at least 16 characters.')
      await payload.create({ collection: 'users', overrideAccess: true, data: {email, password} })
      payload.logger.info('Created initial CMS administrator from environment.')
    }
  },
})
