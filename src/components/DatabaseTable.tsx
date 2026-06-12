import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id, Doc } from "../../convex/_generated/dataModel";
import {
  AlignLeft,
  Calendar,
  CheckSquare,
  ChevronDown,
  Hash,
  Link as LinkIcon,
  MoreHorizontal,
  Plus,
  Tag,
  Trash2,
  ExternalLink,
  Check,
} from "lucide-react";
import { Popover, useAnchor } from "./Popover";
import { debounce, tagColor, TAG_PALETTE } from "../lib/utils";

type ColumnType = Doc<"dbColumns">["type"];

const TYPE_META: { type: ColumnType; label: string; icon: typeof Hash }[] = [
  { type: "text", label: "Text", icon: AlignLeft },
  { type: "number", label: "Number", icon: Hash },
  { type: "select", label: "Select", icon: Tag },
  { type: "date", label: "Date", icon: Calendar },
  { type: "checkbox", label: "Checkbox", icon: CheckSquare },
  { type: "url", label: "URL", icon: LinkIcon },
];

function typeIcon(type: ColumnType) {
  const Icon = TYPE_META.find((t) => t.type === type)?.icon ?? AlignLeft;
  return <Icon size={13} />;
}

/* ---------- Text-ish cell with local state, committed on blur/idle ---------- */
function TextCell({
  value,
  onCommit,
  type,
}: {
  value: string;
  onCommit: (v: string) => void;
  type: "text" | "number" | "url";
}) {
  const [local, setLocal] = useState(value);
  const focused = useRef(false);
  const commit = useRef(debounce(onCommit, 600));
  useEffect(() => {
    commit.current = debounce(onCommit, 600);
  }, [onCommit]);
  useEffect(() => {
    if (!focused.current) setLocal(value);
  }, [value]);

  return (
    <>
      <input
        className="cell-input"
        value={local}
        inputMode={type === "number" ? "decimal" : undefined}
        onFocus={() => (focused.current = true)}
        onChange={(e) => {
          setLocal(e.target.value);
          commit.current(e.target.value);
        }}
        onBlur={(e) => {
          focused.current = false;
          commit.current.cancel();
          if (e.target.value !== value) onCommit(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        }}
      />
      {type === "url" && local.trim() !== "" && (
        <button
          className="url-open-btn"
          title="Open link"
          onClick={() => {
            const url = local.startsWith("http") ? local : `https://${local}`;
            window.open(url, "_blank");
          }}
        >
          <ExternalLink size={12} />
        </button>
      )}
    </>
  );
}

/* ---------- Select cell ---------- */
function SelectCell({
  value,
  column,
  onCommit,
  onAddOption,
}: {
  value: string;
  column: Doc<"dbColumns">;
  onCommit: (v: string | null) => void;
  onAddOption: (option: string) => void;
}) {
  const { anchor, open, close } = useAnchor();
  const optionMenu = useAnchor();
  const [editingOption, setEditingOption] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const updateColumn = useMutation(api.database.updateColumn);
  const options = column.options ?? [];
  const colors = column.optionColors;
  const filtered = options.filter((o) =>
    o.toLowerCase().includes(search.trim().toLowerCase())
  );
  const canCreate =
    search.trim() !== "" &&
    !options.some((o) => o.toLowerCase() === search.trim().toLowerCase());

  const setOptionColor = (option: string, colorId: string) => {
    void updateColumn({
      columnId: column._id,
      optionColors: { ...(colors ?? {}), [option]: colorId },
    });
  };

  const deleteOption = (option: string) => {
    const nextColors = { ...(colors ?? {}) };
    delete nextColors[option];
    void updateColumn({
      columnId: column._id,
      options: options.filter((o) => o !== option),
      optionColors: nextColors,
    });
    if (value === option) onCommit(null);
  };

  return (
    <>
      <button
        className="db-cell-select"
        onClick={(e) => {
          setSearch("");
          open(e);
        }}
      >
        {value ? (
          <span
            className="tag-chip"
            style={{
              background: tagColor(value, colors).bg,
              color: tagColor(value, colors).fg,
            }}
          >
            {value}
          </span>
        ) : null}
      </button>
      {anchor && (
        <Popover anchor={anchor} onClose={close} className="select-popover">
          <input
            className="option-search"
            autoFocus
            placeholder="Search or create…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && canCreate) {
                onAddOption(search.trim());
                onCommit(search.trim());
                close();
              }
            }}
          />
          {value && (
            <button
              className="option-row"
              onClick={() => {
                onCommit(null);
                close();
              }}
            >
              <Trash2 size={13} /> Clear value
            </button>
          )}
          {filtered.map((option) => (
            <div key={option} className="option-row-wrap">
              <button
                className="option-row"
                onClick={() => {
                  onCommit(option);
                  close();
                }}
              >
                <span
                  className="tag-chip"
                  style={{
                    background: tagColor(option, colors).bg,
                    color: tagColor(option, colors).fg,
                  }}
                >
                  {option}
                </span>
                {option === value && <Check size={14} className="check" />}
              </button>
              <button
                className="option-settings-btn"
                title="Edit option"
                onClick={(e) => {
                  setEditingOption(option);
                  optionMenu.open(e);
                }}
              >
                <MoreHorizontal size={13} />
              </button>
            </div>
          ))}
          {canCreate && (
            <button
              className="option-row"
              onClick={() => {
                onAddOption(search.trim());
                onCommit(search.trim());
                close();
              }}
            >
              <Plus size={13} /> Create{" "}
              <span
                className="tag-chip"
                style={{
                  background: tagColor(search.trim(), colors).bg,
                  color: tagColor(search.trim(), colors).fg,
                }}
              >
                {search.trim()}
              </span>
            </button>
          )}
        </Popover>
      )}
      {optionMenu.anchor && editingOption && (
        <Popover
          anchor={optionMenu.anchor}
          onClose={() => {
            optionMenu.close();
            setEditingOption(null);
          }}
          className="color-popover"
        >
          <div className="menu-label">Color</div>
          <div className="color-grid">
            {TAG_PALETTE.map((c) => (
              <button
                key={c.id}
                className="color-swatch-row"
                onClick={() => {
                  setOptionColor(editingOption, c.id);
                  optionMenu.close();
                  setEditingOption(null);
                }}
              >
                <span className="color-dot" style={{ background: c.bg }}>
                  <span style={{ color: c.fg }}>A</span>
                </span>
                {c.label}
                {colors?.[editingOption] === c.id && (
                  <Check size={13} style={{ marginLeft: "auto" }} />
                )}
              </button>
            ))}
          </div>
          <div className="menu-sep" />
          <button
            className="menu-item danger"
            onClick={() => {
              deleteOption(editingOption);
              optionMenu.close();
              setEditingOption(null);
            }}
          >
            <Trash2 size={13} /> Delete option
          </button>
        </Popover>
      )}
    </>
  );
}

/* ---------- Column header with settings popover + resize handle ---------- */
function ColumnHeader({
  column,
  onDeleteAllowed,
}: {
  column: Doc<"dbColumns">;
  onDeleteAllowed: boolean;
}) {
  const { anchor, open, close } = useAnchor();
  const updateColumn = useMutation(api.database.updateColumn);
  const deleteColumn = useMutation(api.database.deleteColumn);
  const [name, setName] = useState(column.name);
  const [dragging, setDragging] = useState(false);
  const [liveWidth, setLiveWidth] = useState<number | null>(null);
  useEffect(() => setName(column.name), [column.name]);

  const width = liveWidth ?? column.width ?? 180;

  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
    const startX = e.clientX;
    const startWidth = width;
    let final = startWidth;
    const onMove = (ev: MouseEvent) => {
      final = Math.max(80, startWidth + (ev.clientX - startX));
      setLiveWidth(final);
    };
    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      setDragging(false);
      setLiveWidth(null);
      void updateColumn({ columnId: column._id, width: final });
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };

  const commitName = () => {
    if (name.trim() !== column.name) {
      void updateColumn({ columnId: column._id, name: name.trim() || "Column" });
    }
  };

  return (
    <div className="db-header-cell" style={{ width }} onClick={open}>
      {typeIcon(column.type)}
      <span className="col-name">{column.name}</span>
      <div
        className={`db-col-resizer${dragging ? " dragging" : ""}`}
        onMouseDown={startResize}
        onClick={(e) => e.stopPropagation()}
      />
      {anchor && (
        <Popover anchor={anchor} onClose={close} className="col-popover">
          <input
            className="col-name-input"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                commitName();
                close();
              }
            }}
          />
          <div className="menu-label">Type</div>
          {TYPE_META.map(({ type, label, icon: Icon }) => (
            <button
              key={type}
              className="menu-item"
              onClick={() => {
                void updateColumn({
                  columnId: column._id,
                  type,
                  ...(type === "select" && !column.options ? { options: [] } : {}),
                });
              }}
            >
              <Icon size={14} />
              {label}
              {column.type === type && (
                <Check size={14} style={{ marginLeft: "auto" }} />
              )}
            </button>
          ))}
          {onDeleteAllowed && (
            <>
              <div className="menu-sep" />
              <button
                className="menu-item danger"
                onClick={() => {
                  void deleteColumn({ columnId: column._id });
                  close();
                }}
              >
                <Trash2 size={14} /> Delete property
              </button>
            </>
          )}
        </Popover>
      )}
    </div>
  );
}

/* ---------- The database table ---------- */
export function DatabaseTable({ tableId }: { tableId: string }) {
  const data = useQuery(
    api.database.getTable,
    tableId ? { tableId: tableId as Id<"dbTables"> } : "skip"
  );
  const renameTable = useMutation(api.database.renameTable);
  const addColumn = useMutation(api.database.addColumn);
  const addRow = useMutation(api.database.addRow);
  const updateCell = useMutation(api.database.updateCell);
  const updateColumn = useMutation(api.database.updateColumn);
  const deleteRow = useMutation(api.database.deleteRow);

  const [title, setTitle] = useState<string | null>(null);

  if (data === undefined) {
    return (
      <div className="db-block">
        <div className="db-footer">Loading database…</div>
      </div>
    );
  }
  if (data === null) {
    return (
      <div className="db-block">
        <div className="db-footer">This database was deleted.</div>
      </div>
    );
  }

  const { table, columns, rows } = data;
  const sortedColumns = [...columns].sort((a, b) => a.order - b.order);
  const sortedRows = [...rows].sort((a, b) => a.order - b.order);

  const commitTitle = () => {
    if (title !== null && title !== table.name) {
      void renameTable({ tableId: table._id, name: title });
    }
    setTitle(null);
  };

  return (
    <div className="db-block" contentEditable={false}>
      <div className="db-title-row">
        <input
          className="db-title-input"
          placeholder="Untitled database"
          value={title ?? table.name}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={commitTitle}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          }}
        />
      </div>
      <div className="db-scroll">
        <div className="db-table">
          <div className="db-header-row">
            {sortedColumns.map((col) => (
              <ColumnHeader
                key={col._id}
                column={col}
                onDeleteAllowed={sortedColumns.length > 1}
              />
            ))}
            <button
              className="db-add-col"
              title="Add a property"
              onClick={() => void addColumn({ tableId: table._id })}
            >
              <Plus size={15} />
            </button>
          </div>
          {sortedRows.map((row) => (
            <div className="db-row" key={row._id}>
              <div className="db-row-gutter">
                <button
                  className="db-row-delete"
                  title="Delete row"
                  onClick={() => void deleteRow({ rowId: row._id })}
                >
                  <Trash2 size={13} />
                </button>
              </div>
              {sortedColumns.map((col) => {
                const raw = row.cells[col._id];
                const width = col.width ?? 180;
                switch (col.type) {
                  case "checkbox":
                    return (
                      <div className="db-cell center" key={col._id} style={{ width }}>
                        <input
                          type="checkbox"
                          checked={raw === true}
                          onChange={(e) =>
                            void updateCell({
                              rowId: row._id,
                              columnId: col._id,
                              value: e.target.checked ? true : null,
                            })
                          }
                        />
                      </div>
                    );
                  case "date":
                    return (
                      <div className="db-cell" key={col._id} style={{ width }}>
                        <input
                          type="date"
                          value={typeof raw === "string" ? raw : ""}
                          onChange={(e) =>
                            void updateCell({
                              rowId: row._id,
                              columnId: col._id,
                              value: e.target.value || null,
                            })
                          }
                        />
                      </div>
                    );
                  case "select":
                    return (
                      <div className="db-cell" key={col._id} style={{ width }}>
                        <SelectCell
                          value={typeof raw === "string" ? raw : ""}
                          column={col}
                          onCommit={(v) =>
                            void updateCell({
                              rowId: row._id,
                              columnId: col._id,
                              value: v,
                            })
                          }
                          onAddOption={(option) =>
                            void updateColumn({
                              columnId: col._id,
                              options: [...(col.options ?? []), option],
                            })
                          }
                        />
                      </div>
                    );
                  case "number":
                    return (
                      <div className="db-cell num" key={col._id} style={{ width }}>
                        <TextCell
                          type="number"
                          value={raw === undefined || raw === null ? "" : String(raw)}
                          onCommit={(v) => {
                            const num = parseFloat(v);
                            void updateCell({
                              rowId: row._id,
                              columnId: col._id,
                              value: v.trim() === "" || isNaN(num) ? null : num,
                            });
                          }}
                        />
                      </div>
                    );
                  default:
                    return (
                      <div className="db-cell" key={col._id} style={{ width }}>
                        <TextCell
                          type={col.type === "url" ? "url" : "text"}
                          value={typeof raw === "string" ? raw : ""}
                          onCommit={(v) =>
                            void updateCell({
                              rowId: row._id,
                              columnId: col._id,
                              value: v.trim() === "" ? null : v,
                            })
                          }
                        />
                      </div>
                    );
                }
              })}
            </div>
          ))}
          <button className="db-new-row" onClick={() => void addRow({ tableId: table._id })}>
            <Plus size={14} /> New row
          </button>
        </div>
      </div>
      <div className="db-footer">
        {sortedRows.length} {sortedRows.length === 1 ? "row" : "rows"}
      </div>
    </div>
  );
}
