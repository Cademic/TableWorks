import { useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from "react";
import { Canvas, PencilBrush } from "fabric";

export interface ChalkCanvasHandle {
  setBrushColor: (color: string) => void;
  setBrushSize: (size: number) => void;
  setDrawingMode: (enabled: boolean) => void;
  setEraserMode: (enabled: boolean) => void;
  undo: () => void;
  redo: () => void;
  clear: () => void;
  toJSON: () => string;
  loadFromJSON: (json: string) => Promise<void>;
  applyViewport: (zoom: number, panX: number, panY: number) => void;
}

interface ChalkCanvasProps {
  isActive: boolean;
  brushColor?: string;
  brushSize?: number;
  zoom?: number;
  panX?: number;
  panY?: number;
  onChange?: () => void;
}

export const CHALKBOARD_BG = "#2d4a3e";

export const ChalkCanvas = forwardRef<ChalkCanvasHandle, ChalkCanvasProps>(
  function ChalkCanvas(
    { isActive, brushColor = "#ffffff", brushSize = 3, zoom = 1, panX = 0, panY = 0, onChange },
    ref,
  ) {
    const canvasElRef = useRef<HTMLCanvasElement>(null);
    const fabricRef = useRef<Canvas | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const undoStackRef = useRef<string[]>([]);
    const redoStackRef = useRef<string[]>([]);
    const isLoadingRef = useRef(false);
    const isEraserRef = useRef(false);
    const currentColorRef = useRef(brushColor);
    const currentSizeRef = useRef(brushSize);

    // Keep refs in sync
    currentColorRef.current = brushColor;
    currentSizeRef.current = brushSize;

    // Initialize fabric canvas
    useEffect(() => {
      if (!canvasElRef.current || fabricRef.current) return;

      const canvas = new Canvas(canvasElRef.current, {
        isDrawingMode: true,
        backgroundColor: CHALKBOARD_BG,
        width: containerRef.current?.clientWidth ?? 800,
        height: containerRef.current?.clientHeight ?? 600,
        selection: false,
      });

      const brush = new PencilBrush(canvas);
      brush.color = currentColorRef.current;
      brush.width = currentSizeRef.current;
      brush.strokeLineCap = "round";
      brush.strokeLineJoin = "round";
      canvas.freeDrawingBrush = brush;

      fabricRef.current = canvas;

      // Save initial state to undo stack
      undoStackRef.current = [JSON.stringify(canvas.toJSON())];

      return () => {
        canvas.dispose();
        fabricRef.current = null;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Listen for path:created to push undo state
    useEffect(() => {
      const canvas = fabricRef.current;
      if (!canvas) return;

      function handlePathCreated() {
        if (isLoadingRef.current) return;
        const json = JSON.stringify(canvas!.toJSON());
        undoStackRef.current.push(json);
        redoStackRef.current = [];
        onChange?.();
      }

      canvas.on("path:created" as "path:created", handlePathCreated);
      return () => {
        canvas.off("path:created" as "path:created", handlePathCreated);
      };
    }, [onChange]);

    // Resize canvas when container resizes
    useEffect(() => {
      const container = containerRef.current;
      const canvas = fabricRef.current;
      if (!container || !canvas) return;

      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          if (width > 0 && height > 0) {
            canvas.setDimensions({ width, height });
            canvas.renderAll();
          }
        }
      });

      resizeObserver.observe(container);
      return () => resizeObserver.disconnect();
    }, []);

    // Sync fabric viewport transform with zoom/pan props
    useEffect(() => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      // fabric viewportTransform: [scaleX, skewX, skewY, scaleY, translateX, translateY]
      canvas.setViewportTransform([zoom, 0, 0, zoom, zoom * panX, zoom * panY]);
      canvas.renderAll();
    }, [zoom, panX, panY]);

    // Toggle pointer events based on isActive
    useEffect(() => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      if (isActive) {
        canvas.isDrawingMode = true;
      }
    }, [isActive]);

    // Update brush color
    useEffect(() => {
      const canvas = fabricRef.current;
      if (!canvas?.freeDrawingBrush || isEraserRef.current) return;
      canvas.freeDrawingBrush.color = brushColor;
    }, [brushColor]);

    // Update brush size
    useEffect(() => {
      const canvas = fabricRef.current;
      if (!canvas?.freeDrawingBrush) return;
      canvas.freeDrawingBrush.width = brushSize;
    }, [brushSize]);

    const setBrushColor = useCallback((color: string) => {
      const canvas = fabricRef.current;
      if (!canvas?.freeDrawingBrush) return;
      isEraserRef.current = false;
      canvas.freeDrawingBrush.color = color;
      canvas.isDrawingMode = true;
    }, []);

    const setBrushSizeFn = useCallback((size: number) => {
      const canvas = fabricRef.current;
      if (!canvas?.freeDrawingBrush) return;
      canvas.freeDrawingBrush.width = size;
    }, []);

    const setDrawingMode = useCallback((enabled: boolean) => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      canvas.isDrawingMode = enabled;
      if (enabled) {
        isEraserRef.current = false;
        canvas.freeDrawingBrush!.color = currentColorRef.current;
      }
    }, []);

    const setEraserMode = useCallback((enabled: boolean) => {
      const canvas = fabricRef.current;
      if (!canvas?.freeDrawingBrush) return;
      isEraserRef.current = enabled;
      if (enabled) {
        canvas.isDrawingMode = true;
        canvas.freeDrawingBrush.color = CHALKBOARD_BG;
        canvas.freeDrawingBrush.width = Math.max(currentSizeRef.current * 3, 20);
      } else {
        canvas.freeDrawingBrush.color = currentColorRef.current;
        canvas.freeDrawingBrush.width = currentSizeRef.current;
      }
    }, []);

    const applyViewport = useCallback((z: number, px: number, py: number) => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      canvas.setViewportTransform([z, 0, 0, z, z * px, z * py]);
      canvas.renderAll();
    }, []);

    const undo = useCallback(() => {
      const canvas = fabricRef.current;
      if (!canvas || undoStackRef.current.length <= 1) return;

      const current = undoStackRef.current.pop()!;
      redoStackRef.current.push(current);

      const previous = undoStackRef.current[undoStackRef.current.length - 1];
      isLoadingRef.current = true;
      canvas.loadFromJSON(JSON.parse(previous)).then(() => {
        canvas.renderAll();
        isLoadingRef.current = false;
        onChange?.();
      });
    }, [onChange]);

    const redo = useCallback(() => {
      const canvas = fabricRef.current;
      if (!canvas || redoStackRef.current.length === 0) return;

      const next = redoStackRef.current.pop()!;
      undoStackRef.current.push(next);

      isLoadingRef.current = true;
      canvas.loadFromJSON(JSON.parse(next)).then(() => {
        canvas.renderAll();
        isLoadingRef.current = false;
        onChange?.();
      });
    }, [onChange]);

    const clear = useCallback(() => {
      const canvas = fabricRef.current;
      if (!canvas) return;

      canvas.clear();
      canvas.backgroundColor = CHALKBOARD_BG;
      canvas.renderAll();

      const json = JSON.stringify(canvas.toJSON());
      undoStackRef.current.push(json);
      redoStackRef.current = [];
      onChange?.();
    }, [onChange]);

    const toJSON = useCallback(() => {
      const canvas = fabricRef.current;
      if (!canvas) return "{}";
      return JSON.stringify(canvas.toJSON());
    }, []);

    const loadFromJSON = useCallback(async (json: string) => {
      const canvas = fabricRef.current;
      if (!canvas) return;

      isLoadingRef.current = true;
      try {
        const parsed = JSON.parse(json);
        await canvas.loadFromJSON(parsed);
        canvas.backgroundColor = CHALKBOARD_BG;
        canvas.renderAll();
        undoStackRef.current = [json];
        redoStackRef.current = [];
      } catch {
        // If JSON is invalid, keep the current state
      } finally {
        isLoadingRef.current = false;
      }
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        setBrushColor,
        setBrushSize: setBrushSizeFn,
        setDrawingMode,
        setEraserMode,
        undo,
        redo,
        clear,
        toJSON,
        loadFromJSON,
        applyViewport,
      }),
      [setBrushColor, setBrushSizeFn, setDrawingMode, setEraserMode, undo, redo, clear, toJSON, loadFromJSON, applyViewport],
    );

    return (
      <div
        ref={containerRef}
        className="absolute inset-0"
        style={{
          pointerEvents: isActive ? "auto" : "none",
          backgroundColor: CHALKBOARD_BG,
        }}
      >
        <canvas ref={canvasElRef} />
      </div>
    );
  },
);
