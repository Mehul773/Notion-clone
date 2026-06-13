import { useEffect, useRef, useState } from "react";
import { Transformer } from "markmap-lib";
import { Markmap } from "markmap-view";
import { Pencil, Check } from "lucide-react";

/* In-page mind map. The source is a Markdown outline stored in the block's
 * own prop; markmap renders it as an interactive SVG tree. */

const transformer = new Transformer();

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

  const save = () => {
    editor.updateBlock(block, { props: { source: draft } });
    setEditing(false);
  };

  return (
    <div className="mindmap-block" contentEditable={false}>
      <div className="mindmap-toolbar">
        <span className="mindmap-label">🧠 Mind map</span>
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
