# Slate

A Notion-style workspace for Windows — pages, databases, and notes, built as a desktop app.

![Stack](https://img.shields.io/badge/Electron-React-blue) ![DB](https://img.shields.io/badge/Convex-realtime-orange)

## Features

- **Block editor** — headings, lists, to-dos, toggles, quotes, code blocks, tables, images (uploaded to Convex file storage), video/audio/file embeds. Type `/` for the command menu, drag blocks with the side handle.
- **Databases** — Notion-style tables embedded in any page via `/database`, with typed columns (text, number, select, date, checkbox, URL), colored tag chips (pick from 10 colors per option, or delete options), column resize/rename/retype, and live row counts.
- **Drawings** — `/drawing` embeds a full Excalidraw whiteboard, autosaved to Convex.
- **Embeds** — `/youtube` embeds YouTube, Vimeo, or any web page; `/pdf` uploads a PDF with inline preview and download.
- **AI workspace generator** — "AI workspace" in the sidebar: paste your Anthropic API key, describe a project, and Claude (Opus 4.8) plans and creates a full starter workspace — pages, sub-pages, content, and seeded databases.
- **Drag & drop** — drag pages in the sidebar to reorder (drop near edges) or nest (drop on the middle); drop on empty space to move to the root.
- **Display controls** — "Aa" in the topbar: editor font size, code block font size, and app zoom (`Ctrl +/−/0`).
- **Export** — page menu (⋯): export as Markdown or HTML, live word count.
- **Nested pages** — infinite hierarchy in the sidebar with expand/collapse, inline rename, duplicate (deep-copies subpages *and* databases), and move-to.
- **Page identity** — emoji icons (full searchable picker) and covers (gradient gallery or your own uploaded image).
- **Favorites** — star pages to pin them to a sidebar section.
- **Trash** — deleting moves the whole subtree to trash; restore or delete forever (cleans up embedded databases too).
- **Quick switcher** — `Ctrl+K` / `Ctrl+P` full-text title search with recents.
- **Dark & light themes**, resizable sidebar, breadcrumbs, realtime sync everywhere (Convex subscriptions — open two windows and watch them stay in sync).

## Keyboard shortcuts

| Shortcut | Action |
| --- | --- |
| `Ctrl+K` / `Ctrl+P` | Quick switcher |
| `Ctrl+N` | New page |
| `/` in the editor | Block command menu |
| `Enter` on the title | Jump into the document |

## Tech stack

- **Electron** — desktop shell (hidden title bar with native window controls overlay)
- **React 19 + TypeScript + Vite** — UI
- **Convex** — database, file storage, full-text search (runs as a *local* deployment, no account needed)
- **BlockNote** — block editor engine, extended with a custom Convex-backed database block
- **lucide-react** + **emoji-mart data** — icons and the emoji dataset

## Development

```bash
npm install
npm run dev        # starts Convex (local), Vite, and Electron together
```

The first run downloads the Convex local backend binary and creates `.env.local`
with your deployment URL automatically. All data lives in the local Convex
deployment on your machine (`%TMP%`-independent, persisted under `~/.convex`).

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
                 QuickSwitcher, TrashModal, MoveDialog, IconPicker, CoverPicker
  lib/           utilities (debounce, gradients, tag colors)
```
