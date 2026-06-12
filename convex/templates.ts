import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("userTemplates").collect();
  },
});

export const save = mutation({
  args: {
    name: v.string(),
    icon: v.optional(v.string()),
    markdown: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("userTemplates", args);
  },
});

export const remove = mutation({
  args: { templateId: v.id("userTemplates") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.templateId);
  },
});
