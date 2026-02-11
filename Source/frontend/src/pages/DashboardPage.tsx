import { useCallback, useEffect, useState } from "react";
import { Plus, ClipboardList, PenTool, Calendar, FolderOpen } from "lucide-react";
import { getBoards, createBoard, deleteBoard } from "../api/boards";
import { BoardCard } from "../components/dashboard/BoardCard";
import { CreateBoardDialog } from "../components/dashboard/CreateBoardDialog";
import type { BoardSummaryDto } from "../types";

export function DashboardPage() {
  const [boards, setBoards] = useState<BoardSummaryDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

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
      const created = await createBoard({ name, description: description || undefined, boardType });
      setBoards((prev) => [created, ...prev]);
    } catch {
      // Silently fail
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this board and all its items? This cannot be undone.")) return;
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

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <span className="text-sm text-foreground/60">Loading dashboard...</span>
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
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="mt-1 text-sm text-foreground/50">
              Manage your boards, projects, and more
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>New Board</span>
          </button>
        </div>

        {/* Note Boards */}
        <Section
          icon={ClipboardList}
          title="Note Boards"
          count={noteBoards.length}
        >
          {noteBoards.length === 0 ? (
            <EmptyState
              message="No note boards yet"
              actionLabel="Create your first board"
              onAction={() => setIsCreateOpen(true)}
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {noteBoards.map((board) => (
                <BoardCard key={board.id} board={board} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </Section>

        {/* Projects (placeholder) */}
        <Section
          icon={FolderOpen}
          title="Projects"
          count={0}
          badge="Coming Soon"
        >
          <PlaceholderCard description="Create and manage collaborative projects with your team." />
        </Section>

        {/* Chalk Boards (placeholder) */}
        <Section
          icon={PenTool}
          title="Chalk Boards"
          count={chalkBoards.length}
          badge="Coming Soon"
        >
          <PlaceholderCard description="Freehand drawing canvas for sketches and brainstorming." />
        </Section>

        {/* Calendars (placeholder) */}
        <Section
          icon={Calendar}
          title="Calendars"
          count={calendars.length}
          badge="Coming Soon"
        >
          <PlaceholderCard description="Schedule events, deadlines, and milestones." />
        </Section>
      </div>

      <CreateBoardDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreate={handleCreate}
      />
    </div>
  );
}

// --- Sub-components ---

interface SectionProps {
  icon: typeof ClipboardList;
  title: string;
  count: number;
  badge?: string;
  children: React.ReactNode;
}

function Section({ icon: Icon, title, count, badge, children }: SectionProps) {
  return (
    <section className="mb-10">
      <div className="mb-4 flex items-center gap-2">
        <Icon className="h-5 w-5 text-foreground/50" />
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        <span className="rounded-full bg-foreground/5 px-2 py-0.5 text-xs font-medium text-foreground/40">
          {count}
        </span>
        {badge && (
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            {badge}
          </span>
        )}
      </div>
      {children}
    </section>
  );
}

interface EmptyStateProps {
  message: string;
  actionLabel: string;
  onAction: () => void;
}

function EmptyState({ message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-background/50 py-12">
      <p className="mb-3 text-sm text-foreground/40">{message}</p>
      <button
        type="button"
        onClick={onAction}
        className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground/60 hover:bg-background hover:text-foreground transition-colors"
      >
        <Plus className="h-3.5 w-3.5" />
        {actionLabel}
      </button>
    </div>
  );
}

interface PlaceholderCardProps {
  description: string;
}

function PlaceholderCard({ description }: PlaceholderCardProps) {
  return (
    <div className="rounded-xl border border-dashed border-border/60 bg-background/30 p-6 text-center">
      <p className="text-sm text-foreground/30">{description}</p>
    </div>
  );
}
