import { useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Plus, Search, SquarePen, Trash2 } from "lucide-react";
import { buildChildrenMap, Page, PageTreeItem } from "./PageTree";

const EXPANDED_KEY = "slate:expanded";

export function Sidebar({
  pages,
  activePageId,
  onSelect,
  onOpenSearch,
  onOpenTrash,
  onMove,
  width,
  setWidth,
}: {
  pages: Page[];
  activePageId: Id<"pages"> | null;
  onSelect: (id: Id<"pages">) => void;
  onOpenSearch: () => void;
  onOpenTrash: () => void;
  onMove: (id: Id<"pages">) => void;
  width: number;
  setWidth: (w: number) => void;
}) {
  const create = useMutation(api.pages.create);
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
      </div>
      <div className="sidebar-scroll">
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
