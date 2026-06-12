import { useEffect, useState } from "react";
import { useConvex, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import {
  CalendarDays,
  FileText,
  FileUp,
  GraduationCap,
  LayoutTemplate,
  ListFilter,
  PanelLeftClose,
  Plus,
  Search,
  Sparkles,
  SquarePen,
  Trash2,
} from "lucide-react";
import { buildChildrenMap, Page, PageTreeItem } from "./PageTree";
import { openDailyNote } from "../lib/dailyNote";
import { randomCoverCss } from "../lib/utils";

const EXPANDED_KEY = "slate:expanded";

export function Sidebar({
  pages,
  activePageId,
  onSelect,
  onOpenSearch,
  onOpenTrash,
  onOpenAi,
  onOpenImport,
  onOpenTemplates,
  onStartTour,
  onCollapse,
  simpleMode,
  onMove,
  width,
  setWidth,
}: {
  pages: Page[];
  activePageId: Id<"pages"> | null;
  onSelect: (id: Id<"pages">) => void;
  onOpenSearch: () => void;
  onOpenTrash: () => void;
  onOpenAi: () => void;
  onOpenImport: () => void;
  onOpenTemplates: () => void;
  onStartTour: () => void;
  onCollapse: () => void;
  simpleMode?: boolean;
  onMove: (id: Id<"pages">) => void;
  width: number;
  setWidth: (w: number) => void;
}) {
  const convex = useConvex();
  const create = useMutation(api.pages.create);
  const moveRelative = useMutation(api.pages.moveRelative);
  const [openingToday, setOpeningToday] = useState(false);
  const [rootDropActive, setRootDropActive] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(localStorage.getItem(EXPANDED_KEY) ?? "{}");
    } catch {
      return {};
    }
  });
  const [dragging, setDragging] = useState(false);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    localStorage.setItem(EXPANDED_KEY, JSON.stringify(expanded));
  }, [expanded]);

  const toggle = (id: string) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const childrenMap = buildChildrenMap(pages);
  const rootPages = childrenMap.get("root") ?? [];
  const favorites = pages
    .filter((p) => p.isFavorite)
    .sort((a, b) => a.order - b.order);
  const recent = [...pages]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 5);

  const newPage = async () => {
    const id = await create({ cover: randomCoverCss() });
    onSelect(id);
  };

  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(true);
    const onMoveHandler = (ev: MouseEvent) => {
      setWidth(Math.min(420, Math.max(200, ev.clientX)));
    };
    const onUp = () => {
      document.removeEventListener("mousemove", onMoveHandler);
      document.removeEventListener("mouseup", onUp);
      setDragging(false);
    };
    document.addEventListener("mousemove", onMoveHandler);
    document.addEventListener("mouseup", onUp);
  };

  const treeProps = {
    childrenMap,
    activePageId,
    expanded,
    onToggle: toggle,
    onSelect,
    onMove,
  };

  return (
    <div className="sidebar" style={{ width }}>
      <div className="sidebar-top">
        <div className="workspace-row">
          <div className="workspace-logo">S</div>
          <span className="workspace-name">Slate</span>
          <button
            className="tree-action-btn sidebar-collapse-btn"
            title="Hide sidebar (Ctrl+\)"
            onClick={onCollapse}
          >
            <PanelLeftClose size={15} />
          </button>
        </div>
      </div>
      <div className="sidebar-actions">
        <button className="sidebar-item" data-tour="search" onClick={onOpenSearch}>
          <Search size={15} /> Search
          <span className="kbd-hint">Ctrl K</span>
        </button>
        <button className="sidebar-item" data-tour="new-page" onClick={newPage}>
          <SquarePen size={15} /> New page
          <span className="kbd-hint">Ctrl N</span>
        </button>
        <button
          className="sidebar-item"
          data-tour="today"
          disabled={openingToday}
          onClick={async () => {
            if (openingToday) return;
            setOpeningToday(true);
            try {
              onSelect(await openDailyNote(convex, pages));
            } finally {
              setOpeningToday(false);
            }
          }}
        >
          <CalendarDays size={15} /> Today's note
        </button>
        <button className="sidebar-item" data-tour="templates" onClick={onOpenTemplates}>
          <LayoutTemplate size={15} /> Templates
        </button>
        {!simpleMode && (
          <>
            <button className="sidebar-item" data-tour="ai" onClick={onOpenAi}>
              <Sparkles size={15} /> AI workspace
            </button>
            <button className="sidebar-item" data-tour="import" onClick={onOpenImport}>
              <FileUp size={15} /> Import Markdown
            </button>
          </>
        )}
      </div>
      <div
        className={`sidebar-scroll${rootDropActive ? " root-drop" : ""}`}
        onDragOver={(e) => {
          if (!e.dataTransfer.types.includes("slate/page")) return;
          // Only when dropping on the empty area, not on a tree item.
          if (e.target === e.currentTarget) {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
            setRootDropActive(true);
          }
        }}
        onDragLeave={(e) => {
          if (e.target === e.currentTarget) setRootDropActive(false);
        }}
        onDrop={(e) => {
          if (e.target !== e.currentTarget) return;
          e.preventDefault();
          setRootDropActive(false);
          const draggedId = e.dataTransfer.getData("slate/page");
          if (draggedId) {
            void moveRelative({
              pageId: draggedId as Id<"pages">,
              position: "root",
            });
          }
        }}
      >
        {recent.length > 0 && (
          <div data-tour="recent">
            <div className="sidebar-section-label">Recent</div>
            {recent.map((page) => (
              <button
                key={`recent-${page._id}`}
                className={`tree-item recent-item${
                  activePageId === page._id ? " active" : ""
                }`}
                onClick={() => onSelect(page._id)}
              >
                <span className="recent-icon">
                  {page.icon ?? <FileText size={14} />}
                </span>
                <span className="tree-item-title">
                  {page.title || "Untitled"}
                </span>
                {Date.now() - page._creationTime < 10 * 60 * 1000 && (
                  <span className="new-badge">NEW</span>
                )}
              </button>
            ))}
          </div>
        )}
        {favorites.length > 0 && (
          <>
            <div className="sidebar-section-label">Favorites</div>
            {favorites.map((page) => (
              <PageTreeItem key={`fav-${page._id}`} page={page} depth={0} {...treeProps} />
            ))}
          </>
        )}
        <div className="sidebar-section-label" style={{ display: "flex", alignItems: "center" }}>
          Pages
          <span className="sidebar-filter">
            <ListFilter size={11} />
            <input
              placeholder="Filter…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </span>
        </div>
        {filter.trim() !== "" ? (
          pages
            .filter((p) =>
              (p.title || "Untitled")
                .toLowerCase()
                .includes(filter.trim().toLowerCase())
            )
            .map((page) => (
              <button
                key={`filter-${page._id}`}
                className={`tree-item recent-item${
                  activePageId === page._id ? " active" : ""
                }`}
                onClick={() => onSelect(page._id)}
              >
                <span className="recent-icon">
                  {page.icon ?? <FileText size={14} />}
                </span>
                <span className="tree-item-title">
                  {page.title || "Untitled"}
                </span>
              </button>
            ))
        ) : (
          rootPages.map((page) => (
            <PageTreeItem key={page._id} page={page} depth={0} {...treeProps} />
          ))
        )}
        <button className="sidebar-item" style={{ marginTop: 4 }} onClick={newPage}>
          <Plus size={15} /> Add a page
        </button>
      </div>
      <div className="sidebar-bottom">
        <button className="sidebar-item" data-tour="trash" onClick={onOpenTrash}>
          <Trash2 size={15} /> Trash
        </button>
        <button className="sidebar-item" onClick={onStartTour}>
          <GraduationCap size={15} /> Tutorial
        </button>
      </div>
      <div
        className={`sidebar-resizer${dragging ? " dragging" : ""}`}
        onMouseDown={startResize}
      />
    </div>
  );
}
