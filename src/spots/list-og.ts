/* Unfurl page for shared client shortlists. The share URL is a real path
   (/l/<uuid>) because messengers never send the #fragment to the server; the
   Worker renders these OG tags there, then the meta-refresh carries the human
   on to the app's hash route. Titles are client data — escape everything. */

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string)

export function listOgHtml(id: string, title: string | null, spotCount: number): string {
  const ogTitle = title ? `${esc(title)} — location options` : 'Location options'
  const desc = `${spotCount} ${spotCount === 1 ? 'spot' : 'spots'} to pick from — best light, address and your photographer's notes for each.`
  const target = `/#/list?id=${encodeURIComponent(id)}`
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${ogTitle}</title>
<meta property="og:type" content="website">
<meta property="og:site_name" content="Vantage">
<meta property="og:title" content="${ogTitle}">
<meta property="og:description" content="${desc}">
<meta property="og:image" content="https://shootvantage.com/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta http-equiv="refresh" content="0; url=${target}">
</head>
<body>
<p>Opening your location options… <a href="${target}">Continue</a></p>
</body>
</html>`
}
