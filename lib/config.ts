/** Only Google accounts on this domain can sign in. */
export const ALLOWED_DOMAIN = 'ideo.com';

/** The public address of the site, used to turn the share image path into the absolute URL Slack needs. */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://radio-ideo-archive--radio-ideo-archive.europe-west4.hosted.app';

/** Signed-in users who can see listening stats at /stats. Comma-separated emails in ADMIN_EMAILS. */
export const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? 'mcooper@ideo.com')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

/** Seconds of actual listening before a show counts as played. Stops a mis-click or a skim counting. */
export const PLAY_THRESHOLD_SECONDS = 30;

/** The "Radio IDEO" folder in Drive. Shared (Viewer) with the app's service account. */
export const ROOT_FOLDER_ID = process.env.ROOT_FOLDER_ID ?? '';

/**
 * Sub-folders of the root that are published. Anything not matching (e.g. "Super Secret" or
 * "Mixcloud Visuals") is never listed or streamed.
 */
export const FOLDER_ALLOWLIST: RegExp[] = [/^\d{4} (Archive|Shows)$/, /^Past Shows$/, /DJ Internet Mixes$/];

/**
 * The folder of shortcuts to the best shows, from any series. It is read for its shortcuts only and
 * is deliberately not in FOLDER_ALLOWLIST, so nothing in it becomes a show of its own.
 */
export const HALL_OF_FAME_FOLDER = /^hall of fame$/i;

/** How long the Drive listing is cached. New uploads appear within this window. */
export const CATALOGUE_TTL_SECONDS = 600;

/** Matt's public Serato profile. Playlists are looked up at serato.com/playlists/<profile>/<DD-MM-YYYY>. */
export const SERATO_PROFILE = process.env.SERATO_PROFILE ?? 'id:12790432';

/** How long a Serato lookup is cached, found or not. A newly published playlist shows up within this window. */
export const SETLIST_TTL_SECONDS = 1800;

export const SESSION_COOKIE = '__session';
export const SESSION_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;

const isProd = process.env.NODE_ENV === 'production';
/** Local development only: fake sign-in as dev@ideo.com. Ignored in production builds. */
export const MOCK_AUTH = !isProd && process.env.AUTH_MOCK === '1';
/** Local development only: serve a fixture catalogue and generated audio instead of Drive. */
export const MOCK_DRIVE = !isProd && process.env.DRIVE_MOCK === '1';
