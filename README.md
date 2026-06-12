# Slate

Notion-style workspace for Windows. Pages, databases, drawings, notes — one desktop app, all local.

![Stack](https://img.shields.io/badge/Electron-React-blue) ![DB](https://img.shields.io/badge/Convex-realtime-orange) ![Lang](https://img.shields.io/badge/TypeScript-strict-3178c6)

## 👋 Recruiters & hiring managers

Portfolio project: Notion rebuilt as a real desktop app. Evaluate it in two minutes:

1. [Quick start](#quick-start) — one `npm install`, one `npm run dev`. No accounts, no API keys.
2. The built-in tour starts on first launch (with memes). Finish it — it builds a demo page showing every feature.
3. Create a page, type `/`, insert a **database**. Switch it to **Board**, **Calendar**, **Chart**. Add a **Formula** column.
4. Click **Import Markdown**, paste any `.md` file — tables become live typed databases.

Shows: custom block-editor work (BlockNote + 4 custom block types), realtime backend (Convex schema, mutations, file storage, full-text search), real UI engineering (drag-drop everywhere, column resize/reorder, debounced persistence), AI integration with structured outputs, and a Markdown import pipeline with type inference.

## Features

**Editor**
- Type `/` for every block: headings, lists, to-dos, toggles, quotes, code, tables, images, video, PDF.
- Markdown speed: `*`+space → bullet, `1.`+space → numbered, `>` → quote, `#`/`##`/`###` → headings, ``` → code block.
- Drag blocks by the handle. Select text → toolbar with bold, color, more.

**Databases**
- `/database` embeds a Notion-style table. Column types: text, number, select, date, checkbox, URL, **formula**.
- **Four views**: Table, Kanban Board (drag cards between lanes), Calendar (month grid), Chart (bars — counts or sums). Pick which columns drive board/calendar/chart.
- **Formula columns**: `[Price] * (1 - [Discount])` — type `[` and get autocomplete for column names (Tab to accept).
- Columns: resize, rename, retype, hide/unhide, drag to reorder, insert left/right. Rows: auto numbers, insert above/below, delete.

**Pages**
- Infinite nesting, drag-drop reorder, inline rename, deep duplicate, move-to, favorites, trash with restore.
- Emoji icons + covers: gradient gallery, **GIF tab** (GIPHY trending/search), upload, or paste any image URL. Every new page gets a random cover.
- Export as Markdown/HTML. **Save as template** — reuse from the Templates dialog.

**Find & focus**
- `Ctrl+K` — full-text search across titles *and* page content, with match snippets.
- `Ctrl+Shift+F` focus mode. `Ctrl+\` sidebar toggle (quick icons stay in the topbar). Sidebar filter box. Recent pages on top with NEW tags.

**Templates** — 7 built-ins: Meeting Notes, Project Tracker, Hiring Pipeline, **Weekly Task Manager**, **Habit Tracker**, 30-60-90 Onboarding, Content Calendar. All instantiate with real typed databases.

**Import Markdown** — paste text or drop a `.md` file → formatted page. Frontmatter sets title/icon. Tables → databases with inferred column types (dates, numbers, checkboxes, URLs, repeated values → select tags). One-click **Copy AI prompt** so any AI writes a perfect file for you.

**More**
- **Onboarding tour** with random meme GIFs per step (🎲 button rerolls — zero API calls, hardcoded pool). Finishing builds a "Getting started" demo page.
- **Daily notes** — one click, today's journal page under 📓 Journal.
- **AI workspace generator** — describe a project, Claude builds pages + seeded databases (optional, needs an Anthropic key).
- **Drawings** — `/drawing` is a full Excalidraw whiteboard.
- Fonts: size steppers, Default/Serif/Mono, or paste any **Google Font** name/link. **Simple mode** hides the advanced stuff. **Shortcuts** panel in the sidebar. Dark & light themes. Realtime sync across windows.

## Quick start

Needs **Node.js 18+** and **npm**. Windows is the primary target; macOS/Linux also work.

```bash
git clone https://github.com/Mehul773/Notion-clone.git
cd Notion-clone
npm install
npm run dev        # Convex (local) + Vite + Electron together
```

First run downloads the Convex local backend and writes `.env.local` automatically. All data lives on your machine (`~/.convex`). No account, no cloud.

> Only the **AI workspace generator** needs an [Anthropic API key](https://console.anthropic.com/). The key stays in `localStorage` and goes only to Anthropic. Everything else works offline.

## Import a page from Markdown

Sidebar → **Import Markdown** → paste or drop a `.md` → **Import page**.

```markdown
---
title: Product Launch Plan
icon: 🚀
---

# Product Launch Plan

- [ ] Finalize pricing
- [x] Ship landing page

| Task | Owner | Due | Done |
|------|-------|-----|------|
| Press kit | Maya | 2026-07-01 | false |
```

With **"Convert tables to databases"** on (default), each table becomes a real database. Types are inferred: `2026-07-01` → date, `42` → number, `true/false` → checkbox, `https://…` → URL, repeating values → select tags.

Want an AI to write it? **Copy AI prompt** in the dialog → paste into Claude/ChatGPT/Gemini → describe your page → paste the result back.

## Keyboard shortcuts

Full list lives in the app (sidebar → **Shortcuts**). Highlights:

| Shortcut | Action |
| --- | --- |
| `Ctrl+K` / `Ctrl+P` | Search titles + content |
| `Ctrl+N` | New page |
| `Ctrl+\` | Toggle sidebar |
| `Ctrl+Shift+F` | Focus mode |
| `/` | Block menu |

## Tech stack

- **Electron** — desktop shell
- **React 19 + TypeScript + Vite** — UI
- **Convex** — database, file storage, full-text search (local deployment)
- **BlockNote** — block editor, extended with custom database/drawing/embed/PDF blocks
- **driver.js** (tour), **expr-eval** (formulas), **lucide-react** + **emoji-mart**

## Production build

```bash
npm run dist       # typecheck + vite build + electron-builder → release/
```

> The packaged app still expects the Convex dev deployment (`npx convex dev`). For Convex cloud: `npx convex login && npx convex dev --configure`, then rebuild.

## Project layout

```
electron/        main process + preload
convex/          schema + server functions (pages, docs, database, templates, files, search)
src/
  components/    Sidebar, PageTree, PageView, BlockEditor, DatabaseTable, DatabaseViews,
                 ImportMarkdownDialog, TemplatesDialog, AiDialog, QuickSwitcher, ShortcutsModal…
  lib/           markdown import, AI generation, formulas, giphy, tour, showcase, templates
```

## Troubleshooting

- **Blank window on first run** — Convex backend still downloading; watch the `convex` panel, reload (`Ctrl+R`) when ready.
- **Port 5173 busy** — stop the other Vite, or change the port in `vite.config.ts` + `package.json`.
- **Reset all data** — stop the app, delete the local deployment under `~/.convex`.
