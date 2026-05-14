# Career LaunchPAD Widget Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single self-contained `career-launchpad-widget.html` deliverable, with real content baked in, to hand to the myBlueprint engineer Wilston for React-wrapping into the student dashboard.

**Architecture:** One HTML file with inline `<style>` and inline `<script>` IIFE. All CSS classes namespaced `cl-` to avoid collisions with the host app's global LESS. Single `<ul>` of cards renders at both breakpoints via media-query layout switching: desktop (≥768px) is a 3-column grid; mobile (<768px) is a horizontal scroll-snap carousel with arrows + dots. Card 3 is a swappable slot (QR variant or thumbnail variant).

**Tech Stack:** HTML5, CSS3, vanilla JavaScript. Tooling for QR generation and HTML validation only: `qrcode` and `html-validate` via `npx`. No build step for the deliverable itself.

**Reference:** Companion spec at `docs/superpowers/specs/2026-05-14-career-launchpad-widget-design.md`.

**Implementation philosophy:** Real content is a **prerequisite**, not a follow-up. Task 1 is a gate — the implementation does not start until Damian has provided final URLs, copy, alt text, thumbnail files, and UTM strategy. The deliverable that ships to Wilston has no bracketed placeholders. The implementation either produces a Wilston-ready artifact or it has not completed.

---

## File structure

All work happens under a new directory in this repo, kept separate from Career LaunchPAD's app code since the deliverable is for a different app (myBlueprint):

```
docs/handoffs/myblueprint-widget/
├── career-launchpad-widget.html   ← the artifact (built across Tasks 2–8)
├── README.md                       ← handoff contract (Task 14)
└── preview/
    ├── desktop.png                 ← 1440px screenshot (Task 13)
    └── mobile.png                  ← 375px screenshot (Task 13)
```

Each file has one clear responsibility. The HTML file is the deliverable; the README documents the contract; the preview screenshots demonstrate visual fidelity. Nothing else is needed.

---

### Task 1: Collect real content (GATE — implementation cannot start without this)

This task produces no code. It produces a single content brief written to `docs/handoffs/myblueprint-widget/CONTENT.md` that all subsequent tasks reference. The executing agent **must stop here and prompt Damian for any missing answers** rather than fabricating placeholders.

**Files:**
- Create: `docs/handoffs/myblueprint-widget/CONTENT.md`

- [ ] **Step 1: Create the directory if it doesn't exist**

Run: `mkdir -p docs/handoffs/myblueprint-widget/preview`

- [ ] **Step 2: Ask Damian for the 9 content inputs**

The executing agent (or whoever is running this plan) writes a single message to Damian listing the following questions. **Do not proceed past this task until every answer is in hand.** If even one answer is "I don't have that yet," stop and surface the blocker.

```
Career LaunchPAD widget — content inputs needed before implementation starts:

1. Card 1 destination URL (the specific launchpad video, before UTM tags):
2. Card 2 destination URL (the specific launchpad video, before UTM tags):
3. Card 1 thumbnail image file (attach a JPG/PNG, recommended 1280×720):
4. Card 2 thumbnail image file (attach a JPG/PNG, recommended 1280×720):
5. Card 1 visible label (text below the image, ~3–6 words):
6. Card 2 visible label (text below the image, ~3–6 words):
7. Card 1 alt-text title (used inside "Watch: [title]"):
8. Card 2 alt-text title (used inside "Watch: [title]"):
9. Confirm UTM string format. Proposed:
   ?utm_source=myblueprint&utm_medium=widget&utm_campaign=career-launchpad-v1&utm_content=<slot>
   where <slot> = "card-1", "card-2", "qr-handoff" per card.
   Approve, or provide alternative campaign string?

Section heading is "Career LaunchPAD"; tagline is "Watch real Canadians, real
careers, real next steps." Push back if either needs to change.

Also: confirm Wilston's CDN URL pattern so the thumbnail src attributes can be
written correctly. If not yet known, I'll use a relative placeholder path that
matches an agreed convention.
```

- [ ] **Step 3: Save the answers into CONTENT.md**

Create `docs/handoffs/myblueprint-widget/CONTENT.md` with all 9 answers, plus the heading/tagline confirmation and Wilston's CDN pattern. Template:

```markdown
# Career LaunchPAD Widget — Content Brief

**Captured:** YYYY-MM-DD
**Source:** direct from Damian

## URLs (before UTMs are appended)

- Card 1 destination: <answer>
- Card 2 destination: <answer>
- QR card destination: https://launchpad.myblueprint.ca/

## UTM string

`?utm_source=myblueprint&utm_medium=widget&utm_campaign=career-launchpad-v1&utm_content=<slot>`

- Card 1 final href: <Card 1 destination>?utm_source=myblueprint&utm_medium=widget&utm_campaign=career-launchpad-v1&utm_content=card-1
- Card 2 final href: <Card 2 destination>?utm_source=myblueprint&utm_medium=widget&utm_campaign=career-launchpad-v1&utm_content=card-2
- QR final encoded URL: https://launchpad.myblueprint.ca/?utm_source=myblueprint&utm_medium=widget&utm_campaign=career-launchpad-v1&utm_content=qr-handoff

## Thumbnails

- Card 1 image: <filename committed to docs/handoffs/myblueprint-widget/assets/thumb-1.jpg>
- Card 2 image: <filename committed to docs/handoffs/myblueprint-widget/assets/thumb-2.jpg>
- CDN pattern (per Wilston): <answer or "TBD, using relative path for preview">

## Copy

- Section heading: Career LaunchPAD
- Tagline: Watch real Canadians, real careers, real next steps.
- Card 1 label: <answer>
- Card 1 alt text: Watch: <answer>
- Card 2 label: <answer>
- Card 2 alt text: Watch: <answer>
- Card 3 label: Ticket to Your Phone
- Card 3 alt text: QR code linking to Career LaunchPAD. URL: https://launchpad.myblueprint.ca/?utm_source=myblueprint&utm_medium=widget&utm_campaign=career-launchpad-v1&utm_content=qr-handoff — scan or open on your phone to continue.
```

- [ ] **Step 4: Commit the thumbnail files alongside the brief**

Place the two thumbnail images at `docs/handoffs/myblueprint-widget/assets/thumb-1.jpg` and `docs/handoffs/myblueprint-widget/assets/thumb-2.jpg`. These are the **shipped** images — when Wilston later hosts them on the myBlueprint CDN, the React component swaps the `src` attribute, but the deliverable file references the asset path that's committed here as the source of truth.

```bash
git add docs/handoffs/myblueprint-widget/CONTENT.md \
        docs/handoffs/myblueprint-widget/assets/thumb-1.jpg \
        docs/handoffs/myblueprint-widget/assets/thumb-2.jpg
git commit -m "docs: capture final content brief for Career LaunchPAD widget"
```

---

### Task 2: Scaffold the deliverable HTML file with the handoff header comment

**Files:**
- Create: `docs/handoffs/myblueprint-widget/career-launchpad-widget.html`

- [ ] **Step 1: Write the skeleton HTML file**

Create `docs/handoffs/myblueprint-widget/career-launchpad-widget.html` with:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Career LaunchPAD widget — handoff preview</title>
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
       utm_content=<slot>). The QR's encoded URL must include the same UTMs so
       phone-handoff sessions attribute to GA4.
    5. Thumbnails are referenced by URL — when integrating, replace the relative
       assets/* paths with the final myBlueprint CDN URLs Wilston provides. The
       images committed at docs/handoffs/myblueprint-widget/assets/ are the
       source-of-truth files.
    6. Every <button> has type="button" — keeps the widget safe inside any
       ancestor <form> in the host dashboard.
  -->
  <style>
    /* CSS goes here in subsequent tasks */
  </style>
</head>
<body>
  <!-- Widget markup goes here in Task 3 -->

  <script>
    /* IIFE goes here in Task 7 */
  </script>
</body>
</html>
```

- [ ] **Step 2: Verify the file opens without errors**

Run: `open docs/handoffs/myblueprint-widget/career-launchpad-widget.html`

Expected: blank page renders, no console errors.

- [ ] **Step 3: Commit**

```bash
git add docs/handoffs/myblueprint-widget/career-launchpad-widget.html
git commit -m "scaffold: empty widget HTML shell with handoff header"
```

---

### Task 3: Add the widget markup with real content from CONTENT.md

**Files:**
- Modify: `docs/handoffs/myblueprint-widget/career-launchpad-widget.html`
- Read: `docs/handoffs/myblueprint-widget/CONTENT.md`

- [ ] **Step 1: Substitute the real content values into the markup template**

Read `CONTENT.md` to get the final values for each placeholder. Then replace the `<!-- Widget markup goes here in Task 3 -->` line with the following, substituting the bracketed tokens with the CONTENT.md values:

```html
<section class="cl-widget" aria-labelledby="cl-widget-heading">
  <div class="cl-widget__header">
    <h2 id="cl-widget-heading">Career LaunchPAD</h2>
    <p>Watch real Canadians, real careers, real next steps.</p>
  </div>

  <ul class="cl-widget__track" role="list">
    <li class="cl-card">
      <a href="<CARD_1_FINAL_HREF_FROM_CONTENT_MD>" target="_blank" rel="noopener noreferrer">
        <img src="assets/thumb-1.jpg" alt="Watch: <CARD_1_ALT_TITLE>">
        <span class="cl-card__label"><CARD_1_LABEL></span>
      </a>
    </li>
    <li class="cl-card">
      <a href="<CARD_2_FINAL_HREF_FROM_CONTENT_MD>" target="_blank" rel="noopener noreferrer">
        <img src="assets/thumb-2.jpg" alt="Watch: <CARD_2_ALT_TITLE>">
        <span class="cl-card__label"><CARD_2_LABEL></span>
      </a>
    </li>
    <li class="cl-card cl-card--qr">
      <a href="https://launchpad.myblueprint.ca/?utm_source=myblueprint&utm_medium=widget&utm_campaign=career-launchpad-v1&utm_content=qr-handoff" target="_blank" rel="noopener noreferrer">
        <img src="[QR_BASE64_FROM_TASK_8]"
             alt="QR code linking to Career LaunchPAD. URL: https://launchpad.myblueprint.ca/?utm_source=myblueprint&utm_medium=widget&utm_campaign=career-launchpad-v1&utm_content=qr-handoff — scan or open on your phone to continue.">
        <span class="cl-card__label">Ticket to Your Phone</span>
      </a>
    </li>
  </ul>

  <div class="cl-widget__controls" role="group" aria-label="Card navigation">
    <button type="button" class="cl-arrow cl-arrow--prev" aria-label="Previous card" disabled>
      <span aria-hidden="true">&lsaquo;</span>
    </button>
    <div class="cl-dots">
      <button type="button" class="cl-dot" aria-label="Go to card 1" aria-pressed="true"></button>
      <button type="button" class="cl-dot" aria-label="Go to card 2" aria-pressed="false"></button>
      <button type="button" class="cl-dot" aria-label="Go to card 3" aria-pressed="false"></button>
    </div>
    <button type="button" class="cl-arrow cl-arrow--next" aria-label="Next card">
      <span aria-hidden="true">&rsaquo;</span>
    </button>
  </div>

  <span class="cl-sr-announce" aria-live="polite"></span>
</section>
```

**Note:** the only remaining bracketed token after substitution is `[QR_BASE64_FROM_TASK_8]` — that becomes a real base64 data URI in Task 8. Every other `<...>` token must be replaced with CONTENT.md content; if any remain, this task is not complete.

- [ ] **Step 2: Verify no unresolved content tokens remain except the QR placeholder**

Run:

```bash
grep -nE '<CARD_|<.*FROM_CONTENT_MD>|<.*_ALT_TITLE>|<.*_LABEL>' docs/handoffs/myblueprint-widget/career-launchpad-widget.html
```

Expected: no output. If any of those tokens show up, Step 1 was incomplete.

- [ ] **Step 3: Open in browser and verify markup renders**

Run: `open docs/handoffs/myblueprint-widget/career-launchpad-widget.html`

Expected: unstyled page shows heading "Career LaunchPAD", tagline, two thumbnail images (loaded from `assets/thumb-1.jpg` and `assets/thumb-2.jpg`), one broken-image placeholder where the QR will go, and the arrow + dots row. No JS errors in console.

- [ ] **Step 4: Commit**

```bash
git add docs/handoffs/myblueprint-widget/career-launchpad-widget.html
git commit -m "feat: add widget markup with real content, UTM-tagged hrefs, type=button"
```

---

### Task 4: Add desktop CSS (≥768px) — the 3-column grid layout

**Files:**
- Modify: `docs/handoffs/myblueprint-widget/career-launchpad-widget.html`

- [ ] **Step 1: Replace the `/* CSS goes here in subsequent tasks */` line in the `<style>` block with the base + desktop CSS**

```css
/* === Reset within widget scope === */
.cl-widget,
.cl-widget *,
.cl-widget *::before,
.cl-widget *::after {
  box-sizing: border-box;
}
.cl-widget ul {
  list-style: none;
  margin: 0;
  padding: 0;
}
.cl-widget a {
  text-decoration: none;
  color: inherit;
  display: block;
}
.cl-widget button {
  font: inherit;
  color: inherit;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
}

/* === Section container === */
.cl-widget {
  background: #ffffff;
  border-radius: 12px;
  padding: 24px;
  font-family: 'Open Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #1d1f24;
  max-width: 1200px;
  margin: 0 auto;
}

/* === Header === */
.cl-widget__header h2 {
  margin: 0 0 4px 0;
  font-size: 20px;
  font-weight: 700;
  line-height: 1.3;
}
.cl-widget__header p {
  margin: 0 0 16px 0;
  font-size: 14px;
  color: #555a64;
  line-height: 1.4;
}

/* === Track (desktop: 3-col grid) === */
.cl-widget__track {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

/* === Card === */
.cl-card {
  border-radius: 10px;
  overflow: hidden;
  background: #f6f7f9;
  border: 1px solid #e3e6eb;
  transition: transform 150ms ease, box-shadow 150ms ease;
}
.cl-card a {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.cl-card img {
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: cover;
  display: block;
  background: #d8dce3;
}
.cl-card--qr img {
  aspect-ratio: 1 / 1;
  object-fit: contain;
  padding: 16px;
  background: #ffffff;
}
.cl-card__label {
  display: block;
  padding: 12px 14px 14px;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* === Mobile-only controls hidden on desktop === */
.cl-widget__controls {
  display: none;
}

/* === Visually hidden announcer === */
.cl-sr-announce {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}
```

- [ ] **Step 2: Open in browser at 1440px and verify desktop layout**

Run: `open docs/handoffs/myblueprint-widget/career-launchpad-widget.html`

Expected: white rounded container, "Career LaunchPAD" heading + tagline, three cards in a row. Card 1 and card 2 show the real thumbnails (16:9). Card 3 shows a broken-image icon at 1:1 aspect (QR comes in Task 8). Labels below each card. No arrows or dots visible.

- [ ] **Step 3: Commit**

```bash
git add docs/handoffs/myblueprint-widget/career-launchpad-widget.html
git commit -m "feat: add base styles and desktop 3-column grid layout"
```

---

### Task 5: Add mobile CSS (<768px) — the scroll-snap carousel

**Files:**
- Modify: `docs/handoffs/myblueprint-widget/career-launchpad-widget.html`

- [ ] **Step 1: Append the mobile media query to the bottom of the `<style>` block (before the closing `</style>`)**

```css
/* === Mobile (<768px) === */
@media (max-width: 767.98px) {
  .cl-widget {
    padding: 20px 16px;
    border-radius: 10px;
  }

  .cl-widget__track {
    display: flex;
    grid-template-columns: none;
    gap: 0;
    overflow-x: auto;
    overflow-y: hidden;
    scroll-snap-type: x mandatory;
    scroll-behavior: smooth;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    margin: 0 -16px;
    padding: 0 16px;
  }
  .cl-widget__track::-webkit-scrollbar {
    display: none;
  }

  .cl-card {
    flex: 0 0 100%;
    scroll-snap-align: center;
    scroll-snap-stop: always;
  }

  /* Show controls on mobile */
  .cl-widget__controls {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 12px;
    margin-top: 16px;
  }

  .cl-arrow {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: #0092ff;
    color: #ffffff;
    font-size: 20px;
    line-height: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: opacity 120ms ease, background-color 120ms ease;
  }

  .cl-dots {
    display: inline-flex;
    justify-content: center;
    gap: 8px;
  }
  .cl-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #c8ccd4;
    transition: background-color 120ms ease, width 120ms ease;
  }
}
```

- [ ] **Step 2: Open in browser, resize devtools viewport to 375px width, and verify**

Run: `open docs/handoffs/myblueprint-widget/career-launchpad-widget.html`, then in Chrome DevTools toggle device emulation and set viewport to 375 × 812.

Expected: white container fills width, only card 1 visible at first, arrows + dots row below the card. Swipe / drag horizontally snaps to the next card.

- [ ] **Step 3: Commit**

```bash
git add docs/handoffs/myblueprint-widget/career-launchpad-widget.html
git commit -m "feat: add mobile scroll-snap carousel with arrow and dot controls"
```

---

### Task 6: Add states CSS — hover, focus-visible, active, disabled, reduced motion

**Files:**
- Modify: `docs/handoffs/myblueprint-widget/career-launchpad-widget.html`

- [ ] **Step 1: Append the states block to the bottom of the `<style>` block (before the closing `</style>`)**

```css
/* === States === */
@media (hover: hover) {
  .cl-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(16, 24, 40, 0.08);
  }
}

.cl-card a:focus-visible,
.cl-arrow:focus-visible,
.cl-dot:focus-visible {
  outline: 2px solid #0092ff;
  outline-offset: 2px;
}

.cl-card a:active {
  opacity: 0.85;
  transition: opacity 80ms ease;
}

.cl-arrow[disabled] {
  opacity: 0.4;
  cursor: not-allowed;
}

.cl-dot[aria-pressed="true"] {
  background: #0092ff;
  width: 20px;
  border-radius: 4px;
}

/* === Reduced motion (CSS layer) === */
@media (prefers-reduced-motion: reduce) {
  .cl-widget__track {
    scroll-behavior: auto;
  }
  .cl-card,
  .cl-arrow,
  .cl-dot {
    transition: none !important;
  }
  .cl-card:hover {
    transform: none;
  }
}
```

- [ ] **Step 2: Open in browser at 1440px and verify hover/focus states**

Hovering a card on desktop lifts it by 2px with a soft shadow. Tabbing draws a 2px blue outline around each card link. Clicking a card briefly dims it (the real URL opens in a new tab since content is final from Task 1 onward — close the tab and return to the preview).

- [ ] **Step 3: Verify reduced-motion CSS fallback**

In Chrome DevTools, open the Rendering tab, set "Emulate CSS media feature prefers-reduced-motion" to "reduce". Hover a card.

Expected: card does NOT lift. No transitions.

- [ ] **Step 4: Commit**

```bash
git add docs/handoffs/myblueprint-widget/career-launchpad-widget.html
git commit -m "feat: add hover, focus-visible, active, disabled, and reduced-motion states"
```

---

### Task 7: Add the carousel JavaScript IIFE (with corrected scroll math + JS-layer reduced motion)

**Files:**
- Modify: `docs/handoffs/myblueprint-widget/career-launchpad-widget.html`

- [ ] **Step 1: Replace the `/* IIFE goes here in Task 7 */` line in the `<script>` block with the full IIFE**

```javascript
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

  function cardOffset(i) {
    // Use rect math so the track's horizontal padding and negative margin
    // don't poison the math the way (i * track.clientWidth) would.
    const trackRect = track.getBoundingClientRect();
    const cardRect  = cards[i].getBoundingClientRect();
    return track.scrollLeft + (cardRect.left - trackRect.left);
  }

  function goTo(i) {
    activeIndex = Math.max(0, Math.min(cards.length - 1, i));
    track.scrollTo({ left: cardOffset(activeIndex), behavior: scrollBehavior() });
    dots.forEach(function (d, n) {
      d.setAttribute('aria-pressed', n === activeIndex ? 'true' : 'false');
    });
    prev.disabled = activeIndex === 0;
    next.disabled = activeIndex === cards.length - 1;
    announcer.textContent = 'Card ' + (activeIndex + 1) + ' of ' + cards.length;
  }

  prev.addEventListener('click', function () { goTo(activeIndex - 1); });
  next.addEventListener('click', function () { goTo(activeIndex + 1); });
  dots.forEach(function (d, i) {
    d.addEventListener('click', function () { goTo(i); });
  });

  // Sync state when the user drives the scroll via touch/swipe.
  let scrollTimer;
  track.addEventListener('scroll', function () {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(function () {
      let nearest = 0;
      let nearestDist = Infinity;
      for (let n = 0; n < cards.length; n++) {
        const d = Math.abs(cardOffset(n) - track.scrollLeft);
        if (d < nearestDist) { nearestDist = d; nearest = n; }
      }
      if (nearest !== activeIndex) goTo(nearest);
    }, 80);
  });

  // Viewport flip mobile → desktop: reset state without animation.
  window.addEventListener('resize', function () {
    if (window.matchMedia('(min-width: 768px)').matches) {
      track.scrollLeft = 0;
      activeIndex = 0;
      dots.forEach(function (d, n) {
        d.setAttribute('aria-pressed', n === 0 ? 'true' : 'false');
      });
      prev.disabled = true;
      next.disabled = false;
    }
  });

  goTo(0);
})();
```

- [ ] **Step 2: Open in browser at 375px width and verify carousel behavior**

Run: `open docs/handoffs/myblueprint-widget/career-launchpad-widget.html`, set DevTools to 375px.

Expected:
- Page loads showing card 1, left arrow disabled, dot 1 active (filled blue, wider).
- Click the right arrow: smooth-scroll to card 2 with the card **fully snapped to center** (not partially visible — this is the test of the rect-based offset math). Dot 2 active. Left arrow enabled.
- Click right again: scroll to card 3. Right arrow disabled.
- Click left arrow: scroll back to card 2.
- Tap a dot: scroll to that card.
- Swipe manually: snap to nearest card; dot/arrow state updates after ~80ms.
- Resize from 375px to 1440px: layout switches to desktop grid, no leftover horizontal offset.

- [ ] **Step 3: Verify reduced-motion at JS layer**

In Chrome DevTools Rendering tab, set `prefers-reduced-motion` to `reduce`. Click the next arrow on mobile (375px viewport).

Expected: page **jumps** to the next card instantly. No glide animation. (This is the test that the JS-layer check works — CSS alone wouldn't catch it because `scrollTo`'s `behavior` argument overrides CSS `scroll-behavior`.)

- [ ] **Step 4: Commit**

```bash
git add docs/handoffs/myblueprint-widget/career-launchpad-widget.html
git commit -m "feat: add carousel IIFE with rect-based offsets and JS-layer reduced motion"
```

---

### Task 8: Generate the QR code from the UTM-tagged URL and embed as base64

**Files:**
- Modify: `docs/handoffs/myblueprint-widget/career-launchpad-widget.html`

- [ ] **Step 1: Generate the QR PNG from the *UTM-tagged* launchpad URL**

The QR must encode the full URL with UTMs so phone-handoff sessions attribute to GA4. Run:

```bash
npx --yes qrcode \
  "https://launchpad.myblueprint.ca/?utm_source=myblueprint&utm_medium=widget&utm_campaign=career-launchpad-v1&utm_content=qr-handoff" \
  -o /tmp/cl-qr.png \
  -w 512
```

Expected: `/tmp/cl-qr.png` exists. Open it once: `open /tmp/cl-qr.png`. Scan with a phone to confirm it resolves to the URL with the UTM string intact.

- [ ] **Step 2: Base64-encode the PNG into a data URI**

```bash
printf 'data:image/png;base64,' > /tmp/cl-qr.b64
base64 -i /tmp/cl-qr.png | tr -d '\n' >> /tmp/cl-qr.b64
echo "" >> /tmp/cl-qr.b64
wc -c /tmp/cl-qr.b64
```

Expected: file size around 2–6 KB.

- [ ] **Step 3: Replace the `[QR_BASE64_FROM_TASK_8]` token in the HTML file**

```bash
QR_URI=$(cat /tmp/cl-qr.b64 | tr -d '\n')
sed -i '' "s|\[QR_BASE64_FROM_TASK_8\]|${QR_URI}|" docs/handoffs/myblueprint-widget/career-launchpad-widget.html
```

- [ ] **Step 4: Verify no bracketed placeholders remain anywhere in the file**

```bash
grep -nE '\[QR_BASE64|<CARD_|<.*FROM_CONTENT_MD>|<.*_ALT_TITLE>|<.*_LABEL>' docs/handoffs/myblueprint-widget/career-launchpad-widget.html
```

Expected: no output. The shipped file has zero placeholders.

- [ ] **Step 5: Open in browser and verify the QR card renders, then phone-scan it**

`open docs/handoffs/myblueprint-widget/career-launchpad-widget.html`. Card 3 shows a real QR code. Scan it: phone opens the UTM-tagged launchpad URL.

- [ ] **Step 6: Commit**

```bash
git add docs/handoffs/myblueprint-widget/career-launchpad-widget.html
git commit -m "feat: embed QR code (UTM-tagged) as base64 data URI on card 3"
```

---

### Task 9: Verify desktop view at 1440px

**Files:** (verification only)

- [ ] **Step 1: Open in Chrome at 1440px viewport**

Run: `open docs/handoffs/myblueprint-widget/career-launchpad-widget.html`. Set window or DevTools "Responsive" to 1440 × 900.

- [ ] **Step 2: Run the desktop verification checklist**

- White rounded container with heading "Career LaunchPAD" and tagline "Watch real Canadians, real careers, real next steps."
- Three cards in a single row with equal widths (1fr each).
- Card 1 and card 2 are 16:9 image cards with their real thumbnails and labels.
- Card 3 (QR) is square; QR is centered with white padding; label is "Ticket to Your Phone".
- No arrows or dots visible.
- Hovering any card lifts it 2px with soft shadow.
- Click each of the three cards in turn: each opens its UTM-tagged URL in a new tab. Verify the URL bar contains the correct `utm_content=card-1`, `card-2`, or `qr-handoff` value.

- [ ] **Step 3: If any defect found, fix and commit**

```bash
git add docs/handoffs/myblueprint-widget/career-launchpad-widget.html
git commit -m "fix: <specific defect description>"
```

---

### Task 10: Verify mobile view at 375px

**Files:** (verification only)

- [ ] **Step 1: Switch to mobile viewport**

DevTools device emulation, viewport 375 × 667 (iPhone SE). Reload.

- [ ] **Step 2: Run the mobile verification checklist**

- White rounded container with 16px horizontal padding.
- Only card 1 visible. Card 1 fills width with the bleed margin matching the container padding (the rect-math test from Task 7).
- Arrow + dots row below: left arrow disabled, dot 1 active (blue, wider), right arrow enabled.
- Tap right arrow: smooth scroll to card 2, **fully snapped to center**, dot 2 active, left arrow enabled.
- Tap right again: card 3 (QR) visible, right arrow disabled.
- Tap dot 1: scroll back to card 1.
- Drag horizontally: snaps to nearest card; dot/arrow state updates after ~80ms.
- Resize to 1440px: switches cleanly to desktop grid; no leftover offset.

- [ ] **Step 3: If any defect found, fix and commit**

```bash
git add docs/handoffs/myblueprint-widget/career-launchpad-widget.html
git commit -m "fix: <specific defect description>"
```

---

### Task 11: Keyboard and screen-reader verification

**Files:** (verification only)

- [ ] **Step 1: Desktop keyboard pass at 1440px**

With DevTools at 1440px viewport, Tab from the address bar.

Expected focus order on **desktop**:
1. Card 1 link
2. Card 2 link
3. Card 3 link
4. (Tab leaves the widget — the arrow and dot buttons are `display: none` and MUST NOT be in the tab order on desktop.)

If Tab lands on an invisible arrow or dot, the desktop CSS is broken — `display: none` is the only correct way to hide them.

- [ ] **Step 2: Mobile keyboard pass at 375px**

Switch viewport to 375px. Tab from the address bar.

Expected focus order on **mobile**:
1. Card 1 link
2. Card 2 link (browser scrolls it into view via scroll-snap; JS scroll listener updates active state)
3. Card 3 link (same scroll-into-view behavior)
4. Prev arrow (may be skipped while `disabled` — confirm Chrome's behavior is to skip)
5. Dot 1
6. Dot 2
7. Dot 3
8. Next arrow

Press Enter on Next arrow at card 1: scroll to card 2.

- [ ] **Step 3: VoiceOver pass on macOS**

Press `Cmd+F5`. Navigate the widget.

Expected announcements:
- "Career LaunchPAD, heading level 2".
- Each thumbnail card link announces: alt text + label (e.g., "Watch: Day in the life of a Canadian UX researcher, Day in the Life: UX Research, link").
- QR card alt text reads out the full UTM-tagged URL — confirm screen-reader users can hear the destination.
- Dot buttons announce: "Go to card 1, pressed, button" (active) or "Go to card 2, not pressed, button" (inactive).
- After arrow click: "Card 2 of 3" from the live region.

- [ ] **Step 4: prefers-reduced-motion JS layer test**

In DevTools Rendering panel, emulate `prefers-reduced-motion: reduce`. At 375px, click the Next arrow.

Expected: page **jumps** to next card with zero animation. This is the JS-layer test that the spec's reduced-motion fix is working.

- [ ] **Step 5: If any defect found, fix and commit**

```bash
git add docs/handoffs/myblueprint-widget/career-launchpad-widget.html
git commit -m "fix: <specific a11y defect description>"
```

---

### Task 12: Validate HTML markup

**Files:** (verification only)

- [ ] **Step 1: Run html-validate**

```bash
npx --yes html-validate docs/handoffs/myblueprint-widget/career-launchpad-widget.html
```

Expected: zero errors. Tolerate warnings about implicit role redundancy (e.g., `role="list"` on `<ul>`) only if they are explicitly intentional in the spec.

- [ ] **Step 2: Fix any errors and re-run until clean**

If errors are reported, fix them and re-run.

- [ ] **Step 3: Commit any fixes**

```bash
git add docs/handoffs/myblueprint-widget/career-launchpad-widget.html
git commit -m "fix: resolve html-validate errors"
```

If no fixes needed, skip the commit.

---

### Task 13: Capture preview screenshots

**Files:**
- Create: `docs/handoffs/myblueprint-widget/preview/desktop.png`
- Create: `docs/handoffs/myblueprint-widget/preview/mobile.png`

- [ ] **Step 1: Capture desktop screenshot at 1440px**

Open the file in Chrome at 1440 × 900 viewport. DevTools → Command Menu (Cmd+Shift+P) → "Capture full size screenshot". Move the PNG to `docs/handoffs/myblueprint-widget/preview/desktop.png`.

- [ ] **Step 2: Capture mobile screenshot at 375px**

DevTools viewport 375 × 812. Command Menu → "Capture screenshot" (viewport, not full-size). Save as `docs/handoffs/myblueprint-widget/preview/mobile.png`.

- [ ] **Step 3: Visually confirm both screenshots show real content**

Open each PNG. Desktop screenshot must show the 3-column grid with the real thumbnails and the real QR. Mobile screenshot must show card 1's real thumbnail (not a placeholder), arrows + dots below.

- [ ] **Step 4: Commit**

```bash
git add docs/handoffs/myblueprint-widget/preview/desktop.png \
        docs/handoffs/myblueprint-widget/preview/mobile.png
git commit -m "docs: add desktop and mobile preview screenshots with real content"
```

---

### Task 14: Write the README

**Files:**
- Create: `docs/handoffs/myblueprint-widget/README.md`

- [ ] **Step 1: Write the README**

````markdown
# Career LaunchPAD Widget — Handoff to myBlueprint

Self-contained HTML/CSS/JS widget for the myBlueprint student dashboard.
Drives traffic to the public Career LaunchPAD site at https://launchpad.myblueprint.ca/.

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

## The 3 URLs

All three carry UTM parameters for GA4 attribution. The QR code encodes the
**UTM-tagged** URL — phone-handoff sessions attribute correctly.

| Card | Link target |
|---|---|
| 1 | Specific launchpad video with `?utm_source=myblueprint&utm_medium=widget&utm_campaign=career-launchpad-v1&utm_content=card-1` |
| 2 | Specific launchpad video with `utm_content=card-2` |
| 3 (QR) | `https://launchpad.myblueprint.ca/` with `utm_content=qr-handoff` |

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
````

- [ ] **Step 2: Commit**

```bash
git add docs/handoffs/myblueprint-widget/README.md
git commit -m "docs: add handoff README with contract, UTM details, and integration steps"
```

---

### Task 15: Final pre-send verification

**Files:** (verification only)

- [ ] **Step 1: Confirm no placeholders anywhere in the deliverable HTML**

```bash
grep -nE '\[.*\]|<CARD_|<.*FROM_CONTENT_MD>|<.*_ALT_TITLE>|<.*_LABEL>|TBD|TODO|FIXME' \
  docs/handoffs/myblueprint-widget/career-launchpad-widget.html
```

Expected: no output, or output limited to legitimate CSS bracket selectors (e.g. `[aria-pressed="true"]`, `[disabled]`). Any `<...>` or `[...]` content tokens must be resolved.

- [ ] **Step 2: Confirm zero external resource references**

```bash
grep -E 'src=|href=' docs/handoffs/myblueprint-widget/career-launchpad-widget.html | \
  grep -E 'cdn\.|cdnjs|jsdelivr|unpkg|googleapis|fontawesome' \
  || echo "OK - no external resource refs"
```

Expected: `OK - no external resource refs`. The widget must not depend on any third-party CDN.

- [ ] **Step 3: Re-run html-validate**

```bash
npx --yes html-validate docs/handoffs/myblueprint-widget/career-launchpad-widget.html
```

Expected: zero errors.

- [ ] **Step 4: Confirm UTMs in every href**

```bash
grep -c 'utm_source=myblueprint' docs/handoffs/myblueprint-widget/career-launchpad-widget.html
```

Expected: at least **4** matches (card 1 href, card 2 href, QR href, QR alt-text containing the URL).

- [ ] **Step 5: Verify the deliverable bundle**

```bash
ls -la docs/handoffs/myblueprint-widget/
```

Expected files:
- `career-launchpad-widget.html` — final, real content, no placeholders
- `README.md`
- `CONTENT.md`
- `assets/thumb-1.jpg`
- `assets/thumb-2.jpg`
- `preview/desktop.png`
- `preview/mobile.png`

- [ ] **Step 6: Final commit**

```bash
git commit --allow-empty -m "chore: career-launchpad-widget v1 ready for handoff to Wilston"
```

The bundle is ready to send. Forward `career-launchpad-widget.html`, `README.md`, and the `preview/` PNGs to Wilston. Keep `CONTENT.md` and `assets/` as internal source-of-truth in this repo.

---

## Self-Review Notes

**Spec coverage check:**
- Decisions table (9 rows including new UTM row) — all covered.
- Markup with `type="button"` and UTM-tagged hrefs — Task 3.
- Layout (desktop grid + mobile carousel) — Tasks 4, 5.
- Behavior (JS) with rect-based offsets and JS-layer reduced motion — Task 7.
- Accessibility (focus order differs desktop vs mobile, off-screen tabbable cards) — Tasks 3, 6, 11.
- States — Task 6.
- Handoff format (file bundle, header comment) — Tasks 2, 13, 14.
- Content rotation playbook — Task 14 (README).
- Real content gate — Task 1 (the gate; prevents the implementation from finishing with placeholders).
- Open follow-ups (now resolved during Task 1 rather than left for post-ship) — Task 1.
- Verification (split desktop vs mobile keyboard checklists) — Tasks 9, 10, 11.
- UTM verification — Task 15 step 4.
- Browser support note — Task 14 (README).

**Placeholder scan:** Every step has concrete code or commands. Bracketed tokens (`<CARD_1_FINAL_HREF_FROM_CONTENT_MD>`, `[QR_BASE64_FROM_TASK_8]`) appear only in transient template positions and are explicitly resolved by later tasks; explicit grep verification at Tasks 3, 8, and 15 prevents shipping with any of them intact.

**Type consistency:** CSS class names (`.cl-widget`, `.cl-card`, `.cl-card--qr`, `.cl-widget__track`, `.cl-widget__controls`, `.cl-widget__header`, `.cl-arrow`, `.cl-arrow--prev`, `.cl-arrow--next`, `.cl-dot`, `.cl-sr-announce`, `.cl-card__label`) are identical across all tasks. JS variable names (`widget`, `track`, `cards`, `dots`, `prev`, `next`, `announcer`, `activeIndex`, `goTo`, `cardOffset`, `scrollBehavior`, `reduceMotion`) are consistent. UTM string is byte-identical across spec, markup (Task 3), QR generation (Task 8), and verification (Task 15).
