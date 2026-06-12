import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id, Doc } from "../../convex/_generated/dataModel";
import {
  AlignLeft,
  ArrowLeftToLine,
  ArrowRightToLine,
  BarChart3,
  Calendar,
  CalendarDays,
  CheckSquare,
  ChevronDown,
  Eye,
  EyeOff,
  Hash,
  Kanban,
  Link as LinkIcon,
  MoreHorizontal,
  Plus,
  Sigma,
  Table2,
  Tag,
  Trash2,
  ExternalLink,
  Check,
} from "lucide-react";
import { Popover, useAnchor } from "./Popover";
import { debounce, tagColor, TAG_PALETTE } from "../lib/utils";
import { evaluateFormula } from "../lib/formula";
import { BoardView, CalendarView, ChartView } from "./DatabaseViews";

type ColumnType = Doc<"dbColumns">["type"];

const TYPE_META: { type: ColumnType; label: string; icon: typeof Hash }[] = [
  { type: "text", label: "Text", icon: AlignLeft },
  { type: "number", label: "Number", icon: Hash },
  { type: "select", label: "Select", icon: Tag },
  { type: "date", label: "Date", icon: Calendar },
  { type: "checkbox", label: "Checkbox", icon: CheckSquare },
  { type: "url", label: "URL", icon: LinkIcon },
  { type: "formula", label: "Formula", icon: Sigma },
];

const VIEW_META = [
  { view: "table", label: "Table", icon: Table2 },
  { view: "board", label: "Board", icon: Kanban },
  { view: "calendar", label: "Calendar", icon: CalendarDays },
  { view: "chart", label: "Chart", icon: BarChart3 },
] as const;

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

/* ---------- Formula input with [Column] autocomplete ---------- */
function FormulaInput({
  column,
  siblings,
}: {
  column: Doc<"dbColumns">;
  siblings: Doc<"dbColumns">[];
}) {
  const updateColumn = useMutation(api.database.updateColumn);
  const [value, setValue] = useState(column.formula ?? "");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const refresh = (text: string, caret: number) => {
    const match = text.slice(0, caret).match(/\[([^\]]*)$/);
    if (!match) {
      setSuggestions([]);
      return;
    }
    const q = match[1].toLowerCase();
    setSuggestions(
      siblings
        .filter(
          (c) =>
            c._id !== column._id &&
            c.type !== "formula" &&
            c.name.toLowerCase().includes(q)
        )
        .map((c) => c.name)
        .slice(0, 6)
    );
  };

  const complete = (name: string) => {
    const el = inputRef.current;
    if (!el) return;
    const caret = el.selectionStart ?? value.length;
    const start = value.slice(0, caret).lastIndexOf("[");
    const next = value.slice(0, start + 1) + name + "]" + value.slice(caret);
    setValue(next);
    setSuggestions([]);
    void updateColumn({ columnId: column._id, formula: next });
    el.focus();
  };

  return (
    <div className="formula-wrap">
      <input
        ref={inputRef}
        className="col-name-input"
        placeholder="[Price] * (1 - [Discount])"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          refresh(e.target.value, e.target.selectionStart ?? 0);
        }}
        onKeyDown={(e) => {
          if (e.key === "Tab" && suggestions.length > 0) {
            e.preventDefault();
            complete(suggestions[0]);
          } else if (e.key === "Enter") {
            (e.target as HTMLInputElement).blur();
          } else if (e.key === "Escape") {
            setSuggestions([]);
          }
        }}
        onBlur={() => {
          setSuggestions([]);
          void updateColumn({ columnId: column._id, formula: value });
        }}
      />
      {suggestions.length > 0 && (
        <div className="formula-suggestions">
          {suggestions.map((name) => (
            <button
              key={name}
              onMouseDown={(e) => {
                e.preventDefault();
                complete(name);
              }}
            >
              [{name}] <span className="formula-sug-hint">Tab</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Column header with settings popover + resize handle ---------- */
function ColumnHeader({
  column,
  siblings,
  onDeleteAllowed,
}: {
  column: Doc<"dbColumns">;
  siblings: Doc<"dbColumns">[];
  onDeleteAllowed: boolean;
}) {
  const { anchor, open, close } = useAnchor();
  const updateColumn = useMutation(api.database.updateColumn);
  const deleteColumn = useMutation(api.database.deleteColumn);
  const addColumn = useMutation(api.database.addColumn);
  const moveColumn = useMutation(api.database.moveColumn);
  const [colDropSide, setColDropSide] = useState<"before" | "after" | null>(null);
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
    <div
      className={`db-header-cell${colDropSide ? ` col-drop-${colDropSide}` : ""}`}
      style={{ width }}
      onClick={open}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("slate/dbcol", column._id);
        e.dataTransfer.effectAllowed = "move";
      }}
      onDragOver={(e) => {
        if (!e.dataTransfer.types.includes("slate/dbcol")) return;
        e.preventDefault();
        const rect = e.currentTarget.getBoundingClientRect();
        setColDropSide(e.clientX - rect.left < rect.width / 2 ? "before" : "after");
      }}
      onDragLeave={() => setColDropSide(null)}
      onDrop={(e) => {
        e.preventDefault();
        const draggedId = e.dataTransfer.getData("slate/dbcol");
        const side = colDropSide ?? "before";
        setColDropSide(null);
        if (draggedId && draggedId !== column._id) {
          void moveColumn({
            columnId: draggedId as Id<"dbColumns">,
            targetId: column._id,
            side,
          });
        }
      }}
    >
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
          {column.type === "formula" && (
            <>
              <div className="menu-label">Formula — type [ for columns</div>
              <FormulaInput column={column} siblings={siblings} />
            </>
          )}
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
          <div className="menu-sep" />
          <button
            className="menu-item"
            onClick={() => {
              void addColumn({ tableId: column.tableId, atOrder: column.order });
              close();
            }}
          >
            <ArrowLeftToLine size={14} /> Insert column left
          </button>
          <button
            className="menu-item"
            onClick={() => {
              void addColumn({ tableId: column.tableId, atOrder: column.order + 1 });
              close();
            }}
          >
            <ArrowRightToLine size={14} /> Insert column right
          </button>
          <button
            className="menu-item"
            onClick={() => {
              void updateColumn({ columnId: column._id, hidden: true });
              close();
            }}
          >
            <EyeOff size={14} /> Hide column
          </button>
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
  const setView = useMutation(api.database.setView);
  const addColumn = useMutation(api.database.addColumn);
  const addRow = useMutation(api.database.addRow);
  const updateCell = useMutation(api.database.updateCell);
  const updateColumn = useMutation(api.database.updateColumn);
  const deleteRow = useMutation(api.database.deleteRow);

  const [title, setTitle] = useState<string | null>(null);
  const hiddenMenu = useAnchor();

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
  const visibleColumns = sortedColumns.filter((c) => !c.hidden);
  const hiddenColumns = sortedColumns.filter((c) => c.hidden);
  const sortedRows = [...rows].sort((a, b) => a.order - b.order);
  const view = table.view ?? "table";

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
        <div className="db-view-switcher">
          {hiddenColumns.length > 0 && (
            <button
              className="db-view-btn"
              title={`${hiddenColumns.length} hidden column(s)`}
              onClick={hiddenMenu.open}
            >
              <EyeOff size={13} />
            </button>
          )}
          {VIEW_META.map(({ view: id, label, icon: Icon }) => (
            <button
              key={id}
              className={`db-view-btn${view === id ? " active" : ""}`}
              title={label}
              onClick={() => void setView({ tableId: table._id, view: id })}
            >
              <Icon size={13} />
            </button>
          ))}
        </div>
        {hiddenMenu.anchor && (
          <Popover anchor={hiddenMenu.anchor} onClose={hiddenMenu.close} className="menu">
            <div className="menu-label">Hidden columns</div>
            {hiddenColumns.map((col) => (
              <button
                key={col._id}
                className="menu-item"
                onClick={() =>
                  void updateColumn({ columnId: col._id, hidden: false })
                }
              >
                <Eye size={13} /> {col.name}
              </button>
            ))}
          </Popover>
        )}
      </div>
      {view === "board" && (
        <BoardView columns={visibleColumns} rows={sortedRows} tableId={table._id} />
      )}
      {view === "calendar" && (
        <CalendarView columns={visibleColumns} rows={sortedRows} />
      )}
      {view === "chart" && (
        <ChartView columns={visibleColumns} rows={sortedRows} />
      )}
      {view === "table" && (
      <div className="db-scroll">
        <div className="db-table">
          <div className="db-header-row">
            <div className="db-row-gutter header">#</div>
            {visibleColumns.map((col) => (
              <ColumnHeader
                key={col._id}
                column={col}
                siblings={sortedColumns}
                onDeleteAllowed={visibleColumns.length > 1}
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
          {sortedRows.map((row, rowIndex) => (
            <div className="db-row" key={row._id}>
              <div className="db-row-gutter">
                <span className="db-row-num">{rowIndex + 1}</span>
                <button
                  className="db-row-delete"
                  title="Insert row below (Alt+click: above)"
                  onClick={(e) =>
                    void addRow({
                      tableId: table._id,
                      atOrder: e.altKey ? row.order : row.order + 1,
                    })
                  }
                >
                  <Plus size={13} />
                </button>
                <button
                  className="db-row-delete"
                  title="Delete row"
                  onClick={() => void deleteRow({ rowId: row._id })}
                >
                  <Trash2 size={13} />
                </button>
              </div>
              {visibleColumns.map((col) => {
                const raw = row.cells[col._id];
                const width = col.width ?? 180;
                switch (col.type) {
                  case "formula":
                    return (
                      <div className="db-cell num formula" key={col._id} style={{ width }}>
                        {evaluateFormula(col.formula ?? "", row, sortedColumns)}
                      </div>
                    );
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
      )}
      <div className="db-footer">
        {sortedRows.length} {sortedRows.length === 1 ? "row" : "rows"}
      </div>
    </div>
  );
}
