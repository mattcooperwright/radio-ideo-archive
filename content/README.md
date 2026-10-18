# Content you can edit

These files tweak what the site shows without touching code. Commit a change and App Hosting redeploys.

## series.json

Keyed by series slug: the series name lowercased with spaces and punctuation removed (`In the Zone` → `inthezone`).

```json
"shufflemode": {
  "name": "ShuffleMode",
  "blurb": "One line shown on the series page.",
  "cover": "/brand/series/shufflemode.jpg",
  "colour": "lime"
}
```

`cover` points at a file under `public/`. Leave it empty to use a generated cover: the series name over the IDEO glyphs, in the series' `colour` (`lime`, `white`, `grey` or `black`). Each show takes its own shade within that colour. `neon` gives every show a different pairing of two neons (lime, pink, blue, yellow, orange, green, violet) and a layout, so no two covers match until a series passes 168 shows. A new series with no entry gets a colour picked from its name.

## overrides.json

Keyed by Google Drive file ID (the long string in the file's share URL), or by the filename without its extension. A filename key works before the file exists, which is how the audio copies of the video shows are set up. Every field is optional; `file` is only a reminder of which file an ID belongs to.

```json
"1yAH2u9IkH029rSGCfhpA51vTJwS7Jzcv": {
  "title": "ShuffleMode: summer special",
  "series": "ShuffleMode",
  "date": "2026-07-22",
  "description": "Notes here win over the Drive description.",
  "hidden": true,
  "serato": "https://serato.com/playlists/id:12790432/09-06-2026"
}
```

A `date` without a time (`"2022-10-14"`) puts the show in the right place but doesn't look up a Serato tracklist, because track times can't be lined up without knowing when the show started. Add a time (`"2022-10-14T21:00:00Z"`) or a `serato` link to get one.

`serato` points a show at a specific Serato playlist when the date doesn't match on its own (older shows, or a set that ran past midnight). Set it to `false` to hide a tracklist.

The simplest place for show notes is the file's **Description** in Google Drive (right-click → File information → Details). The site picks it up within ten minutes.

## Hall of Fame

The best shows, from any series, are listed in a Hall of Fame section on the home page and get a star on their cards and show pages.

To add a show, find it in Drive, right-click → Organise → **Add shortcut**, and choose the **Hall of Fame** folder inside Radio IDEO. To take it out, delete the shortcut. Don't move the show itself into the folder: the site only publishes shows from the archive folders, so a moved file would disappear from the site. The newest shortcut is listed first, and changes show up within ten minutes.
