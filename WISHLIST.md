# Slate — Feature Wishlist & Roadmap

Every idea collected so far, sorted by status. Each pending task has enough
context to start cold. Done items reference where they live in the code.

## ✅ Done

| Feature | Where |
|---------|-------|
| Random default cover on every new page | `randomCoverCss()` in `src/lib/utils.ts`, passed by all `pages.create` callers |
| Recent / latest-modified pages on top of sidebar | "Recent" section in `src/components/Sidebar.tsx` (top 5 by `updatedAt`) |
| "NEW" tag on freshly created pages (10 min) | `new-badge` in `Sidebar.tsx` + `PageTree.tsx` |
| Onboarding tutorial (next/prev/skip, first-run, replayable) | `src/lib/tour.ts` (driver.js) + "Tutorial" button in sidebar; finishing creates a live sample page |
| Emoji hover blink fix | `styles.css` — hover-actions `pointer-events` + icon `z-index` |
| Cover buttons unreadable on bright covers fix | `styles.css` — `.cover-action-btn` dark translucent + blur |
| Canvas / whiteboard (Obsidian-style) | Already existed: `/drawing` block = full Excalidraw |
| Doodling & sketch notes | Same Excalidraw block |
| Create your own templates | Works today via Import Markdown: write any `.md`, keep it as a file, re-import any time. A "Save page as template" button is the follow-up below |

## ✅ Done (second wave)

| Feature | Where |
|---------|-------|
| Save page as template + "Your templates" section w/ delete | page ⋯ menu in `App.tsx`, `convex/templates.ts`, `TemplatesDialog.tsx` |
| Sidebar page filter | filter input in `Sidebar.tsx` Pages header |
| GIF covers (GIPHY trending/search) + paste-any-URL | `src/lib/giphy.ts`, `CoverPicker.tsx` tabs |
| Font family picker (Default/Serif/Mono) | `SettingsPopover.tsx` → `--editor-font` var |
| Sidebar collapse/expand (Ctrl+\\) | `Sidebar.tsx` + topbar reopen button |
| Kanban board view (widget-style cards, drag between lanes) | `DatabaseViews.tsx` BoardView |
| Calendar month view for databases | `DatabaseViews.tsx` CalendarView |
| Bar charts from databases (counts or sums by select) | `DatabaseViews.tsx` ChartView |
| Formula columns — `[Score] * 2` style, expr-eval (MIT) | `src/lib/formula.ts`, column popover |
| Auto row numbers (#) in table view | `DatabaseTable.tsx` gutter |
| Hide/unhide database columns | column popover + eye menu in title row |
| Simple mode toggle (hides AI/Import/advanced blocks) | `SettingsPopover.tsx`, `Sidebar.tsx`, `BlockEditor.tsx` |
| Text color control | already in BlockNote's formatting toolbar (select text) |

## ✅ Done (third wave)

| Feature | Where |
|---------|-------|
| Meme GIFs in tour (random per step + 🎲 reroll, zero API calls) | `MEME_POOLS` in `src/lib/tour.ts` |
| Extra tour steps: favorites, theme, fonts, focus, page options, cover/icon | `src/lib/tour.ts` |
| Showcase "Getting started" page w/ colored text, live DB + drawing, markdown shortcuts | `src/lib/showcase.ts` |
| Shortcuts panel | `ShortcutsModal.tsx` + sidebar button |
| Focus-mode exit pill now clearly visible | `.focus-exit-btn` in `styles.css` |
| Collapsed sidebar keeps quick icons (search, new page) in topbar | `App.tsx` topbar |
| Recent rows = full tree items (⋯ menu, + child) + collapsible section | `Sidebar.tsx` |
| Google Fonts: paste name or link → editor font | `parseGoogleFont` in `SettingsPopover.tsx`, loader in `App.tsx` |
| Formula `[` autocomplete (Tab/click to accept) | `FormulaInput` in `DatabaseTable.tsx` |
| DB: insert column left/right, insert row above/below (Alt+click) | `DatabaseTable.tsx` + `convex/database.ts` `atOrder` |
| DB: drag-and-drop column reorder | `moveColumn` mutation + header drag handlers |
| Board/Calendar/Chart column pickers (choose group/date/value column) | `DatabaseViews.tsx` selects |
| Weekly Task Manager + Habit Tracker templates (replaced Weekly Planner) | `src/lib/templates.ts` |
| DB/drawing block deselect on outside click | mousedown handler in `BlockEditor.tsx` |

## ✅ Done (fourth wave)

| Feature | Where |
|---------|-------|
| Side-by-side view (two page panes) | `page-panes` in `App.tsx`, "Open to the right" in page ⋯ menu |
| Password-protected pages (SHA-256, Web Crypto) | `src/lib/crypto.ts`, `setPassword` in `convex/pages.ts`, lock gate in `PageView.tsx` |
| Page links via `@` mention + backlinks panel | `PageLink` inline spec + `@` menu in `BlockEditor.tsx`, `backlinks` query, `navigateToPage` bridge in `src/lib/pageNav.ts` |
| Mind map block (markmap, editable outline) | `src/components/blocks/MindMapBlock.tsx`, `/mindmap` slash item |
| Sidebar sections (create, rename, delete, drag pages in) | `convex/sections.ts`, `SectionGroup` in `Sidebar.tsx`, `setSection` mutation |
| Horizontal slash menu option | toggle in `SettingsPopover.tsx`, CSS in `styles.css` |
| Custom keyboard shortcuts (capture + reset) | `src/lib/keybindings.ts`, editable rows in `ShortcutsModal.tsx`, applied in `App.tsx` `onKey` |

## ✅ Done (fifth wave — meme/mindmap polish + DB delete)

| Feature | Where |
|---------|-------|
| Tour meme render lag fixed (downsized GIFs + preload on tour start) | `gif()` + `preloadMemes()` in `src/lib/tour.ts` |
| Tour meme overflow fixed (full meme visible, `object-fit: contain`) | `.driver-popover .tour-gif` in `styles.css` |
| 🎲 reroll now guaranteed-different (index-based, not src-string compare) | `randomIndex` + `__slateNextMeme` in `src/lib/tour.ts` |
| Delete card in Board view (table view already had hover-gutter delete) | `db-card-delete` in `DatabaseViews.tsx` + CSS |
| Shortcuts modal no longer clipped (scrolls inside 70vh modal) | `.modal > .ai-dialog` overflow in `styles.css` |
| Live mind map embedded on "Getting started" showcase page | `{ type: "mindmap" }` block in `src/lib/showcase.ts` |
| `/meme` slash item → GIPHY picker → inserts image block | `GifPickerModal.tsx`, slash item in `BlockEditor.tsx` |
| "Copy AI prompt" button on mind map block (paste outline back to import) | `MINDMAP_AI_PROMPT` + button in `MindMapBlock.tsx` |

## 🔴 Big bets (future / not built yet)

- [ ] **Timeline / Gantt view (multi-year)** — horizontal time axis over database rows with start/end date columns; library: vis-timeline (MIT). Design for 2-5 year spans (zoom levels: month/quarter/year).
- [ ] **Graphing calculator block** — function-plot library (MIT, d3-based) inside a custom block; type `y = x^2`, get a graph.
- [ ] **Linked whiteboard notes (Miro-style)** — Excalidraw elements that deep-link to Slate pages; needs a custom Excalidraw element type + click handling.
- [ ] **Bullet points / rich blocks inside simple tables** — depends on BlockNote table cell capabilities; revisit after upgrading BlockNote (newer versions expanded table support — check changelog before building anything).
- [ ] **Cell merging in simple tables** — same: BlockNote added colspan/rowspan support in newer releases; upgrade path, not custom code.

## ❌ Not feasible (and why)

- **Android widgets / board view as Android widgets** — Slate is a Windows desktop app (Electron). There is no Android app to host widgets. Would require building an entire mobile app first.
- **Third-party plugin marketplace (Obsidian-style)** — requires a stable public plugin API, sandboxing, and a distribution/review ecosystem. Months of work and a security surface we can't support; revisit only if the project grows a community. (A lightweight alternative: documented custom-block recipes in the repo.)
- **"Cram all of Miro into Notion"** — full Miro = realtime multi-user infinite canvas with 100+ tools. We ship the realistic subset: Excalidraw whiteboards today, page-linked canvas items as a future bet above.

## Library policy

Prefer free, MIT-licensed libraries over building from scratch: driver.js (tour — shipped), FullCalendar, Chart.js/Recharts, expr-eval, markmap, vis-timeline, function-plot. Only the GIF gallery needs an external API key (Tenor/GIPHY free tier) — flagged above for approval.
