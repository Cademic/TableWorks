import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus,
  ClipboardList,
  PenTool,
  Calendar,
  FolderOpen,
  BookOpen,
  StickyNote,
  CreditCard,
  Clock,
  PencilLine,
} from "lucide-react";
import { getBoards, createBoard, deleteBoard } from "../api/boards";
import { BoardCard } from "../components/dashboard/BoardCard";
import { ConfirmDialog } from "../components/dashboard/ConfirmDialog";
import { CreateBoardDialog } from "../components/dashboard/CreateBoardDialog";
import { useAuth } from "../context/AuthContext";
import type { BoardSummaryDto } from "../types";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function DashboardPage() {
  const { user } = useAuth();
  const [boards, setBoards] = useState<BoardSummaryDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<BoardSummaryDto | null>(null);

  const fetchBoards = useCallback(async () => {
    try {
      setError(null);
      const result = await getBoards({ limit: 100 });
      setBoards(result.items);
    } catch {
      setError("Failed to load boards.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBoards();
  }, [fetchBoards]);

  async function handleCreate(name: string, description: string, boardType: string) {
    try {
      const created = await createBoard({
        name,
        description: description || undefined,
        boardType,
      });
      setBoards((prev) => [created, ...prev]);
    } catch {
      // Silently fail
    }
  }

  function handleDelete(id: string) {
    const board = boards.find((b) => b.id === id) ?? null;
    if (board) setDeleteTarget(board);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    setDeleteTarget(null);
    setBoards((prev) => prev.filter((b) => b.id !== id));
    try {
      await deleteBoard(id);
    } catch {
      fetchBoards();
    }
  }

  const noteBoards = boards.filter((b) => b.boardType === "NoteBoard");
  const chalkBoards = boards.filter((b) => b.boardType === "ChalkBoard");
  const calendars = boards.filter((b) => b.boardType === "Calendar");

  const totalNotes = useMemo(
    () => boards.reduce((sum, b) => sum + b.noteCount, 0),
    [boards],
  );

  const totalCards = useMemo(
    () => boards.reduce((sum, b) => sum + b.indexCardCount, 0),
    [boards],
  );

  const mostRecentBoard = useMemo(() => {
    if (boards.length === 0) return null;
    return boards.reduce((latest, b) =>
      new Date(b.updatedAt) > new Date(latest.updatedAt) ? b : latest,
    );
  }, [boards]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <span className="text-sm text-foreground/60">Loading your workspace...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="mb-2 text-sm text-red-500">{error}</p>
          <button
            type="button"
            onClick={fetchBoards}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* ── Welcome Notepad ───────────────────────────── */}
        <div className="notepad-card mb-8">
          <div className="notepad-spiral-strip" />
          <div className="notepad-body relative px-8 py-6 sm:px-12">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  {getGreeting()}, {user?.username ?? "there"}
                </h1>
                <p className="notepad-ruled-line mt-2 max-w-md pb-1.5 text-sm text-foreground/50">
                  Your workspace is ready. What would you like to create today?
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(true)}
                className="flex flex-shrink-0 items-center gap-2 rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-amber-600 hover:shadow-md hover:-translate-y-0.5 dark:bg-amber-600 dark:hover:bg-amber-500"
              >
                <Plus className="h-4 w-4" />
                <span>New Board</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Quick Stats — Sticky Notes ─────────────────── */}
        <div className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatSticky
            color="yellow"
            icon={BookOpen}
            label="Boards"
            value={boards.length.toString()}
            rotation={-2}
          />
          <StatSticky
            color="rose"
            icon={StickyNote}
            label="Sticky Notes"
            value={totalNotes.toString()}
            rotation={1.5}
          />
          <StatSticky
            color="sky"
            icon={CreditCard}
            label="Index Cards"
            value={totalCards.toString()}
            rotation={-1}
          />
          <StatSticky
            color="green"
            icon={Clock}
            label="Last Activity"
            value={mostRecentBoard ? formatShortDate(mostRecentBoard.updatedAt) : "—"}
            rotation={2}
          />
        </div>

        {/* ── Note Boards ───────────────────────────────── */}
        <NotebookSection
          icon={ClipboardList}
          title="Note Boards"
          count={noteBoards.length}
          accentColor="amber"
        >
          {noteBoards.length === 0 ? (
            <BlankPageEmpty
              message="No note boards yet"
              actionLabel="Create your first board"
              onAction={() => setIsCreateOpen(true)}
            />
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {noteBoards.map((board) => (
                <BoardCard key={board.id} board={board} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </NotebookSection>

        {/* ── Projects ──────────────────────────────────── */}
        <NotebookSection
          icon={FolderOpen}
          title="Projects"
          count={0}
          accentColor="violet"
          badge="Coming Soon"
        >
          <ComingSoonCard
            description="Organize your work into projects with folders, tags, and collaboration."
            icon={FolderOpen}
          />
        </NotebookSection>

        {/* ── Chalk Boards ──────────────────────────────── */}
        <NotebookSection
          icon={PenTool}
          title="Chalk Boards"
          count={chalkBoards.length}
          accentColor="emerald"
          badge="Coming Soon"
        >
          <ComingSoonCard
            description="A freehand drawing canvas for sketches and brainstorming."
            icon={PenTool}
          />
        </NotebookSection>

        {/* ── Calendars ─────────────────────────────────── */}
        <NotebookSection
          icon={Calendar}
          title="Calendars"
          count={calendars.length}
          accentColor="sky"
          badge="Coming Soon"
        >
          <ComingSoonCard
            description="Plan your schedule with events, deadlines, and milestone tracking."
            icon={Calendar}
          />
        </NotebookSection>
      </div>

      <CreateBoardDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreate={handleCreate}
      />

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title="Delete Board"
        message={`Are you sure you want to delete "${deleteTarget?.name ?? "this board"}"? All notes and index cards inside will be permanently removed.`}
        confirmLabel="Delete"
        cancelLabel="Keep It"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

/* ─── Sub-components ───────────────────────────────────── */

/* -- Stat Sticky Note ----------------------------------------- */

const STICKY_BG: Record<string, string> = {
  yellow: "bg-amber-100 dark:bg-amber-950/40",
  rose: "bg-rose-100 dark:bg-rose-950/40",
  sky: "bg-sky-100 dark:bg-sky-950/40",
  green: "bg-emerald-100 dark:bg-emerald-950/40",
};

const STICKY_ACCENT: Record<string, string> = {
  yellow: "text-amber-600 dark:text-amber-400",
  rose: "text-rose-600 dark:text-rose-400",
  sky: "text-sky-600 dark:text-sky-400",
  green: "text-emerald-600 dark:text-emerald-400",
};

interface StatStickyProps {
  color: "yellow" | "rose" | "sky" | "green";
  icon: typeof BookOpen;
  label: string;
  value: string;
  rotation: number;
}

function StatSticky({ color, icon: Icon, label, value, rotation }: StatStickyProps) {
  return (
    <div
      className={`stat-sticky flex flex-col items-center justify-center px-4 py-5 ${STICKY_BG[color]}`}
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      <Icon className={`mb-1.5 h-4 w-4 ${STICKY_ACCENT[color]}`} />
      <span className={`text-2xl font-bold leading-none ${STICKY_ACCENT[color]}`}>
        {value}
      </span>
      <span className="mt-1 text-[11px] font-medium text-foreground/45">{label}</span>
    </div>
  );
}

/* -- Notebook Section ----------------------------------------- */

const SECTION_ACCENT: Record<string, string> = {
  amber: "border-l-amber-400 dark:border-l-amber-500",
  violet: "border-l-violet-400 dark:border-l-violet-500",
  emerald: "border-l-emerald-400 dark:border-l-emerald-500",
  sky: "border-l-sky-400 dark:border-l-sky-500",
};

interface NotebookSectionProps {
  icon: typeof ClipboardList;
  title: string;
  count: number;
  accentColor: string;
  badge?: string;
  children: React.ReactNode;
}

function NotebookSection({
  icon: Icon,
  title,
  count,
  accentColor,
  badge,
  children,
}: NotebookSectionProps) {
  return (
    <section className="mb-10">
      <div
        className={`mb-4 flex items-center gap-2.5 border-l-[3px] pl-3 ${
          SECTION_ACCENT[accentColor] ?? ""
        }`}
      >
        <Icon className="h-5 w-5 text-foreground/50" />
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        <span className="rounded-full bg-foreground/5 px-2 py-0.5 text-xs font-medium text-foreground/40">
          {count}
        </span>
        {badge && (
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
            {badge}
          </span>
        )}
      </div>
      {children}
    </section>
  );
}

/* -- Blank Page Empty State ----------------------------------- */

interface BlankPageEmptyProps {
  message: string;
  actionLabel: string;
  onAction: () => void;
}

function BlankPageEmpty({ message, actionLabel, onAction }: BlankPageEmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/50 bg-background/40 py-14">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-foreground/5">
        <PencilLine className="h-5 w-5 text-foreground/30" />
      </div>
      <p className="mb-4 text-sm text-foreground/40">{message}</p>
      <button
        type="button"
        onClick={onAction}
        className="flex items-center gap-1.5 rounded-lg border border-border/80 bg-background px-4 py-2 text-xs font-medium text-foreground/60 transition-all hover:border-primary/40 hover:text-primary hover:shadow-sm"
      >
        <Plus className="h-3.5 w-3.5" />
        {actionLabel}
      </button>
    </div>
  );
}

/* -- Coming Soon Card ----------------------------------------- */

interface ComingSoonCardProps {
  description: string;
  icon: typeof FolderOpen;
}

function ComingSoonCard({ description, icon: Icon }: ComingSoonCardProps) {
  return (
    <div className="coming-soon-card flex items-center gap-4 rounded-xl border border-dashed border-border/40 px-6 py-8">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-foreground/[0.03]">
        <Icon className="h-5 w-5 text-foreground/20" />
      </div>
      <p className="text-sm text-foreground/30">{description}</p>
    </div>
  );
}
