# Career LaunchPAD Widget — Content Brief

**Captured:** 2026-05-14
**Source:** STUB CONTENT — see deviation note below.

> ⚠️ **STUB CONTENT — NOT FOR HANDOFF**
>
> Damian directed the executing agent to use stub content during the structural build of this widget. Every value below (URLs, labels, alt text, thumbnail JPGs) is a placeholder. Before this widget bundle ships to Wilston:
>
> 1. Replace the two BASE URLs with the real Career LaunchPAD video deep-links.
> 2. Replace the labels and alt-text titles with the real copy.
> 3. Re-run the Node URLSearchParams script (Step 2a in `docs/superpowers/plans/2026-05-14-career-launchpad-widget.md`) to recompute the three final hrefs with the real bases.
> 4. Re-run the HTML escape step.
> 5. Replace `assets/thumb-1.jpg` and `assets/thumb-2.jpg` with the real 1280×720 JPGs.
> 6. Re-generate the QR PNG in Task 8 if any of the URL values change (the QR base is `https://career-launchpad-woad.vercel.app/` with the qr-handoff UTMs, so it only needs regen if the UTM scheme changes).
> 7. Update `Captured:` to the swap date and `Source:` to `direct from Damian`.
>
> The screenshots in `preview/` will need to be re-captured after the swap.

## URLs

### Base URLs (as Damian provided)

- Card 1 base: https://career-launchpad-woad.vercel.app/
- Card 2 base: https://career-launchpad-woad.vercel.app/
- QR base:   https://career-launchpad-woad.vercel.app/

### UTM parameters

`utm_source=myblueprint`, `utm_medium=widget`, `utm_campaign=career-launchpad-v1`, `utm_content=<slot>` where `<slot>` is `card-1`, `card-2`, `qr-handoff`, or `view-more`.

### Final hrefs (computed via URLSearchParams in Step 2a, with `&` → `&amp;` for HTML)

- Card 1 final href: https://career-launchpad-woad.vercel.app/?utm_source=myblueprint&amp;utm_medium=widget&amp;utm_campaign=career-launchpad-v1&amp;utm_content=card-1
- Card 2 final href: https://career-launchpad-woad.vercel.app/?utm_source=myblueprint&amp;utm_medium=widget&amp;utm_campaign=career-launchpad-v1&amp;utm_content=card-2
- QR final encoded URL: https://career-launchpad-woad.vercel.app/?utm_source=myblueprint&amp;utm_medium=widget&amp;utm_campaign=career-launchpad-v1&amp;utm_content=qr-handoff
- View-more final href: https://career-launchpad-woad.vercel.app/?utm_source=myblueprint&amp;utm_medium=widget&amp;utm_campaign=career-launchpad-v1&amp;utm_content=view-more
- **QR plain URL for encoding** (used by the qrcode CLI in Task 8 — must stay unencoded with literal `&`, the QR encoder does not understand HTML entities): https://career-launchpad-woad.vercel.app/?utm_source=myblueprint&utm_medium=widget&utm_campaign=career-launchpad-v1&utm_content=qr-handoff

Both forms are kept. The HTML uses `&amp;` form; the QR PNG encodes the literal `&` form.

## Thumbnails

- Card 1 image: `assets/thumb-1.jpg` (Unsplash placeholder — career-themed image, real myBlueprint thumbnail TBD)
- Card 2 image: `assets/thumb-2.jpg` (Unsplash placeholder — career-themed image, real myBlueprint thumbnail TBD)
- CDN pattern (per Wilston): TBD, using relative path for preview

## Copy

- Section heading: Career LaunchPAD
- Tagline: Watch real Canadians, real careers, real next steps.
- Card 1 label: Day in the Life: Stub
- Card 1 alt text title (the value Task 3 substitutes into `alt="Watch: <title>"`): Stub Career LaunchPAD video — card 1
- Card 2 label: On the Job: Stub
- Card 2 alt text title (the value Task 3 substitutes into `alt="Watch: <title>"`): Stub Career LaunchPAD video — card 2
- Card 3 label: Take it to your phone
- Card 3 alt text (HTML form, with &amp;): QR code linking to Career LaunchPAD. URL: https://career-launchpad-woad.vercel.app/?utm_source=myblueprint&amp;utm_medium=widget&amp;utm_campaign=career-launchpad-v1&amp;utm_content=qr-handoff — scan or open on your phone to continue.
