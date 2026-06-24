import { useState } from "react";
import { Keyboard, RotateCcw } from "lucide-react";
import { Modal } from "./Popover";
import {
  ACTIONS,
  ActionId,
  comboFromEvent,
  DEFAULT_KEYBINDINGS,
  loadKeybindings,
  saveKeybindings,
} from "../lib/keybindings";

const STATIC_GROUPS: { label: string; rows: [string, string][] }[] = [
  {
    label: "Editor",
    rows: [
      ["/", "Insert any block"],
      ["/meme", "Search & insert a meme / GIF"],
      ["@", "Link another page"],
      ["* Space", "Bullet list"],
      ["1. Space", "Numbered list"],
      ["> Space", "Quote"],
      ["# / ## / ### Space", "Headings"],
      ["```", "Code block"],
      ["Ctrl B / I / U", "Bold / italic / underline"],
    ],
  },
  {
    label: "Pages",
    rows: [
      ["Enter (on title)", "Jump into the document"],
      ["Drag tree item", "Reorder / nest pages"],
      ["Drag DB card", "Move between board lanes"],
    ],
  },
];

export function ShortcutsModal({ onClose }: { onClose: () => void }) {
  const [binds, setBinds] = useState(loadKeybindings());
  const [capturing, setCapturing] = useState<ActionId | null>(null);

  const update = (id: ActionId, combo: string) => {
    const next = { ...binds, [id]: combo };
    setBinds(next);
    saveKeybindings(next);
  };

  return (
    <Modal onClose={onClose} width={480}>
      <div className="ai-dialog">
        <div className="ai-dialog-title">
          <Keyboard size={17} /> Keyboard shortcuts
        </div>

        <div className="menu-label" style={{ display: "flex", alignItems: "center" }}>
          Customizable
          <button
            className="shortcut-reset"
            title="Reset to defaults"
            onClick={() => {
              setBinds({ ...DEFAULT_KEYBINDINGS });
              saveKeybindings({ ...DEFAULT_KEYBINDINGS });
            }}
          >
            <RotateCcw size={12} /> Reset
          </button>
        </div>
        {ACTIONS.map((action) => (
          <div className="shortcut-row" key={action.id}>
            <span className="shortcut-desc" style={{ flex: 1 }}>
              {action.label}
            </span>
            <button
              className={`shortcut-capture${capturing === action.id ? " capturing" : ""}`}
              onClick={() => setCapturing(action.id)}
              onKeyDown={(e) => {
                if (capturing !== action.id) return;
                e.preventDefault();
                if (e.key === "Escape") {
                  setCapturing(null);
                  return;
                }
                if (["Control", "Shift", "Alt", "Meta"].includes(e.key)) return;
                update(action.id, comboFromEvent(e.nativeEvent));
                setCapturing(null);
              }}
            >
              {capturing === action.id ? "Press keys…" : binds[action.id]}
            </button>
          </div>
        ))}

        {STATIC_GROUPS.map((group) => (
          <div key={group.label}>
            <div className="menu-label">{group.label}</div>
            {group.rows.map(([keys, what]) => (
              <div className="shortcut-row" key={keys}>
                <span className="shortcut-keys">
                  {keys.split(" ").map((k, i) => (
                    <kbd key={i}>{k}</kbd>
                  ))}
                </span>
                <span className="shortcut-desc">{what}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </Modal>
  );
}
