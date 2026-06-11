import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const get = query({
  args: { drawingId: v.id("drawings") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.drawingId);
  },
});

export const create = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.insert("drawings", { scene: "", updatedAt: Date.now() });
  },
});

export const save = mutation({
  args: { drawingId: v.id("drawings"), scene: v.string() },
  handler: async (ctx, args) => {
    const drawing = await ctx.db.get(args.drawingId);
    if (!drawing) return;
    await ctx.db.patch(args.drawingId, { scene: args.scene, updatedAt: Date.now() });
  },
});
