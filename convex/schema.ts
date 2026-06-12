import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  pages: defineTable({
    title: v.string(),
    icon: v.optional(v.string()),
    cover: v.optional(v.string()),
    parentId: v.optional(v.id("pages")),
    order: v.number(),
    isFavorite: v.boolean(),
    isTrashed: v.boolean(),
    trashedAt: v.optional(v.number()),
    updatedAt: v.number(),
  })
    .index("by_parent", ["parentId", "order"])
    .index("by_trashed", ["isTrashed"])
    .searchIndex("search_title", {
      searchField: "title",
      filterFields: ["isTrashed"],
    }),

  docs: defineTable({
    pageId: v.id("pages"),
    content: v.string(),
    searchText: v.optional(v.string()),
    updatedAt: v.number(),
  })
    .index("by_page", ["pageId"])
    .searchIndex("search_content", { searchField: "searchText" }),

  dbTables: defineTable({
    name: v.string(),
  }),

  dbColumns: defineTable({
    tableId: v.id("dbTables"),
    name: v.string(),
    type: v.union(
      v.literal("text"),
      v.literal("number"),
      v.literal("select"),
      v.literal("date"),
      v.literal("checkbox"),
      v.literal("url")
    ),
    options: v.optional(v.array(v.string())),
    optionColors: v.optional(v.record(v.string(), v.string())),
    width: v.optional(v.number()),
    order: v.number(),
  }).index("by_table", ["tableId", "order"]),

  dbRows: defineTable({
    tableId: v.id("dbTables"),
    order: v.number(),
    cells: v.record(v.string(), v.any()),
  }).index("by_table", ["tableId", "order"]),

  drawings: defineTable({
    scene: v.string(),
    updatedAt: v.number(),
  }),

  userTemplates: defineTable({
    name: v.string(),
    icon: v.optional(v.string()),
    markdown: v.string(),
  }),
});
