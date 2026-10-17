# Radio IDEO archive

A small private site where anyone with an `@ideo.com` Google account can sign in and listen back to old Radio IDEO shows. Shows are read straight from the **Radio IDEO** folder in Google Drive, so publishing a new episode means dropping the file into this year's archive folder. It appears on the site within ten minutes.

## How it works

- **Sign-in**: Google sign-in through Firebase Authentication. The server only issues a session if the account's email is verified and ends in `@ideo.com`; everyone else is turned away. Sessions last 14 days in an httpOnly cookie.
- **Shows**: the server reads the Radio IDEO folder with a service account that has view access. Only sub-folders named like `2026 Archive`, `2023 Shows`, `Past Shows` or `09 DJ Internet Mixes` are published (see `FOLDER_ALLOWLIST` in `lib/config.ts`). Other folders, such as `Super Secret`, are never listed and can't be streamed. Only audio files are shown, so video shows need an audio copy alongside them: `scripts/extract-audio.sh` makes those in Google Cloud Shell.
- **Playback**: audio is streamed through `/api/stream/<id>` with range support, so seeking is instant and the Drive files stay private. The player bar sits at the bottom and keeps playing while you browse. It remembers where you got to in each show.
- **Names**: files named the way the recorder names them (`ShuffleMode - 2026-07-22 21-39-41.m4a`) become a show in the *ShuffleMode* series dated 22 Jul 2026. Anything else keeps its filename as the title. Show notes come from the file's Description in Drive. See `content/README.md` for renaming, hiding or adding cover art.
- **Tracklists**: when a show page opens, the site looks for a public Serato playlist named after the show's date, `serato.com/playlists/id:12790432/DD-MM-YYYY`, and lists its tracks. Lookups are cached for 30 minutes, so a playlist made public after the show appears within half an hour. Serato lists each track as time since the DJ session started, plus a clock stamp now and then ("9:03pm"); from those the site works out when the session began, so each track shows how far into the recording it starts and clicking it jumps there. When two shows share a date, each track goes to the show that had most recently started. Shows without a public playlist simply have no tracklist. The profile is `SERATO_PROFILE` in `lib/config.ts`.

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
2. **Sign-in.** Authentication → Sign-in method → enable **Google**. Under Settings → Authorized domains, add the App Hosting domain once you have it (step 5).
3. **Web app config.** Project settings → Your apps → add a Web app. Copy `apiKey`, `authDomain`, `projectId` and `appId` into `apphosting.yaml`.
4. **Drive API.** In the Google Cloud console for the same project, enable the **Google Drive API**.
5. **App Hosting.** Firebase console → App Hosting → Create backend → connect `mattcooperwright/radio-ideo-archive`, branch `main`. It builds and deploys on every push.
6. **Share the folder.** App Hosting runs as a service account, normally `firebase-app-hosting-compute@<project-id>.iam.gserviceaccount.com` (shown under Cloud console → IAM). Share the **Radio IDEO** Drive folder with that address as **Viewer**. If IDEO's Workspace blocks sharing outside the domain, ask IT to allow this one service account, or move the shows to a shared drive and add it there.
7. **Optional, recommended:** in Google Cloud → OAuth consent screen, set the user type to **Internal**. Google will then refuse non-IDEO accounts before they reach the site.

## Project layout

```
app/(site)/          signed-in pages: home, /shows/[id], /series/[slug]
app/login/           sign-in page
app/api/session/     swaps a Firebase ID token for a session cookie
app/api/stream/[id]/ authenticated, range-aware audio proxy to Drive
components/          player, cards, filters
lib/                 Drive listing, filename parsing, auth helpers
content/             series names, cover art mapping, per-show overrides
public/brand/        logos and artwork
```
