/* Community standards (V1, App Review guideline 1.2).

   Guideline 1.2 asks for four things from any app carrying user-generated
   content: a filter on what gets posted, a report mechanism with timely
   responses, a way to block abusive users, and published contact information.
   This module holds the words for the first and last of those; the machinery
   for the middle two is in photo-reports-api.ts and the report_photo RPC. */

/** Published contact address. ⚠️ Its MX row must resolve before submission —
    a published address that bounces is worse than none. */
export const SUPPORT_EMAIL = 'support@shootvantage.com'

/** Shown before a photographer's first upload, and on the guidelines screen.
    Short on purpose: a wall of legalese gets dismissed unread, and an unread
    rule filters nothing. */
export const POSTING_RULES: ReadonlyArray<string> = [
  'Post only photographs you took yourself.',
  'Nothing offensive — no nudity, gore, hate, or harassment.',
  'Keep it about the place: a shot from the spot, not an advert.',
  'No people who would object to being posted, and no children.',
]

export const REPORT_POLICY =
  'Anyone can report a shot. Two independent reports hide it straight away, '
  + 'and a curator reviews every report. Shots that break these rules are removed '
  + 'and repeat offenders lose the ability to post.'
