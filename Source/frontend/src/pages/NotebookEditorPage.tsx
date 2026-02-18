import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import FontFamily from "@tiptap/extension-font-family";
import TextAlign from "@tiptap/extension-text-align";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { TaskList } from "@tiptap/extension-task-list";
import { TaskItem } from "@tiptap/extension-task-item";
import { ArrowLeft, Download, ChevronDown } from "lucide-react";
import { FontSize } from "../lib/tiptap-font-size";
import { getNotebookById, updateNotebookContent, downloadNotebookExport } from "../api/notebooks";
import type { NotebookDetailDto } from "../types";
import { PaperShell } from "../components/notebooks/PaperShell";
import { IndexCardToolbar } from "../components/dashboard/IndexCardToolbar";

const SAVE_DEBOUNCE_MS = 800;
const DEFAULT_DOC = { type: "doc", content: [] } as const;

function parseContentJson(raw: string | undefined): object {
  if (!raw || !raw.trim()) return { ...DEFAULT_DOC };
  try {
    const parsed = JSON.parse(raw) as object;
    return parsed && typeof parsed === "object" && "type" in parsed ? parsed : { ...DEFAULT_DOC };
  } catch {
    return { ...DEFAULT_DOC };
  }
}

function debounce<T extends (...args: unknown[]) => void>(fn: T, ms: number) {
  let t: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function safeFileName(name: string): string {
  return name.replace(/[^\w\s.-]/g, "").trim() || "notebook";
}

export function NotebookEditorPage() {
  const { notebookId } = useParams<{ notebookId: string }>();
  const navigate = useNavigate();
  const [notebook, setNotebook] = useState<NotebookDetailDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const lastSavedJsonRef = useRef<string>("");
  const downloadMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!notebookId) return;
    let cancelled = false;
    setError(null);
    getNotebookById(notebookId)
      .then((data) => {
        if (!cancelled) {
          setNotebook(data);
          lastSavedJsonRef.current = data.contentJson ?? "{}";
        }
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load notebook.");
      });
    return () => {
      cancelled = true;
    };
  }, [notebookId]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: false }),
      TextStyle,
      Color,
      FontFamily,
      FontSize,
      TextAlign.configure({ types: ["paragraph"] }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      TaskList,
      TaskItem.configure({ nested: true }),
    ],
    content: null,
    editorProps: {
      attributes: {
        class:
          "prose prose-zinc dark:prose-invert max-w-none focus:outline-none min-h-[400px]",
      },
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (!editor || !notebook) return;
    const content = parseContentJson(notebook.contentJson);
    editor.commands.setContent(content, false);
  }, [editor, notebook]);

  const save = useMemo(
    () =>
      debounce(async () => {
        if (!editor || !notebookId) return;
        const json = editor.getJSON();
        const jsonString = JSON.stringify(json);
        if (jsonString === lastSavedJsonRef.current) return;
        try {
          await updateNotebookContent(notebookId, { contentJson: jsonString });
          lastSavedJsonRef.current = jsonString;
        } catch {
          // Keep editor state; user can retry
        }
      }, SAVE_DEBOUNCE_MS),
    [editor, notebookId],
  );

  useEffect(() => {
    if (!editor) return;
    const handler = () => save();
    editor.on("update", handler);
    return () => editor.off("update", handler);
  }, [editor, save]);

  const handleClose = useCallback(() => {
    navigate("/notebooks");
  }, [navigate]);

  useEffect(() => {
    if (!downloadMenuOpen) return;
    function onPointerDown(e: PointerEvent) {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(e.target as Node)) {
        setDownloadMenuOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [downloadMenuOpen]);

  const handleExportFormat = useCallback(
    async (format: string) => {
      setDownloadMenuOpen(false);
      if (!notebook || !notebookId) return;
      setExporting(true);
      try {
        const { blob, filename } = await downloadNotebookExport(notebookId, format);
        triggerDownload(blob, filename);
      } finally {
        setExporting(false);
      }
    },
    [notebookId, notebook],
  );

  const handleSaveAsHtml = useCallback(() => {
    setDownloadMenuOpen(false);
    if (!editor || !notebook) return;
    const html = editor.getHTML();
    const blob = new Blob([html], { type: "text/html; charset=utf-8" });
    triggerDownload(blob, `${safeFileName(notebook.name)}.html`);
  }, [editor, notebook]);

  const handleSaveAsJson = useCallback(() => {
    setDownloadMenuOpen(false);
    if (!editor || !notebook) return;
    const json = editor.getJSON();
    const blob = new Blob([JSON.stringify(json, null, 2)], { type: "application/json" });
    triggerDownload(blob, `${safeFileName(notebook.name)}.json`);
  }, [editor, notebook]);

  if (!notebookId) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12">
        <p className="text-sm text-muted-foreground">Missing notebook.</p>
        <button
          type="button"
          onClick={() => navigate("/notebooks")}
          className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
        >
          Back to Notebooks
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <p className="text-sm text-red-500">{error}</p>
        <button
          type="button"
          onClick={handleClose}
          className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
        >
          Back to Notebooks
        </button>
      </div>
    );
  }

  if (!notebook) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <span className="text-sm text-muted-foreground">Loading notebook...</span>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-background">
      <div className="flex flex-shrink-0 items-center justify-between gap-2 border-b border-border px-4 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-2 text-foreground/70 hover:bg-foreground/10 hover:text-foreground"
            aria-label="Back to notebooks"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <span className="truncate text-sm font-medium text-foreground">{notebook.name}</span>
        </div>
        <div className="flex items-center gap-2">
          {editor && (
            <IndexCardToolbar
              editor={editor}
              cardColor="white"
              onCardColorChange={() => {}}
              cardRotation={0}
              onCardRotationChange={() => {}}
              hideCardColor
              hideTilt
            />
          )}
          {editor && (
            <div ref={downloadMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setDownloadMenuOpen((v) => !v)}
                disabled={exporting}
                className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-foreground/70 hover:bg-foreground/10 hover:text-foreground disabled:opacity-50"
                aria-label="Download"
                aria-expanded={downloadMenuOpen}
              >
                <Download className="h-4 w-4" />
                <span>Download</span>
                <ChevronDown className="h-4 w-4" />
              </button>
              {downloadMenuOpen && (
                <div className="absolute right-0 top-full z-50 mt-1 min-w-[180px] rounded-lg border border-border bg-background py-1 shadow-lg">
                  <div className="px-2 py-1 text-xs font-medium text-foreground/60">Export (server)</div>
                  <button
                    type="button"
                    className="w-full px-3 py-1.5 text-left text-sm hover:bg-foreground/5"
                    onClick={() => handleExportFormat("pdf")}
                  >
                    PDF
                  </button>
                  <button
                    type="button"
                    className="w-full px-3 py-1.5 text-left text-sm hover:bg-foreground/5"
                    onClick={() => handleExportFormat("txt")}
                  >
                    Plain text (.txt)
                  </button>
                  <button
                    type="button"
                    className="w-full px-3 py-1.5 text-left text-sm hover:bg-foreground/5"
                    onClick={() => handleExportFormat("md")}
                  >
                    Markdown (.md)
                  </button>
                  <button
                    type="button"
                    className="w-full px-3 py-1.5 text-left text-sm hover:bg-foreground/5"
                    onClick={() => handleExportFormat("html")}
                  >
                    HTML
                  </button>
                  <div className="my-1 border-t border-border/50" />
                  <div className="px-2 py-1 text-xs font-medium text-foreground/60">Save for editing</div>
                  <button
                    type="button"
                    className="w-full px-3 py-1.5 text-left text-sm hover:bg-foreground/5"
                    onClick={handleSaveAsHtml}
                  >
                    Save as HTML
                  </button>
                  <button
                    type="button"
                    className="w-full px-3 py-1.5 text-left text-sm hover:bg-foreground/5"
                    onClick={handleSaveAsJson}
                  >
                    Save as JSON
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <PaperShell showPageSeparators>
          <EditorContent editor={editor} />
        </PaperShell>
      </div>
    </div>
  );
}
