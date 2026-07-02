# Storefront source (HTML partials)

The homepage is authored as small partials and assembled at build time — do
**not** edit `public/index.html` directly (it is generated and overwritten).

## Structure

- `template.html` — the page shell (`<head>`, `<body>`, and `<!--#include NAME-->`
  markers in page order).
- `partials/*.html` — one file per section: `nav`, `marquee`, `hero`, `filters`,
  `products`, `sizeguide`, `reviews`, `story`, `delivery`, `instagram`, `footer`,
  `detail`, `cart`, `checkout`, `overlays`.

## Build

```
node build.js      # or: npm run build
```

This replaces each `<!--#include NAME-->` in `template.html` with
`partials/NAME.html` and writes `public/index.html`. Vercel runs it
automatically via the `buildCommand` in `vercel.json`.

## Editing

- Change a section → edit the matching file in `partials/`.
- Add a section → create `partials/foo.html` and add `<!--#include foo-->` to
  `template.html` where it should appear.
- Styles live in `public/css/main.css`; behaviour in `public/js/main.js`.
