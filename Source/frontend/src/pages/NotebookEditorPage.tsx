import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TextStyle } from "@tiptap/extension-text-style";
import { LineHeight } from "@tiptap/extension-text-style/line-height";
import Color from "@tiptap/extension-color";
import FontFamily from "@tiptap/extension-font-family";
import TextAlign from "@tiptap/extension-text-align";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { TaskList } from "@tiptap/extension-task-list";
import { TaskItem } from "@tiptap/extension-task-item";
import { Heading } from "@tiptap/extension-heading";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import Underline from "@tiptap/extension-underline";
import Image from "@tiptap/extension-image";
import { FontSize } from "../lib/tiptap-font-size";
import { getNotebookById, updateNotebookContent, downloadNotebookExport, createNotebookVersion, getNotebookVersions, restoreNotebookVersion, uploadNotebookImage } from "../api/notebooks";
import { useNotebookRealtime, type NotebookPresenceUser } from "../hooks/useNotebookRealtime";
import { getColorForUserId } from "../lib/presenceColors";
import { useAuth } from "../context/AuthContext";
import type { NotebookDetailDto, NotebookVersionDto } from "../types";
import type { AppLayoutContext } from "../components/layout/AppLayout";
import { PaperShell } from "../components/notebooks/PaperShell";
import { ZoomablePaperShell } from "../components/notebooks/ZoomablePaperShell";
import { NotebookToolbar } from "../components/notebooks/NotebookToolbar";
import { NotebookMenuBar } from "../components/notebooks/NotebookMenuBar";

const SAVE_DEBOUNCE_MS = 1000; // Debounce saves to prevent race conditions when typing fast (1 second)
const DEFAULT_DOC = { type: "doc", content: [] } as const;

/** Strip legacy pageMargin nodes when loading: lift their content into the doc so top-of-page text is not lost. */
function stripLegacyPageMargins(doc: object): object {
  if (!doc || typeof doc !== "object") return doc;
  const d = doc as { content?: unknown[] };
  if (!Array.isArray(d.content)) return doc;
  return { ...doc, content: flattenPageMargins(d.content) };
}

/** Flatten pageMargin nodes (lift their children into the parent) and recurse into other nodes' content. */
function flattenPageMargins(nodes: unknown[]): unknown[] {
  const out: unknown[] = [];
  for (const n of nodes) {
    if (typeof n !== "object" || n === null) {
      out.push(n);
      continue;
    }
    const node = n as { type?: string; content?: unknown[] };
    if (node.type === "pageMargin" && Array.isArray(node.content)) {
      out.push(...flattenPageMargins(node.content));
    } else {
      out.push(processNodeContent(n as Record<string, unknown>));
    }
  }
  return out;
}

function processNodeContent(node: Record<string, unknown>): Record<string, unknown> {
  const content = node.content;
  if (!Array.isArray(content)) return node;
  return { ...node, content: flattenPageMargins(content) };
}

function parseContentJson(raw: string | undefined): object {
  if (!raw || !raw.trim()) return { ...DEFAULT_DOC };
  try {
    const parsed = JSON.parse(raw) as object;
    const doc = parsed && typeof parsed === "object" && "type" in parsed ? parsed : { ...DEFAULT_DOC };
    return stripLegacyPageMargins(doc);
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

interface RemoteCaretProps {
  editor: ReturnType<typeof useEditor>;
  position: number;
  color: string;
  wrapperRef: React.RefObject<HTMLDivElement | null>;
}

function RemoteCaret({ editor, position, color, wrapperRef }: RemoteCaretProps) {
  const [style, setStyle] = useState<{ left: number; top: number; height: number } | null>(null);
  const docSize = editor?.state?.doc?.content?.size ?? 0;
  useLayoutEffect(() => {
    if (!editor?.view || !wrapperRef.current) {
      setStyle(null);
      return;
    }
    const pos = Math.min(Math.max(0, position), docSize);
    const run = () => {
      try {
        const coords = editor.view.coordsAtPos(pos);
        const wrapper = wrapperRef.current;
        if (!wrapper) return;
        const rect = wrapper.getBoundingClientRect();
        setStyle({
          left: coords.left - rect.left,
          top: coords.top - rect.top,
          height: coords.bottom - coords.top,
        });
      } catch {
        setStyle(null);
      }
    };
    const id = requestAnimationFrame(run);
    return () => cancelAnimationFrame(id);
  }, [editor, position, wrapperRef, docSize]);

  if (!style) return null;
  return (
    <div
      className="absolute z-10 pointer-events-none"
      style={{
        left: style.left,
        top: style.top,
        width: 2,
        height: Math.min(120, Math.max(16, style.height)),
        backgroundColor: color,
      }}
    />
  );
}

export function NotebookEditorPage() {
  const { notebookId } = useParams<{ notebookId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentUserId = user?.userId ?? null;
  const { setBoardName, setBoardPresence, isSidebarOpen } = useOutletContext<AppLayoutContext>();
  const [notebook, setNotebook] = useState<NotebookDetailDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [versions, setVersions] = useState<NotebookVersionDto[]>([]);
  const [savingVersion, setSavingVersion] = useState(false);
  const [zoom, setZoom] = useState(1);
  const lastSavedJsonRef = useRef<string>("");
  /** Content we last synced into the editor from notebook state; avoid resetting editor after our own save. */
  const lastSyncedContentJsonRef = useRef<string>("");
  /** Track the latest updatedAt timestamp to prevent race conditions with concurrent saves */
  const latestUpdatedAtRef = useRef<Date | null>(null);
  const saveInProgressRef = useRef<boolean>(false);
  const lastSaveAtRef = useRef<number>(0);
  const NOTEBOOK_ECHO_IGNORE_MS = 2500;
  const [remoteTextCursors, setRemoteTextCursors] = useState<Map<string, { position: number; color: string }>>(new Map());
  const editorWrapperRef = useRef<HTMLDivElement>(null);
  const textCursorThrottleRef = useRef<number>(0);
  const TEXT_CURSOR_THROTTLE_MS = 80;
  const importFileInputRef = useRef<HTMLInputElement>(null);
  const menuImageInputRef = useRef<HTMLInputElement>(null);

  const handleTextCursorPosition = useCallback((userId: string, position: number) => {
    if (currentUserId != null && userId === currentUserId) return;
    setRemoteTextCursors((prev) => {
      const next = new Map(prev);
      if (position < 0) next.delete(userId);
      else next.set(userId, { position, color: getColorForUserId(userId) });
      return next;
    });
  }, [currentUserId]);

  const handleUserLeft = useCallback((userId: string) => {
    setRemoteTextCursors((prev) => {
      const next = new Map(prev);
      next.delete(userId);
      return next;
    });
  }, []);

  const handlePresenceUpdate = useCallback((users: NotebookPresenceUser[]) => {
    setBoardPresence(users);
    const presentIds = new Set(users.map((u) => u.userId));
    setRemoteTextCursors((prev) => {
      const toRemove = [...prev.keys()].filter((uid) => !presentIds.has(uid));
      if (toRemove.length === 0) return prev;
      const next = new Map(prev);
      for (const uid of toRemove) next.delete(uid);
      return next;
    });
  }, []);

  const handleNotebookUpdated = useCallback((payload: { contentJson: string; updatedAt: string }) => {
    if (Date.now() - lastSaveAtRef.current < NOTEBOOK_ECHO_IGNORE_MS) return;
    lastSavedJsonRef.current = payload.contentJson;
    latestUpdatedAtRef.current = payload.updatedAt ? new Date(payload.updatedAt) : null;
    setNotebook((prev) => (prev ? { ...prev, contentJson: payload.contentJson, updatedAt: payload.updatedAt } : null));
  }, []);

  const { sendTextCursor } = useNotebookRealtime(notebookId ?? undefined, {
    enabled: !!notebook?.projectId,
    onPresenceUpdate: handlePresenceUpdate,
    onNotebookUpdated: handleNotebookUpdated,
    onTextCursorPosition: handleTextCursorPosition,
    onUserLeft: handleUserLeft,
  });

  const sendTextCursorIfNeeded = useCallback(
    (pos: number) => {
      sendTextCursor(pos);
    },
    [sendTextCursor],
  );

  useEffect(() => {
    if (!notebookId) return;
    let cancelled = false;
    setError(null);
    getNotebookById(notebookId)
      .then((data) => {
        if (!cancelled) {
          setNotebook(data);
          setBoardName(data.name);
          lastSavedJsonRef.current = data.contentJson ?? "{}";
          latestUpdatedAtRef.current = data.updatedAt ? new Date(data.updatedAt) : null;
        }
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load notebook.");
      });
    return () => {
      cancelled = true;
      setBoardName(null);
    };
  }, [notebookId, setBoardName]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: false, link: false, underline: false }),
      TextStyle,
      LineHeight,
      Color,
      FontFamily,
      FontSize,
      TextAlign.configure({ types: ["paragraph", "heading"] }),
      Heading.configure({ levels: [1, 2, 3, 4, 5, 6] }),
      Highlight.configure({ multicolor: true }),
      Link.configure({ openOnClick: false }),
      Subscript,
      Superscript,
      Underline,
      Image.configure({ inline: true, allowBase64: true }),
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
          "prose prose-zinc dark:prose-invert max-w-none focus:outline-none min-h-[400px] text-[12px]",
      },
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (!editor || !notebook) return;
    const contentJson = notebook.contentJson ?? "";
    if (contentJson === lastSyncedContentJsonRef.current) return;
    lastSyncedContentJsonRef.current = contentJson;
    const content = parseContentJson(notebook.contentJson);
    editor.commands.setContent(content, { emitUpdate: false });
  }, [editor, notebook]);

  useEffect(() => {
    if (!editor || !sendTextCursor) return;
    const handler = () => {
      const now = Date.now();
      if (now - textCursorThrottleRef.current < TEXT_CURSOR_THROTTLE_MS) return;
      textCursorThrottleRef.current = now;
      sendTextCursorIfNeeded(editor.state.selection.from);
    };
    const focusHandler = () => sendTextCursorIfNeeded(editor.state.selection.from);
    editor.on("selectionUpdate", handler);
    editor.on("focus", focusHandler);
    return () => {
      editor.off("selectionUpdate", handler);
      editor.off("focus", focusHandler);
    };
  }, [editor, sendTextCursor, sendTextCursorIfNeeded]);

  const save = useMemo(
    () =>
      debounce(async () => {
        if (!editor || !notebookId) return;
        const json = editor.getJSON();
        const jsonString = JSON.stringify(json);
        if (jsonString === lastSavedJsonRef.current) return;
        
        // Wait for any in-progress save to complete before starting a new one
        while (saveInProgressRef.current) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        saveInProgressRef.current = true;
        try {
          // Use the latest known updatedAt from ref to prevent race conditions
          const updatedAtRef = latestUpdatedAtRef.current || (notebook?.updatedAt ? new Date(notebook.updatedAt) : undefined);
          const updatedAtToSend = updatedAtRef?.toISOString();
          
          await updateNotebookContent(notebookId, {
            contentJson: jsonString,
            updatedAt: updatedAtToSend,
          });
          lastSaveAtRef.current = Date.now();
          lastSavedJsonRef.current = jsonString;
          lastSyncedContentJsonRef.current = jsonString;
          // Refetch to get server's actual updatedAt (avoids clock skew conflicts)
          try {
            const data = await getNotebookById(notebookId);
            setNotebook(data);
            latestUpdatedAtRef.current = data.updatedAt ? new Date(data.updatedAt) : null;
          } catch {
            // Refetch failed; update local state without updatedAt to avoid stale timestamp
            if (notebook) {
              setNotebook((prev) => (prev ? { ...prev, contentJson: jsonString } : null));
            }
          }
        } catch (err: unknown) {
          const status = (err as { response?: { status?: number } })?.response?.status;
          if (status === 409) {
            try {
              const data = await getNotebookById(notebookId);
              setNotebook(data);
              latestUpdatedAtRef.current = data.updatedAt ? new Date(data.updatedAt) : null;
              const content = parseContentJson(data.contentJson ?? "");
              editor.commands.setContent(content, { emitUpdate: false });
              const jsonStr = data.contentJson ?? "{}";
              lastSavedJsonRef.current = jsonStr;
              lastSyncedContentJsonRef.current = jsonStr;
            } catch {
              // Reload failed; keep editor state
            }
          }
        } finally {
          saveInProgressRef.current = false;
        }
      }, SAVE_DEBOUNCE_MS),
    [editor, notebookId, notebook?.updatedAt],
  );

  useEffect(() => {
    if (!editor) return;
    const handler = () => save();
    editor.on("update", handler);
    return () => {
      editor.off("update", handler);
    };
  }, [editor, save]);

  const handleClose = useCallback(() => {
    navigate("/notebooks");
  }, [navigate]);

  const handleFileMenuOpen = useCallback(() => {
    if (notebookId) getNotebookVersions(notebookId).then(setVersions).catch(() => setVersions([]));
  }, [notebookId]);

  const handleSaveVersion = useCallback(async () => {
    if (!notebookId) return;
    setSavingVersion(true);
    try {
      await createNotebookVersion(notebookId);
      const list = await getNotebookVersions(notebookId);
      setVersions(list);
    } finally {
      setSavingVersion(false);
    }
  }, [notebookId]);

  const handleRestoreVersion = useCallback(
    async (versionId: string) => {
      if (!notebookId || !editor) return;
      await restoreNotebookVersion(notebookId, versionId);
      const data = await getNotebookById(notebookId);
      setNotebook(data);
      latestUpdatedAtRef.current = data.updatedAt ? new Date(data.updatedAt) : null;
      const content = parseContentJson(data.contentJson ?? "");
      editor.commands.setContent(content, { emitUpdate: false });
      const jsonStr = data.contentJson ?? "{}";
      lastSavedJsonRef.current = jsonStr;
      lastSyncedContentJsonRef.current = jsonStr;
    },
    [notebookId, editor],
  );

  function formatVersionDate(createdAt: string): string {
    try {
      const d = new Date(createdAt);
      return d.toLocaleDateString(undefined, { dateStyle: "short" }) + " " + d.toLocaleTimeString(undefined, { timeStyle: "short" });
    } catch {
      return createdAt;
    }
  }

  const handleExportFormat = useCallback(
    async (format: string) => {
      if (!notebook || !notebookId) return;
      setExporting(true);
      try {
        if (format === "pdf") {
          if (editor) {
            const jsonString = JSON.stringify(editor.getJSON());
            const updatedAtRef = latestUpdatedAtRef.current || (notebook.updatedAt ? new Date(notebook.updatedAt) : undefined);
            await updateNotebookContent(notebookId, {
              contentJson: jsonString,
              updatedAt: updatedAtRef?.toISOString(),
            });
            lastSaveAtRef.current = Date.now();
            lastSavedJsonRef.current = jsonString;
            // Update ref after successful save
            try {
              const data = await getNotebookById(notebookId);
              latestUpdatedAtRef.current = data.updatedAt ? new Date(data.updatedAt) : null;
            } catch {
              // Ignore refetch errors
            }
          }
          const { blob, filename } = await downloadNotebookExport(notebookId, "pdf");
          triggerDownload(blob, filename);
        } else {
          const { blob, filename } = await downloadNotebookExport(notebookId, format);
          triggerDownload(blob, filename);
        }
      } finally {
        setExporting(false);
      }
    },
    [notebookId, notebook, editor],
  );

  const handleSaveAsHtml = useCallback(() => {
    if (!editor || !notebook) return;
    const html = editor.getHTML();
    const blob = new Blob([html], { type: "text/html; charset=utf-8" });
    triggerDownload(blob, `${safeFileName(notebook.name)}.html`);
  }, [editor, notebook]);

  const handleSaveAsJson = useCallback(() => {
    if (!editor || !notebook) return;
    const json = editor.getJSON();
    const blob = new Blob([JSON.stringify(json, null, 2)], { type: "application/json" });
    triggerDownload(blob, `${safeFileName(notebook.name)}.json`);
  }, [editor, notebook]);

  const handleDownloadPdf = useCallback(async () => {
    if (!notebookId || !notebook) return;
    setExporting(true);
    try {
      if (editor) {
        const jsonString = JSON.stringify(editor.getJSON());
        const updatedAtRef = latestUpdatedAtRef.current || (notebook.updatedAt ? new Date(notebook.updatedAt) : undefined);
        await updateNotebookContent(notebookId, {
          contentJson: jsonString,
          updatedAt: updatedAtRef?.toISOString(),
        });
        lastSaveAtRef.current = Date.now();
        lastSavedJsonRef.current = jsonString;
        // Update ref after successful save
        try {
          const data = await getNotebookById(notebookId);
          latestUpdatedAtRef.current = data.updatedAt ? new Date(data.updatedAt) : null;
        } catch {
          // Ignore refetch errors
        }
      }
      const { blob, filename } = await downloadNotebookExport(notebookId, "pdf");
      triggerDownload(blob, filename);
    } finally {
      setExporting(false);
    }
  }, [notebookId, notebook, editor]);

  const handleMenuImageFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file || !editor || !notebookId) return;
      try {
        const { url } = await uploadNotebookImage(notebookId, file);
        editor.chain().focus().setImage({ src: url }).run();
      } catch {
        // Upload failed; user can try again or use By URL
      }
    },
    [editor, notebookId],
  );

  const handleImportJson = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !editor) return;
      file
        .text()
        .then((text) => {
          try {
            const parsed = JSON.parse(text) as object;
            if (parsed && typeof parsed === "object" && (parsed as { type?: string }).type === "doc") {
              editor.commands.setContent(parsed, { emitUpdate: false });
              lastSavedJsonRef.current = JSON.stringify(parsed);
            }
          } catch {
            // Invalid JSON or not a TipTap doc; ignore
          }
        })
        .finally(() => {
          e.target.value = "";
        });
    },
    [editor],
  );

  if (!notebookId) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12">
        <p className="text-sm text-foreground/60">Missing notebook.</p>
        <button
          type="button"
          onClick={() => navigate("/notebooks")}
          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-amber-600 hover:shadow-md hover:-translate-y-0.5 dark:bg-amber-600 dark:hover:bg-amber-500"
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
          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-amber-600 hover:shadow-md hover:-translate-y-0.5 dark:bg-amber-600 dark:hover:bg-amber-500"
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
        <span className="text-sm text-foreground/60">Loading notebook...</span>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-background">
      {/* Toolbar header - overflow-visible so Download/Version history dropdowns aren't clipped */}
      <div className="notepad-card flex-shrink-0 !overflow-visible border-b border-border/50 z-10">
        <div className="notepad-spiral-strip" />
        {editor && (
          <div className="hidden sm:block border-b border-gray-200 dark:border-gray-700">
            <NotebookMenuBar
              editor={editor}
              zoom={zoom}
              onZoomChange={setZoom}
              onPrint={() => window.print()}
              onExport={handleExportFormat}
              onSaveAsHtml={handleSaveAsHtml}
              onSaveAsJson={handleSaveAsJson}
              onImportClick={() => importFileInputRef.current?.click()}
              onFileMenuOpen={handleFileMenuOpen}
              exporting={exporting}
              versions={versions}
              savingVersion={savingVersion}
              onSaveVersion={handleSaveVersion}
              onRestoreVersion={handleRestoreVersion}
              formatVersionDate={formatVersionDate}
              onInsertImageUpload={() => menuImageInputRef.current?.click()}
            />
          </div>
        )}
        <div className="flex items-center justify-between gap-2 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-2">
          {editor && (
            <div className="hidden sm:block w-full">
              <NotebookToolbar
                editor={editor}
                zoom={zoom}
                onZoomChange={setZoom}
                notebookId={notebookId ?? undefined}
                onDownloadPdf={handleDownloadPdf}
                pdfExporting={exporting}
              />
            </div>
          )}
          </div>
        </div>
        <input
          ref={importFileInputRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          aria-hidden
          onChange={handleImportJson}
        />
        <input
          ref={menuImageInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          aria-hidden
          onChange={handleMenuImageFileSelect}
        />
      </div>
      <div className="flex-1 min-w-0 overflow-hidden">
        <ZoomablePaperShell zoom={zoom} onZoomChange={setZoom} sidebarExpanded={isSidebarOpen}>
          <PaperShell>
            <div ref={editorWrapperRef} className="relative overflow-visible">
              <EditorContent editor={editor} />
              {Array.from(remoteTextCursors.entries()).map(([userId, { position, color }]) => (
                <RemoteCaret
                  key={userId}
                  editor={editor}
                  position={position}
                  color={color}
                  wrapperRef={editorWrapperRef}
                />
              ))}
            </div>
          </PaperShell>
        </ZoomablePaperShell>
      </div>
    </div>
  );
}
