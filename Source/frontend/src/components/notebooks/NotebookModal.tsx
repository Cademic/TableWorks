import { useCallback, useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import FontFamily from "@tiptap/extension-font-family";
import CharacterCount from "@tiptap/extension-character-count";
import TextAlign from "@tiptap/extension-text-align";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { TaskList } from "@tiptap/extension-task-list";
import { TaskItem } from "@tiptap/extension-task-item";
import { X } from "lucide-react";
import { getNotebookById, updateNotebookPages } from "../../api/notebooks";
import type { NotebookDetailDto } from "../../types";
import { FontSize } from "../../lib/tiptap-font-size";
import { IndexCardToolbar } from "../dashboard/IndexCardToolbar";

const SAVE_DEBOUNCE_MS = 800;
const MAX_PAGES = 999;
const MAX_PAGE_CONTENT_LENGTH = 50000;
/** Extra space (px) from viewport edge — switch to single page when spread would get this close */
const NOTEBOOK_VIEWPORT_MARGIN = 80;
/** Space reserved above/below single-page notebook (close button, footer, padding) */
const SINGLE_PAGE_VERTICAL_RESERVE = 120;
const NOTEBOOK_SPREAD_WIDTH = 2200;
const NOTEBOOK_SINGLE_WIDTH = 1100;
const NOTEBOOK_HEIGHT = 1200; // same height for spread and single so page size is consistent

/** Turn plain text or HTML into safe HTML for TipTap */
function toEditorHtml(raw: string): string {
  const s = (raw ?? "").trim();
  if (s === "") return "<p></p>";
  if (s.startsWith("<")) return s;
  return `<p>${s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")}</p>`;
}

const sharedExtensions = [
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
];

interface NotebookModalProps {
  notebookId: string;
  onClose: () => void;
}

function useIsSinglePage(): boolean {
  const [isSingle, setIsSingle] = useState(false);
  useEffect(() => {
    const check = () => {
      const widthNeeded = NOTEBOOK_SPREAD_WIDTH + NOTEBOOK_VIEWPORT_MARGIN;
      setIsSingle(window.innerWidth < widthNeeded);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isSingle;
}

/** Scale factor for single-page notebook so it stays fully visible (1 = full size, <1 = shrink). */
function useSinglePageScale(): number {
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const check = () => {
      const margin = NOTEBOOK_VIEWPORT_MARGIN;
      const reserve = SINGLE_PAGE_VERTICAL_RESERVE;
      const availableW = window.innerWidth - 2 * margin;
      const availableH = window.innerHeight - reserve - 2 * margin;
      const scaleW = availableW / NOTEBOOK_SINGLE_WIDTH;
      const scaleH = availableH / NOTEBOOK_HEIGHT;
      const newScale = Math.max(0.3, Math.min(1, scaleW, scaleH));
      setScale(newScale);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return scale;
}

export function NotebookModal({ notebookId, onClose }: NotebookModalProps) {
  const [notebook, setNotebook] = useState<NotebookDetailDto | null>(null);
  const [pages, setPages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentSpreadIndex, setCurrentSpreadIndex] = useState(0);
  const [singlePageIndex, setSinglePageIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [activePage, setActivePage] = useState<"left" | "right">("left");
  const isSinglePage = useIsSinglePage();
  const singlePageScale = useSinglePageScale();
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevSpreadRef = useRef(-1);
  const prevSinglePageRef = useRef(-1);
  const leftEditorPageIndexRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    getNotebookById(notebookId)
      .then((data) => {
        if (!cancelled) {
          setNotebook(data);
          setPages([...(data.pages || [])]);
          // Force sync effects to run so editors get loaded content (reset refs so content is applied).
          prevSpreadRef.current = -1;
          prevSinglePageRef.current = -1;
        }
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load notebook.");
      });
    return () => { cancelled = true; };
  }, [notebookId]);

  const scheduleSave = useCallback((nextPages: string[]) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveTimeoutRef.current = null;
      setSaving(true);
      // #region agent log
      const payload = nextPages.slice(0, MAX_PAGES);
      fetch("http://127.0.0.1:7243/ingest/6eecc1c5-be9e-4248-a3b7-8e1107567fb0", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: "NotebookModal.tsx:scheduleSave",
          message: "save debounce fired, calling updateNotebookPages",
          data: { notebookId, pagesLength: payload.length, firstPageLen: payload[0]?.length ?? 0 },
          timestamp: Date.now(),
          hypothesisId: "H1",
        }),
      }).catch(() => {});
      // #endregion
      updateNotebookPages(notebookId, { pages: payload })
        .then(() => setSaving(false))
        .catch(() => setSaving(false));
    }, SAVE_DEBOUNCE_MS);
  }, [notebookId]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [handleClose]);

  // Derived values (safe when pages is empty) — must be before any effects/hooks that use them
  const pageCount = Math.max(pages.length, 1);
  const totalSpreads = Math.max(1, Math.ceil(pageCount / 2));
  const spreadIndex = Math.min(currentSpreadIndex, totalSpreads - 1);
  const leftPageIndex = spreadIndex * 2;
  const rightPageIndex = spreadIndex * 2 + 1;

  // When switching to single-page mode, show the same page (left of current spread) and ensure toolbar targets the only visible editor
  useEffect(() => {
    if (isSinglePage) {
      setSinglePageIndex(leftPageIndex);
      setActivePage("left");
      prevSpreadRef.current = -1;
      prevSinglePageRef.current = -1;
    }
  }, [isSinglePage, leftPageIndex]);
  // When switching to spread mode, open the spread that contains the current single page
  useEffect(() => {
    if (!isSinglePage) {
      setCurrentSpreadIndex(Math.floor(singlePageIndex / 2));
      prevSinglePageRef.current = -1;
    }
  }, [isSinglePage, singlePageIndex]);

  leftEditorPageIndexRef.current = isSinglePage ? singlePageIndex : leftPageIndex;

  const leftEditor = useEditor({
    extensions: [
      ...sharedExtensions,
      CharacterCount.configure({ limit: MAX_PAGE_CONTENT_LENGTH }),
    ],
    content: toEditorHtml(pages[leftEditorPageIndexRef.current] ?? ""),
    editable: true,
    editorProps: {
      attributes: {
        class:
          "notebook-ruled prose-none w-full min-h-0 flex-1 resize-none border-0 bg-transparent p-0 text-foreground/90 focus:outline-none focus:ring-0 break-words text-sm leading-[28px]",
      },
    },
    onFocus: () => setActivePage("left"),
    onUpdate: ({ editor }) => {
      const index = leftEditorPageIndexRef.current;
      let html: string;
      try {
        html = editor.getHTML();
      } catch {
        return; /* e.g. "Node cannot be found" when DOM not in document */
      }
      const next = [...pages];
      while (next.length <= index) next.push("");
      next[index] = html;
      setPages(next);
      scheduleSave(next);
    },
  });

  const rightEditor = useEditor({
    extensions: [
      ...sharedExtensions,
      CharacterCount.configure({ limit: MAX_PAGE_CONTENT_LENGTH }),
    ],
    content: toEditorHtml(pages[rightPageIndex] ?? ""),
    editable: true,
    editorProps: {
      attributes: {
        class:
          "notebook-ruled prose-none w-full min-h-0 flex-1 resize-none border-0 bg-transparent p-0 text-foreground/90 focus:outline-none focus:ring-0 break-words text-sm leading-[28px]",
      },
    },
    onFocus: () => setActivePage("right"),
    onUpdate: ({ editor }) => {
      let html: string;
      try {
        html = editor.getHTML();
      } catch {
        return; /* e.g. "Node cannot be found" when DOM not in document */
      }
      const next = [...pages];
      while (next.length <= rightPageIndex) next.push("");
      next[rightPageIndex] = html;
      setPages(next);
      scheduleSave(next);
    },
  });

  /* In single-page mode only left editor is mounted; toolbar must use it to avoid "Node cannot be found" */
  const activeEditor = isSinglePage
    ? leftEditor
    : (activePage === "left" ? leftEditor : rightEditor) ?? leftEditor ?? rightEditor;

  // Sync spread: when turning page or when notebook first loads (spread mode only)
  useEffect(() => {
    if (isSinglePage || !leftEditor || !rightEditor) return;
    if (prevSpreadRef.current === spreadIndex && prevSpreadRef.current !== -1) return;
    leftEditor.commands.setContent(toEditorHtml(pages[leftPageIndex] ?? ""), { emitUpdate: false });
    rightEditor.commands.setContent(toEditorHtml(pages[rightPageIndex] ?? ""), { emitUpdate: false });
    prevSpreadRef.current = spreadIndex;
  }, [isSinglePage, spreadIndex, leftPageIndex, rightPageIndex, pages, leftEditor, rightEditor]);

  // Sync single page: when singlePageIndex changes or when switching to single mode or when pages load
  useEffect(() => {
    if (!isSinglePage || !leftEditor) return;
    if (prevSinglePageRef.current === singlePageIndex && prevSinglePageRef.current !== -1) return;
    leftEditor.commands.setContent(toEditorHtml(pages[singlePageIndex] ?? ""), { emitUpdate: false });
    prevSinglePageRef.current = singlePageIndex;
  }, [isSinglePage, singlePageIndex, pages, leftEditor]);

  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="rounded-xl border border-border bg-background p-6 shadow-xl max-w-sm w-full text-center">
          <p className="text-sm text-red-500 mb-4">{error}</p>
          <button type="button" onClick={handleClose} className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90">
            Close
          </button>
        </div>
      </div>
    );
  }

  if (!notebook) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <span className="text-sm text-foreground/60">Loading notebook...</span>
        </div>
      </div>
    );
  }

  const goPrev = () => setCurrentSpreadIndex((i) => Math.max(0, i - 1));
  const goNext = () => {
    if (spreadIndex >= totalSpreads - 1 && pages.length < MAX_PAGES) {
      const toAdd = Math.min(2, MAX_PAGES - pages.length);
      const nextPages = [...pages, ...Array(toAdd).fill("")];
      setPages(nextPages);
      scheduleSave(nextPages);
      setCurrentSpreadIndex(Math.ceil(nextPages.length / 2) - 1);
    } else {
      setCurrentSpreadIndex((i) => Math.min(totalSpreads - 1, i + 1));
    }
  };

  const goPrevSingle = () => setSinglePageIndex((i) => Math.max(0, i - 1));
  const goNextSingle = () => {
    if (singlePageIndex >= pageCount - 1 && pages.length < MAX_PAGES) {
      const nextPages = [...pages, ""];
      setPages(nextPages);
      scheduleSave(nextPages);
      setSinglePageIndex(nextPages.length - 1);
    } else {
      setSinglePageIndex((i) => Math.min(pageCount - 1, i + 1));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4" role="dialog" aria-modal="true" aria-label="Notebook">
      <div className="absolute inset-0" onClick={handleClose} aria-hidden="true" />
      <div className="relative flex max-h-[90vh] max-w-[95vw] flex-col items-center">
        <button
          type="button"
          onClick={handleClose}
          className="absolute -top-10 right-0 z-10 rounded-lg p-2 text-foreground/70 hover:bg-white/10 hover:text-white"
          aria-label="Close notebook"
        >
          <X className="h-5 w-5" />
        </button>
        {/* Single-page layout: shrinks when close to viewport edge so full page stays visible */}
        {isSinglePage && (
          <div
            className="notebook-cover relative flex flex-shrink-0 flex-col rounded-xl overflow-hidden shadow-2xl border-[10px] border-[#8B4513] bg-[#8B4513] transition-[width,height] duration-300 ease-out"
            style={{
              width: NOTEBOOK_SINGLE_WIDTH * singlePageScale,
              height: NOTEBOOK_HEIGHT * singlePageScale,
            }}
          >
            <div className="h-px w-full flex-shrink-0 bg-black/10" />
            <div className="flex-shrink-0 bg-[#f5f5f0]">
              <IndexCardToolbar
                editor={activeEditor}
                cardColor="white"
                onCardColorChange={() => {}}
                cardRotation={0}
                onCardRotationChange={() => {}}
                hideCardColor
                hideTilt
              />
            </div>
            <div className="flex min-h-0 flex-1 flex-col bg-[#f5f5f0] p-4 sm:p-6">
              <div
                className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden"
                style={{
                  backgroundImage: "repeating-linear-gradient(transparent 0px, transparent 27px, rgba(0,0,0,0.08) 27px, rgba(0,0,0,0.08) 28px)",
                  backgroundPosition: "0 -4px",
                }}
              >
                <EditorContent editor={leftEditor} />
              </div>
              <div className="flex flex-shrink-0 items-center justify-between gap-2 pt-2">
                <button type="button" onClick={goPrevSingle} disabled={singlePageIndex === 0} className="rounded p-1.5 text-foreground/50 hover:bg-foreground/10 hover:text-foreground disabled:opacity-30 disabled:pointer-events-none" aria-label="Previous page">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                </button>
                <span className="text-xs text-foreground/50 shrink-0">
                  Page {singlePageIndex + 1} of {pageCount}{saving ? " · Saving..." : ""}
                </span>
                <button type="button" onClick={goNextSingle} disabled={singlePageIndex >= pageCount - 1 && pages.length >= MAX_PAGES} className="rounded p-1.5 text-foreground/50 hover:bg-foreground/10 hover:text-foreground disabled:opacity-30 disabled:pointer-events-none" aria-label="Next page">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Two-page spread layout (larger screens): fixed size */}
        {!isSinglePage && (
          <div
            className="notebook-cover relative flex flex-shrink-0 flex-col rounded-xl overflow-hidden shadow-2xl border-[10px] border-[#8B4513] bg-[#8B4513]"
            style={{ width: NOTEBOOK_SPREAD_WIDTH, height: NOTEBOOK_HEIGHT }}
          >
            <div className="notebook-spine absolute left-1/2 top-0 bottom-0 z-10 w-6 -translate-x-1/2 bg-[#8B4513] shadow-inner sm:w-8" />
            <div className="h-px w-full flex-shrink-0 bg-black/10" />
            <div className="relative z-0 flex flex-shrink-0 flex-row bg-[#f5f5f0]">
              <div className="min-w-0 flex-1 overflow-x-auto">
                <IndexCardToolbar
                  editor={activeEditor}
                  cardColor="white"
                  onCardColorChange={() => {}}
                  cardRotation={0}
                  onCardRotationChange={() => {}}
                  hideCardColor
                  hideTilt
                />
              </div>
              <div className="w-6 flex-shrink-0 sm:w-8" aria-hidden="true" />
              <div className="min-w-0 flex-1" aria-hidden="true" />
            </div>
            <div className="relative z-0 flex min-h-0 flex-1 flex-row">
              <div className="notebook-page-left flex min-w-0 flex-1 flex-col bg-[#f5f5f0] p-4 sm:p-6">
                <div
                  className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden"
                  style={{
                    backgroundImage: "repeating-linear-gradient(transparent 0px, transparent 27px, rgba(0,0,0,0.08) 27px, rgba(0,0,0,0.08) 28px)",
                    backgroundPosition: "0 -4px",
                  }}
                >
                  <EditorContent editor={leftEditor} />
                </div>
                <div className="flex flex-shrink-0 items-center gap-2 pt-2">
                  <button type="button" onClick={goPrev} disabled={spreadIndex === 0} className="rounded p-1.5 text-foreground/50 hover:bg-foreground/10 hover:text-foreground disabled:opacity-30 disabled:pointer-events-none" aria-label="Previous page">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                  </button>
                  <span className="text-xs text-foreground/50">Page {leftPageIndex + 1}</span>
                </div>
              </div>
              <div className="w-6 flex-shrink-0 sm:w-8" aria-hidden="true" />
              <div className="notebook-page-right flex min-w-0 flex-1 flex-col bg-[#f5f5f0] p-4 sm:p-6">
                <div
                  className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden"
                  style={{
                    backgroundImage: "repeating-linear-gradient(transparent 0px, transparent 27px, rgba(0,0,0,0.08) 27px, rgba(0,0,0,0.08) 28px)",
                    backgroundPosition: "0 -4px",
                  }}
                >
                  <EditorContent editor={rightEditor} />
                </div>
                <div className="flex flex-shrink-0 items-center justify-end gap-2 pt-2">
                  <span className="text-xs text-foreground/50">Page {rightPageIndex + 1}</span>
                  <button type="button" onClick={goNext} disabled={spreadIndex >= totalSpreads - 1 && pages.length >= MAX_PAGES} className="rounded p-1.5 text-foreground/50 hover:bg-foreground/10 hover:text-foreground disabled:opacity-30 disabled:pointer-events-none" aria-label="Next page">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
