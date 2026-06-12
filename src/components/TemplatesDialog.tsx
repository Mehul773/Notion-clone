import { useState } from "react";
import { useConvex } from "convex/react";
import { Id } from "../../convex/_generated/dataModel";
import { LayoutTemplate } from "lucide-react";
import { Modal } from "./Popover";
import { importMarkdownPage } from "../lib/markdownImport";
import { TEMPLATES } from "../lib/templates";

export function TemplatesDialog({
  onClose,
  onSelect,
}: {
  onClose: () => void;
  onSelect: (id: Id<"pages">) => void;
}) {
  const convex = useConvex();
  const [busyId, setBusyId] = useState<string | null>(null);

  const use = async (templateId: string) => {
    const template = TEMPLATES.find((t) => t.id === templateId);
    if (!template || busyId) return;
    setBusyId(templateId);
    try {
      const pageId = await importMarkdownPage(convex, template.markdown, {
        convertTables: true,
      });
      onSelect(pageId);
      onClose();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Modal onClose={busyId ? () => {} : onClose} width={620}>
      <div className="ai-dialog">
        <div className="ai-dialog-title">
          <LayoutTemplate size={17} /> Templates
        </div>
        <p className="ai-dialog-hint">
          Start from a ready-made page. Tables come in as real databases with
          typed columns — edit everything after.
        </p>
        <div className="template-grid">
          {TEMPLATES.map((template) => (
            <button
              key={template.id}
              className="template-card"
              onClick={() => void use(template.id)}
              disabled={busyId !== null}
            >
              <span className="template-icon">{template.icon}</span>
              <span className="template-name">{template.name}</span>
              <span className="template-desc">{template.description}</span>
              {busyId === template.id && (
                <div className="spinner" style={{ width: 14, height: 14 }} />
              )}
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
}
