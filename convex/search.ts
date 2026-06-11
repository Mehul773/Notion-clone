import { query } from "./_generated/server";
import { v } from "convex/values";

export const pages = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    if (args.query.trim() === "") return [];
    return await ctx.db
      .query("pages")
      .withSearchIndex("search_title", (q) =>
        q.search("title", args.query).eq("isTrashed", false)
      )
      .take(15);
  },
});
