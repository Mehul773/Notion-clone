import { Keyboard } from "lucide-react";
import { Modal } from "./Popover";

const GROUPS: { label: string; rows: [string, string][] }[] = [
  {
    label: "General",
    rows: [
      ["Ctrl K", "Search everything"],
      ["Ctrl N", "New page"],
      ["Ctrl \\", "Toggle sidebar"],
      ["Ctrl Shift F", "Focus mode"],
      ["Ctrl + / − / 0", "Zoom in / out / reset"],
    ],
  },
  {
    label: "Editor",
    rows: [
      ["/", "Insert any block"],
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
  return (
    <Modal onClose={onClose} width={460}>
      <div className="ai-dialog">
        <div className="ai-dialog-title">
          <Keyboard size={17} /> Keyboard shortcuts
        </div>
        {GROUPS.map((group) => (
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
