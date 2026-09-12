import { Link } from 'react-router-dom'
import { IconMessage2 } from '@tabler/icons-react'
import { useStore } from '../../state/store'
import { shouldPromptForFeedback } from '../../feedback/nudge'

/* The one place Vantage asks for feedback unprompted (backlog V2b).
 *
 * A card, deliberately — never a modal, never an interstitial. It can be
 * scrolled past and ignored forever without tapping anything, and the timing
 * rules in feedback/nudge.ts mean it appears at most once a month, only after
 * someone has actually used the app, and never during a first run.
 *
 * Both buttons call snooze: dismissing and answering start the same 30-day
 * clock, so the person who helps is not rewarded with a sooner re-ask than
 * the person who ignored it. */
export default function FeedbackCard() {
  const sessions = useStore((s) => s.sessions)
  const feedbackPromptAt = useStore((s) => s.feedbackPromptAt)
  const introSeen = useStore((s) => s.introSeen)
  const snooze = useStore((s) => s.snoozeFeedbackPrompt)

  if (!shouldPromptForFeedback({ sessions, feedbackPromptAt, introSeen }, new Date())) return null

  return (
    <div className="card" style={{ padding: 14, marginBottom: 14 }}>
      <p className="et" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 7 }}>
        <IconMessage2 size={17} /> How is Vantage working out?
      </p>
      <p className="small tertiary" style={{ margin: '6px 0 12px', lineHeight: 1.6 }}>
        Anything broken, confusing or missing — it goes straight to the person who builds it.
      </p>
      <div style={{ display: 'flex', gap: 8 }}>
        <Link
          to="/you/feedback"
          className="cta"
          style={{ flex: 1, textAlign: 'center', textDecoration: 'none' }}
          onClick={snooze}
        >
          Tell us
        </Link>
        <button className="chip" style={{ flex: 'none' }} onClick={snooze}>Not now</button>
      </div>
    </div>
  )
}
