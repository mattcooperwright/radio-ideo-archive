# Brand assets

Drop the Radio IDEO graphics here and commit. Replacing a file with the same name is all it takes.

| File | Used for | Notes |
| --- | --- | --- |
| `logo.svg` | Header, login page, favicon | SVG preferred. Wide format, roughly 5:1. A PNG works too; update the `src` in `app/(site)/layout.tsx` and `app/login/page.tsx`. |
| `default-cover.svg` | Cover art for any show without series art | Square. If you use a PNG/JPG, update `DEFAULT_COVER` in `lib/catalogue.ts`. |
| `series/<slug>.jpg` | Per-series cover art | Square, at least 600×600. Point to it from `content/series.json`. |

Colours and fonts live as tokens at the top of `app/globals.css` (`--color-accent`, `--color-bg`, `--font-display`, …). For a custom font, put the files in `public/brand/fonts/` and add an `@font-face` rule there.

The current files are placeholders.
