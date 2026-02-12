# Session Summary — February 11, 2026 (Part 2)

This document covers all features implemented, UI refinements, and bug fixes completed during the second half of the February 11 development session.

---

## Table of Contents

- [1. Navbar Board Name Integration](#1-navbar-board-name-integration)
- [2. Red String SVG Clipping Fix](#2-red-string-svg-clipping-fix)
- [3. Board Frame Overhaul (CorkBoard + ChalkBoard)](#3-board-frame-overhaul-corkboard--chalkboard)
- [4. Sidebar — Opened Boards Section](#4-sidebar--opened-boards-section)
- [5. Auto-Close Board on Delete](#5-auto-close-board-on-delete)
- [Files Created](#files-created)
- [Files Modified](#files-modified)

---

## 1. Navbar Board Name Integration

### Problem

The board name was displayed inside a custom overlay header within `NoteBoardPage`, sitting on top of the CorkBoard with `pt-10` padding to make room. This was inconsistent with the rest of the app where the top Navbar serves as the page title bar. The Navbar always showed a static "Dashboard" label regardless of which page was active.

### Solution

Moved the board name and back-to-dashboard breadcrumb into the shared `Navbar` component and made it route-aware.

#### `Navbar.tsx`

- Uses `useLocation` to detect the current route
- On board pages (`/boards/:boardId`): displays a clickable "Dashboard" back button with a left arrow, a `/` separator, and the board name
- On all other pages: displays the appropriate page title (Dashboard, Projects, Calendars, Settings) based on the route path
- Accepts a `boardName` prop from the parent layout

#### `AppLayout.tsx`

- Added `boardName` state and `setBoardName` setter
- Passes `boardName` as a prop to `Navbar`
- Exports `AppLayoutContext` interface with `setBoardName`
- Passes `{ setBoardName }` to child routes via React Router's `Outlet` context

#### `NoteBoardPage.tsx`

- Uses `useOutletContext<AppLayoutContext>()` to call `setBoardName`
- An effect pushes `board?.name` to the navbar whenever it changes
- Cleanup resets `boardName` to `null` on unmount
- Removed the in-page overlay header (back button, divider, board name)
- Removed `pt-10` padding from the board content area
- Cleaned up unused imports (`useNavigate`, `ArrowLeft`)

---

## 2. Red String SVG Clipping Fix

### Problem

Red string connections between notes/cards were invisibly clipped at an internal boundary. Notes and index cards (HTML `<div>` elements) could cross this boundary freely, but the SVG `<path>` elements rendering the strings could not — parts of the strings simply vanished.

### Root Cause

The `<svg>` element in `RedStringLayer` had a default `overflow: hidden` (the SVG spec default for root `<svg>` elements). This created an invisible clipping rectangle at the SVG's viewport boundary. HTML `<div>` elements (notes, cards) are not subject to SVG overflow clipping, so they could extend beyond the boundary while the string paths could not.

### Fix

Changed the SVG element from:

```html
<svg style={{ width: "100%", height: "100%" }}>
```

To:

```html
<svg width="100%" height="100%" overflow="visible">
```

- `overflow="visible"` disables SVG viewport clipping, allowing paths to render at any coordinate regardless of the SVG's internal boundary
- Switched from CSS `style` to SVG attributes for `width`/`height` for more predictable SVG sizing behavior

### Files Modified

- `Source/frontend/src/components/dashboard/RedStringLayer.tsx`

---

## 3. Board Frame Overhaul (CorkBoard + ChalkBoard)

### Problem

Both the CorkBoard (Note Board) and ChalkBoard had wooden frame borders with visual artifacts:

1. **Corner seam lines** — The original `border-image: linear-gradient(...)` technique sliced the gradient into 9 sections, creating visible lines where the corner pieces met
2. **Layout interference** — The CSS `border: 12px` on `.corkboard-frame` reduced the viewport's content area by 24px in each dimension, which contributed to the red string clipping issue
3. **ChalkBoard had its own separate frame** — Four individual plank `<div>` elements with inline styles, also producing corner seam artifacts

### Approaches Tried and Abandoned

| Approach | Why It Failed |
|----------|---------------|
| `border-image: linear-gradient(...)` | Corner seam lines where gradient slices meet |
| `::after` pseudo-element with `mask-composite: exclude` | Still produced faint lines at miter joints |
| `::after` pseudo-element with inset `box-shadow` rings | Pseudo-element didn't render visibly (no background = no visible shadow layer) |
| Real `<div>` overlay with inset `box-shadow` rings | Worked but was complex and still showed faint artifacts in some renderers |

### Final Solution — Padding-Based Frame

Replaced all border/overlay techniques with a fundamentally different approach: the frame is simply the **parent element's background showing through padding**.

```
┌─ Frame (wood gradient background, 12px padding) ──────┐
│  ┌─ Viewport (board surface, fills content area) ────┐ │
│  │                                                    │ │
│  │          board content here                        │ │
│  │                                                    │ │
│  └────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────┘
```

Since there are no CSS borders, no pseudo-elements, and no overlays, there are **zero corners to render** — just one seamless continuous gradient background.

#### CorkBoard Frame (`.corkboard-frame`)

```css
.corkboard-frame {
  position: relative;
  padding: 12px;
  border-radius: 5px;
  background:
    /* Subtle vertical wood-grain lines */
    repeating-linear-gradient(90deg, transparent, transparent 30px,
      rgba(0,0,0,0.04) 30px, rgba(0,0,0,0.04) 31px),
    /* Base wood gradient */
    linear-gradient(160deg, #a67c52 0%, #8b5e3c 15%, #7a4f30 30%,
      #6b4226 50%, #7a4f30 70%, #8b5e3c 85%, #a67c52 100%);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.15),  /* top highlight */
    inset 0 -1px 0 rgba(0,0,0,0.2),        /* bottom shadow */
    0 4px 16px rgba(0,0,0,0.3),             /* outer drop shadow */
    0 2px 4px rgba(0,0,0,0.15);
}
```

#### CorkBoard Surface (`.corkboard-surface`)

- `border-radius: 2px` for slightly rounded inner edges
- `box-shadow: inset 0 0 8px 2px rgba(0,0,0,0.3)` for recessed depth effect
- Viewport changed from `absolute inset-0` to `relative h-full w-full` so it respects the parent's padding

#### ChalkBoard Frame (`.chalkboard-frame`)

- Uses the same gradient and box-shadow approach as the CorkBoard
- Replaced the four separate plank `<div>` elements and inner shadow overlay (6 elements total) with a single CSS class on the parent
- Viewport changed from hardcoded inline styles to a `.chalkboard-surface` class

#### Dark Mode

Both `.dark .corkboard-frame` and `.dark .chalkboard-frame` use darker wood-tone gradients with adjusted shadows.

### Files Modified

- `Source/frontend/src/index.css` — Rewrote `.corkboard-frame`, `.corkboard-surface`, added `.chalkboard-frame`, `.chalkboard-surface`, plus dark mode variants
- `Source/frontend/src/components/dashboard/CorkBoard.tsx` — Changed viewport from `absolute inset-0` to `relative h-full w-full`, removed overlay div
- `Source/frontend/src/pages/ChalkBoardPage.tsx` — Replaced 6 inline-styled frame divs with a single `.chalkboard-frame` class

---

## 4. Sidebar — Opened Boards Section

### Problem

Users had no way to quickly switch between boards they were working on. Navigating to a board required going back to the Dashboard each time. The sidebar also had a "Chalk Boards" navigation item that was redundant.

### Solution

#### Removed "Chalk Boards" from Navigation

- Removed from the `NAV_ITEMS` array in `Sidebar.tsx`
- Sidebar navigation is now: Dashboard, Projects, Calendars, Settings

#### New "Opened Boards" Section

Added a dynamic section between the main navigation and the Board Tools that tracks boards the user has visited.

**How it works:**

1. When a user navigates to any board page (`NoteBoardPage` or `ChalkBoardPage`), the page calls `openBoard({ id, name, boardType })` via the Outlet context
2. The board appears in the sidebar's "Opened Boards" list
3. The user can click any board in the list to switch to it instantly
4. Each board has a hover-revealed **X** button to close/remove it from the list
5. If the user closes the currently active board, they're navigated back to the Dashboard
6. If too many boards are open, the section scrolls independently with a thin 4px custom scrollbar (`max-h-48` with `overflow-y-auto`)

**Visual details:**

- Each entry shows a type-specific icon (clipboard for NoteBoard, pen for ChalkBoard) and the board name
- The currently viewed board is highlighted with amber styling (matching the active nav item style)
- When the sidebar is collapsed, only the type icons are visible
- Section header reads "Opened Boards" (expanded) or "Open" (collapsed)

#### State Management (`AppLayout.tsx`)

New exports added to `AppLayoutContext`:

```typescript
interface OpenedBoard {
  id: string;
  name: string;
  boardType: string;
}

interface AppLayoutContext {
  setBoardName: (name: string | null) => void;
  openBoard: (board: OpenedBoard) => void;
  closeBoard: (id: string) => void;
  openedBoards: OpenedBoard[];
}
```

- `openBoard` — adds a board to the list (or updates its name if already present)
- `closeBoard` — removes a board from the list by ID
- State is managed in `AppLayout` and passed to `Sidebar` via props and to child routes via Outlet context

#### Custom Scrollbar (`index.css`)

Added `.scrollbar-thin` utility class:

- `scrollbar-width: thin` for Firefox
- 4px wide `-webkit-scrollbar` for Chrome/Edge/Safari
- Translucent thumb with dark mode support

### Files Modified

- `Source/frontend/src/components/layout/AppLayout.tsx` — Added `OpenedBoard` interface, `openBoard`/`closeBoard` callbacks, passed to Sidebar and Outlet
- `Source/frontend/src/components/layout/Sidebar.tsx` — Removed "Chalk Boards" nav item, added "Opened Boards" section with board links, close buttons, scrolling
- `Source/frontend/src/pages/NoteBoardPage.tsx` — Calls `openBoard()` when board data loads
- `Source/frontend/src/pages/ChalkBoardPage.tsx` — Calls `openBoard()` when board data loads
- `Source/frontend/src/index.css` — Added `.scrollbar-thin` utility

---

## 5. Auto-Close Board on Delete

### Problem

If a user had a board open in the sidebar's "Opened Boards" list and then deleted that board from the Dashboard, the board would remain as a stale entry in the sidebar.

### Solution

Added a `closeBoard(id)` call inside `DashboardPage`'s `confirmDelete` function, which runs immediately when a board is deleted (before the API call). This ensures the board is removed from the sidebar's opened boards list at the same time it's removed from the dashboard grid.

### Files Modified

- `Source/frontend/src/pages/DashboardPage.tsx` — Added `useOutletContext` import, destructured `closeBoard`, and calls `closeBoard(id)` in `confirmDelete`

---

## Files Created

None — all changes were modifications to existing files.

---

## Files Modified

| File | Changes |
|------|---------|
| `src/components/layout/Navbar.tsx` | Route-aware page title, board name breadcrumb with back button |
| `src/components/layout/AppLayout.tsx` | `OpenedBoard` interface, `openBoard`/`closeBoard` state management, expanded Outlet context |
| `src/components/layout/Sidebar.tsx` | Removed "Chalk Boards" nav, added "Opened Boards" section with scrolling and close buttons |
| `src/components/dashboard/RedStringLayer.tsx` | Added `overflow="visible"` to SVG, switched to SVG attributes for width/height |
| `src/components/dashboard/CorkBoard.tsx` | Viewport changed to `relative h-full w-full`, removed frame overlay div |
| `src/pages/NoteBoardPage.tsx` | Removed in-page header, uses Outlet context for navbar title and opened boards registration |
| `src/pages/ChalkBoardPage.tsx` | Replaced 6 inline-styled frame divs with CSS class, registers in opened boards |
| `src/pages/DashboardPage.tsx` | Calls `closeBoard` on delete to sync sidebar |
| `src/index.css` | Rewrote corkboard frame styles (padding-based), added chalkboard frame styles, added `.scrollbar-thin` utility |

---

## Technical Decisions

### Why padding-based frames instead of CSS borders?

CSS borders interact with layout (`border` adds to the element's box size and affects `inset: 0` positioning of children). The `border-image` property further complicates this by slicing the gradient into 9 regions with visible corner seams. By using the parent's `background` + `padding`, the "border" is just visible background — a single continuous gradient with no seams, no layout interference, and no clipping side-effects.

### Why `overflow="visible"` on the SVG?

The SVG spec defaults `overflow` to `hidden` for root `<svg>` elements, which creates a hard clipping rectangle. HTML elements (notes, cards) inside the same parent div are not affected by SVG clipping rules. Setting `overflow="visible"` ensures the red string paths can render at any coordinate, matching the behavior of the HTML elements they connect.

### Why track opened boards in component state rather than localStorage?

The opened boards list is a session-level concept — it represents what the user is currently working on in this tab/session. Using React state (in `AppLayout`) keeps it ephemeral: it starts fresh on page load and doesn't persist stale entries across sessions. This matches the behavior of "open tabs" in tools like VS Code or browser tab groups.
