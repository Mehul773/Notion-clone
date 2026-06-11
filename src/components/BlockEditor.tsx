import { useEffect, useMemo, useRef } from "react";
import {
  BlockNoteSchema,
  defaultBlockSpecs,
  combineByGroup,
  filterSuggestionItems,
  insertOrUpdateBlockForSlashMenu,
  PartialBlock,
} from "@blocknote/core";
import "@blocknote/core/fonts/inter.css";
import {
  createReactBlockSpec,
  DefaultReactSuggestionItem,
  getDefaultReactSlashMenuItems,
  SuggestionMenuController,
  useCreateBlockNote,
} from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { useConvex, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Table } from "lucide-react";
import { DatabaseTable } from "./DatabaseTable";
import { debounce } from "../lib/utils";

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

const schema = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,
    database: DatabaseBlock(),
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

  useEffect(() => {
    return () => {
      // Flush pending edits when switching pages or closing.
      debouncedSave.cancel();
      void saveRef.current({ pageId, content: JSON.stringify(editor.document) });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageId, editor]);

  return (
    <div className="editor-wrap">
      <BlockNoteView
        editor={editor}
        theme={theme}
        slashMenu={false}
        onChange={() => debouncedSave(JSON.stringify(editor.document))}
      >
        <SuggestionMenuController
          triggerCharacter="/"
          getItems={async (query) => {
            const databaseItem: DefaultReactSuggestionItem = {
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
            };
            return filterSuggestionItems(
              combineByGroup(getDefaultReactSlashMenuItems(editor), [
                databaseItem,
              ]),
              query
            );
          }}
        />
      </BlockNoteView>
    </div>
  );
}
