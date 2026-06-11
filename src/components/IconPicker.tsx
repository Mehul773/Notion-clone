import { useMemo, useState } from "react";
import data from "@emoji-mart/data";
import { Shuffle, Trash2 } from "lucide-react";
import { Popover } from "./Popover";

const CATEGORY_LABELS: Record<string, string> = {
  people: "Smileys & People",
  nature: "Animals & Nature",
  foods: "Food & Drink",
  activity: "Activity",
  places: "Travel & Places",
  objects: "Objects",
  symbols: "Symbols",
  flags: "Flags",
};

const categories = data.categories.filter((c) => c.id !== "frequent");
const allEmojiIds = categories.flatMap((c) => c.emojis);

export function IconPicker({
  anchor,
  onClose,
  onSelect,
  onRemove,
}: {
  anchor: DOMRect;
  onClose: () => void;
  onSelect: (emoji: string) => void;
  onRemove?: () => void;
}) {
  const [search, setSearch] = useState("");

  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return null;
    const matches: string[] = [];
    for (const id of allEmojiIds) {
      const emoji = data.emojis[id];
      if (!emoji) continue;
      if (
        emoji.id.includes(q) ||
        emoji.name.toLowerCase().includes(q) ||
        emoji.keywords.some((k) => k.includes(q))
      ) {
        matches.push(id);
        if (matches.length >= 108) break;
      }
    }
    return matches;
  }, [search]);

  const pick = (id: string) => {
    const native = data.emojis[id]?.skins[0]?.native;
    if (native) {
      onSelect(native);
      onClose();
    }
  };

  const random = () => {
    const id = allEmojiIds[Math.floor(Math.random() * allEmojiIds.length)];
    pick(id);
  };

  return (
    <Popover anchor={anchor} onClose={onClose} className="icon-picker">
      <div className="icon-picker-top">
        <input
          autoFocus
          placeholder="Filter…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="icon-picker-btn" onClick={random} title="Random icon">
          <Shuffle size={14} />
        </button>
        {onRemove && (
          <button
            className="icon-picker-btn"
            onClick={() => {
              onRemove();
              onClose();
            }}
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
      <div className="icon-picker-grid">
        {results ? (
          results.length === 0 ? (
            <div className="modal-empty">No results</div>
          ) : (
            <div className="emoji-grid">
              {results.map((id) => (
                <button key={id} className="emoji-cell" onClick={() => pick(id)}>
                  {data.emojis[id]?.skins[0]?.native}
                </button>
              ))}
            </div>
          )
        ) : (
          categories.map((cat) => (
            <div key={cat.id}>
              <div className="emoji-cat-label">
                {CATEGORY_LABELS[cat.id] ?? cat.id}
              </div>
              <div className="emoji-grid">
                {cat.emojis.map((id) => (
                  <button
                    key={id}
                    className="emoji-cell"
                    onClick={() => pick(id)}
                    title={data.emojis[id]?.name}
                  >
                    {data.emojis[id]?.skins[0]?.native}
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </Popover>
  );
}
