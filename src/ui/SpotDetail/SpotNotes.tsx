import { IconLock } from '@tabler/icons-react'
import { useStore } from '../../state/store'

/* Private field notes on a spot — gate codes, contacts, the angle that worked.
   Synced with the account; never shown to clients (shortlist notes are the
   deliberate client-facing channel). */
export default function SpotNotes({ spotId }: { spotId: string }) {
  const note = useStore((s) => s.spotNotes[spotId] ?? '')
  const setSpotNote = useStore((s) => s.setSpotNote)

  return (
    <>
      <h3 className="h3">My notes</h3>
      <textarea
        className="notesbox"
        aria-label="My notes for this spot"
        placeholder="Gate codes, contacts, the angle that worked — only you see this."
        defaultValue={note}
        onChange={(e) => setSpotNote(spotId, e.target.value)}
        rows={3}
      />
      <p className="small tertiary" style={{ margin: '4px 2px 0', display: 'flex', alignItems: 'center', gap: 4 }}>
        <IconLock size={12} /> Private — syncs with your account, never shared.
      </p>
    </>
  )
}
