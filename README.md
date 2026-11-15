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
  the menu plate crossfade, the fading gold scrollbar and the music toggle.
  No dependencies.
- `audio/theme.mp3`: background music, trimmed to 1:50 from the supplied
  file. It never autoplays; the disc button in the header starts it, and
  the script fades it out and loops it at 1:49. Seeking needs a server that
  sends `Accept-Ranges: bytes` (GitHub Pages does; `python -m http.server`
  does not, so the loop can only be fully tested on the published site or
  with a range-capable local server).
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

## JohnCRM website chat

The website uses the official JohnCRM widget from
`https://app.johncrm.com/widget/chat.js`, loaded asynchronously in `index.html`.
Its public site key belongs to the **Italia Demo** workspace
(`ORG-33YW6H3M`) in production JohnCRM. The visitor-facing chat title is Italia.
External Chat (WebChat) is enabled; automatic AI replies remain **off**.
Knowledge Base setup remains deferred.

Manage the widget under Italia Demo → Configurations → WebChat at
https://app.johncrm.com/. Staff handle visitor conversations under WebChat.
The embedded site key is public configuration, not a CRM login credential.
If it is rotated in JohnCRM, replace the snippet in `index.html` and publish
the update. Keep AI replies off unless the owner explicitly requests otherwise.
