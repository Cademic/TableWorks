import { StickyNote, CreditCard, Trash2, ClipboardList, Calendar, PenTool } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { BoardSummaryDto } from "../../types";

interface BoardCardProps {
  board: BoardSummaryDto;
  onDelete: (id: string) => void;
}

const BOARD_TYPE_CONFIG: Record<string, { icon: typeof StickyNote; label: string; gradient: string }> = {
  NoteBoard: {
    icon: ClipboardList,
    label: "Note Board",
    gradient: "from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30",
  },
  ChalkBoard: {
    icon: PenTool,
    label: "Chalk Board",
    gradient: "from-slate-50 to-gray-100 dark:from-slate-950/30 dark:to-gray-950/30",
  },
  Calendar: {
    icon: Calendar,
    label: "Calendar",
    gradient: "from-blue-50 to-sky-50 dark:from-blue-950/30 dark:to-sky-950/30",
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
  const itemCount = board.noteCount + board.indexCardCount;

  return (
    <button
      type="button"
      onClick={() => navigate(`/boards/${board.id}`)}
      className={[
        "group relative flex flex-col rounded-xl border border-border bg-gradient-to-br p-5 text-left transition-all duration-200",
        "hover:shadow-lg hover:border-primary/30 hover:-translate-y-0.5",
        "focus:outline-none focus:ring-2 focus:ring-primary/20",
        config.gradient,
      ].join(" ")}
    >
      {/* Delete button */}
      <div
        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
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
        <Trash2 className="h-4 w-4 text-foreground/40 hover:text-red-500 transition-colors" />
      </div>

      {/* Icon */}
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-white/60 dark:bg-white/10 shadow-sm">
        <Icon className="h-5 w-5 text-foreground/70" />
      </div>

      {/* Name */}
      <h3 className="mb-1 text-sm font-semibold text-foreground truncate pr-6">
        {board.name}
      </h3>

      {/* Description */}
      {board.description && (
        <p className="mb-3 text-xs text-foreground/50 line-clamp-2">
          {board.description}
        </p>
      )}

      {/* Footer */}
      <div className="mt-auto flex items-center gap-3 pt-3 text-xs text-foreground/40">
        <span className="flex items-center gap-1">
          <StickyNote className="h-3 w-3" />
          {board.noteCount}
        </span>
        <span className="flex items-center gap-1">
          <CreditCard className="h-3 w-3" />
          {board.indexCardCount}
        </span>
        <span className="ml-auto">
          {formatRelativeDate(board.updatedAt)}
        </span>
      </div>
    </button>
  );
}
