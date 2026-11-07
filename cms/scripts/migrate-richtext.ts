import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { getPayload } from 'payload'
import config from '../src/payload.config'
import { migrateRichText } from '../src/migrate-richtext'
const dryRun=process.argv.includes('--dry-run')
const reportArg=process.argv.find(arg=>arg.startsWith('--report='))?.slice('--report='.length)
const payload=await getPayload({config})
try {
  const result=await migrateRichText(payload,{dryRun})
  if(reportArg){const file=path.resolve(reportArg);await mkdir(path.dirname(file),{recursive:true});await writeFile(file,JSON.stringify(result,null,2),{mode:0o600})}
  console.log(JSON.stringify({version:1,dryRun,report:result.report},null,2))
} finally {await payload.destroy()}
