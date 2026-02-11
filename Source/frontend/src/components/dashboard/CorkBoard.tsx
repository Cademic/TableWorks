import { type ReactNode, useCallback, useState } from "react";

interface CorkBoardProps {
  children: ReactNode;
  boardRef?: React.RefObject<HTMLDivElement | null>;
  onDropItem?: (type: string, x: number, y: number) => void;
}

export function CorkBoard({ children, boardRef, onDropItem }: CorkBoardProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  // Bridges a RefObject (from useRef) to a callback ref that the DOM element accepts
  const setRef = useCallback(
    (el: HTMLDivElement | null) => {
      if (boardRef) {
        (boardRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
      }
    },
    [boardRef],
  );

  function handleDragOver(e: React.DragEvent) {
    if (!e.dataTransfer.types.includes("application/board-item-type")) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setIsDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    // Only react when leaving the board itself, not children
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragOver(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);

    const itemType = e.dataTransfer.getData("application/board-item-type");
    if (!itemType || !onDropItem) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    onDropItem(itemType, x, y);
  }

  return (
    <div className="relative h-full w-full corkboard-frame">
      <div
        ref={setRef}
        className={[
          "corkboard-surface absolute inset-0 overflow-hidden transition-shadow duration-150",
          isDragOver ? "ring-2 ring-inset ring-primary/40" : "",
        ].join(" ")}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {children}
      </div>
    </div>
  );
}
