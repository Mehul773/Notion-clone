# Slate

Notion-style workspace for Windows. Pages, databases, drawings, notes — one desktop app, all local.

![Stack](https://img.shields.io/badge/Electron-React-blue) ![DB](https://img.shields.io/badge/Convex-realtime-orange) ![Lang](https://img.shields.io/badge/TypeScript-strict-3178c6)

## 👋 Recruiters & hiring managers

Portfolio project: Notion rebuilt as a real desktop app. Evaluate it in two minutes:

1. [Download the installer](#download--install-windows), double-click, done — no Node, no terminal, no accounts, no API keys. (Or [run from source](#run-from-source).)
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
- **Page links** — type `@` to link another page; backlinks appear automatically. **Side-by-side** — "Open to the right" splits two pages. **Password-protect** any page (SHA-256, local). **Sections** group pages in the sidebar — drag pages in.
- **Mind maps** — `/mindmap` renders an interactive tree from a Markdown outline (markmap).

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
- Fonts: size steppers, Default/Serif/Mono, or paste any **Google Font** name/link. **Simple mode** hides the advanced stuff. Optional **horizontal `/` menu**. **Shortcuts** panel with **rebindable keys**. Dark & light themes. Realtime sync across windows.

## Download & install (Windows)

1. Open the [**Releases** page](https://github.com/Mehul773/Notion-clone/releases) and download **`Slate Setup 1.0.0.exe`**.
2. Double-click it. Windows SmartScreen may warn because the app isn't code-signed yet — click **More info → Run anyway**.
3. Slate installs and opens. That's it.

No Node, no terminal, no accounts, no API keys. The database engine ships inside the app and runs locally on `127.0.0.1`. Everything — pages, databases, files, search — lives on your machine under `%APPDATA%/Slate`. It works fully offline, and uninstalling is a normal Windows uninstall.

> First launch sets up your local workspace and starts a quick tour. Only the optional **AI workspace generator** needs an [Anthropic API key](https://console.anthropic.com/); that key stays in `localStorage` and goes only to Anthropic. Everything else is offline.

## Run from source

For development, or to build the installer yourself. Needs **Node.js 18+** and **npm**. Windows is the primary target; macOS/Linux also work.

```bash
git clone https://github.com/Mehul773/Notion-clone.git
cd Notion-clone
npm install
npm run dev        # Convex (local) + Vite + Electron together
```

First run downloads the Convex local backend and writes `.env.local` automatically. All data lives on your machine. No account, no cloud.

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

## Build the installer

```bash
npm run dist       # seed backend + vite build + electron-builder → release/
```

This produces a fully self-contained installer at `release/Slate Setup <version>.exe`. `predist` runs `scripts/seed-backend.mjs`, which deploys the Convex functions into a clean seed deployment and copies the `convex-local-backend` binary into `electron/backend/`. `electron-builder` bundles both as app resources. At runtime the Electron main process starts the backend on `127.0.0.1:3210`, seeds the user's workspace on first launch, and shuts the backend down on quit — so the shipped app needs no `convex dev`, no Node, and no network. Run `npm run dist` on a machine where `npm run dev` has succeeded at least once (so the backend binary is cached locally).

To publish: create a GitHub Release and upload `release/Slate Setup <version>.exe` (the `release/` folder is git-ignored — the installer is too large to commit).

## Project layout

```
electron/        main process + preload, bundled backend config + seed
convex/          schema + server functions (pages, docs, database, templates, files, search)
scripts/         seed-backend.mjs (build-time: deploy functions into the shipped seed)
src/
  components/    Sidebar, PageTree, PageView, BlockEditor, DatabaseTable, DatabaseViews,
                 ImportMarkdownDialog, TemplatesDialog, AiDialog, QuickSwitcher, ShortcutsModal…
  lib/           markdown import, AI generation, formulas, giphy, tour, showcase, templates
```

## Troubleshooting

- **Reset all data (installed app)** — quit Slate, delete `%APPDATA%/Slate/convex-data`, relaunch. The workspace re-seeds clean.
- **Slate won't start / "could not start" dialog** — another program is using port `3210`. Close it (or any running `npm run dev` of this project) and relaunch.
- **Blank window when running from source** — Convex backend still downloading; watch the `convex` panel, reload (`Ctrl+R`) when ready.
- **Port 5173 busy (from source)** — stop the other Vite, or change the port in `vite.config.ts` + `package.json`.
