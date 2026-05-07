# Career LaunchPAD UX Generator Prompts

Use these prompt blocks one at a time in a frontend design generator. Each block is intentionally tool-agnostic and describes design intent, not implementation. Do not ask the design tool for code.

Chosen UX philosophy: **Stage + Context**. The content feed owns the page, but each video remains a vertical **9:16** media object. The surrounding space should make that vertical object feel intentional by carrying category context, editorial framing, save/share actions, and one-tap depth.

Global constraints for every prompt:

- Career LaunchPAD is a student-first discovery layer, not a dashboard, LMS, assignment tool, or event-specific experience.
- The default media shape for videos is vertical 9:16 because the library is primarily YouTube Shorts and similar short-form video.
- Do not make videos full-page or full-bleed by default. The screen may be immersive, but the video itself should remain a tall, narrow stage.
- The feed should feel low-pressure and familiar, with one-tap depth through Learn More.
- Use these categories: Emerging Careers, On the Job, Life Skills, Mindsets, How I Got Here, Problems to Solve, Post-Secondary, Job Board.
- Use these content formats: Videos, Articles, Playbooks.
- The visual tone should be modern, trustworthy, content-first, and polished without feeling corporate or school-assignment-like.

---

## Screen: Discovery Feed

### State: Populated Video Item

**What this screen is for**  
A student lands directly in Career LaunchPAD and can start discovering short-form career and life content without making an upfront decision.

**What's visible**  
The center of the screen is a vertical 9:16 video stage, tall and narrow, clearly treated as the main object. The surrounding space is active but calm: it shows the Career LaunchPAD identity, the current category, the format, the title, a short description, save and share actions, and a prominent Learn More action. Category and format controls are visible enough to support directed exploration but should not compete with the video. The surrounding space may use soft panels, rails, or editorial context areas so the vertical media does not feel stranded in empty space.

**What the user can do**  
The student can play the video, scroll to the next feed item, open Learn More, save the item, share the item, filter by category, filter by format, or search for a topic.

**Feel**  
Immersive but not overwhelming. The vertical video feels like a stage with useful context around it, not like a phone video awkwardly enlarged onto a desktop page. The interface should feel confident, selective, and low-pressure.

**State context**  
This is the normal populated feed state with a video item in view. It should work for a student arriving from myBlueprint, a teacher-shared link, or a general public link.

**Critical affordances**  
The video must remain 9:16. Learn More must be visually obvious. Save and share should be available but secondary. The screen must not look like a Skills Canada event page, a content management tool, or a full-page video player.

---

### State: Populated Article Item

**What this screen is for**  
A student encounters an article inside the same discovery feed without the experience collapsing into a static article grid.

**What's visible**  
The main stage still uses the same feed composition, but instead of playable video it shows a strong editorial thumbnail or article preview in a vertical presentation area. The title, short description, category, and format are visible around the stage. The design should make the article feel feed-native: it is something to discover now, not a separate reading app or blog index.

**What the user can do**  
The student can open Learn More, open the source when available, save, share, keep scrolling, search, or filter.

**Feel**  
Selected and current. The article should feel chosen for the student, not dumped from the internet. It should invite a quick decision: keep browsing or go deeper.

**State context**  
This is the populated feed state for article content.

**Critical affordances**  
Do not show article items as small cards in a dense grid. Keep the feed rhythm consistent with video content. The article preview should preserve the same low-pressure discovery posture as the video feed.

---

### State: Populated Playbook Item

**What this screen is for**  
A student discovers an actionable guide that helps them do something with what they learned.

**What's visible**  
The feed stage shows a playbook preview with a clear action-oriented title, a concise description, and the category. The surrounding context should communicate that playbooks are practical and useful, not homework. It may preview a few short steps or outcomes, but it should not reveal the full playbook in the feed.

**What the user can do**  
The student can open Learn More to view the playbook steps, save it for later, share it, keep scrolling, search, or filter.

**Feel**  
Useful, calm, and direct. The playbook should feel like a small advantage the student can act on, not like a worksheet.

**State context**  
This is the populated feed state for playbook content.

**Critical affordances**  
Make Playbook feel distinct from Article without making it feel heavier or more academic. The main action is still Learn More, not “start assignment” or “complete module.”

---

### State: Filtered Feed

**What this screen is for**  
A student narrows the discovery feed to a category or format while staying in the same low-pressure browsing experience.

**What's visible**  
The selected category or format is clearly active. The feed still presents one main content item at a time, with the same vertical 9:16 treatment for videos. There is a simple way to return to all content. If both category and format are selected, the screen makes that combination understandable without turning into a search results page.

**What the user can do**  
The student can switch filters, clear filters, scroll through matching content, search within the filtered set, open Learn More, save, or share.

**Feel**  
Directed but still exploratory. Filtering should feel like adjusting the lens, not like filling out a form.

**State context**  
This state appears after a student selects a category such as Life Skills or a format such as Playbooks.

**Critical affordances**  
The active filter must be obvious. The feed should not reframe itself as a list of results. The vertical video stage should remain the core pattern whenever the current item is a video.

---

### State: Empty Filter Result

**What this screen is for**  
A student has selected filters or entered a search that returns no matching content, and needs a graceful recovery path.

**What's visible**  
The feed area keeps the same overall structure, but the main stage is replaced by a friendly empty state. It explains that nothing matches right now and offers clear ways to recover: clear filters, browse all content, or try a broader search. The category and format controls remain available.

**What the user can do**  
The student can clear filters, change category, change format, search again, or return to the full feed.

**Feel**  
Helpful and calm. This should not feel like an error or dead end.

**State context**  
This state appears when the current category, format, or search combination has no matching content.

**Critical affordances**  
Avoid technical language. Avoid making the student feel they did something wrong. Always provide an obvious path back to discovery.

---

### State: Loading Feed

**What this screen is for**  
The product is preparing the first discovery item while preserving the student’s sense that content is coming.

**What's visible**  
The layout shows the recognizable shape of the feed before real content arrives: a vertical 9:16 media stage placeholder, surrounding context placeholders, and muted filter/navigation areas. The loading state should communicate the structure of the coming experience rather than displaying a generic spinner.

**What the user can do**  
The student waits briefly while content loads. If loading takes longer than expected, the screen should still feel stable and understandable.

**Feel**  
Quiet, stable, and anticipatory. The student should understand that the feed is loading, not broken.

**State context**  
This is the initial loading state before content appears.

**Critical affordances**  
Preserve the vertical video stage shape in loading. Do not introduce a full-page loader that hides the feed model.

---

### State: Feed Error

**What this screen is for**  
The product cannot load content and needs to explain recovery without breaking trust.

**What's visible**  
The feed area shows a clear message that content could not load, with a retry action and a secondary option to continue later. The surrounding navigation can remain visible, but the screen should avoid presenting empty chrome as if content exists.

**What the user can do**  
The student can retry loading or return later.

**Feel**  
Straightforward and reassuring. The message should be honest without sounding technical.

**State context**  
This state appears when the content library cannot be loaded.

**Critical affordances**  
Do not expose internal error details. Do not trap the student on a blank page. Keep the product identity visible so the failure still feels contained.

---

## Screen: Learn More Panel

### State: Video Content

**What this screen is for**  
A student has tapped Learn More and wants deeper context without losing their place in the feed.

**What's visible**  
A depth panel opens over or beside the feed while the feed context remains perceptible. It shows the content title, category, and format. It includes intentionally written sections: why this matters, how it connects to career and life planning, the key takeaway, and related next steps. The vertical video may appear as a smaller preview or contextual reference, but the panel's job is explanation and connection, not replacing the feed video player.

**What the user can do**  
The student can read the context, open related content, save, share, open the source when applicable, or close the panel to return to the same feed position.

**Feel**  
Helpful, editorial, and student-respecting. It should feel like someone is connecting the dots, not lecturing.

**State context**  
This is the populated Learn More state for video content.

**Critical affordances**  
The feed position must feel preserved. The panel copy should feel intentional and human-written. Related content should feel like a logical next step, not an algorithmic recommendation wall.

---

### State: Playbook Content

**What this screen is for**  
A student opens a playbook and can act on a practical guide without the experience feeling like homework.

**What's visible**  
The panel shows the playbook title, category, and a short explanation of why it matters. The main body contains a small set of clear steps or principles. The steps should be easy to scan and framed as practical guidance. Related content appears after the guide, connecting the playbook back to the broader discovery feed.

**What the user can do**  
The student can read the steps, save the playbook, share it, open related content, or close the panel and continue browsing.

**Feel**  
Practical, warm, and confidence-building. The playbook should feel like “I can use this” rather than “I have to complete this.”

**State context**  
This is the populated Learn More state for playbook content.

**Critical affordances**  
Do not make the playbook look like a form, checklist assignment, classroom module, or planning workflow. The content is actionable, but it is not interactive product state in v1.

---

### State: Article Content

**What this screen is for**  
A student opens Learn More for an article and gets context before deciding whether to read further.

**What's visible**  
The panel shows the article title, category, and a clear explanation of why the article is worth attention. It includes a short planning connection, a takeaway, and related content. If there is an external source, the action to open it is present but not more prominent than the Career LaunchPAD context.

**What the user can do**  
The student can open the article source, save, share, open related content, or return to the feed.

**Feel**  
Trustworthy and student-respecting. The student should feel that Career LaunchPAD has already done useful filtering and framing for them.

**State context**  
This is the populated Learn More state for article content.

**Critical affordances**  
Do not make the external article link the only visible value. The product’s value is curation plus framing.

---

### State: Long Content

**What this screen is for**  
A student opens a Learn More panel where the explanation or playbook is longer than usual and needs to remain easy to scan.

**What's visible**  
The panel organizes longer content into short named sections. The top still communicates the title, category, and takeaway quickly. Longer supporting content appears below, with related next steps after the main explanation.

**What the user can do**  
The student can scan, continue reading, save, share, open related content, or close the panel.

**Feel**  
Readable and unpressured. The panel should support skimming without hiding useful depth.

**State context**  
This state appears when the Learn More content or playbook steps are longer than the usual quick explanation.

**Critical affordances**  
The panel must not become a dense article page. Keep the strongest takeaway easy to find near the top.

---

### State: Panel Error

**What this screen is for**  
The panel cannot load the selected item or source and needs to recover gracefully.

**What's visible**  
The panel shows a clear message that this content could not be loaded, with a way to return to the feed and optionally try again. If the feed item is still known, preserve the title or enough context to avoid confusion.

**What the user can do**  
The student can close the panel, retry, or keep browsing.

**Feel**  
Contained and calm. The student should not feel like they lost the app.

**State context**  
This state appears when the panel content fails to resolve.

**Critical affordances**  
Always keep a path back to the feed. Do not show technical error language.

---

## Screen: Direct Link Entry

### State: Shared Link Opens Content

**What this screen is for**  
A student arrives from a shared link and immediately understands what was shared while still being invited into the broader feed.

**What's visible**  
The linked content opens with its Learn More context visible. Behind or around it, the feed context is still present enough to communicate that Career LaunchPAD is a discovery experience, not a single isolated article or video page. If the linked item is a video, its media remains a vertical 9:16 object.

**What the user can do**  
The student can read the shared context, play or view the content, save, share again, open related content, close the panel, or continue browsing the feed.

**Feel**  
Specific but not closed off. The student should feel they landed on the right thing and can keep exploring.

**State context**  
This is the state for URLs that open a specific content item directly.

**Critical affordances**  
The linked item must be unmistakable. The broader feed must still be discoverable. Do not make direct links look like a standalone marketing landing page.

---

### State: Broken Shared Link

**What this screen is for**  
A shared link points to content that cannot be found, and the product needs to recover without losing the student.

**What's visible**  
The screen explains that the shared item is unavailable and offers the student a path into the main feed. The categories and search affordances are visible enough to support recovery.

**What the user can do**  
The student can browse all content, search, or choose a category.

**Feel**  
Helpful and low-friction. The student should not feel blocked by a bad link.

**State context**  
This state appears when a direct content link does not match an available item.

**Critical affordances**  
Do not dead-end. Do not show technical slug or routing details.

---

## Screen: Save and Share Feedback

### State: Save Confirmed

**What this screen is for**  
A student saves content locally and needs confirmation that the action worked without creating account expectations.

**What's visible**  
The save action changes state clearly on the current feed item or panel. A small confirmation appears in context. If a saved count or saved area is visible, it updates. The language should avoid implying cross-device persistence or an account-backed library.

**What the user can do**  
The student can continue browsing, open Learn More, remove the save, or share the item.

**Feel**  
Lightweight and satisfying, but not performative. The action should feel quick and useful.

**State context**  
This appears immediately after saving an item.

**Critical affordances**  
Avoid account language. Do not imply that saves are permanent across devices.

---

### State: Share Confirmed

**What this screen is for**  
A student shares or copies a content link and needs clear feedback that the link is ready.

**What's visible**  
The current item remains in view. A small confirmation appears near the share action, using plain language that the link was copied or shared. The product should not interrupt browsing with a heavy modal.

**What the user can do**  
The student can continue browsing, open Learn More, save, or share another item.

**Feel**  
Fast and unobtrusive. Sharing should support discovery rather than becoming its own workflow.

**State context**  
This appears immediately after the share action succeeds.

**Critical affordances**  
Feedback must be visible but temporary-feeling. Do not block the feed.

---

### State: Share Fails

**What this screen is for**  
The share or copy action fails, and the student needs a fallback without losing the current item.

**What's visible**  
The current item stays in place. A small message explains that sharing did not work and offers a simple fallback such as showing the link text to copy manually.

**What the user can do**  
The student can try again, copy manually, dismiss the message, or keep browsing.

**Feel**  
Practical and calm. The failure should not feel severe.

**State context**  
This appears when the share action cannot complete.

**Critical affordances**  
Keep the student on the same item. Do not show browser or clipboard technical details.
