import { lazy, Suspense, useMemo, useRef } from "react";
import { useConvex, useQuery } from "convex/react";
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
    <div className="drawing-block" contentEditable={false}>
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
