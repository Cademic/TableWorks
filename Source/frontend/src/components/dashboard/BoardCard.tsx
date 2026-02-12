import { StickyNote, CreditCard, Trash2, ClipboardList, Calendar, PenTool } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { BoardSummaryDto } from "../../types";

interface BoardCardProps {
  board: BoardSummaryDto;
  onDelete: (id: string) => void;
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

export function BoardCard({ board, onDelete }: BoardCardProps) {
  const navigate = useNavigate();
  const config = BOARD_TYPE_CONFIG[board.boardType] ?? BOARD_TYPE_CONFIG.NoteBoard;
  const Icon = config.icon;

  return (
    <button
      type="button"
      onClick={() => navigate(`/boards/${board.id}`)}
      className="paper-card group relative flex flex-col rounded-lg p-5 pt-7 text-left transition-all duration-200 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-primary/20"
    >
      {/* Colored tape strip at top */}
      <div
        className={`absolute inset-x-0 top-0 h-1.5 rounded-t-lg ${config.tapeColor}`}
      />

      {/* Delete button */}
      <div
        className="absolute right-3 top-3 z-10 opacity-0 transition-opacity group-hover:opacity-100"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(board.id);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.stopPropagation();
            onDelete(board.id);
          }
        }}
        role="button"
        tabIndex={0}
        title="Delete board"
      >
        <Trash2 className="h-4 w-4 text-foreground/40 transition-colors hover:text-red-500" />
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
    </button>
  );
}
