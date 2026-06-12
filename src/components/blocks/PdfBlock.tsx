import { useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { FileText, Download } from "lucide-react";

/* eslint-disable @typescript-eslint/no-explicit-any */

export function PdfView({ block, editor }: { block: any; editor: any }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const getUrl = useMutation(api.files.getUrl);

  const url: string = block.props.url;
  const name: string = block.props.name;

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const postUrl = await generateUploadUrl();
      const res = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type || "application/pdf" },
        body: file,
      });
      const { storageId } = await res.json();
      const fileUrl = await getUrl({ storageId });
      if (fileUrl) {
        editor.updateBlock(block, { props: { url: fileUrl, name: file.name } });
      }
    } finally {
      setUploading(false);
    }
  };

  if (!url) {
    return (
      <div
        className="embed-placeholder"
        contentEditable={false}
        onClick={() => fileRef.current?.click()}
        style={{ cursor: "pointer" }}
      >
        <FileText size={18} />
        <span className="placeholder-label">
          {uploading ? "Uploading…" : "Upload a PDF document"}
        </span>
        <input
          ref={fileRef}
          type="file"
          accept="application/pdf,.pdf"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void upload(file);
          }}
        />
      </div>
    );
  }

  return (
    <div className="pdf-frame" contentEditable={false}>
      <div className="embed-url-bar pdf-title-bar">
        <FileText size={12} />
        <span>{name || "Document"}</span>
        <a href={url} download={name || "document.pdf"} title="Download" target="_blank" rel="noreferrer">
          <Download size={13} />
        </a>
      </div>
      <iframe src={url} title={name || "PDF document"} />
    </div>
  );
}
