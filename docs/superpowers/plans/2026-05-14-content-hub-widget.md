# Career LaunchPAD Content Hub Widget Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single self-contained `career-launchpad-widget.html` deliverable to hand to the myBlueprint engineer Wilston, who will React-wrap it for the student dashboard.

**Architecture:** One HTML file with inline `<style>` and inline `<script>` IIFE. All CSS classes namespaced `cl-` to avoid collisions with the host app's global LESS. Single `<ul>` of cards renders at both breakpoints via media-query layout switching: desktop (≥768px) is a 3-column grid; mobile (<768px) is a horizontal scroll-snap carousel with arrows + dots. Card 3 is a swappable slot (QR variant or thumbnail variant).

**Tech Stack:** HTML5, CSS3, vanilla JavaScript. Tooling for QR generation and HTML validation only: `qrcode` and `html-validate` via `npx`. No build step for the deliverable itself.

**Reference:** Companion spec at `docs/superpowers/specs/2026-05-14-content-hub-widget-design.md`.

---

## File structure

All work happens under a new directory in this repo, kept separate from Career LaunchPAD's app code since the deliverable is for a different app (myBlueprint):

```
docs/handoffs/myblueprint-widget/
├── career-launchpad-widget.html   ← the artifact (built across tasks 1–8)
├── README.md                       ← handoff contract (task 14)
└── preview/
    ├── desktop.png                 ← 1440px screenshot (task 13)
    └── mobile.png                  ← 375px screenshot (task 13)
```

Each file has one clear responsibility. The HTML file is the deliverable; the README documents the contract; the preview screenshots demonstrate visual fidelity. Nothing else is needed.

---

### Task 1: Scaffold the deliverable directory and skeleton HTML file

**Files:**
- Create: `docs/handoffs/myblueprint-widget/career-launchpad-widget.html`

- [ ] **Step 1: Create the directory**

Run: `mkdir -p docs/handoffs/myblueprint-widget/preview`

Expected: directory exists.

- [ ] **Step 2: Write the skeleton HTML file with the handoff header comment**

Create `docs/handoffs/myblueprint-widget/career-launchpad-widget.html` with the following content:

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
    4. Three URLs are placeholders ([VIDEO_URL_1], [VIDEO_URL_2]) — replace before ship.
       QR image is base64-baked; regenerate from CL_ROOT_URL if that URL changes.
    5. Thumbnails are referenced by URL — host these at a stable myBlueprint asset
       path before integration. See README for the file naming convention.
  -->
  <style>
    /* CSS goes here in subsequent tasks */
  </style>
</head>
<body>
  <!-- Widget markup goes here in Task 2 -->

  <script>
    /* IIFE goes here in Task 6 */
  </script>
</body>
</html>
```

- [ ] **Step 3: Verify the file opens without errors**

Run: `open docs/handoffs/myblueprint-widget/career-launchpad-widget.html` (macOS) or open the file in any browser.

Expected: blank page renders, no console errors.

- [ ] **Step 4: Commit**

```bash
git add docs/handoffs/myblueprint-widget/career-launchpad-widget.html
git commit -m "scaffold: empty widget HTML shell with handoff header"
```

---

### Task 2: Add the widget markup

**Files:**
- Modify: `docs/handoffs/myblueprint-widget/career-launchpad-widget.html`

- [ ] **Step 1: Replace the `<!-- Widget markup goes here in Task 2 -->` placeholder with the full widget section**

Replace that exact line with:

```html
<section class="cl-widget" aria-labelledby="cl-widget-heading">
  <div class="cl-widget__header">
    <h2 id="cl-widget-heading">Career LaunchPAD</h2>
    <p>Watch real Canadians, real careers, real next steps.</p>
  </div>

  <ul class="cl-widget__track" role="list">
    <li class="cl-card">
      <a href="[VIDEO_URL_1]" target="_blank" rel="noopener noreferrer">
        <img src="[THUMB_1_URL]" alt="Watch: [video title]">
        <span class="cl-card__label">[Card 1 label]</span>
      </a>
    </li>
    <li class="cl-card">
      <a href="[VIDEO_URL_2]" target="_blank" rel="noopener noreferrer">
        <img src="[THUMB_2_URL]" alt="Watch: [video title]">
        <span class="cl-card__label">[Card 2 label]</span>
      </a>
    </li>
    <li class="cl-card cl-card--qr">
      <a href="https://launchpad.myblueprint.ca/" target="_blank" rel="noopener noreferrer">
        <img src="[QR_BASE64_PLACEHOLDER]"
             alt="QR code linking to Career LaunchPAD. URL: https://launchpad.myblueprint.ca/ — scan or open on your phone to continue.">
        <span class="cl-card__label">Ticket to Your Phone</span>
      </a>
    </li>
  </ul>

  <div class="cl-widget__controls" role="group" aria-label="Card navigation">
    <button class="cl-arrow cl-arrow--prev" aria-label="Previous card" disabled>
      <span aria-hidden="true">&lsaquo;</span>
    </button>
    <div class="cl-dots">
      <button class="cl-dot" aria-label="Go to card 1" aria-pressed="true"></button>
      <button class="cl-dot" aria-label="Go to card 2" aria-pressed="false"></button>
      <button class="cl-dot" aria-label="Go to card 3" aria-pressed="false"></button>
    </div>
    <button class="cl-arrow cl-arrow--next" aria-label="Next card">
      <span aria-hidden="true">&rsaquo;</span>
    </button>
  </div>

  <span class="cl-sr-announce" aria-live="polite"></span>
</section>
```

- [ ] **Step 2: Open in browser and verify markup renders**

Run: `open docs/handoffs/myblueprint-widget/career-launchpad-widget.html`

Expected: unstyled page shows the heading "Career LaunchPAD", the tagline, three broken-image placeholders with labels, and the arrow + dots row. No JS errors in console.

- [ ] **Step 3: Commit**

```bash
git add docs/handoffs/myblueprint-widget/career-launchpad-widget.html
git commit -m "feat: add widget markup with placeholder URLs and a11y attributes"
```

---

### Task 3: Add desktop CSS (≥768px) — the 3-column grid layout

**Files:**
- Modify: `docs/handoffs/myblueprint-widget/career-launchpad-widget.html`

- [ ] **Step 1: Replace the `/* CSS goes here in subsequent tasks */` line in the `<style>` block with the base + desktop CSS**

Replace that exact line with:

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

Expected: white rounded container, "Career LaunchPAD" heading + tagline, three cards in a row with the QR card visibly square (1:1) while the two thumbnail cards are 16:9. Labels below each card. No arrows or dots visible.

- [ ] **Step 3: Commit**

```bash
git add docs/handoffs/myblueprint-widget/career-launchpad-widget.html
git commit -m "feat: add base styles and desktop 3-column grid layout"
```

---

### Task 4: Add mobile CSS (<768px) — the scroll-snap carousel

**Files:**
- Modify: `docs/handoffs/myblueprint-widget/career-launchpad-widget.html`

- [ ] **Step 1: Append the mobile media query to the bottom of the `<style>` block (before the closing `</style>`)**

Add:

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

Expected: white container fills width, only card 1 visible at first, arrows + dots row below the card. Swipe / drag horizontally snaps to the next card. The dark gray task-card container is not present in the preview (this widget is standalone).

- [ ] **Step 3: Commit**

```bash
git add docs/handoffs/myblueprint-widget/career-launchpad-widget.html
git commit -m "feat: add mobile scroll-snap carousel with arrow and dot controls"
```

---

### Task 5: Add states CSS — hover, focus-visible, active, disabled, reduced motion

**Files:**
- Modify: `docs/handoffs/myblueprint-widget/career-launchpad-widget.html`

- [ ] **Step 1: Append the states block to the bottom of the `<style>` block (before the closing `</style>`)**

Add:

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

/* === Reduced motion === */
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

Run: `open docs/handoffs/myblueprint-widget/career-launchpad-widget.html`

Expected: hovering a card on desktop lifts it by 2px with a soft shadow. Tabbing through with the keyboard draws a 2px blue outline around each card link. Clicking a card briefly dims it (the link will fail to open because URLs are placeholders, which is fine for the visual check).

- [ ] **Step 3: Verify reduced-motion fallback**

In Chrome DevTools, open the Rendering tab (More tools → Rendering), set "Emulate CSS media feature prefers-reduced-motion" to "reduce". Hover a card.

Expected: card does NOT lift on hover. No transitions.

- [ ] **Step 4: Commit**

```bash
git add docs/handoffs/myblueprint-widget/career-launchpad-widget.html
git commit -m "feat: add hover, focus-visible, active, disabled, and reduced-motion states"
```

---

### Task 6: Add the carousel JavaScript IIFE

**Files:**
- Modify: `docs/handoffs/myblueprint-widget/career-launchpad-widget.html`

- [ ] **Step 1: Replace the `/* IIFE goes here in Task 6 */` line in the `<script>` block with the full IIFE**

Replace that exact line with:

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
  let activeIndex = 0;

  function goTo(i) {
    activeIndex = Math.max(0, Math.min(cards.length - 1, i));
    track.scrollTo({ left: activeIndex * track.clientWidth, behavior: 'smooth' });
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

  let scrollTimer;
  track.addEventListener('scroll', function () {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(function () {
      const i = Math.round(track.scrollLeft / track.clientWidth);
      if (i !== activeIndex) goTo(i);
    }, 80);
  });

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
- Page loads showing card 1, left arrow is `disabled` (greyed out), dot 1 is active (filled blue, wider).
- Click the right arrow: carousel smooth-scrolls to card 2, dot 2 becomes active, left arrow becomes enabled.
- Click right again: scrolls to card 3, right arrow becomes `disabled`.
- Click left arrow: scrolls back to card 2.
- Tap directly on a dot: scrolls to that card.
- Swipe / drag the carousel manually: active dot and arrow-disabled state update after the scroll settles (~80ms).
- Resize the window from 375px up to 1440px: layout switches to desktop grid, no leftover horizontal offset.

- [ ] **Step 3: Commit**

```bash
git add docs/handoffs/myblueprint-widget/career-launchpad-widget.html
git commit -m "feat: add carousel IIFE for arrow, dot, swipe, and resize handling"
```

---

### Task 7: Generate the placeholder QR code and embed as base64

**Files:**
- Modify: `docs/handoffs/myblueprint-widget/career-launchpad-widget.html`

- [ ] **Step 1: Generate a QR PNG for the launchpad root URL**

Run: `npx --yes qrcode "https://launchpad.myblueprint.ca/" -o /tmp/cl-qr.png -w 512`

Expected: `/tmp/cl-qr.png` exists. Open it once to confirm it's a valid QR that scans to the URL: `open /tmp/cl-qr.png`.

- [ ] **Step 2: Base64-encode the PNG into a clipboard-ready data URI**

Run:

```bash
printf 'data:image/png;base64,' > /tmp/cl-qr.b64
base64 -i /tmp/cl-qr.png | tr -d '\n' >> /tmp/cl-qr.b64
echo "" >> /tmp/cl-qr.b64
wc -c /tmp/cl-qr.b64
```

Expected: file size around 2–6 KB depending on QR complexity.

- [ ] **Step 3: Replace the `[QR_BASE64_PLACEHOLDER]` token in the HTML file with the data URI**

Open `/tmp/cl-qr.b64` in your editor, copy the entire one-line data URI string, and replace the literal text `[QR_BASE64_PLACEHOLDER]` in `docs/handoffs/myblueprint-widget/career-launchpad-widget.html` with that string.

Alternatively, do it in one command (zsh/bash):

```bash
QR_URI=$(cat /tmp/cl-qr.b64 | tr -d '\n')
# macOS sed:
sed -i '' "s|\[QR_BASE64_PLACEHOLDER\]|${QR_URI}|" docs/handoffs/myblueprint-widget/career-launchpad-widget.html
```

- [ ] **Step 4: Open in browser and verify the QR card renders**

Run: `open docs/handoffs/myblueprint-widget/career-launchpad-widget.html`

Expected: card 3 now shows a real QR code (square, contained inside white padding). Scanning it with a phone opens `https://launchpad.myblueprint.ca/` (or whatever the launchpad currently serves at that URL).

- [ ] **Step 5: Commit**

```bash
git add docs/handoffs/myblueprint-widget/career-launchpad-widget.html
git commit -m "feat: embed QR code as base64 data URI on card 3"
```

---

### Task 8: Replace remaining placeholder URLs with stand-in preview content

The four `[VIDEO_URL_*]` / `[THUMB_*_URL]` / `[video title]` / `[Card N label]` placeholders stay as placeholders in the **shipped** file (Damian fills them in before sending to Wilston, per follow-up rows 2–4 in the spec). But for the screenshot-and-handoff preview, swap in temporary stand-in content so the screenshots are not visually broken.

**Files:**
- Modify: `docs/handoffs/myblueprint-widget/career-launchpad-widget.html`

- [ ] **Step 1: Find two safe-to-use placeholder image URLs**

Use Unsplash's source endpoint (no signup, no API key) to grab two thematically relevant images for the screenshot only. Final shipped widget will use real myBlueprint-hosted thumbnails.

```
THUMB_1: https://source.unsplash.com/featured/640x360/?career,canada
THUMB_2: https://source.unsplash.com/featured/640x360/?student,workplace
```

These are stand-ins for the preview screenshots only. Do not ship the file with these — they are unstable URLs.

- [ ] **Step 2: Replace the placeholder image and copy strings in the HTML file**

In `docs/handoffs/myblueprint-widget/career-launchpad-widget.html`, replace:

| Placeholder | Stand-in value |
|---|---|
| `[VIDEO_URL_1]` | `https://launchpad.myblueprint.ca/` (temporary) |
| `[THUMB_1_URL]` | `https://source.unsplash.com/featured/640x360/?career,canada` |
| `alt="Watch: [video title]"` (first instance) | `alt="Watch: Day in the life of a Canadian UX researcher"` |
| `[Card 1 label]` | `Day in the Life: UX Research` |
| `[VIDEO_URL_2]` | `https://launchpad.myblueprint.ca/` (temporary) |
| `[THUMB_2_URL]` | `https://source.unsplash.com/featured/640x360/?student,workplace` |
| `alt="Watch: [video title]"` (second instance) | `alt="Watch: How I got into emerging tech careers"` |
| `[Card 2 label]` | `How I Got Here: Emerging Tech` |

- [ ] **Step 3: Open in browser at 1440px and verify all three cards render with content**

Run: `open docs/handoffs/myblueprint-widget/career-launchpad-widget.html`

Expected: card 1 and card 2 show real images, card 3 shows the QR. All three have labels. No broken-image icons.

- [ ] **Step 4: Commit (and mark this as preview-only)**

```bash
git add docs/handoffs/myblueprint-widget/career-launchpad-widget.html
git commit -m "chore: insert temporary preview content for screenshot capture only

These Unsplash URLs and copy strings are stand-ins for the screenshots
in Task 13. They MUST be reverted to bracketed placeholders before
the file is sent to Wilston (Task 15)."
```

---

### Task 9: Verify desktop view at 1440px

**Files:** (verification only, no edits expected unless a defect is found)

- [ ] **Step 1: Open the file in Chrome at 1440px viewport**

Run: `open docs/handoffs/myblueprint-widget/career-launchpad-widget.html`. Resize the window or use Chrome DevTools "Responsive" mode at 1440 × 900.

- [ ] **Step 2: Run the desktop verification checklist**

Confirm each item; if any fails, note the defect and fix before committing.

- White rounded container with the section heading "Career LaunchPAD" and the tagline below it.
- Three cards in a single row with equal widths (1fr each).
- Card 1 and card 2 are 16:9 image cards with a label strip below.
- Card 3 (QR) is square, the QR sits centered with padding around it, label is "Ticket to Your Phone".
- No arrows or dots are visible.
- Hovering any card lifts it 2px and shows a soft shadow.
- Tabbing through the page draws a 2px blue (#0092ff) focus outline on each card link, then on the (hidden) buttons in DOM order.

- [ ] **Step 3: If any defect found, fix in the HTML/CSS, then commit**

```bash
git add docs/handoffs/myblueprint-widget/career-launchpad-widget.html
git commit -m "fix: <specific defect description>"
```

If no defects, no commit is needed.

---

### Task 10: Verify mobile view at 375px

**Files:** (verification only, no edits expected unless a defect is found)

- [ ] **Step 1: Switch to mobile viewport**

In Chrome DevTools, toggle device emulation and set the viewport to iPhone SE / 375 × 667. Reload the page.

- [ ] **Step 2: Run the mobile verification checklist**

- White rounded container fills the available width with 16px horizontal padding.
- Only card 1 is visible; the others are off-screen to the right.
- Below the card: a row with left arrow (disabled, dimmed), three dots (dot 1 active and wider/blue), right arrow.
- Tap or click the right arrow: smooth scroll to card 2. Dot 2 becomes active. Left arrow becomes enabled.
- Tap the right arrow again: smooth scroll to card 3 (QR). Right arrow becomes disabled.
- Tap directly on dot 1: smooth scroll back to card 1.
- Touch-drag horizontally on the carousel: snaps to the nearest card. The active dot and arrow-disabled state update after the swipe settles.
- Resize the viewport back to 1440px: layout switches to the desktop grid with no leftover horizontal offset, controls disappear.

- [ ] **Step 3: If any defect found, fix and commit**

```bash
git add docs/handoffs/myblueprint-widget/career-launchpad-widget.html
git commit -m "fix: <specific defect description>"
```

---

### Task 11: Keyboard and screen-reader verification

**Files:** (verification only, no edits expected unless a defect is found)

- [ ] **Step 1: Keyboard-only pass at 375px**

With DevTools at 375px viewport and the page focused, press Tab repeatedly from the address bar.

Expected focus order:
1. Card 1 link (blue outline around the entire card)
2. Card 2 link
3. Card 3 link
4. Previous arrow (skipped when disabled — confirm browser behavior)
5. Dot 1
6. Dot 2
7. Dot 3
8. Next arrow

Press Enter on the next arrow: page scrolls to card 2. Press Tab from a card link — it does not get trapped. Press Shift+Tab to walk back.

- [ ] **Step 2: Screen-reader pass (VoiceOver on macOS)**

Run: `Cmd+F5` to enable VoiceOver, then navigate the widget.

Expected announcements:
- Heading "Career LaunchPAD, heading level 2".
- For each card link: image alt text followed by the label (e.g. "Watch: Day in the life of a Canadian UX researcher, Day in the Life: UX Research, link").
- For the QR card: the alt text spells out the URL (e.g. "QR code linking to Career LaunchPAD. URL: https://launchpad.myblueprint.ca/ — scan or open on your phone to continue.").
- Buttons announce by their `aria-label`: "Previous card, button, dimmed" (when disabled), "Go to card 1, button, pressed", etc.
- After clicking the next arrow: VoiceOver announces "Card 2 of 3" from the live region.

- [ ] **Step 3: prefers-reduced-motion pass**

In DevTools Rendering panel, set "Emulate CSS media feature prefers-reduced-motion" to "reduce". Click the next arrow.

Expected: carousel jumps to the next card with no smooth animation. Hover does not animate.

- [ ] **Step 4: If any defect found, fix and commit**

```bash
git add docs/handoffs/myblueprint-widget/career-launchpad-widget.html
git commit -m "fix: <specific a11y defect description>"
```

---

### Task 12: Validate HTML markup

**Files:** (verification only, may produce fixes)

- [ ] **Step 1: Run html-validate against the file**

Run: `npx --yes html-validate docs/handoffs/myblueprint-widget/career-launchpad-widget.html`

Expected: `[no issues found]` or zero errors. If warnings appear, evaluate each one:
- "void-content" warnings on `<img>`: ignore — modern HTML5 is fine without self-closing slashes.
- Errors about missing labels, invalid ARIA, or duplicate IDs: must be fixed before commit.

- [ ] **Step 2: Fix any errors and re-run**

If errors are reported, edit the file to address them and re-run html-validate until clean.

- [ ] **Step 3: Commit any fixes**

```bash
git add docs/handoffs/myblueprint-widget/career-launchpad-widget.html
git commit -m "fix: resolve html-validate errors"
```

If no fixes were needed, skip the commit.

---

### Task 13: Capture preview screenshots

**Files:**
- Create: `docs/handoffs/myblueprint-widget/preview/desktop.png`
- Create: `docs/handoffs/myblueprint-widget/preview/mobile.png`

- [ ] **Step 1: Capture desktop screenshot at 1440px**

Open the file in Chrome at 1440 × 900 viewport. Use Chrome's built-in screenshot:
1. Open DevTools (Cmd+Opt+I).
2. Open Command Menu (Cmd+Shift+P).
3. Type "Capture full size screenshot" and run it.
4. Move the downloaded PNG to `docs/handoffs/myblueprint-widget/preview/desktop.png`.

Alternative (macOS native): Cmd+Shift+4, then Space, then click the window. Save and rename to `desktop.png`.

- [ ] **Step 2: Capture mobile screenshot at 375px**

In DevTools, set viewport to 375 × 812 (iPhone SE). Use Command Menu → "Capture screenshot" (not full-size — viewport only). Save as `docs/handoffs/myblueprint-widget/preview/mobile.png`.

- [ ] **Step 3: Visually confirm both screenshots match the spec**

Open each PNG. The desktop screenshot should show the 3-column grid with QR card. The mobile screenshot should show one card with arrows + dots below.

- [ ] **Step 4: Commit**

```bash
git add docs/handoffs/myblueprint-widget/preview/desktop.png docs/handoffs/myblueprint-widget/preview/mobile.png
git commit -m "docs: add desktop and mobile preview screenshots"
```

---

### Task 14: Write the README

**Files:**
- Create: `docs/handoffs/myblueprint-widget/README.md`

- [ ] **Step 1: Write the README contents**

Create `docs/handoffs/myblueprint-widget/README.md` with:

````markdown
# Career LaunchPAD Widget — Handoff to myBlueprint

Self-contained HTML/CSS/JS widget for the myBlueprint student dashboard.
Drives traffic to the public Career LaunchPAD site at https://launchpad.myblueprint.ca/.

**Contact:** Damian Matheson (damian.matheson@myblueprint.ca)
**Companion spec:** [../../superpowers/specs/2026-05-14-content-hub-widget-design.md](../../superpowers/specs/2026-05-14-content-hub-widget-design.md)

## What this is

A single HTML file with inline `<style>` and inline `<script>`. Three image cards
linking to external URLs that open in a new tab. v1 is intentionally static — no API,
no database, no live content pull. Images and links rotate manually.

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
4. **Replace the bracketed placeholders** with real URLs and copy:
   - `[VIDEO_URL_1]`, `[VIDEO_URL_2]` — `href` targets for the two thumbnail cards
   - `[THUMB_1_URL]`, `[THUMB_2_URL]` — image URLs hosted at a stable myBlueprint asset path
   - `[video title]` (×2) — descriptive alt text inside `Watch: ` prefix
   - `[Card 1 label]`, `[Card 2 label]` — visible text below each thumbnail

## The 3 URLs

| Card | Link target | Image source |
|---|---|---|
| 1 | Specific launchpad video (placeholder: `[VIDEO_URL_1]`) | Hosted JPG/PNG at myBlueprint CDN |
| 2 | Specific launchpad video (placeholder: `[VIDEO_URL_2]`) | Hosted JPG/PNG at myBlueprint CDN |
| 3 (QR) | `https://launchpad.myblueprint.ca/` | Inline base64 PNG, baked into the HTML |

## Card 3 swappability

Card 3 ships in QR mode (`.cl-card--qr` modifier, base64 inline image). To swap
to a regular thumbnail:

1. Remove the `cl-card--qr` class from the third `<li>`.
2. Replace the `<img src="data:image/png;base64,…">` with `<img src="https://your-cdn/...jpg">`.
3. Update the `alt` text to describe the new image (not the QR URL).
4. Update the `<a href="...">` to point at the new destination.
5. Update the `<span class="cl-card__label">` text.

To swap back to QR mode: reverse the above. The QR image must be regenerated from
the desired URL using a QR encoder (e.g. `npx qrcode <url> -o file.png -w 512`)
and base64-encoded.

## How to rotate thumbnails

1. Generate a new image at the same dimensions (recommended: 1280 × 720, 16:9).
2. Replace the file at the same hosted URL (e.g. overwrite `thumb-1.jpg`).
3. Browser cache may need a hard refresh.
4. Update the `alt` text in the React component if the title changes.

## Accessibility

The widget meets WCAG 2.1 AA on:
- Alt text on every image (QR alt includes the encoded URL in plain text).
- Keyboard navigation: every card and control is reachable, tab order is logical.
- 2px focus-visible outline in myBlueprint primary blue.
- `aria-live="polite"` announcer for carousel position changes.
- `prefers-reduced-motion: reduce` disables animations.

## Browser support

- Chrome / Edge 110+
- Safari 15.4+
- Firefox 110+
- iOS Safari 15.4+
- Android Chrome 110+

Older Safari: scroll-snap works but `behavior: 'smooth'` is ignored — carousel
jumps between cards instead of animating. Acceptable degraded behavior.

## Preview

See `preview/desktop.png` and `preview/mobile.png` in this directory.

> **Note:** The preview screenshots use temporary Unsplash images and stub copy.
> The shipped HTML file contains bracketed placeholders that must be replaced.
````

- [ ] **Step 2: Commit**

```bash
git add docs/handoffs/myblueprint-widget/README.md
git commit -m "docs: add handoff README with contract and integration steps"
```

---

### Task 15: Revert preview content to placeholders and run final pre-send check

**Files:**
- Modify: `docs/handoffs/myblueprint-widget/career-launchpad-widget.html`

- [ ] **Step 1: Revert the Task 8 stand-in values back to bracketed placeholders**

Re-replace the stand-in copy with placeholders so the shipped file matches the contract:

| Stand-in value | Placeholder |
|---|---|
| `href="https://launchpad.myblueprint.ca/"` (on cards 1 and 2, NOT card 3) | `href="[VIDEO_URL_1]"` and `href="[VIDEO_URL_2]"` |
| `src="https://source.unsplash.com/featured/640x360/?career,canada"` | `src="[THUMB_1_URL]"` |
| `alt="Watch: Day in the life of a Canadian UX researcher"` | `alt="Watch: [video title]"` |
| `Day in the Life: UX Research` | `[Card 1 label]` |
| `src="https://source.unsplash.com/featured/640x360/?student,workplace"` | `src="[THUMB_2_URL]"` |
| `alt="Watch: How I got into emerging tech careers"` | `alt="Watch: [video title]"` |
| `How I Got Here: Emerging Tech` | `[Card 2 label]` |

The QR card's `href` (`https://launchpad.myblueprint.ca/`), alt text, base64 image, and label (`Ticket to Your Phone`) all stay as-is — those are real shipped values.

- [ ] **Step 2: Re-run html-validate**

Run: `npx --yes html-validate docs/handoffs/myblueprint-widget/career-launchpad-widget.html`

Expected: zero errors.

- [ ] **Step 3: Confirm zero external `<script src>` or `<link rel="stylesheet">` references**

Run: `grep -E 'src=|href=' docs/handoffs/myblueprint-widget/career-launchpad-widget.html | grep -E '(\.js|\.css|cdn)' || echo "OK - no external resource refs"`

Expected: `OK - no external resource refs`.

- [ ] **Step 4: Confirm all bracketed placeholders are present**

Run: `grep -oE '\[[A-Z_0-9]+\]|\[(video title|Card [0-9] label)\]' docs/handoffs/myblueprint-widget/career-launchpad-widget.html | sort -u`

Expected output:

```
[Card 1 label]
[Card 2 label]
[THUMB_1_URL]
[THUMB_2_URL]
[VIDEO_URL_1]
[VIDEO_URL_2]
[video title]
```

If any are missing, the revert in Step 1 was incomplete — fix and re-check.

- [ ] **Step 5: Commit final state**

```bash
git add docs/handoffs/myblueprint-widget/career-launchpad-widget.html
git commit -m "chore: revert preview stand-ins to placeholders for handoff"
```

- [ ] **Step 6: Verify the deliverable bundle**

Run: `ls -la docs/handoffs/myblueprint-widget/`

Expected files:
- `career-launchpad-widget.html` — final, with placeholders
- `README.md`
- `preview/desktop.png`
- `preview/mobile.png`

The bundle is ready to send to Wilston. Final pre-send action (manual): Damian fills in the 7 placeholders with real content before forwarding.

---

## Self-Review Notes

**Spec coverage check:**
- Decisions table (8 rows) — all covered: rows 1–2 (Tasks 2, 7, 8, 15), row 3 (Task 3), row 4 (Tasks 4, 6, 10), row 5 (Task 6), row 6 (Tasks 2, 7), row 7 (Task 5), row 8 (Tasks 5, 11).
- Markup section — Task 2.
- Layout section — Tasks 3, 4.
- Behavior (JS) — Task 6.
- Accessibility — Tasks 2 (markup), 5 (focus-visible), 11 (verification).
- States — Task 5.
- Handoff format (file bundle, header comment) — Tasks 1, 13, 14.
- Content rotation playbook — Task 14 (README).
- Verification checklist — Tasks 9, 10, 11, 12, 15.
- Browser support note — Task 14 (README).

No spec gaps.

**Placeholder scan:** All `[BRACKETS]` in the plan are intentional handoff placeholders, not plan-author shortcuts. No "TBD" / "TODO" / "appropriate" / "similar to Task N" patterns present.

**Type consistency:** CSS class names (`.cl-widget`, `.cl-card`, `.cl-card--qr`, `.cl-widget__track`, `.cl-widget__controls`, `.cl-widget__header`, `.cl-arrow`, `.cl-arrow--prev`, `.cl-arrow--next`, `.cl-dot`, `.cl-sr-announce`, `.cl-card__label`) are identical across all tasks. JS variable names (`widget`, `track`, `cards`, `dots`, `prev`, `next`, `announcer`, `activeIndex`, `goTo`) are consistent. Placeholder tokens (`[VIDEO_URL_1]`, `[VIDEO_URL_2]`, `[THUMB_1_URL]`, `[THUMB_2_URL]`, `[QR_BASE64_PLACEHOLDER]`, `[video title]`, `[Card N label]`) appear in the same form in Tasks 2, 8, and 15.
