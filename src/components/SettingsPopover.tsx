import { Minus, Plus, RotateCcw } from "lucide-react";
import { Popover } from "./Popover";

export type FontSettings = {
  editorSize: number;
  codeSize: number;
};

export const DEFAULT_FONT_SETTINGS: FontSettings = {
  editorSize: 15.5,
  codeSize: 13.5,
};

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
      <button
        className="menu-item"
        onClick={() => setSettings(DEFAULT_FONT_SETTINGS)}
      >
        <RotateCcw size={13} /> Reset to defaults
      </button>
    </Popover>
  );
}
