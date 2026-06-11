import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { FileText, RotateCcw, Search, Trash2 } from "lucide-react";
import { Modal } from "./Popover";

export function TrashModal({ onClose }: { onClose: () => void }) {
  const trashed = useQuery(api.pages.listTrash);
  const restore = useMutation(api.pages.restore);
  const deleteForever = useMutation(api.pages.deleteForever);
  const emptyTrash = useMutation(api.pages.emptyTrash);
  const [filter, setFilter] = useState("");
  const [confirmEmpty, setConfirmEmpty] = useState(false);

  const items = (trashed ?? []).filter((p) =>
    (p.title || "Untitled").toLowerCase().includes(filter.trim().toLowerCase())
  );

  return (
    <Modal onClose={onClose}>
      <div className="modal-search-row">
        <Search size={17} />
        <input
          autoFocus
          placeholder="Filter pages in trash…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>
      <div className="modal-list">
        {items.length === 0 ? (
          <div className="modal-empty">Trash is empty</div>
        ) : (
          items.map((page) => (
            <div key={page._id} className="modal-row" style={{ cursor: "default" }}>
              <span className="row-icon">{page.icon ?? <FileText size={15} />}</span>
              <span className="row-title">{page.title || "Untitled"}</span>
              <span className="row-actions">
                <button
                  className="tree-action-btn"
                  title="Restore"
                  onClick={() => void restore({ pageId: page._id })}
                >
                  <RotateCcw size={14} />
                </button>
                <button
                  className="tree-action-btn"
                  title="Delete permanently"
                  onClick={() => void deleteForever({ pageId: page._id })}
                >
                  <Trash2 size={14} />
                </button>
              </span>
            </div>
          ))
        )}
      </div>
      {(trashed?.length ?? 0) > 0 && (
        <div className="modal-footer">
          <span>
            {trashed!.length} {trashed!.length === 1 ? "page" : "pages"} in trash
          </span>
          <span className="grow" />
          <button
            className="danger-link"
            onClick={() => {
              if (confirmEmpty) {
                void emptyTrash();
                setConfirmEmpty(false);
              } else {
                setConfirmEmpty(true);
              }
            }}
          >
            {confirmEmpty ? "Click again to confirm" : "Empty trash"}
          </button>
        </div>
      )}
    </Modal>
  );
}
