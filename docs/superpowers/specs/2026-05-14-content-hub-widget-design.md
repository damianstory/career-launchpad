# Career LaunchPAD Content Hub Widget — v1 Design

**Date:** 2026-05-14
**Status:** Design approved, pending implementation plan
**Forcing function:** Partner event end of May 2026

## Purpose

A small, fully static widget that lives on the myBlueprint student dashboard and drives traffic to the public Career LaunchPAD site. Three cards: two thumbnail images linking to specific launchpad content, one QR code so students can continue browsing on their phones without logging into myBlueprint.

The widget is intentionally static for v1 — no database calls, no live content pulls, no API. Images and links are swapped manually when content rotates.

## Constraints

From a call with the myBlueprint engineer wrapping this in React (Wilston):

- Deliverable is a single self-contained HTML file with inline `<style>` and inline `<script>`.
- Basic CSS3 only — no LESS, no Tailwind, no preprocessor syntax.
- Older React in the host app — must work without modern toolchain assumptions.
- Mobile widget sits in **its own white section, below the dark gray task-card carousel** — not nested inside it.
- All assets either inline (base64) or hosted at URLs Wilston confirms.

## Decisions

| # | Decision |
|---|---|
| 1 | 3 image-slot cards. Default v1 content: 2 thumbnails + 1 QR. Card 3 is a swappable slot — either a QR (via `.cl-card--qr` modifier, 1:1 aspect-ratio, base64 inline) or a regular thumbnail (drop the modifier, 16:9, hosted URL). Swap is a content change, not a markup rewrite. |
| 2 | 3 distinct URLs, all open in a new tab |
| 3 | Desktop (≥768px): 3 cards in a row, no controls |
| 4 | Mobile (<768px): own white section, 1 card visible, left/right arrows, 3 dots, clamped at ends |
| 5 | Carousel mechanism: CSS scroll-snap + ~25 lines of vanilla JS |
| 6 | Image hosting: hybrid — QR baked in as base64, thumbnails referenced by URL |
| 7 | States: myBlueprint-native (subtle hover lift, 2px focus outline in MB primary blue, brief active opacity dip) |
| 8 | A11y floor: WCAG 2.1 AA — alt text per image, `aria-label` on every button, `aria-live` announcer on scroll, `prefers-reduced-motion` respected |

## Architecture

**Single file:** `career-launchpad-widget.html`

```
career-launchpad-widget.html
├── <style>          ─ inline CSS3, all selectors namespaced `cl-`
├── <section class="cl-widget">
│   ├── header (h2 heading + tagline)
│   ├── <ul class="cl-widget__track"> ─ 3 <li class="cl-card"> items, same DOM at both breakpoints
│   └── <div class="cl-widget__controls"> ─ arrows + dots, mobile-only via CSS
└── <script>         ─ inline IIFE, ~25 lines
```

**Key choice:** one `<ul>` of cards rendered at both breakpoints. CSS swaps the layout via media query at 768px. No duplicate DOM trees, no duplicate IDs, no `aria-labelledby` collisions.

**Namespace:** every CSS class is prefixed `cl-` (e.g. `.cl-card`, `.cl-arrow`, `.cl-dot`). Critical for the React-wrap step — the host app uses global LESS and unprefixed class names would collide.

## Markup

```html
<section class="cl-widget" aria-labelledby="cl-widget-heading">
  <div class="cl-widget__header">
    <h2 id="cl-widget-heading">Career LaunchPAD</h2>
    <p>Watch real Canadians, real careers, real next steps.</p>
  </div>

  <ul class="cl-widget__track" role="list">
    <li class="cl-card">
      <a href="[VIDEO_URL]" target="_blank" rel="noopener noreferrer">
        <img src="[THUMB_1_URL]" alt="Watch: [video title]">
        <span class="cl-card__label">[Card 1 label]</span>
      </a>
    </li>
    <li class="cl-card">
      <a href="[CONTENT_URL]" target="_blank" rel="noopener noreferrer">
        <img src="[THUMB_2_URL]" alt="Read: [content title]">
        <span class="cl-card__label">[Card 2 label]</span>
      </a>
    </li>
    <li class="cl-card cl-card--qr">
      <a href="https://launchpad.myblueprint.ca/" target="_blank" rel="noopener noreferrer">
        <img src="data:image/png;base64,…"
             alt="QR code linking to Career LaunchPAD. URL: https://launchpad.myblueprint.ca/ — scan or open on your phone to continue.">
        <span class="cl-card__label">Scan to continue on your phone</span>
      </a>
    </li>
  </ul>

  <div class="cl-widget__controls" role="group" aria-label="Card navigation">
    <button class="cl-arrow cl-arrow--prev" aria-label="Previous card" disabled>
      <span aria-hidden="true">‹</span>
    </button>
    <div class="cl-dots">
      <button class="cl-dot" aria-label="Go to card 1" aria-pressed="true"></button>
      <button class="cl-dot" aria-label="Go to card 2" aria-pressed="false"></button>
      <button class="cl-dot" aria-label="Go to card 3" aria-pressed="false"></button>
    </div>
    <button class="cl-arrow cl-arrow--next" aria-label="Next card">
      <span aria-hidden="true">›</span>
    </button>
  </div>

  <span class="cl-sr-announce" aria-live="polite"></span>
</section>
```

Notes:
- `rel="noopener noreferrer"` on all three card links — `noopener` prevents `window.opener` access; `noreferrer` prevents leaking the myBlueprint dashboard URL (which may contain session state in query strings) via the Referer header.
- Dots use `aria-pressed` (toggle-style), not `aria-current` (which is for navigation landmarks). Dots are not tabs — `role="tablist"` would mislead screen readers.
- Arrow glyphs `‹` `›` get `aria-hidden="true"` so the button's `aria-label` is the sole accessible name.
- `<span class="cl-sr-announce">` is visually hidden with the standard `clip: rect(0 0 0 0)` pattern.

## Layout

### Desktop (≥ 768px)

- Section is its own white container with rounded corners and matching padding to the existing "Explore Emerging Careers" section in the host app.
- `.cl-widget__track` is `display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;`.
- Thumbnail cards force `aspect-ratio: 16 / 9`. The QR variant of card 3 (`.cl-card--qr`) overrides to `aspect-ratio: 1 / 1` and pads around the QR image. Dropping the `--qr` modifier reverts card 3 to a standard 16:9 thumbnail.
- Card label sits below the image.
- `.cl-widget__controls` is `display: none`.

### Mobile (< 768px)

- Section sits in its own white container, **below the dark gray myBlueprint task-card carousel** (most important Wilston requirement — must not be nested inside the dark gray).
- `.cl-widget__track`:
  - `display: flex; overflow-x: auto;`
  - `scroll-snap-type: x mandatory; scroll-behavior: smooth;`
  - `scrollbar-width: none;` and `&::-webkit-scrollbar { display: none; }`
- Each card: `flex: 0 0 100%; scroll-snap-align: center;`
- `.cl-widget__controls` visible: arrow buttons positioned to overhang the card edges (matching the mock); dots row below the card.

### Both breakpoints

- Heading sits above the track in the same DOM position.
- Card label is a `<span>` below the image, single line, ellipsis on overflow.

## Behavior (JS)

Single IIFE scoped to the widget root, no global pollution. Approximate shape:

```js
(function initClWidget() {
  const widget = document.querySelector('.cl-widget');
  if (!widget) return;
  const track     = widget.querySelector('.cl-widget__track');
  const cards     = widget.querySelectorAll('.cl-card');
  const dots      = widget.querySelectorAll('.cl-dot');
  const prev      = widget.querySelector('.cl-arrow--prev');
  const next      = widget.querySelector('.cl-arrow--next');
  const announcer = widget.querySelector('.cl-sr-announce');
  let activeIndex = 0;

  function goTo(i) {
    activeIndex = Math.max(0, Math.min(cards.length - 1, i));
    track.scrollTo({ left: activeIndex * track.clientWidth, behavior: 'smooth' });
    dots.forEach((d, n) => {
      d.classList.toggle('is-active', n === activeIndex);
      d.setAttribute('aria-pressed', n === activeIndex ? 'true' : 'false');
    });
    prev.disabled = activeIndex === 0;
    next.disabled = activeIndex === cards.length - 1;
    announcer.textContent = `Card ${activeIndex + 1} of ${cards.length}`;
  }

  prev.addEventListener('click', () => goTo(activeIndex - 1));
  next.addEventListener('click', () => goTo(activeIndex + 1));
  dots.forEach((d, i) => d.addEventListener('click', () => goTo(i)));

  let scrollTimer;
  track.addEventListener('scroll', () => {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
      const i = Math.round(track.scrollLeft / track.clientWidth);
      if (i !== activeIndex) goTo(i);
    }, 80);
  });

  window.addEventListener('resize', () => {
    if (window.matchMedia('(min-width: 768px)').matches) goTo(0);
  });

  goTo(0);
})();
```

Important details:
- Uses **absolute** `scrollTo({ left: activeIndex * track.clientWidth })`, not relative `scrollBy`. Fixes an iOS Safari pre-15 bug where scroll-snap can ignore subsequent programmatic offsets after the first.
- Swipe-driven scrolling is debounced (80ms) and synced back to `activeIndex`, so dot/arrow state stays correct when the student swipes manually.
- Resize listener resets scroll position to 0 on viewport flip to desktop, preventing an invisible left offset on the grid.
- Arrows are clamped (`disabled` at ends), not looping.

## Accessibility

- Focus order (free from DOM order): heading → card 1 → card 2 → card 3 → prev arrow → dot 1 → dot 2 → dot 3 → next arrow.
- `:focus-visible` only — mouse clicks don't draw the ring, keyboard tabs do.
- 2px solid focus outline in myBlueprint primary blue, `outline-offset: 2px`. Exact hex confirmed from `~/.claude/design-systems/myblueprint/` during build (placeholder reference: `#0092ff` from launchpad PRODUCT.md, to be verified against MB brand guide).
- Alt text:
  - Thumbnails: descriptive of the content the click goes to (`Watch: [title]`, `Read: [title]`).
  - QR: descriptive **and** spells out the URL in plain text — screen-reader users can't scan a QR.
- `prefers-reduced-motion: reduce`: `scroll-behavior` falls back to `auto`, transitions disabled. Carousel jumps cleanly between cards instead of animating.
- `aria-live="polite"` visually hidden announcer fires "Card N of 3" on every scroll-position change.

## States

| State | Treatment |
|---|---|
| Default | Card sits flush, subtle 1px border or soft shadow matching MB card patterns |
| Hover (pointer) | `transform: translateY(-2px)` + slightly elevated shadow, 150ms ease |
| Focus (keyboard) | 2px solid MB primary blue outline, `outline-offset: 2px` |
| Active (tap/click) | Brief `opacity: 0.85` for ~80ms |
| Arrow disabled (clamp ends) | `opacity: 0.4; cursor: not-allowed;` and `disabled` attribute |
| Dot active | `aria-pressed="true"`, filled background in MB primary |
| Reduced motion | All transitions removed; layout/state changes are instantaneous |

## Handoff

**Deliverable bundle:**

```
career-launchpad-widget/
├── career-launchpad-widget.html   ← the artifact
├── README.md                       ← contract + integration notes
└── preview/
    ├── desktop.png                 ← 1440px screenshot
    └── mobile.png                  ← 375px screenshot
```

**File header comment block** (most important part of the handoff — embedded at the top of the HTML):

```html
<!--
  Career LaunchPAD widget — handoff to myBlueprint.

  Integration notes for React-wrapping:
  1. Extract this <style> block into a real stylesheet (LESS file or imported .css).
     Leaving it inline will cause stylesheet churn on every React re-render in the
     host app's older React version.
  2. Move the JS init into useEffect (or componentDidMount) inside the React
     component. Do NOT leave it as a top-of-render IIFE — listeners will stack
     duplicates on every re-render and the scroll handler will fire on phantom nodes.
  3. All classes are namespaced .cl-* — safe to drop into the host app's global LESS
     without collision.
  4. Three URLs are placeholders ([VIDEO_URL], [CONTENT_URL]) — replace before ship.
     QR image is base64-baked; regenerate from CL_ROOT_URL if that URL changes.
  5. Thumbnails are referenced by URL — host these at a stable myBlueprint asset
     path before integration. See README for the file naming convention.
-->
```

## Content rotation playbook

After the widget ships, content can be rotated without a React redeploy:

- **Swap a thumbnail image** (card 1 or 2, or card 3 when it's a thumbnail): replace the file at the hosted asset URL with a new image at the same filename. Browser cache may need a hard refresh.
- **Swap a thumbnail's link target**: edit the `href` on the `<a>` in the React component. Small change, one-line PR.
- **Swap card 3 between QR and thumbnail modes**:
  - *Going from QR → thumbnail:* remove the `cl-card--qr` class from the third `<li>`, swap the base64 `<img src>` for a hosted URL, update the `alt` text and link `href`, replace the `cl-card__label` text. One-block edit in the React component.
  - *Going from thumbnail → QR:* add the `cl-card--qr` class to the third `<li>`, replace the hosted `<img src>` with the new base64-encoded QR data URI, update the `alt` text to spell out the encoded URL, set the `href` to the same URL.
- **Swap the QR's encoded URL**: regenerate the QR PNG from the new URL, base64-encode it, and replace the data URI string. Update the `alt` text to match.

The widget's HTML structure stays identical across all these rotations — only the content of three `<li>` elements changes.

## Open follow-ups

| # | Item | Owner | Blocks |
|---|---|---|---|
| 1 | Thumbnail hosting location (URL pattern) | Wilston | Implementation start |
| 2 | Final URL for card 1 (specific video deep link) | Damian | Implementation start |
| 3 | Final URL for card 2 (specific content piece) | Damian | Implementation start |
| 4 | Final card label copy (text under each thumbnail) | Damian | Implementation start |
| 5 | Final section heading copy (proposed: "Career LaunchPAD" + tagline) | Damian + Brian/product | Implementation start |
| 6 | Confirm myBlueprint primary focus-ring color against brand guide | Damian, during build | Implementation polish |
| 7 | UTM tags on the 3 URLs for GA4 attribution | Damian | Recommended, not blocking |

## Verification

Before sending the artifact to Wilston:

- Open `career-launchpad-widget.html` directly in Chrome at 1440px and 375px viewport widths.
- Desktop view: 3 cards in white section, no controls visible.
- Mobile view: 1 card visible, working left/right arrows, 3 dots, clamped at ends.
- Click each of 3 cards: opens correct URL in a new tab.
- Tab through with keyboard: visible 2px focus ring on each card, both arrows, all 3 dots; tab order is logical.
- VoiceOver / NVDA announces card content, dot position ("Card 2 of 3"), and arrow labels.
- `prefers-reduced-motion: reduce` set: carousel still works, no smooth animation.
- Validate markup with `npx html-validate career-launchpad-widget.html` — zero errors.
- File contains zero external `<script src>` or `<link rel="stylesheet">` references.
- Browser-test fallback path on iOS Safari 15.4+ (modern), confirm graceful behavior on older Safari (acceptable degradation: snap jumps without animation).

## Browser support

Targets confirmed for v1:
- Chrome / Edge 110+
- Safari 15.4+
- Firefox 110+
- iOS Safari 15.4+
- Android Chrome 110+

Older Safari: scroll-snap works but `behavior: 'smooth'` is ignored — carousel jumps instead of animates. Acceptable degraded behavior.
