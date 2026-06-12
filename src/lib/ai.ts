import Anthropic from "@anthropic-ai/sdk";

/* AI workspace generation: describe a project, Claude plans a workspace
 * (pages, sub-pages, content blocks, databases), we create it in Convex. */

export type PlanBlock = {
  type:
    | "heading1"
    | "heading2"
    | "heading3"
    | "paragraph"
    | "bullet"
    | "numbered"
    | "todo"
    | "quote"
    | "divider";
  text: string;
};

export type PlanDatabase = {
  name: string;
  columns: {
    name: string;
    type: "text" | "number" | "select" | "date" | "checkbox" | "url";
    options: string[];
  }[];
  rows: string[][];
};

export type PlanPage = {
  title: string;
  icon: string;
  blocks: PlanBlock[];
  database: PlanDatabase | null;
  children: Omit<PlanPage, "children">[];
};

export type WorkspacePlan = { pages: PlanPage[] };

const blockSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    type: {
      type: "string",
      enum: [
        "heading1",
        "heading2",
        "heading3",
        "paragraph",
        "bullet",
        "numbered",
        "todo",
        "quote",
        "divider",
      ],
    },
    text: { type: "string", description: "Block text. Empty string for divider." },
  },
  required: ["type", "text"],
};

const databaseSchema = {
  type: "object",
  additionalProperties: false,
  description: "A table with typed columns, or null if the page needs none.",
  properties: {
    name: { type: "string" },
    columns: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string" },
          type: {
            type: "string",
            enum: ["text", "number", "select", "date", "checkbox", "url"],
          },
          options: {
            type: "array",
            items: { type: "string" },
            description: "Options for select columns; empty array otherwise.",
          },
        },
        required: ["name", "type", "options"],
      },
    },
    rows: {
      type: "array",
      description:
        "Row values as strings, one array per row, in column order. Use 'true'/'false' for checkboxes, YYYY-MM-DD for dates, plain digits for numbers.",
      items: { type: "array", items: { type: "string" } },
    },
  },
  required: ["name", "columns", "rows"],
};

function pageProperties(withChildren: boolean) {
  const props: Record<string, unknown> = {
    title: { type: "string" },
    icon: { type: "string", description: "A single emoji for the page icon." },
    blocks: { type: "array", items: blockSchema },
    database: { anyOf: [databaseSchema, { type: "null" }] },
  };
  if (withChildren) {
    props.children = {
      type: "array",
      description: "Sub-pages nested under this page.",
      items: {
        type: "object",
        additionalProperties: false,
        properties: pageProperties(false),
        required: ["title", "icon", "blocks", "database"],
      },
    };
  }
  return props;
}

const workspaceSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    pages: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: pageProperties(true),
        required: ["title", "icon", "blocks", "database", "children"],
      },
    },
  },
  required: ["pages"],
};

const SYSTEM_PROMPT = `You design Notion-style workspaces. Given a project description, plan a practical, well-organized workspace of pages.

Guidelines:
- Create 3-7 top-level pages covering the real needs of the project (e.g. overview/hub, tasks, docs, meeting notes, resources).
- Use sub-pages (children) where a topic has natural sub-documents.
- Write genuinely useful starter content in blocks — not lorem ipsum. Headings, intro paragraphs, checklists with real actionable items, quotes for principles.
- Add a database where tabular data helps (task tracker, content calendar, contact list…). Give it sensible typed columns and 3-6 realistic seed rows. Use "select" columns with options for statuses/categories.
- Each page gets a fitting single emoji icon.
- Keep block text concise; no markdown syntax inside text (no ##, no -, no []).`;

export async function generateWorkspace(
  apiKey: string,
  description: string
): Promise<WorkspacePlan> {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
  const stream = client.messages.stream({
    model: "claude-opus-4-8",
    max_tokens: 32000,
    thinking: { type: "adaptive" },
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: description }],
    output_config: {
      format: {
        type: "json_schema",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        schema: workspaceSchema as any,
      },
    },
  });
  const message = await stream.finalMessage();
  const text = message.content.find((b) => b.type === "text");
  if (!text || text.type !== "text") {
    throw new Error("The model returned no content.");
  }
  return JSON.parse(text.text) as WorkspacePlan;
}
