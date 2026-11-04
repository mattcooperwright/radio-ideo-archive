# Security and robustness review plan

## Scope and sizing

The archive is a small Next.js app on Firebase App Hosting. It serves private audio from a Drive folder to signed-in listeners, records plays in Firestore, and lets admins list and delete guest accounts. It holds no payments and no sensitive personal data beyond email addresses. Capped at 3 instances, it is sized for a team audience, so a full external penetration test is out of proportion.

Two things raise the risk above "internal toy". Guest sign-up is open to anyone on the internet, so every control that assumed a closed user list now has to hold against strangers. And the service account can read the whole Radio IDEO Drive folder, including folders that are meant to stay private, with only a name allowlist standing between them and the web.

The plan is a focused review of about two days, in three tiers. Tier 1 is cheap and should happen regardless. Tier 2 is targeted testing of the places where a bug would matter. Tier 3 is only worth doing if the guest audience grows or the content becomes more sensitive.

Out of scope: formal third-party pentest, WAF, DDoS protection beyond platform defaults, and review of Google's own services.

## Tier 1: baseline hygiene (half a day)

1. **Dependencies.** Run `npm audit` and check `next`, `firebase`, `firebase-admin` and `node-html-parser` against current advisories. Confirm the lockfile is committed and CI builds from it. Turn on Dependabot or Renovate for security updates only.
2. **Secrets.** Run gitleaks or the GitHub secret scanning tool over the full history, not only the working tree. Confirm no service account key was ever committed (`.gitignore` covers it now, history needs checking). The Firebase web config values are public by design and are not a finding.
3. **Security headers.** `next.config.ts` sets none. Add HSTS, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `frame-ancestors 'none'` (or `X-Frame-Options: DENY`) and a Content-Security-Policy. The CSP has to allow Firebase Auth, Google sign-in, `fonts.cdnfonts.com`, `fonts.googleapis.com` and `fonts.gstatic.com`. Start it in report-only mode, then enforce.
4. **Third-party font.** The brand font is loaded from a cdnfonts test release with no integrity check, so that host can inject CSS into every page. Decide whether to self-host the licensed files (the README already describes how) or accept the risk. Self-hosting also removes it from the CSP.
5. **Firestore rules.** There is no `firestore.rules` in the repo, so rules live only in the console. If the database was created in test mode, the public web config lets anyone read and write the `plays` collection, including listener emails. Fetch the live rules (the Firebase MCP `firebase_get_security_rules` tool or the console), confirm they deny all client access, and commit a deny-all `firestore.rules` and `storage.rules` so they cannot drift.
6. **Firebase and Google Cloud settings.** Check that the Auth API key is restricted to the app's domains and to the Identity Toolkit API. Check that Email enumeration protection is on, that the authorised domains list contains only the live host, and that the OAuth consent screen is External with only the minimum scopes. Set a budget alert on the Blaze project, since a stranger can now generate egress.
7. **Drive sharing.** The service account has Viewer on the whole Radio IDEO folder, so the name allowlist in `lib/config.ts` is the only thing between other root-level content and the site. Today the other folders hold only music, so this is optional hardening: share the service account with the published sub-folders only if sensitive material is ever added to the root. Also confirm the external Gmail address that has Reader on the root is intentional, and review who can edit the folder, because an editor can add a folder called `2026 Archive` and publish its contents.

## Tier 2: targeted testing (one day)

Run these against a local production build (`npm run build && npm start` with the Firebase emulator suite for Auth and Firestore). Do a short, light-touch pass against the live site afterwards, only for items that cannot be reproduced locally, and avoid load that would cost money or lock out real users.

**Authentication and access**

- Call every page and every `/api/*` route with no cookie, a garbage cookie, an expired cookie and a cookie for a deleted user. Expect a redirect or 401 each time, never a 500 with a stack trace. The middleware only checks that a cookie exists, so the real check in `getUser()` is what is under test.
- Confirm a password account cannot become an IDEO user or admin. Sign up with `someone@ideo.com` and with `mcooper@ideo.com` by password, with different letter case, plus-addressing and trailing dots, then try to reach `/`, `/stats` and `/guests`. Then test the pre-account hijack case: create a password account for an IDEO address, then sign in to that address with Google, and check whether the password credential survives and whether `email_verified` flips in a way that grants access.
- Confirm `AUTH_MOCK` and `DRIVE_MOCK` do nothing in a production build, since `isAdmin` returns true when mock auth is on.
- Check session behaviour. Disable a user and delete a user and confirm the 14 day cookie stops working at once (`checkRevoked`). Confirm a stale ID token older than five minutes is refused at `/api/session`. Confirm the cookie flags in the browser (`HttpOnly`, `Secure`, `SameSite=Lax`).
- Check the admin server action. Post to `deleteGuestAction` as a normal guest and as an IDEO user, with a forged `uid` for an IDEO account and for an admin. Only the admin path on a guest uid should succeed.

**Content exposure**

- Try to stream by Drive file ID for a file in `Super Secret`, a non-audio file, a trashed file and a file outside the root folder. All must be 404. Repeat with odd `id` values (slashes, `..`, encoded characters, very long strings) to check the Drive URL cannot be steered.
- Throw malformed `Range` headers at the stream route (reversed, huge, negative, multiple ranges, non-numeric). `lib/range.test.ts` covers the parser, so the focus is the Drive passthrough path, which forwards the raw header.
- Confirm no response leaks Drive error bodies, file IDs from private folders, or the service account email.

**Abuse and robustness**

- `/api/plays` accepts any number of writes from a signed-in user and each one is a Firestore document. A guest can flood it, inflate stats, and push real data out of the 5000 event window the stats page reads. Test it, then add a per-user rate limit and de-duplicate by user and show within a time window.
- Open guest sign-up allows scripted account creation and large audio downloads. Measure what one guest can pull through the stream route (full file, repeated, parallel) and what that costs in egress and instance time. Decide on a cap: per-user concurrency, a daily byte budget, or Firebase App Check with reCAPTCHA on sign-up.
- Check behaviour when dependencies fail. Make Drive return 403 and 500, make Firestore unavailable, and make Serato slow or return junk HTML. The site should degrade (no tracklist, no stats) rather than 500 the listing. Check the 8 second Serato timeout and that a hostile page cannot blow up `node-html-parser` or the setlist maths.
- Run a small load test (a few dozen concurrent listeners with range requests) to confirm that `maxInstances: 3` and `concurrency: 40` hold up and that cold starts do not break playback.

**Injection and output handling**

- Show titles, descriptions and tracklists come from Drive and Serato, which are outside the app's control. Confirm they only ever reach the page through React text nodes. A grep found no `dangerouslySetInnerHTML`, so the test is to put markup, long strings and odd Unicode in a Drive description and confirm it renders inert.
- Confirm the one external link built from data (`Tracklist` source URL) can only be a `serato.com` address, and that overrides in `content/overrides.json` cannot supply another scheme.

## Tier 3: only if risk grows

Do these if guest numbers climb into the thousands, if non-public content is added, or if the site is linked widely.

- An independent pentest of sign-in and the stream route.
- Move guest sign-up behind an approval step, a one-time invite code, or email verification before the first session.
- Structured audit logging of sign-ins, admin deletions and unusual download volume, with an alert.
- A written privacy notice for guests and a retention rule for the `plays` collection and guest accounts. The site stores listener emails, and the app sits in `europe-west4` with a London team, so UK GDPR applies.

## Deliverables

A short findings list ranked by severity and effort, a fix PR per group (headers, rules and config, rate limiting), and a note of anything accepted rather than fixed with the reason. Tests worth keeping go into `lib/*.test.ts`, particularly for `canAccess` edge cases and the stream route's id handling.

## What I need from you

Console access or an export for the Firestore rules, Auth settings, API key restrictions and Drive sharing list, since those live outside the repo. Confirmation that a light-touch pass against the live site is acceptable. A rough idea of how many guests you expect, which decides whether Tier 3 is ever needed.
