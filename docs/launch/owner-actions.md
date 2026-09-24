# Owner actions: shipping the six launch PRs

> **Status (2026-09-24, evening): steps 1–7 are done.** A Claude Code agent did the backend prep, merged all six PRs itself and verified production; see [HANDOFF.md](./HANDOFF.md) for the results. **Standing rule from the owner: agents do all merges.** Never hand the owner a list of PRs to merge. What's left for the owner is step 8 (iPhone check) and step 9 (App Store Connect). The rest of this doc is kept as the record of how the rollout was planned.

> **Launch-handoff note (2026-09-24):** this doc was written for the Cursor Cloud Agents workflow (steps 1–5 assume an agent with Cursor-managed secrets access). If you're working with Claude Code from the repo only, the mechanism in step 3 (Cursor's Secrets dashboard) and the "reply in chat" trigger in step 5 don't apply directly — but the underlying steps (get a Supabase token and a Cloudflare token, apply the migration, deploy the function, set the Worker secret) are the same regardless of which agent runs them. See [HANDOFF.md](./HANDOFF.md) for how this maps onto a repo-only handoff, and use section "Fallback: doing it yourself without giving agents tokens" below if you'd rather the owner do the backend prep by hand.

Last checked: 2026-09-24. Everything marked **(unverified)** is something I could not check from here; the rest was checked against the repo, GitHub, or the provider's current docs.

## What's already done (no action needed)

- **The five PRs are stacked and mergeable in order**, with no conflicts: [#6](https://github.com/jonoo407/photo-scout/pull/6) → [#5](https://github.com/jonoo407/photo-scout/pull/5) → [#7](https://github.com/jonoo407/photo-scout/pull/7) → [#4](https://github.com/jonoo407/photo-scout/pull/4) → [#3](https://github.com/jonoo407/photo-scout/pull/3). Each PR is based on the one before it, so each shows only its own changes. I simulated the whole sequence: merged in that order with merge commits, it produces zero conflicts and ends at exactly the code in #3's branch. Each branch passes the full unit suite and build locally, and CI's WebKit gate is green on every PR.
- **[#8 guest browsing](https://github.com/jonoo407/photo-scout/pull/8) is stacked sixth, on #3.** It already has #3's branch merged in, with the overlaps resolved. A simulated merge of all six into `main` in order (#6 → #5 → #7 → #4 → #3 → #8, merge commits) is conflict-free and ends at exactly #8's branch. That merged code passes the unit suite, the WebKit and accessibility gates, and #8's new signed-out (guest) e2e suite.
- **Legal details are filled in #4**: Jon Flaherty (individual), 3812 W Leona St, Tampa, FL 33629; Florida law, Hillsborough County venue; `support@shootvantage.com`. The privacy policy now also says that photo metadata (GPS and so on) is stripped, which #7 makes true.
- **Supabase hosting region**: filled as *US East (Northern Virginia)*. I worked this out from the database host's IP address, which is in AWS `us-east-1`. That's strong evidence but not official, so an agent confirms it with one API call in step 5 below.
- **Phone for App Store review**: the owner has this number; it is deliberately **not written in this repo**. It goes only into App Store Connect (step 9), never into a public page or a committed file.

## What agents can and can't do

| | Agents today | Agents after step 3 (tokens added) |
|---|---|---|
| Push branches, fix conflicts, update PR text, change PR base, mark PRs "Ready for review" | Yes | Yes |
| **Merge PRs** | **Yes, and they should: the owner wants agents to do every merge.** (Cursor's agents had read-only merge access; Claude Code's GitHub tools merged all six on 2026-09-24.) | Yes |
| Change repo settings | No | No |
| Push a `v*` tag to start a TestFlight build | Cursor: yes. Claude Code cloud: **no**, the git proxy refuses tag pushes, so run `ios-release.yml` by manual dispatch with `package.json`'s version bumped instead | Same |
| Apply the Supabase migration, deploy the `delete-account` function, run SQL checks | No (no Supabase credentials in the agent environment) | Yes |
| Set or confirm the Worker secret `SUPABASE_HOOK_SECRET`, roll back a bad deploy | No (no Cloudflare credentials) | Yes |
| Test on a real iPhone, fill App Store Connect fields | No | No |

So the minimum for you is: **one-time token setup (steps 1–4), the iPhone check (step 8), and App Store Connect fields (step 9).** Agents do everything else, merges included.

---

## Step 1. Supabase access token (about 2 minutes)

You already created one of these: `HANDOFF.md` records a Supabase personal access token saved as `SUPABASE_ACCESS_TOKEN` in your local `.env.local`, which is how an earlier session configured email. **Reuse it if it hasn't expired.** Otherwise make a new one.

**Reuse:**
1. Open `.env.local` in your local checkout and copy the value after `SUPABASE_ACCESS_TOKEN=`. It starts with `sbp_`.
2. Check it's still valid: go to <https://supabase.com/dashboard/account/tokens>. You should see it listed, with an expiry date in the future. If it isn't listed, or has expired, make a new one instead.

**New token:**
1. Go to <https://supabase.com/dashboard/account/tokens> (or click your avatar, top right → **Account preferences** → **Access Tokens**).
2. Click **Generate new token**.
3. **Name:** `cursor-cloud-agents`. **Expires in:** 30 days is enough for this rollout (the default is 30 days).
4. If the dialog offers permissions (Supabase's scoped tokens are still rolling out, so you may not see them), the simplest choice is full access. If you'd rather scope it, pick project `gxxjxfwxufqqxcyrdibh` and grant: Project Settings *Read*, Database *Read-write*, Migrations *Read-write*, Edge Functions *Read-write*, Logs *Read*. **(unverified)** I haven't confirmed that the CLI's function deploy works with a scoped token. If an agent reports a 403, generate a full-access token instead.
5. Click **Generate token** and copy it right away. It starts with `sbp_` and is shown only once.

## Step 2. Cloudflare API token (about 3 minutes)

1. Open the Cloudflare dashboard → **Manage account** → **Account API tokens** (Cloudflare's docs: "go to the Account API tokens page").
2. Click **Create Token**.
3. Under *Permission policies*, choose the **Edit Cloudflare Workers** template.
4. **Account resources:** your account only. **Zone resources:** the zone `shootvantage.com`.
5. **Continue to summary** → **Create Token**, then copy it. It's shown only once.
6. Your **account ID** is `cb16e5a03883ad35f25082e8a2f5a3c0`. I read it from the Workers Builds link on PR #6, so you don't need to look it up. To double-check: **Workers & Pages** → *Account details* → **Account ID**.

If you can't find "Account API tokens", the older route works too: profile icon → **My Profile** → **API Tokens** → **Create Token** → **Edit Cloudflare Workers** → **Use template**. **(unverified)** Exact button labels may differ slightly from what Cloudflare's docs show.

## Step 3. Give the tokens to Cursor's cloud agents (about 2 minutes)

1. Go to <https://cursor.com/dashboard/cloud-agents> and open **Secrets** (your personal "My Secrets").
2. Click **Add Secrets** and paste these four lines, with your two tokens in place of the placeholders:

   ```
   SUPABASE_ACCESS_TOKEN=sbp_...your token...
   CLOUDFLARE_API_TOKEN=...your token...
   CLOUDFLARE_ACCOUNT_ID=cb16e5a03883ad35f25082e8a2f5a3c0
   SUPABASE_PROJECT_REF=gxxjxfwxufqqxcyrdibh
   ```

3. Set the type of each line:
   - The two tokens: **Runtime Secret** (formerly "Redacted"). Agents can use them, but the values are replaced with `[REDACTED]` in transcripts, tool output and commits.
   - The account ID and project ref: **Environment Variable**. They aren't secret.
4. Under **Apply to**, choose the repository `jonoo407/photo-scout` (or all repositories).
5. Click **Save**.

What should happen: secrets reach **newly started** agents only. Agents that are already running won't see them.

If an agent later reports the variables missing, the likely cause is that they were saved to a different environment. Personal secrets apply to every environment for the repo, which is why I recommend them. The environment these agents actually boot from is [c638da4d-b835-11f1-977f-f6b8f2fcf9b2](https://cursor.com/dashboard/cloud-agents/environments/e/c638da4d-b835-11f1-977f-f6b8f2fcf9b2); you can also add the secrets there. The flow above follows Cursor's docs plus a Cursor staff answer on the forum; **(unverified)** I haven't clicked through the UI myself.

> If you're handing this to Claude Code instead of a Cursor cloud agent, there is no Cursor Secrets dashboard to use. Either paste the two tokens directly into your conversation with Claude Code so it can export them as local shell environment variables for one session (then rotate them afterwards), or skip straight to "Fallback: doing it yourself without giving agents tokens" below and do steps A–G yourself.

## Step 4. One GitHub setting (30 seconds; optional, but recommended)

1. Go to <https://github.com/jonoo407/photo-scout/settings>. The **General** page opens.
2. Scroll to **Pull Requests** and tick **Automatically delete head branches**. It saves as soon as you tick it.

Why: when a merged PR's branch is deleted, GitHub automatically retargets the next PR in the stack onto `main`. With this ticked, you never have to click "Delete branch" in step 6. The setting is currently **off**.

## Step 5. Tell the agents to prepare the backend

Reply in chat: **"Secrets added — do the backend prep."** A fresh agent then does the following and reports back. You don't need to do anything, but this is what to expect.

1. **Confirms both tokens work** and reads the project's region from the Supabase Management API (`GET /v1/projects/gxxjxfwxufqqxcyrdibh`). If it isn't `us-east-1`, the agent corrects the region sentence in #4 before you merge.
2. **Checks the webhook secret exists** in the database: `internal.config.worker_hook_secret` is set and non-empty. The agent checks only its length and never prints the value.
3. **Makes the Worker's `SUPABASE_HOOK_SECRET` equal the database value.** It pipes the value straight from the database into `wrangler secret put SUPABASE_HOOK_SECRET --name vantage` without printing it. This matters because #6 makes the Worker reject any webhook call whose secret doesn't match. Cloudflare can't show a stored secret, so writing the known value is the only reliable way to make sure they match. Side effect: Cloudflare redeploys the current code with the new secret, which is harmless.
4. **Applies #6's migration** (`supabase/migrations/20260924000000_webhook_shared_secret.sql`) through the Management API's "apply a migration" endpoint, which also records it in the migration history. It then checks that all three trigger functions now send the header. **This is the "migration before deploy" requirement.** The migration is safe to apply now, because the current Worker simply ignores the extra header.
5. **Runs #5's cascade check.** For every foreign key into `auth.users`, the delete rule must be `c` (cascade) or `n` (set null). If any reads `a` or `r`, the agent writes a small fix migration and asks you before merging #5.
6. **Deploys the `delete-account` Edge Function** from #5's branch, with JWT verification on: `npx supabase functions deploy delete-account --project-ref gxxjxfwxufqqxcyrdibh --use-api`. It then confirms the function shows as active. Deploying before the merge is safe, because nothing calls the function until #5's Worker code is live.
7. **Marks all six PRs "Ready for review"** so they can be merged.
8. **Reports "backend ready".** Don't merge anything until you see this.

## Step 6. Agents merge the six PRs, in this order (done 2026-09-24)

**This is the agent's job, not the owner's.** The owner always wants agents to do merges. It was done on 2026-09-24: all six merged in order, each deploy confirmed before the next. The click-by-click steps below are kept only as a manual fallback, for example if an agent's GitHub access can't merge.

Order: **#6 → #5 → #7 → #4 → #3 → #8.** Each merge deploys to shootvantage.com automatically.

Manual fallback, for each PR in turn:

1. Open it:
   1. [#6 Worker security](https://github.com/jonoo407/photo-scout/pull/6)
   2. [#5 Account deletion](https://github.com/jonoo407/photo-scout/pull/5)
   3. [#7 EXIF stripping + /l/ links](https://github.com/jonoo407/photo-scout/pull/7)
   4. [#4 Privacy, terms, support pages](https://github.com/jonoo407/photo-scout/pull/4)
   5. [#3 iOS push fix](https://github.com/jonoo407/photo-scout/pull/3)
   6. [#8 Guest browsing](https://github.com/jonoo407/photo-scout/pull/8). Signed-out visitors can browse everything, and sign-in is asked for only when they save, turn on alerts, upload, rate or vote, or create a client shortlist. Its CI adds a signed-out (guest) e2e gate. After it deploys, a private window on shootvantage.com should open straight to Today, not a sign-in screen.
2. Under the title, check it says **"wants to merge … into `main`"**. If it names a `cursor/…` branch instead of `main`, the previous PR's branch hasn't been deleted yet. Either click **Delete branch** on the previous PR, or click **Edit** next to this PR's title, choose `main` as the base and click **Change base**.
3. If there's a **Ready for review** button, click it. Agents normally do this in step 5.
4. At the bottom, click the **▾ arrow** on the green button and choose **Create a merge commit**. The button then reads **Merge pull request**.
   - **Don't use "Squash and merge" or "Rebase and merge".** I simulated it: squashing #6 makes every later PR conflict. If you slip, say so in chat and an agent will repair the remaining branches.
   - GitHub remembers your choice, so you only need to pick it once.
5. Click **Merge pull request**, then **Confirm merge**.
6. If you skipped step 4, click **Delete branch**.
7. Wait for the deploy to finish before merging the next PR. On <https://github.com/jonoo407/photo-scout>, the latest commit shows a yellow dot while Cloudflare builds and a green ✓ when **Workers Builds: vantage** has deployed. This usually takes a few minutes. **(unverified)** I didn't check whether Cloudflare runs overlapping builds in order, which is why I suggest waiting.

If something looks wrong at any point, stop merging and tell an agent. With the Cloudflare token it can roll the Worker back (`wrangler rollback`); without it, open the merged PR, click **Revert**, and merge the revert PR.

An agent that merges goes straight on to step 7; no reply from the owner is needed.

## Step 7. Agents verify production (no action from you)

After you reply, an agent checks the following:

- `POST https://shootvantage.com/api/push/notify-owner` and `/api/push/cron` return **404**. Before #6, anyone could reach them.
- `POST /api/feedback-hook` with no secret returns **401**; a 503 would mean the Worker secret is missing. With the correct secret and an empty body it returns **400 "no message"**, which proves the secret matches without sending an email.
- `/privacy`, `/terms` and `/support` return 200 as real pages with no TODOs; `/robots.txt` and `/sitemap.xml` load.
- **Account deletion end to end on a throwaway account:** sign up, upload a photo, then delete the account. The account's folder in the photo storage bucket and the auth user must both be gone.
- It confirms the uploaded photo carried no GPS data.
- It **pushes the tag `v0.1.7`** (latest is `v0.1.6`), which builds and uploads a TestFlight build. You'll get the usual TestFlight notification.

## Step 8. Real-iPhone TestFlight check (you, about 10 minutes)

Install the new build from the TestFlight app and sign in.

1. **Alerts turn on within seconds.** Settings → *Conditions alerts* → **Turn on** → **Allow** on the iOS prompt. The button shows **Turning on…**, then **Turn off** within about 2 seconds.
   - If you see "Apple didn't register this device for notifications", Apple refused the device token. Tell an agent.
   - If you see "Couldn't reach the alert server", the server rejected the subscription. Tell an agent.
2. **An alert arrives in the background.** Lock the phone or go to the home screen, then trigger a push. The quickest trigger is a client response: open one of your client-list links (`https://shootvantage.com/l/…`) on another device and send a response, or give an agent the link and ask it to respond. A banner should appear within seconds. Tap it: the app should open.
3. **An alert arrives in the foreground.** With Vantage open on screen, trigger another response. A banner should still appear. (Before #3, alerts shown while the app was open were silently dropped.)
4. **Off stays off.** Tap **Turn off**, swipe the app closed, reopen it. It should still say **Turn on**.
5. **Offline shows an error.** Turn on Airplane Mode, then tap **Turn on**. Within about 15 seconds you should see an error message, not an endless "Turning on…". Turn Airplane Mode off afterwards.
6. **While you're there:** Settings → Account shows a **Delete account** row (don't tap it on your real account). Settings → *Help & legal* → Privacy opens `shootvantage.com/privacy` in Safari.

If any step fails, reply with the step number and the message you saw. For step 1 failures, Safari's Web Inspector shows a `[push]` log line that names the failing step (Mac required).

## Step 9. App Store Connect fields (you, about 5 minutes)

**(unverified)** Field names below are from memory of App Store Connect, not re-checked today.

- **App Privacy → Privacy Policy URL:** `https://shootvantage.com/privacy`
- **App version page → Support URL:** `https://shootvantage.com/support`. Optionally, set the Marketing URL to `https://shootvantage.com`.
- **App version page → App Review Information → Contact information:**
  - First name `Jon`, last name `Flaherty`
  - Phone: your own number, kept out of this repo — type it directly into App Store Connect
  - Email: the address you want Apple to use
- **App Review Information → Sign-in required:** with #8 merged, the app no longer requires sign-in. Reviewers can browse spots, the map, light tools, plans and shared links as a guest. An account is asked for only for saving, alerts, uploads, rating and voting, and client shortlists. Still give Apple a demo account so they can review those signed-in features, plus Settings → Account → **Delete account** (guideline 5.1.1(v)). Ask an agent: "create an App Review demo account". It will create one and give you the username and password to paste here. In **Notes**, say something like: "No account is needed to browse. Sign in with the demo account to try saving, alerts, uploads, voting and account deletion." **(unverified)** Whether this is a checkbox or just the username and password fields; either way, supply the demo account.

## Other things to know

- **Emailed deletion requests.** For people who can't sign in, delete their account through the `delete-account` function (an agent can do this), **not** the Supabase dashboard. A dashboard delete still runs the old prune trigger, which keeps their highly rated photos. This note used to be a hidden comment in the privacy page.
- **After an account is deleted** (with #8), the person stays in the app, signed out, and lands on Today, which shows "Your account and everything in it have been deleted." Useful to know for step 7's end-to-end deletion check.
- The legal pages are a good-faith draft, not legal advice.

---

## Fallback: doing it yourself without giving agents tokens

Use this only if you'd rather not add the tokens in steps 1–3. It replaces step 5; steps 6–9 stay the same.

**A. Check the secret exists (Supabase).**
1. <https://supabase.com/dashboard/project/gxxjxfwxufqqxcyrdibh> → **SQL Editor** → **New query**.
2. Run:

   ```sql
   select key, length(value) from internal.config where key = 'worker_hook_secret';
   ```

   Expect one row with a length greater than 0. If you get no rows, go to step C first.

**B. Make the Worker secret match (Cloudflare).**
1. In the SQL Editor, run `select value from internal.config where key = 'worker_hook_secret';` and copy the value. Don't paste it anywhere else.
2. Cloudflare dashboard → **Workers & Pages** → **vantage** → **Settings** → **Variables and Secrets** → **Add**.
3. Type **Secret**, name `SUPABASE_HOOK_SECRET`, paste the value, then **Deploy**. If the secret already exists, use **Edit** instead.

   Use *Secret*, not *Text*. HANDOFF notes that plaintext dashboard variables are wiped by the next git deploy; secrets are kept.

**C. If the database secret was missing.**
1. Generate a random value, for example `openssl rand -hex 32`.
2. In the SQL Editor, run:

   ```sql
   insert into internal.config (key, value) values ('worker_hook_secret', '<value>')
   on conflict (key) do update set value = excluded.value;
   ```

3. Do step B with the same value.

**D. Apply the migration.**
1. Open <https://github.com/jonoo407/photo-scout/blob/cursor/worker-security-hardening-619f/supabase/migrations/20260924000000_webhook_shared_secret.sql>, click **Raw**, and copy everything.
2. Paste it into a new SQL Editor query and click **Run**. Expect "Success. No rows returned".
   - "internal.config.worker_hook_secret is not set" means you need step C first.
   - Any other error: the migration changes nothing (it aborts as a whole). Send the error to an agent.
3. Verify with:

   ```sql
   select proname, position('worker_hook_headers' in pg_get_functiondef(oid)) > 0 as patched
   from pg_proc where proname in ('notify_shortlist_response','feedback_notify','photo_report_notify');
   ```

   Expect three rows, all `true`.

**E. Cascade check.** Run:

```sql
select conrelid::regclass as tbl, conname, confdeltype
from pg_constraint where contype = 'f' and confrelid = 'auth.users'::regclass order by 1;
```

Every `confdeltype` should be `c` or `n`. If any is `a` or `r`, send the list to an agent before merging #5.

**F. Deploy the function** from your computer (needs Node):

```bash
git fetch origin && git checkout cursor/account-deletion-2cac
npx supabase login
npx supabase functions deploy delete-account --project-ref gxxjxfwxufqqxcyrdibh --use-api
```

Expect a line saying `delete-account` was deployed. Then check the dashboard's **Edge Functions** page lists `delete-account`.

**(unverified)** The repo has no `supabase/config.toml`, and I haven't run this command against the live project. If the CLI complains about a missing config, run `npx supabase init` in the repo first, and don't commit the generated files.

JWT verification stays on. Supabase's current docs say the platform check accepts the project's ES256 tokens. If the throwaway-account test gets a 401 "Invalid JWT" from the function, redeploy with `--no-verify-jwt`. That is safe, because the function verifies the caller itself with `getUser()`.

**G. Mark each PR "Ready for review"** on its page (or ask an agent), then continue with step 6.
