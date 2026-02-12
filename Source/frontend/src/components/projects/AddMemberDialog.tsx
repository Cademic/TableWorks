import { useState } from "react";
import { X, UserPlus } from "lucide-react";
import { addMember } from "../../api/projects";

interface AddMemberDialogProps {
  isOpen: boolean;
  projectId: string;
  onClose: () => void;
  onAdded: () => void;
}

export function AddMemberDialog({
  isOpen,
  projectId,
  onClose,
  onAdded,
}: AddMemberDialogProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Viewer");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setError(null);
    setIsSubmitting(true);

    try {
      await addMember(projectId, { email: email.trim(), role });
      setEmail("");
      setRole("Viewer");
      onAdded();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to add member. Check the email and try again.";
      // Try to get the response message from axios errors
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message ?? message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleClose() {
    setEmail("");
    setRole("Viewer");
    setError(null);
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

        <div className="mb-4 flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-foreground/60" />
          <h2 className="text-lg font-semibold text-foreground">
            Add Team Member
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Email */}
          <div>
            <label
              htmlFor="member-email"
              className="mb-1.5 block text-xs font-medium text-foreground/60"
            >
              Email Address
            </label>
            <input
              id="member-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@example.com"
              autoFocus
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground/30 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <p className="mt-1 text-[10px] text-foreground/40">
              The user must already have a ASideNote account.
            </p>
          </div>

          {/* Role */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground/60">
              Permission Level
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole("Viewer")}
                className={[
                  "flex flex-col items-center gap-1 rounded-lg border p-3 text-xs transition-all",
                  role === "Viewer"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border text-foreground/60 hover:border-foreground/30",
                ].join(" ")}
              >
                <span className="font-medium">Viewer</span>
                <span className="text-[10px] text-foreground/40">
                  Can view boards
                </span>
              </button>
              <button
                type="button"
                onClick={() => setRole("Editor")}
                className={[
                  "flex flex-col items-center gap-1 rounded-lg border p-3 text-xs transition-all",
                  role === "Editor"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border text-foreground/60 hover:border-foreground/30",
                ].join(" ")}
              >
                <span className="font-medium">Editor</span>
                <span className="text-[10px] text-foreground/40">
                  Can edit boards
                </span>
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-950/20 dark:text-red-400">
              {error}
            </p>
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
              disabled={!email.trim() || isSubmitting}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Adding..." : "Add Member"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
