import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

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
    const doc = await ctx.db
      .query("docs")
      .withIndex("by_page", (q) => q.eq("pageId", args.pageId))
      .unique();
    if (doc) {
      await ctx.db.patch(doc._id, { content: args.content, updatedAt: Date.now() });
    } else {
      await ctx.db.insert("docs", {
        pageId: args.pageId,
        content: args.content,
        updatedAt: Date.now(),
      });
    }
    await ctx.db.patch(args.pageId, { updatedAt: Date.now() });
  },
});
