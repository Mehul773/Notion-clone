import { useState } from "react";
import { useConvex, useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { LayoutTemplate, Trash2 } from "lucide-react";
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
  const userTemplates = useQuery(api.templates.list);
  const removeTemplate = useMutation(api.templates.remove);
  const [busyId, setBusyId] = useState<string | null>(null);

  const use = async (id: string, markdown: string) => {
    if (busyId) return;
    setBusyId(id);
    try {
      const pageId = await importMarkdownPage(convex, markdown, {
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
          typed columns — edit everything after. Save your own from any page's
          ⋯ menu.
        </p>
        <div className="template-grid">
          {TEMPLATES.map((template) => (
            <button
              key={template.id}
              className="template-card"
              onClick={() => void use(template.id, template.markdown)}
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
        {userTemplates && userTemplates.length > 0 && (
          <>
            <div className="menu-label" style={{ marginTop: 8 }}>
              Your templates
            </div>
            <div className="template-grid">
              {userTemplates.map((template) => (
                <div key={template._id} className="template-card-wrap">
                  <button
                    className="template-card"
                    onClick={() => void use(template._id, template.markdown)}
                    disabled={busyId !== null}
                  >
                    <span className="template-icon">
                      {template.icon ?? "📄"}
                    </span>
                    <span className="template-name">{template.name}</span>
                    <span className="template-desc">Saved from a page</span>
                    {busyId === template._id && (
                      <div
                        className="spinner"
                        style={{ width: 14, height: 14 }}
                      />
                    )}
                  </button>
                  <button
                    className="template-delete"
                    title="Delete template"
                    onClick={() =>
                      void removeTemplate({ templateId: template._id })
                    }
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
