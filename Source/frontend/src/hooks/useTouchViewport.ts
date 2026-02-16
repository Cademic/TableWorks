import { useEffect, useRef } from "react";

interface UseTouchViewportOptions {
  resolutionFactor?: number;
  minZoom?: number;
  maxZoom?: number;
  onTouchPanStart?: () => void;
  onTouchPanEnd?: () => void;
}

export function useTouchViewport(
  viewportRef: React.RefObject<HTMLDivElement>,
  zoom: number,
  panX: number,
  panY: number,
  onViewportChange: (zoom: number, panX: number, panY: number) => void,
  options: UseTouchViewportOptions = {},
) {
  const {
    resolutionFactor = 1,
    minZoom = 0.25,
    maxZoom = 2.0,
    onTouchPanStart,
    onTouchPanEnd,
  } = options;

  const touchModeRef = useRef<"pan" | "pinch" | null>(null);
  const touchStartRef = useRef<
    | { type: "pan"; x: number; y: number; panX: number; panY: number }
    | {
        type: "pinch";
        d0: number;
        centerX: number;
        centerY: number;
        zoom: number;
        panX: number;
        panY: number;
      }
    | null
  >(null);

  // Keep refs updated with current values
  const zoomRef = useRef(zoom);
  const panXRef = useRef(panX);
  const panYRef = useRef(panY);
  const onViewportChangeRef = useRef(onViewportChange);

  useEffect(() => {
    zoomRef.current = zoom;
    panXRef.current = panX;
    panYRef.current = panY;
    onViewportChangeRef.current = onViewportChange;
  }, [zoom, panX, panY, onViewportChange]);

  function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
  }

  function getDistance(t1: Touch, t2: Touch): number {
    const dx = t2.clientX - t1.clientX;
    const dy = t2.clientY - t1.clientY;
    return Math.hypot(dx, dy);
  }

  function getMidpoint(t1: Touch, t2: Touch, rect: DOMRect): { x: number; y: number } {
    return {
      x: (t1.clientX + t2.clientX) / 2 - rect.left,
      y: (t1.clientY + t2.clientY) / 2 - rect.top,
    };
  }

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    function handleTouchStart(e: TouchEvent) {
      const touches = e.touches;
      const touchCount = touches.length;

      // If switching from pan to pinch, end pan gesture first
      if (touchModeRef.current === "pan" && touchCount === 2) {
        onTouchPanEnd?.();
      }

      if (touchCount === 1) {
        // Start pan gesture
        const touch = touches[0];
        touchModeRef.current = "pan";
        touchStartRef.current = {
          type: "pan",
          x: touch.clientX,
          y: touch.clientY,
          panX: panXRef.current,
          panY: panYRef.current,
        };
        onTouchPanStart?.();
      } else if (touchCount === 2) {
        // Start pinch gesture
        const t1 = touches[0];
        const t2 = touches[1];
        const rect = viewport!.getBoundingClientRect();
        const d0 = getDistance(t1, t2);
        const midpoint = getMidpoint(t1, t2, rect);

        touchModeRef.current = "pinch";
        touchStartRef.current = {
          type: "pinch",
          d0,
          centerX: midpoint.x,
          centerY: midpoint.y,
          zoom: zoomRef.current,
          panX: panXRef.current,
          panY: panYRef.current,
        };
      }
    }

    function handleTouchMove(e: TouchEvent) {
      const touches = e.touches;
      const touchCount = touches.length;
      const mode = touchModeRef.current;
      const start = touchStartRef.current;

      if (!mode || !start) return;

      // Prevent default scrolling/zooming when we're handling the gesture
      e.preventDefault();

      if (mode === "pan" && touchCount === 1 && start.type === "pan") {
        // Update pan
        const touch = touches[0];
        const dx = (resolutionFactor * (touch.clientX - start.x)) / zoomRef.current;
        const dy = (resolutionFactor * (touch.clientY - start.y)) / zoomRef.current;
        onViewportChangeRef.current(zoomRef.current, start.panX + dx, start.panY + dy);
      } else if (mode === "pinch" && touchCount === 2 && start.type === "pinch") {
        // Update zoom and pan
        const t1 = touches[0];
        const t2 = touches[1];
        const d1 = getDistance(t1, t2);
        const scale = d1 / start.d0;
        const newZoom = clamp(start.zoom * scale, minZoom, maxZoom);

        // Adjust pan to keep the midpoint fixed
        // For CorkBoard (resolutionFactor = 1): newPanX = panX + centerX*(1/newZoom - 1/zoom)
        // For ChalkBoard (resolutionFactor = 2): use vpScale = zoom / resolutionFactor
        if (resolutionFactor === 1) {
          const newPanX = start.panX + start.centerX * (1 / newZoom - 1 / start.zoom);
          const newPanY = start.panY + start.centerY * (1 / newZoom - 1 / start.zoom);
          onViewportChangeRef.current(newZoom, newPanX, newPanY);
        } else {
          const vpScale = start.zoom / resolutionFactor;
          const newVpScale = newZoom / resolutionFactor;
          const newPanX = start.panX + start.centerX * (1 / newVpScale - 1 / vpScale);
          const newPanY = start.panY + start.centerY * (1 / newVpScale - 1 / vpScale);
          onViewportChangeRef.current(newZoom, newPanX, newPanY);
        }
      }
    }

    function handleTouchEnd(e: TouchEvent) {
      const touches = e.touches;
      const touchCount = touches.length;

      if (touchCount === 0) {
        // All touches ended - clear gesture
        if (touchModeRef.current === "pan") {
          onTouchPanEnd?.();
        }
        touchModeRef.current = null;
        touchStartRef.current = null;
      } else if (touchCount === 1 && touchModeRef.current === "pinch") {
        // Pinch ended but one finger remains - switch to pan
        const touch = touches[0];
        touchModeRef.current = "pan";
        touchStartRef.current = {
          type: "pan",
          x: touch.clientX,
          y: touch.clientY,
          panX: panXRef.current,
          panY: panYRef.current,
        };
        onTouchPanStart?.();
      }
    }

    viewport.addEventListener("touchstart", handleTouchStart, { passive: false });
    viewport.addEventListener("touchmove", handleTouchMove, { passive: false });
    viewport.addEventListener("touchend", handleTouchEnd, { passive: false });
    viewport.addEventListener("touchcancel", handleTouchEnd, { passive: false });

    return () => {
      viewport.removeEventListener("touchstart", handleTouchStart);
      viewport.removeEventListener("touchmove", handleTouchMove);
      viewport.removeEventListener("touchend", handleTouchEnd);
      viewport.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, [viewportRef, resolutionFactor, minZoom, maxZoom, onTouchPanStart, onTouchPanEnd]);
}
