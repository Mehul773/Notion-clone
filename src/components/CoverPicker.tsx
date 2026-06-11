import { useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Popover } from "./Popover";
import { COVER_GRADIENTS } from "../lib/utils";

export function CoverPicker({
  anchor,
  onClose,
  onSelect,
  onRemove,
}: {
  anchor: DOMRect;
  onClose: () => void;
  onSelect: (cover: string) => void;
  onRemove?: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const getUrl = useMutation(api.files.getUrl);

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const postUrl = await generateUploadUrl();
      const res = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { storageId } = await res.json();
      const url = await getUrl({ storageId });
      if (url) {
        onSelect(url);
        onClose();
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <Popover anchor={anchor} onClose={onClose} className="cover-picker" align="end">
      <div className="cover-picker-label">Gallery</div>
      <div className="cover-grid">
        {COVER_GRADIENTS.map((g) => (
          <button
            key={g.name}
            className="cover-swatch"
            style={{ backgroundImage: g.css }}
            title={g.name}
            onClick={() => {
              onSelect(g.css);
              onClose();
            }}
          />
        ))}
      </div>
      <div className="cover-picker-actions">
        <button onClick={() => fileRef.current?.click()} disabled={uploading}>
          {uploading ? "Uploading…" : "Upload image"}
        </button>
        {onRemove && (
          <button
            onClick={() => {
              onRemove();
              onClose();
            }}
          >
            Remove
          </button>
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void upload(file);
        }}
      />
    </Popover>
  );
}
