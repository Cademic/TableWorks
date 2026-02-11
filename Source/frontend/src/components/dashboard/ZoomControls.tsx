import { Minus, Plus, Maximize } from "lucide-react";

interface ZoomControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}

export function ZoomControls({ zoom, onZoomIn, onZoomOut, onReset }: ZoomControlsProps) {
  const pct = Math.round(zoom * 100);

  return (
    <div className="flex items-center gap-0.5 rounded-xl border border-border bg-surface/90 backdrop-blur-sm shadow-lg px-1 py-1">
      <button
        type="button"
        onClick={onZoomOut}
        disabled={zoom <= 0.25}
        title="Zoom out"
        className="flex h-7 w-7 items-center justify-center rounded-lg text-foreground/60 hover:bg-background hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>

      <button
        type="button"
        onClick={onReset}
        title="Reset zoom"
        className="flex h-7 min-w-[3rem] items-center justify-center rounded-lg px-1 text-xs font-medium text-foreground/60 hover:bg-background hover:text-foreground transition-colors"
      >
        {pct}%
      </button>

      <button
        type="button"
        onClick={onZoomIn}
        disabled={zoom >= 2.0}
        title="Zoom in"
        className="flex h-7 w-7 items-center justify-center rounded-lg text-foreground/60 hover:bg-background hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>

      <div className="mx-0.5 h-4 w-px bg-border" />

      <button
        type="button"
        onClick={onReset}
        title="Fit to center"
        className="flex h-7 w-7 items-center justify-center rounded-lg text-foreground/60 hover:bg-background hover:text-foreground transition-colors"
      >
        <Maximize className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
