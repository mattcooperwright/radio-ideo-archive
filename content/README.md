# Content you can edit

These files tweak what the site shows without touching code. Commit a change and App Hosting redeploys.

## series.json

Keyed by series slug: the series name lowercased with spaces and punctuation removed (`In the Zone` → `inthezone`).

```json
"shufflemode": {
  "name": "ShuffleMode",
  "blurb": "One line shown on the series page.",
  "cover": "/brand/series/shufflemode.jpg"
}
```

`cover` points at a file under `public/`. Leave it empty to use the default cover.

## overrides.json

Keyed by Google Drive file ID (the long string in the file's share URL). Every field is optional.

```json
"1yAH2u9IkH029rSGCfhpA51vTJwS7Jzcv": {
  "title": "ShuffleMode: summer special",
  "series": "ShuffleMode",
  "date": "2026-07-22",
  "description": "Notes here win over the Drive description.",
  "hidden": true
}
```

The simplest place for show notes is the file's **Description** in Google Drive (right-click → File information → Details). The site picks it up within ten minutes.
