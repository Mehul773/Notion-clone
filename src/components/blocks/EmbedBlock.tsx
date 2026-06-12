import { useState } from "react";
import { MonitorPlay, Link as LinkIcon } from "lucide-react";
import { parseEmbedUrl } from "../../lib/utils";

/* eslint-disable @typescript-eslint/no-explicit-any */

export function EmbedView({ block, editor }: { block: any; editor: any }) {
  const [value, setValue] = useState("");
  const url: string = block.props.url;

  const commit = () => {
    const parsed = parseEmbedUrl(value);
    if (parsed) {
      editor.updateBlock(block, { props: { url: parsed } });
    }
  };

  if (!url) {
    return (
      <div className="embed-placeholder" contentEditable={false}>
        <MonitorPlay size={18} />
        <input
          placeholder="Paste a YouTube, Vimeo, or web link…"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            }
          }}
        />
        <button onClick={commit} disabled={!value.trim()}>
          Embed
        </button>
      </div>
    );
  }

  return (
    <div className="embed-frame" contentEditable={false}>
      <iframe
        src={url}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
        allowFullScreen
        title="Embedded content"
      />
      <div className="embed-url-bar">
        <LinkIcon size={11} />
        <span>{url}</span>
      </div>
    </div>
  );
}
