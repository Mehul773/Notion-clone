# Slate

A Notion-style workspace for Windows — pages, databases, and notes, built as a desktop app.

![Stack](https://img.shields.io/badge/Electron-React-blue) ![DB](https://img.shields.io/badge/Convex-realtime-orange) ![Lang](https://img.shields.io/badge/TypeScript-strict-3178c6)

## 👋 For recruiters & hiring managers

This is a portfolio project that recreates the core of Notion as a real, working desktop app. The fastest way to evaluate it:

1. Follow [Quick start](#quick-start) below — one `npm install`, one `npm run dev`, no accounts or API keys needed.
2. Try the **two-minute tour**:
   - Create a page, type `/` and insert a **database**, a **drawing** (Excalidraw), and a **to-do list**.
   - Click **Import Markdown** in the sidebar, paste any `.md` file, and watch it become a formatted page — tables turn into live databases with typed columns.
   - Open two app windows side by side and edit the same page — everything syncs in realtime.

What this project demonstrates: a custom block-editor integration (BlockNote extended with four custom block types), a realtime backend (Convex schema, mutations, file storage, full-text search), non-trivial UI engineering (drag-and-drop page tree, column resizing, debounced persistence), AI integration with structured outputs, and a Markdown import pipeline with type inference.

## Features

- **Block editor** — headings, lists, to-dos, toggles, quotes, code blocks, tables, images (uploaded to Convex file storage), video/audio/file embeds. Type `/` for the command menu, drag blocks with the side handle.
- **Databases** — Notion-style tables embedded in any page via `/database`, with typed columns (text, number, select, date, checkbox, URL), colored tag chips (pick from 10 colors per option, or delete options), column resize/rename/retype, and live row counts.
- **Import from Markdown** — paste Markdown or drop a `.md` file and a fully formatted page is created automatically. Frontmatter sets the title and icon, the first `# H1` becomes the title otherwise, and pipe tables are converted into real databases with **inferred column types** (numbers, dates, checkboxes, URLs, and repeating values become select tags). Includes a one-click **"Copy AI prompt"** so any AI assistant can write a perfectly-formatted file for you.
- **Full-text content search** — `Ctrl+K` searches inside page bodies (including database-free text in nested blocks and tables), not just titles, and shows a matching snippet under each result. No more "I know I wrote it somewhere".
- **Templates gallery** — six ready-made pages (Meeting Notes, Project Tracker, Hiring Pipeline, Weekly Planner, 30-60-90 Onboarding, Content Calendar) that instantiate with real, typed databases in one click.
- **Daily notes** — "Today's note" in the sidebar opens today's journal page (auto-created under a 📓 Journal section, one per day) with a starter checklist — the Logseq/Obsidian habit, one click away.
- **Focus mode** — `Ctrl+Shift+F` hides the sidebar and topbar for distraction-free writing; a subtle pill in the corner (or the same shortcut) brings everything back.
- **Onboarding tour** — a guided next/prev/skip walkthrough (driver.js) starts on first launch and is replayable from the **Tutorial** button; finishing it creates a live "Getting started" sample page with a real database to play with.
- **Recent pages + NEW tags** — your five latest-edited pages sit at the top of the sidebar, and freshly created pages wear a NEW badge for ten minutes.
- **Covers by default** — every new page gets a random gradient cover (change or remove it any time), so nothing starts looking empty.
- **AI workspace generator** — "AI workspace" in the sidebar: paste your Anthropic API key, describe a project, and Claude (Opus 4.8) plans and creates a full starter workspace — pages, sub-pages, content, and seeded databases.
- **Drawings** — `/drawing` embeds a full Excalidraw whiteboard, autosaved to Convex.
- **Embeds** — `/youtube` embeds YouTube, Vimeo, or any web page; `/pdf` uploads a PDF with inline preview and download.
- **Drag & drop** — drag pages in the sidebar to reorder (drop near edges) or nest (drop on the middle); drop on empty space to move to the root.
- **Display controls** — "Aa" in the topbar: editor font size, code block font size, and app zoom (`Ctrl +/−/0`).
- **Export** — page menu (⋯): export as Markdown or HTML, live word count.
- **Nested pages** — infinite hierarchy in the sidebar with expand/collapse, inline rename, duplicate (deep-copies subpages *and* databases), and move-to.
- **Page identity** — emoji icons (full searchable picker) and covers (gradient gallery or your own uploaded image).
- **Favorites** — star pages to pin them to a sidebar section.
- **Trash** — deleting moves the whole subtree to trash; restore or delete forever (cleans up embedded databases too).
- **Quick switcher** — `Ctrl+K` / `Ctrl+P` full-text title search with recents.
- **Dark & light themes**, resizable sidebar, breadcrumbs, realtime sync everywhere (Convex subscriptions — open two windows and watch them stay in sync).

## Quick start

Prerequisites: **Node.js 18+** and **npm** (Windows is the primary target; the dev stack also runs on macOS/Linux).

```bash
git clone https://github.com/Mehul773/Notion-clone.git
cd Notion-clone
npm install
npm run dev        # starts Convex (local), Vite, and Electron together
```

That's it. The first run downloads the Convex local backend binary and creates
`.env.local` with your deployment URL automatically. All data lives in a local
Convex deployment on your machine (persisted under `~/.convex`) — no account,
no cloud, no API keys required.

> The optional **AI workspace generator** is the only feature that needs an
> [Anthropic API key](https://console.anthropic.com/). The key is stored in
> `localStorage` and sent only to Anthropic. **Import Markdown** works fully
> offline.

## Import a page from Markdown

Sidebar → **Import Markdown** → paste text or drop a `.md` file → **Import page**.

Supported syntax: `#`/`##`/`###` headings, paragraphs, bullet/numbered lists, `- [ ]` checklists, `>` quotes, `---` dividers, and pipe tables. Optional frontmatter:

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

With **"Convert tables to databases"** on (default), each table becomes a real Slate database. Column types are inferred from the values: `2026-07-01` → date, `42` → number, `true/false` → checkbox, `https://…` → URL, and a column with a few repeating values (like statuses) → select with tag options.

**Let an AI write the file:** click **Copy AI prompt** in the import dialog, paste it into any assistant (Claude, ChatGPT, Gemini…), describe the page you want, and paste the generated Markdown back into Slate. The prompt teaches the AI the exact supported syntax, so the result imports perfectly. Plain hand-written Markdown works too — the prompt is just a shortcut.

## Keyboard shortcuts

| Shortcut | Action |
| --- | --- |
| `Ctrl+K` / `Ctrl+P` | Quick switcher (titles + full page content) |
| `Ctrl+N` | New page |
| `Ctrl+Shift+F` | Focus mode |
| `/` in the editor | Block command menu |
| `Enter` on the title | Jump into the document |

## Tech stack

- **Electron** — desktop shell (hidden title bar with native window controls overlay)
- **React 19 + TypeScript + Vite** — UI
- **Convex** — database, file storage, full-text search (runs as a *local* deployment, no account needed)
- **BlockNote** — block editor engine, extended with custom Convex-backed database, drawing, embed, and PDF blocks
- **lucide-react** + **emoji-mart data** — icons and the emoji dataset

## Production build

```bash
npm run dist       # typecheck + vite build + electron-builder → release/
```

> Note: the production app still expects the Convex dev deployment to be
> running (`npx convex dev`). To use Convex cloud instead, run
> `npx convex login && npx convex dev --configure` once and rebuild.

## Project layout

```
electron/        main process + preload
convex/          schema and server functions (pages, docs, database, files, search)
src/
  components/    Sidebar, PageTree, PageView, BlockEditor, DatabaseTable,
                 ImportMarkdownDialog, AiDialog, QuickSwitcher, TrashModal,
                 MoveDialog, IconPicker, CoverPicker
  lib/           utilities (markdown import, AI generation, debounce, gradients)
```

## Troubleshooting

- **Blank window on first run** — the Convex local backend may still be downloading; watch the `convex` panel in the terminal and reload (`Ctrl+R`) once it reports "ready".
- **Port 5173 in use** — stop the other Vite instance or change the port in `vite.config.ts` and `package.json` (`wait-on tcp:5173`).
- **Reset all data** — stop the app and delete the local deployment folder under `~/.convex`.
