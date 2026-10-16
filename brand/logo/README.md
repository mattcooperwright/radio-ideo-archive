# Radio IDEO logo assets

Source logo files for building the Radio IDEO visual system. Use these files
directly rather than redrawing the mark.

## The mark

The logo is the word **Radio** set in FH Oscar (see `../typography.md`) and
drawn as outlines, followed by four
glyphs that spell IDEO as transport-control shapes:

| Letter | Glyph            |
| ------ | ---------------- |
| I      | vertical bar     |
| D      | play triangle    |
| E      | stop square      |
| O      | record circle    |

All four glyphs have small rounded corners (2px at the 430×92 wordmark size).
Keep their proportions and spacing exactly as drawn.

## Colours sampled from the supplied files

| Name  | Hex       | Where it appears                          |
| ----- | --------- | ----------------------------------------- |
| Black | `#000000` | Primary mark, knockout panel              |
| White | `#FFFFFF` | Mark on dark backgrounds                  |
| Lime  | `#D9FF00` | Background of the stacked lime lockup     |
| Grey  | `#D9D9D9` | Muted / disabled wordmark                 |

## Files

### SVG (preferred for web and anything scalable)

| File | Size | Description |
| ---- | ---- | ----------- |
| `svg/radio-ideo-wordmark-white.svg` | 430×92 | Horizontal wordmark, white fill, transparent background. Use on dark backgrounds. |
| `svg/radio-ideo-wordmark-black.svg` | 430×92 | Same wordmark with black fill. Derived from the white file by changing the fill colour only. |
| `svg/radio-ideo-knockout-black.svg` | 511×321 | Black rectangular panel with the wordmark cut out as transparent. Whatever sits behind shows through the letters. |
| `svg/radio-ideo-knockout-white.svg` | 511×321 | White panel with the wordmark cut out. On a white page it looks blank, so place it over colour, imagery or video. |

The single-colour wordmark SVGs use plain `fill` attributes, so the colour can
be changed with `fill="currentColor"` or a find-and-replace when a different
tint is needed (for example the grey `#D9D9D9`).

### PNG (raster references and quick use)

| File | Size | Description |
| ---- | ---- | ----------- |
| `png/radio-ideo-wordmark-black.png` | 430×92 | Black wordmark, transparent background. |
| `png/radio-ideo-wordmark-grey.png` | 430×92 | Grey `#D9D9D9` wordmark, transparent background. |
| `png/radio-ideo-knockout-black.png` | 1022×642 | Raster of the black knockout panel (2× the SVG). |
| `png/radio-ideo-knockout-white.png` | 1022×642 | Raster of the white knockout panel (2× the SVG). |
| `png/radio-ideo-stacked-lime.png` | 568×568 | Square lockup: "Radio" on the first line, the four glyphs below, black on lime `#D9FF00`. Suits avatars, podcast cover art and social tiles. No SVG of this version was supplied. |

## Notes for building the system

- The stacked square lockup exists only as a PNG. If a vector version is
  needed, rebuild it from `svg/radio-ideo-wordmark-black.svg` by moving the
  glyph group under the "Radio" text group, and check it against the PNG.
- In the knockout SVGs the cut-out comes from the path's winding direction
  (no `fill-rule` is set). Don't change the path or add `fill-rule` without
  checking the result renders with transparent letters.
