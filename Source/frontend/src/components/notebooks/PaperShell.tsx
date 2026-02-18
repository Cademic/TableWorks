import type { ReactNode } from "react";

/** US Letter PDF page size at 96dpi: 8.5in × 11in. (A4 would be 794 × 1123.) */
const PAPER_WIDTH_PX = 816;   /* 8.5in × 96 */
const PAPER_HEIGHT_PX = 1056; /* 11in × 96 */
/** 1in margins (96px) – matches typical PDF/print. */
const MARGIN_PX = 96;
/** Gap at top of each page (screen only) – dark band so each page has a consistent gap above it. */
const GAP_HEIGHT_PX = 32;

interface PaperShellProps {
  children: ReactNode;
  /** Optional: repeat gap+page pattern – gap at top of each page, fixed page size */
  showPageSeparators?: boolean;
  /** Gap height in px at top of each page. Default 32. */
  gapHeight?: number;
}

export function PaperShell({ children, showPageSeparators = false, gapHeight = GAP_HEIGHT_PX }: PaperShellProps) {
  const repeatHeightPx = gapHeight + PAPER_HEIGHT_PX;

  /* Pattern: gap at top (0..gapHeight), then page (gapHeight..repeatHeightPx). Same for overlay. */
  const gapThenPageGradient = showPageSeparators
    ? `linear-gradient(to bottom, var(--page-gap-bg) 0, var(--page-gap-bg) ${gapHeight}px, transparent ${gapHeight}px, transparent ${repeatHeightPx}px)`
    : undefined;
  const innerPageGradient = showPageSeparators
    ? `linear-gradient(to bottom, transparent 0, transparent ${gapHeight}px, #fff ${gapHeight}px, #fff ${repeatHeightPx}px)`
    : undefined;

  return (
    <div
      className={`paper-shell-outer w-full flex justify-center py-10 ${showPageSeparators ? "bg-neutral-950" : "bg-zinc-200 dark:bg-zinc-950"}`}
      style={
        showPageSeparators
          ? ({ "--page-gap-bg": "#0a0a0a" } as React.CSSProperties)
          : undefined
      }
    >
      <div
        className={`paper-shell relative ${showPageSeparators ? "bg-neutral-950" : "bg-white dark:bg-zinc-900"}`}
        style={{
          width: PAPER_WIDTH_PX,
          maxWidth: PAPER_WIDTH_PX,
          minHeight: showPageSeparators ? repeatHeightPx : PAPER_HEIGHT_PX,
          paddingLeft: MARGIN_PX,
          paddingRight: MARGIN_PX,
          /* First page: gap (32px) then 96px white at top; subsequent pages get same top space via margin overlays. */
          paddingTop: showPageSeparators ? gapHeight + MARGIN_PX : MARGIN_PX,
          paddingBottom: MARGIN_PX,
          ...(showPageSeparators && innerPageGradient && {
            backgroundImage: innerPageGradient,
            backgroundSize: `100% ${repeatHeightPx}px`,
            backgroundRepeat: "repeat-y",
          }),
        }}
        data-page-height={PAPER_HEIGHT_PX}
        data-gap-height={gapHeight}
      >
        {children}
        {showPageSeparators && gapThenPageGradient && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage: gapThenPageGradient,
              backgroundSize: `100% ${repeatHeightPx}px`,
              backgroundRepeat: "repeat-y",
            }}
          />
        )}
      </div>
    </div>
  );
}
