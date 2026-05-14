# Career LaunchPAD Widget — Handoff to myBlueprint

Self-contained HTML/CSS/JS widget for the myBlueprint student dashboard.
Drives traffic to the public Career LaunchPAD site at https://career-launchpad-woad.vercel.app/.

**Contact:** Damian Matheson (damian.matheson@myblueprint.ca)
**Companion spec:** [../../superpowers/specs/2026-05-14-career-launchpad-widget-design.md](../../superpowers/specs/2026-05-14-career-launchpad-widget-design.md)

## What this is

A single HTML file with inline `<style>` and inline `<script>`. Three image cards
linking to external URLs that open in a new tab. v1 is intentionally static — no API,
no database, no live content pull. Images and links rotate manually.

The widget ships with real content baked in — there are no bracketed placeholders
in the file. UTM parameters are baked into every href (including the QR's encoded URL).

## Where it goes

On the myBlueprint student dashboard:
- **Desktop:** its own white section, similar to the existing "Explore Emerging Careers"
  section. Three cards in a row.
- **Mobile:** **its own white section, BELOW the dark gray task-card carousel** —
  not nested inside it. One card visible, swipe / arrow / dot navigation.

## Integration steps

1. **Extract the `<style>` block** into a LESS file or a separate CSS file imported
   into the host app. Leaving it inline will churn the stylesheet on every React
   re-render in the host's older React version.
2. **Move the JS init into `useEffect` (or `componentDidMount`)** inside the React
   component. Do NOT leave it as a top-of-render IIFE — listeners will stack
   duplicates on every re-render.
3. **All CSS classes are namespaced `.cl-*`** — safe to drop into the host's global
   LESS without collision.
4. **Every `<button>` has `type="button"`** — prevents accidental form submission
   if the widget lands inside an ancestor `<form>` in the dashboard markup.
5. **Replace the thumbnail `src` attributes** (currently relative paths
   `assets/thumb-1.jpg` and `assets/thumb-2.jpg`) with the final myBlueprint
   CDN URLs. The actual image files for swapping are committed in this directory
   under `assets/`.

## Integration knobs (CSS custom properties)

The widget exposes three CSS custom properties on `.cl-widget` so you can tune it to your host slot without editing widget internals:

| Property | Default | Purpose |
|---|---|---|
| `--cl-card-aspect` | `16 / 9` | Image aspect ratio for image cards; the QR card letterboxes to match. Set to `1 / 1` for square cards, `4 / 3` for taller, etc. |
| `--cl-max-height` | `none` | Hard cap on the widget's height. If your slot pins a height, set this and the widget clips cleanly via `overflow: hidden`. |
| `--cl-min-card-width` | `220px` | Documentation of the intended minimum card width before carousel mode kicks in. The actual breakpoint (`<600px` container width) is set in CSS. |

Example override at the host level:

```css
.activitiesWidget .cl-widget {
  --cl-card-aspect: 4 / 3;
  --cl-max-height: 360px;
}
```

The widget is a **CSS container** (`container-type: inline-size; container-name: clw`), so its layout responds to whatever width its parent gives it — not the viewport. Putting the widget in a 600px-wide column on a 1920px desktop will trigger carousel mode, just like a 600px viewport would.

**Browser support:** container queries are Chrome 105+, Safari 16+, Firefox 110+. Older Safari falls back to viewport `@media` queries automatically.

## The 4 URLs

All three carry UTM parameters for GA4 attribution. The QR code encodes the
**UTM-tagged** URL — phone-handoff sessions attribute correctly.

| Card | Link target |
|---|---|
| 1 | Specific launchpad video with `?utm_source=myblueprint&utm_medium=widget&utm_campaign=career-launchpad-v1&utm_content=card-1` |
| 2 | Specific launchpad video with `utm_content=card-2` |
| 3 (QR) | `https://career-launchpad-woad.vercel.app/` with `utm_content=qr-handoff` |
| View more | `https://career-launchpad-woad.vercel.app/` with `utm_content=view-more` — secondary CTA in the header for students not drawn to the two seeded videos |

## Card 3 swappability

Card 3 ships in QR mode (`.cl-card--qr` modifier, base64 inline image). To swap
to a regular thumbnail:

1. Remove the `cl-card--qr` class from the third `<li>`.
2. Replace the `<img src="data:image/png;base64,…">` with `<img src="https://your-cdn/...jpg">`.
3. Update the `alt` text to describe the new image (not the QR URL).
4. Update the `<a href="...">` to point at the new destination — include the UTM string
   with a new `utm_content` value (e.g. `card-3-new-content`).
5. Update the `<span class="cl-card__label">` text.

To swap back to QR mode: reverse the above. The QR image must be regenerated from
the desired UTM-tagged URL using a QR encoder
(`npx qrcode "<url>" -o file.png -w 512`) and base64-encoded.

## How to rotate thumbnails

1. Generate a new image at the same dimensions (recommended: 1280 × 720, 16:9).
2. Replace the file at the same hosted CDN URL.
3. Browser cache may need a hard refresh.
4. Update the `alt` text in the React component if the title changes.

## Accessibility

The widget meets WCAG 2.1 AA on:
- Alt text on every image (QR alt includes the encoded URL in plain text).
- Keyboard navigation: every card and control is reachable, tab order is logical.
- 2px focus-visible outline in myBlueprint primary blue.
- `aria-live="polite"` announcer for carousel position changes.
- `prefers-reduced-motion: reduce` handled in **both** CSS and JS layers.

## Browser support

- Chrome / Edge 110+
- Safari 15.4+
- Firefox 110+
- iOS Safari 15.4+
- Android Chrome 110+

Older Safari: scroll-snap works but `behavior: 'smooth'` is ignored — carousel
jumps between cards instead of animating. Acceptable degraded behavior.

## Preview

See `preview/desktop.png` and `preview/mobile.png` in this directory. Both
screenshots show the real shipped content.

## Content brief

See `CONTENT.md` in this directory for the source-of-truth content inputs
(URLs, labels, alt text, UTM strings) that produced this widget.
