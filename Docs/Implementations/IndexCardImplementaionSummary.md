# TableWorks -- Index Card Implementation Summary

This document provides a comprehensive overview of the Index Card feature and all related enhancements implemented during this session. Index Cards are a new board element that lives alongside Sticky Notes on the CorkBoard, offering a larger format with ruled lines, table creation, checklists, and additional rich text capabilities.

---

## Table of Contents

1. [Feature Overview](#1-feature-overview)
2. [Architecture](#2-architecture)
3. [Data Model](#3-data-model)
4. [Index Card Component](#4-index-card-component)
5. [Index Card Toolbar](#5-index-card-toolbar)
6. [Visual Design -- Colors](#6-visual-design--colors)
7. [Visual Design -- Ruled Lines](#7-visual-design--ruled-lines)
8. [New TipTap Extensions](#8-new-tiptap-extensions)
9. [API Client](#9-api-client)
10. [Dashboard Integration](#10-dashboard-integration)
11. [Sidebar Board Tools](#11-sidebar-board-tools)
12. [Text Alignment (Both Toolbars)](#12-text-alignment-both-toolbars)
13. [Z-Index Stacking Order](#13-z-index-stacking-order)
14. [Red String Compatibility](#14-red-string-compatibility)
15. [CSS Styles](#15-css-styles)
16. [File Inventory](#16-file-inventory)
17. [Dependencies Added](#17-dependencies-added)
18. [Backend Requirements (Future)](#18-backend-requirements-future)

---

## 1. Feature Overview

Index Cards are larger, landscape-oriented cards inspired by real ruled index cards. They inherit every Sticky Note capability and add new features:

- **Table Creation** -- Insert and edit tables with header rows, add/remove rows and columns.
- **Checklists / Task Lists** -- Interactive checkbox lists with strikethrough on checked items.
- **Bullet and Ordered Lists** -- Dedicated toolbar buttons for list toggling.
- **Horizontal Dividers** -- Insert horizontal rules to section off content.
- **Text Alignment** -- Left, center, and right alignment (also added to Sticky Notes).
- **Ruled Lines** -- Per-element bottom borders that adapt to text size, replicating real index card lines.
- **Header Band** -- Colored header strip with a red rule line separator beneath the title.
- **Distinct Color Palette** -- Six softer, paper-like colors different from Sticky Notes.
- **Higher Character Limit** -- 10,000 characters for content (vs 1,000 for Sticky Notes).

---

## 2. Architecture

The Index Card system follows the same patterns as Sticky Notes, with its own component, toolbar, API client, and types:

```
DashboardPage (state: notes[], indexCards[], zIndexMap, connections[])
├── CorkBoard (boardRef, onDropItem)
│   ├── RedStringLayer (SVG overlay, z-9999)
│   ├── StickyNote[] (with zIndex, onBringToFront)
│   │   └── NoteToolbar
│   └── IndexCard[] (with zIndex, onBringToFront)
│       └── IndexCardToolbar
├── Floating Add Button (popover menu)
└── Sidebar Board Tools (draggable + clickable)
```

**State management:** All index card state is managed locally in `DashboardPage` via `useState` hooks, mirroring the pattern used for sticky notes. Optimistic updates are used for all operations.

**Optimistic creation:** Since the backend `/api/index-cards` endpoint does not yet exist, index cards are created optimistically with a temporary client-side ID (`temp-card-*`). If the API call succeeds, the temp card is replaced with the server-generated one. If it fails, the card remains usable in local state.

---

## 3. Data Model

### New TypeScript Interfaces

Added to `Source/frontend/src/types/index.ts`:

```typescript
export interface IndexCardSummaryDto {
  id: string;
  title: string | null;
  content: string;
  folderId: string | null;
  projectId: string | null;
  tags: NoteTagDto[];
  createdAt: string;
  updatedAt: string;
  positionX: number | null;
  positionY: number | null;
  width: number | null;
  height: number | null;
  color: string | null;
  rotation: number | null;
}

export interface IndexCardDetailDto extends IndexCardSummaryDto {
  lastSavedAt: string | null;
}

export interface CreateIndexCardRequest { ... }
export interface PatchIndexCardRequest { ... }
```

`NoteTagDto` was also changed from a non-exported interface to an exported one so it can be referenced by the Index Card types.

---

## 4. Index Card Component

**File:** `Source/frontend/src/components/dashboard/IndexCard.tsx`

### Dimensions

| Property       | Value   |
|----------------|---------|
| Default width  | 450px   |
| Default height | 300px   |
| Min width      | 200px   |
| Min height     | 160px   |
| Max width      | 800px   |
| Max height     | 600px   |

### Character Limits

| Field   | Limit              |
|---------|--------------------|
| Title   | 100 characters     |
| Content | 10,000 characters  |

### Inherited Features (from StickyNote)

- Rich text editing (TipTap) with title and content editors
- Drag and drop via `react-draggable` with `.index-card-handle` selector
- 8-direction resize with boundary clamping (uses separate min/max for width/height)
- Color selection from toolbar
- Rotation/tilt presets (-10 to +10 degrees)
- Pin at top-center for red-string linking (`data-pin-note-id` attribute)
- Delete with confirmation overlay for cards with content
- Character counters that turn red at limit
- Tags display (up to 3 badges)
- Auto-grow height in read mode
- Click-to-edit with smart cursor placement
- Save on blur or Escape

### Structural Differences from StickyNote

- **Header band**: The title lives inside a colored header strip at the top. The header uses `color.headerBg` (slightly darker than the body) and is separated from the content by a red rule line (`.index-card-header-rule`).
- **Rounded corners**: Uses `rounded-md` instead of `rounded`.
- **Content area**: Has the `.index-card-ruled` class for ruled lines and `.index-card-content` class for table/list/task styling.
- **TipTap extensions**: The content editor includes Table, TableRow, TableCell, TableHeader, TaskList, and TaskItem extensions in addition to the shared set.

### Props

```typescript
interface IndexCardProps {
  card: IndexCardSummaryDto;
  isEditing: boolean;
  zIndex?: number;
  onDragStop: (id: string, x: number, y: number) => void;
  onDelete: (id: string) => void;
  onStartEdit: (id: string) => void;
  onSave: (id: string, title: string, content: string) => void;
  onResize: (id: string, width: number, height: number) => void;
  onColorChange: (id: string, color: string) => void;
  onRotationChange: (id: string, rotation: number) => void;
  onPinMouseDown?: (cardId: string) => void;
  onDrag?: (id: string, x: number, y: number) => void;
  onBringToFront?: (id: string) => void;
  isLinking?: boolean;
}
```

---

## 5. Index Card Toolbar

**File:** `Source/frontend/src/components/dashboard/IndexCardToolbar.tsx`

An extended version of `NoteToolbar` with four rows:

**Row 1 -- Text Formatting:**
- Font family dropdown: Sans, Serif, Mono, Cursive
- Font size: Select dropdown with presets (8-48px) plus custom input
- Toggle buttons: Bold, Italic, Underline, Strikethrough
- Alignment buttons: Left, Center, Right
- Text color swatches: Black, Red, Blue, Green, Orange, Purple

**Row 2 -- Card Color:**
- 6 color swatches for index card colors (White, Ivory, Sky, Rose, Mint, Lavender)
- Active color shows a checkmark

**Row 3 -- Tilt (Rotation):**
- Preset buttons: -10, -5, -3, 0, +3, +5, +10 degrees
- Active tilt is highlighted

**Row 4 -- Content Blocks:**
- Insert Table (3x3 with header row)
- Toggle Task List (checkboxes)
- Toggle Bullet List
- Toggle Ordered List
- Insert Horizontal Rule
- **Contextual table controls** (shown when cursor is inside a table): Add Row, Delete Row, Add Column, Delete Column, Delete Table

---

## 6. Visual Design -- Colors

### Index Card Color Palette

Using Tailwind `-50` / `-100` tones for a softer, paper-like look, distinct from Sticky Notes' `-200` range:

| Name     | Body Background                  | Header Background                 | Pin Color       |
|----------|----------------------------------|-----------------------------------|-----------------|
| White    | `bg-white dark:bg-gray-100`      | `bg-gray-50 dark:bg-gray-200`    | `bg-rose-500`   |
| Ivory    | `bg-amber-50 dark:bg-amber-100`  | `bg-amber-100 dark:bg-amber-200` | `bg-teal-500`   |
| Sky      | `bg-sky-50 dark:bg-sky-100`      | `bg-sky-100 dark:bg-sky-200`     | `bg-orange-500` |
| Rose     | `bg-rose-50 dark:bg-rose-100`    | `bg-rose-100 dark:bg-rose-200`   | `bg-cyan-500`   |
| Mint     | `bg-emerald-50 dark:bg-emerald-100` | `bg-emerald-100 dark:bg-emerald-200` | `bg-pink-500` |
| Lavender | `bg-violet-50 dark:bg-violet-100` | `bg-violet-100 dark:bg-violet-200` | `bg-amber-500` |

### Sticky Note Color Palette (unchanged, for reference)

| Name   | Background                       | Pin Color       |
|--------|----------------------------------|-----------------|
| Yellow | `bg-yellow-200 dark:bg-yellow-300` | `bg-red-500`  |
| Pink   | `bg-pink-200 dark:bg-pink-300`   | `bg-blue-500`   |
| Blue   | `bg-blue-200 dark:bg-blue-300`   | `bg-yellow-500` |
| Green  | `bg-green-200 dark:bg-green-300` | `bg-red-500`    |
| Orange | `bg-orange-200 dark:bg-orange-300` | `bg-blue-500` |
| Purple | `bg-purple-200 dark:bg-purple-300` | `bg-yellow-500` |

---

## 7. Visual Design -- Ruled Lines

Index card ruled lines are implemented as per-element CSS bottom borders rather than a fixed-interval background gradient. This ensures each line aligns with the actual text regardless of font size.

### How It Works

- Every `<p>`, `<h1>`-`<h4>`, and `<blockquote>` inside `.index-card-ruled` gets a `border-bottom: 1px solid rgba(147, 197, 253, 0.35)` with `padding-bottom: 3px` and `margin-bottom: 3px`.
- Empty paragraphs have `min-height: 1.4em` so blank ruled lines still show visible spacing.
- Tables get `margin-bottom: 6px` for separation from lines below.

### Exclusions

Elements inside certain containers are excluded from ruled lines to avoid visual clutter:

| Container      | Excluded Elements                          |
|----------------|--------------------------------------------|
| Table cells    | `td p`, `td li`, `td h1`-`h4`, `th p`, etc. |
| Lists          | `ul li`, `ol li`, `li p`                   |

### Red Header Rule

The `.index-card-header-rule` class renders a `2px solid rgba(248, 113, 113, 0.6)` bottom border, mimicking the red rule line found on real index cards.

---

## 8. New TipTap Extensions

Extensions added to the Index Card content editor (in addition to the shared set used by both Sticky Notes and Index Cards):

| Extension                    | Purpose                              |
|------------------------------|--------------------------------------|
| `@tiptap/extension-table`    | Table insertion and editing          |
| `@tiptap/extension-table-row` | Table row support                  |
| `@tiptap/extension-table-cell` | Table cell support                |
| `@tiptap/extension-table-header` | Table header cell support       |
| `@tiptap/extension-task-list` | Task/checklist container            |
| `@tiptap/extension-task-item` | Individual checkbox items           |
| `@tiptap/extension-text-align` | Text alignment (added to both Sticky Notes and Index Cards) |

The table extensions use named exports (e.g., `import { Table } from "@tiptap/extension-table"`), not default exports.

---

## 9. API Client

**File:** `Source/frontend/src/api/index-cards.ts`

Mirrors the notes API client structure:

| Function            | Method | Endpoint              |
|---------------------|--------|-----------------------|
| `getIndexCards`     | GET    | `/index-cards`        |
| `getIndexCardById`  | GET    | `/index-cards/:id`    |
| `createIndexCard`   | POST   | `/index-cards`        |
| `patchIndexCard`    | PATCH  | `/index-cards/:id`    |
| `deleteIndexCard`   | DELETE | `/index-cards/:id`    |

All functions use the shared `apiClient` with authentication interceptors.

---

## 10. Dashboard Integration

**File:** `Source/frontend/src/pages/DashboardPage.tsx`

### New State

```typescript
const [indexCards, setIndexCards] = useState<IndexCardSummaryDto[]>([]);
const [editingCardId, setEditingCardId] = useState<string | null>(null);
const [showAddMenu, setShowAddMenu] = useState(false);
const [zIndexMap, setZIndexMap] = useState<Record<string, number>>({});
const zCounterRef = useRef(1);
```

### Data Fetching

Uses `Promise.allSettled` to fetch notes and index cards in parallel. If one fails (e.g., index cards API doesn't exist yet), the other still loads. An error is only shown if both fail.

### Index Card CRUD Handlers

Each mirrors the sticky note pattern with optimistic local state updates:

| Handler                    | Purpose                                     |
|----------------------------|---------------------------------------------|
| `handleQuickAddCard`       | Creates card optimistically with temp ID    |
| `handleCardDragStop`       | Updates position, persists via API          |
| `handleCardSave`           | Saves title + content, persists via API     |
| `handleCardStartEdit`      | Enters edit mode, brings card to front      |
| `handleCardResize`         | Updates dimensions, persists via API        |
| `handleCardColorChange`    | Updates color, persists via API             |
| `handleCardRotationChange` | Updates rotation, persists via API          |
| `handleCardDelete`         | Removes card and associated connections     |
| `handleBoardDrop`          | Creates note or card at drop position       |

### Floating Add Button

The single "+" button was replaced with a popover menu offering two choices:
- **Sticky Note** (yellow icon) -- creates a sticky note at a random position
- **Index Card** (sky-blue icon) -- creates an index card at a random position

The menu uses a scale/opacity CSS transition and closes when clicking outside (via document `mousedown` listener).

---

## 11. Sidebar Board Tools

**File:** `Source/frontend/src/components/layout/Sidebar.tsx`

A **"Board Tools"** section was added to the sidebar between the navigation and user sections. It contains two items:

| Tool         | Icon         | Color             | Drag Data Type |
|--------------|--------------|-------------------|----------------|
| Sticky Note  | `StickyNote` | `text-yellow-500` | `sticky-note`  |
| Index Card   | `CreditCard` | `text-sky-500`    | `index-card`   |

### Drag to Board

Each tool is `draggable="true"`. On `dragStart`:
- Sets `e.dataTransfer.setData("application/board-item-type", type)`
- Sets `e.dataTransfer.effectAllowed = "copy"`
- Uses just the SVG icon as the drag image via `setDragImage(iconEl, 12, 12)`

### Click to Create

Each tool has an `onClick` that dispatches a `board-tool-click` custom event on `document`:
```typescript
document.dispatchEvent(
  new CustomEvent("board-tool-click", { detail: { type: tool.type } })
);
```

`DashboardPage` listens for this event and calls `handleQuickAddNote()` or `handleQuickAddCard()` accordingly.

### CorkBoard Drop Target

**File:** `Source/frontend/src/components/dashboard/CorkBoard.tsx`

CorkBoard was extended with an optional `onDropItem` prop:

```typescript
onDropItem?: (type: string, x: number, y: number) => void;
```

The board surface handles:
- `onDragOver` -- Calls `preventDefault()` to allow the drop; shows a ring highlight (`ring-2 ring-inset ring-primary/40`)
- `onDragLeave` -- Removes the highlight (ignores events from child elements)
- `onDrop` -- Reads item type from `dataTransfer`, calculates board-relative x/y from `getBoundingClientRect()`, calls `onDropItem`

### Sidebar Responsiveness

When the sidebar is collapsed (`isOpen=false`), only the icons are shown. When expanded, labels ("Sticky Note", "Index Card") appear alongside icons. The "Board Tools" heading is only visible when expanded.

---

## 12. Text Alignment (Both Toolbars)

Text alignment was added as a shared enhancement to both Sticky Notes and Index Cards.

### Dependency

`@tiptap/extension-text-align` was installed and configured with `types: ["paragraph"]` in both `StickyNote.tsx` and `IndexCard.tsx` shared extensions.

### Toolbar Buttons

Three alignment buttons were added to both `NoteToolbar.tsx` and `IndexCardToolbar.tsx`, placed after the Strikethrough button:

| Button       | Icon          | Action                                      |
|--------------|---------------|---------------------------------------------|
| Align Left   | `AlignLeft`   | `editor.chain().focus().setTextAlign("left").run()`   |
| Align Center | `AlignCenter` | `editor.chain().focus().setTextAlign("center").run()` |
| Align Right  | `AlignRight`  | `editor.chain().focus().setTextAlign("right").run()`  |

Active alignment is highlighted using `editor.isActive({ textAlign: "..." })`.

---

## 13. Z-Index Stacking Order

A z-index management system was added so clicking any board item brings it to the front.

### Implementation

- `DashboardPage` maintains a `zIndexMap` (Record of item ID to z-index number) and a `zCounterRef` that increments on each `bringToFront(id)` call.
- `bringToFront` is called on `handleStartEdit`, `handleCardStartEdit`, and via the `onBringToFront` prop (triggered by `onMouseDown` on each item's outer wrapper).
- The `zIndex` value is passed as a prop to both `StickyNote` and `IndexCard` and applied as an inline style on the outer positioning div.

### Layer Hierarchy

| Layer            | Z-Index   |
|------------------|-----------|
| Board items      | 0 to N (incrementing) |
| RedStringLayer   | 9999      |
| Floating buttons | 20        |
| Delete overlays  | 30        |

The `RedStringLayer` was updated from `z-[5]` to `z-[9999]` to ensure red strings always render above all board items regardless of stacking order.

---

## 14. Red String Compatibility

The `RedStringLayer` component required **zero structural changes** to support Index Cards. Pin detection uses `[data-pin-note-id]` DOM attribute selectors, and the `IndexCard` component renders its pin with the same attribute:

```html
<div data-pin-note-id={card.id} ...>
```

Connections work automatically between:
- Note to note
- Card to card
- Note to card (and vice versa)

The `NoteConnection` type's `fromNoteId` / `toNoteId` fields hold either note or card IDs since all are unique UUIDs.

---

## 15. CSS Styles

All index card styles were added to `Source/frontend/src/index.css`:

### Ruled Lines

```css
.index-card-ruled p, h1-h4, li, blockquote {
  border-bottom: 1px solid rgba(147, 197, 253, 0.35);
  padding-bottom: 3px;
  margin-bottom: 3px;
  min-height: 1.4em;
}
```

With exclusions for elements inside table cells (`td`, `th`) and list items (`ul li`, `ol li`, `li p`).

### Header Rule

```css
.index-card-header-rule {
  border-bottom: 2px solid rgba(248, 113, 113, 0.6);
}
```

### Card Shadow

```css
.index-card {
  box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.1),
              inset 0 0 0 1px rgba(0,0,0,0.04);
}
```

### Table Styles (edit and read mode)

- Collapsed borders, fixed table layout
- Cell padding, 1px borders, 0.75rem font
- Header cells with subtle background
- Selected cell highlight (blue overlay)
- Column resize handle (blue bar)
- Table wrapper with horizontal overflow scroll

### Task List / Checklist Styles

- No list-style dots, flex layout with checkbox + content
- 14px checkboxes with blue accent color
- Checked items: strikethrough text with 50% opacity

### Bullet and Ordered List Styles

- Disc / decimal list styles with left padding
- Override for task lists to prevent disc markers

### Horizontal Rule

- 1px solid border with subtle opacity

---

## 16. File Inventory

### New Files

| File | Purpose |
|------|---------|
| `src/components/dashboard/IndexCard.tsx` | Main index card component with all interactive features |
| `src/components/dashboard/IndexCardToolbar.tsx` | Extended toolbar with table, list, and alignment controls |
| `src/api/index-cards.ts` | API client for index card CRUD operations |

### Modified Files

| File | Changes |
|------|---------|
| `src/types/index.ts` | Added `IndexCardSummaryDto`, `IndexCardDetailDto`, `CreateIndexCardRequest`, `PatchIndexCardRequest`; exported `NoteTagDto` |
| `src/pages/DashboardPage.tsx` | Index card state, CRUD handlers, board drop handler, add menu popover, z-index stacking, sidebar tool click listener |
| `src/components/dashboard/CorkBoard.tsx` | Added `onDropItem` prop with drag-over/drop handling and visual highlight |
| `src/components/dashboard/StickyNote.tsx` | Added `zIndex`, `onBringToFront` props, `TextAlign` extension |
| `src/components/dashboard/NoteToolbar.tsx` | Added text alignment buttons (Left, Center, Right) |
| `src/components/dashboard/RedStringLayer.tsx` | Updated z-index from `z-[5]` to `z-[9999]` |
| `src/components/layout/Sidebar.tsx` | Added Board Tools section with draggable/clickable Sticky Note and Index Card items |
| `src/index.css` | Added all index card CSS: ruled lines, header rule, card shadow, table styles, task list styles, list styles, horizontal rule styles |
| `package.json` | Added 7 new TipTap extension dependencies |

---

## 17. Dependencies Added

| Package | Version | Purpose |
|---------|---------|---------|
| `@tiptap/extension-table` | latest | Table insertion and editing |
| `@tiptap/extension-table-row` | latest | Table row support |
| `@tiptap/extension-table-cell` | latest | Table cell support |
| `@tiptap/extension-table-header` | latest | Table header cell support |
| `@tiptap/extension-task-list` | latest | Checklist/task list container |
| `@tiptap/extension-task-item` | latest | Individual checklist items |
| `@tiptap/extension-text-align` | latest | Text alignment (left, center, right) |

---

## 18. Backend Requirements (Future)

The frontend is fully built and operational with optimistic local state. The backend will need:

- New `IndexCard` entity with the same fields as `Note` (id, title, content, position, size, color, rotation, timestamps, folder, project, tags)
- New database migration to create the `index_cards` table
- New `IndexCardsController` with CRUD endpoints at `/api/index-cards`
- New service and repository layers
- Validation rules: title 100 characters, content 10,000 characters, color max 20 characters
- The frontend API client is already structured to match the expected RESTful endpoints
