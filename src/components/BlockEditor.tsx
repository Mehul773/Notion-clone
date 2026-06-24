import { useEffect, useMemo, useRef, useState } from "react";
import {
  BlockNoteSchema,
  combineByGroup,
  defaultBlockSpecs,
  defaultInlineContentSpecs,
  filterSuggestionItems,
  insertOrUpdateBlockForSlashMenu,
  PartialBlock,
} from "@blocknote/core";
import "@blocknote/core/fonts/inter.css";
import {
  createReactBlockSpec,
  createReactInlineContentSpec,
  DefaultReactSuggestionItem,
  getDefaultReactSlashMenuItems,
  SuggestionMenuController,
  useCreateBlockNote,
} from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { useConvex, useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { FileText, Laugh, MonitorPlay, Network, PenTool, Table } from "lucide-react";
import { DatabaseTable } from "./DatabaseTable";
import { GifPickerModal } from "./GifPickerModal";
import { EmbedView } from "./blocks/EmbedBlock";
import { PdfView } from "./blocks/PdfBlock";
import { DrawingView } from "./blocks/DrawingBlock";
import { MindMapView } from "./blocks/MindMapBlock";
import { debounce } from "../lib/utils";
import { clearCurrentEditor, setCurrentEditor } from "../lib/editorRegistry";
import { navigateToPage } from "../lib/pageNav";

/** Notion-style database, embedded in the document as a custom block. */
const DatabaseBlock = createReactBlockSpec(
  {
    type: "database",
    propSchema: {
      tableId: { default: "" },
    },
    content: "none",
  },
  {
    render: (props) => <DatabaseTable tableId={props.block.props.tableId} />,
  }
);

/** YouTube / Vimeo / web embeds rendered in an iframe. */
const EmbedBlock = createReactBlockSpec(
  {
    type: "embed",
    propSchema: {
      url: { default: "" },
    },
    content: "none",
  },
  {
    render: (props) => <EmbedView block={props.block} editor={props.editor} />,
  }
);

/** PDF documents with inline preview. */
const PdfBlock = createReactBlockSpec(
  {
    type: "pdf",
    propSchema: {
      url: { default: "" },
      name: { default: "" },
    },
    content: "none",
  },
  {
    render: (props) => <PdfView block={props.block} editor={props.editor} />,
  }
);

/** Excalidraw whiteboard. */
const DrawingBlock = createReactBlockSpec(
  {
    type: "drawing",
    propSchema: {
      drawingId: { default: "" },
    },
    content: "none",
  },
  {
    render: (props) => <DrawingView drawingId={props.block.props.drawingId} />,
  }
);

/** Interactive mind map (markmap) rendered from a Markdown outline. */
const MindMapBlock = createReactBlockSpec(
  {
    type: "mindmap",
    propSchema: {
      source: { default: "" },
    },
    content: "none",
  },
  {
    render: (props) => (
      <MindMapView block={props.block} editor={props.editor} />
    ),
  }
);

/** @-mention link to another page. Clicking navigates there. */
const PageLink = createReactInlineContentSpec(
  {
    type: "pageLink",
    propSchema: {
      pageId: { default: "" },
      label: { default: "Untitled" },
    },
    content: "none",
  },
  {
    render: (props) => (
      <span
        className="page-link-mention"
        onClick={() =>
          navigateToPage(props.inlineContent.props.pageId as Id<"pages">)
        }
      >
        {props.inlineContent.props.label || "Untitled"}
      </span>
    ),
  }
);

export const schema = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,
    database: DatabaseBlock(),
    embed: EmbedBlock(),
    pdf: PdfBlock(),
    drawing: DrawingBlock(),
    mindmap: MindMapBlock(),
  },
  inlineContentSpecs: {
    ...defaultInlineContentSpecs,
    pageLink: PageLink,
  },
});

export function BlockEditor({
  pageId,
  initialContent,
  theme,
}: {
  pageId: Id<"pages">;
  initialContent: string;
  theme: "light" | "dark";
}) {
  const convex = useConvex();
  const save = useMutation(api.docs.save);
  const saveRef = useRef(save);
  saveRef.current = save;
  const allPages = useQuery(api.pages.list) ?? [];
  const pagesRef = useRef(allPages);
  pagesRef.current = allPages;

  // GIF/meme picker, opened from the "/" slash menu. The slash item awaits the
  // user's pick via this resolver so the insert lands in the slash-trigger block.
  const [gifOpen, setGifOpen] = useState(false);
  const gifResolve = useRef<((url: string | null) => void) | null>(null);
  const pickGif = () =>
    new Promise<string | null>((resolve) => {
      gifResolve.current = resolve;
      setGifOpen(true);
    });

  const parsed = useMemo<PartialBlock<typeof schema.blockSchema>[] | undefined>(() => {
    if (!initialContent) return undefined;
    try {
      const blocks = JSON.parse(initialContent);
      return Array.isArray(blocks) && blocks.length > 0 ? blocks : undefined;
    } catch {
      return undefined;
    }
  }, [initialContent]);

  const editor = useCreateBlockNote(
    {
      schema,
      initialContent: parsed,
      uploadFile: async (file: File) => {
        const postUrl = await convex.mutation(api.files.generateUploadUrl, {});
        const res = await fetch(postUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });
        const { storageId } = await res.json();
        const url = await convex.mutation(api.files.getUrl, { storageId });
        return url ?? "";
      },
    },
    [pageId]
  );

  const debouncedSave = useMemo(
    () =>
      debounce((content: string) => {
        void saveRef.current({ pageId, content });
      }, 600),
    [pageId]
  );

  // Custom blocks (database, drawing) take a ProseMirror NodeSelection that
  // never clears when clicking outside the editor — drop it to a text
  // selection so the blue "selected" outline goes away.
  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest(".bn-editor")) return;
      try {
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        const tiptap = (editor as any)._tiptapEditor;
        const selection = tiptap?.state?.selection;
        if (selection && "node" in selection) {
          tiptap.commands.setTextSelection(selection.from);
          tiptap.commands.blur();
        }
      } catch {
        // best-effort: never break the editor over a deselect
      }
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [editor]);

  useEffect(() => {
    setCurrentEditor(editor);
    return () => {
      clearCurrentEditor(editor);
      // Flush pending edits when switching pages or closing.
      debouncedSave.cancel();
      void saveRef.current({ pageId, content: JSON.stringify(editor.document) });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageId, editor]);

  let horizontalMenu = false;
  try {
    horizontalMenu =
      JSON.parse(localStorage.getItem("slate:fontSettings") ?? "{}")
        .horizontalSlashMenu === true;
  } catch {
    horizontalMenu = false;
  }

  return (
    <div className={`editor-wrap${horizontalMenu ? " horizontal-slash" : ""}`}>
      <BlockNoteView
        editor={editor}
        theme={theme}
        slashMenu={false}
        onChange={() => debouncedSave(JSON.stringify(editor.document))}
      >
        <SuggestionMenuController
          triggerCharacter="/"
          getItems={async (query) => {
            let simpleMode = false;
            try {
              simpleMode =
                JSON.parse(localStorage.getItem("slate:fontSettings") ?? "{}")
                  .simpleMode === true;
            } catch {
              simpleMode = false;
            }
            if (simpleMode) {
              return filterSuggestionItems(
                getDefaultReactSlashMenuItems(editor),
                query
              );
            }
            const customItems: DefaultReactSuggestionItem[] = [
              {
                title: "Database",
                subtext: "Table with typed columns, like Notion",
                aliases: ["database", "table", "db", "grid"],
                group: "Advanced",
                icon: <Table size={18} />,
                onItemClick: async () => {
                  const tableId = await convex.mutation(
                    api.database.createTable,
                    {}
                  );
                  insertOrUpdateBlockForSlashMenu(editor, {
                    type: "database",
                    props: { tableId },
                  });
                },
              },
              {
                title: "Drawing",
                subtext: "Excalidraw whiteboard for sketches and diagrams",
                aliases: ["drawing", "excalidraw", "sketch", "whiteboard", "draw", "diagram"],
                group: "Advanced",
                icon: <PenTool size={18} />,
                onItemClick: async () => {
                  const drawingId = await convex.mutation(
                    api.drawings.create,
                    {}
                  );
                  insertOrUpdateBlockForSlashMenu(editor, {
                    type: "drawing",
                    props: { drawingId },
                  });
                },
              },
              {
                title: "YouTube / Embed",
                subtext: "Embed YouTube, Vimeo, or any web page",
                aliases: ["youtube", "embed", "video", "vimeo", "iframe", "web"],
                group: "Media",
                icon: <MonitorPlay size={18} />,
                onItemClick: () => {
                  insertOrUpdateBlockForSlashMenu(editor, { type: "embed" });
                },
              },
              {
                title: "PDF",
                subtext: "Upload a PDF with inline preview",
                aliases: ["pdf", "document", "doc", "preview"],
                group: "Media",
                icon: <FileText size={18} />,
                onItemClick: () => {
                  insertOrUpdateBlockForSlashMenu(editor, { type: "pdf" });
                },
              },
              {
                title: "Mind map",
                subtext: "Interactive mind map from a text outline",
                aliases: ["mindmap", "mind", "map", "brainstorm", "tree"],
                group: "Advanced",
                icon: <Network size={18} />,
                onItemClick: () => {
                  insertOrUpdateBlockForSlashMenu(editor, { type: "mindmap" });
                },
              },
              {
                title: "Meme / GIF",
                subtext: "Search GIPHY and drop in a meme, emoji-picker style",
                aliases: ["meme", "gif", "giphy", "sticker", "reaction"],
                group: "Media",
                icon: <Laugh size={18} />,
                onItemClick: async () => {
                  const url = await pickGif();
                  if (url) {
                    insertOrUpdateBlockForSlashMenu(editor, {
                      type: "image",
                      props: { url },
                    });
                  }
                },
              },
            ];
            return filterSuggestionItems(
              combineByGroup(getDefaultReactSlashMenuItems(editor), customItems),
              query
            );
          }}
        />
        <SuggestionMenuController
          triggerCharacter="@"
          getItems={async (query) => {
            const q = query.trim().toLowerCase();
            return pagesRef.current
              .filter((p) =>
                (p.title || "Untitled").toLowerCase().includes(q)
              )
              .slice(0, 10)
              .map((p) => ({
                title: p.title || "Untitled",
                icon: <span>{p.icon ?? "📄"}</span>,
                onItemClick: () => {
                  editor.insertInlineContent([
                    {
                      type: "pageLink",
                      props: { pageId: p._id, label: p.title || "Untitled" },
                    },
                    " ",
                  ]);
                },
              }));
          }}
        />
      </BlockNoteView>
      {gifOpen && (
        <GifPickerModal
          onSelect={(url) => {
            gifResolve.current?.(url);
            gifResolve.current = null;
          }}
          onClose={() => {
            setGifOpen(false);
            gifResolve.current?.(null);
            gifResolve.current = null;
          }}
        />
      )}
    </div>
  );
}
