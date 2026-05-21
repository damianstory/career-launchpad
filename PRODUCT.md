# Product

## Register

product

## Users

Canadian middle and high school students in course-selection, pathway, or post-secondary planning moments inside myBlueprint. They aren't going looking for career resources — they encounter Career LaunchPAD ambiently, while doing something else, often without urgency. The job they're hiring it for: discover modern careers, industries, skills, and next-step ideas without needing to know what to search for. Adjacent users (educators, counsellors) may see it but are not a primary audience.

## Product Purpose

Career LaunchPAD is a student-first career discovery layer for the myBlueprint moments where future decisions already start. It exists to earn student attention before traditional career resources feel relevant — turning current, school-sanctioned career content into a polished, low-pressure browsing experience that can lead from curiosity into deeper articles, videos, and playbooks without forcing a planning workflow too early. Success means measurable student pull at entry, meaningful sessions, content depth, and return visits — proven through engagement signals before any heavier personalization is built.

## Brand Personality

**Curious, confident, current.** A smart older friend showing students what's possible — not preachy, not corporate. Knows it's for young people but trusts them as adults. Personality-rich and motion-forward in the lineage of Duolingo, Headspace, and Calm: friendly without being condescending, polished without feeling like school software. Voice is direct, specific, and active — never bureaucratic, never patronizing.

## Anti-references

This must explicitly NOT look like:

- **Generic ed-tech / LMS aesthetic** (Brightspace, Canvas, Schoology). No heavy chrome, dense sidebars, gray-on-gray data tables, bureaucratic forms. It is not school software.
- **Government-of-Canada portals** (Service Canada, jobsearch.gc.ca). No dated, dense, form-heavy "official Canadian content" stuffiness.
- **SaaS dashboard cliché.** No purple-blue gradients, hero-metric templates, identical icon-card grids, Inter-everywhere. Career LaunchPAD is content-first, not a dashboard.
- **Corporate career sites** (LinkedIn, Indeed). No commercial job-board feel — sponsored ads, profile-first, employer-driven framing. This is exploration, not job hunting.
- **Stock-photo Canadiana.** No red maple leaves, mountain photography, hockey imagery as decoration. Modernity wins over national signaling.

## Content authoring

Learn More content includes a **Reflection** prompt — one open question that ties the content to the student's own life-after-high-school decisions. See [`docs/content-authoring.md`](docs/content-authoring.md) for the editorial rule, examples, and the JSON → preflight → generator pipeline.

## Design Principles

1. **Content over chrome — show, don't tell.** The content (videos, articles, real Canadians doing real work) is the hero. UI scaffolding fades. Visual-first storytelling, generous whitespace, typography-forward layouts. Don't explain what a career is — show someone living it.

2. **Earn attention, low-pressure progression.** Every screen justifies the student's time without forcing a workflow. Easy to skim, easy to go deeper, easy to leave. No pop-ups, no forced sign-ups, no completion guilt. Movement through the product is the student's choice.

3. **Confidently current.** Modern in voice, motion, typography, and content selection. If a student could mistake this for something built five years ago, it has failed. Lean into 2026-relevant references, current Canadian employers, contemporary career framings — and prune anything that reads as dated the moment it ships.

## Accessibility & Inclusion

- **WCAG 2.1 AA** as the floor on all production surfaces.
- **AODA compliance** required for Ontario school deployments.
- **Reduced motion**: respect `prefers-reduced-motion` for every animation and scroll-driven effect.
- **Color contrast**: 4.5:1 minimum for body text, 3:1 for large text and UI components, with explicit checks against the navy `#22224c` and blue `#0092ff` brand pair.
- **Keyboard navigation**: every video play, filter, content card, and learn-more panel reachable and operable by keyboard. Visible focus state on every interactive element.
- **Screen-reader semantics**: meaningful headings, live-region announcements for filter changes, captions on all video, alt text on all imagery.
- **No hostile motion**: no autoplay-with-sound, no aggressive parallax, no jump scares from "delight" animations.
