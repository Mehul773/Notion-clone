import { ConvexReactClient } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { randomCoverCss } from "./utils";

/* The "Getting started with Slate" demo page, created when the tour
 * finishes. Built as BlockNote JSON directly (not Markdown) so it can use
 * colored text and embed live database + drawing blocks. Keep this in sync
 * with new features — it is the feature showcase. */

export const SHOWCASE_TITLE = "Getting started with Slate";

/* eslint-disable @typescript-eslint/no-explicit-any */

const t = (text: string, styles: Record<string, string | boolean> = {}) => ({
  type: "text",
  text,
  styles,
});

function h(level: 1 | 2 | 3, parts: any[]) {
  return { type: "heading", props: { level }, content: parts };
}
const p = (parts: any[]) => ({ type: "paragraph", content: parts });
const todo = (parts: any[]) => ({ type: "checkListItem", content: parts });
const li = (parts: any[]) => ({ type: "bulletListItem", content: parts });

export async function createShowcasePage(
  convex: ConvexReactClient
): Promise<Id<"pages">> {
  const pageId = await convex.mutation(api.pages.create, {
    title: SHOWCASE_TITLE,
    cover: randomCoverCss(),
  });
  await convex.mutation(api.pages.setIcon, { pageId, icon: "🚀" });

  const tableId = await convex.mutation(api.database.createTableFull, {
    name: "Demo tracker — switch views with the icons ↗",
    columns: [
      { name: "Task", type: "text" },
      { name: "Status", type: "select", options: ["Todo", "Doing", "Done"] },
      { name: "Effort", type: "number" },
      { name: "Due", type: "date" },
      { name: "Shipped", type: "checkbox" },
    ],
    rows: [
      ["Try every view of this table", "Doing", 2, "2026-06-15", null],
      ["Drag a card in Board view", "Todo", 1, "2026-06-18", null],
      ["Add a Formula column", "Todo", 3, "2026-06-22", null],
      ["Read this whole page", "Done", 1, "2026-06-13", true],
    ],
  });

  const drawingId = await convex.mutation(api.drawings.create, {});

  const blocks: any[] = [
    p([
      t("Welcome! This page shows "),
      t("everything", { bold: true, textColor: "purple" }),
      t(" Slate can do. Poke at it — you can't break anything."),
    ]),

    h(2, [t("⚡ Type fast", { textColor: "orange" })]),
    li([t("* + space", { code: true }), t(" → bullet list")]),
    li([t("1. + space", { code: true }), t(" → numbered list")]),
    li([t("> + space", { code: true }), t(" → quote")]),
    li([t("# ## ###", { code: true }), t(" + space → headings")]),
    li([t("```", { code: true }), t(" → code block")]),
    li([t("/", { code: true }), t(" → every block: todo, table, PDF, YouTube, "), t("/meme", { code: true }), t(" GIF picker…")]),

    h(2, [t("✅ Try these", { textColor: "green" })]),
    todo([t("Select this text → toolbar: "), t("bold", { bold: true }), t(", "), t("color", { textColor: "red" }), t(", more")]),
    todo([t("Drag me with the ⋮⋮ handle on the left")]),
    todo([t("Ctrl+K", { code: true }), t(" → search even inside pages")]),
    todo([t("Ctrl+Shift+F", { code: true }), t(" → focus mode (Ctrl+\\ hides sidebar)")]),
    todo([t("Hover the title → change icon + cover (GIF tab 👀)")]),

    h(2, [t("🗃️ One database, four views", { textColor: "blue" })]),
    p([
      t("Below is a "),
      t("live database", { bold: true }),
      t(". The icons in its top-right switch between "),
      t("Table", { bold: true }),
      t(", "),
      t("Board", { bold: true, textColor: "purple" }),
      t(" (drag cards!), "),
      t("Calendar", { bold: true, textColor: "orange" }),
      t(" and "),
      t("Chart", { bold: true, textColor: "green" }),
      t("."),
    ]),
    { type: "database", props: { tableId } },
    li([t("Click a column header → rename, retype, "), t("hide", { bold: true }), t(", or make it a "), t("Formula", { bold: true }), t(" like "), t("[Effort] * 2", { code: true })]),
    li([t("Row numbers are automatic — hover one to delete the row")]),

    h(2, [t("✏️ Whiteboard", { textColor: "pink" })]),
    p([t("A full Excalidraw canvas lives in this page. Sketch something:")]),
    { type: "drawing", props: { drawingId } },

    h(2, [t("🔗 Connect & organize", { textColor: "blue" })]),
    li([t("Type "), t("@", { code: true }), t(" anywhere to link another page — backlinks show up automatically at the bottom")]),
    li([t("/mindmap", { code: true }), t(" → an editable "), t("mind map", { bold: true, textColor: "pink" }), t(" from a text outline. Hit "), t("Edit", { bold: true }), t(" on the one below, or "), t("Copy AI prompt", { bold: true }), t(" to have Claude draft one:")]),
    {
      type: "mindmap",
      props: {
        source:
          "# Slate\n## Write\n- Pages & sub-pages\n- Markdown shortcuts\n- /mindmap\n## Organize\n- Databases\n- 4 views\n- Sections\n## Make it yours\n- Covers & icons\n- Fonts & themes",
      },
    },
    li([t("Page ⋯ menu → "), t("Open to the right", { bold: true }), t(" for a side-by-side split")]),
    li([t("Sidebar → "), t("New section", { bold: true }), t(" to group pages; drag pages into it")]),
    li([t("Page ⋯ menu → "), t("Lock with password", { bold: true }), t(" to hide a page behind a passphrase")]),

    h(2, [t("💾 Your data, your rules", { textColor: "yellow" })]),
    li([t("⋯ menu → "), t("Export", { bold: true }), t(" as Markdown/HTML, or "), t("Save as template", { bold: true })]),
    li([t("Sidebar → "), t("Import Markdown", { bold: true }), t(" (tables become real databases)")]),
    li([t("Aa menu → fonts, "), t("Simple mode", { bold: true }), t(", horizontal “/” menu. Shortcuts panel lets you "), t("rebind keys", { bold: true })]),
    li([t("Everything stored locally — no cloud, no account")]),

    { type: "quote", content: [t("Done exploring? Delete this page from its ⋯ menu. Or keep it — it likes you.")] },
  ];

  await convex.mutation(api.docs.save, {
    pageId,
    content: JSON.stringify(blocks),
  });
  return pageId;
}
