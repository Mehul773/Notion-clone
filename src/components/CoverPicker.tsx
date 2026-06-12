import { useEffect, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Popover } from "./Popover";
import { COVER_GRADIENTS, debounce } from "../lib/utils";
import { fetchGifs, Gif } from "../lib/giphy";

export function CoverPicker({
  anchor,
  onClose,
  onSelect,
  onRemove,
}: {
  anchor: DOMRect;
  onClose: () => void;
  onSelect: (cover: string) => void;
  onRemove?: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [tab, setTab] = useState<"gallery" | "gifs">("gallery");
  const [gifQuery, setGifQuery] = useState("");
  const [gifs, setGifs] = useState<Gif[] | null>(null);
  const [gifError, setGifError] = useState<string | null>(null);
  const [urlValue, setUrlValue] = useState("");
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const getUrl = useMutation(api.files.getUrl);

  const loadGifs = useRef(
    debounce((q: string) => {
      fetchGifs(q)
        .then((result) => {
          setGifs(result);
          setGifError(null);
        })
        .catch((e) => setGifError(e instanceof Error ? e.message : "Failed"));
    }, 350)
  );

  useEffect(() => {
    if (tab === "gifs" && gifs === null) loadGifs.current("");
  }, [tab, gifs]);

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const postUrl = await generateUploadUrl();
      const res = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { storageId } = await res.json();
      const url = await getUrl({ storageId });
      if (url) {
        onSelect(url);
        onClose();
      }
    } finally {
      setUploading(false);
    }
  };

  const pick = (cover: string) => {
    onSelect(cover);
    onClose();
  };

  return (
    <Popover anchor={anchor} onClose={onClose} className="cover-picker" align="end">
      <div className="cover-tabs">
        <button
          className={`cover-tab${tab === "gallery" ? " active" : ""}`}
          onClick={() => setTab("gallery")}
        >
          Gallery
        </button>
        <button
          className={`cover-tab${tab === "gifs" ? " active" : ""}`}
          onClick={() => setTab("gifs")}
        >
          GIFs
        </button>
      </div>

      {tab === "gallery" ? (
        <div className="cover-grid">
          {COVER_GRADIENTS.map((g) => (
            <button
              key={g.name}
              className="cover-swatch"
              style={{ backgroundImage: g.css }}
              title={g.name}
              onClick={() => pick(g.css)}
            />
          ))}
        </div>
      ) : (
        <>
          <input
            className="cover-gif-search"
            placeholder="Search GIPHY… (empty = trending)"
            value={gifQuery}
            autoFocus
            onChange={(e) => {
              setGifQuery(e.target.value);
              loadGifs.current(e.target.value);
            }}
          />
          {gifError ? (
            <div className="cover-gif-note">{gifError}</div>
          ) : gifs === null ? (
            <div className="cover-gif-note">Loading…</div>
          ) : gifs.length === 0 ? (
            <div className="cover-gif-note">No GIFs found</div>
          ) : (
            <div className="cover-grid gifs">
              {gifs.map((gif) => (
                <button
                  key={gif.id}
                  className="cover-swatch gif"
                  title={gif.title}
                  onClick={() => pick(gif.url)}
                >
                  <img src={gif.preview} alt={gif.title} loading="lazy" />
                </button>
              ))}
            </div>
          )}
          <div className="cover-gif-credit">Powered by GIPHY</div>
        </>
      )}

      <div className="cover-url-row">
        <input
          className="cover-url-input"
          placeholder="Paste any image/GIF URL…"
          value={urlValue}
          onChange={(e) => setUrlValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && urlValue.trim().startsWith("http")) {
              pick(urlValue.trim());
            }
          }}
        />
        <button
          disabled={!urlValue.trim().startsWith("http")}
          onClick={() => pick(urlValue.trim())}
        >
          Set
        </button>
      </div>

      <div className="cover-picker-actions">
        <button onClick={() => fileRef.current?.click()} disabled={uploading}>
          {uploading ? "Uploading…" : "Upload image"}
        </button>
        {onRemove && (
          <button
            onClick={() => {
              onRemove();
              onClose();
            }}
          >
            Remove
          </button>
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void upload(file);
        }}
      />
    </Popover>
  );
}
