import { useMemo, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { FileText, Home, Search } from "lucide-react";
import { Modal } from "./Popover";
import { Page } from "./PageTree";
import { pagePath } from "./QuickSwitcher";

export function MoveDialog({
  pageId,
  pages,
  onClose,
}: {
  pageId: Id<"pages">;
  pages: Page[];
  onClose: () => void;
}) {
  const move = useMutation(api.pages.move);
  const [filter, setFilter] = useState("");

  const byId = useMemo(() => new Map(pages.map((p) => [p._id as string, p])), [pages]);

  // Exclude the page itself and its descendants (can't move into itself).
  const excluded = useMemo(() => {
    const set = new Set<string>([pageId]);
    let grew = true;
    while (grew) {
      grew = false;
      for (const p of pages) {
        if (p.parentId && set.has(p.parentId) && !set.has(p._id)) {
          set.add(p._id);
          grew = true;
        }
      }
    }
    return set;
  }, [pageId, pages]);

  const candidates = pages.filter(
    (p) =>
      !excluded.has(p._id) &&
      (p.title || "Untitled").toLowerCase().includes(filter.trim().toLowerCase())
  );

  const doMove = (newParentId?: Id<"pages">) => {
    void move({ pageId, newParentId });
    onClose();
  };

  return (
    <Modal onClose={onClose} width={480}>
      <div className="modal-search-row">
        <Search size={17} />
        <input
          autoFocus
          placeholder="Move page to…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>
      <div className="modal-list">
        <button className="modal-row" onClick={() => doMove(undefined)}>
          <span className="row-icon">
            <Home size={15} />
          </span>
          <span className="row-title">Top level</span>
        </button>
        {candidates.map((page) => (
          <button
            key={page._id}
            className="modal-row"
            onClick={() => doMove(page._id)}
          >
            <span className="row-icon">{page.icon ?? <FileText size={15} />}</span>
            <span className="row-title">{page.title || "Untitled"}</span>
            <span className="row-path">{pagePath(page, byId)}</span>
          </button>
        ))}
      </div>
    </Modal>
  );
}
