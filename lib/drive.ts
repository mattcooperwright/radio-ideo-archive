import 'server-only';
import { GoogleAuth } from 'google-auth-library';
import { unstable_cache } from 'next/cache';
import { buildCatalogue, type DriveFile, type Overrides, type SeriesConfig } from './catalogue';
import { CATALOGUE_TTL_SECONDS, FOLDER_ALLOWLIST, MOCK_DRIVE, ROOT_FOLDER_ID } from './config';
import { mockFiles } from './fixtures';
import seriesConfig from '@/content/series.json';
import overrides from '@/content/overrides.json';
import type { Catalogue } from './types';

const API = 'https://www.googleapis.com/drive/v3';
const FOLDER_MIME = 'application/vnd.google-apps.folder';

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

async function listChildren(folderId: string, extraQuery: string): Promise<DriveFile[]> {
  const out: DriveFile[] = [];
  let pageToken = '';
  do {
    const params = new URLSearchParams({
      q: `'${folderId}' in parents and trashed = false and (${extraQuery})`,
      fields: 'nextPageToken, files(id, name, mimeType, size, createdTime, description)',
      pageSize: '1000',
      supportsAllDrives: 'true',
      includeItemsFromAllDrives: 'true',
    });
    if (pageToken) params.set('pageToken', pageToken);
    const res = await driveFetch(`files?${params}`);
    if (!res.ok) throw new Error(`Drive list failed (${res.status}): ${await res.text()}`);
    const body = (await res.json()) as { files: DriveFile[]; nextPageToken?: string };
    out.push(...body.files);
    pageToken = body.nextPageToken ?? '';
  } while (pageToken);
  return out;
}

async function fetchAudioFiles(): Promise<DriveFile[]> {
  if (MOCK_DRIVE) return mockFiles;
  if (!ROOT_FOLDER_ID) throw new Error('ROOT_FOLDER_ID is not set');

  const folders = (await listChildren(ROOT_FOLDER_ID, `mimeType = '${FOLDER_MIME}'`)).filter((f) =>
    FOLDER_ALLOWLIST.some((re) => re.test(f.name)),
  );
  const perFolder = await Promise.all(folders.map((f) => listChildren(f.id, `mimeType contains 'audio/'`)));
  return perFolder.flat();
}

export const getCatalogue: () => Promise<Catalogue> = unstable_cache(
  async () => buildCatalogue(await fetchAudioFiles(), seriesConfig as SeriesConfig, overrides as Overrides),
  ['catalogue-v4'],
  { revalidate: CATALOGUE_TTL_SECONDS },
);

export async function getShow(id: string) {
  const { shows } = await getCatalogue();
  return shows.find((s) => s.id === id) ?? null;
}
