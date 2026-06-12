import { query } from "./_generated/server";
import { v } from "convex/values";
import { Doc } from "./_generated/dataModel";

/** Short excerpt around the first occurrence of a query term. */
function makeSnippet(text: string, queryString: string): string {
  const lower = text.toLowerCase();
  let index = -1;
  for (const term of queryString.toLowerCase().split(/\s+/).filter(Boolean)) {
    const found = lower.indexOf(term);
    if (found !== -1 && (index === -1 || found < index)) index = found;
  }
  if (index === -1) return text.slice(0, 80);
  const start = Math.max(0, index - 32);
  const end = Math.min(text.length, index + 64);
  return (
    (start > 0 ? "…" : "") +
    text.slice(start, end).trim() +
    (end < text.length ? "…" : "")
  );
}

export const pages = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    if (args.query.trim() === "") return [];
    const titleHits = await ctx.db
      .query("pages")
      .withSearchIndex("search_title", (q) =>
        q.search("title", args.query).eq("isTrashed", false)
      )
      .take(10);
    const results: (Doc<"pages"> & { snippet?: string })[] = [...titleHits];
    const seen = new Set<string>(titleHits.map((p) => p._id as string));

    const contentHits = await ctx.db
      .query("docs")
      .withSearchIndex("search_content", (q) =>
        q.search("searchText", args.query)
      )
      .take(10);
    for (const doc of contentHits) {
      if (seen.has(doc.pageId as string)) continue;
      const page = await ctx.db.get(doc.pageId);
      if (!page || page.isTrashed) continue;
      seen.add(page._id as string);
      results.push({
        ...page,
        snippet: makeSnippet(doc.searchText ?? "", args.query),
      });
    }
    return results.slice(0, 15);
  },
});
