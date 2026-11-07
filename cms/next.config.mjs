import { fileURLToPath } from 'node:url'
import { withPayload } from '@payloadcms/next/withPayload'

export default withPayload({
  outputFileTracingRoot: fileURLToPath(new URL('.', import.meta.url)),
  poweredByHeader: false,
})
