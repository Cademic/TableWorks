import { useState } from "react";
import { X, ClipboardList, PenTool, Calendar } from "lucide-react";

interface CreateBoardDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, description: string, boardType: string) => void;
}

const BOARD_TYPES = [
  { value: "NoteBoard", label: "Note Board", icon: ClipboardList, description: "Pin sticky notes and index cards" },
  { value: "ChalkBoard", label: "Chalk Board", icon: PenTool, description: "Freehand drawing canvas", isDisabled: true },
  { value: "Calendar", label: "Calendar", icon: Calendar, description: "Schedule events and tasks", isDisabled: true },
];

export function CreateBoardDialog({ isOpen, onClose, onCreate }: CreateBoardDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [boardType, setBoardType] = useState("NoteBoard");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate(name.trim(), description.trim(), boardType);
    setName("");
    setDescription("");
    setBoardType("NoteBoard");
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        onKeyDown={() => {}}
        role="presentation"
      />

      {/* Dialog */}
      <div className="relative w-full max-w-md rounded-2xl bg-surface border border-border shadow-2xl p-6 mx-4">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 rounded-lg p-1 text-foreground/50 hover:text-foreground hover:bg-background transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-lg font-semibold text-foreground mb-4">Create New Board</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Board type selector */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground/60">Board Type</label>
            <div className="grid grid-cols-3 gap-2">
              {BOARD_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => !type.isDisabled && setBoardType(type.value)}
                  disabled={type.isDisabled}
                  className={[
                    "flex flex-col items-center gap-1.5 rounded-lg border p-3 text-xs transition-all",
                    boardType === type.value
                      ? "border-primary bg-primary/5 text-primary"
                      : type.isDisabled
                      ? "border-border/50 text-foreground/30 cursor-not-allowed"
                      : "border-border text-foreground/60 hover:border-foreground/30",
                  ].join(" ")}
                >
                  <type.icon className="h-5 w-5" />
                  <span className="font-medium">{type.label}</span>
                  {type.isDisabled && <span className="text-[10px]">Coming Soon</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label htmlFor="board-name" className="mb-1.5 block text-xs font-medium text-foreground/60">
              Name
            </label>
            <input
              id="board-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Note Board"
              maxLength={100}
              autoFocus
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground/30 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="board-desc" className="mb-1.5 block text-xs font-medium text-foreground/60">
              Description <span className="text-foreground/30">(optional)</span>
            </label>
            <textarea
              id="board-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this board for?"
              maxLength={500}
              rows={2}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground/30 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-foreground/60 hover:text-foreground hover:bg-background transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Create Board
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
