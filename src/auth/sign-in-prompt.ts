import { create } from 'zustand'
import { authAvailable } from './supabase'
import { useAuth } from './useAuth'

/* The soft gate (design 4b, G1 2026-09-24). Everything browses without an
   account; an account is asked for only at the moment an action needs one —
   saving, alerts, uploading, rating, reporting, voting, joining a hunt, or
   creating a client shortlist — with a sheet over the screen the person was
   on. "Not now" leaves them exactly where they were.

   When the sign-in lands in place (email + password), the sheet closes and
   the action that asked for it runs, so the tap is never wasted. Google is a
   full-page redirect that no in-memory callback survives; return-to.ts brings
   the person back to the same screen instead.

   Auth not configured (dev without env, vitest) → nothing is gated, exactly
   as the app behaved local-first before accounts existed. */

export type SignInReason =
  | 'save' | 'alerts' | 'upload' | 'rate' | 'report' | 'vote' | 'hunt' | 'share'

interface PromptState {
  reason: SignInReason | null
  /** What the person tapped, e.g. a spot name or a hunt title. */
  context: string | null
  pending: (() => void) | null
}

export const useSignInPrompt = create<PromptState>(() => ({ reason: null, context: null, pending: null }))

/** True when an action needs an account and nobody is signed in. */
export function needsSignIn(): boolean {
  return authAvailable() && !useAuth.getState().user
}

/**
 * Run `action` now if it needs no sign-in (or someone is signed in) and
 * return true. Otherwise open the sign-in sheet, keep `action` to run once
 * the sign-in completes in place, and return false.
 *
 * Pass no action for things a browser only allows from a fresh tap — the
 * notification permission prompt, the file/camera picker, the share sheet.
 * Those can't be replayed after an async sign-in; the person lands back on
 * the same control, now enabled, and taps it once more.
 */
export function requireSignIn(reason: SignInReason, action?: () => void, context?: string): boolean {
  if (!needsSignIn()) { action?.(); return true }
  useSignInPrompt.setState({ reason, context: context ?? null, pending: action ?? null })
  return false
}

export function dismissSignIn(): void {
  useSignInPrompt.setState({ reason: null, context: null, pending: null })
}

useAuth.subscribe((s, prev) => {
  if (!s.user || prev.user) return
  const { reason, pending } = useSignInPrompt.getState()
  if (!reason) return
  dismissSignIn()
  pending?.()
})

/** A guest the UI should nudge: auth is on, the stored session has finished
    restoring, and nobody is signed in. `idle` is excluded so a returning
    person never sees "sign in" flash before their session lands. */
export function useIsGuest(): boolean {
  const user = useAuth((s) => s.user)
  const status = useAuth((s) => s.status)
  return authAvailable() && !user && status !== 'idle'
}

/** `/signin?next=<route>` — the full sign-in page, returning here after. */
export function signInPath(next: string): string {
  return `/signin?next=${encodeURIComponent(next)}`
}

/** Only an in-app route is a valid place to return to. */
export function safeNext(next: string | null | undefined): string {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/'
}
