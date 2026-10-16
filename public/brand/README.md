# Served brand files

These are copies of files in `brand/logo/`, which is the source of truth (see `brand/logo/README.md` and `brand/typography.md`). Next.js only serves files from `public/`, so the site uses these copies. If the logo changes, update `brand/logo/` and copy the new file here.

| File | Used for |
| --- | --- |
| `radio-ideo-wordmark-white.svg` | Header logo on the black page |
| `radio-ideo-wordmark-black.svg` | Spare, for light backgrounds |
| `radio-ideo-stacked-lime.png` | Login page, favicon, home-screen icon, lock-screen artwork when a show has no cover |
| `series/<slug>.jpg` | Optional per-series cover art, referenced from `content/series.json` |

Shows without cover art get a generated tile in the style of the stacked lockup: the series name in FH Oscar above the four IDEO glyphs. Each series has a colourway (`lime`, `white`, `grey` or `black`) set in `content/series.json`.
