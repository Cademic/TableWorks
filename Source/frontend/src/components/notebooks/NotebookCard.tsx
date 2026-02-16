import { useEffect, useRef, useState } from "react";
import { BookOpen, FolderMinus, MoreVertical, Pencil, Pin, PinOff, Trash2 } from "lucide-react";
import type { NotebookSummaryDto } from "../../types";

interface NotebookCardProps {
  notebook: NotebookSummaryDto;
  onOpen: (id: string) => void;
  onRename?: (id: string, currentName: string) => void;
  onTogglePin?: (id: string, isPinned: boolean) => void;
  onDelete?: (id: string) => void;
  /** When in project context: removes notebook from project instead of deleting */
  onRemoveFromProject?: (id: string) => void;
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

export function NotebookCard({ notebook, onOpen, onRename, onTogglePin, onDelete, onRemoveFromProject }: NotebookCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  const showMenu = Boolean(onRename ?? onTogglePin ?? onDelete ?? onRemoveFromProject);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(notebook.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(notebook.id);
        }
      }}
      className={[
        "paper-card group relative flex cursor-pointer flex-col rounded-lg p-5 pt-7 text-left transition-all duration-200 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-primary/20",
        menuOpen ? "z-50 overflow-visible" : "",
      ].join(" ")}
    >
      {/* Tape strip — reddish-brown / notebook cover */}
      <div className="absolute inset-x-0 top-0 h-1.5 rounded-t-lg bg-amber-800/70 dark:bg-amber-900/60" />

      {notebook.isPinned && (
        <div className="absolute left-3 top-3 z-10">
          <Pin className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" />
        </div>
      )}

      {/* Ellipsis menu */}
      <div
        ref={menuRef}
        className="absolute right-3 top-3 z-10"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <div
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((v) => !v);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.stopPropagation();
              setMenuOpen((v) => !v);
            }
          }}
          className="rounded-lg p-1 text-foreground/30 opacity-0 transition-all hover:bg-foreground/5 hover:text-foreground/60 group-hover:opacity-100"
          title="Notebook actions"
        >
          <MoreVertical className="h-4 w-4" />
        </div>

        {menuOpen && showMenu && (
          <div className="absolute right-0 top-7 z-20 w-48 rounded-lg border border-border bg-background py-1 shadow-lg">
            {onRename && (
              <button
                type="button"
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs font-medium text-foreground/70 transition-colors hover:bg-foreground/5"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  onRename(notebook.id, notebook.name);
                }}
              >
                <Pencil className="h-3.5 w-3.5" />
                Rename
              </button>
            )}
            {onTogglePin && (
              <button
                type="button"
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs font-medium text-foreground/70 transition-colors hover:bg-foreground/5"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  onTogglePin(notebook.id, !notebook.isPinned);
                }}
              >
                {notebook.isPinned ? (
                  <>
                    <PinOff className="h-3.5 w-3.5" />
                    Unpin from Sidebar
                  </>
                ) : (
                  <>
                    <Pin className="h-3.5 w-3.5" />
                    Pin to Sidebar
                  </>
                )}
              </button>
            )}
            {onRemoveFromProject && (
              <>
                {showMenu && <div className="my-1 border-t border-border/50" />}
                <button
                  type="button"
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs font-medium text-foreground/70 transition-colors hover:bg-foreground/5"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                    onRemoveFromProject(notebook.id);
                  }}
                >
                  <FolderMinus className="h-3.5 w-3.5" />
                  Remove from Project
                </button>
              </>
            )}
            {onDelete && !onRemoveFromProject && (
              <>
                {showMenu && <div className="my-1 border-t border-border/50" />}
                <button
                  type="button"
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs font-medium text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-950/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                    onDelete(notebook.id);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100/80 dark:bg-amber-900/30">
        <BookOpen className="h-5 w-5 text-foreground/60" />
      </div>

      <h3 className="mb-1 truncate pr-6 text-sm font-semibold text-foreground">
        {notebook.name}
      </h3>

      <div className="mt-auto flex items-center gap-3 border-t border-blue-200/25 pt-3 text-xs text-foreground/40 dark:border-blue-300/10">
        <span className="flex items-center gap-1">
          <BookOpen className="h-3 w-3" />
          {notebook.pageCount} {notebook.pageCount === 1 ? "page" : "pages"}
        </span>
        <span className="ml-auto">{formatRelativeDate(notebook.updatedAt)}</span>
      </div>
    </div>
  );
}
