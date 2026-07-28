import { getSupabase } from '../auth/supabase'
import { APP_VERSION_LABEL } from '../app-version'

/* Tester feedback (TestFlight phase). Insert-only under RLS like
   `spot_suggestions`: the row is the durable record, and a DB trigger posts it
   to the Worker so it gets emailed rather than waiting on someone remembering
   to read a table.

   Build identity is captured automatically. "It looks the same to me" is
   unanswerable without knowing which build the tester was on, and asking them
   to type it is asking them to not bother. */

export type FeedbackKind = 'bug' | 'idea' | 'praise'

export interface FeedbackInput {
  message: string
  kind: FeedbackKind
  /** Optional — the only way to reply to a signed-out tester. */
  email?: string
}

const MAX_MESSAGE = 4000

export async function submitFeedback(input: FeedbackInput): Promise<void> {
  const message = input.message.trim()
  if (!message) throw new Error('Say something first — even one line helps.')

  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase.from('feedback').insert({
    message: message.slice(0, MAX_MESSAGE), // cap, don't reject: never lose a long report
    kind: input.kind,
    submitted_by: user?.id ?? null,
    contact_email: input.email?.trim().toLowerCase().slice(0, 200) || null,
    app_version: APP_VERSION_LABEL,
    platform: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 300) : 'unknown',
  })
  if (error) throw error
}
