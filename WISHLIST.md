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

## 🟢 Next up (easy, start here)

- [ ] **Save page as template** — add "Save as template" to the page ⋯ menu: export page to Markdown (`blocksToMarkdownLossy`, see `exportPage` in `src/App.tsx`), store in a new `templates` Convex table, list user templates in `TemplatesDialog.tsx` under the built-ins.
- [ ] **Sidebar page filter** — small filter input above the Pages section in `Sidebar.tsx`; on text, flatten tree and show matching titles only (the `pages` array is already in memory).
- [ ] **GIF / any-image covers** — `CoverPicker.tsx` already supports image upload; add a URL input field (paste any GIF URL) + a small gallery of free GIFs via the Tenor or GIPHY public API (free tier, needs a free API key — confirm before adding).
- [ ] **Font styles** — extend `SettingsPopover.tsx` font settings with a font-family picker (Default / Serif / Mono, like Notion); set a CSS variable on the root, same pattern as `--editor-fs`.
- [ ] **Text size & color control** — BlockNote's formatting toolbar already has color support; verify it's enabled in `BlockNoteView` and add custom font-size options to the toolbar.

## 🟡 Later (medium effort)

- [ ] **Kanban board view for databases** — add a `view: "table" | "board"` prop on the database block; board groups rows by a select column, drag between columns patches the cell. All data already lives in `dbRows.cells`.
- [ ] **Calendar view** — month grid rendering `dbRows` with a date column; library option: FullCalendar (MIT, free).
- [ ] **Charts from databases** — render number columns as bar/line charts; library: Chart.js or Recharts (both MIT, free).
- [ ] **Simple mode toggle** — a setting that hides advanced slash items (database, embed, PDF, drawing) and sidebar extras (AI, Import), leaving a clean notes app. Mostly conditional rendering driven by one boolean in `SettingsPopover`.
- [ ] **Spreadsheet-style formulas in databases** — add a `formula` column type evaluated client-side (e.g. `price * (1 - discount)` referencing sibling columns); library: expr-eval (MIT) instead of writing a parser.
- [ ] **Dynamic incremental row numbers** — render an auto `#` column in `DatabaseTable.tsx` based on row order (display-only, no schema change).
- [ ] **Lock / hide database columns** — `hidden: boolean` on `dbColumns`, eye toggle in the column popover, filtered out of render.
- [ ] **Password-protected pages** — local-first approach: hash a passphrase per page, encrypt `docs.content` client-side (Web Crypto API, built-in & free), prompt on open. Note: protects content at rest, not a real multi-user ACL.
- [ ] **Side-by-side view** — split `App.tsx` main area into two `PageView` panes with independent `activePageId`s; entry point "Open to the right" in the page ⋯ menu.
- [ ] **Group pages in sidebar** — user-defined sections: a `sections` table (name, order) + `sectionId` on pages; drag pages between section headers (reuse the existing drag-drop wiring in `PageTree.tsx`).

## 🔴 Big bets (future)

- [ ] **Mind maps in pages** — best path: a custom block embedding Excalidraw's mind-map-ish canvas (already shipped) or markmap (MIT, renders Markdown outlines as mind maps — good fit with our import pipeline).
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
