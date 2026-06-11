import { useMemo, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Doc, Id } from "../../convex/_generated/dataModel";
import {
  ChevronRight,
  CornerUpRight,
  Copy,
  FileText,
  MoreHorizontal,
  PenLine,
  Plus,
  Star,
  StarOff,
  Trash2,
} from "lucide-react";
import { Popover, useAnchor } from "./Popover";

export type Page = Doc<"pages">;

export function buildChildrenMap(pages: Page[]) {
  const map = new Map<string, Page[]>();
  for (const page of pages) {
    const key = page.parentId ?? "root";
    const list = map.get(key) ?? [];
    list.push(page);
    map.set(key, list);
  }
  for (const list of map.values()) {
    list.sort((a, b) => a.order - b.order);
  }
  return map;
}

export function PageTreeItem({
  page,
  childrenMap,
  depth,
  activePageId,
  expanded,
  onToggle,
  onSelect,
  onMove,
}: {
  page: Page;
  childrenMap: Map<string, Page[]>;
  depth: number;
  activePageId: Id<"pages"> | null;
  expanded: Record<string, boolean>;
  onToggle: (id: string) => void;
  onSelect: (id: Id<"pages">) => void;
  onMove: (id: Id<"pages">) => void;
}) {
  const create = useMutation(api.pages.create);
  const duplicate = useMutation(api.pages.duplicate);
  const moveToTrash = useMutation(api.pages.moveToTrash);
  const toggleFavorite = useMutation(api.pages.toggleFavorite);
  const rename = useMutation(api.pages.rename);

  const menu = useAnchor();
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");

  const isExpanded = expanded[page._id] === true;
  const children = childrenMap.get(page._id) ?? [];
  const isActive = activePageId === page._id;

  const addChild = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const id = await create({ parentId: page._id });
    if (!isExpanded) onToggle(page._id);
    onSelect(id);
  };

  const commitRename = () => {
    setRenaming(false);
    if (renameValue.trim() !== page.title) {
      void rename({ pageId: page._id, title: renameValue.trim() });
    }
  };

  return (
    <>
      <div
        className={`tree-item${isActive ? " active" : ""}`}
        style={{ paddingLeft: depth * 14 }}
        onClick={() => onSelect(page._id)}
        onContextMenu={(e) => {
          e.preventDefault();
          menu.setAnchor(new DOMRect(e.clientX, e.clientY, 0, 0));
        }}
      >
        <span
          className="tree-item-toggle"
          onClick={(e) => {
            e.stopPropagation();
            onToggle(page._id);
          }}
          title={isExpanded ? "Collapse" : "Expand"}
        >
          <span className="icon-default">
            {page.icon ? (
              <span className="icon-emoji">{page.icon}</span>
            ) : (
              <FileText size={15} />
            )}
          </span>
          <span className="chevron">
            <ChevronRight
              size={14}
              style={{
                transform: isExpanded ? "rotate(90deg)" : undefined,
                transition: "transform 120ms",
              }}
            />
          </span>
        </span>
        {renaming ? (
          <input
            className="tree-rename-input"
            autoFocus
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={commitRename}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitRename();
              if (e.key === "Escape") setRenaming(false);
            }}
          />
        ) : (
          <span className={`tree-item-title${page.title ? "" : " untitled"}`}>
            {page.title || "Untitled"}
          </span>
        )}
        <span className="tree-item-actions">
          <button
            className="tree-action-btn"
            title="More options"
            onClick={(e) => {
              e.stopPropagation();
              menu.open(e);
            }}
          >
            <MoreHorizontal size={14} />
          </button>
          <button className="tree-action-btn" title="Add a page inside" onClick={addChild}>
            <Plus size={14} />
          </button>
        </span>
      </div>

      {isExpanded &&
        (children.length === 0 ? (
          <div className="tree-empty-note" style={{ paddingLeft: depth * 14 + 28 }}>
            No pages inside
          </div>
        ) : (
          children.map((child) => (
            <PageTreeItem
              key={child._id}
              page={child}
              childrenMap={childrenMap}
              depth={depth + 1}
              activePageId={activePageId}
              expanded={expanded}
              onToggle={onToggle}
              onSelect={onSelect}
              onMove={onMove}
            />
          ))
        ))}

      {menu.anchor && (
        <Popover anchor={menu.anchor} onClose={menu.close} className="menu">
          <button
            className="menu-item"
            onClick={() => {
              void toggleFavorite({ pageId: page._id });
              menu.close();
            }}
          >
            {page.isFavorite ? <StarOff size={14} /> : <Star size={14} />}
            {page.isFavorite ? "Remove from favorites" : "Add to favorites"}
          </button>
          <button
            className="menu-item"
            onClick={() => {
              setRenameValue(page.title);
              setRenaming(true);
              menu.close();
            }}
          >
            <PenLine size={14} /> Rename
          </button>
          <button
            className="menu-item"
            onClick={async () => {
              menu.close();
              const id = await duplicate({ pageId: page._id });
              if (id) onSelect(id);
            }}
          >
            <Copy size={14} /> Duplicate
          </button>
          <button
            className="menu-item"
            onClick={() => {
              menu.close();
              onMove(page._id);
            }}
          >
            <CornerUpRight size={14} /> Move to…
          </button>
          <div className="menu-sep" />
          <button
            className="menu-item danger"
            onClick={() => {
              menu.close();
              void moveToTrash({ pageId: page._id });
            }}
          >
            <Trash2 size={14} /> Move to trash
          </button>
        </Popover>
      )}
    </>
  );
}
