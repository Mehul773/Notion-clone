import {
  ReactNode,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

/**
 * Anchored floating panel rendered in a portal. Positions itself below the
 * anchor rect (or above if there's no room), clamped to the viewport.
 */
export function Popover({
  anchor,
  onClose,
  children,
  align = "start",
  className = "",
}: {
  anchor: DOMRect;
  onClose: () => void;
  children: ReactNode;
  align?: "start" | "end" | "center";
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    let left =
      align === "end"
        ? anchor.right - width
        : align === "center"
          ? anchor.left + anchor.width / 2 - width / 2
          : anchor.left;
    let top = anchor.bottom + 6;
    if (top + height > window.innerHeight - 8) {
      top = Math.max(8, anchor.top - height - 6);
    }
    left = Math.min(Math.max(8, left), window.innerWidth - width - 8);
    setPos({ top, left });
  }, [anchor, align]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    // Defer so the click that opened the popover doesn't immediately close it.
    const id = setTimeout(() => {
      document.addEventListener("mousedown", onDown);
      document.addEventListener("keydown", onKey, true);
    });
    return () => {
      clearTimeout(id);
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [onClose]);

  return createPortal(
    <div
      ref={ref}
      className={`popover ${className}`}
      style={{
        top: pos?.top ?? -9999,
        left: pos?.left ?? -9999,
        visibility: pos ? "visible" : "hidden",
      }}
    >
      {children}
    </div>,
    document.body
  );
}

export function Modal({
  onClose,
  children,
  width,
}: {
  onClose: () => void;
  children: ReactNode;
  width?: number;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [onClose]);

  return createPortal(
    <div
      className="modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal" style={width ? { width } : undefined}>
        {children}
      </div>
    </div>,
    document.body
  );
}

/** Convenience hook: track an anchor rect for popovers opened from a button. */
export function useAnchor() {
  const [anchor, setAnchor] = useState<DOMRect | null>(null);
  const open = (e: { currentTarget: Element }) =>
    setAnchor(e.currentTarget.getBoundingClientRect());
  const close = () => setAnchor(null);
  return { anchor, open, close, setAnchor };
}
