# Radio IDEO archive

A small site where anyone with an `@ideo.com` Google account can sign in, and guests can sign up for themselves, and listen back to old Radio IDEO shows. Shows are read straight from the **Radio IDEO** folder in Google Drive, so publishing a new episode means dropping the file into this year's archive folder. It appears on the site within ten minutes.

**Live site:** https://radio-ideo-archive--radio-ideo-archive.europe-west4.hosted.app

## How it works

- **Sign-in**: Google sign-in through Firebase Authentication, or for guests an email and password they create on the sign-in page. Guests are not vetted: anyone who signs up gets a session. The server only trusts an `@ideo.com` address (and anything in `ADMIN_EMAILS`) if Google has verified it, so nobody can sign up with a password as an IDEO person or an admin (see `lib/access.ts`). Sessions last 14 days in an httpOnly cookie.
- **Guests**: admins (`ADMIN_EMAILS`) see everyone who has signed up at `/guests` and can delete accounts there. Deleting an account ends its session straight away, but the person can sign up again with the same address, so for repeat offenders use Disable in the Firebase console instead.
- **Shows**: the server reads the Radio IDEO folder with a service account that has view access. Only sub-folders named like `2026 Archive`, `2023 Shows`, `Past Shows` or `09 DJ Internet Mixes` are published (see `FOLDER_ALLOWLIST` in `lib/config.ts`). Other folders, such as `Super Secret`, are never listed and can't be streamed. Only audio files are shown, so video shows need an audio copy alongside them: `scripts/extract-audio.sh` makes those in Google Cloud Shell.
- **Playback**: audio is streamed through `/api/stream/<id>` with range support, so seeking is instant and the Drive files stay private. The player bar sits at the bottom and keeps playing while you browse. It remembers where you got to in each show.
- **Names**: files named the way the recorder names them (`ShuffleMode - 2026-07-22 21-39-41.m4a`) become a show in the *ShuffleMode* series dated 22 Jul 2026. Anything else keeps its filename as the title. Show notes come from the file's Description in Drive. See `content/README.md` for renaming, hiding or adding cover art.
- **Tracklists**: when a show page opens, the site looks for a public Serato playlist named after the show's date, `serato.com/playlists/id:12790432/DD-MM-YYYY`, and lists its tracks. Lookups are cached for 30 minutes, so a playlist made public after the show appears within half an hour. Serato lists each track as time since the DJ session started, plus a clock stamp now and then ("9:03pm"); from those the site works out when the session began, so each track shows how far into the recording it starts and clicking it jumps there. When two shows share a date, each track goes to the show that had most recently started. Shows without a public playlist simply have no tracklist. The profile is `SERATO_PROFILE` in `lib/config.ts`.
- **Link previews**: pasting the site into Slack or similar shows a lime Radio IDEO card (`public/brand/og.png`, 1200×630, built from the stacked logo). The pages themselves are behind sign-in, so every link unfurls with this card. `SITE_URL` in `lib/config.ts` (or `NEXT_PUBLIC_SITE_URL`) must match the live address, because the preview image needs an absolute URL.
- **Play tracking**: once someone has listened to 30 seconds of a show (real listening, not seeking), the player reports a play to `/api/plays`, which saves who and what to the `plays` collection in Firestore. Only people listed in `ADMIN_EMAILS` (default `mcooper@ideo.com`) can see the totals, at `/stats`, which shows plays, distinct listeners and last played for each show. Everyone else gets a 404 there. Plays store the listener's email, so tell people if you share the numbers. Failures to save are logged and never interrupt playback.

## Branding

The brand lives in `brand/` (logo files, colours, typography notes). The site uses black, white, lime `#D9FF00` and grey `#D9D9D9`, set as tokens at the top of `app/globals.css`, and the player controls are drawn from the logo's own glyphs. `public/brand/README.md` explains which files are served.

Type is FH Oscar, loaded from cdnfonts as described in `brand/typography.md`, with Manrope as the fallback. That package is published as a test release. If IDEO has licensed FH Oscar web fonts, put the files in `public/brand/fonts/`, add an `@font-face` for `'FH Oscar Test'` in `app/globals.css` and drop the cdnfonts `<link>` from `app/layout.tsx`.

## Local development

```bash
npm install
npm run dev:mock     # fake Drive data and a fake ideo.com login, no Google setup needed
npm test             # unit tests for filename parsing, the domain check and range handling
```

To run against the real Drive folder, copy `.env.example` to `.env.local`, fill it in, and use `npm run dev`.

## One-time setup

1. **Firebase project.** At [console.firebase.google.com](https://console.firebase.google.com), create a project (ideally under IDEO's Google Cloud organisation). App Hosting needs the Blaze plan; traffic this size should sit inside the free allowance.
2. **Sign-in.** Authentication → Sign-in method → enable **Google**, and enable **Email/Password** (leave Email link off). This is how guests sign up. Under Settings → Authorized domains, add the App Hosting domain once you have it (step 5).
3. **Web app config.** Project settings → Your apps → add a Web app. Copy `apiKey`, `authDomain`, `projectId` and `appId` into `apphosting.yaml`.
4. **Drive API.** In the Google Cloud console for the same project, enable the **Google Drive API**.
5. **App Hosting.** Firebase console → App Hosting → Create backend → connect `mattcooperwright/radio-ideo-archive`, branch `main`. It builds and deploys on every push.
6. **Share the folder.** App Hosting runs as a service account, normally `firebase-app-hosting-compute@<project-id>.iam.gserviceaccount.com` (shown under Cloud console → IAM). Share the **Radio IDEO** Drive folder with that address as **Viewer**. If IDEO's Workspace blocks sharing outside the domain, ask IT to allow this one service account, or move the shows to a shared drive and add it there.
7. **Play tracking (Firestore).** Firebase console → Firestore Database → Create database (Native mode, ideally `europe-west4` to sit beside the app). Then in Google Cloud → IAM, give the App Hosting service account from step 6 the **Cloud Datastore User** role. Until this is done the site works as normal and `/stats` says it can't read plays. No security rules are needed because the browser never talks to Firestore: all reads and writes go through the server.
8. **OAuth consent screen.** With guests, set the user type to **External** (Google Cloud → OAuth consent screen). **Internal** makes Google refuse every non-IDEO account, which blocks guests who use Google. Under Authentication → Settings → User actions, leave **Email enumeration protection** on.

## Project layout

```
app/(site)/          signed-in pages: home, /shows/[id], /series/[slug]
app/login/           sign-in page
app/(site)/guests/   admin page for deleting guest accounts
app/api/session/     swaps a Firebase ID token for a session cookie
app/api/stream/[id]/ authenticated, range-aware audio proxy to Drive
components/          player, cards, filters
lib/                 Drive listing, filename parsing, auth helpers
content/             series names, cover art mapping, per-show overrides
public/brand/        logos and artwork
```
