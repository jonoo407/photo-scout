/* Which build am I actually looking at?
 *
 * On iOS this is not cosmetic: WKWebView storage survives app updates, so a
 * stale bundle can genuinely still be running after installing a new TestFlight
 * build. Surfacing the build number makes "it looks the same" a checkable claim
 * instead of a guess.
 *
 * Both values are injected at build time (see vite.config.ts). The build number
 * is the CI run number, matching CFBundleVersion in the IPA, so what Settings
 * shows lines up with what TestFlight lists. */

declare const __APP_VERSION__: string
declare const __APP_BUILD__: string

export function formatVersion(version: string, build: string | undefined): string {
  return build ? `${version} (${build})` : version
}

export const APP_VERSION = __APP_VERSION__
export const APP_BUILD = __APP_BUILD__
export const APP_VERSION_LABEL = formatVersion(__APP_VERSION__, __APP_BUILD__)
