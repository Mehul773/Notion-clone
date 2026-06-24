import { useEffect, useRef, useState } from "react";
import { Transformer } from "markmap-lib";
import { Markmap } from "markmap-view";
import { Pencil, Check, Copy, Maximize2, Minimize2 } from "lucide-react";

/* In-page mind map. The source is a Markdown outline stored in the block's
 * own prop; markmap renders it as an interactive SVG tree. */

const transformer = new Transformer();

/** Hand this to any assistant to get a paste-ready mind-map outline. */
export const MINDMAP_AI_PROMPT = `Write a mind map as a Markdown outline I can paste into a mind-map editor.

Rules:
- Exactly one "# " line at the top — the central idea.
- "## " lines for main branches.
- "- " lines for details under a branch.
- No prose, no code fences, no commentary — output ONLY the outline.

Topic: `;

const DEFAULT_SOURCE = `# Central idea
## Branch one
- detail
- detail
## Branch two
- detail
## Branch three
`;

/* eslint-disable @typescript-eslint/no-explicit-any */
export function MindMapView({
  block,
  editor,
}: {
  block: any;
  editor: any;
}) {
  const source: string = block.props.source || DEFAULT_SOURCE;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(source);
  const [copied, setCopied] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const mmRef = useRef<Markmap | null>(null);

  useEffect(() => {
    if (editing || !svgRef.current) return;
    const { root } = transformer.transform(source);
    if (!mmRef.current) {
      mmRef.current = Markmap.create(svgRef.current, undefined, root);
    } else {
      mmRef.current.setData(root);
    }
    mmRef.current.fit();
  }, [source, editing]);

  // The SVG resizes when entering/leaving fullscreen — refit after layout.
  useEffect(() => {
    if (editing) return;
    const id = setTimeout(() => mmRef.current?.fit(), 90);
    return () => clearTimeout(id);
  }, [fullscreen, editing]);

  // Esc exits fullscreen.
  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setFullscreen(false);
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [fullscreen]);

  const save = () => {
    editor.updateBlock(block, { props: { source: draft } });
    setEditing(false);
  };

  const copyPrompt = async () => {
    await navigator.clipboard.writeText(MINDMAP_AI_PROMPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div
      className={`mindmap-block${fullscreen ? " fullscreen" : ""}`}
      contentEditable={false}
    >
      <div className="mindmap-toolbar">
        <span className="mindmap-label">🧠 Mind map</span>
        <div className="mindmap-actions">
          <button
            className="mindmap-btn"
            title="Copy an AI prompt — paste it into Claude/any assistant, then paste the outline back here"
            onClick={() => void copyPrompt()}
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? "Copied!" : "Copy AI prompt"}
          </button>
          {editing ? (
            <button className="mindmap-btn" onClick={save}>
              <Check size={13} /> Done
            </button>
          ) : (
            <button
              className="mindmap-btn"
              onClick={() => {
                setDraft(source);
                setEditing(true);
              }}
            >
              <Pencil size={13} /> Edit
            </button>
          )}
          <button
            className="mindmap-btn"
            title={fullscreen ? "Exit fullscreen (Esc)" : "Open fullscreen"}
            onClick={() => setFullscreen((f) => !f)}
          >
            {fullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            {fullscreen ? "Exit" : "Fullscreen"}
          </button>
        </div>
      </div>
      {editing ? (
        <textarea
          className="mindmap-editor"
          value={draft}
          autoFocus
          spellCheck={false}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={"# Central idea\n## Branch\n- detail"}
        />
      ) : (
        <svg ref={svgRef} className="mindmap-svg" />
      )}
    </div>
  );
}
