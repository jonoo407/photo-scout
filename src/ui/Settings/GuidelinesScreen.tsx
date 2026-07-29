import { useNavigate, Link } from 'react-router-dom'
import { IconArrowLeft, IconMail, IconMessage2, IconChevronRight } from '@tabler/icons-react'
import { POSTING_RULES, REPORT_POLICY, SUPPORT_EMAIL } from '../../community/standards'

/* Community guidelines + published contact (V1, App Review guideline 1.2).
   Reachable from Settings and from the pre-upload agreement. */
export default function GuidelinesScreen() {
  const nav = useNavigate()
  return (
    <div className="screen">
      <button className="back" onClick={() => nav(-1)}><IconArrowLeft size={18} /> Back</button>
      <h1>Community guidelines</h1>
      <p className="small muted" style={{ margin: '0 2px 16px', lineHeight: 1.6 }}>
        Shots you add to a spot are visible to every other photographer using Vantage.
        These are the rules for what belongs there.
      </p>

      <p className="shdr">WHAT ISN'T ALLOWED</p>
      <div className="card list">
        {POSTING_RULES.map((rule) => (
          <div className="row" key={rule}><span className="rowleft">{rule}</span></div>
        ))}
      </div>

      <p className="shdr">REPORTING</p>
      <p className="small" style={{ margin: '0 2px 14px', lineHeight: 1.6 }}>{REPORT_POLICY}</p>
      <p className="small tertiary" style={{ margin: '0 2px 14px', lineHeight: 1.6 }}>
        Every shot that isn't yours has a flag button on it. You can also block a
        photographer outright — their shots disappear for you everywhere, straight
        away, without waiting on anyone's review. Undo that in Settings.
      </p>

      <p className="shdr">CONTACT</p>
      <div className="card list">
        <a className="row" href={`mailto:${SUPPORT_EMAIL}`}>
          <span className="rowleft" style={{ color: 'var(--terracotta)' }}><IconMail size={18} /> {SUPPORT_EMAIL}</span>
          <IconChevronRight size={16} className="val" />
        </a>
        <Link className="row last" to="/you/feedback">
          <span className="rowleft" style={{ color: 'var(--terracotta)' }}><IconMessage2 size={18} /> Send feedback in the app</span>
          <IconChevronRight size={16} className="val" />
        </Link>
      </div>
      <p className="small tertiary" style={{ margin: '10px 2px 0', lineHeight: 1.6 }}>
        Reports about content are answered within one business day.
      </p>
    </div>
  )
}
