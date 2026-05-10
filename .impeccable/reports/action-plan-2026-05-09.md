---
title: Career LaunchPAD — Pre-Conference Action Plan
date: 2026-05-09
conference: 2026-05-28 (Skills Canada)
sources:
  - .impeccable/reports/audit-2026-05-09.md
  - .impeccable/reports/critique-2026-05-09.md
priority_order: cognitive load → spec compliance → accessibility
user_marked_sacred:
  - 9-chip category rail (keep all 9 visible)
  - Floating action rail (Save/Share/Info icons in thumb zone)
deferred_per_user_instruction:
  - $impeccable harden
  - $impeccable polish
  - $impeccable live
---

# Pre-Conference Action Plan

19 days until Skills Canada. Combined audit (10/20) and critique (26/40) turned up **22 actionable findings between them.** This plan filters and orders them per your priorities: cognitive-load fixes first, then spec compliance, then the accessibility items that don't require deferred commands.

The two reports converged independently on the same top-tier issues (side-stripe at `LaunchpadApp.tsx:1080`, glassmorphism creep, hard-coded color constants), so those are the highest-confidence fixes.

---

## Immediate batch — run before the conference

### 1. `$impeccable distill` — biggest leverage, addresses both cognitive load and spec compliance

This single command resolves the largest cluster of P1 findings and lands the cluster you marked as priority 1.

**Cognitive-load alignment** (your priority 1):

- **`LaunchpadApp.tsx:1073-1075`** — Remove the `"Item N / N"` counter on the desktop hero. Critique provocative question #3 and emotional-journey notes flagged this as engagement-software grammar in a product that explicitly disowns it. The `ChevronsDown` "Scroll for more" affordance at line ~1100 already communicates "feed continues."
- **`LaunchpadApp.tsx:1522-1554`** — Drop the `ImmersiveBackdrop` (full-bleed cover image with `filter: blur(18px)` + 90° dual-vignette gradient at `opacity: 0.82`). Audit ANTI-2, critique anti-patterns verdict, and provocative question #2 all converge: this is the most visible glassmorphism violation in the system, plus it does antagonistic visual work against the sharp 9:16 media tile rendering the same image. Replacing it with a flat Studio Off-White stage is what DESIGN.md §1 actually describes ("the stage is Studio Off-White … bright, calm, low-commitment").
- **`LaunchpadApp.tsx:1548, 1827, 1942, 2094`** — Remove the decorative bottom-vignette gradients on media cards. Not in DESIGN.md's elevation vocabulary. The "darkroom gradient on every hero image" pattern.

**Spec-compliance fixes** (your priority 2):

- **`LaunchpadApp.tsx:1080`** — Remove the `borderLeft: 3px solid ${BLUE}` side-stripe on the desktop pull-quote. Audit ANTI-1, critique P1 #1, and the deterministic detector all flagged this — strongest convergent signal in either report. Replace with the in-spec eyebrow pattern: UPPERCASE 11px / 800 / 0.1em Signal-Blue eyebrow above the quote, the quote in 17px / 500 italic Anchor Navy, no border (or 1px Slate Frame Light top rule above the eyebrow). DESIGN.md §5 callout-takeaway is the alternative if you want a tile.
- **`LaunchpadApp.tsx:2163`** — Strip `backdropFilter: blur(10px)` from `FormatBadge`. Replace with a flat Anchor Navy at 80% opacity + 1px Slate Frame Mid border per DESIGN.md icon-button spec. (`DesktopRailBtn` at 2290 and `MobileRailBtn` at 2331 are part of the floating action rail you marked sacred — leave their glass intact. `SearchModal` at 2532 is a focus-claim surface that critique's Assessment A explicitly defended; defer that decision.)
- **`LaunchpadApp.tsx:58-64`** — Delete the JS color constants block (`STAGE_BG, INK, INK2, BORDER, NAVY, BLUE, SURFACE`). Replace every reference with `var(--off-white)`, `var(--navy)`, `var(--neutral-5)`, `var(--border-1)`, `var(--primary-blue)` per the existing token map in `globals.css:8-48`. Audit THEME-1, critique P1 #4. This is also the unblock for any future dark-mode pass.
- **`LaunchpadApp.tsx`** — Replace 19+ standalone `'#fff'` / `'#000'` / `'white'` literals (lines 1014, 1282, 1598, 1815, 1857, 1887, 1925, 1971, 2016, 2035, 2072, 2130, 2165, 2274, 2285, 2344, 2623, 2671, 2722) with `var(--white)` / `var(--navy)` / appropriate tokens. Audit ANTI-3 and ANTI-5. Pure white on photo overlays is contextually defensible; still make it come from a token.

**Polish item that fits this command:**

- **`LaunchpadApp.tsx:1009`** — Audit POL-1: the rotated `-2deg` category pill is fine on its own, but combined with the highlighted-title accent block and the side-stripe pull-quote, the desktop left column does three "this is editorially designed" gestures. Once the side-stripe goes, the rotation can stay or normalize — design call.

**Expected score impact:** Anti-Patterns dimension 2 → 4. Theming 1 → 3. Aesthetic and Minimalist (Nielsen #8) 3 → 4. Total audit ~10/20 → ~14/20; total critique ~26/40 → ~30/40.

---

### 2. `$impeccable clarify` — small, targeted

- **`LaunchpadApp.tsx:2593`** — Rewrite the empty-state copy to remove the em dash. PRODUCT.md voice rule: no em dashes in copy. `"No matches yet — try 'internship' or 'feedback'"` becomes `"No matches yet. Try 'internship' or 'feedback'."` or use a `·` separator.
- Sweep other student-facing strings (`LearnMorePanel.tsx`, the toast messages in `LaunchpadApp.tsx`, the empty-state button label, the search placeholders in `LaunchpadApp.tsx:904` and `2569`) for: em dashes, sentence-case where DESIGN.md asks for UPPERCASE labels, generic-clinical phrasing that fights the "curious, confident, current" personality.
- **Inconsistent search placeholder copy** (audit Minor Observations): "Search careers, skills, articles…" vs "Search careers, skills…" — pick one.

---

### 3. `$impeccable adapt` — accessibility wins that don't require `harden`

These three findings are accessibility-adjacent but map to `adapt` rather than `harden`, so they're available pre-conference.

- **Touch targets ≥ 40-44px on mobile (A11Y-3)** — Bump `learn-more-action-button` and `learn-more-icon-button` from 34px to at least 40px under `@media (max-width: 860px)` (`globals.css:271, 280`). Bump `MobileRailBtn` icon disc from 38px to 44px (`LaunchpadApp.tsx:2326`). Confirm the 8px adjacency padding remains. Desktop can keep 34px.
- **`100vh` → `100dvh` (RESP-2)** — `LaunchpadApp.tsx:864, 1163` use `height: '100vh'` on `DesktopStage` and `MobileStage`. iOS Safari's URL bar pushes the bottom of the feed off-screen with `100vh`. The learn-more sheet already uses `100dvh` (`globals.css:196`); the page shell should match. Add a `100vh` fallback for older browsers.
- **Filter rail mid-desktop horizontal scroll (RESP-1)** — `LaunchpadApp.tsx:937-974`. With 8 categories, the row needs ~1300px before "For you" is included; on a 1280px desktop the chips scroll silently. Drop to `categoryShortLabel` at < 1380px (the helper exists for mobile already), or wrap to a second line. Note: this respects your "9-chip rail is sacred" call — it doesn't reduce the count, it makes them all fit.

---

## Score after immediate batch (projected)

| Source | Before | After | Delta |
|---|---|---|---|
| Audit / 20 | 10 | ~15 | +5 |
| Critique / 40 | 26 | ~32 | +6 |

The biggest bumps are Theming (1 → 3, after token migration), Anti-Patterns (2 → 4, after distill cluster), Consistency and Standards (Nielsen #4: 2 → 3), Aesthetic and Minimalist (Nielsen #8: 3 → 4), Responsive Design (3 → 4 after touch targets + 100dvh).

---

## Deferred batch — for after the conference

### Per your instruction (commands deferred)

These are the "we can come back to four and five later" items. **Important:** the accessibility findings here include AODA blockers, not just polish. They're deferred for now per your call, not because they don't matter.

**`$impeccable harden`** (8 findings, deferred):

- **A11Y-1 (P0):** Focus-visible missing on most inline-styled buttons (`CategoryChip`, `FormatChooser`, `FormatOption`, `MobileRailBtn`, `LearnMoreCta`, `EmptyState` button, `SearchModal` result button, desktop search trigger, mobile header search). **AODA blocker.** Persona Sam (accessibility-dependent user) cannot use the home feed reliably. **Recommend running this immediately after the immediate batch lands.**
- **A11Y-2 (P0):** Search input has bare `outline: none` with no replacement (`LaunchpadApp.tsx:2569`). Same AODA implications.
- **A11Y-4:** Dialog `aria-describedby` not wired to format/category chip metadata.
- **A11Y-5:** YouTube iframe `aria-hidden="true"` blocks screen-reader access to caption controls (PRODUCT.md commits to "captions on all video").
- **A11Y-6:** Smaller transitions (chips, toast, search modal entrance) don't honor `prefers-reduced-motion` at the CSS level. PRODUCT.md says "every animation."
- **A11Y-7:** Toast not announced via `role="status"` / `aria-live="polite"`.
- **A11Y-8:** Brand wordmark "Career LaunchPAD" is a styled `<div>`, not `<h1>`. Multiple `<h1>` per content item; sheet adds another. Heading hierarchy break.
- Image error / loading state for YouTube thumbnails (critique P2). `onError` fallback, skeleton, `loading="lazy"`.

**`$impeccable polish`** (deferred): Final cleanup pass — `void Clipboard;` dead-import marker, `EmptyState` button uses `borderRadius: 12` instead of pill (`9999px`), `Toast` uses `shadow-lg` (reserved for dropdowns per spec), `Highlighted Title` accent block uses `'#fff'` instead of `var(--white)`. ~6 small items.

**`$impeccable live`** (deferred): Visual variant iteration on the learn-more sheet and content cards. Worth a session post-conference once the immediate batch lands.

### Other deferred (P2 — not pre-conference urgent)

**`$impeccable optimize`:** Code-split `YouTubePlayer`, `SearchModal`, conditional stages behind `next/dynamic`; migrate to `next/image`; remove (now redundant) backdrop blur. PERF-1 through PERF-4. Best after `harden` lands so focus-state work doesn't conflict with Suspense boundaries.

**`$impeccable typeset`:** Migrate Open Sans from `@import url(googleapis.com)` (`globals.css:6`) to `next/font/google` with weights `['300', '400', '500', '600', '700', '800', '900']`. Today the `@import` doesn't request 900, so the 11 places that use `fontWeight: 900` are browser-synthesized fake-bold. TYPE-1.

**`$impeccable colorize`:** Add `prefers-color-scheme: dark` overrides for the token block. Blocked behind the JS-constants migration in the immediate batch — once that lands, dark mode becomes a single CSS file change. THEME-2.

---

## Sequencing recommendation

```
Today:        $impeccable distill     (1-2 hr; biggest leverage)
              $impeccable clarify     (15 min)
              $impeccable adapt       (45 min)

Day 2-3:      $impeccable harden      (2-3 hr; AODA-critical, defer at your peril)

Pre-conf:     $impeccable polish      (30 min final pass)
              re-run $impeccable audit + critique to verify score lift

Post-conf:    $impeccable optimize, $impeccable typeset, $impeccable colorize, $impeccable live
```

Re-running audit + critique after the immediate batch will show concrete movement on the convergent issues, which is the cheapest way to validate the work before the conference.

---

## Findings explicitly skipped (you marked sacred)

- **9-chip category rail.** Critique P1 #3 recommended reducing to 4-5 chips with overflow. Skipped per your call. (RESP-1 in the immediate batch fixes the layout overflow without changing the count.)
- **Floating action rail (Save/Share/Info).** Critique persona red flags for Casey flagged the three-affordance thumb zone. Skipped per your call. The glassmorphism on `DesktopRailBtn` and `MobileRailBtn` (audit ANTI-2 partial) is also skipped — those are part of this rail.
