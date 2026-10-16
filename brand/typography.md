# Radio IDEO typography

## Typeface: FH Oscar

Radio IDEO uses **FH Oscar** (by Fatih Hardal, Typografische). It is also the
typeface of the "Radio" part of the logo. Always use FH Oscar for Radio IDEO
output; don't substitute another font in designs.

Use the standard FH Oscar family only. **Ignore FH Oscar Condensed.** The
CDN package below is listed under the Condensed name but also contains the
standard FH Oscar faces; those are the ones to use.

Font page: https://www.cdnfonts.com/fh-oscar-condensed-test.font

## Loading it on the web

Add the stylesheet from the CDN to the `<head>` of every page:

```html
<link href="https://fonts.cdnfonts.com/css/fh-oscar-condensed-test" rel="stylesheet">
```

Then set the family. Manrope is the fallback for when FH Oscar fails to load:

```css
:root {
  --font-primary: 'FH Oscar Test', 'Manrope', sans-serif;
}

body {
  font-family: var(--font-primary);
}
```

Use the standard family name `'FH Oscar Test'` in CSS. Don't reference any
family name containing "Condensed".

The family name hasn't been checked against the stylesheet yet. The first
time you build a page, open the stylesheet URL above and confirm the
`font-family` values in its `@font-face` blocks. If the standard family is
registered under a different name, use that name and update this file.

In React, inject the same `<link>` into `document.head` once (for example in a
`useEffect`) before rendering text, or add it to `public/index.html`.

If FH Oscar doesn't render, treat that as a bug to fix (check the `<link>` and
the family name) rather than switching typefaces.

## The logo is not set in live type

The "Radio" wordmark in `brand/logo/` is drawn as outlines. Always place the
logo files; never retype "Radio" in FH Oscar next to drawn glyphs as a
stand-in for the logo.
