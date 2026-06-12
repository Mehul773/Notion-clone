import { Minus, Plus, RotateCcw } from "lucide-react";
import { Popover } from "./Popover";

export type FontSettings = {
  editorSize: number;
  codeSize: number;
  fontFamily: "default" | "serif" | "mono";
  googleFont: string;
  simpleMode: boolean;
};

export const DEFAULT_FONT_SETTINGS: FontSettings = {
  editorSize: 15.5,
  codeSize: 13.5,
  fontFamily: "default",
  googleFont: "",
  simpleMode: false,
};

/** Accepts a font name ("Lobster") or a fonts.google.com URL and returns
 * the font family name, or null if it can't be understood. */
export function parseGoogleFont(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;
  if (raw.includes("fonts.google")) {
    try {
      const url = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
      const family =
        url.searchParams.get("family") ??
        decodeURIComponent(url.pathname.split("/specimen/")[1] ?? "");
      const name = family.split(":")[0].replace(/\+/g, " ").trim();
      return name || null;
    } catch {
      return null;
    }
  }
  return /^[a-zA-Z0-9 ]{2,40}$/.test(raw) ? raw : null;
}

function Stepper({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="settings-row">
      <span className="settings-label">{label}</span>
      <div className="stepper">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          title="Smaller"
        >
          <Minus size={13} />
        </button>
        <span className="stepper-value">{value}px</span>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          title="Larger"
        >
          <Plus size={13} />
        </button>
      </div>
    </div>
  );
}

export function SettingsPopover({
  anchor,
  onClose,
  settings,
  setSettings,
}: {
  anchor: DOMRect;
  onClose: () => void;
  settings: FontSettings;
  setSettings: (s: FontSettings) => void;
}) {
  const inElectron = !!window.slate;
  return (
    <Popover anchor={anchor} onClose={onClose} className="settings-popover" align="end">
      <div className="menu-label">Font</div>
      <div className="font-family-row">
        {(
          [
            { id: "default", name: "Default", css: "inherit" },
            { id: "serif", name: "Serif", css: "Georgia, serif" },
            { id: "mono", name: "Mono", css: "ui-monospace, Consolas, monospace" },
          ] as const
        ).map((f) => (
          <button
            key={f.id}
            className={`font-family-btn${
              settings.fontFamily === f.id ? " active" : ""
            }`}
            onClick={() => setSettings({ ...settings, fontFamily: f.id })}
          >
            <span style={{ fontFamily: f.css, fontSize: 17 }}>Ag</span>
            <span className="font-family-name">{f.name}</span>
          </button>
        ))}
      </div>
      <input
        className="google-font-input"
        placeholder="Google Font name or link… (Enter)"
        defaultValue={settings.googleFont}
        onKeyDown={(e) => {
          if (e.key !== "Enter") return;
          const value = (e.target as HTMLInputElement).value;
          const name = parseGoogleFont(value);
          setSettings({ ...settings, googleFont: name ?? "" });
        }}
        onBlur={(e) => {
          const name = parseGoogleFont(e.target.value);
          if (name !== (settings.googleFont || null)) {
            setSettings({ ...settings, googleFont: name ?? "" });
          }
        }}
      />
      {settings.googleFont && (
        <div className="google-font-active">
          Using <b style={{ fontFamily: `'${settings.googleFont}'` }}>{settings.googleFont}</b>
        </div>
      )}
      <div className="menu-sep" />
      <div className="menu-label">Text</div>
      <Stepper
        label="Editor font size"
        value={settings.editorSize}
        min={12}
        max={24}
        onChange={(v) => setSettings({ ...settings, editorSize: v })}
      />
      <Stepper
        label="Code font size"
        value={settings.codeSize}
        min={10}
        max={22}
        onChange={(v) => setSettings({ ...settings, codeSize: v })}
      />
      {inElectron && (
        <>
          <div className="menu-sep" />
          <div className="menu-label">App zoom</div>
          <div className="settings-row">
            <span className="settings-label">
              <kbd>Ctrl</kbd> <kbd>+</kbd> / <kbd>−</kbd> / <kbd>0</kbd>
            </span>
            <div className="stepper">
              <button onClick={() => window.slate?.zoom(-0.5)} title="Zoom out">
                <Minus size={13} />
              </button>
              <button onClick={() => window.slate?.zoom(0)} title="Reset zoom">
                <RotateCcw size={12} />
              </button>
              <button onClick={() => window.slate?.zoom(0.5)} title="Zoom in">
                <Plus size={13} />
              </button>
            </div>
          </div>
        </>
      )}
      <div className="menu-sep" />
      <div className="settings-row">
        <span className="settings-label">Simple mode</span>
        <label className="md-toggle" title="Hide advanced blocks and AI features for a clean notes app">
          <input
            type="checkbox"
            checked={settings.simpleMode}
            onChange={(e) =>
              setSettings({ ...settings, simpleMode: e.target.checked })
            }
          />
          {settings.simpleMode ? "On" : "Off"}
        </label>
      </div>
      <div className="menu-sep" />
      <button
        className="menu-item"
        onClick={() => setSettings(DEFAULT_FONT_SETTINGS)}
      >
        <RotateCcw size={13} /> Reset to defaults
      </button>
    </Popover>
  );
}
