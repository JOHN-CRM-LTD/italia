# Italia

Static Italia Lume restaurant demo at https://italia.johncrm.com/.
The supplied design's restaurant details, menu and prices are demo content.
The page retains `noindex, follow` and has no booking form or booking backend.

## Files

- `index.html`: hero, regions ribbon, room, menu, wine list, and a footer
  holding the address, phone, email and hours.
- `css/style.css`: responsive candlelit design, local font declarations and
  all motion (arrival states sit under `html.js` and
  `prefers-reduced-motion: no-preference`, so the page is fully visible
  without JavaScript or with reduced motion).
- `js/main.js`: header and mobile menu, hero intro, scroll reveals, parallax,
  the menu plate crossfade and the pointer candlelight. No dependencies.
- `images/` and `fonts/`: design assets, served locally. The photographs
  (`tavola`, `mani`, `tagliolini`, `cantina`) are JPEGs resized from the
  supplied PNG originals; the plates are cut-out WebP files.

The "Visit us" buttons link out to https://www.johncrm.com/.

## Local preview

From this directory, run:

```sh
python -m http.server 4999 --bind 127.0.0.1
```

Open http://127.0.0.1:4999/. No package installation or build is required.

## Publishing

GitHub Pages publishes the root of `main` in `JOHN-CRM-LTD/italia`.
Review changes, stage the intended paths, commit and push `main`.
Keep `.nojekyll` to serve the static files unchanged, and keep the root `CNAME`
containing `italia.johncrm.com`. HTTPS is enforced in the Pages settings.
No custom Actions workflow or DNS change is needed for website updates.

Before publishing, check JavaScript syntax with `node --check js/main.js`,
verify local assets and anchors, and preview desktop, tablet and mobile layouts.
Check keyboard navigation, the mobile menu, reduced motion and the Visit us links.

## Deferred JohnCRM integration

The Italia Demo workspace and External Chat widget have not been configured
as part of this website release because JohnCRM is unavailable. This site
contains no chat loader, site key, simulated chat or CRM credentials.

When CRM setup resumes, create or identify the correct Italia Demo workspace,
enable External Chat, and use that workspace's real public embed snippet.
Leave automatic AI replies off and the knowledge base empty unless the owner
requests otherwise. Verify the integration before describing chat as available.
