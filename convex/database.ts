import { mutation, query, MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

const columnType = v.union(
  v.literal("text"),
  v.literal("number"),
  v.literal("select"),
  v.literal("date"),
  v.literal("checkbox"),
  v.literal("url"),
  v.literal("formula")
);

export const getTable = query({
  args: { tableId: v.id("dbTables") },
  handler: async (ctx, args) => {
    const table = await ctx.db.get(args.tableId);
    if (!table) return null;
    const columns = await ctx.db
      .query("dbColumns")
      .withIndex("by_table", (q) => q.eq("tableId", args.tableId))
      .collect();
    const rows = await ctx.db
      .query("dbRows")
      .withIndex("by_table", (q) => q.eq("tableId", args.tableId))
      .collect();
    return { table, columns, rows };
  },
});

/** Create a database with starter columns and a few empty rows. */
export const createTable = mutation({
  args: {},
  handler: async (ctx) => {
    const tableId = await ctx.db.insert("dbTables", { name: "" });
    await ctx.db.insert("dbColumns", {
      tableId,
      name: "Name",
      type: "text",
      order: 1,
      width: 260,
    });
    await ctx.db.insert("dbColumns", {
      tableId,
      name: "Tags",
      type: "select",
      options: [],
      order: 2,
      width: 180,
    });
    for (let i = 1; i <= 3; i++) {
      await ctx.db.insert("dbRows", { tableId, order: i, cells: {} });
    }
    return tableId;
  },
});

export const renameTable = mutation({
  args: { tableId: v.id("dbTables"), name: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.tableId, { name: args.name });
  },
});

export const setView = mutation({
  args: {
    tableId: v.id("dbTables"),
    view: v.union(
      v.literal("table"),
      v.literal("board"),
      v.literal("calendar"),
      v.literal("chart")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.tableId, { view: args.view });
  },
});

export const addColumn = mutation({
  args: { tableId: v.id("dbTables") },
  handler: async (ctx, args) => {
    const columns = await ctx.db
      .query("dbColumns")
      .withIndex("by_table", (q) => q.eq("tableId", args.tableId))
      .collect();
    const order = columns.reduce((max, c) => Math.max(max, c.order), 0) + 1;
    return await ctx.db.insert("dbColumns", {
      tableId: args.tableId,
      name: "Column",
      type: "text",
      order,
      width: 180,
    });
  },
});

export const updateColumn = mutation({
  args: {
    columnId: v.id("dbColumns"),
    name: v.optional(v.string()),
    type: v.optional(columnType),
    options: v.optional(v.array(v.string())),
    optionColors: v.optional(v.record(v.string(), v.string())),
    formula: v.optional(v.string()),
    hidden: v.optional(v.boolean()),
    width: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { columnId, ...rest } = args;
    const patch: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(rest)) {
      if (value !== undefined) patch[key] = value;
    }
    if (Object.keys(patch).length > 0) await ctx.db.patch(columnId, patch);
  },
});

export const deleteColumn = mutation({
  args: { columnId: v.id("dbColumns") },
  handler: async (ctx, args) => {
    const column = await ctx.db.get(args.columnId);
    if (!column) return;
    const rows = await ctx.db
      .query("dbRows")
      .withIndex("by_table", (q) => q.eq("tableId", column.tableId))
      .collect();
    for (const row of rows) {
      if (args.columnId in row.cells) {
        const cells = { ...row.cells };
        delete cells[args.columnId];
        await ctx.db.patch(row._id, { cells });
      }
    }
    await ctx.db.delete(args.columnId);
  },
});

async function maxRowOrder(ctx: MutationCtx, tableId: Id<"dbTables">) {
  const rows = await ctx.db
    .query("dbRows")
    .withIndex("by_table", (q) => q.eq("tableId", tableId))
    .collect();
  return rows.reduce((max, r) => Math.max(max, r.order), 0);
}

export const addRow = mutation({
  args: { tableId: v.id("dbTables") },
  handler: async (ctx, args) => {
    return await ctx.db.insert("dbRows", {
      tableId: args.tableId,
      order: (await maxRowOrder(ctx, args.tableId)) + 1,
      cells: {},
    });
  },
});

export const updateCell = mutation({
  args: { rowId: v.id("dbRows"), columnId: v.string(), value: v.any() },
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.rowId);
    if (!row) return;
    const cells = { ...row.cells };
    if (args.value === null || args.value === undefined || args.value === "") {
      delete cells[args.columnId];
    } else {
      cells[args.columnId] = args.value;
    }
    await ctx.db.patch(args.rowId, { cells });
  },
});

/** Create a fully-populated database in one call (used by the AI generator). */
export const createTableFull = mutation({
  args: {
    name: v.string(),
    columns: v.array(
      v.object({
        name: v.string(),
        type: columnType,
        options: v.optional(v.array(v.string())),
      })
    ),
    rows: v.array(v.array(v.any())),
  },
  handler: async (ctx, args) => {
    const tableId = await ctx.db.insert("dbTables", { name: args.name });
    const columnIds: string[] = [];
    for (let i = 0; i < args.columns.length; i++) {
      const col = args.columns[i];
      const columnId = await ctx.db.insert("dbColumns", {
        tableId,
        name: col.name,
        type: col.type,
        options: col.options,
        order: i + 1,
        width: i === 0 ? 240 : 170,
      });
      columnIds.push(columnId);
    }
    for (let r = 0; r < args.rows.length; r++) {
      const cells: Record<string, unknown> = {};
      const rowValues = args.rows[r];
      for (let c = 0; c < columnIds.length && c < rowValues.length; c++) {
        const value = rowValues[c];
        if (value !== null && value !== undefined && value !== "") {
          cells[columnIds[c]] = value;
        }
      }
      await ctx.db.insert("dbRows", { tableId, order: r + 1, cells });
    }
    return tableId;
  },
});

export const deleteRow = mutation({
  args: { rowId: v.id("dbRows") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.rowId);
  },
});
