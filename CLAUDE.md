# Working in this repo

## Owner preferences

- **Agents do all PR merges.** When a PR is green and its prerequisites (migrations, secrets, function deploys) are done, merge it yourself, wait for the Cloudflare `Workers Builds: vantage` deploy, and check production. Don't hand the owner a list of PRs to merge. Stacked PRs use merge commits (never squash), and each next PR is retargeted to `main` before its merge.
- The owner wants to do as little as possible. Ask only for what needs their hands, credentials or judgment, in one consolidated numbered list with exact steps.
- Never write the owner's phone number into the repo.

## Where things are

- Current launch state and next steps: `docs/launch/HANDOFF.md`. Owner-only steps: `docs/launch/owner-actions.md`.
- Project history and architecture notes: `HANDOFF.md` at the repo root.
- Checks before pushing: `npm run build` (runs `tsc -b`), `npm test`; e2e gates are `npm run test:webview` and `npm run test:a11y`.
- Keep `package.json`'s `version` equal to the latest `v*` release tag. Settings shows it in the app, and a manual `ios-release.yml` run builds with it.
