/* User-customizable keyboard shortcuts. Stored in localStorage as
 * action -> combo string (e.g. "Ctrl+K"). App reads these to dispatch. */

export type ActionId =
  | "search"
  | "newPage"
  | "toggleSidebar"
  | "focusMode"
  | "shortcuts";

export const ACTIONS: { id: ActionId; label: string }[] = [
  { id: "search", label: "Search" },
  { id: "newPage", label: "New page" },
  { id: "toggleSidebar", label: "Toggle sidebar" },
  { id: "focusMode", label: "Focus mode" },
  { id: "shortcuts", label: "Open shortcuts" },
];

export const DEFAULT_KEYBINDINGS: Record<ActionId, string> = {
  search: "Ctrl+K",
  newPage: "Ctrl+N",
  toggleSidebar: "Ctrl+\\",
  focusMode: "Ctrl+Shift+F",
  shortcuts: "Ctrl+/",
};

const KEY = "slate:keybindings";

export function loadKeybindings(): Record<ActionId, string> {
  try {
    return { ...DEFAULT_KEYBINDINGS, ...JSON.parse(localStorage.getItem(KEY) ?? "{}") };
  } catch {
    return { ...DEFAULT_KEYBINDINGS };
  }
}

export function saveKeybindings(map: Record<ActionId, string>) {
  localStorage.setItem(KEY, JSON.stringify(map));
}

/** Build a normalized combo string from a keyboard event, e.g. "Ctrl+Shift+F". */
export function comboFromEvent(e: KeyboardEvent): string {
  const parts: string[] = [];
  if (e.ctrlKey || e.metaKey) parts.push("Ctrl");
  if (e.shiftKey) parts.push("Shift");
  if (e.altKey) parts.push("Alt");
  const key = e.key.length === 1 ? e.key.toUpperCase() : e.key;
  if (!["Control", "Shift", "Alt", "Meta"].includes(key)) parts.push(key);
  return parts.join("+");
}
