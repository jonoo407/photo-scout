// @vitest-environment node
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import capacitorConfig from '../../capacitor.config'

/*
 * Native push fails SILENTLY at every native link: with no AppDelegate
 * forwarding, `PushNotifications.register()` resolves and then neither the
 * `registration` nor the `registrationError` listener ever fires — the enable
 * flow just waits out its timeout. That shipped in builds 15–17 and no
 * simulator or unit test could see it, since the simulator gets no token.
 *
 * So, like ios-permissions.test.ts, this ties the JS dependency on
 * @capacitor/push-notifications to each native piece it needs
 * (https://capacitorjs.com/docs/apis/push-notifications#ios).
 */
const ROOT = path.resolve(__dirname, '../..')
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), 'utf8')

const appDelegate = read('ios/App/App/AppDelegate.swift')
const entitlements = read('ios/App/App/App.entitlements')
const pbxproj = read('ios/App/App.xcodeproj/project.pbxproj')

/** The App target's build settings for one configuration (the project-level
    blocks carry no INFOPLIST_FILE, which is how the target's are told apart). */
function targetConfig(name: 'Debug' | 'Release'): string {
  const blocks = [...pbxproj.matchAll(new RegExp(`/\\* ${name} \\*/ = \\{[\\s\\S]*?name = ${name};`, 'g'))]
    .map((m) => m[0])
    .filter((b) => b.includes('INFOPLIST_FILE'))
  expect(blocks, `exactly one App-target ${name} config`).toHaveLength(1)
  return blocks[0]
}

describe('iOS push wiring', () => {
  it('the app really does use the Capacitor push plugin', () => {
    expect(read('src/push/native-push.ts')).toMatch(/from '@capacitor\/push-notifications'/)
    expect(read('ios/App/CapApp-SPM/Package.swift')).toMatch(/CapacitorPushNotifications/)
  })

  it('AppDelegate hands the device token to the plugin', () => {
    expect(appDelegate).toMatch(
      /func application\(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data\)\s*\{\s*NotificationCenter\.default\.post\(name: \.capacitorDidRegisterForRemoteNotifications, object: deviceToken\)/,
    )
  })

  it('AppDelegate hands registration failures to the plugin', () => {
    expect(appDelegate).toMatch(
      /func application\(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error\)\s*\{\s*NotificationCenter\.default\.post\(name: \.capacitorDidFailToRegisterForRemoteNotifications, object: error\)/,
    )
  })

  it('signs release builds with the production APNs entitlement', () => {
    expect(entitlements).toMatch(/<key>aps-environment<\/key>\s*<string>production<\/string>/)
    expect(targetConfig('Release')).toMatch(/CODE_SIGN_ENTITLEMENTS = App\/App\.entitlements;/)
  })

  it('keeps the entitlement off Debug, which the unsigned simulator gate builds', () => {
    // An aps-environment entitlement with no provisioning profile to grant it
    // stops the app launching on the simulator (2026-07-29).
    expect(targetConfig('Debug')).not.toMatch(/CODE_SIGN_ENTITLEMENTS/)
  })

  it('shows alerts that arrive while the app is open', () => {
    const opts = (capacitorConfig.plugins?.PushNotifications as { presentationOptions?: string[] } | undefined)
      ?.presentationOptions ?? []
    expect(opts).toEqual(expect.arrayContaining(['banner', 'list']))
  })
})
