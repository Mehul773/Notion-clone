import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import {
  ChevronRight,
  FileText,
  Moon,
  Plus,
  Star,
  Sun,
} from "lucide-react";
import { Sidebar } from "./components/Sidebar";
import { Page } from "./components/PageTree";
import { PageView } from "./components/PageView";
import { QuickSwitcher } from "./components/QuickSwitcher";
import { TrashModal } from "./components/TrashModal";
import { MoveDialog } from "./components/MoveDialog";

const ACTIVE_KEY = "slate:activePage";
const THEME_KEY = "slate:theme";
const SIDEBAR_KEY = "slate:sidebarWidth";

export default function App() {
  const pages = useQuery(api.pages.list);
  const create = useMutation(api.pages.create);
  const toggleFavorite = useMutation(api.pages.toggleFavorite);

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
  const [searchOpen, setSearchOpen] = useState(false);
  const [trashOpen, setTrashOpen] = useState(false);
  const [movePageId, setMovePageId] = useState<Id<"pages"> | null>(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_KEY, theme);
    window.slate?.setTheme(theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_KEY, String(sidebarWidth));
  }, [sidebarWidth]);

  const selectPage = useCallback((id: Id<"pages"> | null) => {
    setActivePageId(id);
    if (id) localStorage.setItem(ACTIVE_KEY, id);
    else localStorage.removeItem(ACTIVE_KEY);
  }, []);

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
    const id = await create({});
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

  if (pages === undefined) {
    return (
      <div className="app" style={{ alignItems: "center", justifyContent: "center" }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="app">
      <Sidebar
        pages={pages}
        activePageId={activePageId}
        onSelect={selectPage}
        onOpenSearch={() => setSearchOpen(true)}
        onOpenTrash={() => setTrashOpen(true)}
        onMove={setMovePageId}
        width={sidebarWidth}
        setWidth={setSidebarWidth}
      />
      <div className="main">
        <div className="topbar">
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
            title="Toggle theme"
            onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
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

      {searchOpen && (
        <QuickSwitcher
          pages={pages}
          onClose={() => setSearchOpen(false)}
          onSelect={selectPage}
        />
      )}
      {trashOpen && <TrashModal onClose={() => setTrashOpen(false)} />}
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
