import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useConvex, useQuery } from "convex/react";
import { Maximize2, Minimize2 } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { useAppTheme } from "../../lib/useAppTheme";
import { debounce } from "../../lib/utils";
import "@excalidraw/excalidraw/index.css";

const Excalidraw = lazy(() =>
  import("@excalidraw/excalidraw").then((m) => ({ default: m.Excalidraw }))
);

export function DrawingView({ drawingId }: { drawingId: string }) {
  const convex = useConvex();
  const theme = useAppTheme();
  const drawing = useQuery(
    api.drawings.get,
    drawingId ? { drawingId: drawingId as Id<"drawings"> } : "skip"
  );

  const [fullscreen, setFullscreen] = useState(false);

  // Esc exits fullscreen (Excalidraw also uses Esc to deselect — exiting
  // fullscreen on Esc is the expected outer behavior).
  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullscreen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fullscreen]);

  const lastSaved = useRef<string | null>(null);

  const save = useMemo(
    () =>
      debounce((scene: string) => {
        if (scene === lastSaved.current) return;
        lastSaved.current = scene;
        void convex.mutation(api.drawings.save, {
          drawingId: drawingId as Id<"drawings">,
          scene,
        });
      }, 800),
    [convex, drawingId]
  );

  const initialData = useMemo(() => {
    if (!drawing?.scene) return null;
    try {
      const parsed = JSON.parse(drawing.scene);
      lastSaved.current = drawing.scene;
      return {
        elements: parsed.elements ?? [],
        files: parsed.files ?? undefined,
      };
    } catch {
      return null;
    }
    // Only parse once per drawing load — live edits stay local.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawing === undefined ? "loading" : drawingId]);

  if (drawing === undefined) {
    return (
      <div className="drawing-block loading" contentEditable={false}>
        <div className="spinner" />
      </div>
    );
  }
  if (drawing === null) {
    return (
      <div className="drawing-block" contentEditable={false}>
        <div className="db-footer">This drawing was deleted.</div>
      </div>
    );
  }

  return (
    <div
      className={`drawing-block${fullscreen ? " fullscreen" : ""}`}
      contentEditable={false}
    >
      <button
        className="drawing-fs-btn"
        title={fullscreen ? "Exit fullscreen (Esc)" : "Open fullscreen"}
        onClick={() => setFullscreen((f) => !f)}
      >
        {fullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
      </button>
      <Suspense
        fallback={
          <div className="drawing-block loading">
            <div className="spinner" />
          </div>
        }
      >
        <Excalidraw
          theme={theme}
          initialData={initialData}
          onChange={(elements, _appState, files) => {
            save(JSON.stringify({ elements, files }));
          }}
        />
      </Suspense>
    </div>
  );
}
