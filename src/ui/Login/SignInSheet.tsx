import { useEffect } from 'react'
import { useAuth } from '../../auth/useAuth'
import { useSignInPrompt, dismissSignIn, type SignInReason } from '../../auth/sign-in-prompt'
import SignInForm from './SignInForm'

/* The contextual sign-in sheet (design 4b): the screen stays visible behind
   the scrim — context is the pitch — and the copy names exactly what is at
   stake instead of generic sign-up language. "Not now" returns to browsing.
   Opened by requireSignIn(); closes itself when the sign-in lands. */

const COPY: Record<SignInReason, { title: string; body: string }> = {
  save: {
    title: 'Keep your spots',
    body: 'Want-to-go spots, visits and day plans live in your free account and follow you to every device.',
  },
  alerts: {
    title: 'Get pinged when the light lines up',
    body: 'Alerts watch your Want-to-go spots, so they need an account to know which spots are yours.',
  },
  upload: {
    title: 'Share your shots',
    body: 'Your uploads live in your account — shared with the community, rateable, and earning you points.',
  },
  rate: {
    title: 'Rate community shots',
    body: 'One rating per photographer keeps the scores honest, and that takes a free account.',
  },
  report: {
    title: 'Report a shot',
    body: 'Reports come from accounts so they can’t be used to spam a photographer off the app.',
  },
  vote: {
    title: 'Cast your vote',
    body: 'One vote per person — a free account keeps the next-city scoreboard honest.',
  },
  hunt: {
    title: 'Save your progress first',
    body: 'Hunt stops, points and your finish bonus need a home.',
  },
  share: {
    title: 'Send a client shortlist',
    body: 'Your list is stored with your notes, and your client’s pick comes back to you.',
  },
}

export default function SignInSheet() {
  const reason = useSignInPrompt((s) => s.reason)
  const context = useSignInPrompt((s) => s.context)
  const status = useAuth((s) => s.status)
  const clearStatus = useAuth((s) => s.clearStatus)

  useEffect(() => {
    if (!reason) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [reason]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!reason) return null
  const { title, body } = COPY[reason]

  function close() {
    // A stale error must not greet the next prompt.
    if (status === 'error') clearStatus()
    dismissSignIn()
  }

  return (
    <div className="sheet-backdrop" onClick={close}>
      <div
        className="sheet signin-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="signin-sheet-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-handle" aria-hidden />
        {context && <p className="eyebrow signin-sheet-context">{context}</p>}
        <h2 id="signin-sheet-title">{title}</h2>
        <p className="small muted signin-sheet-body">{body} Free, two taps.</p>
        <SignInForm />
        <p className="center-note small">
          <button className="linky" type="button" onClick={close}>Not now</button>
        </p>
      </div>
    </div>
  )
}
