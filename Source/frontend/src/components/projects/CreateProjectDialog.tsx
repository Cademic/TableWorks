import { useState } from "react";
import { X, CalendarClock } from "lucide-react";

interface CreateProjectDialogProps {
  isOpen: boolean;
  error?: string | null;
  onClose: () => void;
  onCreate: (
    name: string,
    description: string,
    startDate?: string,
    endDate?: string,
    deadline?: string,
  ) => void;
}

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

function nextMonthStr(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return d.toISOString().split("T")[0];
}

export function CreateProjectDialog({
  isOpen,
  error,
  onClose,
  onCreate,
}: CreateProjectDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [hasTimeConstraints, setHasTimeConstraints] = useState(false);
  const [startDate, setStartDate] = useState(todayStr());
  const [endDate, setEndDate] = useState(nextMonthStr());
  const [deadline, setDeadline] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    if (hasTimeConstraints && (!startDate || !endDate)) return;
    onCreate(
      name.trim(),
      description.trim(),
      hasTimeConstraints ? startDate : undefined,
      hasTimeConstraints ? endDate : undefined,
      hasTimeConstraints && deadline ? deadline : undefined,
    );
  }

  function handleClose() {
    setName("");
    setDescription("");
    setHasTimeConstraints(false);
    setStartDate(todayStr());
    setEndDate(nextMonthStr());
    setDeadline("");
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
        onKeyDown={() => {}}
        role="presentation"
      />

      {/* Dialog */}
      <div className="relative mx-4 w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl">
        {/* Close button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-foreground/50 transition-colors hover:bg-background hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="mb-4 text-lg font-semibold text-foreground">
          Create New Project
        </h2>

        {/* Error message */}
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Name */}
          <div>
            <label
              htmlFor="project-name"
              className="mb-1.5 block text-xs font-medium text-foreground/60"
            >
              Project Name
            </label>
            <input
              id="project-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Project"
              maxLength={100}
              autoFocus
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground/30 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="project-desc"
              className="mb-1.5 block text-xs font-medium text-foreground/60"
            >
              Description{" "}
              <span className="text-foreground/30">(optional)</span>
            </label>
            <textarea
              id="project-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this project about?"
              maxLength={500}
              rows={2}
              className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground/30 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Time constraints toggle */}
          <label
            htmlFor="time-constraints"
            className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-border px-3 py-2.5 transition-colors hover:bg-foreground/[0.02]"
          >
            <input
              id="time-constraints"
              type="checkbox"
              checked={hasTimeConstraints}
              onChange={(e) => setHasTimeConstraints(e.target.checked)}
              className="h-4 w-4 rounded border-border text-primary accent-primary focus:ring-2 focus:ring-primary/20"
            />
            <CalendarClock className="h-4 w-4 text-foreground/40" />
            <span className="text-sm font-medium text-foreground/70">
              Add time constraints
            </span>
          </label>

          {/* Date fields -- shown only when time constraints are enabled */}
          {hasTimeConstraints && (
            <div className="flex flex-col gap-4 rounded-lg border border-border/60 bg-foreground/[0.01] p-4">
              {/* Dates row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="project-start"
                    className="mb-1.5 block text-xs font-medium text-foreground/60"
                  >
                    Start Date
                  </label>
                  <input
                    id="project-start"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label
                    htmlFor="project-end"
                    className="mb-1.5 block text-xs font-medium text-foreground/60"
                  >
                    End Date
                  </label>
                  <input
                    id="project-end"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* Deadline */}
              <div>
                <label
                  htmlFor="project-deadline"
                  className="mb-1.5 block text-xs font-medium text-foreground/60"
                >
                  Deadline{" "}
                  <span className="text-foreground/30">(optional)</span>
                </label>
                <input
                  id="project-deadline"
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-foreground/60 transition-colors hover:bg-background hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                !name.trim() ||
                (hasTimeConstraints && (!startDate || !endDate))
              }
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
