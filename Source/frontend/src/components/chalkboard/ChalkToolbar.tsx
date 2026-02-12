import { useState } from "react";
import {
  Pen,
  MousePointer2,
  Eraser,
  Undo2,
  Redo2,
  Trash2,
  StickyNote,
  Minus,
  Circle,
} from "lucide-react";

export type ChalkMode = "draw" | "select";
export type ChalkTool = "pen" | "eraser";

interface ChalkToolbarProps {
  mode: ChalkMode;
  tool: ChalkTool;
  brushColor: string;
  brushSize: number;
  onModeChange: (mode: ChalkMode) => void;
  onToolChange: (tool: ChalkTool) => void;
  onBrushColorChange: (color: string) => void;
  onBrushSizeChange: (size: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onAddStickyNote: () => void;
}

const CHALK_COLORS = [
  { value: "#ffffff", label: "White" },
  { value: "#fde68a", label: "Yellow" },
  { value: "#fca5a5", label: "Pink" },
  { value: "#93c5fd", label: "Blue" },
  { value: "#86efac", label: "Green" },
  { value: "#fdba74", label: "Orange" },
];

const BRUSH_SIZES = [
  { value: 2, label: "Fine", icon: Minus },
  { value: 5, label: "Medium", icon: Circle },
  { value: 10, label: "Thick", icon: Circle },
];

export function ChalkToolbar({
  mode,
  tool,
  brushColor,
  brushSize,
  onModeChange,
  onToolChange,
  onBrushColorChange,
  onBrushSizeChange,
  onUndo,
  onRedo,
  onClear,
  onAddStickyNote,
}: ChalkToolbarProps) {
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  function handleClear() {
    setShowClearConfirm(true);
  }

  function confirmClear() {
    setShowClearConfirm(false);
    onClear();
  }

  return (
    <div className="absolute bottom-6 left-1/2 z-30 -translate-x-1/2">
      <div className="flex items-center gap-1 rounded-2xl border border-white/10 bg-gray-900/80 px-3 py-2 shadow-2xl backdrop-blur-md">
        {/* Mode toggle */}
        <ToolButton
          active={mode === "select"}
          onClick={() => onModeChange("select")}
          title="Select mode (move sticky notes)"
        >
          <MousePointer2 className="h-4 w-4" />
        </ToolButton>
        <ToolButton
          active={mode === "draw" && tool === "pen"}
          onClick={() => {
            onModeChange("draw");
            onToolChange("pen");
          }}
          title="Pen tool"
        >
          <Pen className="h-4 w-4" />
        </ToolButton>
        <ToolButton
          active={mode === "draw" && tool === "eraser"}
          onClick={() => {
            onModeChange("draw");
            onToolChange("eraser");
          }}
          title="Eraser"
        >
          <Eraser className="h-4 w-4" />
        </ToolButton>

        <Divider />

        {/* Color palette */}
        {CHALK_COLORS.map((c) => (
          <button
            key={c.value}
            type="button"
            title={c.label}
            onClick={() => {
              onBrushColorChange(c.value);
              if (mode !== "draw" || tool !== "pen") {
                onModeChange("draw");
                onToolChange("pen");
              }
            }}
            className={[
              "flex h-7 w-7 items-center justify-center rounded-full transition-all",
              brushColor === c.value && mode === "draw" && tool === "pen"
                ? "ring-2 ring-white ring-offset-2 ring-offset-gray-900/80 scale-110"
                : "hover:scale-110 opacity-80 hover:opacity-100",
            ].join(" ")}
          >
            <div
              className="h-4 w-4 rounded-full border border-white/20"
              style={{ backgroundColor: c.value }}
            />
          </button>
        ))}

        <Divider />

        {/* Brush size */}
        {BRUSH_SIZES.map((s) => (
          <button
            key={s.value}
            type="button"
            title={s.label}
            onClick={() => onBrushSizeChange(s.value)}
            className={[
              "flex h-7 w-7 items-center justify-center rounded-lg transition-all",
              brushSize === s.value
                ? "bg-white/20 text-white"
                : "text-white/50 hover:text-white/80 hover:bg-white/10",
            ].join(" ")}
          >
            <div
              className="rounded-full bg-current"
              style={{
                width: `${Math.max(4, s.value)}px`,
                height: `${Math.max(4, s.value)}px`,
              }}
            />
          </button>
        ))}

        <Divider />

        {/* Undo / Redo */}
        <ToolButton onClick={onUndo} title="Undo">
          <Undo2 className="h-4 w-4" />
        </ToolButton>
        <ToolButton onClick={onRedo} title="Redo">
          <Redo2 className="h-4 w-4" />
        </ToolButton>

        <Divider />

        {/* Add Sticky Note */}
        <ToolButton
          onClick={onAddStickyNote}
          title="Add sticky note"
          className="text-yellow-400/80 hover:text-yellow-300"
        >
          <StickyNote className="h-4 w-4" />
        </ToolButton>

        <Divider />

        {/* Clear */}
        <div className="relative">
          <ToolButton
            onClick={handleClear}
            title="Clear canvas"
            className="text-red-400/60 hover:text-red-400"
          >
            <Trash2 className="h-4 w-4" />
          </ToolButton>

          {showClearConfirm && (
            <div className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-white/10 bg-gray-900/95 p-3 shadow-xl backdrop-blur-md">
              <p className="mb-2 text-xs font-medium text-white/80">
                Clear entire canvas?
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(false)}
                  className="rounded-md px-2.5 py-1 text-xs font-medium text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmClear}
                  className="rounded-md bg-red-500/80 px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-red-500"
                >
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Internal sub-components ────────────────────────────────────────── */

interface ToolButtonProps {
  children: React.ReactNode;
  active?: boolean;
  onClick: () => void;
  title: string;
  className?: string;
}

function ToolButton({ children, active, onClick, title, className }: ToolButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={[
        "flex h-8 w-8 items-center justify-center rounded-lg transition-all",
        active
          ? "bg-white/20 text-white shadow-inner"
          : "text-white/50 hover:text-white/80 hover:bg-white/10",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="mx-1 h-6 w-px bg-white/10" />;
}
