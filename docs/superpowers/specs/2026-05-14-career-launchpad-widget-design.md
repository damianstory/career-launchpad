# Career LaunchPAD Widget — v1 Design

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
| 8 | A11y floor: WCAG 2.1 AA — alt text per image, `aria-label` on every button, `aria-live` announcer on scroll, `prefers-reduced-motion` respected in both CSS *and* JS |
| 9 | All 3 card URLs (including the QR's encoded destination) carry UTM parameters for GA4 attribution. The widget's purpose is traffic attribution; this is contract, not optional. Standard pattern: `?utm_source=myblueprint&utm_medium=widget&utm_campaign=career-launchpad-v1&utm_content=<slot>` where `<slot>` is `card-1`, `card-2`, or `qr-handoff`. |

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
      <a href="[CARD_1_FINAL_HREF]" target="_blank" rel="noopener noreferrer">
        <img src="[THUMB_1_URL]" alt="Watch: [video title]">
        <span class="cl-card__label">[Card 1 label]</span>
      </a>
    </li>
    <li class="cl-card">
      <a href="[CARD_2_FINAL_HREF]" target="_blank" rel="noopener noreferrer">
        <img src="[THUMB_2_URL]" alt="Watch: [video title]">
        <span class="cl-card__label">[Card 2 label]</span>
      </a>
    </li>
    <li class="cl-card cl-card--qr">
      <a href="https://launchpad.myblueprint.ca/?utm_source=myblueprint&amp;utm_medium=widget&amp;utm_campaign=career-launchpad-v1&amp;utm_content=qr-handoff" target="_blank" rel="noopener noreferrer">
        <img src="data:image/png;base64,…"
             alt="QR code linking to Career LaunchPAD. URL: https://launchpad.myblueprint.ca/?utm_source=myblueprint&amp;utm_medium=widget&amp;utm_campaign=career-launchpad-v1&amp;utm_content=qr-handoff — scan or open on your phone to continue.">
        <span class="cl-card__label">Ticket to Your Phone</span>
      </a>
    </li>
  </ul>

  <div class="cl-widget__controls" role="group" aria-label="Card navigation">
    <button type="button" class="cl-arrow cl-arrow--prev" aria-label="Previous card" disabled>
      <span aria-hidden="true">‹</span>
    </button>
    <div class="cl-dots">
      <button type="button" class="cl-dot" aria-label="Go to card 1" aria-pressed="true"></button>
      <button type="button" class="cl-dot" aria-label="Go to card 2" aria-pressed="false"></button>
      <button type="button" class="cl-dot" aria-label="Go to card 3" aria-pressed="false"></button>
    </div>
    <button type="button" class="cl-arrow cl-arrow--next" aria-label="Next card">
      <span aria-hidden="true">›</span>
    </button>
  </div>

  <span class="cl-sr-announce" aria-live="polite"></span>
</section>
```

Notes:
- `rel="noopener noreferrer"` on all three card links — `noopener` prevents `window.opener` access; `noreferrer` prevents leaking the myBlueprint dashboard URL (which may contain session state in query strings) via the Referer header.
- `type="button"` on every `<button>` — harmless in static HTML, but once Wilston React-wraps the widget inside the unknown dashboard markup, this prevents any ancestor `<form>` from accidentally submitting on click.
- Dots use `aria-pressed` (toggle-style), not `aria-current` (which is for navigation landmarks). Dots are not tabs — `role="tablist"` would mislead screen readers.
- Arrow glyphs `‹` `›` get `aria-hidden="true"` so the button's `aria-label` is the sole accessible name.
- `<span class="cl-sr-announce">` is visually hidden with the standard `clip: rect(0 0 0 0)` pattern.
- All three `href` values include UTM parameters baked into the URL string (see Decisions row 9). The QR's encoded URL must include the same UTMs so phone-handoff traffic is attributed.
- **URL construction is not raw concatenation.** The Career LaunchPAD app uses `?content=<slug>` deep links (see `src/components/LaunchpadApp.tsx` line 582–583). A blind `+ "?utm_source=..."` produces `?content=slug?utm_source=...`, which is broken. The plan's Task 1 requires the executing agent to use `URL`/`URLSearchParams` to merge UTMs with any existing query string, then HTML-escape the result before insertion. The final hrefs are captured verbatim in `CONTENT.md` and pasted into the markup. Each `&` between query parameters MUST be encoded as `&amp;` in attribute values for HTML validity (`html-validate` will flag bare `&` as a parse error).
- **All user-supplied strings are HTML-escaped before insertion.** Labels, alt-text titles, and href values from `CONTENT.md` may contain `&`, `<`, `>`, `"`. Each must be escaped (`&amp;`, `&lt;`, `&gt;`, `&quot;`) before being baked into the markup. This is mandatory, not nice-to-have — a stray `&` in a video title silently produces invalid HTML that may render but won't React-wrap cleanly.

## Layout

### Desktop (≥ 768px)

- Section is its own white container with rounded corners and matching padding to the existing "Explore Emerging Careers" section in the host app.
- `.cl-widget__track` is `display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;`.
- Thumbnail cards force `aspect-ratio: 16 / 9`. The QR variant of card 3 (`.cl-card--qr`) overrides to `aspect-ratio: 1 / 1` and pads around the QR image. Dropping the `--qr` modifier reverts card 3 to a standard 16:9 thumbnail.
- Card label sits below the image.
- `.cl-widget__controls` is `display: none`.

### Mobile (< 768px)

- Section sits in its own white container, **below the dark gray myBlueprint task-card carousel** (most important Wilston requirement — must not be nested inside the dark gray).
- `.cl-widget` is `position: relative` to anchor the absolutely-positioned arrow overlay.
- `.cl-widget__track`:
  - `display: flex; overflow-x: auto;`
  - `scroll-snap-type: x mandatory; scroll-behavior: smooth;`
  - `scrollbar-width: none;` and `::-webkit-scrollbar { display: none; }`
- Each card: `flex: 0 0 100%; scroll-snap-align: center;`
- **Arrows overhang the card edges** (matching the mock). `.cl-arrow--prev` and `.cl-arrow--next` use `position: absolute`, vertically centered with the card image area via `top: calc(<header-height> + <card-image-half>)` or `transform: translateY(-50%)` against a top anchor, and horizontally hang `-12px` outside the card on each side (clipped only by the section's negative-margin gutter).
- **Dots sit in their own row below the card**, not in the same row as the arrows. The arrow overhang and the dot row are visually separated.

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
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let activeIndex = 0;

  function scrollBehavior() {
    return reduceMotion.matches ? 'auto' : 'smooth';
  }

  function cardCenterScroll(i) {
    // Center-align the card in the track so the result agrees with the CSS
    // `scroll-snap-align: center` snap target. Using left-edge math would
    // produce a momentary jitter as smooth-scroll lands at the left edge
    // and snap then re-centers the card.
    const trackRect  = track.getBoundingClientRect();
    const cardRect   = cards[i].getBoundingClientRect();
    const cardCenter = cardRect.left  + cardRect.width  / 2;
    const trackCenter = trackRect.left + trackRect.width / 2;
    return track.scrollLeft + (cardCenter - trackCenter);
  }

  function goTo(i) {
    activeIndex = Math.max(0, Math.min(cards.length - 1, i));
    track.scrollTo({ left: cardCenterScroll(activeIndex), behavior: scrollBehavior() });
    dots.forEach(function (d, n) {
      d.setAttribute('aria-pressed', n === activeIndex ? 'true' : 'false');
    });
    prev.disabled = activeIndex === 0;
    next.disabled = activeIndex === cards.length - 1;
    announcer.textContent = 'Card ' + (activeIndex + 1) + ' of ' + cards.length;
  }

  prev.addEventListener('click', function () { goTo(activeIndex - 1); });
  next.addEventListener('click', function () { goTo(activeIndex + 1); });
  dots.forEach(function (d, i) { d.addEventListener('click', function () { goTo(i); }); });

  // Sync state when the user drives the scroll via touch/swipe.
  let scrollTimer;
  track.addEventListener('scroll', function () {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(function () {
      // Find nearest card by comparing each card's offset to current scrollLeft.
      let nearest = 0;
      let nearestDist = Infinity;
      for (let n = 0; n < cards.length; n++) {
        const d = Math.abs(cardCenterScroll(n) - track.scrollLeft);
        if (d < nearestDist) { nearestDist = d; nearest = n; }
      }
      if (nearest !== activeIndex) goTo(nearest);
    }, 80);
  });

  // Viewport flip mobile → desktop: reset carousel state without animation.
  window.addEventListener('resize', function () {
    if (window.matchMedia('(min-width: 768px)').matches) {
      track.scrollLeft = 0;
      activeIndex = 0;
      dots.forEach(function (d, n) { d.setAttribute('aria-pressed', n === 0 ? 'true' : 'false'); });
      prev.disabled = true;
      next.disabled = false;
    }
  });

  goTo(0);
})();
```

Important details:
- Uses **absolute** `scrollTo({ left: cardCenterScroll(i) })`. The offset is the center-aligned scroll position computed from `getBoundingClientRect`, not `activeIndex * track.clientWidth`. Required because (a) the mobile track has 16px horizontal padding and a -16px negative margin to bleed into the white-section gutter, so fixed-width math would land between cards, and (b) the CSS uses `scroll-snap-align: center` — left-edge math would cause a one-frame jitter as smooth-scroll lands and then snap re-centers.
- `scrollBehavior()` returns `'auto'` when `prefers-reduced-motion: reduce` is set. CSS handles the snap-behavior fallback; JS handles the `scrollTo` behavior. Both are required because `scrollTo`'s `behavior` option overrides the CSS `scroll-behavior` property.
- Swipe-driven scrolling is debounced (80ms) and synced back to `activeIndex` via nearest-card math. The dot/arrow state stays correct when the student swipes manually.
- Resize listener resets scroll position to 0 on viewport flip mobile → desktop, preventing an invisible left offset on the grid.
- Arrows are clamped (`disabled` at ends), not looping.
- Off-screen cards on mobile remain in the tab order (no `tabindex="-1"`). When focus moves to a non-visible card, the browser scrolls it into view; scroll-snap then aligns it, and the JS scroll listener syncs `activeIndex`. Keyboard users can reach all 3 cards in DOM order.

## Accessibility

- **Focus order on mobile** (controls visible): heading → card 1 → card 2 → card 3 → prev arrow → dot 1 → dot 2 → dot 3 → next arrow.
- **Focus order on desktop** (controls hidden via `display: none`, therefore not focusable): heading → card 1 → card 2 → card 3. The buttons are not in the tab order on desktop and the verification checklist must not claim they are.
- Off-screen mobile cards stay in the tab order. When focus moves to a non-visible card, the browser scrolls it into view; scroll-snap aligns it; the JS scroll listener syncs the active state.
- `:focus-visible` only — mouse clicks don't draw the ring, keyboard tabs do.
- 2px solid focus outline in myBlueprint primary blue, `outline-offset: 2px`. Exact hex confirmed from `~/.claude/design-systems/myblueprint/` during build (placeholder reference: `#0092ff` from launchpad PRODUCT.md, to be verified against MB brand guide).
- Alt text:
  - Thumbnails: descriptive of the content the click goes to. Both card 1 and card 2 use the `Watch: [title]` prefix since v1 content is video for both.
  - QR: descriptive **and** spells out the URL in plain text — screen-reader users can't scan a QR.
- `prefers-reduced-motion: reduce`: handled in **both layers**. CSS sets `scroll-behavior: auto` and removes transitions; JS checks the same media query and passes `behavior: 'auto'` to `scrollTo`. The JS check is required because `scrollTo`'s `behavior` argument overrides the CSS property.
- `aria-live="polite"` visually hidden announcer fires "Card N of 3" on every scroll-position change.

## Color tokens

The widget uses the Career LaunchPAD design system, not ad-hoc greys. All hex values below are pulled from `DESIGN.md` in the repo root and must stay in sync with that file. The token name (e.g. `signal-blue`) is the contract; if the design system updates a hex value, the widget tracks it.

| Token (DESIGN.md) | Hex | Used for |
|---|---|---|
| `signal-blue` | `#0092ff` | Focus ring, active dot, mobile arrow background |
| `signal-blue-deep` | `#0082e5` | Mobile arrow hover/active background |
| `anchor-navy` | `#22224c` | Body text and headline color |
| `slate-ink` | `#485163` | Tagline body copy |
| `slate-body` | `#65738b` | Secondary text (if needed) |
| `slate-echo` | `#aab7cb` | Inactive dot color |
| `slate-frame-light` | `#e5e9f1` | Card border, section dividers |
| `studio-off-white` | `#f6f6ff` | Card resting background (replaces the generic `#f6f7f9`) |
| `pure-white` | `#ffffff` | Widget section background, QR card background |

The myBlueprint-native states decision (Decision row 7) is satisfied by these tokens — Signal Blue is the host-app's brand accent, the navy/slate ramp matches myBlueprint's existing dashboard chrome, and the resulting widget looks coherent inside the host shell while signaling its launchpad identity through Signal Blue.

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

**Deliverable bundle** (everything in this list ships to Wilston):

```
career-launchpad-widget/
├── career-launchpad-widget.html   ← the artifact
├── README.md                       ← contract + integration notes
├── assets/                         ← shipped thumbnail files Wilston re-hosts
│   ├── thumb-1.jpg
│   └── thumb-2.jpg
└── preview/
    ├── desktop.png                 ← 1440px screenshot
    └── mobile.png                  ← 375px screenshot
```

The HTML file references thumbnails by relative `assets/thumb-N.jpg` paths so the preview opens correctly from any checkout. On integration, Wilston uploads the two files to the myBlueprint CDN and updates the `<img src>` attributes (and only those two attributes) to point at the CDN URLs. This is the right pattern because: (a) the CDN URL pattern is not always known when the widget is built, (b) Wilston needs the actual image files regardless, and (c) including them in the bundle eliminates a back-and-forth round trip.

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
  4. All three href values include UTM parameters
     (utm_source=myblueprint, utm_medium=widget, utm_campaign=career-launchpad-v1,
     utm_content=<slot>). Ampersands between query params are encoded as &amp;
     in attribute values for HTML validity. The QR's encoded URL also includes
     the UTMs so phone-handoff sessions attribute to GA4.
  5. Thumbnails currently use relative paths `assets/thumb-1.jpg` / `assets/thumb-2.jpg`.
     The image files ship alongside this HTML inside the handoff bundle's
     `assets/` folder. Upload both to the myBlueprint CDN, then replace the two
     `src` attributes with the CDN URLs. No other markup changes required.
  6. Every <button> has type="button" — keeps the widget safe inside any
     ancestor <form> in the host dashboard.
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

All items below are **gating** for implementation. The plan's Task 1 collects them; nothing else starts until they are answered. This prevents the implementation from "finishing" with placeholders still in the file.

| # | Item | Owner | Required by |
|---|---|---|---|
| 1 | Thumbnail hosting location (final CDN URL pattern myBlueprint will serve from) | Wilston | Soft gate — if unknown, the widget ships with relative `assets/` paths and the `assets/` folder is included in the handoff bundle for Wilston to re-host. |
| 2 | Final URL for card 1 (specific video deep link on launchpad) | Damian | Implementation start |
| 3 | Final URL for card 2 (specific video deep link on launchpad) | Damian | Implementation start |
| 4 | Final card label copy (text under cards 1 and 2) | Damian | Implementation start |
| 5 | Final video alt-text titles (used in `alt="Watch: [title]"`) | Damian | Implementation start |
| 6 | Final thumbnail image files (actual JPG/PNG content for cards 1 and 2) | Damian | Implementation start |
| 7 | Final section heading + tagline copy (proposed: "Career LaunchPAD" + "Watch real Canadians, real careers, real next steps.") | Damian + Brian/product | Implementation start |
| 8 | UTM campaign string confirmation — proposed `?utm_source=myblueprint&utm_medium=widget&utm_campaign=career-launchpad-v1&utm_content=<slot>` (slots: `card-1`, `card-2`, `qr-handoff`) | Damian | Implementation start |
| 9 | Confirm myBlueprint primary focus-ring color against brand guide | Damian, during build | Implementation polish |

## Verification

Before sending the artifact to Wilston:

- Open `career-launchpad-widget.html` directly in Chrome at 1440px and 375px viewport widths.
- **Desktop view (1440px):** 3 cards in white section, no controls visible. Tab order: card 1 → card 2 → card 3. The arrow and dot buttons are `display: none` so they are not focusable — the keyboard pass must confirm Tab skips them entirely.
- **Mobile view (375px):** 1 card visible, working left/right arrows, 3 dots, clamped at ends. Tab order: card 1 → card 2 → card 3 → prev arrow → dot 1 → dot 2 → dot 3 → next arrow. Tabbing to an off-screen card scrolls it into view via scroll-snap; the JS scroll listener syncs the dot/arrow state.
- Click each of 3 cards: opens correct URL with intact UTM parameters in a new tab.
- VoiceOver / NVDA announces card content, dot pressed state ("pressed" for active, "not pressed" for others), and `aria-live` updates ("Card 2 of 3").
- `prefers-reduced-motion: reduce` set: carousel still navigates between cards, but with no smooth animation. Confirm by clicking the next arrow — page should jump, not glide.
- Validate markup with `npx html-validate career-launchpad-widget.html` — zero errors.
- File contains zero external `<script src>` or `<link rel="stylesheet">` references.
- All bracketed placeholders (`[VIDEO_URL_1]`, etc.) have been replaced with real content. `grep '\[' career-launchpad-widget.html` should return zero matches outside legitimate uses (CSS bracket selectors).
- Browser-test fallback path on iOS Safari 15.4+ (modern), confirm graceful behavior on older Safari (acceptable degradation: snap jumps without animation).

## Browser support

Targets confirmed for v1:
- Chrome / Edge 110+
- Safari 15.4+
- Firefox 110+
- iOS Safari 15.4+
- Android Chrome 110+

Older Safari: scroll-snap works but `behavior: 'smooth'` is ignored — carousel jumps instead of animates. Acceptable degraded behavior.
