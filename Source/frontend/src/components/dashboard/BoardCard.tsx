import { useEffect, useRef, useState } from "react";
import {
  StickyNote,
  CreditCard,
  ClipboardList,
  Calendar,
  PenTool,
  MoreVertical,
  Pencil,
  FolderOpen,
  Pin,
  PinOff,
  Trash2,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { BoardSummaryDto, ProjectSummaryDto } from "../../types";

interface BoardCardProps {
  board: BoardSummaryDto;
  onDelete: (id: string) => void;
  onRename: (id: string, currentName: string) => void;
  onMoveToProject: (boardId: string, projectId: string) => void;
  onTogglePin: (id: string, isPinned: boolean) => void;
  activeProjects: ProjectSummaryDto[];
}

const BOARD_TYPE_CONFIG: Record<
  string,
  { icon: typeof StickyNote; label: string; tapeColor: string; iconBg: string }
> = {
  NoteBoard: {
    icon: ClipboardList,
    label: "Note Board",
    tapeColor: "bg-amber-400/60 dark:bg-amber-500/40",
    iconBg: "bg-amber-100/80 dark:bg-amber-900/30",
  },
  ChalkBoard: {
    icon: PenTool,
    label: "Chalk Board",
    tapeColor: "bg-slate-400/60 dark:bg-slate-500/40",
    iconBg: "bg-slate-100/80 dark:bg-slate-900/30",
  },
  Calendar: {
    icon: Calendar,
    label: "Calendar",
    tapeColor: "bg-sky-400/60 dark:bg-sky-500/40",
    iconBg: "bg-sky-100/80 dark:bg-sky-900/30",
  },
};

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

function getBoardRoute(board: BoardSummaryDto): string {
  if (board.boardType === "ChalkBoard") return `/chalkboards/${board.id}`;
  return `/boards/${board.id}`;
}

export function BoardCard({ board, onDelete, onRename, onMoveToProject, onTogglePin, activeProjects }: BoardCardProps) {
  const navigate = useNavigate();
  const config = BOARD_TYPE_CONFIG[board.boardType] ?? BOARD_TYPE_CONFIG.NoteBoard;
  const Icon = config.icon;
  const projectName = board.projectId
    ? activeProjects.find((p) => p.id === board.projectId)?.name
    : null;
  const [menuOpen, setMenuOpen] = useState(false);
  const [showProjectList, setShowProjectList] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setShowProjectList(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => navigate(getBoardRoute(board))}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          navigate(getBoardRoute(board));
        }
      }}
      className={[
        "paper-card group relative flex cursor-pointer flex-col rounded-lg p-5 pt-7 text-left transition-all duration-200 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-primary/20",
        menuOpen ? "z-50 overflow-visible" : "",
      ].join(" ")}
    >
      {/* Colored tape strip at top */}
      <div
        className={`absolute inset-x-0 top-0 h-1.5 rounded-t-lg ${config.tapeColor}`}
      />

      {/* Pin indicator */}
      {board.isPinned && (
        <div className="absolute left-3 top-3 z-10">
          <Pin className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" />
        </div>
      )}

      {/* Project name (top right when board is in a project) */}
      {projectName && (
        <div
          className="absolute right-12 top-3 z-10 max-w-[9rem] truncate rounded bg-foreground/10 px-2 py-0.5 text-right text-[10px] font-medium text-foreground/60"
          title={projectName}
        >
          {projectName}
        </div>
      )}

      {/* Ellipsis menu button */}
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
            setShowProjectList(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.stopPropagation();
              setMenuOpen((v) => !v);
            }
          }}
          className="rounded-lg p-1 text-foreground/30 opacity-0 transition-all hover:bg-foreground/5 hover:text-foreground/60 group-hover:opacity-100"
          title="Board actions"
        >
          <MoreVertical className="h-4 w-4" />
        </div>

        {/* Dropdown menu */}
        {menuOpen && (
          <div className="absolute right-0 top-7 z-20 w-48 rounded-lg border border-border bg-background py-1 shadow-lg">
            {/* Rename */}
            <button
              type="button"
              className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs font-medium text-foreground/70 transition-colors hover:bg-foreground/5"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(false);
                onRename(board.id, board.name);
              }}
            >
              <Pencil className="h-3.5 w-3.5" />
              Rename
            </button>

            {/* Move to Project */}
            <div
              className="relative"
              onMouseEnter={() => setShowProjectList(true)}
              onMouseLeave={() => setShowProjectList(false)}
            >
              <button
                type="button"
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs font-medium text-foreground/70 transition-colors hover:bg-foreground/5"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowProjectList((v) => !v);
                }}
              >
                <FolderOpen className="h-3.5 w-3.5" />
                Move to Project
                <ChevronRight className="ml-auto h-3 w-3 text-foreground/30" />
              </button>

              {/* Project submenu — pl-1 creates visual gap inside the hover area so it doesn't close prematurely */}
              {showProjectList && (
                <div className="absolute left-full top-0 z-30 pl-1">
                <div className="w-44 rounded-lg border border-border bg-background py-1 shadow-lg">
                  {activeProjects.length === 0 ? (
                    <div className="px-3 py-2 text-xs text-foreground/40">
                      No active projects
                    </div>
                  ) : (
                    activeProjects.map((project) => (
                      <button
                        key={project.id}
                        type="button"
                        className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs font-medium transition-colors hover:bg-foreground/5 ${
                          board.projectId === project.id
                            ? "text-primary"
                            : "text-foreground/70"
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpen(false);
                          setShowProjectList(false);
                          onMoveToProject(board.id, project.id);
                        }}
                      >
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: project.color || "#8b5cf6" }}
                        />
                        <span className="truncate">{project.name}</span>
                        {board.projectId === project.id && (
                          <span className="ml-auto text-[10px] text-foreground/40">Current</span>
                        )}
                      </button>
                    ))
                  )}
                </div>
                </div>
              )}
            </div>

            {/* Pin / Unpin */}
            <button
              type="button"
              className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs font-medium text-foreground/70 transition-colors hover:bg-foreground/5"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(false);
                onTogglePin(board.id, !board.isPinned);
              }}
            >
              {board.isPinned ? (
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

            {/* Divider */}
            <div className="my-1 border-t border-border/50" />

            {/* Delete */}
            <button
              type="button"
              className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs font-medium text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-950/20"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(false);
                onDelete(board.id);
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Icon */}
      <div
        className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg ${config.iconBg}`}
      >
        <Icon className="h-5 w-5 text-foreground/60" />
      </div>

      {/* Name */}
      <h3 className="mb-1 truncate pr-6 text-sm font-semibold text-foreground">
        {board.name}
      </h3>

      {/* Description */}
      {board.description && (
        <p className="mb-3 line-clamp-2 text-xs text-foreground/50">
          {board.description}
        </p>
      )}

      {/* Footer — ruled-line separator */}
      <div className="mt-auto flex items-center gap-3 border-t border-blue-200/25 pt-3 text-xs text-foreground/40 dark:border-blue-300/10">
        <span className="flex items-center gap-1">
          <StickyNote className="h-3 w-3" />
          {board.noteCount}
        </span>
        <span className="flex items-center gap-1">
          <CreditCard className="h-3 w-3" />
          {board.indexCardCount}
        </span>
        <span className="ml-auto">{formatRelativeDate(board.updatedAt)}</span>
      </div>
    </div>
  );
}
