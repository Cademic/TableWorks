# TableWorks – Implementation Summary

This document provides a comprehensive overview of all features implemented across the frontend and backend during the current development session.

---

## Table of Contents

1. [Authentication System](#1-authentication-system)
2. [Application Layout](#2-application-layout)
3. [CorkBoard Dashboard](#3-corkboard-dashboard)
4. [Sticky Notes – Core](#4-sticky-notes--core)
5. [Sticky Notes – Drag & Drop](#5-sticky-notes--drag--drop)
6. [Sticky Notes – Resizing](#6-sticky-notes--resizing)
7. [Sticky Notes – Rich Text Editing](#7-sticky-notes--rich-text-editing)
8. [Sticky Notes – Note Color Selection](#8-sticky-notes--note-color-selection)
9. [Sticky Notes – Tilt / Rotation](#9-sticky-notes--tilt--rotation)
10. [Sticky Notes – UX Enhancements](#10-sticky-notes--ux-enhancements)
11. [Backend Changes](#11-backend-changes)
12. [Database Migrations](#12-database-migrations)
13. [File Inventory](#13-file-inventory)

---

## 1. Authentication System

### Frontend

- **Login Page** (`LoginPage.tsx`) – Email/password form that authenticates via the backend API and stores JWT + refresh token in `localStorage`.
- **Register Page** (`RegisterPage.tsx`) – Username/email/password registration form with validation.
- **Auth Context** (`AuthContext.tsx`) – React context providing `user`, `login`, `register`, `logout`, and automatic token refresh logic.
- **Protected Route** (`ProtectedRoute.tsx`) – Route wrapper that redirects unauthenticated users to `/login`.
- **Axios Client** (`client.ts`) – Pre-configured Axios instance with interceptors for attaching the `Authorization` header and handling 401 responses with automatic token refresh.

### Backend

- JWT Bearer token authentication with refresh token rotation.
- Auth endpoints: `POST /auth/login`, `POST /auth/register`, `POST /auth/refresh`.

---

## 2. Application Layout

- **AppLayout** (`AppLayout.tsx`) – Top-level layout with a left-hand sidebar and a top navbar.
- **Sidebar** (`Sidebar.tsx`) – Left navigation panel for future navigation links.
- **Navbar** (`Navbar.tsx`) – Top bar with app title and user actions.
- **Router** (`router/index.tsx`) – React Router DOM configuration with routes for `/login`, `/register`, `/dashboard`, and a 404 page. Dashboard is wrapped in `ProtectedRoute` and `AppLayout`.
- **Theme Support** (`ThemeContext.tsx`, `useTheme.ts`) – Light/dark mode with CSS variables.

---

## 3. CorkBoard Dashboard

### Visual Design

- **CorkBoard** (`CorkBoard.tsx`) – Container component with a realistic cork board appearance.
- **CSS Styling** (`index.css`) – Wooden border frame using `border-image` with a linear gradient, cork surface texture using layered `radial-gradient` patterns, and dark mode variants.
- Sharp corners (no rounding) on the cork board border.

### Dashboard Page

- **DashboardPage** (`DashboardPage.tsx`) – Orchestrates all sticky notes on the cork board.
- Fetches notes from the API on mount (up to 100 notes).
- Floating "+" button in the bottom-right corner to create new notes.
- Loading spinner, error state with retry, and empty board placeholder.
- All note operations (drag, resize, save, color, rotation, delete) use optimistic local state updates with background API persistence.

---

## 4. Sticky Notes – Core

### Creation

- Clicking the "+" button creates a new note at a random position on the board.
- New notes default to **270×270px** (square).
- New notes default to **0° rotation** (straight, no tilt).
- The note immediately enters edit mode after creation.

### Inline Editing

- Click anywhere on a note to enter edit mode (not just the content area).
- Two TipTap rich text editors: one for the **title** and one for the **content**.
- Clicking on the title area in read mode focuses the title editor; clicking on content focuses the content editor. The cursor is placed on the approximate line that was clicked.
- Clicking outside both areas (drag handle, empty space) focuses the content editor at the end.
- Press **Escape** or click outside the note to save and exit edit mode.

### Character Limits

| Field   | Limit         |
|---------|---------------|
| Title   | 100 characters |
| Content | 1,000 characters |

Character counters are displayed below each editor and turn red when the limit is reached.

### Deletion

- Click the **X** button on the note to delete.
- If the note has any content (title or body), a styled confirmation popup appears directly on the note with "Cancel" and "Delete" buttons.
- Empty notes are deleted immediately without confirmation.

### Read Mode Rendering

- Title and content are rendered as HTML (supporting rich text formatting) using `dangerouslySetInnerHTML`.
- Tags are displayed as small rounded pills below the content (up to 3 shown).

---

## 5. Sticky Notes – Drag & Drop

- Implemented with `react-draggable`.
- Drag handle is the grip icon area at the top of the note.
- Constrained to the parent cork board (`bounds="parent"`).
- Dragging is disabled while editing, resizing, or if the delete confirmation is showing.
- Position (`positionX`, `positionY`) is persisted to the backend via `PATCH` on drag stop.

---

## 6. Sticky Notes – Resizing

### Resize Handles

- **8 resize directions**: N, S, E, W, NE, NW, SE, SW.
- Edge handles (6px thick) on all four sides.
- Corner handles (12×12px) at all four corners.
- Appropriate resize cursors for each direction.

### Constraints

| Constraint     | Value  |
|----------------|--------|
| Minimum size   | 120px  |
| Maximum width  | 600px  |
| Maximum height | 600px  |

### Board Boundary Clamping

- Notes cannot be resized beyond the cork board edges.
- During resize from the north or west sides, the note position is compensated to keep the opposite edge stationary.

### Implementation Details

- Uses stable `useRef` callbacks to prevent stale closures in `mousemove`/`mouseup` event listeners.
- `isResizing` state flag disables drag and prevents sync effects from fighting with resize state.
- Size and position are persisted to the backend on `mouseup`.

---

## 7. Sticky Notes – Rich Text Editing

### TipTap Integration

Two separate TipTap editor instances per note:

1. **Title editor** – Configured with `CharacterCount` (limit: 100).
2. **Content editor** – Configured with `CharacterCount` (limit: 1,000).

Both editors share these extensions:

| Extension       | Purpose                          |
|-----------------|----------------------------------|
| StarterKit      | Bold, italic, strike, paragraphs |
| Underline       | Underline formatting             |
| TextStyle       | Base for color/font attributes   |
| Color           | Text color                       |
| FontFamily      | Font family selection            |
| FontSize        | Custom extension for font size   |

### Custom FontSize Extension

- **File**: `lib/tiptap-font-size.ts`
- Extends TipTap's `TextStyle` mark to support inline `font-size` CSS.
- Commands: `setFontSize("16px")`, `unsetFontSize()`.
- Parses `font-size` from HTML and renders it as an inline style.

### NoteToolbar (`NoteToolbar.tsx`)

A slide-out toolbar that appears at the top of the note when editing. Contains three rows:

**Row 1 – Text Formatting:**
- Font family dropdown: Sans, Serif, Mono, Cursive.
- Font size: Select dropdown with presets (8–48px) and a "Custom..." option that reveals a numeric text input.
- Toggle buttons: Bold, Italic, Underline, Strikethrough.
- Text color swatches: Black, Red, Blue, Green, Orange, Purple.

**Row 2 – Note Color:**
- Color swatches: Yellow, Pink, Blue, Green, Orange, Purple.
- Active color shows a checkmark.

**Row 3 – Tilt (Rotation):**
- Preset buttons: -10°, -5°, -3°, 0°, +3°, +5°, +10°.
- Active tilt is highlighted.

### Active Editor Tracking

- An `activeField` state tracks whether the title or content editor is focused.
- The toolbar's formatting actions apply to whichever editor is currently active.

### CSS Styling

- `.tiptap-editor-area` – Overflow hidden, word-break, min-height.
- `.tiptap-title-area` – Single-line title styling, placeholder "Untitled".
- `.note-rich-content` – Read-mode HTML rendering with proper word wrapping, overflow hidden, and styled `<p>`, `<strong>`, `<em>`, `<u>`, `<s>` elements.
- Max font size capped at 48px to prevent overflow issues.

---

## 8. Sticky Notes – Note Color Selection

### Frontend

- 6 color options: Yellow, Pink, Blue, Green, Orange, Purple.
- Each color has a background class and a pin color.
- Color is selectable from the toolbar's note color row.
- Legacy notes without a saved color fall back to a hash-based color derived from the note ID.

### Backend

- `Color` field (`string?`) added to the `Note` entity and all relevant DTOs.
- Persisted via `PATCH` endpoint.

---

## 9. Sticky Notes – Tilt / Rotation

### Frontend

- **Preset-based rotation** selectable from the toolbar: -10°, -5°, -3°, 0°, +3°, +5°, +10° degrees.
- Default rotation for new notes: **0°** (straight).
- Rotation is applied via CSS `rotate` property with `transformOrigin: center center`.
- **Nested div structure** to separate positioning from rotation:
  - Outer div: positioned by `react-draggable` via `transform: translate()` – no rotation.
  - Inner div: carries `rotate` and all visual styling – rotates around center without displacing position.
- While editing, the note snaps to 0° for readability.

### Backend

- `Rotation` field (`double?`) added to the `Note` entity and all relevant DTOs.
- Persisted via `PATCH` endpoint.

---

## 10. Sticky Notes – UX Enhancements

| Feature | Description |
|---------|-------------|
| Click-to-edit | Click anywhere on the note to enter edit mode, not just the content area. |
| Smart cursor placement | Cursor is placed on the line the user clicked (title or content), using `yRatio` mapping between read and edit layouts. |
| Auto-grow height | In read mode, the note grows vertically if content overflows, clamped to the board boundary. |
| Pointer cursor | Notes show a pointer cursor when not editing to indicate they're clickable. |
| Delete confirmation | Styled in-note popup (not browser dialog) for notes with content. Empty notes delete immediately. |
| Text overflow prevention | `overflow: hidden`, `word-break: break-word`, `overflow-wrap: anywhere` on all text areas. |

---

## 11. Backend Changes

### Entity Changes (`Note.cs`)

New fields added to the `Note` entity:

| Field      | Type      | Purpose                  |
|------------|-----------|--------------------------|
| PositionX  | `double?` | X position on cork board |
| PositionY  | `double?` | Y position on cork board |
| Width      | `double?` | Note width in pixels     |
| Height     | `double?` | Note height in pixels    |
| Color      | `string?` | Note background color    |
| Rotation   | `double?` | Note tilt in degrees     |

### DTO Changes

All new fields were added to:

- `NoteDetailDto`
- `NoteSummaryDto`
- `CreateNoteRequest`
- `UpdateNoteRequest`
- `PatchNoteRequest`

### Service Changes (`NoteService.cs`)

- **CreateNoteAsync** – Maps `Color` and `Rotation` from request to entity.
- **UpdateNoteAsync** – Maps `Color` and `Rotation` from request to entity.
- **PatchNoteContentAsync** – Conditionally updates `Color` (if not null), `Rotation` (if has value), along with position and size fields.
- **MapToSummary / MapToDetail** – Include `Color` and `Rotation` in output DTOs.

### Validator Changes

- `CreateNoteRequestValidator` – Content max length increased to 5,000 (accounts for HTML overhead), title max length to 500. Color max length 20 chars.
- `UpdateNoteRequestValidator` – Same content/title length increases.
- `PatchNoteRequestValidator` – Same limits, plus color max length 20 chars.

---

## 12. Database Migrations

| Migration                    | Changes                              |
|------------------------------|--------------------------------------|
| `AddNotePositionFields`      | Added `PositionX`, `PositionY`       |
| `AddNoteSizeFields`          | Added `Width`, `Height`              |
| `AddNoteColorField`          | Added `Color`                        |
| `AddNoteRotationField`       | Added `Rotation`                     |

All migrations have been generated and applied to the PostgreSQL database.

---

## 13. File Inventory

### Frontend – New Files

| File | Purpose |
|------|---------|
| `src/components/dashboard/StickyNote.tsx` | Sticky note component with drag, resize, rich text, rotation |
| `src/components/dashboard/NoteToolbar.tsx` | Text formatting toolbar with font, color, tilt controls |
| `src/components/dashboard/CorkBoard.tsx` | Cork board container with CSS texture |
| `src/lib/tiptap-font-size.ts` | Custom TipTap extension for font size |
| `src/pages/DashboardPage.tsx` | Dashboard page orchestrating all notes |
| `src/pages/LoginPage.tsx` | Login page |
| `src/pages/RegisterPage.tsx` | Registration page |
| `src/pages/NotFoundPage.tsx` | 404 page |
| `src/components/auth/ProtectedRoute.tsx` | Auth-guarded route wrapper |
| `src/components/layout/AppLayout.tsx` | App shell with sidebar + navbar |
| `src/components/layout/Sidebar.tsx` | Left navigation sidebar |
| `src/components/layout/Navbar.tsx` | Top navigation bar |
| `src/context/AuthContext.tsx` | Authentication state & logic |
| `src/context/ThemeContext.tsx` | Theme (light/dark) state |
| `src/hooks/useTheme.ts` | Theme hook |
| `src/api/client.ts` | Axios instance with auth interceptors |
| `src/api/auth.ts` | Auth API functions |
| `src/api/notes.ts` | Notes API functions |
| `src/router/index.tsx` | React Router configuration |
| `src/types/index.ts` | TypeScript interfaces and DTOs |

### Frontend – Modified Files

| File | Changes |
|------|---------|
| `src/index.css` | Cork board styles, TipTap editor styles, rich content styles |
| `package.json` | Added dependencies: react-draggable, TipTap packages, lucide-react |
| `vite.config.ts` | Updated configuration |

### Backend – Modified Files

| File | Changes |
|------|---------|
| `TableWorks.Core/Entities/Note.cs` | Added Position, Size, Color, Rotation fields |
| `TableWorks.Application/DTOs/Notes/*.cs` | Added new fields to all 5 DTOs |
| `TableWorks.Application/Services/NoteService.cs` | Updated create, update, patch, and mapper methods |
| `TableWorks.Application/Validators/Notes/*.cs` | Updated length limits, added color validation |

### Backend – New Files

| File | Purpose |
|------|---------|
| `Validators/Notes/PatchNoteRequestValidator.cs` | Validation for patch operations |
| `Migrations/AddNotePositionFields.*` | EF Core migration for position |
| `Migrations/AddNoteSizeFields.*` | EF Core migration for size |
| `Migrations/AddNoteColorField.*` | EF Core migration for color |
| `Migrations/AddNoteRotationField.*` | EF Core migration for rotation |

---

## Technology Stack

### Frontend

| Technology | Usage |
|------------|-------|
| React 18 + TypeScript | UI framework |
| Vite | Build tool & dev server |
| React Router DOM | Client-side routing |
| Tailwind CSS | Utility-first styling |
| TipTap (ProseMirror) | Rich text editing |
| react-draggable | Drag & drop positioning |
| Axios | HTTP client with interceptors |
| Lucide React | Icon library |

### Backend

| Technology | Usage |
|------------|-------|
| ASP.NET Core 8 | Web API framework |
| Entity Framework Core 8 | ORM & migrations |
| PostgreSQL | Database |
| FluentValidation | Request validation |
| Serilog | Structured logging |
| JWT Bearer | Authentication |
