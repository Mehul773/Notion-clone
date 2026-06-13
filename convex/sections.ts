import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const sections = await ctx.db.query("sections").collect();
    return sections.sort((a, b) => a.order - b.order);
  },
});

export const create = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const all = await ctx.db.query("sections").collect();
    const order = all.reduce((max, s) => Math.max(max, s.order), 0) + 1;
    return await ctx.db.insert("sections", { name: args.name, order });
  },
});

export const rename = mutation({
  args: { sectionId: v.id("sections"), name: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.sectionId, { name: args.name });
  },
});

export const remove = mutation({
  args: { sectionId: v.id("sections") },
  handler: async (ctx, args) => {
    // Un-assign pages from the deleted section rather than deleting them.
    const pages = await ctx.db.query("pages").collect();
    for (const page of pages) {
      if (page.sectionId === args.sectionId) {
        await ctx.db.patch(page._id, { sectionId: undefined });
      }
    }
    await ctx.db.delete(args.sectionId);
  },
});
