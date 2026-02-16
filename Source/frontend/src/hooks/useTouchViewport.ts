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
    | {
        type: "pan";
        x: number;
        y: number;
        panX: number;
        panY: number;
        initialDistance?: number;
        initialMidpoint?: { x: number; y: number };
      }
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

      // Only handle 2-finger gestures (pan and pinch zoom)
      // 1-finger touches pass through for drawing and moving sticky notes
      if (touchCount === 2) {
        const t1 = touches[0];
        const t2 = touches[1];
        const rect = viewport!.getBoundingClientRect();
        const d0 = getDistance(t1, t2);
        const midpoint = getMidpoint(t1, t2, rect);

        // Start with pan mode (can switch to pinch if distance changes)
        touchModeRef.current = "pan";
        touchStartRef.current = {
          type: "pan",
          x: midpoint.x + rect.left,
          y: midpoint.y + rect.top,
          panX: panXRef.current,
          panY: panYRef.current,
          initialDistance: d0,
          initialMidpoint: midpoint,
        };
        onTouchPanStart?.();
      } else if (touchCount === 1 && touchModeRef.current !== null) {
        // If we had a 2-finger gesture and one finger lifted, end it
        if (touchModeRef.current === "pan") {
          onTouchPanEnd?.();
        }
        touchModeRef.current = null;
        touchStartRef.current = null;
      }
    }

    function handleTouchMove(e: TouchEvent) {
      const touches = e.touches;
      const touchCount = touches.length;
      const mode = touchModeRef.current;
      const start = touchStartRef.current;

      // Only handle 2-finger gestures
      if (!mode || !start || touchCount !== 2) {
        // If we're not handling a gesture, don't prevent default (let 1-finger touches pass through)
        return;
      }

      // Prevent default scrolling/zooming when we're handling 2-finger gesture
      e.preventDefault();

      const t1 = touches[0];
      const t2 = touches[1];
      const rect = viewport!.getBoundingClientRect();
      const currentDistance = getDistance(t1, t2);
      const currentMidpoint = getMidpoint(t1, t2, rect);
      const initialDistance = start.type === "pan" ? start.initialDistance : undefined;
      const initialMidpoint = start.type === "pan" ? start.initialMidpoint : undefined;

      // Detect if this is a pinch (distance changed significantly) or pan (distance stayed similar)
      const distanceChange = initialDistance ? Math.abs(currentDistance - initialDistance) / initialDistance : 0;
      const PINCH_THRESHOLD = 0.05; // 5% change indicates pinch

      if (mode === "pinch" && start.type === "pinch") {
        // Already in pinch mode - use pinch start state
        const scale = currentDistance / start.d0;
        const newZoom = clamp(start.zoom * scale, minZoom, maxZoom);

        // Adjust pan to keep the midpoint fixed
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
      } else if (distanceChange > PINCH_THRESHOLD && initialDistance && initialMidpoint && mode === "pan") {
        // Switch from pan to pinch mode - use current distance as pinch start
        touchModeRef.current = "pinch";
        const pinchStartZoom = zoomRef.current;
        const pinchStartPanX = panXRef.current;
        const pinchStartPanY = panYRef.current;
        
        touchStartRef.current = {
          type: "pinch",
          d0: currentDistance, // Use current distance as the base for pinch
          centerX: currentMidpoint.x,
          centerY: currentMidpoint.y,
          zoom: pinchStartZoom,
          panX: pinchStartPanX,
          panY: pinchStartPanY,
        };
        onTouchPanEnd?.();
        
        // No zoom change on switch - just establish the pinch baseline
        // The next touchmove will start zooming from this point
      } else if (mode === "pan" && start.type === "pan") {
        // Update pan (2-finger pan) - use midpoint movement
        const midpointX = currentMidpoint.x + rect.left;
        const midpointY = currentMidpoint.y + rect.top;
        const dx = (resolutionFactor * (midpointX - start.x)) / zoomRef.current;
        const dy = (resolutionFactor * (midpointY - start.y)) / zoomRef.current;
        const newPanX = start.panX + dx;
        const newPanY = start.panY + dy;
        onViewportChangeRef.current(zoomRef.current, newPanX, newPanY);
        
        // Update start position for next move (use current pan values)
        touchStartRef.current = {
          type: "pan",
          x: midpointX,
          y: midpointY,
          panX: newPanX,
          panY: newPanY,
          initialDistance: start.initialDistance,
          initialMidpoint: start.initialMidpoint,
        };
      }
    }

    function handleTouchEnd(e: TouchEvent) {
      const touches = e.touches;
      const touchCount = touches.length;

      if (touchCount < 2) {
        // Less than 2 fingers - end gesture (1 finger or 0 fingers)
        if (touchModeRef.current === "pan" || touchModeRef.current === "pinch") {
          onTouchPanEnd?.();
        }
        touchModeRef.current = null;
        touchStartRef.current = null;
      }
      // If touchCount >= 2, we still have 2+ fingers, so keep the gesture active
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
