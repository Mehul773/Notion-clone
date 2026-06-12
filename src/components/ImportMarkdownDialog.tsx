import { useRef, useState } from "react";
import { useConvex } from "convex/react";
import { Id } from "../../convex/_generated/dataModel";
import { Check, Copy, FileUp, FileText } from "lucide-react";
import { Modal } from "./Popover";
import { AI_MARKDOWN_PROMPT, importMarkdownPage } from "../lib/markdownImport";

export function ImportMarkdownDialog({
  onClose,
  onSelect,
}: {
  onClose: () => void;
  onSelect: (id: Id<"pages">) => void;
}) {
  const convex = useConvex();
  const [markdown, setMarkdown] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [convertTables, setConvertTables] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState<
    { phase: "idle" } | { phase: "working" } | { phase: "error"; message: string }
  >({ phase: "idle" });
  const fileInput = useRef<HTMLInputElement>(null);

  const busy = status.phase === "working";

  const loadFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setMarkdown(String(reader.result ?? ""));
      setFileName(file.name);
    };
    reader.readAsText(file);
  };

  const copyPrompt = async () => {
    await navigator.clipboard.writeText(AI_MARKDOWN_PROMPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const run = async () => {
    if (!markdown.trim()) return;
    setStatus({ phase: "working" });
    try {
      const pageId = await importMarkdownPage(convex, markdown, {
        convertTables,
      });
      onSelect(pageId);
      onClose();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Something went wrong.";
      setStatus({ phase: "error", message });
    }
  };

  return (
    <Modal onClose={busy ? () => {} : onClose} width={560}>
      <div className="ai-dialog">
        <div className="ai-dialog-title">
          <FileUp size={17} /> Import from Markdown
        </div>
        <p className="ai-dialog-hint">
          Paste Markdown or drop a .md file — headings, lists, checklists,
          quotes, and tables become a fully formatted page. Tables turn into
          real databases with typed columns.
        </p>
        <div className="ai-dialog-hint" style={{ marginTop: 0 }}>
          Want an AI to write the file for you?{" "}
          <button className="md-copy-prompt" onClick={() => void copyPrompt()}>
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? "Copied!" : "Copy AI prompt"}
          </button>{" "}
          and paste it into any assistant (Claude, ChatGPT…), then paste the
          result here.
        </div>
        <textarea
          className={`ai-textarea md-drop${dragOver ? " drag-over" : ""}`}
          rows={10}
          placeholder={
            "---\ntitle: My Page\nicon: 🚀\n---\n\n# My Page\n\nParagraph text…\n\n- [ ] A task\n\n| Task | Status |\n|------|--------|\n| Ship it | Done |"
          }
          value={markdown}
          onChange={(e) => {
            setMarkdown(e.target.value);
            setFileName(null);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer.files?.[0];
            if (file) loadFile(file);
          }}
          disabled={busy}
        />
        <div className="md-import-row">
          <button
            className="md-file-btn"
            onClick={() => fileInput.current?.click()}
            disabled={busy}
          >
            <FileText size={13} />
            {fileName ?? "Choose a .md file"}
          </button>
          <input
            ref={fileInput}
            type="file"
            accept=".md,.markdown,.txt,text/markdown,text/plain"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) loadFile(file);
              e.target.value = "";
            }}
          />
          <label className="md-toggle">
            <input
              type="checkbox"
              checked={convertTables}
              onChange={(e) => setConvertTables(e.target.checked)}
              disabled={busy}
            />
            Convert tables to databases
          </label>
        </div>
        {status.phase === "error" && (
          <div className="ai-error">{status.message}</div>
        )}
        <div className="ai-dialog-actions">
          {busy ? (
            <div className="ai-working">
              <div className="spinner" style={{ width: 16, height: 16 }} />
              Creating your page…
            </div>
          ) : (
            <>
              <span className="ai-key-note">
                Everything stays in your workspace — no AI key needed.
              </span>
              <button
                className="ai-generate-btn"
                onClick={() => void run()}
                disabled={!markdown.trim()}
              >
                <FileUp size={14} /> Import page
              </button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}
