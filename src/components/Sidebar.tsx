import { useEffect, useState } from "react";
import { useConvex, useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Doc, Id } from "../../convex/_generated/dataModel";
import {
  CalendarDays,
  ChevronRight,
  FileText,
  FileUp,
  FolderPlus,
  GraduationCap,
  Keyboard,
  LayoutTemplate,
  ListFilter,
  PanelLeftClose,
  Plus,
  Search,
  Sparkles,
  SquarePen,
  Trash2,
  X,
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
  onOpenShortcuts,
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
  onOpenShortcuts: () => void;
  onCollapse: () => void;
  simpleMode?: boolean;
  onMove: (id: Id<"pages">) => void;
  width: number;
  setWidth: (w: number) => void;
}) {
  const convex = useConvex();
  const create = useMutation(api.pages.create);
  const moveRelative = useMutation(api.pages.moveRelative);
  const sections = useQuery(api.sections.list);
  const createSection = useMutation(api.sections.create);
  const renameSection = useMutation(api.sections.rename);
  const removeSection = useMutation(api.sections.remove);
  const setPageSection = useMutation(api.pages.setSection);
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
  const [recentOpen, setRecentOpen] = useState(
    () => localStorage.getItem("slate:recentOpen") !== "0"
  );

  useEffect(() => {
    localStorage.setItem("slate:recentOpen", recentOpen ? "1" : "0");
  }, [recentOpen]);

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
            <button
              className="sidebar-section-label section-toggle"
              onClick={() => setRecentOpen((open) => !open)}
              title={recentOpen ? "Collapse Recent" : "Expand Recent"}
            >
              Recent
              <ChevronRight
                size={12}
                style={{
                  transform: recentOpen ? "rotate(90deg)" : undefined,
                  transition: "transform 120ms",
                }}
              />
            </button>
            {recentOpen &&
              recent.map((page) => (
                <PageTreeItem
                  key={`recent-${page._id}`}
                  page={page}
                  depth={0}
                  {...treeProps}
                />
              ))}
          </div>
        )}
        {favorites.length > 0 && (
          <div data-tour="favorites">
            <div className="sidebar-section-label">Favorites</div>
            {favorites.map((page) => (
              <PageTreeItem key={`fav-${page._id}`} page={page} depth={0} {...treeProps} />
            ))}
          </div>
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
          <>
            {(sections ?? []).map((section) => {
              const secPages = rootPages.filter(
                (p) => p.sectionId === section._id
              );
              return (
                <SectionGroup
                  key={section._id}
                  section={section}
                  pages={secPages}
                  treeProps={treeProps}
                  onRename={(name) =>
                    void renameSection({ sectionId: section._id, name })
                  }
                  onRemove={() =>
                    void removeSection({ sectionId: section._id })
                  }
                  onDropPage={(pageId) =>
                    void setPageSection({ pageId, sectionId: section._id })
                  }
                />
              );
            })}
            {rootPages
              .filter((p) => !p.sectionId)
              .map((page) => (
                <PageTreeItem key={page._id} page={page} depth={0} {...treeProps} />
              ))}
          </>
        )}
        <button className="sidebar-item" style={{ marginTop: 4 }} onClick={newPage}>
          <Plus size={15} /> Add a page
        </button>
        <button
          className="sidebar-item subtle"
          onClick={() => {
            const name = window.prompt("Section name:");
            if (name && name.trim()) void createSection({ name: name.trim() });
          }}
        >
          <FolderPlus size={15} /> New section
        </button>
      </div>
      <div className="sidebar-bottom">
        <button className="sidebar-item" data-tour="trash" onClick={onOpenTrash}>
          <Trash2 size={15} /> Trash
        </button>
        <button className="sidebar-item" onClick={onStartTour}>
          <GraduationCap size={15} /> Tutorial
        </button>
        <button className="sidebar-item" onClick={onOpenShortcuts}>
          <Keyboard size={15} /> Shortcuts
        </button>
      </div>
      <div
        className={`sidebar-resizer${dragging ? " dragging" : ""}`}
        onMouseDown={startResize}
      />
    </div>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function SectionGroup({
  section,
  pages,
  treeProps,
  onRename,
  onRemove,
  onDropPage,
}: {
  section: Doc<"sections">;
  pages: Page[];
  treeProps: any;
  onRename: (name: string) => void;
  onRemove: () => void;
  onDropPage: (pageId: Id<"pages">) => void;
}) {
  const [open, setOpen] = useState(true);
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(section.name);
  const [dropActive, setDropActive] = useState(false);

  return (
    <div
      className={`section-group${dropActive ? " drop-active" : ""}`}
      onDragOver={(e) => {
        if (!e.dataTransfer.types.includes("slate/page")) return;
        e.preventDefault();
        setDropActive(true);
      }}
      onDragLeave={() => setDropActive(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDropActive(false);
        const id = e.dataTransfer.getData("slate/page");
        if (id) onDropPage(id as Id<"pages">);
      }}
    >
      <div className="sidebar-section-label section-head">
        <button className="section-toggle-btn" onClick={() => setOpen((o) => !o)}>
          <ChevronRight
            size={11}
            style={{ transform: open ? "rotate(90deg)" : undefined }}
          />
        </button>
        {renaming ? (
          <input
            className="section-rename"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => {
              setRenaming(false);
              if (name.trim()) onRename(name.trim());
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            }}
          />
        ) : (
          <span className="section-name" onDoubleClick={() => setRenaming(true)}>
            {section.name}
          </span>
        )}
        <button className="section-x" title="Delete section" onClick={onRemove}>
          <X size={12} />
        </button>
      </div>
      {open &&
        (pages.length === 0 ? (
          <div className="section-empty">Drag pages here</div>
        ) : (
          pages.map((page) => (
            <PageTreeItem key={page._id} page={page} depth={0} {...treeProps} />
          ))
        ))}
    </div>
  );
}
