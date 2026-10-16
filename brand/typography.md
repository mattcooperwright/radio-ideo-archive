# Radio IDEO typography

## Typeface: FH Oscar

Radio IDEO uses **FH Oscar** (by Fatih Hardal, Typografische). It is also the
typeface of the "Radio" part of the logo. Always use FH Oscar for Radio IDEO
output; don't substitute another font in designs.

Use the standard FH Oscar family only. **Ignore FH Oscar Condensed** even if
the CDN stylesheet offers it.

## Loading it on the web

Add the stylesheet from the CDN to the `<head>` of every page:

```html
<link href="https://fonts.cdnfonts.com/css/fh-oscar-test" rel="stylesheet">
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

The CDN registers the family as `'FH Oscar Test'`, so use that exact name in
CSS. Don't reference any family name containing "Condensed".

In React, inject the same `<link>` into `document.head` once (for example in a
`useEffect`) before rendering text, or add it to `public/index.html`.

If FH Oscar doesn't render, treat that as a bug to fix (check the `<link>` and
the family name) rather than switching typefaces.

## The logo is not set in live type

The "Radio" wordmark in `brand/logo/` is drawn as outlines. Always place the
logo files; never retype "Radio" in FH Oscar next to drawn glyphs as a
stand-in for the logo.
