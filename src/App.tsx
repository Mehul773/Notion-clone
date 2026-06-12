import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useConvex, useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import {
  ChevronRight,
  Copy,
  FileDown,
  FileText,
  LayoutTemplate,
  Maximize2,
  Minimize2,
  Moon,
  PanelLeftOpen,
  MoreHorizontal,
  Plus,
  Search as SearchIcon,
  SquarePen,
  Star,
  Sun,
  Trash2,
} from "lucide-react";
import { Sidebar } from "./components/Sidebar";
import { Page } from "./components/PageTree";
import { PageView } from "./components/PageView";
import { QuickSwitcher } from "./components/QuickSwitcher";
import { TrashModal } from "./components/TrashModal";
import { MoveDialog } from "./components/MoveDialog";
import { AiDialog } from "./components/AiDialog";
import { ImportMarkdownDialog } from "./components/ImportMarkdownDialog";
import { TemplatesDialog } from "./components/TemplatesDialog";
import { ShortcutsModal } from "./components/ShortcutsModal";
import {
  DEFAULT_FONT_SETTINGS,
  FontSettings,
  SettingsPopover,
} from "./components/SettingsPopover";
import { Popover, useAnchor } from "./components/Popover";
import { getCurrentEditor } from "./lib/editorRegistry";
import { randomCoverCss } from "./lib/utils";
import { startTour, TOUR_DONE_KEY } from "./lib/tour";
import { createShowcasePage, SHOWCASE_TITLE } from "./lib/showcase";

const ACTIVE_KEY = "slate:activePage";
const THEME_KEY = "slate:theme";
const SIDEBAR_KEY = "slate:sidebarWidth";
const FONT_KEY = "slate:fontSettings";

function downloadFile(name: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function countWordsInBlocks(blocks: any[]): number {
  let words = 0;
  const visit = (items: any[]) => {
    for (const item of items) {
      if (typeof item?.text === "string") {
        words += item.text.split(/\s+/).filter(Boolean).length;
      }
      if (Array.isArray(item?.content)) visit(item.content);
      if (Array.isArray(item?.children)) visit(item.children);
      if (item?.content?.rows) {
        for (const row of item.content.rows) {
          for (const cell of row.cells ?? []) {
            if (Array.isArray(cell)) visit(cell);
            else if (Array.isArray(cell?.content)) visit(cell.content);
          }
        }
      }
    }
  };
  visit(blocks);
  return words;
}

export default function App() {
  const pages = useQuery(api.pages.list);
  const create = useMutation(api.pages.create);
  const toggleFavorite = useMutation(api.pages.toggleFavorite);
  const duplicate = useMutation(api.pages.duplicate);
  const moveToTrash = useMutation(api.pages.moveToTrash);
  const saveTemplate = useMutation(api.templates.save);

  const [activePageId, setActivePageId] = useState<Id<"pages"> | null>(
    () => (localStorage.getItem(ACTIVE_KEY) as Id<"pages">) || null
  );
  const [theme, setTheme] = useState<"light" | "dark">(() =>
    localStorage.getItem(THEME_KEY) === "light" ? "light" : "dark"
  );
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const stored = parseInt(localStorage.getItem(SIDEBAR_KEY) ?? "", 10);
    return Number.isFinite(stored) ? stored : 252;
  });
  const [fontSettings, setFontSettings] = useState<FontSettings>(() => {
    try {
      return {
        ...DEFAULT_FONT_SETTINGS,
        ...JSON.parse(localStorage.getItem(FONT_KEY) ?? "{}"),
      };
    } catch {
      return DEFAULT_FONT_SETTINGS;
    }
  });
  const [searchOpen, setSearchOpen] = useState(false);
  const [trashOpen, setTrashOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(
    () => localStorage.getItem("slate:sidebarOpen") !== "0"
  );
  const [templateSaved, setTemplateSaved] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [movePageId, setMovePageId] = useState<Id<"pages"> | null>(null);
  const [wordCount, setWordCount] = useState<number | null>(null);
  const fontMenu = useAnchor();
  const pageMenu = useAnchor();
  const convex = useConvex();

  // One-time fill of the content search index for docs saved before it existed.
  useEffect(() => {
    if (localStorage.getItem("slate:searchBackfill") === "1") return;
    void convex
      .mutation(api.docs.backfillSearchText, {})
      .then(() => localStorage.setItem("slate:searchBackfill", "1"));
  }, [convex]);


  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_KEY, theme);
    window.slate?.setTheme(theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_KEY, String(sidebarWidth));
  }, [sidebarWidth]);

  useEffect(() => {
    localStorage.setItem("slate:sidebarOpen", sidebarOpen ? "1" : "0");
  }, [sidebarOpen]);

  useEffect(() => {
    localStorage.setItem(FONT_KEY, JSON.stringify(fontSettings));
    const root = document.documentElement;
    root.style.setProperty("--editor-fs", `${fontSettings.editorSize}px`);
    root.style.setProperty("--code-fs", `${fontSettings.codeSize}px`);
    const families: Record<string, string> = {
      default: "",
      serif: "Georgia, 'Times New Roman', serif",
      mono: "ui-monospace, 'Cascadia Mono', Consolas, monospace",
    };
    let family = families[fontSettings.fontFamily] ?? "";
    if (fontSettings.googleFont) {
      const name = fontSettings.googleFont;
      const id = "slate-google-font";
      let link = document.getElementById(id) as HTMLLinkElement | null;
      const href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
        name
      ).replace(/%20/g, "+")}:wght@400;600;700&display=swap`;
      if (!link) {
        link = document.createElement("link");
        link.id = id;
        link.rel = "stylesheet";
        document.head.appendChild(link);
      }
      if (link.href !== href) link.href = href;
      family = `'${name}', ${family || "sans-serif"}`;
    } else {
      document.getElementById("slate-google-font")?.remove();
    }
    if (family) root.style.setProperty("--editor-font", family);
    else root.style.removeProperty("--editor-font");
  }, [fontSettings]);

  const selectPage = useCallback((id: Id<"pages"> | null) => {
    setActivePageId(id);
    if (id) localStorage.setItem(ACTIVE_KEY, id);
    else localStorage.removeItem(ACTIVE_KEY);
  }, []);

  const finishTour = useCallback(async () => {
    const existing = pages?.find((p) => p.title === SHOWCASE_TITLE);
    if (existing) {
      selectPage(existing._id);
      return;
    }
    const id = await createShowcasePage(convex);
    selectPage(id);
  }, [convex, pages, selectPage]);

  // First launch: run the onboarding tour once the sidebar is on screen.
  const tourStarted = useRef(false);
  useEffect(() => {
    if (pages === undefined || tourStarted.current) return;
    if (localStorage.getItem(TOUR_DONE_KEY) === "1") return;
    tourStarted.current = true;
    const timer = setTimeout(
      () => startTour({ onFinish: () => void finishTour() }),
      600
    );
    return () => clearTimeout(timer);
  }, [pages, finishTour]);

  // If the active page was trashed or deleted, clear the selection.
  const activePage = useMemo(
    () => pages?.find((p) => p._id === activePageId) ?? null,
    [pages, activePageId]
  );
  useEffect(() => {
    if (pages !== undefined && activePageId && !activePage) {
      selectPage(null);
    }
  }, [pages, activePageId, activePage, selectPage]);

  const newPage = useCallback(async () => {
    const id = await create({ cover: randomCoverCss() });
    selectPage(id);
  }, [create, selectPage]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "p")) {
        e.preventDefault();
        setSearchOpen((open) => !open);
      } else if ((e.ctrlKey || e.metaKey) && e.key === "n") {
        e.preventDefault();
        void newPage();
      } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "f" || e.key === "F")) {
        e.preventDefault();
        setFocusMode((f) => !f);
      } else if ((e.ctrlKey || e.metaKey) && e.key === "\\") {
        e.preventDefault();
        setSidebarOpen((open) => !open);
      } else if ((e.ctrlKey || e.metaKey) && (e.key === "=" || e.key === "+")) {
        e.preventDefault();
        window.slate?.zoom(0.5);
      } else if ((e.ctrlKey || e.metaKey) && e.key === "-") {
        e.preventDefault();
        window.slate?.zoom(-0.5);
      } else if ((e.ctrlKey || e.metaKey) && e.key === "0") {
        e.preventDefault();
        window.slate?.zoom(0);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [newPage]);

  const byId = useMemo(
    () => new Map((pages ?? []).map((p) => [p._id as string, p])),
    [pages]
  );

  const breadcrumbs = useMemo(() => {
    if (!activePage) return [];
    const chain: Page[] = [activePage];
    let cursor = activePage.parentId ? byId.get(activePage.parentId) : undefined;
    while (cursor) {
      chain.unshift(cursor);
      cursor = cursor.parentId ? byId.get(cursor.parentId) : undefined;
    }
    return chain;
  }, [activePage, byId]);

  const exportPage = async (format: "md" | "html") => {
    const editor = getCurrentEditor();
    if (!editor || !activePage) return;
    const name = activePage.title || "Untitled";
    if (format === "md") {
      const md = await editor.blocksToMarkdownLossy(editor.document);
      downloadFile(`${name}.md`, `# ${name}\n\n${md}`, "text/markdown");
    } else {
      const html = await editor.blocksToFullHTML(editor.document);
      downloadFile(
        `${name}.html`,
        `<!doctype html><html><head><meta charset="utf-8"><title>${name}</title></head><body><h1>${name}</h1>${html}</body></html>`,
        "text/html"
      );
    }
    pageMenu.close();
  };

  if (pages === undefined) {
    return (
      <div className="app" style={{ alignItems: "center", justifyContent: "center" }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div
      className={`app${focusMode ? " focus-mode" : ""}${
        sidebarOpen ? "" : " sidebar-collapsed"
      }`}
    >
      <Sidebar
        pages={pages}
        activePageId={activePageId}
        onSelect={selectPage}
        onOpenSearch={() => setSearchOpen(true)}
        onOpenTrash={() => setTrashOpen(true)}
        onOpenAi={() => setAiOpen(true)}
        onOpenImport={() => setImportOpen(true)}
        onOpenTemplates={() => setTemplatesOpen(true)}
        onStartTour={() => startTour({ onFinish: () => void finishTour() })}
        onOpenShortcuts={() => setShortcutsOpen(true)}
        onCollapse={() => setSidebarOpen(false)}
        simpleMode={fontSettings.simpleMode}
        onMove={setMovePageId}
        width={sidebarWidth}
        setWidth={setSidebarWidth}
      />
      <div className="main">
        <div className="topbar">
          {!sidebarOpen && (
            <>
              <button
                className="topbar-btn"
                title="Show sidebar (Ctrl+\)"
                onClick={() => setSidebarOpen(true)}
              >
                <PanelLeftOpen size={16} />
              </button>
              <button
                className="topbar-btn"
                title="Search (Ctrl+K)"
                onClick={() => setSearchOpen(true)}
              >
                <SearchIcon size={16} />
              </button>
              <button
                className="topbar-btn"
                title="New page (Ctrl+N)"
                onClick={() => void newPage()}
              >
                <SquarePen size={16} />
              </button>
            </>
          )}
          <div className="breadcrumbs">
            {breadcrumbs.map((page, i) => (
              <span key={page._id} style={{ display: "flex", alignItems: "center", gap: 2, minWidth: 0 }}>
                {i > 0 && (
                  <ChevronRight size={13} className="crumb-sep" />
                )}
                <button className="crumb" onClick={() => selectPage(page._id)}>
                  {page.icon && <span>{page.icon}</span>}
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                    {page.title || "Untitled"}
                  </span>
                </button>
              </span>
            ))}
          </div>
          <div className="topbar-spacer" />
          {activePage && (
            <button
              className={`topbar-btn${activePage.isFavorite ? " starred" : ""}`}
              title={activePage.isFavorite ? "Remove from favorites" : "Add to favorites"}
              onClick={() => void toggleFavorite({ pageId: activePage._id })}
            >
              <Star
                size={16}
                fill={activePage.isFavorite ? "currentColor" : "none"}
              />
            </button>
          )}
          <button
            className="topbar-btn"
            title="Text & display settings"
            style={{ fontWeight: 600, fontSize: 14.5 }}
            data-tour="font"
            onClick={fontMenu.open}
          >
            Aa
          </button>
          <button
            className="topbar-btn"
            title="Focus mode (Ctrl+Shift+F)"
            data-tour="focus"
            onClick={() => setFocusMode((f) => !f)}
          >
            {focusMode ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
          <button
            className="topbar-btn"
            title="Toggle theme"
            data-tour="theme"
            onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          {activePage && (
            <button
              className="topbar-btn"
              title="Page options"
              data-tour="page-options"
              onClick={(e) => {
                const editor = getCurrentEditor();
                setWordCount(
                  editor ? countWordsInBlocks(editor.document) : null
                );
                pageMenu.open(e);
              }}
            >
              <MoreHorizontal size={16} />
            </button>
          )}
        </div>

        {activePageId && activePage ? (
          <PageView pageId={activePageId} theme={theme} />
        ) : (
          <div className="empty-state">
            <div className="empty-state-logo">S</div>
            <h2>Welcome to Slate</h2>
            <span>Your ideas, organized. Create a page to get started.</span>
            <button onClick={() => void newPage()}>
              <Plus size={16} /> New page
            </button>
            {pages.length > 0 && (
              <button
                style={{ background: "transparent", color: "var(--text-secondary)" }}
                onClick={() => setSearchOpen(true)}
              >
                <FileText size={15} /> Open an existing page
              </button>
            )}
          </div>
        )}
      </div>

      {fontMenu.anchor && (
        <SettingsPopover
          anchor={fontMenu.anchor}
          onClose={fontMenu.close}
          settings={fontSettings}
          setSettings={setFontSettings}
        />
      )}
      {pageMenu.anchor && activePage && (
        <Popover anchor={pageMenu.anchor} onClose={pageMenu.close} className="menu" align="end">
          <button className="menu-item" onClick={() => void exportPage("md")}>
            <FileDown size={14} /> Export as Markdown
          </button>
          <button className="menu-item" onClick={() => void exportPage("html")}>
            <FileDown size={14} /> Export as HTML
          </button>
          <button
            className="menu-item"
            onClick={async () => {
              pageMenu.close();
              const id = await duplicate({ pageId: activePage._id });
              if (id) selectPage(id);
            }}
          >
            <Copy size={14} /> Duplicate page
          </button>
          <button
            className="menu-item"
            disabled={templateSaved}
            onClick={async () => {
              const editor = getCurrentEditor();
              if (!editor) return;
              const md = await editor.blocksToMarkdownLossy(editor.document);
              const name = activePage.title || "Untitled";
              const frontmatter = `---\ntitle: ${name}\n${
                activePage.icon ? `icon: ${activePage.icon}\n` : ""
              }---\n\n`;
              await saveTemplate({
                name,
                icon: activePage.icon,
                markdown: frontmatter + md,
              });
              setTemplateSaved(true);
              setTimeout(() => {
                setTemplateSaved(false);
                pageMenu.close();
              }, 900);
            }}
          >
            <LayoutTemplate size={14} />
            {templateSaved ? "Saved to Templates!" : "Save as template"}
          </button>
          <div className="menu-sep" />
          <button
            className="menu-item danger"
            onClick={() => {
              pageMenu.close();
              void moveToTrash({ pageId: activePage._id });
            }}
          >
            <Trash2 size={14} /> Move to trash
          </button>
          {wordCount !== null && (
            <>
              <div className="menu-sep" />
              <div className="menu-label">
                {wordCount} {wordCount === 1 ? "word" : "words"}
              </div>
            </>
          )}
        </Popover>
      )}
      {searchOpen && (
        <QuickSwitcher
          pages={pages}
          onClose={() => setSearchOpen(false)}
          onSelect={selectPage}
        />
      )}
      {trashOpen && <TrashModal onClose={() => setTrashOpen(false)} />}
      {shortcutsOpen && <ShortcutsModal onClose={() => setShortcutsOpen(false)} />}
      {aiOpen && (
        <AiDialog onClose={() => setAiOpen(false)} onSelect={selectPage} />
      )}
      {importOpen && (
        <ImportMarkdownDialog
          onClose={() => setImportOpen(false)}
          onSelect={selectPage}
        />
      )}
      {templatesOpen && (
        <TemplatesDialog
          onClose={() => setTemplatesOpen(false)}
          onSelect={selectPage}
        />
      )}
      {focusMode && (
        <button
          className="focus-exit-btn"
          title="Exit focus mode (Ctrl+Shift+F)"
          onClick={() => setFocusMode(false)}
        >
          <Minimize2 size={14} /> Exit focus
        </button>
      )}
      {movePageId && (
        <MoveDialog
          pageId={movePageId}
          pages={pages}
          onClose={() => setMovePageId(null)}
        />
      )}
    </div>
  );
}
