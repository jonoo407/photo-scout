import { useState } from 'react'
import { IconUserCircle, IconMailForward, IconCloudCheck, IconLogout } from '@tabler/icons-react'
import { authAvailable } from '../../auth/supabase'
import { useAuth } from '../../auth/useAuth'

/* Passwordless account row for Settings. Hidden entirely until auth is
   configured; the app never gates anything behind sign-in — an account only
   adds cross-device sync of saved spots + prefs. */
export default function AccountSection() {
  const user = useAuth((s) => s.user)
  const status = useAuth((s) => s.status)
  const errorMsg = useAuth((s) => s.errorMsg)
  const signInWithEmail = useAuth((s) => s.signInWithEmail)
  const signOut = useAuth((s) => s.signOut)
  const [email, setEmail] = useState('')

  if (!authAvailable()) return null

  return (
    <>
      <p className="shdr">ACCOUNT</p>
      <div className="card list">
        {user ? (
          <>
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
          </>
        ) : status === 'sent' ? (
          <p className="small" style={{ margin: '2px 2px 8px', lineHeight: 1.6 }}>
            <IconMailForward size={15} style={{ verticalAlign: '-2px' }} /> Check your email — tap the
            sign-in link and you're in. No password needed.
          </p>
        ) : (
          <>
            <div className="row">
              <span className="rowleft"><IconUserCircle size={18} /> Sign in</span>
              <span className="addrset">
                <input
                  className="addrinput"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="your email"
                  aria-label="Email for sign-in link"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && email.trim()) void signInWithEmail(email.trim()) }}
                />
              </span>
            </div>
            <button
              className="row last"
              onClick={() => { if (email.trim()) void signInWithEmail(email.trim()) }}
              disabled={status === 'sending' || !email.trim()}
            >
              <span className="rowleft" style={{ color: 'var(--terracotta)' }}>
                <IconMailForward size={18} /> {status === 'sending' ? 'Sending…' : 'Send sign-in link'}
              </span>
            </button>
            {status === 'error' && errorMsg && (
              <p className="small" style={{ color: 'var(--skip-ink)', margin: '0 2px 8px' }}>{errorMsg}</p>
            )}
            <p className="small tertiary" style={{ margin: '0 2px 8px' }}>
              No password — we email you a link. Signing in syncs your saved spots across devices.
            </p>
          </>
        )}
      </div>
    </>
  )
}
