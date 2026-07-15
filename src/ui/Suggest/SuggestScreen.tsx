import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconArrowLeft, IconMapPinPlus, IconCircleCheck } from '@tabler/icons-react'
import { submitSuggestion } from '../../spots/suggest-api'

/* "Know a great spot we're missing?" — fill in what you know; every entry gets
   fact-checked (two sources, real photos, craft notes) before it ships. */
export default function SuggestScreen() {
  const nav = useNavigate()
  const [name, setName] = useState('')
  const [whereHint, setWhereHint] = useState('')
  const [why, setWhy] = useState('')
  const [accessNotes, setAccessNotes] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  const send = async () => {
    setState('sending')
    try {
      await submitSuggestion({ name, whereHint, why, accessNotes })
      setState('sent')
    } catch {
      setState('error')
    }
  }

  if (state === 'sent') {
    return (
      <div className="screen">
        <button className="back" onClick={() => nav('/explore')}><IconArrowLeft size={18} /> Explore</button>
        <div className="empty">
          <IconCircleCheck size={30} color="var(--go-ink)" />
          <p className="et">Thank you — it's in the queue</p>
          <p className="es">
            Every suggestion gets the full treatment before it ships: facts verified
            from two sources, real photos, light windows and craft notes. Watch Browse.
          </p>
        </div>
      </div>
    )
  }

  const field = (label: string, value: string, set: (v: string) => void, placeholder: string, rows = 2) => (
    <label style={{ display: 'block', marginBottom: 12 }}>
      <span className="small" style={{ display: 'block', fontWeight: 500, margin: '0 0 4px' }}>{label}</span>
      <textarea
        className="notesbox"
        aria-label={label}
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(e) => set(e.target.value)}
      />
    </label>
  )

  return (
    <div className="screen">
      <button className="back" onClick={() => nav('/explore')}><IconArrowLeft size={18} /> Explore</button>
      <h1 style={{ fontSize: 21 }}><IconMapPinPlus size={20} style={{ verticalAlign: '-3px' }} /> Suggest a spot</h1>
      <p className="muted small" style={{ margin: '0 0 14px', lineHeight: 1.5 }}>
        Fill in what you know — we verify everything and add the good ones with
        full light windows and craft notes.
      </p>
      {field('Spot name', name, setName, 'e.g. Secret Overlook at Pine Street', 1)}
      {field('Where is it?', whereHint, setWhereHint, 'Address, cross-street, or how to find it')}
      {field('Why is it good to photograph?', why, setWhy, 'The view, the light, what makes it special')}
      {field('Access notes', accessNotes, setAccessNotes, 'Parking, hours, fees, permits — anything you know')}
      <button className="cta" disabled={!name.trim() || state === 'sending'} onClick={() => void send()}>
        {state === 'sending' ? 'Sending…' : 'Send it in'}
      </button>
      {state === 'error' && (
        <p className="small" style={{ color: 'var(--skip-ink)', marginTop: 8 }}>
          Couldn't send — check your connection and try again.
        </p>
      )}
    </div>
  )
}
