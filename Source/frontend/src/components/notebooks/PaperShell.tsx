import type { ReactNode } from "react";

/** Letter width at ~96dpi (8.5in * 96). Use A4 (794px) by changing this constant. */
const PAPER_WIDTH_PX = 816;
/** 11in * 96 */
const PAPER_MIN_HEIGHT_PX = 1056;
/** 1in margins */
const MARGIN_PX = 96;

interface PaperShellProps {
  children: ReactNode;
  /** Optional: repeat-y gradient every page height for visual page separators */
  showPageSeparators?: boolean;
}

export function PaperShell({ children, showPageSeparators = false }: PaperShellProps) {
  return (
    <div className="w-full flex justify-center py-10 bg-zinc-100 dark:bg-zinc-800/50">
      <div
        className={[
          "bg-white dark:bg-zinc-900 shadow-lg rounded-sm min-h-[1056px]",
          showPageSeparators
            ? "[background-image:linear-gradient(to_bottom,transparent_0,transparent_1055px,rgba(0,0,0,0.06)_1056px)] [background-size:100%_1056px] [background-repeat:repeat-y] dark:[background-image:linear-gradient(to_bottom,transparent_0,transparent_1055px,rgba(255,255,255,0.06)_1056px)]"
            : "",
        ].join(" ")}
        style={{
          width: PAPER_WIDTH_PX,
          minHeight: PAPER_MIN_HEIGHT_PX,
          paddingLeft: MARGIN_PX,
          paddingRight: MARGIN_PX,
          paddingTop: MARGIN_PX,
          paddingBottom: MARGIN_PX,
        }}
      >
        {children}
      </div>
    </div>
  );
}
