/** Only Google accounts on this domain can sign in. */
export const ALLOWED_DOMAIN = 'ideo.com';

/** The "Radio IDEO" folder in Drive. Shared (Viewer) with the app's service account. */
export const ROOT_FOLDER_ID = process.env.ROOT_FOLDER_ID ?? '';

/**
 * Sub-folders of the root that are published. Anything not matching (e.g. "Super Secret" or
 * "Mixcloud Visuals") is never listed or streamed.
 */
export const FOLDER_ALLOWLIST: RegExp[] = [/^\d{4} (Archive|Shows)$/, /^Past Shows$/, /DJ Internet Mixes$/];

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
