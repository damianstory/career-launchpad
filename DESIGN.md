---
name: Career LaunchPAD
description: A student-first career discovery layer for the myBlueprint moments where future decisions already start.
colors:
  signal-blue: "#0092ff"
  signal-blue-deep: "#0082e5"
  soft-sky: "#c6e7ff"
  pale-sky: "#e6f4ff"
  anchor-navy: "#22224c"
  slate-deep: "#252a33"
  slate-ink: "#485163"
  slate-body: "#65738b"
  slate-echo: "#aab7cb"
  slate-frame-mid: "#d9dfea"
  slate-frame-light: "#e5e9f1"
  studio-off-white: "#f6f6ff"
  pure-white: "#ffffff"
typography:
  headline:
    fontFamily: "Open Sans, Museo Sans, system-ui, sans-serif"
    fontSize: "32px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Open Sans, Museo Sans, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "normal"
  body:
    fontFamily: "Open Sans, Museo Sans, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  body-tight:
    fontFamily: "Open Sans, Museo Sans, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Open Sans, Museo Sans, system-ui, sans-serif"
    fontSize: "10px"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "0.08em"
rounded:
  sm: "4px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  pill: "9999px"
spacing:
  xs: "8px"
  sm: "16px"
  md: "24px"
  lg: "32px"
  xl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.signal-blue}"
    textColor: "{colors.pure-white}"
    rounded: "{rounded.pill}"
    padding: "12px 20px"
    typography: "{typography.label}"
  button-primary-hover:
    backgroundColor: "{colors.signal-blue-deep}"
    textColor: "{colors.pure-white}"
    rounded: "{rounded.pill}"
    padding: "12px 20px"
  button-outbound:
    backgroundColor: "{colors.anchor-navy}"
    textColor: "{colors.pure-white}"
    rounded: "{rounded.pill}"
    padding: "0 15px"
    height: "42px"
  button-pill-outline:
    backgroundColor: "{colors.pure-white}"
    textColor: "{colors.anchor-navy}"
    rounded: "{rounded.pill}"
    padding: "0 12px"
    height: "34px"
  card-content:
    backgroundColor: "{colors.studio-off-white}"
    textColor: "{colors.anchor-navy}"
    rounded: "{rounded.lg}"
    padding: "14px"
  callout-takeaway:
    backgroundColor: "{colors.pale-sky}"
    textColor: "{colors.anchor-navy}"
    rounded: "{rounded.xl}"
    padding: "18px"
  badge-step:
    backgroundColor: "{colors.signal-blue}"
    textColor: "{colors.pure-white}"
    rounded: "{rounded.pill}"
    width: "30px"
    height: "30px"
---

# Design System: Career LaunchPAD

## 1. Overview

**Creative North Star: "The Lit Switchboard"**

Career LaunchPAD is a switchboard of possibilities, lit up. The stage is **Studio Off-White** (#f6f6ff) — bright, calm, low-commitment — anchored by **Anchor Navy** (#22224c) as the steady ink and inverse surface. **Signal Blue** (#0092ff) is the spark: a single accent that lights up the active path, marking the "this connects to that" moment for a student moving through content. The palette is small, the chrome is quiet, and the content is loud.

The system serves a student who is browsing ambiently inside myBlueprint, not arriving with intent. It must earn attention without demanding it: typography-forward, generously spaced, flat at rest, and confident on press. Motion is responsive — buttons lift on hover, the learn-more sheet rises from the bottom of the viewport — but never choreographed for its own sake. Reduced-motion preferences are honored at the keyframe level, not as an afterthought.

This system explicitly rejects the LMS / school-software aesthetic (heavy chrome, dense sidebars, gray-on-gray data tables), the Government-of-Canada portal stuffiness, the SaaS-dashboard cliché (purple-blue gradients, hero-metric templates, identical icon-card grids, Inter everywhere), and the corporate career site framing (sponsored cards, profile-first CTAs). Career LaunchPAD is content-first, not a dashboard; exploration, not job-hunting; current, not commemorative.

**Key Characteristics:**

- Off-white stage, navy ink, single signal-blue accent — disciplined three-color palette.
- Open Sans across every register, leaning on weight (300–900) and case (uppercase 10/11px labels) for hierarchy instead of multiple type families.
- 8px spacing grid; 4 / 8 / 12 / 16 / 9999 (pill) radii.
- Flat at rest, lifted on intent — shadow is a state signal, not decoration.
- Pill-shaped CTAs with bold focus halos; uppercase 10–11px label chips for category and format metadata.
- Bottom-anchored learn-more sheet as the one true overlay surface.

## 2. Colors: The Switchboard Palette

A disciplined three-color system on a tinted-neutral ramp. Restrained color strategy: tinted neutrals carry most of the surface, **Signal Blue** is reserved for ≤10% of any given screen.

### Primary

- **Signal Blue** (`#0092ff`): The single accent. Used on the primary CTA fill, the active step badge, the focus halo (6px ring on the learn-more CTA), the play marker on video posters, and the metadata "format" label color. When Signal Blue appears, it means "this is where to go next" — never decorative.
- **Signal Blue Deep** (`#0082e5`): Hover state for Signal Blue surfaces. Appears only on press-target color shifts; never on resting elements.

### Secondary

- **Soft Sky** (`#c6e7ff`): Accent-weak. Used as a tinted wash behind quotes or supporting context. Never as a primary CTA color.
- **Pale Sky** (`#e6f4ff`): The callout-takeaway tile fill. Soft enough to nest under body text without competing for attention.

### Neutral

The neutral ramp is tinted toward the brand navy hue — never pure gray, never pure black, never pure white in body copy.

- **Anchor Navy** (`#22224c`): Primary text on light surfaces, page-level wordmark, dark inverse fills (outbound buttons, learn-more-step badge ring color). The brand's gravity.
- **Slate Deep** (`#252a33`): Reserved for the deepest neutral wells (rarely used; appears as `--neutral-6` in tokens).
- **Slate Ink** (`#485163`): Secondary text. Card metadata, label chips that aren't accenting (category labels), section heads.
- **Slate Body** (`#65738b`): Tertiary text. Captions, muted metadata, time/duration, related-card arrow chevrons.
- **Slate Echo** (`#aab7cb`): Muted foreground; used for placeholder text, supporting borders that need presence (`border-strong`).
- **Slate Frame Mid** (`#d9dfea`): Default border (`--border-1`), used on action button outlines, learn-more header rule, related-card outlines.
- **Slate Frame Light** (`#e5e9f1`): Soft border (`--border-2`), used on step tiles and large surface dividers.
- **Studio Off-White** (`#f6f6ff`): The stage. Page background, step-tile fill, related-card fill — the system's resting plane.
- **Pure White** (`#ffffff`): Card surface, learn-more sheet body, action-button hovered state.

### Named Rules

**The One Spark Rule.** Signal Blue covers ≤10% of any rendered screen. If a comp shows blue on more than one CTA per fold, the second one is wrong. Active states win over decorative ones.

**The No-Pure-Neutrals Rule.** Never `#000` and never `#fff` for text or large surfaces. Studio Off-White carries page background; Pure White is reserved for elevated card surfaces. Anchor Navy carries body ink; Slate Ink and below carry secondary copy.

**The Tinted-Border Rule.** Every border is on the navy-hue ramp (Slate Frame Light through Slate Echo). Never a chromaless gray. Never a colored side-stripe.

## 3. Typography: One Family, Many Voices

**Display Font:** Open Sans (with Museo Sans fallback for legacy myBlueprint contexts, then `system-ui`)
**Body Font:** Open Sans
**Mono:** `ui-monospace, 'SF Mono', Menlo, Consolas` (utility only; not used in product surfaces)

**Character:** Open Sans does all the work. Hierarchy comes from weight contrast (300 / 400 / 500 / 700 / 800 / 900) and case (uppercase 10–11px labels at 0.08–0.12em letter-spacing). The result is a single voice that adjusts volume rather than switching speakers — quietly confident, never typographically theatrical.

### Hierarchy

- **Headline** (700, 32px, 1.2): Page-level titles. Used sparingly; most surfaces lead with content thumbnails or video posters rather than typographic heroes.
- **Title** (700, 20px, 1.3): Content card titles, learn-more dialog primary heading.
- **Body** (400, 16px, 1.58–1.62): Long-form description, learn-more body paragraphs. Cap at 65–75ch on wide viewports.
- **Body Tight** (400, 14px, 1.5): Step copy, related-card titles, dense list items.
- **Label** (800, 10–11px, 0.08–0.12em, uppercase): Format chips, category chips, takeaway eyebrows, section heads inside the learn-more sheet. The signature typographic pattern of the system.

### Named Rules

**The Uppercase-Label Rule.** Metadata chips (format, category, eyebrow, section head) are always uppercase, 10 or 11px, 800 weight, 0.08–0.12em letter-spacing. They earn their density by being short, regular, and never used for sentences. Sentence-case at this size is forbidden — it reads as small body copy and breaks the rhythm.

**The Weight-Over-Family Rule.** Hierarchy is achieved by weight (and occasionally case) within Open Sans. A second display family is forbidden. Prefer 800/900 weight contrast with 400/500 over reaching for a serif.

## 4. Elevation: Flat by Default, Lifted on Intent

Surfaces are flat at rest. Cards, chips, the navigation rail, the stage itself: all sit on Studio Off-White or Pure White with a tinted border, no shadow. Elevation is reserved for moments of intent — a hovered CTA, an opened sheet, an active overlay. Shadow is a state, not a layer.

The system ships four shadow primitives, but in practice only two are deployed on resting surfaces (the deep upward-cast on the learn-more sheet, and the focus-halo on the primary CTA). The remaining levels are available for future hover/depth needs but should be reached for sparingly.

### Shadow Vocabulary

- **shadow-sm** (`0 1px 2px rgba(34, 34, 76, 0.05)`): Reserved for future use; default surfaces ship without it.
- **shadow-md** (`0 4px 6px rgba(34, 34, 76, 0.10)`): Mid-elevation, available for floating popovers if added later.
- **shadow-lg** (`0 10px 15px rgba(34, 34, 76, 0.15)`): Reserved for dropdowns, menus, and elevated tiles.
- **shadow-glow-blue** (`0 0 30px rgba(0, 146, 255, 0.30)`): The signal-blue presence. Reserved for moments where attention is being claimed (active video poster play marker, feature CTA emphasis). Use rarely.
- **shadow-sheet-up** (`0 -24px 70px rgba(8, 8, 26, 0.28)`): Custom upward-cast on the learn-more bottom sheet; the only application of an upward shadow in the system.
- **shadow-poster** (`0 14px 32px rgba(34, 34, 76, 0.18)`): The video-poster tile shadow inside the learn-more sheet; gives the 9:16 thumbnail a paper-on-table quality.
- **focus-halo** (`0 0 0 6px var(--primary-blue)`): The primary CTA's focus state. A wide solid ring that owns its own space. Bold and unmistakable.

### Named Rules

**The Flat-By-Default Rule.** New components ship with no shadow. If a designer wants to elevate a card, the question is: is this currently the focus, or is it just a card? If it's just a card, it stays flat.

**The Up-Cast Exception.** The learn-more sheet is the only surface that casts a shadow upward. Every other elevation goes downward. Don't add new up-cast surfaces.

## 5. Components

### Buttons

- **Shape:** Pill (`9999px`) on every CTA without exception. No rounded-rectangles, no square corners.
- **Primary CTA** (Signal Blue fill, Pure White text, 12–18px / 800 weight): Lifts 1px on hover (`translateY(-1px)`), brightens 4% (`filter: brightness(1.04)`), shadow deepens. Inset 1px white border (42% alpha) keeps the button readable on photographic backgrounds. On focus, gains a 6px Signal Blue halo plus a 2px white inner outline. On active, settles back to Y0 in 60ms.
- **Outbound Button** (Anchor Navy fill, Pure White text, 14px / 800 weight, 42px height): Used when leaving Career LaunchPAD or descending into an authoritative source. Deeper, more committed than the primary CTA — signals "you are leaving" without a confrontational arrow.
- **Pill Outline Button** (Pure White or transparent fill, Anchor Navy text, 1px Slate Frame Mid border, 12px / 800 weight, 34px height): Secondary actions inside the learn-more sheet (Save, Share). Becomes filled (Signal Blue + Pure White) when toggled active via `[data-active='true']`.
- **Pill Icon Button** (34×34, 1px Slate Frame Mid border, 999px radius, transparent fill at rest): Same family as the outline button but icon-only. Same active-state treatment.

### Chips & Labels

- **Format / Category / Eyebrow Chips:** Uppercase 10–11px, 800 weight, 0.08–0.12em letter-spacing, 5px gap to icon. Format chip uses Signal Blue color; category chip uses Slate Ink; muted chip uses Slate Body. No background fill, no border — they are typographic, not container-shaped.

### Cards & Tiles

- **Content / Step / Related Card:**
  - **Corner Style:** `12px` (`--radius-lg`).
  - **Background:** Studio Off-White (`#f6f6ff`).
  - **Border:** 1px Slate Frame Light (`#e5e9f1`) — soft, present without competing.
  - **Shadow:** None at rest. (See Elevation.)
  - **Internal Padding:** `14px`.
  - **Title Style:** 14px / 700, Anchor Navy ink, 1.32 line-height.
- **Callout / Takeaway:**
  - **Corner Style:** `14–16px` (`--radius-xl`).
  - **Background:** Pale Sky (`#e6f4ff`).
  - **Border:** 1px Signal Blue at 22% alpha — the rare case where a colored border is allowed, because it tints, not stripes.
  - **Internal Padding:** `18px`.
  - **Eyebrow:** Uppercase 11px / 800 / 0.1em / Signal Blue.
  - **Body:** 16px / 700 / Anchor Navy.

### Inputs / Fields

- **Search Input** (current implementation is inline-styled in `LaunchpadApp.tsx`):
  - **Style:** Open Sans 16px, Anchor Navy ink, Slate Body placeholder, no border or 1px Slate Frame Light border, transparent or Pure White background.
  - **Icon:** Lucide `Search`, 20px, Slate Body color, leading.
  - **Focus:** Visible focus ring required (3–6px Signal Blue halo) when keyboard-focused. Don't suppress `:focus-visible`.

### Bottom Sheet (Learn-More)

The signature elevated surface of Career LaunchPAD. Not a dialog, not a modal — a sheet that rises from the bottom edge of the viewport.

- **Shape:** `18px 18px 0 0` corners on desktop (`16px 16px 0 0` mobile). Bottom edge meets the viewport with no gap.
- **Width:** `min(840px, calc(100vw - 48px))`. Centered horizontally. Below 860px viewport: full bleed.
- **Height:** `min(72dvh, 720px)` desktop; `min(88dvh, calc(100dvh - 24px))` mobile.
- **Surface:** Pure White, 1px Slate Frame Mid border on top and sides, no bottom border (it meets the viewport).
- **Shadow:** `shadow-sheet-up`. The system's only upward-cast shadow.
- **Header:** 58px tall (56px mobile), 18px horizontal padding, format/category chips + action pills, ends with a 1px Slate Frame Light bottom rule.
- **Body Padding:** `26px 26px 44px` desktop; `20px 16px 36px` mobile.
- **Entrance:** Slide-up + fade, 320ms `ease-out` (`cubic-bezier(0.16, 1, 0.3, 1)`).
- **Reduced motion:** Animation duration drops to 1ms; entrance becomes a position-stable fade. No transform.

### Overlay (Behind the Sheet)

- **Background:** `rgba(8, 8, 26, 0.58)` — deep navy-tinted black at 58% alpha.
- **Backdrop filter:** `blur(8px)`. The one place glassmorphism is allowed in the system, because it serves focus, not decoration.
- **Entrance:** Fade-in, 280ms `ease-standard`.

### Step Card (Numbered Items)

- **Layout:** Horizontal flex, 13px gap, 14px padding.
- **Surface:** Studio Off-White on Pure White, 1px Slate Frame Light border, 12px radius.
- **Number Badge:** 30×30 circle, Signal Blue fill, Pure White text, 13px / 900 weight. The most assertive single application of Signal Blue in the system.
- **Body:** 14px / 1.5, Anchor Navy on Pure White carrying inside the off-white tile.

## 6. Do's and Don'ts

### Do

- **Do** keep Signal Blue (`#0092ff`) at ≤10% of any rendered screen. Reserve it for the primary action, the active focus halo, the play marker, and the format chip color.
- **Do** use Open Sans for everything. Reach for weight (300–900) and case (UPPERCASE 10–11px labels at 0.08–0.12em letter-spacing) before reaching for a second family.
- **Do** pill-shape every button (`border-radius: 9999px`). Rectangles are reserved for cards and tiles.
- **Do** ship surfaces flat by default. Add shadow only when something is actively elevated (sheet, hovered CTA, focus halo).
- **Do** tint every neutral toward the navy hue ramp. Borders are Slate Frame Light / Mid / Echo, never chromaless gray.
- **Do** honor `prefers-reduced-motion` at the keyframe level. The learn-more sheet entrance already does this — every new animation must too.
- **Do** put the focus ring on every interactive element. The 6px Signal Blue halo on the primary CTA is the reference. Never `outline: none` without a replacement.
- **Do** lead with content (videos, articles, real Canadians). The UI scaffolds the content; it is not the hero.

### Don't

- **Don't** use `#000` or `#fff` for body text or large surfaces. Studio Off-White and Anchor Navy are the closest you go.
- **Don't** ship a purple-to-blue SaaS gradient. The system has one accent; the only "gradient" is the focus halo on the primary CTA, and it isn't really a gradient.
- **Don't** stack identical icon-card grids ("hero-metric template" or "feature-grid SaaS"). Career LaunchPAD is content-first; varied tiles beat a uniform grid.
- **Don't** introduce a serif display family. The Weight-Over-Family Rule is a hard line.
- **Don't** use `border-left` or `border-right` greater than 1px as a colored stripe accent. Side-stripes are an absolute ban — see the Tinted-Border Rule for the alternative.
- **Don't** apply Inter, system-default sans, or any non-Open-Sans face to ship. Inter is a flag for AI slop in this register.
- **Don't** reach for glassmorphism outside the learn-more overlay. The 8px backdrop-blur on the sheet wash is the only blurred surface in the system.
- **Don't** stage the Government-of-Canada / Service Canada aesthetic — dense forms, gray-on-gray tables, "official" framing. This is exploration software, not a portal.
- **Don't** lean on red maple leaves, mountain photography, or hockey imagery to signal "Canadian." Trust through specificity (real names, schools, employers) earns it instead.
- **Don't** use bounce / elastic easing. Easing is `ease-out` (`cubic-bezier(0.16, 1, 0.3, 1)`) or `ease-standard` (`cubic-bezier(0.4, 0, 0.2, 1)`). Never spring overshoot.
- **Don't** animate CSS layout properties (top, left, width, height). Use transform for entrances, opacity for fades.
- **Don't** force students through pop-ups, mandatory sign-ups, or completion-guilt UI. The system earns attention; it doesn't extract it.
