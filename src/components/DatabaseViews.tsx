import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Doc } from "../../convex/_generated/dataModel";
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { tagColor } from "../lib/utils";

/* Alternative database views: kanban board (widget-style cards), month
 * calendar, and a simple bar chart. All read the same dbRows/dbColumns. */

type Column = Doc<"dbColumns">;
type Row = Doc<"dbRows">;

function rowTitle(row: Row, columns: Column[]): string {
  const titleCol =
    columns.find((c) => c.type === "text") ??
    columns.find((c) => c.type !== "select");
  const raw = titleCol ? row.cells[titleCol._id] : undefined;
  const text = typeof raw === "string" ? raw : raw != null ? String(raw) : "";
  return text || "Untitled";
}

/* ---------- Kanban board ---------- */
export function BoardView({
  columns,
  rows,
  tableId,
}: {
  columns: Column[];
  rows: Row[];
  tableId: Doc<"dbTables">["_id"];
}) {
  const updateCell = useMutation(api.database.updateCell);
  const addRow = useMutation(api.database.addRow);
  const [dragOverLane, setDragOverLane] = useState<string | null>(null);

  const groupCol = columns.find((c) => c.type === "select");
  if (!groupCol) {
    return (
      <div className="db-view-note">
        Board view needs a <b>select</b> column to group by — add one in table
        view.
      </div>
    );
  }
  const lanes: (string | null)[] = [...(groupCol.options ?? []), null];
  const dateCol = columns.find((c) => c.type === "date");
  const checkCol = columns.find((c) => c.type === "checkbox");

  const moveTo = async (rowId: string, lane: string | null) => {
    await updateCell({
      rowId: rowId as Row["_id"],
      columnId: groupCol._id,
      value: lane,
    });
  };

  const addCard = async (lane: string | null) => {
    const rowId = await addRow({ tableId });
    if (lane) {
      await updateCell({ rowId, columnId: groupCol._id, value: lane });
    }
  };

  return (
    <div className="db-board">
      {lanes.map((lane) => {
        const laneKey = lane ?? "__none__";
        const laneRows = rows.filter(
          (r) => (r.cells[groupCol._id] ?? null) === lane
        );
        const color = lane ? tagColor(lane, groupCol.optionColors) : null;
        return (
          <div
            key={laneKey}
            className={`db-lane${dragOverLane === laneKey ? " drag-over" : ""}`}
            onDragOver={(e) => {
              if (!e.dataTransfer.types.includes("slate/dbrow")) return;
              e.preventDefault();
              setDragOverLane(laneKey);
            }}
            onDragLeave={() => setDragOverLane(null)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOverLane(null);
              const rowId = e.dataTransfer.getData("slate/dbrow");
              if (rowId) void moveTo(rowId, lane);
            }}
          >
            <div className="db-lane-head">
              {lane ? (
                <span
                  className="tag-chip"
                  style={{ background: color!.bg, color: color!.fg }}
                >
                  {lane}
                </span>
              ) : (
                <span className="db-lane-none">No {groupCol.name}</span>
              )}
              <span className="db-lane-count">{laneRows.length}</span>
            </div>
            {laneRows.map((row) => (
              <div
                key={row._id}
                className="db-card"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("slate/dbrow", row._id);
                  e.dataTransfer.effectAllowed = "move";
                }}
              >
                <div className="db-card-title">{rowTitle(row, columns)}</div>
                <div className="db-card-meta">
                  {dateCol && typeof row.cells[dateCol._id] === "string" && (
                    <span className="db-card-date">
                      <CalendarDays size={11} />
                      {String(row.cells[dateCol._id])}
                    </span>
                  )}
                  {checkCol && row.cells[checkCol._id] === true && (
                    <span className="db-card-done">✓ {checkCol.name}</span>
                  )}
                </div>
              </div>
            ))}
            <button className="db-lane-add" onClick={() => void addCard(lane)}>
              <Plus size={13} /> Add
            </button>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- Month calendar ---------- */
export function CalendarView({
  columns,
  rows,
}: {
  columns: Column[];
  rows: Row[];
}) {
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const dateCol = columns.find((c) => c.type === "date");
  if (!dateCol) {
    return (
      <div className="db-view-note">
        Calendar view needs a <b>date</b> column — add one in table view.
      </div>
    );
  }

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayKey = new Date().toISOString().slice(0, 10);

  const byDate = new Map<string, Row[]>();
  let unscheduled = 0;
  for (const row of rows) {
    const value = row.cells[dateCol._id];
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const list = byDate.get(value) ?? [];
      list.push(row);
      byDate.set(value, list);
    } else {
      unscheduled++;
    }
  }

  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="db-calendar">
      <div className="db-cal-toolbar">
        <span className="db-cal-month">
          {cursor.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </span>
        <button onClick={() => setCursor(new Date(year, month - 1, 1))}>
          <ChevronLeft size={14} />
        </button>
        <button
          onClick={() => {
            const now = new Date();
            setCursor(new Date(now.getFullYear(), now.getMonth(), 1));
          }}
        >
          Today
        </button>
        <button onClick={() => setCursor(new Date(year, month + 1, 1))}>
          <ChevronRight size={14} />
        </button>
      </div>
      <div className="db-cal-grid">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="db-cal-dow">
            {d}
          </div>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} className="db-cal-day empty" />;
          const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(
            day
          ).padStart(2, "0")}`;
          const dayRows = byDate.get(key) ?? [];
          return (
            <div
              key={key}
              className={`db-cal-day${key === todayKey ? " today" : ""}`}
            >
              <span className="db-cal-num">{day}</span>
              {dayRows.slice(0, 3).map((row) => (
                <div key={row._id} className="db-cal-chip" title={rowTitle(row, columns)}>
                  {rowTitle(row, columns)}
                </div>
              ))}
              {dayRows.length > 3 && (
                <div className="db-cal-more">+{dayRows.length - 3} more</div>
              )}
            </div>
          );
        })}
      </div>
      {unscheduled > 0 && (
        <div className="db-footer">{unscheduled} unscheduled</div>
      )}
    </div>
  );
}

/* ---------- Bar chart ---------- */
export function ChartView({
  columns,
  rows,
}: {
  columns: Column[];
  rows: Row[];
}) {
  const selectCol = columns.find((c) => c.type === "select");
  const numberCol = columns.find((c) => c.type === "number");

  let bars: { label: string; value: number; bg: string; fg: string }[] = [];
  let caption = "";

  if (selectCol) {
    const lanes = [...(selectCol.options ?? [])];
    bars = lanes.map((lane) => {
      const laneRows = rows.filter((r) => r.cells[selectCol._id] === lane);
      const color = tagColor(lane, selectCol.optionColors);
      const value = numberCol
        ? laneRows.reduce((sum, r) => {
            const n = Number(r.cells[numberCol._id]);
            return sum + (isNaN(n) ? 0 : n);
          }, 0)
        : laneRows.length;
      return { label: lane, value, bg: color.fg, fg: color.fg };
    });
    caption = numberCol
      ? `Sum of ${numberCol.name} by ${selectCol.name}`
      : `Rows by ${selectCol.name}`;
  } else if (numberCol) {
    bars = rows.map((row) => {
      const n = Number(row.cells[numberCol._id]);
      return {
        label: rowTitle(row, columns),
        value: isNaN(n) ? 0 : n,
        bg: "var(--accent)",
        fg: "var(--accent)",
      };
    });
    caption = numberCol.name;
  } else {
    return (
      <div className="db-view-note">
        Chart view needs a <b>select</b> or <b>number</b> column.
      </div>
    );
  }

  const max = Math.max(1, ...bars.map((b) => b.value));

  return (
    <div className="db-chart">
      <div className="db-chart-caption">{caption}</div>
      {bars.map((bar) => (
        <div key={bar.label} className="db-chart-row">
          <span className="db-chart-label" title={bar.label}>
            {bar.label}
          </span>
          <div className="db-chart-track">
            <div
              className="db-chart-bar"
              style={{
                width: `${Math.max(2, (bar.value / max) * 100)}%`,
                background: bar.bg,
              }}
            />
          </div>
          <span className="db-chart-value">{bar.value}</span>
        </div>
      ))}
    </div>
  );
}
