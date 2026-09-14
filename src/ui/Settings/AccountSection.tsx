import { IconUserCircle, IconCloudCheck, IconLogout } from '@tabler/icons-react'
import { authAvailable } from '../../auth/supabase'
import { useAuth } from '../../auth/useAuth'

/* Account row for Settings. Since the sign-in gate (2026-09-14) nobody
   reaches Settings signed out, so this is only "who you are, and how to
   leave" — every sign-in control lives on the gate's own screen. Hidden
   entirely until auth is configured. */
export default function AccountSection() {
  const user = useAuth((s) => s.user)
  const signOut = useAuth((s) => s.signOut)

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
        <button className="row last" onClick={() => void signOut()}>
          <span className="rowleft" style={{ color: 'var(--terracotta)' }}><IconLogout size={18} /> Sign out</span>
        </button>
      </div>
    </>
  )
}
