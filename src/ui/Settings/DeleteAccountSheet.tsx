import { useState } from 'react'
import { IconTrash } from '@tabler/icons-react'
import { deleteAccount } from '../../auth/delete-account'
import { useAuth } from '../../auth/useAuth'

/* Settings → Delete account (App Store guideline 5.1.1(v)).

   Typing the word is the confirmation, not a second "Are you sure?" tap:
   there is no undo, and a tap is too easy to make on the way to Sign out,
   which sits directly above. The list says what goes in plain words, because
   "your data" tells nobody whether their client lists survive. */

export const CONFIRM_WORD = 'DELETE'

const WHAT_GOES = [
  'Saved spots, day plans, shot checklists and private notes',
  'Client shortlists and every response to them',
  'Every photo you added, including ones others rated',
  'Craft points, hunt progress, votes and your block list',
  'Alerts on every device you turned them on',
]

export default function DeleteAccountSheet({ onClose }: { onClose: () => void }) {
  const user = useAuth((s) => s.user)
  const [typed, setTyped] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const confirmed = typed.trim().toUpperCase() === CONFIRM_WORD

  const submit = async () => {
    if (!confirmed || busy || !user) return
    setBusy(true); setError(null)
    const res = await deleteAccount(user.id)
    if (!res.ok) { setBusy(false); setError(res.message); return }
    useAuth.setState({ notice: 'Your account and everything in it have been deleted.' })
  }

  return (
    <div className="sheet-backdrop" onClick={busy ? undefined : onClose}>
      <div className="sheet" role="dialog" aria-label="Delete your account" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" aria-hidden />
        <h2 style={{ fontSize: 19, margin: '4px 0 2px' }}>Delete your account?</h2>
        <p className="small muted" style={{ margin: '0 2px 8px' }}>
          This permanently deletes {user?.email ?? 'your account'} and everything in it, on every device. It can't be undone.
        </p>

        <ul className="small" style={{ margin: '0 0 12px', paddingLeft: 20, lineHeight: 1.6 }}>
          {WHAT_GOES.map((w) => <li key={w}>{w}</li>)}
        </ul>

        <label htmlFor="delete-confirm" className="shdr" style={{ display: 'block' }}>
          TYPE {CONFIRM_WORD} TO CONFIRM
        </label>
        <input
          id="delete-confirm"
          className="confirm-field"
          type="text"
          autoCapitalize="characters"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          value={typed}
          onChange={(e) => { setTyped(e.target.value); if (error) setError(null) }}
          onKeyDown={(e) => { if (e.key === 'Enter') void submit() }}
          disabled={busy}
        />

        {error && <p className="small" role="alert" style={{ color: 'var(--skip-ink)', margin: '8px 2px 0' }}>{error}</p>}

        <button
          className="cta danger"
          onClick={() => void submit()}
          disabled={!confirmed || busy}
          style={{ marginTop: 12 }}
        >
          <IconTrash size={15} /> {busy ? 'Deleting…' : 'Delete my account'}
        </button>
        <button className="chip" onClick={onClose} disabled={busy} style={{ width: '100%', marginTop: 8 }}>
          Cancel
        </button>
      </div>
    </div>
  )
}
