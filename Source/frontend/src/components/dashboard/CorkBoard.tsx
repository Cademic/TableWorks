import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { ZoomControls } from "./ZoomControls";
import { useTouchViewport } from "../../hooks/useTouchViewport";

interface CorkBoardProps {
  children: ReactNode;
  boardRef?: React.RefObject<HTMLDivElement | null>;
  onDropItem?: (type: string, x: number, y: number) => void;
  zoom: number;
  panX: number;
  panY: number;
  onViewportChange: (zoom: number, panX: number, panY: number) => void;
}

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 2.0;
const ZOOM_STEP = 1.1;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function CorkBoard({ children, boardRef, onDropItem, zoom, panX, panY, onViewportChange }: CorkBoardProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const panStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const [isSpaceHeld, setIsSpaceHeld] = useState(false);

  // Bridge boardRef to point at the canvas div
  const setCanvasRef = useCallback(
    (el: HTMLDivElement | null) => {
      (canvasRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
      if (boardRef) {
        (boardRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
      }
    },
    [boardRef],
  );

  // ---- Drag-and-drop (sidebar items) ----

  function handleDragOver(e: React.DragEvent) {
    if (!e.dataTransfer.types.includes("application/board-item-type")) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setIsDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragOver(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);

    const itemType = e.dataTransfer.getData("application/board-item-type");
    if (!itemType || !onDropItem) return;

    // Convert screen coords to canvas coords
    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect) return;
    const canvasX = (e.clientX - rect.left) / zoom - panX;
    const canvasY = (e.clientY - rect.top) / zoom - panY;

    onDropItem(itemType, canvasX, canvasY);
  }

  // ---- Wheel zoom (Ctrl + scroll only) ----

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    function onWheel(e: WheelEvent) {
      // Only zoom when Ctrl (or Cmd on Mac) is held
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();

      const rect = viewport!.getBoundingClientRect();
      // Zoom centered on the cursor position
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const factor = e.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP;
      const newZoom = clamp(zoom * factor, MIN_ZOOM, MAX_ZOOM);

      // Adjust pan so the point under the cursor stays fixed
      // With transform: scale(z) translate(p), screen = z*(canvas+p), so canvas = screen/z - p
      const newPanX = panX + (mouseX / newZoom - mouseX / zoom);
      const newPanY = panY + (mouseY / newZoom - mouseY / zoom);

      onViewportChange(newZoom, newPanX, newPanY);
    }

    viewport.addEventListener("wheel", onWheel, { passive: false });
    return () => viewport.removeEventListener("wheel", onWheel);
  }, [zoom, panX, panY, onViewportChange]);

  // ---- Pan (right-click drag, middle-click drag, or space + left-click drag) ----

  // Track whether right-click was used for panning so we can suppress the context menu
  const didRightPanRef = useRef(false);

  function handleMouseDown(e: React.MouseEvent) {
    // Right mouse button (2), middle mouse button (1), or space+left click (0)
    if (e.button === 2 || e.button === 1 || (e.button === 0 && isSpaceHeld)) {
      e.preventDefault();
      setIsPanning(true);
      didRightPanRef.current = e.button === 2;
      panStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        panX,
        panY,
      };
    }
  }

  useEffect(() => {
    if (!isPanning) return;

    function onMouseMove(e: MouseEvent) {
      const start = panStartRef.current;
      if (!start) return;
      const dx = (e.clientX - start.x) / zoom;
      const dy = (e.clientY - start.y) / zoom;
      onViewportChange(zoom, start.panX + dx, start.panY + dy);
    }

    function onMouseUp() {
      setIsPanning(false);
      panStartRef.current = null;
    }

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, [isPanning, zoom, onViewportChange]);

  // Suppress context menu after right-click panning
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    function onContextMenu(e: MouseEvent) {
      if (didRightPanRef.current) {
        e.preventDefault();
        didRightPanRef.current = false;
      }
    }

    viewport.addEventListener("contextmenu", onContextMenu);
    return () => viewport.removeEventListener("contextmenu", onContextMenu);
  }, []);

  // Track space bar for space-to-pan
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.code === "Space" && !e.repeat && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || (e.target as HTMLElement)?.isContentEditable)) {
        e.preventDefault();
        setIsSpaceHeld(true);
      }
    }
    function onKeyUp(e: KeyboardEvent) {
      if (e.code === "Space") {
        setIsSpaceHeld(false);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  // --- Touch pan and pinch zoom ---
  useTouchViewport(viewportRef, zoom, panX, panY, onViewportChange, {
    resolutionFactor: 1,
    minZoom: MIN_ZOOM,
    maxZoom: MAX_ZOOM,
  });

  // ---- Zoom controls ----

  function zoomToCenter(newZoom: number) {
    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect) {
      onViewportChange(newZoom, panX, panY);
      return;
    }
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const newPanX = panX + (centerX / newZoom - centerX / zoom);
    const newPanY = panY + (centerY / newZoom - centerY / zoom);
    onViewportChange(newZoom, newPanX, newPanY);
  }

  function handleZoomIn() {
    zoomToCenter(clamp(zoom * ZOOM_STEP, MIN_ZOOM, MAX_ZOOM));
  }

  function handleZoomOut() {
    zoomToCenter(clamp(zoom / ZOOM_STEP, MIN_ZOOM, MAX_ZOOM));
  }

  function handleZoomReset() {
    onViewportChange(1, 0, 0);
  }

  const cursorClass = isPanning ? "cursor-grabbing" : isSpaceHeld ? "cursor-grab" : "";

  return (
    <div className="relative h-full w-full corkboard-frame">
      {/* Viewport (clips and captures events) */}
      <div
        ref={viewportRef}
        className={[
          "corkboard-surface relative h-full w-full overflow-hidden transition-shadow duration-150",
          isDragOver ? "ring-2 ring-inset ring-primary/40" : "",
          cursorClass,
        ].join(" ")}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onMouseDown={handleMouseDown}
      >
        {/* Canvas (transformed layer) */}
        <div
          ref={setCanvasRef}
          className="absolute origin-top-left"
          style={{
            transform: `scale(${zoom}) translate(${panX}px, ${panY}px)`,
            width: "10000px",
            height: "10000px",
          }}
        >
          {children}
        </div>
      </div>

      {/* Zoom controls (outside canvas transform) */}
      <div className="absolute bottom-4 left-4 z-20">
        <ZoomControls
          zoom={zoom}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onReset={handleZoomReset}
        />
      </div>
    </div>
  );
}
