import { useEffect, useRef, useState } from "react";
import { Modal } from "./Popover";
import { debounce } from "../lib/utils";
import { fetchGifs, Gif } from "../lib/giphy";

/* Emoji-picker-style meme/GIF chooser, opened from the "/" slash menu. Picks
 * a GIPHY GIF and hands its URL back to be inserted as an image block. */
export function GifPickerModal({
  onClose,
  onSelect,
}: {
  onClose: () => void;
  onSelect: (url: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [gifs, setGifs] = useState<Gif[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadGifs = useRef(
    debounce((q: string) => {
      fetchGifs(q)
        .then((result) => {
          setGifs(result);
          setError(null);
        })
        .catch((e) => setError(e instanceof Error ? e.message : "Failed"));
    }, 350)
  );

  useEffect(() => {
    loadGifs.current("");
  }, []);

  const pick = (url: string) => {
    onSelect(url);
    onClose();
  };

  return (
    <Modal onClose={onClose} width={520}>
      <div className="ai-dialog">
        <div className="ai-dialog-title">😂 Pick a meme / GIF</div>
        <input
          className="cover-gif-search"
          placeholder="Search GIPHY… (empty = trending)"
          value={query}
          autoFocus
          onChange={(e) => {
            setQuery(e.target.value);
            loadGifs.current(e.target.value);
          }}
        />
        {error ? (
          <div className="cover-gif-note">{error}</div>
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
      </div>
    </Modal>
  );
}
