import type { ReactNode } from "react";

interface CorkBoardProps {
  children: ReactNode;
}

export function CorkBoard({ children }: CorkBoardProps) {
  return (
    <div className="relative h-full w-full corkboard-frame">
      <div className="corkboard-surface absolute inset-0 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
