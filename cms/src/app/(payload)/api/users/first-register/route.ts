// Bootstrap happens via trusted local environment/CLI before exposing the CMS.
// Payload's default first-register endpoint bypasses collection create access.
export async function POST() {
  return Response.json({ error: 'Public registration is disabled.' }, { status: 403 })
}
