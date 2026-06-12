import { BlockNoteEditor } from "@blocknote/core";
import { ConvexReactClient } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { schema } from "../components/BlockEditor";

/* Markdown import: paste or upload a .md file and turn it into a full page.
 * Optional YAML-ish frontmatter sets the page title/icon, the first H1 is
 * used as a title fallback, and pipe tables can be converted into real
 * Slate databases with inferred column types. */

/* eslint-disable @typescript-eslint/no-explicit-any */

export type ParsedMarkdown = {
  title: string | null;
  icon: string | null;
  body: string;
};

/** Strip a leading `--- key: value ---` frontmatter block, if present. */
export function parseFrontmatter(markdown: string): ParsedMarkdown {
  const match = markdown.match(/^\s*---\r?\n([\s\S]*?)\r?\n---\s*\r?\n?/);
  if (!match) return { title: null, icon: null, body: markdown };
  let title: string | null = null;
  let icon: string | null = null;
  for (const line of match[1].split(/\r?\n/)) {
    const kv = line.match(/^(\w+)\s*:\s*(.+)$/);
    if (!kv) continue;
    const value = kv[2].trim().replace(/^["']|["']$/g, "");
    if (kv[1].toLowerCase() === "title") title = value;
    if (kv[1].toLowerCase() === "icon") icon = value;
  }
  return { title, icon, body: markdown.slice(match[0].length) };
}

/** Collect plain text from BlockNote inline content / table cells. */
function inlineText(content: any): string {
  if (!content) return "";
  if (typeof content === "string") return content;
  if (Array.isArray(content)) return content.map(inlineText).join("");
  if (typeof content.text === "string") return content.text;
  if (Array.isArray(content.content)) return inlineText(content.content);
  return "";
}

/** Extract a markdown table block as a string grid (first row = headers). */
function tableToGrid(block: any): string[][] | null {
  const rows = block?.content?.rows;
  if (!Array.isArray(rows) || rows.length === 0) return null;
  return rows.map((row: any) =>
    (row.cells ?? []).map((cell: any) => inlineText(cell).trim())
  );
}

type ColumnType = "text" | "number" | "select" | "date" | "checkbox" | "url";

const CHECKBOX_RE = /^(true|false|yes|no|x|✓|✗|\[ \]|\[x\])$/i;
const TRUTHY_RE = /^(true|yes|x|✓|\[x\])$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const URL_RE = /^(https?:\/\/|www\.)\S+$/i;

/** Infer a column type from its values (header row excluded). */
export function inferColumnType(values: string[]): {
  type: ColumnType;
  options?: string[];
} {
  const filled = values.filter((v) => v !== "");
  if (filled.length === 0) return { type: "text" };
  if (filled.every((v) => CHECKBOX_RE.test(v))) return { type: "checkbox" };
  if (filled.every((v) => v !== "" && !isNaN(Number(v)))) return { type: "number" };
  if (filled.every((v) => DATE_RE.test(v))) return { type: "date" };
  if (filled.every((v) => URL_RE.test(v))) return { type: "url" };
  const unique = [...new Set(filled)];
  if (filled.length >= 3 && unique.length <= 6 && unique.length < filled.length) {
    return { type: "select", options: unique };
  }
  return { type: "text" };
}

function convertCell(value: string, type: ColumnType) {
  if (value === "") return null;
  switch (type) {
    case "checkbox":
      return TRUTHY_RE.test(value) ? true : null;
    case "number": {
      const n = parseFloat(value);
      return isNaN(n) ? null : n;
    }
    default:
      return value;
  }
}

/** Parse markdown into BlockNote blocks using a headless editor. */
export async function markdownToBlocks(markdown: string): Promise<any[]> {
  const editor = BlockNoteEditor.create({ schema, _headless: true });
  return await editor.tryParseMarkdownToBlocks(markdown);
}

/** Pull the title out of a leading H1 block, removing it from the list. */
export function extractLeadingHeading(blocks: any[]): {
  title: string | null;
  blocks: any[];
} {
  const first = blocks[0];
  if (first?.type === "heading" && (first.props?.level ?? 1) === 1) {
    const title = inlineText(first.content).trim();
    if (title) return { title, blocks: blocks.slice(1) };
  }
  return { title: null, blocks };
}

/** Replace table blocks with real Slate databases (recursively). */
export async function convertTablesToDatabases(
  convex: ConvexReactClient,
  blocks: any[]
): Promise<any[]> {
  const result: any[] = [];
  let lastHeading = "";
  for (const block of blocks) {
    if (block.type === "heading") {
      lastHeading = inlineText(block.content).trim();
    }
    if (block.type === "table") {
      const grid = tableToGrid(block);
      if (grid && grid.length >= 2 && grid[0].some((h) => h !== "")) {
        const headers = grid[0];
        const dataRows = grid.slice(1);
        const columns = headers.map((name, i) => {
          const inferred = inferColumnType(dataRows.map((r) => r[i] ?? ""));
          return {
            name: name || `Column ${i + 1}`,
            type: inferred.type,
            options: inferred.options,
          };
        });
        const tableId = await convex.mutation(api.database.createTableFull, {
          name: lastHeading,
          columns,
          rows: dataRows.map((row) =>
            headers.map((_, i) => convertCell(row[i] ?? "", columns[i].type))
          ),
        });
        result.push({ type: "database", props: { tableId } });
        continue;
      }
    }
    if (Array.isArray(block.children) && block.children.length > 0) {
      block.children = await convertTablesToDatabases(convex, block.children);
    }
    result.push(block);
  }
  return result;
}

/** Full import: markdown in, new page id out. */
export async function importMarkdownPage(
  convex: ConvexReactClient,
  markdown: string,
  options: { convertTables: boolean; parentId?: Id<"pages"> }
) {
  const { title: fmTitle, icon, body } = parseFrontmatter(markdown);
  let blocks = await markdownToBlocks(body);
  let title = fmTitle;
  const extracted = extractLeadingHeading(blocks);
  if (!title) {
    title = extracted.title;
    blocks = extracted.blocks;
  } else if (extracted.title === title) {
    // Drop a leading H1 that repeats the frontmatter title.
    blocks = extracted.blocks;
  }
  if (options.convertTables) {
    blocks = await convertTablesToDatabases(convex, blocks);
  }
  const pageId = await convex.mutation(api.pages.create, {
    title: title ?? "Imported page",
    parentId: options.parentId,
  });
  if (icon) {
    await convex.mutation(api.pages.setIcon, { pageId, icon });
  }
  if (blocks.length > 0) {
    await convex.mutation(api.docs.save, {
      pageId,
      content: JSON.stringify(blocks),
    });
  }
  return pageId;
}

/** Prompt users can paste into any AI assistant to get a ready-to-import file. */
export const AI_MARKDOWN_PROMPT = `You are generating a Markdown file that will be imported into a Notion-style workspace app. Follow this exact format:

1. Start with frontmatter for the page title and an emoji icon:
---
title: Page Title Here
icon: 🚀
---

2. Then write the page content using ONLY this Markdown syntax:
- # / ## / ### for headings
- Plain paragraphs for text
- - item for bullet lists
- 1. item for numbered lists
- - [ ] task / - [x] done task for checklists
- > text for quotes
- --- on its own line for dividers
- Pipe tables with a header row for structured data, e.g.:

| Task | Status | Due | Done |
|------|--------|-----|------|
| Design homepage | In progress | 2026-07-01 | false |

Table rules (tables become real databases with typed columns):
- Always include a header row naming each column.
- Use YYYY-MM-DD for dates, plain digits for numbers, true/false for checkboxes, full URLs for links.
- Repeat a small set of values (like statuses) in a column to make it a select/tag column.

Avoid: HTML tags, images, footnotes, nested tables, and code-heavy formatting unless asked.

Now create a Markdown page for the following topic, with genuinely useful, specific content (not lorem ipsum):

[DESCRIBE YOUR PAGE HERE — e.g. "an onboarding checklist for new marketing hires, with a 30/60/90 day plan and a task tracker table"]`;
