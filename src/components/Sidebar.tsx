import { useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { FileUp, Plus, Search, Sparkles, SquarePen, Trash2 } from "lucide-react";
import { buildChildrenMap, Page, PageTreeItem } from "./PageTree";

const EXPANDED_KEY = "slate:expanded";

export function Sidebar({
  pages,
  activePageId,
  onSelect,
  onOpenSearch,
  onOpenTrash,
  onOpenAi,
  onOpenImport,
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
  onMove: (id: Id<"pages">) => void;
  width: number;
  setWidth: (w: number) => void;
}) {
  const create = useMutation(api.pages.create);
  const moveRelative = useMutation(api.pages.moveRelative);
  const [rootDropActive, setRootDropActive] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(localStorage.getItem(EXPANDED_KEY) ?? "{}");
    } catch {
      return {};
    }
  });
  const [dragging, setDragging] = useState(false);

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

  const newPage = async () => {
    const id = await create({});
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
        </div>
      </div>
      <div className="sidebar-actions">
        <button className="sidebar-item" onClick={onOpenSearch}>
          <Search size={15} /> Search
          <span className="kbd-hint">Ctrl K</span>
        </button>
        <button className="sidebar-item" onClick={newPage}>
          <SquarePen size={15} /> New page
          <span className="kbd-hint">Ctrl N</span>
        </button>
        <button className="sidebar-item" onClick={onOpenAi}>
          <Sparkles size={15} /> AI workspace
        </button>
        <button className="sidebar-item" onClick={onOpenImport}>
          <FileUp size={15} /> Import Markdown
        </button>
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
        {favorites.length > 0 && (
          <>
            <div className="sidebar-section-label">Favorites</div>
            {favorites.map((page) => (
              <PageTreeItem key={`fav-${page._id}`} page={page} depth={0} {...treeProps} />
            ))}
          </>
        )}
        <div className="sidebar-section-label">Pages</div>
        {rootPages.map((page) => (
          <PageTreeItem key={page._id} page={page} depth={0} {...treeProps} />
        ))}
        <button className="sidebar-item" style={{ marginTop: 4 }} onClick={newPage}>
          <Plus size={15} /> Add a page
        </button>
      </div>
      <div className="sidebar-bottom">
        <button className="sidebar-item" onClick={onOpenTrash}>
          <Trash2 size={15} /> Trash
        </button>
      </div>
      <div
        className={`sidebar-resizer${dragging ? " dragging" : ""}`}
        onMouseDown={startResize}
      />
    </div>
  );
}
