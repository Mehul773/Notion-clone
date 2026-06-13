import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Image, Lock, Smile } from "lucide-react";
import { BlockEditor } from "./BlockEditor";
import { IconPicker } from "./IconPicker";
import { CoverPicker } from "./CoverPicker";
import { useAnchor } from "./Popover";
import { debounce } from "../lib/utils";
import { sha256 } from "../lib/crypto";
import { navigateToPage } from "../lib/pageNav";

export function PageView({
  pageId,
  theme,
}: {
  pageId: Id<"pages">;
  theme: "light" | "dark";
}) {
  const page = useQuery(api.pages.get, { pageId });
  const doc = useQuery(api.docs.get, { pageId });
  const backlinks = useQuery(api.pages.backlinks, { pageId });
  const rename = useMutation(api.pages.rename);
  const setIcon = useMutation(api.pages.setIcon);
  const setCover = useMutation(api.pages.setCover);

  const iconPicker = useAnchor();
  const coverPicker = useAnchor();

  const [title, setTitle] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [pwInput, setPwInput] = useState("");
  const [pwError, setPwError] = useState(false);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const debouncedRename = useMemo(
    () => debounce((t: string) => void rename({ pageId, title: t }), 350),
    [pageId, rename]
  );

  // Reset local state when switching pages.
  useEffect(() => {
    setTitle(null);
    setUnlocked(false);
    setPwInput("");
    setPwError(false);
  }, [pageId]);

  useEffect(() => {
    const el = titleRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }
  });

  if (page === undefined || doc === undefined) {
    return (
      <div className="loading-page">
        <div className="spinner" />
      </div>
    );
  }
  if (page === null) {
    return (
      <div className="empty-state">
        <h2>This page doesn't exist anymore</h2>
      </div>
    );
  }

  const displayTitle = title ?? page.title;
  const isImage = page.cover?.startsWith("http");

  if (page.passwordHash && !unlocked) {
    return (
      <div className="page-lock">
        <Lock size={36} />
        <h2>{page.icon} {page.title || "Locked page"}</h2>
        <p>This page is password protected.</p>
        <input
          type="password"
          className="page-lock-input"
          placeholder="Enter password…"
          autoFocus
          value={pwInput}
          onChange={(e) => {
            setPwInput(e.target.value);
            setPwError(false);
          }}
          onKeyDown={async (e) => {
            if (e.key !== "Enter") return;
            const hash = await sha256(pwInput);
            if (hash === page.passwordHash) setUnlocked(true);
            else setPwError(true);
          }}
        />
        {pwError && <span className="page-lock-error">Wrong password</span>}
      </div>
    );
  }

  return (
    <div className="page-scroll">
      {page.cover && (
        <div
          className="page-cover"
          style={
            isImage
              ? { backgroundImage: `url("${page.cover}")` }
              : { backgroundImage: page.cover }
          }
        >
          <div className="page-cover-actions">
            <button className="cover-action-btn" onClick={coverPicker.open}>
              Change cover
            </button>
            <button
              className="cover-action-btn"
              onClick={() => void setCover({ pageId, cover: undefined })}
            >
              Remove
            </button>
          </div>
        </div>
      )}
      <div className="page-body">
        {page.icon && (
          <div className="page-icon-wrap">
            <button
              className="page-icon"
              onClick={iconPicker.open}
              style={page.cover ? undefined : { position: "static", display: "inline-block", marginTop: 56 }}
            >
              {page.icon}
            </button>
          </div>
        )}
        <div
          className={`page-head${page.icon ? " has-icon" : ""}${page.cover ? " has-cover" : ""}`}
        >
          <div className="page-head-hover-actions">
            {!page.icon && (
              <button className="head-action-btn" onClick={iconPicker.open}>
                <Smile size={14} /> Add icon
              </button>
            )}
            {!page.cover && (
              <button className="head-action-btn" onClick={coverPicker.open}>
                <Image size={14} /> Add cover
              </button>
            )}
          </div>
          <textarea
            ref={titleRef}
            className="page-title-input"
            placeholder="Untitled"
            value={displayTitle}
            rows={1}
            onChange={(e) => {
              setTitle(e.target.value);
              debouncedRename(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                // Move focus into the document body.
                const editorEl = document.querySelector<HTMLElement>(
                  ".editor-wrap .bn-editor [contenteditable=true]"
                );
                editorEl?.focus();
              }
            }}
          />
        </div>
        <BlockEditor
          key={pageId}
          pageId={pageId}
          initialContent={doc?.content ?? ""}
          theme={theme}
        />
        {backlinks && backlinks.length > 0 && (
          <div className="backlinks">
            <div className="backlinks-label">Linked from</div>
            {backlinks.map((b) => (
              <button
                key={b._id}
                className="backlink-chip"
                onClick={() => navigateToPage(b._id)}
              >
                <span>{b.icon ?? "📄"}</span>
                {b.title || "Untitled"}
              </button>
            ))}
          </div>
        )}
      </div>

      {iconPicker.anchor && (
        <IconPicker
          anchor={iconPicker.anchor}
          onClose={iconPicker.close}
          onSelect={(emoji) => void setIcon({ pageId, icon: emoji })}
          onRemove={
            page.icon ? () => void setIcon({ pageId, icon: undefined }) : undefined
          }
        />
      )}
      {coverPicker.anchor && (
        <CoverPicker
          anchor={coverPicker.anchor}
          onClose={coverPicker.close}
          onSelect={(cover) => void setCover({ pageId, cover })}
          onRemove={
            page.cover
              ? () => void setCover({ pageId, cover: undefined })
              : undefined
          }
        />
      )}
    </div>
  );
}
