import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ClipboardList,
  Users,
  Settings,
  Plus,
  Trash2,
  Calendar,
  Crown,
  Eye,
  Pencil,
  PenTool,
  FolderOpen,
  CalendarClock,
} from "lucide-react";
import {
  getProjectById,
  updateProject,
  deleteProject,
  addBoardToProject,
  removeBoardFromProject,
} from "../api/projects";
import axios from "axios";
import { createBoard } from "../api/boards";
import { BoardCard } from "../components/dashboard/BoardCard";
import { CreateBoardDialog } from "../components/dashboard/CreateBoardDialog";
import { ConfirmDialog } from "../components/dashboard/ConfirmDialog";
import { MemberList } from "../components/projects/MemberList";
import { AddMemberDialog } from "../components/projects/AddMemberDialog";
import { AddExistingBoardDialog } from "../components/projects/AddExistingBoardDialog";
import type { ProjectDetailDto, BoardSummaryDto } from "../types";

type TabId = "calendar" | "boards" | "members" | "settings";

const TABS: { id: TabId; label: string; icon: typeof ClipboardList }[] = [
  { id: "calendar", label: "Calendar", icon: Calendar },
  { id: "boards", label: "Boards", icon: ClipboardList },
  { id: "members", label: "Members", icon: Users },
  { id: "settings", label: "Settings", icon: Settings },
];

const STATUS_OPTIONS = ["Active", "Completed", "Archived"];

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function toInputDate(dateStr: string | null): string {
  if (!dateStr) return "";
  return new Date(dateStr).toISOString().split("T")[0];
}

export function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<ProjectDetailDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("calendar");
  const [isCreateBoardOpen, setIsCreateBoardOpen] = useState(false);
  const [createBoardError, setCreateBoardError] = useState<string | null>(null);
  const [isAddExistingBoardOpen, setIsAddExistingBoardOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [removeBoardTarget, setRemoveBoardTarget] = useState<BoardSummaryDto | null>(null);

  // Settings form state
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState("Active");
  const [editProgress, setEditProgress] = useState(0);
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [editDeadline, setEditDeadline] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const isOwner = project?.userRole === "Owner";
  const isEditor = project?.userRole === "Editor";
  const canEdit = isOwner || isEditor;

  const fetchProject = useCallback(async () => {
    if (!projectId) return;
    try {
      setError(null);
      const data = await getProjectById(projectId);
      setProject(data);
      // Populate settings form
      setEditName(data.name);
      setEditDescription(data.description ?? "");
      setEditStatus(data.status);
      setEditProgress(data.progress);
      setEditStartDate(toInputDate(data.startDate));
      setEditEndDate(toInputDate(data.endDate));
      setEditDeadline(data.deadline ? toInputDate(data.deadline) : "");
    } catch {
      setError("Failed to load project.");
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  async function handleCreateBoard(
    name: string,
    description: string,
    boardType: string,
  ) {
    if (!projectId) return;
    try {
      setCreateBoardError(null);
      const created = await createBoard({
        name,
        description: description || undefined,
        boardType,
        projectId,
      });
      setProject((prev) =>
        prev ? { ...prev, boards: [...prev.boards, created] } : prev,
      );
      setIsCreateBoardOpen(false);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        setCreateBoardError(err.response.data?.message ?? "A board with that name already exists.");
      } else {
        setCreateBoardError("Failed to create board. Please try again.");
        console.error("Failed to create board:", err);
      }
    }
  }

  async function handleAddExistingBoard(boardId: string) {
    if (!projectId) return;
    try {
      await addBoardToProject(projectId, boardId);
      await fetchProject();
      setIsAddExistingBoardOpen(false);
    } catch (err) {
      console.error("Failed to add board to project:", err);
    }
  }

  function handleRemoveBoard(boardId: string) {
    const board = project?.boards.find((b) => b.id === boardId) ?? null;
    if (board) setRemoveBoardTarget(board);
  }

  async function confirmRemoveBoard() {
    if (!removeBoardTarget || !projectId) return;
    const boardId = removeBoardTarget.id;
    setRemoveBoardTarget(null);
    setProject((prev) =>
      prev
        ? { ...prev, boards: prev.boards.filter((b) => b.id !== boardId) }
        : prev,
    );
    try {
      await removeBoardFromProject(projectId, boardId);
    } catch {
      fetchProject();
    }
  }

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    if (!projectId || !isOwner) return;
    setIsSaving(true);
    try {
      await updateProject(projectId, {
        name: editName,
        description: editDescription || undefined,
        startDate: editStartDate || undefined,
        endDate: editEndDate || undefined,
        deadline: editDeadline || undefined,
        status: editStatus,
        progress: editProgress,
      });
      await fetchProject();
    } catch {
      // Silently fail
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteProject() {
    if (!projectId) return;
    setDeleteConfirmOpen(false);
    try {
      await deleteProject(projectId);
      navigate("/projects");
    } catch {
      // Silently fail
    }
  }

  function handleMemberAdded() {
    fetchProject();
    setIsAddMemberOpen(false);
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <span className="text-sm text-foreground/60">Loading project...</span>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="mb-2 text-sm text-red-500">
            {error ?? "Project not found."}
          </p>
          <button
            type="button"
            onClick={() => navigate("/projects")}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  const RoleIcon = isOwner ? Crown : isEditor ? Pencil : Eye;
  const roleLabel = project.userRole;

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Back nav */}
        <button
          type="button"
          onClick={() => navigate("/projects")}
          className="mb-4 flex items-center gap-1.5 text-sm text-foreground/50 transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Projects
        </button>

        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/30">
              <FolderOpen className="h-6 w-6 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                {project.name}
              </h1>
              {project.description && (
                <p className="mt-0.5 text-sm text-foreground/50">
                  {project.description}
                </p>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {/* Status badge */}
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                    project.status === "Active"
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                      : project.status === "Completed"
                        ? "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400"
                        : "bg-gray-100 text-gray-600 dark:bg-gray-800/40 dark:text-gray-400"
                  }`}
                >
                  {project.status}
                </span>
                {/* Role badge */}
                <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-foreground/40">
                  <RoleIcon className="h-3 w-3" />
                  {roleLabel}
                </span>
                {/* Owner */}
                <span className="flex items-center gap-1 text-[10px] text-foreground/40">
                  <Crown className="h-3 w-3 text-amber-500/60" />
                  {project.ownerUsername}
                </span>
                {/* Dates */}
                <span className="flex items-center gap-1 text-[10px] text-foreground/40">
                  <Calendar className="h-3 w-3" />
                  {project.startDate && project.endDate
                    ? `${formatDate(project.startDate)} \u2014 ${formatDate(project.endDate)}`
                    : "Indefinite"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        {project.progress > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between text-xs text-foreground/50">
              <span>Progress</span>
              <span>{project.progress}%</span>
            </div>
            <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-foreground/5">
              <div
                className="h-full rounded-full bg-violet-500 transition-all dark:bg-violet-400"
                style={{ width: `${Math.min(project.progress, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 flex gap-1 border-b border-border/40">
          {TABS.map((tab) => {
            // Hide settings tab for non-owners
            if (tab.id === "settings" && !isOwner) return null;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={[
                  "flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition-all",
                  isActive
                    ? "border-violet-500 text-violet-600 dark:text-violet-400"
                    : "border-transparent text-foreground/50 hover:text-foreground",
                ].join(" ")}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
                {tab.id === "boards" && (
                  <span className="ml-1 rounded-full bg-foreground/5 px-1.5 py-0.5 text-[10px]">
                    {project.boards.length}
                  </span>
                )}
                {tab.id === "members" && (
                  <span className="ml-1 rounded-full bg-foreground/5 px-1.5 py-0.5 text-[10px]">
                    {project.members.length + 1}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        {activeTab === "calendar" && (
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/50 bg-background/40 py-14">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-sky-50 dark:bg-sky-950/30">
              <Calendar className="h-5 w-5 text-sky-500/60" />
            </div>
            <h3 className="mb-1 text-sm font-semibold text-foreground/60">
              Project Calendar
            </h3>
            <p className="max-w-sm text-center text-xs text-foreground/40">
              View project timelines, deadlines, and milestones. Coming soon.
            </p>
          </div>
        )}

        {activeTab === "boards" && (
          <BoardsTab
            boards={project.boards}
            canEdit={canEdit}
            onCreateBoard={() => setIsCreateBoardOpen(true)}
            onAddExisting={() => setIsAddExistingBoardOpen(true)}
            onRemoveBoard={handleRemoveBoard}
          />
        )}

        {activeTab === "members" && (
          <MembersTab
            project={project}
            isOwner={isOwner}
            onAddMember={() => setIsAddMemberOpen(true)}
            onMemberChanged={fetchProject}
          />
        )}

        {activeTab === "settings" && isOwner && (
          <SettingsTab
            editName={editName}
            editDescription={editDescription}
            editStatus={editStatus}
            editProgress={editProgress}
            editStartDate={editStartDate}
            editEndDate={editEndDate}
            editDeadline={editDeadline}
            isSaving={isSaving}
            onNameChange={setEditName}
            onDescriptionChange={setEditDescription}
            onStatusChange={setEditStatus}
            onProgressChange={setEditProgress}
            onStartDateChange={setEditStartDate}
            onEndDateChange={setEditEndDate}
            onDeadlineChange={setEditDeadline}
            onSave={handleSaveSettings}
            onDelete={() => setDeleteConfirmOpen(true)}
          />
        )}
      </div>

      {/* Dialogs */}
      <CreateBoardDialog
        isOpen={isCreateBoardOpen}
        error={createBoardError}
        onClose={() => { setIsCreateBoardOpen(false); setCreateBoardError(null); }}
        onCreate={handleCreateBoard}
      />

      <AddExistingBoardDialog
        isOpen={isAddExistingBoardOpen}
        projectBoardIds={project.boards.map((b) => b.id)}
        onClose={() => setIsAddExistingBoardOpen(false)}
        onAdd={handleAddExistingBoard}
      />

      <AddMemberDialog
        isOpen={isAddMemberOpen}
        projectId={projectId ?? ""}
        onClose={() => setIsAddMemberOpen(false)}
        onAdded={handleMemberAdded}
      />

      <ConfirmDialog
        isOpen={removeBoardTarget !== null}
        title="Remove Board from Project"
        message={`Remove "${removeBoardTarget?.name ?? "this board"}" from the project? The board itself will not be deleted.`}
        confirmLabel="Remove"
        cancelLabel="Cancel"
        variant="default"
        onConfirm={confirmRemoveBoard}
        onCancel={() => setRemoveBoardTarget(null)}
      />

      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        title="Delete Project"
        message={`Are you sure you want to delete "${project.name}"? Boards will be unlinked but not deleted.`}
        confirmLabel="Delete Project"
        cancelLabel="Keep It"
        variant="danger"
        onConfirm={handleDeleteProject}
        onCancel={() => setDeleteConfirmOpen(false)}
      />
    </div>
  );
}

/* ─── Sub-components ──────────────────────────────────────── */

interface BoardsTabProps {
  boards: BoardSummaryDto[];
  canEdit: boolean;
  onCreateBoard: () => void;
  onAddExisting: () => void;
  onRemoveBoard: (id: string) => void;
}

function BoardsTab({ boards, canEdit, onCreateBoard, onAddExisting, onRemoveBoard }: BoardsTabProps) {
  const [typeFilter, setTypeFilter] = useState("");

  const filtered = typeFilter
    ? boards.filter((b) => b.boardType === typeFilter)
    : boards;

  const boardTypes = [
    { value: "", label: "All", icon: ClipboardList },
    { value: "NoteBoard", label: "Note Boards", icon: ClipboardList },
    { value: "ChalkBoard", label: "Chalk Boards", icon: PenTool },
  ];

  return (
    <div>
      {/* Filter + Add */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {boardTypes.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTypeFilter(t.value)}
              className={[
                "rounded-full px-3 py-1 text-xs font-medium transition-all",
                typeFilter === t.value
                  ? "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300"
                  : "text-foreground/50 hover:bg-foreground/5 hover:text-foreground",
              ].join(" ")}
            >
              {t.label}
            </button>
          ))}
        </div>
        {canEdit && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onAddExisting}
              className="flex items-center gap-1.5 rounded-lg border border-border/80 bg-background px-4 py-2 text-xs font-medium text-foreground/70 transition-all hover:border-violet-400 hover:text-violet-600 hover:shadow-sm dark:hover:text-violet-400"
            >
              <FolderOpen className="h-3.5 w-3.5" />
              Add Existing
            </button>
            <button
              type="button"
              onClick={onCreateBoard}
              className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-500"
            >
              <Plus className="h-3.5 w-3.5" />
              New Board
            </button>
          </div>
        )}
      </div>

      {/* Board grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/50 bg-background/40 py-14">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-foreground/5">
            <ClipboardList className="h-5 w-5 text-foreground/30" />
          </div>
          <p className="mb-4 text-sm text-foreground/40">
            {typeFilter ? "No boards match this filter" : "No boards in this project yet"}
          </p>
          {canEdit && !typeFilter && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onAddExisting}
                className="flex items-center gap-1.5 rounded-lg border border-border/80 bg-background px-4 py-2 text-xs font-medium text-foreground/60 transition-all hover:border-violet-400 hover:text-violet-600 hover:shadow-sm dark:hover:text-violet-400"
              >
                <FolderOpen className="h-3.5 w-3.5" />
                Add Existing Board
              </button>
              <button
                type="button"
                onClick={onCreateBoard}
                className="flex items-center gap-1.5 rounded-lg border border-border/80 bg-background px-4 py-2 text-xs font-medium text-foreground/60 transition-all hover:border-primary/40 hover:text-primary hover:shadow-sm"
              >
                <Plus className="h-3.5 w-3.5" />
                Create New Board
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((board) => (
            <BoardCard
              key={board.id}
              board={board}
              onDelete={canEdit ? onRemoveBoard : () => {}}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface MembersTabProps {
  project: ProjectDetailDto;
  isOwner: boolean;
  onAddMember: () => void;
  onMemberChanged: () => void;
}

function MembersTab({ project, isOwner, onAddMember, onMemberChanged }: MembersTabProps) {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          Team Members ({project.members.length + 1})
        </h3>
        {isOwner && (
          <button
            type="button"
            onClick={onAddMember}
            className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-500"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Member
          </button>
        )}
      </div>
      <MemberList
        projectId={project.id}
        ownerId={project.ownerId}
        ownerUsername={project.ownerUsername}
        members={project.members}
        isOwner={isOwner}
        onChanged={onMemberChanged}
      />
    </div>
  );
}

interface SettingsTabProps {
  editName: string;
  editDescription: string;
  editStatus: string;
  editProgress: number;
  editStartDate: string;
  editEndDate: string;
  editDeadline: string;
  isSaving: boolean;
  onNameChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  onStatusChange: (v: string) => void;
  onProgressChange: (v: number) => void;
  onStartDateChange: (v: string) => void;
  onEndDateChange: (v: string) => void;
  onDeadlineChange: (v: string) => void;
  onSave: (e: React.FormEvent) => void;
  onDelete: () => void;
}

function SettingsTab({
  editName,
  editDescription,
  editStatus,
  editProgress,
  editStartDate,
  editEndDate,
  editDeadline,
  isSaving,
  onNameChange,
  onDescriptionChange,
  onStatusChange,
  onProgressChange,
  onStartDateChange,
  onEndDateChange,
  onDeadlineChange,
  onSave,
  onDelete,
}: SettingsTabProps) {
  return (
    <div className="max-w-lg">
      <form onSubmit={onSave} className="flex flex-col gap-4">
        {/* Name */}
        <div>
          <label
            htmlFor="settings-name"
            className="mb-1.5 block text-xs font-medium text-foreground/60"
          >
            Project Name
          </label>
          <input
            id="settings-name"
            type="text"
            value={editName}
            onChange={(e) => onNameChange(e.target.value)}
            maxLength={100}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="settings-desc"
            className="mb-1.5 block text-xs font-medium text-foreground/60"
          >
            Description
          </label>
          <textarea
            id="settings-desc"
            value={editDescription}
            onChange={(e) => onDescriptionChange(e.target.value)}
            maxLength={500}
            rows={3}
            className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Status */}
        <div>
          <label
            htmlFor="settings-status"
            className="mb-1.5 block text-xs font-medium text-foreground/60"
          >
            Status
          </label>
          <select
            id="settings-status"
            value={editStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Progress */}
        <div>
          <label
            htmlFor="settings-progress"
            className="mb-1.5 block text-xs font-medium text-foreground/60"
          >
            Progress ({editProgress}%)
          </label>
          <input
            id="settings-progress"
            type="range"
            min={0}
            max={100}
            value={editProgress}
            onChange={(e) => onProgressChange(Number(e.target.value))}
            className="w-full accent-violet-500"
          />
        </div>

        {/* Time constraints toggle */}
        <TimeConstraintsBlock
          editStartDate={editStartDate}
          editEndDate={editEndDate}
          editDeadline={editDeadline}
          onStartDateChange={onStartDateChange}
          onEndDateChange={onEndDateChange}
          onDeadlineChange={onDeadlineChange}
        />

        {/* Save */}
        <button
          type="submit"
          disabled={isSaving || !editName.trim()}
          className="self-start rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </form>

      {/* Danger zone */}
      <div className="mt-10 rounded-lg border border-red-200 p-4 dark:border-red-900/40">
        <h4 className="text-sm font-semibold text-red-600 dark:text-red-400">
          Danger Zone
        </h4>
        <p className="mt-1 text-xs text-foreground/50">
          Deleting this project will unlink all boards. The boards themselves
          will not be deleted.
        </p>
        <button
          type="button"
          onClick={onDelete}
          className="mt-3 flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete Project
        </button>
      </div>
    </div>
  );
}

/* -- Time Constraints Block (used in Settings tab) ------------ */

interface TimeConstraintsBlockProps {
  editStartDate: string;
  editEndDate: string;
  editDeadline: string;
  onStartDateChange: (v: string) => void;
  onEndDateChange: (v: string) => void;
  onDeadlineChange: (v: string) => void;
}

function TimeConstraintsBlock({
  editStartDate,
  editEndDate,
  editDeadline,
  onStartDateChange,
  onEndDateChange,
  onDeadlineChange,
}: TimeConstraintsBlockProps) {
  const hasConstraints = !!(editStartDate || editEndDate);

  function handleToggle(checked: boolean) {
    if (!checked) {
      onStartDateChange("");
      onEndDateChange("");
      onDeadlineChange("");
    }
  }

  return (
    <>
      <label
        htmlFor="settings-time-constraints"
        className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-border px-3 py-2.5 transition-colors hover:bg-foreground/[0.02]"
      >
        <input
          id="settings-time-constraints"
          type="checkbox"
          checked={hasConstraints}
          onChange={(e) => handleToggle(e.target.checked)}
          className="h-4 w-4 rounded border-border text-primary accent-primary focus:ring-2 focus:ring-primary/20"
        />
        <CalendarClock className="h-4 w-4 text-foreground/40" />
        <span className="text-sm font-medium text-foreground/70">
          {hasConstraints ? "Time constraints enabled" : "No time constraints (indefinite)"}
        </span>
      </label>

      {hasConstraints && (
        <div className="flex flex-col gap-4 rounded-lg border border-border/60 bg-foreground/[0.01] p-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="settings-start"
                className="mb-1.5 block text-xs font-medium text-foreground/60"
              >
                Start Date
              </label>
              <input
                id="settings-start"
                type="date"
                value={editStartDate}
                onChange={(e) => onStartDateChange(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label
                htmlFor="settings-end"
                className="mb-1.5 block text-xs font-medium text-foreground/60"
              >
                End Date
              </label>
              <input
                id="settings-end"
                type="date"
                value={editEndDate}
                onChange={(e) => onEndDateChange(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="settings-deadline"
              className="mb-1.5 block text-xs font-medium text-foreground/60"
            >
              Deadline <span className="text-foreground/30">(optional)</span>
            </label>
            <input
              id="settings-deadline"
              type="date"
              value={editDeadline}
              onChange={(e) => onDeadlineChange(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
      )}
    </>
  );
}
