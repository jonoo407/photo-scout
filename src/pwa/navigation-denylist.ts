/* Real server paths the installed service worker must leave to the network.
   The app is hash-routed, so the worker's navigation fallback only ever needs
   to answer "/"; anything listed here is a page the Worker renders itself,
   and answering it with the precached app shell breaks it.

   No imports: vite.config.ts reads this. */

/** Stored client-list links, https://shootvantage.com/l/<uuid> (see
    storedShortlistUrl). The Worker answers them with per-list OG tags and a
    hop to #/list?id=…; the app shell instead drops the id and opens the
    photographer's home screen. Case-insensitive like the Worker's route. */
export const CLIENT_LIST_PATHS = /^\/l\//i
