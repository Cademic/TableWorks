# Dashboard Restructure & Infinite Canvas — February 11, 2026

This document covers all features implemented, architectural changes, and bug fixes completed during this development session. The work transforms the application from a single-board dashboard into a multi-board hub with infinite canvas capabilities.

---

## Table of Contents

- [1. Multi-Board Architecture — Backend](#1-multi-board-architecture--backend)
- [2. Dashboard Hub — Frontend](#2-dashboard-hub--frontend)
- [3. Note Board Page (CorkBoard Extraction)](#3-note-board-page-corkboard-extraction)
- [4. Routing & Navigation Overhaul](#4-routing--navigation-overhaul)
- [5. Infinite Canvas (Pan & Zoom)](#5-infinite-canvas-pan--zoom)
- [6. Zoom Displacement Fix](#6-zoom-displacement-fix)
- [7. Navbar Board Name Integration](#7-navbar-board-name-integration)
- [Files Created](#files-created)
- [Files Modified](#files-modified)
- [Database Migrations](#database-migrations)

---

## 1. Multi-Board Architecture — Backend

### Problem

The application had no concept of "boards" — all notes, index cards, and connections belonged directly to a user. There was no way to organize items into separate workspaces or to support multiple boards of different types.

### Solution

Created a new `Board` entity and established relationships to scope items per board.

#### Core Layer

- **`Board.cs`** — New entity with fields: `Id` (UUID), `UserId`, `Name`, `Description`, `BoardType` (string: `"NoteBoard"`, `"ChalkBoard"`, `"Calendar"`), `CreatedAt`, `UpdatedAt`
- Navigation properties to `User`, `Notes`, `IndexCards`, and `BoardConnections`
- **`Note.cs`** — Added nullable `BoardId` foreign key and `Board` navigation property
- **`IndexCard.cs`** — Added nullable `BoardId` foreign key and `Board` navigation property
- **`BoardConnection.cs`** — Added nullable `BoardId` foreign key and `Board` navigation property
- **`User.cs`** — Added `ICollection<Board> Boards` navigation property

#### Application Layer

- **DTOs**:
  - `BoardSummaryDto` — includes `Id`, `Name`, `Description`, `BoardType`, `NoteCount`, `IndexCardCount`, timestamps
  - `CreateBoardRequest` — `Name`, `Description`, `BoardType`
  - `UpdateBoardRequest` — `Name`, `Description`
  - `BoardListQuery` — filtering/pagination
- **Interface**: `IBoardService` — CRUD operations for boards
- **Service**: `BoardService` — full implementation with item counts via projection, cascade deletion of associated items
- **Validators**: `CreateBoardRequestValidator`, `UpdateBoardRequestValidator` (FluentValidation)
- **Updated Services**:
  - `NoteService` — filters by `BoardId` in queries, accepts `BoardId` on creation
  - `IndexCardService` — filters by `BoardId` in queries, accepts `BoardId` on creation
  - `BoardConnectionService` — filters by `BoardId` in queries, accepts `BoardId` on creation

#### API Layer

- **`BoardsController`** at `api/v1/boards`:
  - `GET /` — paginated board list with filters
  - `POST /` — create a board (returns 201)
  - `GET /{id}` — get board by ID
  - `PUT /{id}` — update board name/description
  - `DELETE /{id}` — delete board and all associated items
- **`BoardConnectionsController`** — updated `GetConnections` to accept optional `boardId` query parameter

#### Infrastructure

- `DbSet<Board>` registered in `AppDbContext`
- Entity configuration: UUID generation, indexes on `UserId`, `BoardType`, `CreatedAt`
- Foreign key relationships: `Note`, `IndexCard`, `BoardConnection` all have optional FK to `Board` with `OnDelete(DeleteBehavior.SetNull)`
- DI registration: `IBoardService -> BoardService` in `Program.cs`
- EF Core migration `AddBoardEntity` generated and applied

---

## 2. Dashboard Hub — Frontend

### Problem

`DashboardPage.tsx` was a monolithic component that directly rendered the CorkBoard with all notes, index cards, and connections. There was no way to view or manage multiple boards.

### Solution

Completely rewrote `DashboardPage.tsx` as a board management hub.

#### New Dashboard Features

- Fetches all user boards via `GET /boards`
- Displays boards in a responsive grid, grouped by type (Note Boards, Chalk Boards, Calendars)
- Each board displayed as a `BoardCard` component showing:
  - Board name and description
  - Type icon with color-coded gradient background
  - Item counts (notes, index cards)
  - Relative timestamp ("just now", "5m ago", "3d ago")
  - Hover-reveal delete button
- "New Board" button opens `CreateBoardDialog` modal
- Empty state with encouraging prompt when no boards exist
- Placeholder sections for future Chalk Board and Calendar features

#### New Components

- **`BoardCard.tsx`** — Clickable card that navigates to `/boards/:boardId`, with type-specific styling, delete action, and relative date formatting
- **`CreateBoardDialog.tsx`** — Modal form with board type selector (grid of NoteBoard / ChalkBoard / Calendar with "Coming Soon" labels), name input, optional description textarea, create/cancel actions

#### New API Client

- **`api/boards.ts`** — Functions: `getBoards()`, `getBoardById()`, `createBoard()`, `updateBoard()`, `deleteBoard()`

#### New TypeScript Interfaces (in `types/index.ts`)

- `BoardSummaryDto` — `id`, `userId`, `name`, `description`, `boardType`, `noteCount`, `indexCardCount`, `createdAt`, `updatedAt`
- `CreateBoardRequest` — `name`, `description`, `boardType`
- `UpdateBoardRequest` — `name`, `description`
- Updated `CreateNoteRequest`, `CreateIndexCardRequest`, `CreateBoardConnectionRequest` to include optional `boardId`

---

## 3. Note Board Page (CorkBoard Extraction)

### Problem

All CorkBoard logic (notes, index cards, connections, drag-and-drop, toolbars) lived inside `DashboardPage.tsx`. It needed to be extracted into a standalone page that operates on a specific board.

### Solution

Created `NoteBoardPage.tsx` which contains all the previous CorkBoard logic, now scoped to a single `boardId` from URL parameters.

#### Key Behavior

- Reads `boardId` from `useParams` (route: `/boards/:boardId`)
- All API calls (get/create/update/delete for notes, cards, connections) pass `boardId` as a filter or creation parameter
- Data fetched via `Promise.allSettled` for resilience — partial failures don't block the entire page
- Viewport state (zoom, pan) persisted per board in `localStorage` using key `board-viewport-{boardId}`
- Full feature parity with the original DashboardPage: sticky notes, index cards, red string connections, toolbars, drag-and-drop from sidebar, add menu (FAB), resize, edit, delete, link/unlink

---

## 4. Routing & Navigation Overhaul

### Changes

Updated `router/index.tsx` with the following protected routes:

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | `DashboardPage` | Board management hub |
| `/boards/:boardId` | `NoteBoardPage` | Individual board view |
| `/projects` | `ProjectsPage` | Placeholder (Coming Soon) |
| `/calendars` | `CalendarsPage` | Placeholder (Coming Soon) |
| `/chalkboards` | `ChalkBoardsPage` | Placeholder (Coming Soon) |
| `/settings` | `SettingsPage` | Placeholder (Coming Soon) |

#### Sidebar Updates (`Sidebar.tsx`)

- Navigation items updated: Dashboard, Projects, Calendars, Chalk Boards, Settings
- "Board Tools" section (Sticky Note / Index Card drag items) is context-aware — only visible when on a `/boards/:boardId` route
- Active route highlighting works correctly for all new routes

#### Placeholder Pages Created

- `ProjectsPage.tsx` — Centered icon + "Coming Soon" badge
- `CalendarsPage.tsx` — Centered icon + "Coming Soon" badge
- `ChalkBoardsPage.tsx` — Centered icon + "Coming Soon" badge
- `SettingsPage.tsx` — Centered icon + "Coming Soon" badge

---

## 5. Infinite Canvas (Pan & Zoom)

### Problem

The CorkBoard was a fixed-size container. Users couldn't navigate a large workspace — items placed off-screen were inaccessible.

### Solution

Implemented a viewport/canvas architecture with CSS transforms for infinite pan and zoom.

#### Architecture

```
┌─ Viewport (clips content, captures mouse events) ──────┐
│  ┌─ Canvas (CSS transform: scale + translate) ────────┐ │
│  │  ┌──────┐  ┌──────────┐                            │ │
│  │  │ Note │  │ IndexCard│  ... (children)             │ │
│  │  └──────┘  └──────────┘                            │ │
│  └────────────────────────────────────────────────────┘ │
│  [Zoom Controls]                                         │
└──────────────────────────────────────────────────────────┘
```

- **Viewport** (`viewportRef`) — `overflow: hidden`, captures all mouse/wheel events
- **Canvas** (`canvasRef`) — `transform: scale(z) translate(px, py)`, 10000x10000px, origin-top-left
- **ZoomControls** — positioned outside the canvas transform at bottom-left

#### Pan Controls

| Input | Action |
|-------|--------|
| Right-click drag | Pan the canvas |
| Middle-click drag | Pan the canvas |
| Space + left-click drag | Pan the canvas |

- Pan deltas divided by current zoom to maintain consistent feel at all zoom levels
- Context menu suppressed after right-click panning
- Space bar tracking ignores text inputs and contenteditable elements

#### Zoom Controls

| Input | Action |
|-------|--------|
| Ctrl + Scroll Wheel | Zoom centered on cursor position |
| `+` button | Zoom in centered on viewport center |
| `-` button | Zoom out centered on viewport center |
| Percentage display (click) | Reset to 100% zoom at origin |
| Maximize icon (click) | Reset to 100% zoom at origin |

- Zoom range: 25% to 200%
- Zoom step factor: 1.1 (10% per notch)

#### Component Updates for Zoom Compatibility

- **`StickyNote.tsx`** — Added `zoom` prop, passed `scale={zoom}` to `<Draggable>`, removed `bounds="parent"`, adjusted resize deltas by dividing by `zoom`
- **`IndexCard.tsx`** — Same changes as StickyNote
- **`RedStringLayer.tsx`** — Added `zoom` prop, divides calculated screen-space offsets by `zoom` for accurate canvas-space pin positions, adjusts delete button position calculation

#### Coordinate Space Transformation

When dropping sidebar items onto the board, screen coordinates are converted to canvas coordinates:

```typescript
const canvasX = (e.clientX - rect.left) / zoom - panX;
const canvasY = (e.clientY - rect.top) / zoom - panY;
```

#### State Persistence

Viewport state (`zoom`, `panX`, `panY`) saved to `localStorage` per board:
- Key: `board-viewport-{boardId}`
- Loaded on mount, saved on every viewport change

---

## 6. Zoom Displacement Fix

### Problem

When zooming in or out (both via Ctrl+Scroll and +/- buttons), the viewport center was displaced — content shifted away from where the user was looking.

### Root Cause

The pan adjustment formula had a sign error. With the CSS transform order `scale(z) translate(p)`, the relationship between screen and canvas coordinates is:

```
screen = z * (canvas + p)
canvas = screen / z - p
```

The original formula subtracted the delta:
```typescript
// WRONG
const newPanX = panX - (mouseX / newZoom - mouseX / zoom);
```

### Fix

Corrected the sign to addition:

```typescript
// CORRECT — keeps the point under the cursor (or viewport center) fixed
const newPanX = panX + (mouseX / newZoom - mouseX / zoom);
const newPanY = panY + (mouseY / newZoom - mouseY / zoom);
```

Applied to both:
1. **`onWheel` handler** — cursor-centered zoom (Ctrl+Scroll)
2. **`zoomToCenter` function** — viewport-center zoom (+/- buttons)

---

## 7. Navbar Board Name Integration

### Problem

The board name was displayed in a custom in-page header inside `NoteBoardPage`, overlaid on top of the CorkBoard with `pt-10` padding to make room. This was inconsistent with the rest of the app's layout where the Navbar at the top serves as the page title area. The Navbar always showed a static "Dashboard" title regardless of the current page.

### Solution

Moved the board name and navigation breadcrumb into the shared top Navbar component, and made the Navbar route-aware.

#### `Navbar.tsx` — Route-Aware Page Title

- Uses `useLocation` to detect the current route
- On board pages (`/boards/:boardId`): shows a "Dashboard" back button with left arrow, a vertical divider, and the board name
- On all other pages: shows the appropriate page title ("Dashboard", "Projects", "Calendars", "Chalk Boards", "Settings") based on the route path
- Accepts a `boardName` prop from the layout

#### `AppLayout.tsx` — Outlet Context Bridge

- Added `boardName` state and `setBoardName` setter
- Passes `boardName` as a prop to `Navbar`
- Exports `AppLayoutContext` interface with `setBoardName`
- Passes `{ setBoardName }` as `Outlet` context so child routes can update the navbar

#### `NoteBoardPage.tsx` — Pushes Name to Navbar

- Uses `useOutletContext<AppLayoutContext>()` to get `setBoardName`
- Effect pushes `board?.name` to the navbar whenever it changes
- Cleanup resets `boardName` to `null` on unmount
- Removed the in-page board header (back button, divider, board name)
- Removed `pt-10` padding from the board content area
- Cleaned up unused imports (`useNavigate`, `ArrowLeft`)

---

## Files Created

### Backend (14 files)

| File | Purpose |
|------|---------|
| `Core/Entities/Board.cs` | Board entity |
| `Application/DTOs/Boards/BoardSummaryDto.cs` | Board summary DTO |
| `Application/DTOs/Boards/CreateBoardRequest.cs` | Board creation request |
| `Application/DTOs/Boards/UpdateBoardRequest.cs` | Board update request |
| `Application/DTOs/Boards/BoardListQuery.cs` | Board list query/filter |
| `Application/Interfaces/IBoardService.cs` | Board service interface |
| `Application/Services/BoardService.cs` | Board service implementation |
| `Application/Validators/Boards/CreateBoardRequestValidator.cs` | Creation validator |
| `Application/Validators/Boards/UpdateBoardRequestValidator.cs` | Update validator |
| `API/Controllers/BoardsController.cs` | Board CRUD API controller |

### Frontend (9 files)

| File | Purpose |
|------|---------|
| `src/api/boards.ts` | Board API client |
| `src/pages/NoteBoardPage.tsx` | Individual board page (extracted from Dashboard) |
| `src/pages/ProjectsPage.tsx` | Projects placeholder |
| `src/pages/CalendarsPage.tsx` | Calendars placeholder |
| `src/pages/ChalkBoardsPage.tsx` | Chalk Boards placeholder |
| `src/pages/SettingsPage.tsx` | Settings placeholder |
| `src/components/dashboard/BoardCard.tsx` | Board card component |
| `src/components/dashboard/CreateBoardDialog.tsx` | Board creation modal |
| `src/components/dashboard/ZoomControls.tsx` | Zoom control panel |

---

## Files Modified

### Backend (10 files)

| File | Changes |
|------|---------|
| `Core/Entities/Note.cs` | Added nullable `BoardId` FK and `Board` navigation |
| `Core/Entities/IndexCard.cs` | Added nullable `BoardId` FK and `Board` navigation |
| `Core/Entities/BoardConnection.cs` | Added nullable `BoardId` FK and `Board` navigation |
| `Core/Entities/User.cs` | Added `Boards` collection |
| `Infrastructure/Data/AppDbContext.cs` | Added `DbSet<Board>`, entity config, FK relationships |
| `Application/Services/NoteService.cs` | Filter/create by `BoardId` |
| `Application/Services/IndexCardService.cs` | Filter/create by `BoardId` |
| `Application/Services/BoardConnectionService.cs` | Filter/create by `BoardId` |
| `Application/Interfaces/IBoardConnectionService.cs` | Added `boardId` param to `GetConnectionsAsync` |
| `API/Program.cs` | Registered `IBoardService` |

### Frontend (10 files)

| File | Changes |
|------|---------|
| `src/types/index.ts` | Added board DTOs, updated creation requests with `boardId` |
| `src/api/connections.ts` | Updated `getConnections` to accept `boardId` filter |
| `src/pages/DashboardPage.tsx` | Completely rewritten as board management hub |
| `src/router/index.tsx` | Added new routes for boards, projects, calendars, etc. |
| `src/components/layout/Sidebar.tsx` | Updated nav items, context-aware board tools |
| `src/components/layout/Navbar.tsx` | Route-aware page title, board name breadcrumb |
| `src/components/layout/AppLayout.tsx` | Outlet context for board name, passed to Navbar |
| `src/components/dashboard/CorkBoard.tsx` | Full viewport/canvas infinite pan & zoom implementation |
| `src/components/dashboard/StickyNote.tsx` | Zoom-aware dragging and resizing |
| `src/components/dashboard/IndexCard.tsx` | Zoom-aware dragging and resizing |
| `src/components/dashboard/RedStringLayer.tsx` | Zoom-aware pin position calculation |

---

## Database Migrations

| Migration | Description |
|-----------|-------------|
| `AddBoardEntity` | Creates `Boards` table; adds nullable `BoardId` FK column to `Notes`, `IndexCards`, `BoardConnections` tables with indexes and `SetNull` delete behavior |

---

## Architecture Summary

```
Before:
  Dashboard (monolithic) → Notes + IndexCards + Connections (user-scoped)

After:
  Dashboard Hub ──┬── Note Board 1 → Notes + IndexCards + Connections (board-scoped)
                  ├── Note Board 2 → Notes + IndexCards + Connections (board-scoped)
                  ├── Chalk Board (placeholder)
                  ├── Calendar (placeholder)
                  └── Projects (placeholder)
```

The Navbar now serves as a unified page title bar, showing contextual breadcrumbs when viewing a board and route-based titles on all other pages. The CorkBoard supports infinite canvas navigation via pan and zoom, with per-board viewport state persistence.
