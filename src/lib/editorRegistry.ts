/* Tracks the currently-mounted BlockNote editor so app chrome (topbar menu)
 * can run document-level commands like Markdown export and word count. */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyEditor = any;

let current: AnyEditor = null;

export function setCurrentEditor(editor: AnyEditor) {
  current = editor;
}

export function clearCurrentEditor(editor: AnyEditor) {
  if (current === editor) current = null;
}

export function getCurrentEditor(): AnyEditor {
  return current;
}
