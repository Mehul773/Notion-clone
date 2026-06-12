import { mutation, query, MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

/** All non-trashed pages, for building the sidebar tree client-side. */
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("pages")
      .withIndex("by_trashed", (q) => q.eq("isTrashed", false))
      .collect();
  },
});

export const get = query({
  args: { pageId: v.id("pages") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.pageId);
  },
});

/** Recently updated pages for the quick switcher's empty state. */
export const recent = query({
  args: {},
  handler: async (ctx) => {
    const pages = await ctx.db
      .query("pages")
      .withIndex("by_trashed", (q) => q.eq("isTrashed", false))
      .collect();
    return pages.sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 12);
  },
});

export const listTrash = query({
  args: {},
  handler: async (ctx) => {
    const pages = await ctx.db
      .query("pages")
      .withIndex("by_trashed", (q) => q.eq("isTrashed", true))
      .collect();
    return pages.sort((a, b) => (b.trashedAt ?? 0) - (a.trashedAt ?? 0));
  },
});

async function nextOrder(ctx: MutationCtx, parentId: Id<"pages"> | undefined) {
  const siblings = await ctx.db
    .query("pages")
    .withIndex("by_parent", (q) => q.eq("parentId", parentId))
    .collect();
  return siblings.reduce((max, p) => Math.max(max, p.order), 0) + 1;
}

export const create = mutation({
  args: {
    parentId: v.optional(v.id("pages")),
    title: v.optional(v.string()),
    cover: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const pageId = await ctx.db.insert("pages", {
      title: args.title ?? "",
      parentId: args.parentId,
      cover: args.cover,
      order: await nextOrder(ctx, args.parentId),
      isFavorite: false,
      isTrashed: false,
      updatedAt: Date.now(),
    });
    await ctx.db.insert("docs", {
      pageId,
      content: "",
      updatedAt: Date.now(),
    });
    return pageId;
  },
});

export const rename = mutation({
  args: { pageId: v.id("pages"), title: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.pageId, { title: args.title, updatedAt: Date.now() });
  },
});

export const setIcon = mutation({
  args: { pageId: v.id("pages"), icon: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.pageId, { icon: args.icon, updatedAt: Date.now() });
  },
});

export const setCover = mutation({
  args: { pageId: v.id("pages"), cover: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.pageId, { cover: args.cover, updatedAt: Date.now() });
  },
});

export const toggleFavorite = mutation({
  args: { pageId: v.id("pages") },
  handler: async (ctx, args) => {
    const page = await ctx.db.get(args.pageId);
    if (!page) return;
    await ctx.db.patch(args.pageId, { isFavorite: !page.isFavorite });
  },
});

async function childrenOf(ctx: MutationCtx, pageId: Id<"pages">) {
  return await ctx.db
    .query("pages")
    .withIndex("by_parent", (q) => q.eq("parentId", pageId))
    .collect();
}

/** Move a page (and implicitly its subtree) under a new parent, or to the root. */
export const move = mutation({
  args: {
    pageId: v.id("pages"),
    newParentId: v.optional(v.id("pages")),
  },
  handler: async (ctx, args) => {
    if (args.newParentId) {
      // Prevent cycles: the new parent must not be the page itself or a descendant.
      let cursor: Id<"pages"> | undefined = args.newParentId;
      while (cursor) {
        if (cursor === args.pageId) return;
        const p: { parentId?: Id<"pages"> } | null = await ctx.db.get(cursor);
        cursor = p?.parentId;
      }
    }
    await ctx.db.patch(args.pageId, {
      parentId: args.newParentId,
      order: await nextOrder(ctx, args.newParentId),
      updatedAt: Date.now(),
    });
  },
});

/** Drag-and-drop move: place a page before/after a sibling or inside a parent. */
export const moveRelative = mutation({
  args: {
    pageId: v.id("pages"),
    targetId: v.optional(v.id("pages")),
    position: v.union(
      v.literal("before"),
      v.literal("after"),
      v.literal("inside"),
      v.literal("root")
    ),
  },
  handler: async (ctx, args) => {
    if (args.position === "root" || !args.targetId) {
      await ctx.db.patch(args.pageId, {
        parentId: undefined,
        order: await nextOrder(ctx, undefined),
        updatedAt: Date.now(),
      });
      return;
    }
    if (args.targetId === args.pageId) return;
    const target = await ctx.db.get(args.targetId);
    if (!target) return;

    const newParentId =
      args.position === "inside" ? args.targetId : target.parentId;

    // Prevent cycles: the new parent must not be the page itself or a descendant.
    let cursor: Id<"pages"> | undefined = newParentId;
    while (cursor) {
      if (cursor === args.pageId) return;
      const p: { parentId?: Id<"pages"> } | null = await ctx.db.get(cursor);
      cursor = p?.parentId;
    }

    let order: number;
    if (args.position === "inside") {
      order = await nextOrder(ctx, newParentId);
    } else {
      // Squeeze between the target and its neighbor using fractional orders.
      order = args.position === "before" ? target.order - 0.5 : target.order + 0.5;
    }
    await ctx.db.patch(args.pageId, {
      parentId: newParentId,
      order,
      updatedAt: Date.now(),
    });
  },
});

export const moveToTrash = mutation({
  args: { pageId: v.id("pages") },
  handler: async (ctx, args) => {
    const trash = async (id: Id<"pages">) => {
      await ctx.db.patch(id, {
        isTrashed: true,
        isFavorite: false,
        trashedAt: Date.now(),
      });
      for (const child of await childrenOf(ctx, id)) {
        if (!child.isTrashed) await trash(child._id);
      }
    };
    await trash(args.pageId);
  },
});

export const restore = mutation({
  args: { pageId: v.id("pages") },
  handler: async (ctx, args) => {
    const page = await ctx.db.get(args.pageId);
    if (!page) return;
    // If the original parent is gone or still trashed, restore to the root.
    let parentId = page.parentId;
    if (parentId) {
      const parent = await ctx.db.get(parentId);
      if (!parent || parent.isTrashed) parentId = undefined;
    }
    await ctx.db.patch(args.pageId, {
      isTrashed: false,
      trashedAt: undefined,
      parentId,
      order: await nextOrder(ctx, parentId),
    });
    const restoreChildren = async (id: Id<"pages">) => {
      for (const child of await childrenOf(ctx, id)) {
        if (child.isTrashed) {
          await ctx.db.patch(child._id, { isTrashed: false, trashedAt: undefined });
          await restoreChildren(child._id);
        }
      }
    };
    await restoreChildren(args.pageId);
  },
});

async function deleteDatabasesInContent(ctx: MutationCtx, content: string) {
  // Database blocks embed a dbTables id in their props; clean those up too.
  const matches = content.matchAll(/"tableId":"([^"]+)"/g);
  for (const match of matches) {
    const tableId = ctx.db.normalizeId("dbTables", match[1]);
    if (!tableId) continue;
    const columns = await ctx.db
      .query("dbColumns")
      .withIndex("by_table", (q) => q.eq("tableId", tableId))
      .collect();
    for (const col of columns) await ctx.db.delete(col._id);
    const rows = await ctx.db
      .query("dbRows")
      .withIndex("by_table", (q) => q.eq("tableId", tableId))
      .collect();
    for (const row of rows) await ctx.db.delete(row._id);
    if (await ctx.db.get(tableId)) await ctx.db.delete(tableId);
  }
  // Same for embedded drawings.
  const drawingMatches = content.matchAll(/"drawingId":"([^"]+)"/g);
  for (const match of drawingMatches) {
    const drawingId = ctx.db.normalizeId("drawings", match[1]);
    if (drawingId && (await ctx.db.get(drawingId))) {
      await ctx.db.delete(drawingId);
    }
  }
}

export const deleteForever = mutation({
  args: { pageId: v.id("pages") },
  handler: async (ctx, args) => {
    const wipe = async (id: Id<"pages">) => {
      for (const child of await childrenOf(ctx, id)) {
        await wipe(child._id);
      }
      const doc = await ctx.db
        .query("docs")
        .withIndex("by_page", (q) => q.eq("pageId", id))
        .unique();
      if (doc) {
        await deleteDatabasesInContent(ctx, doc.content);
        await ctx.db.delete(doc._id);
      }
      await ctx.db.delete(id);
    };
    await wipe(args.pageId);
  },
});

export const emptyTrash = mutation({
  args: {},
  handler: async (ctx) => {
    const trashed = await ctx.db
      .query("pages")
      .withIndex("by_trashed", (q) => q.eq("isTrashed", true))
      .collect();
    for (const page of trashed) {
      const doc = await ctx.db
        .query("docs")
        .withIndex("by_page", (q) => q.eq("pageId", page._id))
        .unique();
      if (doc) {
        await deleteDatabasesInContent(ctx, doc.content);
        await ctx.db.delete(doc._id);
      }
      await ctx.db.delete(page._id);
    }
  },
});

export const duplicate = mutation({
  args: { pageId: v.id("pages") },
  handler: async (ctx, args) => {
    const source = await ctx.db.get(args.pageId);
    if (!source) return null;

    const copySubtree = async (
      srcId: Id<"pages">,
      parentId: Id<"pages"> | undefined,
      titleSuffix: string
    ): Promise<Id<"pages">> => {
      const src = (await ctx.db.get(srcId))!;
      const newId = await ctx.db.insert("pages", {
        title: (src.title || "Untitled") + titleSuffix,
        icon: src.icon,
        cover: src.cover,
        parentId,
        order: await nextOrder(ctx, parentId),
        isFavorite: false,
        isTrashed: false,
        updatedAt: Date.now(),
      });

      const doc = await ctx.db
        .query("docs")
        .withIndex("by_page", (q) => q.eq("pageId", srcId))
        .unique();
      let content = doc?.content ?? "";

      // Deep-copy embedded drawings.
      const drawingIds = [...content.matchAll(/"drawingId":"([^"]+)"/g)].map(
        (m) => m[1]
      );
      for (const rawId of drawingIds) {
        const drawingId = ctx.db.normalizeId("drawings", rawId);
        if (!drawingId) continue;
        const drawing = await ctx.db.get(drawingId);
        if (!drawing) continue;
        const newDrawingId = await ctx.db.insert("drawings", {
          scene: drawing.scene,
          updatedAt: Date.now(),
        });
        content = content.replaceAll(
          `"drawingId":"${rawId}"`,
          `"drawingId":"${newDrawingId}"`
        );
      }

      // Deep-copy any embedded databases so the copy doesn't share data.
      const tableIds = [...content.matchAll(/"tableId":"([^"]+)"/g)].map((m) => m[1]);
      for (const rawId of tableIds) {
        const tableId = ctx.db.normalizeId("dbTables", rawId);
        if (!tableId) continue;
        const table = await ctx.db.get(tableId);
        if (!table) continue;
        const newTableId = await ctx.db.insert("dbTables", { name: table.name });
        const columns = await ctx.db
          .query("dbColumns")
          .withIndex("by_table", (q) => q.eq("tableId", tableId))
          .collect();
        const colIdMap = new Map<string, string>();
        for (const col of columns) {
          const newColId = await ctx.db.insert("dbColumns", {
            tableId: newTableId,
            name: col.name,
            type: col.type,
            options: col.options,
            width: col.width,
            order: col.order,
          });
          colIdMap.set(col._id, newColId);
        }
        const rows = await ctx.db
          .query("dbRows")
          .withIndex("by_table", (q) => q.eq("tableId", tableId))
          .collect();
        for (const row of rows) {
          const cells: Record<string, unknown> = {};
          for (const [colId, value] of Object.entries(row.cells)) {
            const mapped = colIdMap.get(colId);
            if (mapped) cells[mapped] = value;
          }
          await ctx.db.insert("dbRows", {
            tableId: newTableId,
            order: row.order,
            cells,
          });
        }
        content = content.replaceAll(`"tableId":"${rawId}"`, `"tableId":"${newTableId}"`);
      }

      await ctx.db.insert("docs", {
        pageId: newId,
        content,
        updatedAt: Date.now(),
      });

      const children = await childrenOf(ctx, srcId);
      for (const child of children.sort((a, b) => a.order - b.order)) {
        if (!child.isTrashed) await copySubtree(child._id, newId, "");
      }
      return newId;
    };

    return await copySubtree(args.pageId, source.parentId, " (copy)");
  },
});
