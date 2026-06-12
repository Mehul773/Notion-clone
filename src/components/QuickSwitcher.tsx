import { useEffect, useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { FileText, Search } from "lucide-react";
import { Modal } from "./Popover";
import { Page } from "./PageTree";

export function pagePath(page: Page, byId: Map<string, Page>) {
  const parts: string[] = [];
  let cursor = page.parentId ? byId.get(page.parentId) : undefined;
  while (cursor) {
    parts.unshift(cursor.title || "Untitled");
    cursor = cursor.parentId ? byId.get(cursor.parentId) : undefined;
  }
  return parts.join(" / ");
}

export function QuickSwitcher({
  pages,
  onClose,
  onSelect,
}: {
  pages: Page[];
  onClose: () => void;
  onSelect: (id: Id<"pages">) => void;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);

  const searchResults = useQuery(api.search.pages, { query });
  const recent = useQuery(api.pages.recent);

  const byId = useMemo(() => new Map(pages.map((p) => [p._id as string, p])), [pages]);

  const results = query.trim() === "" ? (recent ?? []) : (searchResults ?? []);

  useEffect(() => setSelected(0), [query, results.length]);

  const choose = (id: Id<"pages">) => {
    onSelect(id);
    onClose();
  };

  return (
    <Modal onClose={onClose}>
      <div className="modal-search-row">
        <Search size={17} />
        <input
          autoFocus
          placeholder="Search pages…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setSelected((s) => Math.min(s + 1, results.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setSelected((s) => Math.max(s - 1, 0));
            } else if (e.key === "Enter" && results[selected]) {
              choose(results[selected]._id);
            }
          }}
        />
      </div>
      <div className="modal-list">
        {query.trim() === "" && results.length > 0 && (
          <div className="modal-list-label">Recent</div>
        )}
        {results.length === 0 ? (
          <div className="modal-empty">
            {query.trim() === "" ? "No pages yet" : "No results"}
          </div>
        ) : (
          results.map((page, i) => (
            <button
              key={page._id}
              className={`modal-row${i === selected ? " selected" : ""}`}
              onClick={() => choose(page._id)}
              onMouseMove={() => setSelected(i)}
            >
              <span className="row-icon">
                {page.icon ?? <FileText size={15} />}
              </span>
              <span className="row-title">{page.title || "Untitled"}</span>
              <span className="row-path">
                {(page as Page & { snippet?: string }).snippet ??
                  pagePath(page as Page, byId)}
              </span>
            </button>
          ))
        )}
      </div>
      <div className="modal-footer">
        <span>
          <kbd>↑</kbd> <kbd>↓</kbd> to navigate
        </span>
        <span>
          <kbd>↵</kbd> to open
        </span>
        <span>
          <kbd>esc</kbd> to close
        </span>
      </div>
    </Modal>
  );
}
