# Slate

You needed a workspace. Notion was right there — until the paywall. Until the sync failed. Until the tab disappeared mid-flight.

**Slate** is Notion rebuilt as a real desktop app. Block editor, databases, drawings, mind maps. One `.exe`, fully offline. Your data lives on your machine and goes nowhere.

[![GitHub](https://img.shields.io/badge/source-Mehul773%2FNotion--clone-blue)](https://github.com/Mehul773/Notion-clone) ![Stack](https://img.shields.io/badge/Electron-React-blue) ![DB](https://img.shields.io/badge/Convex-local-orange)

---

## Install (Windows)

1. [Releases page](https://github.com/Mehul773/Notion-clone/releases) → download **`Slate Setup 1.0.0.exe`**
2. Double-click. SmartScreen warns (app isn't code-signed yet) → **More info → Run anyway**
3. Slate opens. You're done.

No Node. No terminal. No accounts. No API keys. Everything lives in `%APPDATA%/Slate`. Uninstall = normal Windows uninstall.

> First launch runs a short onboarding tour that builds a demo page. Only the **AI workspace generator** needs an [Anthropic key](https://console.anthropic.com/) — all other features work offline.

---

## What it can do

**Editor** — Type `/` to insert any block: headings, lists, to-dos, toggles, code, images, video, PDF. Markdown shortcuts work inline (`*` → bullet, `#` → heading, ` ``` ` → code block). Drag blocks by handle.

**Databases** — `/database` embeds a Notion-style table. Four views: **Table**, **Kanban**, **Calendar**, **Chart**. Formula columns (`[Price] * (1 - [Discount])` — type `[` for autocomplete). Columns resize, rename, retype, reorder, hide. Drag-drop rows.

**Pages** — Infinite nesting, drag-drop reorder, emoji icons, GIF covers, templates, password protection, side-by-side view, `@` page links with backlinks, trash with restore.

**Mind maps** — `/mindmap` renders a Markdown outline as an interactive SVG tree. Opens **fullscreen** (Esc to exit).

**Drawings** — `/drawing` is a full Excalidraw whiteboard with **fullscreen** mode (Esc to exit).

**Import Markdown** — Paste or drop a `.md` file → formatted page. Tables become live databases with inferred column types (dates, numbers, booleans, URLs, repeated values → select tags).

**Search** — `Ctrl+K` searches all titles *and* page content with match snippets.

**Templates** — 7 built-ins with real typed databases: Meeting Notes, Project Tracker, Hiring Pipeline, Weekly Task Manager, Habit Tracker, 30-60-90 Onboarding, Content Calendar.

**More** — Daily notes, GIF search (`/meme` via GIPHY), font picker (size, family, Google Fonts), dark & light theme, focus mode (`Ctrl+Shift+F`), rebindable keyboard shortcuts.

---

## For recruiters — 2-minute eval

1. Download and install (above). No setup.
2. The onboarding tour starts automatically — finish it, it builds a "Getting started" demo page.
3. Open any page → `/` → **Database** → switch views: Board, Calendar, Chart → add a **Formula** column.
4. Sidebar → **Import Markdown** → paste any `.md` with a table → watch it become a live database.

What this shows: custom block-editor work (BlockNote + 4 custom block types), realtime local backend (Convex schema, mutations, file storage, full-text search), UI engineering (drag-drop everywhere, column resize/reorder, debounced persistence), and a Markdown import pipeline with type inference.

---

## Run from source

Requires **Node.js 18+**.

```bash
git clone https://github.com/Mehul773/Notion-clone.git
cd Notion-clone
npm install
npm run dev
```

First run downloads the Convex local backend binary and writes `.env.local` automatically. All data stays on your machine.

---

## Build the installer

```bash
npm run dist
```

Produces `release/Slate Setup <version>.exe` — fully self-contained, no Node required at runtime. Run on a machine that has completed `npm run dev` at least once (the backend binary caches locally).

---

## Stack

| | |
|---|---|
| Desktop shell | Electron |
| UI | React 19 + TypeScript + Vite |
| Database | Convex (local — ships inside the app, runs on `127.0.0.1`) |
| Block editor | BlockNote + custom database / drawing / embed blocks |
| Drawing | Excalidraw |
| Mind maps | Markmap |

---

## Troubleshoot

| Symptom | Fix |
|---|---|
| Won't start / port error | Close any running `npm run dev` (port 3210). Relaunch. |
| Blank window (from source) | Convex backend still downloading. Reload with `Ctrl+R` when ready. |
| Reset workspace | Quit → delete `%APPDATA%/Slate/convex-data` → relaunch. Re-seeds clean. |
