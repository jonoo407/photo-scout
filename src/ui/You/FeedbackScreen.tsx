import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconArrowLeft, IconSend, IconCheck } from '@tabler/icons-react'
import { submitFeedback, type FeedbackKind } from '../../feedback/api'
import { APP_VERSION_LABEL } from '../../app-version'

/* Tester feedback for the TestFlight phase. Deliberately one screen, one box,
   one button — anything longer and people don't bother. Build identity is
   attached automatically rather than asked for. Replace with the fuller
   feedback flow (backlog V2) once testing opens up. */

const KINDS: Array<{ id: FeedbackKind; label: string }> = [
  { id: 'bug', label: 'Something broke' },
  { id: 'idea', label: 'Idea' },
  { id: 'praise', label: 'Liked it' },
]

export default function FeedbackScreen() {
  const nav = useNavigate()
  const [kind, setKind] = useState<FeedbackKind>('bug')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [err, setErr] = useState('')

  const send = async () => {
    setErr(''); setState('sending')
    try {
      await submitFeedback({ message, kind, email: email || undefined })
      setState('sent')
    } catch (e) {
      setErr((e as Error).message || "Couldn't send — check your connection and try again.")
      setState('idle')
    }
  }

  return (
    <div className="screen">
      <button className="back" onClick={() => nav('/you')}><IconArrowLeft size={18} /> You</button>
      <h1>Tester feedback</h1>

      {state === 'sent' ? (
        <div className="card" style={{ padding: 18, textAlign: 'center' }}>
          <IconCheck size={28} />
          <p className="et" style={{ marginTop: 6 }}>Thanks — sent.</p>
          <p className="es">It landed with the build number attached, so it can be traced.</p>
          <button className="cta" style={{ maxWidth: 220, margin: '12px auto 0' }} onClick={() => nav('/you')}>
            Back to You
          </button>
        </div>
      ) : (
        <>
          <p className="small tertiary" style={{ margin: '0 2px 10px', lineHeight: 1.6 }}>
            Anything at all — broken, confusing, missing, or good. Goes straight to Jon.
          </p>

          <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
            {KINDS.map((k) => (
              <button key={k.id} className={`chip ${kind === k.id ? 'on' : ''}`} onClick={() => setKind(k.id)}>
                {k.label}
              </button>
            ))}
          </div>

          <div className="card" style={{ padding: 12 }}>
            <label className="small tertiary" htmlFor="fb-msg">What happened?</label>
            <textarea
              id="fb-msg"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={7}
              placeholder="The photos on the spot page were blank, but they showed up in Safari…"
              className="fbfield"
            />
            <label className="small tertiary" htmlFor="fb-email" style={{ display: 'block', marginTop: 10 }}>
              Email (optional — only so you can be replied to)
            </label>
            <input
              id="fb-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="fbfield"
            />
          </div>

          {err && <p className="small" style={{ color: 'var(--terracotta)', margin: '10px 2px' }}>{err}</p>}

          <button
            className="cta"
            style={{ width: '100%', marginTop: 12 }}
            disabled={!message.trim() || state === 'sending'}
            onClick={send}
          >
            <IconSend size={17} /> {state === 'sending' ? 'Sending…' : 'Send feedback'}
          </button>

          <p className="small tertiary" style={{ margin: '10px 2px 0' }}>
            Sent with Vantage {APP_VERSION_LABEL} so the report can be traced to a build.
          </p>
        </>
      )}
    </div>
  )
}
