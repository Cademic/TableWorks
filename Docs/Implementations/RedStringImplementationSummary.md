# TableWorks – Red String Linking Implementation Summary

This document summarises the "Red String" feature implemented during this session, which allows users to visually link sticky notes together with red strings on the cork board — similar to a detective evidence board.

---

## Table of Contents

1. [Feature Overview](#1-feature-overview)
2. [Architecture](#2-architecture)
3. [Data Model](#3-data-model)
4. [Interaction Flow](#4-interaction-flow)
5. [RedStringLayer Component](#5-redstringlayer-component)
6. [StickyNote Pin Changes](#6-stickynote-pin-changes)
7. [DashboardPage Orchestration](#7-dashboardpage-orchestration)
8. [CorkBoard Changes](#8-corkboard-changes)
9. [Performance Optimisation](#9-performance-optimisation)
10. [Visual Design](#10-visual-design)
11. [File Inventory](#11-file-inventory)

---

## 1. Feature Overview

Users can click and hold on the coloured pin at the top of any sticky note, drag to another note's pin, and release to create a persistent red string connection between them. Connections are rendered as SVG paths with a catenary (hanging string) curve. Hovering over an established string reveals a delete button at its midpoint.

**Key behaviours:**

- Click-and-drag from pin to pin to create a connection.
- Dashed red preview line follows the cursor while linking is in progress.
- All other pins pulse and scale up to signal they are valid drop targets.
- Duplicate connections between the same pair of notes are prevented.
- Connections are automatically removed when either linked note is deleted.
- Strings follow notes in real-time during drag at native frame rate.
- Hover over a string to highlight it; click to delete.

---

## 2. Architecture

The feature is coordinated across four components with `DashboardPage` as the state owner:

```
DashboardPage (state: connections[], linkingFrom, linkMousePos)
├── CorkBoard (boardRef forwarded to corkboard-surface div)
│   ├── RedStringLayer (SVG overlay, rAF loop for fluid rendering)
│   └── StickyNote[] (pins with data-pin-note-id attributes)
```

- **DashboardPage** owns connection state and linking lifecycle (mousedown / mousemove / mouseup).
- **CorkBoard** exposes a `boardRef` so the SVG layer can convert screen coordinates to board-relative positions.
- **RedStringLayer** renders all strings via an absolutely-positioned SVG element and reads pin positions directly from the DOM each frame.
- **StickyNote** pins are made interactive with `onMouseDown` handlers and visual feedback.

---

## 3. Data Model

A new TypeScript interface was added to `Source/frontend/src/types/index.ts`:

```typescript
export interface NoteConnection {
  id: string;        // e.g. "conn-1"
  fromNoteId: string;
  toNoteId: string;
}
```

Connections are currently stored in React component state within `DashboardPage` (frontend-only, no backend persistence). Backend API support can be added in a future iteration.

---

## 4. Interaction Flow

1. **Mouse down on pin** — `onPinMouseDown` fires, setting `linkingFrom` to the source note ID. Document-level `mousemove` and `mouseup` listeners are attached.
2. **Mouse move** — `mousemove` updates `linkMousePos` with the board-relative cursor position. The `RedStringLayer` rAF loop picks this up and draws a dashed preview line from the source pin to the cursor.
3. **Hover over target pin** — Target pins display a scale + pulse animation via the `isLinking` prop and CSS `group-hover` utilities.
4. **Mouse up over a pin** — `document.elementFromPoint` resolves the element under the cursor; if it matches a `[data-pin-note-id]` element for a different note, a new `NoteConnection` is created. Duplicates are rejected.
5. **Mouse up elsewhere** — Linking is cancelled; the preview line disappears.
6. **Delete a note** — All connections involving that note are removed from state.
7. **Delete a connection** — Hover over a string to reveal a delete icon at the midpoint. Click the string or the icon to remove it.

---

## 5. RedStringLayer Component

**File:** `Source/frontend/src/components/dashboard/RedStringLayer.tsx`

A new component that renders an SVG overlay covering the entire cork board.

### Props

| Prop | Type | Description |
|------|------|-------------|
| `connections` | `NoteConnection[]` | Established connections to render |
| `linkingFrom` | `string \| null` | Source note ID during active linking |
| `mousePos` | `{ x, y } \| null` | Board-relative cursor position during linking |
| `boardRef` | `RefObject<HTMLDivElement \| null>` | Reference to the board container |
| `onDeleteConnection` | `(id: string) => void` | Callback to remove a connection |

### Rendering approach

- The SVG element is positioned `absolute inset-0` with `pointer-events: none` at `z-index: 5`.
- Each connection renders two `<path>` elements: an invisible wide hit-area (14px stroke, `pointer-events: stroke`) and a visible red 2px string.
- A persistent `<path data-link-line>` element is toggled visible/hidden for the in-progress linking preview.
- A `<foreignObject>` with an X icon appears at the string midpoint on hover.

### Catenary curve

Strings use SVG quadratic bezier paths (`Q` command). The control point is offset below the midpoint proportionally to horizontal distance, capped at 40px droop:

```typescript
const droop = 40 * Math.min(1, horizontalDistance / 300);
// Path: M fromX fromY Q midX (midY + droop) toX toY
```

---

## 6. StickyNote Pin Changes

**File:** `Source/frontend/src/components/dashboard/StickyNote.tsx`

### New props

| Prop | Type | Description |
|------|------|-------------|
| `onPinMouseDown` | `(noteId: string) => void` | Fires when pin is pressed to start linking |
| `isLinking` | `boolean` | True when any note on the board is being linked |

### Pin element changes

- Added `data-pin-note-id={note.id}` attribute for DOM-based position queries.
- Added `onMouseDown` handler with `stopPropagation` and `preventDefault` to avoid triggering drag or edit mode.
- Added a larger invisible hit-area (`absolute -inset-2`) around the 16px pin.
- Pin scales up on hover (`group-hover/pin:scale-150`) when `onPinMouseDown` is provided.
- During active linking (`isLinking`), all pins pulse (`animate-pulse`) and show a red ring on hover.

---

## 7. DashboardPage Orchestration

**File:** `Source/frontend/src/pages/DashboardPage.tsx`

### New state

```typescript
const [connections, setConnections] = useState<NoteConnection[]>([]);
const [linkingFrom, setLinkingFrom] = useState<string | null>(null);
const [linkMousePos, setLinkMousePos] = useState<{ x, y } | null>(null);
const boardRef = useRef<HTMLDivElement>(null);
```

### New handlers

| Handler | Purpose |
|---------|---------|
| `handlePinMouseDown(noteId)` | Sets `linkingFrom`, starts linking mode |
| `handleDeleteConnection(id)` | Removes a connection from state |

### Document-level listeners

A `useEffect` hook activates when `linkingFrom` is set:

- **`mousemove`** — Updates `linkMousePos` with board-relative coordinates.
- **`mouseup`** — Uses `document.elementFromPoint` + `closest('[data-pin-note-id]')` to detect a target pin. Creates a connection if valid; otherwise cancels. Cleans up both listeners on teardown.

### Connection cleanup on note delete

`handleDelete` was extended to filter out any connections that reference the deleted note.

---

## 8. CorkBoard Changes

**File:** `Source/frontend/src/components/dashboard/CorkBoard.tsx`

- Added an optional `boardRef` prop (`RefObject<HTMLDivElement | null>`).
- The ref is attached to the `corkboard-surface` inner div via a callback ref pattern to satisfy TypeScript's strict ref typing.
- This allows `RedStringLayer` and `DashboardPage` to compute board-relative coordinates from screen positions.

---

## 9. Performance Optimisation

### Initial approach (replaced)

The first implementation used a React state counter (`dragTick`) bumped on every `react-draggable` `onDrag` event to trigger position recalculation. This required two full React re-render cycles per frame:

```
onDrag → setDragTick → re-render → useEffect → rAF → DOM read → setPinPositions → re-render
```

### Final approach — imperative rAF loop

The `RedStringLayer` runs a persistent `requestAnimationFrame` loop that:

1. Reads pin positions directly from the DOM via `getBoundingClientRect()` on `[data-pin-note-id]` elements.
2. Writes computed path `d` attributes directly onto SVG `<path>` elements via `setAttribute()`.

This completely bypasses React's rendering pipeline for position tracking. Latest `connections`, `linkingFrom`, and `mousePos` values are read from refs (synced from props) so the loop has no React dependencies.

**Result:** Strings update at native display refresh rate (60fps+) with zero React overhead during drag. The `dragTick` state, `handleNoteDrag` handler, and `onDrag` prop were removed as they became unnecessary.

---

## 10. Visual Design

| Element | Style |
|---------|-------|
| String colour | `#dc2626` (Tailwind red-600) |
| String width | 2px (3px on hover) |
| String opacity | 0.85 (1.0 on hover) |
| String shape | Quadratic bezier with up to 40px catenary droop |
| In-progress line | Dashed (`stroke-dasharray: 6 4`), 0.6 opacity |
| Pin hover (linking active) | `scale-150`, `animate-pulse`, red ring |
| Delete button | 20px red circle with white X icon at string midpoint |
| Hit-area | 14px invisible stroke for easy hover targeting |

---

## 11. File Inventory

### New Files

| File | Purpose |
|------|---------|
| `Source/frontend/src/components/dashboard/RedStringLayer.tsx` | SVG overlay for rendering connections and linking preview |

### Modified Files

| File | Changes |
|------|---------|
| `Source/frontend/src/types/index.ts` | Added `NoteConnection` interface |
| `Source/frontend/src/components/dashboard/CorkBoard.tsx` | Added `boardRef` prop, callback ref bridge |
| `Source/frontend/src/components/dashboard/StickyNote.tsx` | Interactive pin with `data-pin-note-id`, `onPinMouseDown`, `isLinking` styling |
| `Source/frontend/src/pages/DashboardPage.tsx` | Connection state, linking lifecycle, document listeners, connection cleanup |
