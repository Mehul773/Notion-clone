import { useState } from "react";
import { useConvex } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { KeyRound, Sparkles } from "lucide-react";
import { Modal } from "./Popover";
import {
  generateWorkspace,
  PlanBlock,
  PlanDatabase,
  WorkspacePlan,
} from "../lib/ai";
import { randomCoverCss } from "../lib/utils";

const KEY_STORAGE = "slate:anthropicKey";

/* eslint-disable @typescript-eslint/no-explicit-any */

function planBlockToBlockNote(block: PlanBlock): any {
  switch (block.type) {
    case "heading1":
      return { type: "heading", props: { level: 1 }, content: block.text };
    case "heading2":
      return { type: "heading", props: { level: 2 }, content: block.text };
    case "heading3":
      return { type: "heading", props: { level: 3 }, content: block.text };
    case "bullet":
      return { type: "bulletListItem", content: block.text };
    case "numbered":
      return { type: "numberedListItem", content: block.text };
    case "todo":
      return { type: "checkListItem", content: block.text };
    case "quote":
      return { type: "quote", content: block.text };
    case "divider":
      return { type: "divider" };
    default:
      return { type: "paragraph", content: block.text };
  }
}

function convertCell(value: string, type: PlanDatabase["columns"][number]["type"]) {
  if (value === "" || value === undefined || value === null) return null;
  switch (type) {
    case "checkbox":
      return value.toLowerCase() === "true" ? true : null;
    case "number": {
      const n = parseFloat(value);
      return isNaN(n) ? null : n;
    }
    default:
      return value;
  }
}

export function AiDialog({
  onClose,
  onSelect,
}: {
  onClose: () => void;
  onSelect: (id: Id<"pages">) => void;
}) {
  const convex = useConvex();
  const [apiKey, setApiKey] = useState(
    () => localStorage.getItem(KEY_STORAGE) ?? ""
  );
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<
    { phase: "idle" } | { phase: "working"; note: string } | { phase: "error"; message: string }
  >({ phase: "idle" });

  const busy = status.phase === "working";

  const createPage = async (
    page: { title: string; icon: string; blocks: PlanBlock[]; database: PlanDatabase | null },
    parentId?: Id<"pages">
  ) => {
    const pageId = await convex.mutation(api.pages.create, {
      parentId,
      title: page.title,
      cover: randomCoverCss(),
    });
    if (page.icon) {
      await convex.mutation(api.pages.setIcon, { pageId, icon: page.icon });
    }
    const blocks: any[] = (page.blocks ?? []).map(planBlockToBlockNote);
    if (page.database && page.database.columns.length > 0) {
      const tableId = await convex.mutation(api.database.createTableFull, {
        name: page.database.name,
        columns: page.database.columns.map((c) => ({
          name: c.name,
          type: c.type,
          options: c.type === "select" ? c.options : undefined,
        })),
        rows: page.database.rows.map((row) =>
          row.map((value, i) =>
            convertCell(value, page.database!.columns[i]?.type ?? "text")
          )
        ),
      });
      blocks.push({ type: "database", props: { tableId } });
    }
    if (blocks.length > 0) {
      await convex.mutation(api.docs.save, {
        pageId,
        content: JSON.stringify(blocks),
      });
    }
    return pageId;
  };

  const run = async () => {
    if (!apiKey.trim() || !description.trim()) return;
    localStorage.setItem(KEY_STORAGE, apiKey.trim());
    setStatus({ phase: "working", note: "Claude is planning your workspace…" });
    try {
      const plan: WorkspacePlan = await generateWorkspace(
        apiKey.trim(),
        description.trim()
      );
      setStatus({ phase: "working", note: "Creating pages and databases…" });
      let firstId: Id<"pages"> | null = null;
      for (const page of plan.pages) {
        const pageId = await createPage(page);
        if (!firstId) firstId = pageId;
        for (const child of page.children ?? []) {
          await createPage(child, pageId);
        }
      }
      if (firstId) onSelect(firstId);
      onClose();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Something went wrong.";
      setStatus({ phase: "error", message });
    }
  };

  return (
    <Modal onClose={busy ? () => {} : onClose} width={520}>
      <div className="ai-dialog">
        <div className="ai-dialog-title">
          <Sparkles size={17} /> Generate a workspace with AI
        </div>
        <p className="ai-dialog-hint">
          Describe your project and Claude will build a starter workspace —
          pages, sub-pages, content, and databases.
        </p>
        <label className="ai-field-label">
          <KeyRound size={12} /> Anthropic API key
        </label>
        <input
          className="ai-input"
          type="password"
          placeholder="sk-ant-…"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          disabled={busy}
        />
        <label className="ai-field-label">Project description</label>
        <textarea
          className="ai-textarea"
          rows={5}
          placeholder="e.g. I'm launching a small indie video game. I need to track development tasks, marketing plans, playtest feedback, and a release checklist."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={busy}
        />
        {status.phase === "error" && (
          <div className="ai-error">{status.message}</div>
        )}
        <div className="ai-dialog-actions">
          {status.phase === "working" ? (
            <div className="ai-working">
              <div className="spinner" style={{ width: 16, height: 16 }} />
              {status.note}
            </div>
          ) : (
            <>
              <span className="ai-key-note">
                Your key is stored locally and sent only to Anthropic.
              </span>
              <button
                className="ai-generate-btn"
                onClick={() => void run()}
                disabled={!apiKey.trim() || !description.trim()}
              >
                <Sparkles size={14} /> Generate
              </button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}
