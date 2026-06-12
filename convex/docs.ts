import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Flatten BlockNote JSON into plain text for the full-text search index. */
function extractSearchText(content: string): string {
  try {
    const blocks = JSON.parse(content);
    if (!Array.isArray(blocks)) return "";
    const parts: string[] = [];
    const visit = (items: any[]) => {
      for (const item of items) {
        if (typeof item?.text === "string") parts.push(item.text);
        if (Array.isArray(item?.content)) visit(item.content);
        else if (item?.content?.rows) {
          for (const row of item.content.rows) {
            for (const cell of row.cells ?? []) {
              if (Array.isArray(cell)) visit(cell);
              else if (Array.isArray(cell?.content)) visit(cell.content);
            }
          }
        }
        if (Array.isArray(item?.children)) visit(item.children);
      }
    };
    visit(blocks);
    return parts.join(" ").slice(0, 100_000);
  } catch {
    return "";
  }
}

export const get = query({
  args: { pageId: v.id("pages") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("docs")
      .withIndex("by_page", (q) => q.eq("pageId", args.pageId))
      .unique();
  },
});

export const save = mutation({
  args: { pageId: v.id("pages"), content: v.string() },
  handler: async (ctx, args) => {
    const searchText = extractSearchText(args.content);
    const doc = await ctx.db
      .query("docs")
      .withIndex("by_page", (q) => q.eq("pageId", args.pageId))
      .unique();
    if (doc) {
      await ctx.db.patch(doc._id, {
        content: args.content,
        searchText,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("docs", {
        pageId: args.pageId,
        content: args.content,
        searchText,
        updatedAt: Date.now(),
      });
    }
    await ctx.db.patch(args.pageId, { updatedAt: Date.now() });
  },
});

/** One-time index fill for docs saved before full-text search existed. */
export const backfillSearchText = mutation({
  args: {},
  handler: async (ctx) => {
    const docs = await ctx.db.query("docs").collect();
    for (const doc of docs) {
      if (doc.searchText === undefined) {
        await ctx.db.patch(doc._id, {
          searchText: extractSearchText(doc.content),
        });
      }
    }
  },
});
