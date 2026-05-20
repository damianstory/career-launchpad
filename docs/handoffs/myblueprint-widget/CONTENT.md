# Career LaunchPAD Widget — Content Brief

**Captured:** 2026-05-20
**Source:** direct from Damian.

This is the handoff-ready source of truth for the widget bundle. Card 1 uses
`assets/thumb-1.png` from `EmergingCareers.png`; card 2 uses `assets/thumb-2.png`
from `Day in the Life Trades.png`.

## URLs

### Base URLs (as Damian provided)

- Card 1 base: https://launchpad.myblueprint.ca/
- Card 2 base: https://launchpad.myblueprint.ca/
- QR base:   https://launchpad.myblueprint.ca/

### UTM parameters

`utm_source=myblueprint`, `utm_medium=widget`, `utm_campaign=career-launchpad-v1`, `utm_content=<slot>` where `<slot>` is `card-1`, `card-2`, `qr-handoff`, or `view-more`.

### Final hrefs (computed via URLSearchParams in Step 2a, with `&` → `&amp;` for HTML)

- Card 1 final href: https://launchpad.myblueprint.ca/?utm_source=myblueprint&amp;utm_medium=widget&amp;utm_campaign=career-launchpad-v1&amp;utm_content=card-1
- Card 2 final href: https://launchpad.myblueprint.ca/?utm_source=myblueprint&amp;utm_medium=widget&amp;utm_campaign=career-launchpad-v1&amp;utm_content=card-2
- QR final encoded URL: https://launchpad.myblueprint.ca/?utm_source=myblueprint&amp;utm_medium=widget&amp;utm_campaign=career-launchpad-v1&amp;utm_content=qr-handoff
- View-more final href: https://launchpad.myblueprint.ca/?utm_source=myblueprint&amp;utm_medium=widget&amp;utm_campaign=career-launchpad-v1&amp;utm_content=view-more
- **QR plain URL for encoding** (used by the qrcode CLI in Task 8 — must stay unencoded with literal `&`, the QR encoder does not understand HTML entities): https://launchpad.myblueprint.ca/?utm_source=myblueprint&utm_medium=widget&utm_campaign=career-launchpad-v1&utm_content=qr-handoff

Both forms are kept. The HTML uses `&amp;` form; the QR PNG encodes the literal `&` form.

## Thumbnails

- Card 1 image: `assets/thumb-1.png` (from `EmergingCareers.png`)
- Card 2 image: `assets/thumb-2.png` (from `Day in the Life Trades.png`)
- CDN pattern (per Wilston): TBD, using relative path for preview

## Copy

- Section heading: Career LaunchPAD
- Tagline: Watch real Canadians, real careers, real next steps.
- Card 1 label: Watch: Emerging Careers
- Card 1 alt text: Explore emerging careers — students working with robotics and lab equipment
- Card 2 label: Watch: Day in the Life
- Card 2 alt text: Explore a day in the life — apprentices in a carpentry workshop using power tools
- Card 3 label: Take it to your phone
- Card 3 alt text (HTML form, with &amp;): QR code linking to Career LaunchPAD. URL: https://launchpad.myblueprint.ca/?utm_source=myblueprint&amp;utm_medium=widget&amp;utm_campaign=career-launchpad-v1&amp;utm_content=qr-handoff — scan or open on your phone to continue.
