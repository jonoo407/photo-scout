/** Share a link: native share sheet on mobile, clipboard fallback on desktop.
 *  Returns which path ran so callers can show a "copied" confirmation only
 *  when nothing visible happened. */
export async function shareLink(title: string, url: string): Promise<'shared' | 'copied'> {
  if (navigator.share) {
    await navigator.share({ title, url }).catch(() => {})
    return 'shared'
  }
  await navigator.clipboard?.writeText(url)
  return 'copied'
}
