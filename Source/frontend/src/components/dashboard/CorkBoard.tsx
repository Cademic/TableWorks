import { type ReactNode, useCallback } from "react";

interface CorkBoardProps {
  children: ReactNode;
  boardRef?: React.RefObject<HTMLDivElement | null>;
}

export function CorkBoard({ children, boardRef }: CorkBoardProps) {
  // Bridges a RefObject (from useRef) to a callback ref that the DOM element accepts
  const setRef = useCallback(
    (el: HTMLDivElement | null) => {
      if (boardRef) {
        (boardRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
      }
    },
    [boardRef],
  );

  return (
    <div className="relative h-full w-full corkboard-frame">
      <div
        ref={setRef}
        className="corkboard-surface absolute inset-0 overflow-hidden"
      >
        {children}
      </div>
    </div>
  );
}
