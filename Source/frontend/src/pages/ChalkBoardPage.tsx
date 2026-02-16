import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useOutletContext } from "react-router-dom";
import type { AppLayoutContext } from "../components/layout/AppLayout";
import { ChalkCanvas, CHALKBOARD_BG, RESOLUTION_FACTOR, type ChalkCanvasHandle } from "../components/chalkboard/ChalkCanvas";
import { ChalkToolbar, type ChalkMode, type ChalkTool } from "../components/chalkboard/ChalkToolbar";
import { StickyNote } from "../components/dashboard/StickyNote";
import { ZoomControls } from "../components/dashboard/ZoomControls";
import { getBoardById } from "../api/boards";
import { getDrawing, saveDrawing } from "../api/drawings";
import { getNotes, createNote, patchNote, deleteNote } from "../api/notes";
import { useTouchViewport } from "../hooks/useTouchViewport";
import type { BoardSummaryDto, NoteSummaryDto } from "../types";

const MIN_ZOOM = 0.25;
const AUTO_SAVE_DELAY_MS = 1 * 1000; // 1 second after last change
const MAX_ZOOM = 2.0;
const ZOOM_STEP = 1.1;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function ChalkBoardPage() {
  const { boardId } = useParams<{ boardId: string }>();
  const { setBoardName, openBoard } = useOutletContext<AppLayoutContext>();

  // --- Board & loading state ---
  const [board, setBoard] = useState<BoardSummaryDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Drawing state ---
  const canvasRef = useRef<ChalkCanvasHandle>(null);
  const [initialCanvasJson, setInitialCanvasJson] = useState<string | null>(null);

  // --- Notes state ---
  const [notes, setNotes] = useState<NoteSummaryDto[]>([]);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  // --- Z-index stacking ---
  const [zIndexMap, setZIndexMap] = useState<Record<string, number>>({});
  const zCounterRef = useRef(1);

  function bringToFront(id: string) {
    const next = zCounterRef.current++;
    setZIndexMap((prev) => ({ ...prev, [id]: next }));
  }

  // --- Mode & tool state ---
  const [mode, setMode] = useState<ChalkMode>("draw");
  const [tool, setTool] = useState<ChalkTool>("pen");
  const [brushColor, setBrushColor] = useState("#ffffff");
  const [brushSize, setBrushSize] = useState(5);

  // --- Viewport state (zoom & pan) ---
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isPanning, setIsPanning] = useState(false);
  const [isTouchPanning, setIsTouchPanning] = useState(false);
  const [isSpaceHeld, setIsSpaceHeld] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);
  const panStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const didRightPanRef = useRef(false);

  // Restore viewport from localStorage on mount
  useEffect(() => {
    if (!boardId) return;
    try {
      const saved = localStorage.getItem(`board-viewport-${boardId}`);
      if (saved) {
        const { zoom: z, panX: px, panY: py } = JSON.parse(saved);
        if (typeof z === "number") setZoom(z);
        if (typeof px === "number") setPanX(px);
        if (typeof py === "number") setPanY(py);
      }
    } catch {
      // ignore parse errors
    }
  }, [boardId]);

  // Persist viewport to localStorage (debounced)
  const viewportTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!boardId) return;
    if (viewportTimerRef.current) clearTimeout(viewportTimerRef.current);
    viewportTimerRef.current = setTimeout(() => {
      localStorage.setItem(`board-viewport-${boardId}`, JSON.stringify({ zoom, panX, panY }));
    }, 300);
    return () => {
      if (viewportTimerRef.current) clearTimeout(viewportTimerRef.current);
    };
  }, [boardId, zoom, panX, panY]);

  function handleViewportChange(newZoom: number, newPanX: number, newPanY: number) {
    setZoom(newZoom);
    setPanX(newPanX);
    setPanY(newPanY);
  }

  // --- Wheel zoom (Ctrl/Cmd + scroll) ---
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    function onWheel(e: WheelEvent) {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();

      const rect = viewport!.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const factor = e.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP;
      const newZoom = clamp(zoom * factor, MIN_ZOOM, MAX_ZOOM);
      const vpScale = zoom / RESOLUTION_FACTOR;
      const newVpScale = newZoom / RESOLUTION_FACTOR;

      // Keep point under cursor fixed (same formula as Note Board CorkBoard)
      const newPanX = panX + mouseX * (1 / newVpScale - 1 / vpScale);
      const newPanY = panY + mouseY * (1 / newVpScale - 1 / vpScale);

      handleViewportChange(newZoom, newPanX, newPanY);
    }

    viewport.addEventListener("wheel", onWheel, { passive: false });
    return () => viewport.removeEventListener("wheel", onWheel);
  }, [zoom, panX, panY]);

  // --- Pan (right-click, middle-click, space+left drag) ---
  function handleViewportMouseDown(e: React.MouseEvent) {
    if (e.button === 2 || e.button === 1 || (e.button === 0 && isSpaceHeld)) {
      e.preventDefault();
      setIsPanning(true);
      didRightPanRef.current = e.button === 2;
      panStartRef.current = { x: e.clientX, y: e.clientY, panX, panY };

      // Temporarily disable drawing while panning
      if (mode === "draw" && isSpaceHeld) {
        canvasRef.current?.setDrawingMode(false);
      }
    }
  }

  useEffect(() => {
    if (!isPanning) return;

    function onMouseMove(e: MouseEvent) {
      const start = panStartRef.current;
      if (!start) return;
      const dx = RESOLUTION_FACTOR * (e.clientX - start.x) / zoom;
      const dy = RESOLUTION_FACTOR * (e.clientY - start.y) / zoom;
      handleViewportChange(zoom, start.panX + dx, start.panY + dy);
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
  }, [isPanning, zoom]);

  // Re-enable drawing after panning ends (mouse or touch)
  useEffect(() => {
    if (!isPanning && !isTouchPanning && mode === "draw") {
      if (tool === "eraser") {
        canvasRef.current?.setEraserMode(true);
      } else {
        canvasRef.current?.setDrawingMode(true);
      }
    }
  }, [isPanning, isTouchPanning, mode, tool]);

  // Suppress context menu after right-click pan
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

  // --- Touch pan and pinch zoom ---
  useTouchViewport(
    viewportRef,
    zoom,
    panX,
    panY,
    handleViewportChange,
    {
      resolutionFactor: RESOLUTION_FACTOR,
      minZoom: MIN_ZOOM,
      maxZoom: MAX_ZOOM,
      onTouchPanStart: () => {
        setIsTouchPanning(true);
        // Disable drawing while touch panning
        if (mode === "draw") {
          canvasRef.current?.setDrawingMode(false);
        }
      },
      onTouchPanEnd: () => {
        setIsTouchPanning(false);
      },
    },
  );

  // Track space bar for space-to-pan
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (
        e.code === "Space" &&
        !e.repeat &&
        !(
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement ||
          (e.target as HTMLElement)?.isContentEditable
        )
      ) {
        e.preventDefault();
        setIsSpaceHeld(true);
        // Temporarily disable drawing so left-click can pan
        if (mode === "draw") {
          canvasRef.current?.setDrawingMode(false);
        }
      }
    }
    function onKeyUp(e: KeyboardEvent) {
      if (e.code === "Space") {
        setIsSpaceHeld(false);
        // Re-enable drawing
        if (mode === "draw") {
          if (tool === "eraser") {
            canvasRef.current?.setEraserMode(true);
          } else {
            canvasRef.current?.setDrawingMode(true);
          }
        }
      }
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup", onKeyUp);
    };
  }, [mode, tool]);

  // --- Zoom controls ---
  function zoomToCenter(newZoom: number) {
    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect) {
      handleViewportChange(newZoom, panX, panY);
      return;
    }
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const vpScale = zoom / RESOLUTION_FACTOR;
    const newVpScale = newZoom / RESOLUTION_FACTOR;
    const newPanX = panX + centerX * (1 / newVpScale - 1 / vpScale);
    const newPanY = panY + centerY * (1 / newVpScale - 1 / vpScale);
    handleViewportChange(newZoom, newPanX, newPanY);
  }

  function handleZoomIn() {
    zoomToCenter(clamp(zoom * ZOOM_STEP, MIN_ZOOM, MAX_ZOOM));
  }
  function handleZoomOut() {
    zoomToCenter(clamp(zoom / ZOOM_STEP, MIN_ZOOM, MAX_ZOOM));
  }
  function handleZoomReset() {
    handleViewportChange(1, 0, 0);
  }

  function handleCenterView() {
    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect) return;
    const vpScale = zoom / RESOLUTION_FACTOR;
    // Center the origin (0, 0) of the chalk canvas in the viewport
    const newPanX = rect.width / (2 * vpScale);
    const newPanY = rect.height / (2 * vpScale);
    handleViewportChange(zoom, newPanX, newPanY);
  }

  // --- Drag-and-drop from sidebar ---
  const [isDragOver, setIsDragOver] = useState(false);

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
    if (!itemType || itemType !== "sticky-note") return;

    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect) return;
    const canvasX = RESOLUTION_FACTOR * (e.clientX - rect.left) / zoom - panX;
    const canvasY = RESOLUTION_FACTOR * (e.clientY - rect.top) / zoom - panY;

    handleAddStickyNoteAt(canvasX, canvasY);
  }

  // --- Auto-save drawing (debounced) ---
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flushSave = useCallback(() => {
    if (!boardId || !canvasRef.current) return;
    const json = canvasRef.current.toJSON();
    if (json) {
      saveDrawing(boardId, { canvasJson: json }).catch(() => {
        // Silently fail
      });
    }
  }, [boardId]);

  const handleCanvasChange = useCallback(() => {
    if (!boardId || !canvasRef.current) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveTimerRef.current = null;
      flushSave();
    }, AUTO_SAVE_DELAY_MS);
  }, [boardId, flushSave]);

  // Cleanup: flush pending save on unmount so data is not lost when navigating away
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
        flushSave();
      }
    };
  }, [flushSave]);

  // --- Fetch all data on mount ---
  const fetchData = useCallback(async () => {
    if (!boardId) return;
    try {
      setError(null);
      const [boardRes, drawingRes, notesRes] = await Promise.allSettled([
        getBoardById(boardId),
        getDrawing(boardId),
        getNotes({ boardId, limit: 100 }),
      ]);

      if (boardRes.status === "fulfilled") {
        setBoard(boardRes.value);
      }
      if (drawingRes.status === "fulfilled") {
        const canvasJson = drawingRes.value.canvasJson;
        setInitialCanvasJson(canvasJson && canvasJson !== "{}" ? canvasJson : null);
      }
      if (notesRes.status === "fulfilled") {
        const items = notesRes.value.items;
        // Migrate old-format note positions (1x coords) to virtual canvas coords.
        // Old format: positions typically < 1200x900. New format uses 2x range.
        const migrated = items.map((n) => {
          const px = n.positionX ?? 0;
          const py = n.positionY ?? 0;
          const isOldFormat = px <= 1200 && py <= 900;
          if (isOldFormat) {
            return {
              ...n,
              positionX: px * RESOLUTION_FACTOR,
              positionY: py * RESOLUTION_FACTOR,
            };
          }
          return n;
        });
        setNotes(migrated);
      }

      if (
        boardRes.status === "rejected" &&
        drawingRes.status === "rejected" &&
        notesRes.status === "rejected"
      ) {
        setError("Failed to load board.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [boardId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Load canvas JSON after initial fetch
  useEffect(() => {
    if (initialCanvasJson && canvasRef.current) {
      canvasRef.current.loadFromJSON(initialCanvasJson);
      setInitialCanvasJson(null);
    }
  }, [initialCanvasJson]);

  // Push board name to navbar
  useEffect(() => {
    setBoardName(board?.name ?? null);
    return () => setBoardName(null);
  }, [board?.name, setBoardName]);

  // Register this board in the "Opened Boards" sidebar section
  useEffect(() => {
    if (board) {
      openBoard({ id: board.id, name: board.name, boardType: board.boardType });
    }
  }, [board, openBoard]);

  // Listen for sidebar tool clicks
  useEffect(() => {
    function onToolClick(e: Event) {
      const type = (e as CustomEvent).detail?.type as string | undefined;
      if (type === "sticky-note") {
        handleAddStickyNote();
      }
    }
    document.addEventListener("board-tool-click", onToolClick);
    return () => document.removeEventListener("board-tool-click", onToolClick);
  });

  // --- Mode & tool handlers ---
  function handleModeChange(newMode: ChalkMode) {
    setMode(newMode);
    if (newMode === "draw") {
      setEditingNoteId(null);
      canvasRef.current?.setDrawingMode(true);
      if (tool === "eraser") {
        canvasRef.current?.setEraserMode(true);
      }
    } else {
      canvasRef.current?.setDrawingMode(false);
    }
  }

  function handleToolChange(newTool: ChalkTool) {
    setTool(newTool);
    if (newTool === "eraser") {
      canvasRef.current?.setEraserMode(true);
    } else {
      canvasRef.current?.setEraserMode(false);
      canvasRef.current?.setBrushColor(brushColor);
    }
  }

  function handleBrushColorChange(color: string) {
    setBrushColor(color);
    canvasRef.current?.setBrushColor(color);
  }

  function handleBrushSizeChange(size: number) {
    setBrushSize(size);
    canvasRef.current?.setBrushSize(size);
  }

  // --- Sticky note handlers ---
  async function handleAddStickyNote() {
    // Place near center of current viewport
    const rect = viewportRef.current?.getBoundingClientRect();
    const centerX = rect ? RESOLUTION_FACTOR * (rect.width / 2) / zoom - panX : 400;
    const centerY = rect ? RESOLUTION_FACTOR * (rect.height / 2) / zoom - panY : 300;
    const positionX = centerX - 135 + Math.random() * 100;
    const positionY = centerY - 135 + Math.random() * 100;
    await handleAddStickyNoteAt(positionX, positionY);
  }

  async function handleAddStickyNoteAt(positionX: number, positionY: number) {
    if (!boardId) return;
    try {
      const created = await createNote({
        content: "",
        boardId,
        positionX,
        positionY,
      });

      setNotes((prev) => [...prev, created]);
      setEditingNoteId(created.id);
      setMode("select");
      canvasRef.current?.setDrawingMode(false);
    } catch {
      // Silently fail
    }
  }

  async function handleDragStop(id: string, x: number, y: number) {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, positionX: x, positionY: y } : n)),
    );
    try {
      await patchNote(id, { positionX: x, positionY: y });
    } catch {
      // Silently fail
    }
  }

  async function handleSave(id: string, title: string, content: string) {
    setEditingNoteId(null);
    setNotes((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, title: title || null, content } : n,
      ),
    );
    try {
      await patchNote(id, {
        patchTitle: true,
        title: title || null,
        content: content || undefined,
      });
    } catch {
      // Silently fail
    }
  }

  function handleStartEdit(id: string) {
    setEditingNoteId(id);
    bringToFront(id);
  }

  async function handleResize(id: string, width: number, height: number) {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, width, height } : n)),
    );
    try {
      await patchNote(id, { width, height });
    } catch {
      // Silently fail
    }
  }

  async function handleColorChange(id: string, color: string) {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, color } : n)),
    );
    try {
      await patchNote(id, { color });
    } catch {
      // Silently fail
    }
  }

  async function handleRotationChange(id: string, rotation: number) {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, rotation } : n)),
    );
    try {
      await patchNote(id, { rotation });
    } catch {
      // Silently fail
    }
  }

  async function handleDelete(id: string) {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (editingNoteId === id) {
      setEditingNoteId(null);
    }
    try {
      await deleteNote(id);
    } catch {
      fetchData();
    }
  }

  // --- Render ---
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center" style={{ backgroundColor: CHALKBOARD_BG }}>
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/40 border-t-transparent" />
          <span className="text-sm text-white/60">Loading your chalkboard...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center" style={{ backgroundColor: CHALKBOARD_BG }}>
        <div className="text-center">
          <p className="mb-2 text-sm text-red-400">{error}</p>
          <button
            type="button"
            onClick={fetchData}
            className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const cursorClass = isPanning ? "cursor-grabbing" : isSpaceHeld ? "cursor-grab" : "";

  return (
    <div className="relative h-full w-full chalkboard-frame">
      {/* Viewport (clips and captures pan/zoom events) */}
      <div
        ref={viewportRef}
        className={[
          "chalkboard-surface relative h-full w-full overflow-hidden",
          isDragOver ? "ring-2 ring-inset ring-white/20" : "",
          cursorClass,
        ].join(" ")}
        style={{ backgroundColor: CHALKBOARD_BG }}
        onMouseDown={handleViewportMouseDown}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Layer 1: Drawing canvas (uses fabric.js viewport transform for zoom/pan) */}
        <ChalkCanvas
          ref={canvasRef}
          isActive={mode === "draw" && !isSpaceHeld && !isPanning}
          brushColor={brushColor}
          brushSize={brushSize}
          zoom={zoom}
          panX={panX}
          panY={panY}
          onChange={handleCanvasChange}
        />

        {/* Layer 2: Sticky notes (uses CSS transform for zoom/pan, matches Fabric viewport) */}
        <div
          className="absolute origin-top-left"
          style={{
            transform: `scale(${zoom / RESOLUTION_FACTOR}) translate(${panX}px, ${panY}px)`,
            width: "10000px",
            height: "10000px",
            pointerEvents: mode === "select" && !isSpaceHeld && !isPanning ? "auto" : "none",
          }}
        >
          {notes.map((note) => (
            <StickyNote
              key={note.id}
              note={note}
              isEditing={note.id === editingNoteId}
              zIndex={zIndexMap[note.id] ?? 0}
              onDragStop={handleDragStop}
              onDelete={handleDelete}
              onStartEdit={handleStartEdit}
              onSave={handleSave}
              onResize={handleResize}
              onColorChange={handleColorChange}
              onRotationChange={handleRotationChange}
              onBringToFront={bringToFront}
              zoom={zoom / RESOLUTION_FACTOR}
            />
          ))}
        </div>
      </div>

      {/* Zoom controls (bottom-left, outside canvas transform) */}
      <div className="absolute bottom-4 left-4 z-20">
        <ZoomControls
          zoom={zoom}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onReset={handleZoomReset}
          onCenterView={handleCenterView}
        />
      </div>

      {/* Chalk toolbar (bottom-center) */}
      <ChalkToolbar
        mode={mode}
        tool={tool}
        brushColor={brushColor}
        brushSize={brushSize}
        onModeChange={handleModeChange}
        onToolChange={handleToolChange}
        onBrushColorChange={handleBrushColorChange}
        onBrushSizeChange={handleBrushSizeChange}
        onUndo={() => canvasRef.current?.undo()}
        onRedo={() => canvasRef.current?.redo()}
        onClear={() => canvasRef.current?.clear()}
        onAddStickyNote={handleAddStickyNote}
      />
    </div>
  );
}
