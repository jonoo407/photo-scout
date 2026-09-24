import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { HOOK_SECRET_HEADER } from '../../src/push/hook-secret'

/* The Worker refuses a DB webhook unless it carries HOOK_SECRET_HEADER, and
   only the migration makes the triggers send it. If the two disagree on the
   header name, or a trigger is left out, that hook's push/email goes dark with
   no error anywhere a person would look. */

const root = resolve(__dirname, '../..')
const migration = readFileSync(resolve(root, 'supabase/migrations/20260924000000_webhook_shared_secret.sql'), 'utf8')
const schema = readFileSync(resolve(root, 'supabase/schema.sql'), 'utf8')

describe('webhook shared-secret migration', () => {
  it('sends the exact header the Worker checks, from the existing hook secret', () => {
    expect(migration).toContain(`'${HOOK_SECRET_HEADER}'`)
    expect(migration).toContain("key = 'worker_hook_secret'")
  })

  it('patches all three webhook triggers', () => {
    for (const fn of ['notify_shortlist_response', 'feedback_notify', 'photo_report_notify']) {
      expect(migration).toContain(`'${fn}'`)
    }
  })

  it('keeps the header helper off the API', () => {
    expect(migration).toMatch(/revoke all on function internal\.worker_hook_headers\(\) from public;/)
    expect(migration).toMatch(/revoke all on function internal\.worker_hook_headers\(\) from anon, authenticated;/)
  })

  it('leaves no trigger in schema.sql posting without the secret', () => {
    expect(schema).not.toContain(`headers := '{"Content-Type": "application/json"}'::jsonb`)
  })
})
