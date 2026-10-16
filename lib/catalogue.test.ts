import { describe, expect, it } from 'vitest';
import { buildCatalogue, DEFAULT_COVER, type DriveFile } from './catalogue';

const files: DriveFile[] = [
  { id: 'a', name: 'ShuffleMode - 2026-07-22 21-39-41.m4a', mimeType: 'audio/x-m4a', size: '100', createdTime: '2026-07-23T08:22:30Z' },
  { id: 'b', name: 'Radio IDEO - Shuffle Mode - October 2022.mp3', mimeType: 'audio/mpeg', createdTime: '2022-10-14T22:16:27Z' },
  { id: 'c', name: 'FRIDAY SHOW - 2026-07-24 21-47-44.m4a', mimeType: 'audio/x-m4a', createdTime: '2026-07-25T08:15:16Z', description: 'Drive notes' },
];

describe('buildCatalogue', () => {
  it('groups series across naming variants and sorts newest first', () => {
    const cat = buildCatalogue(files, { shufflemode: { name: 'ShuffleMode', cover: '/brand/series/s.jpg' } }, {});
    expect(cat.shows.map((s) => s.id)).toEqual(['c', 'a', 'b']);
    expect(cat.series[0]).toMatchObject({ slug: 'shufflemode', name: 'ShuffleMode', count: 2 });
    expect(cat.shows.find((s) => s.id === 'b')).toMatchObject({ series: 'ShuffleMode', year: 2022, cover: '/brand/series/s.jpg' });
    expect(cat.shows.find((s) => s.id === 'c')).toMatchObject({ cover: DEFAULT_COVER, description: 'Drive notes', title: 'Fri, 24 Jul 2026', titleIsDate: true });
    expect(cat.years).toEqual([2026, 2022]);
  });

  it('applies overrides and hides files', () => {
    const cat = buildCatalogue(files, {}, { a: { hidden: true }, c: { title: 'Big one', date: '2026-01-01' } });
    expect(cat.shows.map((s) => s.id)).toEqual(['c', 'b']);
    expect(cat.shows[0]).toMatchObject({ title: 'Big one', date: '2026-01-01T00:00:00.000Z' });
  });
});
