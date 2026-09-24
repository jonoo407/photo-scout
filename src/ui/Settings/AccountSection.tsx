import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  IconUserCircle, IconCloudCheck, IconLogout, IconTrash, IconLogin, IconChevronRight,
} from '@tabler/icons-react'
import { authAvailable } from '../../auth/supabase'
import { useAuth } from '../../auth/useAuth'
import { signInPath, useIsGuest } from '../../auth/sign-in-prompt'
import DeleteAccountSheet from './DeleteAccountSheet'

/* Account row for Settings: "who you are, and how to leave" when signed in;
   the way in (the full sign-in page) for a guest. Hidden entirely until auth
   is configured. */
export default function AccountSection() {
  const user = useAuth((s) => s.user)
  const signOut = useAuth((s) => s.signOut)
  const guest = useIsGuest()
  const [deleting, setDeleting] = useState(false)

  if (guest) return <GuestAccount />

  if (!authAvailable() || !user) return null

  return (
    <>
      <p className="shdr">ACCOUNT</p>
      <div className="card list">
        <div className="row">
          <span className="rowleft"><IconUserCircle size={18} /> {user.email ?? 'Signed in'}</span>
          <span className="pill open"><IconCloudCheck size={12} /> Sync on</span>
        </div>
        <p className="small tertiary" style={{ margin: '0 2px 8px' }}>
          Saved spots, shot checklists and settings are synced across your devices.
        </p>
        <button className="row" onClick={() => void signOut()}>
          <span className="rowleft" style={{ color: 'var(--terracotta)' }}><IconLogout size={18} /> Sign out</span>
        </button>
        <button className="row last" onClick={() => setDeleting(true)}>
          <span className="rowleft" style={{ color: 'var(--skip-ink)' }}><IconTrash size={18} /> Delete account</span>
        </button>
      </div>
      {deleting && <DeleteAccountSheet onClose={() => setDeleting(false)} />}
    </>
  )
}

function GuestAccount() {
  const nav = useNavigate()
  return (
    <>
      <p className="shdr">ACCOUNT</p>
      <div className="card list">
        <button className="row last" onClick={() => nav(signInPath('/settings'))}>
          <span className="rowleft" style={{ color: 'var(--terracotta)' }}><IconLogin size={18} /> Sign in or create a free account</span>
          <span className="val"><IconChevronRight size={14} color="var(--ink-3)" /></span>
        </button>
      </div>
      <p className="small tertiary" style={{ margin: '6px 2px 0' }}>
        Browsing needs no account. One keeps your saved spots and plans on every device, and unlocks alerts, uploads, votes and client shortlists.
      </p>
    </>
  )
}
