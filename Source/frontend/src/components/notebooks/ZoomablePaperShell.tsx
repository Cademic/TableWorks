import { useEffect, useRef, useState, type ReactNode } from "react";
import { ZoomIn, ZoomOut } from "lucide-react";

interface ZoomablePaperShellProps {
  children: ReactNode;
  /** Minimum zoom level (e.g., 0.5 = 50%) */
  minZoom?: number;
  /** Maximum zoom level (e.g., 2 = 200%) */
  maxZoom?: number;
  /** Initial zoom level (used when zoom/onZoomChange not provided) */
  initialZoom?: number;
  /** Controlled zoom level (when provided with onZoomChange) */
  zoom?: number;
  /** Callback when zoom changes (use with zoom for controlled mode) */
  onZoomChange?: (zoom: number) => void;
}

export function ZoomablePaperShell({
  children,
  minZoom = 0.5,
  maxZoom = 2,
  initialZoom = 1,
  zoom: controlledZoom,
  onZoomChange,
}: ZoomablePaperShellProps) {
  const [internalZoom, setInternalZoom] = useState(initialZoom);
  const zoom = controlledZoom ?? internalZoom;
  const setZoom = onZoomChange ?? setInternalZoom;
  const containerRef = useRef<HTMLDivElement>(null);
  const lastPinchDistanceRef = useRef<number | null>(null);

  const applyZoomDelta = (delta: number) => {
    const newZoom = Math.max(minZoom, Math.min(maxZoom, zoom + delta));
    setZoom(Math.round(newZoom * 100) / 100);
  };

  // Handle Ctrl+scroll wheel zoom (desktop)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return; // Only zoom with Ctrl (or Cmd on Mac)
      e.preventDefault();
      e.stopPropagation();

      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      applyZoomDelta(delta);
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [minZoom, maxZoom, zoom]);

  // Handle touch pinch-to-zoom (mobile)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const distance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
        lastPinchDistanceRef.current = distance;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && lastPinchDistanceRef.current !== null) {
        e.preventDefault();
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const distance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
        const delta = distance - lastPinchDistanceRef.current;
        const zoomDelta = delta * 0.01; // Adjust sensitivity
        applyZoomDelta(zoomDelta);
        lastPinchDistanceRef.current = distance;
      }
    };

    const handleTouchEnd = () => {
      lastPinchDistanceRef.current = null;
    };

    container.addEventListener("touchstart", handleTouchStart, { passive: false });
    container.addEventListener("touchmove", handleTouchMove, { passive: false });
    container.addEventListener("touchend", handleTouchEnd);
    container.addEventListener("touchcancel", handleTouchEnd);

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
      container.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, [minZoom, maxZoom, zoom]);

  const handleZoomChange = (newZoom: number) => {
    const clampedZoom = Math.max(minZoom, Math.min(maxZoom, newZoom));
    setZoom(Math.round(clampedZoom * 100) / 100);
  };

  return (
    <div
      ref={containerRef}
      className="zoomable-paper-container relative overflow-auto w-full h-full flex justify-center items-start p-5 bg-background"
    >
      <div
        className="zoomable-paper-content"
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: "top center",
          transition: "transform 0.1s ease-out",
          willChange: "transform",
        }}
      >
        {children}
      </div>
      
      {/* Zoom controls fixed at bottom of viewport (offset on desktop to clear sidebar w-60) */}
      <div className="fixed bottom-4 left-4 lg:left-[17rem] z-50 flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 shadow-lg">
        <button
          type="button"
          onClick={() => handleZoomChange(zoom - 0.1)}
          disabled={zoom <= minZoom}
          className="rounded p-1 text-foreground/70 transition-colors hover:bg-foreground/5 hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Zoom out"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2 min-w-[120px]">
          <input
            type="range"
            min={minZoom}
            max={maxZoom}
            step={0.01}
            value={zoom}
            onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
            className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer bg-foreground/10 accent-primary"
            aria-label="Zoom level"
          />
          <span className="text-xs font-medium text-foreground/70 min-w-[3rem] text-right">
            {Math.round(zoom * 100)}%
          </span>
        </div>
        <button
          type="button"
          onClick={() => handleZoomChange(zoom + 0.1)}
          disabled={zoom >= maxZoom}
          className="rounded p-1 text-foreground/70 transition-colors hover:bg-foreground/5 hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Zoom in"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => handleZoomChange(1)}
          className="rounded px-2 py-1 text-xs font-medium text-foreground/70 transition-colors hover:bg-foreground/5 hover:text-foreground"
          aria-label="Reset zoom"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
