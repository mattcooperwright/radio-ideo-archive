import 'server-only';
import { GoogleAuth } from 'google-auth-library';
import { unstable_cache } from 'next/cache';
import { buildCatalogue, type DriveFile, type HallEntry, type Overrides, type SeriesConfig } from './catalogue';
import { CATALOGUE_TTL_SECONDS, FOLDER_ALLOWLIST, HALL_OF_FAME_FOLDER, MOCK_DRIVE, ROOT_FOLDER_ID } from './config';
import { mockFiles, mockHall } from './fixtures';
import seriesConfig from '@/content/series.json';
import overrides from '@/content/overrides.json';
import type { Catalogue } from './types';

const API = 'https://www.googleapis.com/drive/v3';
const FOLDER_MIME = 'application/vnd.google-apps.folder';
const SHORTCUT_MIME = 'application/vnd.google-apps.shortcut';

// On App Hosting this picks up the backend's service account. Locally, point
// GOOGLE_APPLICATION_CREDENTIALS at a key for a service account the folder is shared with.
const auth = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/drive.readonly'] });

export async function driveFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const client = await auth.getClient();
  const { token } = await client.getAccessToken();
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${token}`);
  return fetch(`${API}/${path}`, { ...init, headers, cache: 'no-store' });
}

const FILE_FIELDS = 'id, name, mimeType, size, createdTime, description';

async function listChildren<T = DriveFile>(folderId: string, extraQuery: string, fields = FILE_FIELDS): Promise<T[]> {
  const out: T[] = [];
  let pageToken = '';
  do {
    const params = new URLSearchParams({
      q: `'${folderId}' in parents and trashed = false and (${extraQuery})`,
      fields: `nextPageToken, files(${fields})`,
      pageSize: '1000',
      supportsAllDrives: 'true',
      includeItemsFromAllDrives: 'true',
    });
    if (pageToken) params.set('pageToken', pageToken);
    const res = await driveFetch(`files?${params}`);
    if (!res.ok) throw new Error(`Drive list failed (${res.status}): ${await res.text()}`);
    const body = (await res.json()) as { files: T[]; nextPageToken?: string };
    out.push(...body.files);
    pageToken = body.nextPageToken ?? '';
  } while (pageToken);
  return out;
}

type Shortcut = { createdTime: string; shortcutDetails?: { targetId?: string } };

/**
 * Shortcuts in the Hall of Fame folder say which shows are in it. The folder is not a source of shows:
 * a shortcut only counts when it points at a show the archive folders already publish.
 */
async function fetchHall(folders: DriveFile[]): Promise<HallEntry[]> {
  const hall = folders.find((f) => HALL_OF_FAME_FOLDER.test(f.name));
  if (!hall) return [];
  const shortcuts = await listChildren<Shortcut>(hall.id, `mimeType = '${SHORTCUT_MIME}'`, 'createdTime, shortcutDetails(targetId)');
  return shortcuts.flatMap((s) => (s.shortcutDetails?.targetId ? [{ targetId: s.shortcutDetails.targetId, addedTime: s.createdTime }] : []));
}

async function fetchDrive(): Promise<{ files: DriveFile[]; hall: HallEntry[] }> {
  if (MOCK_DRIVE) return { files: mockFiles, hall: mockHall };
  if (!ROOT_FOLDER_ID) throw new Error('ROOT_FOLDER_ID is not set');

  const all = await listChildren(ROOT_FOLDER_ID, `mimeType = '${FOLDER_MIME}'`);
  const folders = all.filter((f) => FOLDER_ALLOWLIST.some((re) => re.test(f.name)));
  const [perFolder, hall] = await Promise.all([
    Promise.all(folders.map((f) => listChildren(f.id, `mimeType contains 'audio/'`))),
    fetchHall(all),
  ]);
  return { files: perFolder.flat(), hall };
}

export const getCatalogue: () => Promise<Catalogue> = unstable_cache(
  async () => {
    const { files, hall } = await fetchDrive();
    return buildCatalogue(files, seriesConfig as SeriesConfig, overrides as Overrides, hall);
  },
  ['catalogue-v7'],
  { revalidate: CATALOGUE_TTL_SECONDS },
);

export async function getShow(id: string) {
  const { shows } = await getCatalogue();
  return shows.find((s) => s.id === id) ?? null;
}
