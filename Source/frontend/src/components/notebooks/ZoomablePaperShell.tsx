import { useEffect, useRef, useState, type ReactNode } from "react";

interface ZoomablePaperShellProps {
  children: ReactNode;
  /** Minimum zoom level (e.g., 0.5 = 50%) */
  minZoom?: number;
  /** Maximum zoom level (e.g., 2 = 200%) */
  maxZoom?: number;
  /** Initial zoom level */
  initialZoom?: number;
}

export function ZoomablePaperShell({
  children,
  minZoom = 0.5,
  maxZoom = 2,
  initialZoom = 1,
}: ZoomablePaperShellProps) {
  const [zoom, setZoom] = useState(initialZoom);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastPinchDistanceRef = useRef<number | null>(null);

  // Handle Ctrl+scroll wheel zoom (desktop)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return; // Only zoom with Ctrl (or Cmd on Mac)
      e.preventDefault();
      e.stopPropagation();

      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom((prev) => {
        const newZoom = Math.max(minZoom, Math.min(maxZoom, prev + delta));
        return Math.round(newZoom * 100) / 100; // Round to 2 decimals
      });
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [minZoom, maxZoom]);

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
        setZoom((prev) => {
          const newZoom = Math.max(minZoom, Math.min(maxZoom, prev + zoomDelta));
          return Math.round(newZoom * 100) / 100;
        });
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
  }, [minZoom, maxZoom]);

  return (
    <div
      ref={containerRef}
      className="zoomable-paper-container overflow-auto w-full h-full flex justify-center items-start p-5 bg-background"
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
    </div>
  );
}
