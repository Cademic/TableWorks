# Session Summary — February 12, 2026

This document covers all features implemented, backend changes, UI updates, and bug fixes completed during the February 12 development session. The primary focus was on enhancing the **Projects** feature, improving the **Dashboard** layout, and adding various quality-of-life improvements.

---

## Table of Contents

- [1. Add Existing Boards to Projects](#1-add-existing-boards-to-projects)
- [2. Dashboard Section Reorder & Active Projects](#2-dashboard-section-reorder--active-projects)
- [3. Remove Calendar from New Board Dialog](#3-remove-calendar-from-new-board-dialog)
- [4. Indefinite Projects (Nullable Dates)](#4-indefinite-projects-nullable-dates)
- [5. Duplicate Name Prevention (Projects & Boards)](#5-duplicate-name-prevention-projects--boards)
- [6. Remove Delete Icon on Dashboard Project Cards](#6-remove-delete-icon-on-dashboard-project-cards)
- [7. Display Owner Username on Project Cards & Members](#7-display-owner-username-on-project-cards--members)
- [8. Project Calendar Tab (Placeholder)](#8-project-calendar-tab-placeholder)
- [9. Remove Calendar Filter from Project Boards Tab](#9-remove-calendar-filter-from-project-boards-tab)
- [Files Created](#files-created)
- [Files Modified](#files-modified)
- [Database Migrations](#database-migrations)

---

## 1. Add Existing Boards to Projects

### Problem

Users could only create new boards inside a project. There was no way to move an already-existing board into a project.

### Solution

Created an `AddExistingBoardDialog` component and wired it into the `ProjectDetailPage`.

#### `AddExistingBoardDialog.tsx` (New File)

- Fetches all of the user's boards via the `getBoards` API
- Filters out boards that already belong to a project (`projectId` is set) or are already in the current project
- Provides a search input to filter boards by name
- Displays each board with its type icon, name, type label, and relative last-updated time
- Single-select with a highlighted ring and checkmark indicator
- "Add to Project" button calls the `addBoardToProject` API endpoint

#### `ProjectDetailPage.tsx`

- Added `isAddExistingBoardOpen` state and `handleAddExistingBoard` async function
- `handleAddExistingBoard` calls `addBoardToProject(projectId, boardId)` then refreshes the project
- Updated `BoardsTab` interface to accept an `onAddExisting` prop
- The boards toolbar now shows two buttons: **"Add Existing"** (outlined, folder icon) and **"New Board"** (amber, plus icon)
- The empty state also shows both "Add Existing Board" and "Create New Board" buttons
- Rendered `AddExistingBoardDialog` alongside other dialogs

---

## 2. Dashboard Section Reorder & Active Projects

### Problem

The dashboard section order was: Note Boards → Projects (static link) → Chalk Boards → Calendars. Users wanted Calendar at the top, and the Projects section should show actual active projects instead of just a link.

### Solution

Reordered sections and replaced the static Projects section with live data.

#### `DashboardPage.tsx`

- **New section order:** Calendars (Coming Soon) → Projects → Note Boards → Chalk Boards
- Added `getProjects` import from `../api/projects` and `ProjectCard` import
- Added `useNavigate` from React Router
- Added `activeProjects` state (`ProjectSummaryDto[]`)
- `fetchBoards` now uses `Promise.all` to fetch both boards and active projects in parallel: `getProjects({ status: "Active" })`
- **Projects section:** Displays up to 3 active project cards using the existing `ProjectCard` component
- Shows a **"View All Projects"** button (with arrow icon) that navigates to `/projects`
- When no active projects exist, shows an empty state with "Create your first project" button
- The project count badge reflects the actual number of active projects

---

## 3. Remove Calendar from New Board Dialog

### Problem

The "Create New Board" dialog showed three board types: Note Board, Chalk Board, and Calendar (disabled/Coming Soon). Since there will only be one calendar per user (not a board type), it should be removed from the board creation flow.

### Solution

#### `CreateBoardDialog.tsx`

- Removed the `Calendar` import from lucide-react
- Removed the Calendar entry from the `BOARD_TYPES` array
- Changed the type selector grid from `grid-cols-3` to `grid-cols-2`
- Removed all `isDisabled` / "Coming Soon" related styling and logic

---

## 4. Indefinite Projects (Nullable Dates)

### Problem

When creating a project without the "Add time constraints" checkbox enabled, the system was still sending default dates (today and next month). Projects without time constraints should be truly indefinite — no start/end dates at all.

### Solution

Made `StartDate` and `EndDate` nullable across the entire stack.

#### Backend — Entity

- **`Project.cs`**: Changed `StartDate` and `EndDate` from `DateTime` to `DateTime?`

#### Backend — DTOs

- **`CreateProjectRequest.cs`**: `StartDate` and `EndDate` changed to `DateTime?`
- **`UpdateProjectRequest.cs`**: `StartDate` and `EndDate` changed to `DateTime?`
- **`ProjectSummaryDto.cs`**: `StartDate` and `EndDate` changed to `DateTime?`
- **`ProjectDetailDto.cs`**: `StartDate` and `EndDate` changed to `DateTime?`

#### Backend — Service

- **`ProjectService.cs`**:
  - `CreateProjectAsync`: Uses `HasValue` checks before calling `DateTime.SpecifyKind` for `StartDate` and `EndDate`
  - `UpdateProjectAsync`: Same nullable handling

#### Database Migration

- **`MakeProjectDatesNullable`**: Ran `ALTER TABLE "Projects" ALTER COLUMN "StartDate" DROP NOT NULL` and same for `EndDate`

#### Frontend — TypeScript Interfaces

- **`types/index.ts`**: `startDate` and `endDate` changed to `string | null` on `ProjectSummaryDto` and `ProjectDetailDto`, and made optional on `CreateProjectRequest` and `UpdateProjectRequest`

#### Frontend — CreateProjectDialog

- When "Add time constraints" is unchecked, sends `undefined` for all date fields instead of default dates

#### Frontend — ProjectsPage

- `handleCreate` accepts optional date parameters and passes `undefined` when empty

#### Frontend — ProjectCard

- Footer shows **"Indefinite"** when `startDate` and `endDate` are null

#### Frontend — ProjectDetailPage

- Header metadata shows **"Indefinite"** instead of formatted dates when null
- `toInputDate` helper now handles null input (returns empty string)
- `handleSaveSettings` sends `undefined` for empty date strings
- **Settings tab**: Date fields are now behind a **"Time constraints enabled"** toggle checkbox (`TimeConstraintsBlock` sub-component). Unchecking it clears all date fields. The toggle auto-detects whether dates exist when loading.

---

## 5. Duplicate Name Prevention (Projects & Boards)

### Problem

Users could create multiple projects or boards with the exact same name, leading to confusion.

### Solution

Added server-side uniqueness checks and surfaced errors in the frontend dialogs.

#### Backend — ExceptionHandlingMiddleware

- **`ExceptionHandlingMiddleware.cs`**: Now maps specific exception types to appropriate HTTP status codes:
  - `InvalidOperationException` → **409 Conflict** (includes error message in response body)
  - `KeyNotFoundException` → **404 Not Found**
  - `UnauthorizedAccessException` → **403 Forbidden**
  - Generic `Exception` → **500 Internal Server Error** (unchanged)

#### Backend — ProjectService

- **`CreateProjectAsync`**: Before creating, checks if the user already owns a project with the same name. Throws `InvalidOperationException` with message: `You already have a project named "X"`

#### Backend — BoardService

- **`CreateBoardAsync`**: Before creating, checks if the user already has a board with the same name **and** same board type. Throws `InvalidOperationException` with message: `You already have a note board/chalk board named "X"`

#### Frontend — Dialog Error Display

- **`CreateProjectDialog.tsx`**: Accepts an optional `error` prop and displays it as a red banner inside the dialog. No longer auto-closes on submit (parent controls closing on success).
- **`CreateBoardDialog.tsx`**: Same pattern — accepts `error` prop, displays red banner, parent controls close.

#### Frontend — Error Handling in Pages

- **`ProjectsPage.tsx`**: Catches 409 errors from axios, extracts the `message` from the response body, and passes it to `CreateProjectDialog`. Clears error on dialog close.
- **`DashboardPage.tsx`**: Same pattern for board creation — catches 409, sets `createBoardError` state, passes to dialog.
- **`ProjectDetailPage.tsx`**: Same pattern for board creation within a project.

---

## 6. Remove Delete Icon on Dashboard Project Cards

### Problem

Project cards on the dashboard showed a delete icon on hover for owners, but the dashboard used a no-op `onDelete={() => {}}`. The delete action should only be available on the Projects page, not the dashboard.

### Solution

#### `ProjectCard.tsx`

- Changed `onDelete` prop from required to optional: `onDelete?: (id: string) => void`
- Delete button only renders when both `isOwner` AND `onDelete` is provided

#### `DashboardPage.tsx`

- Removed the `onDelete={() => {}}` prop from dashboard `ProjectCard` renders

---

## 7. Display Owner Username on Project Cards & Members

### Problem

Project cards and the member list only showed the owner's ID, not their username. Users couldn't see who owned a project at a glance.

### Solution

Added `ownerUsername` field from the backend through to the frontend.

#### Backend — DTOs

- **`ProjectSummaryDto.cs`**: Added `OwnerUsername` property
- **`ProjectDetailDto.cs`**: Added `OwnerUsername` property

#### Backend — ProjectService

- **`GetProjectsAsync`**: Added `.Include(p => p.Owner)` to the query; maps `OwnerUsername = p.Owner?.Username`
- **`GetProjectByIdAsync`**: Added `.Include(p => p.Owner)` to the query; maps `OwnerUsername = project.Owner?.Username`

#### Frontend — TypeScript Interfaces

- Added `ownerUsername: string` to both `ProjectSummaryDto` and `ProjectDetailDto`

#### Frontend — ProjectCard

- Shows the owner's username with a crown icon just above the footer

#### Frontend — ProjectDetailPage Header

- Shows the owner's username with a crown icon in the metadata row (alongside status, role, and dates)

#### Frontend — MemberList / OwnerRow

- `MemberList` now accepts `ownerUsername` prop and passes it to `OwnerRow`
- `OwnerRow` displays the actual username instead of the generic "Project Owner" text
- Shows a first-letter avatar instead of the crown icon in the avatar circle

#### Frontend — ProjectsPage

- `handleCreate` now includes `ownerUsername` when constructing the summary from a newly created project

---

## 8. Project Calendar Tab (Placeholder)

### Problem

When opening a project, the first tab was "Boards". The user wanted a Calendar tab to be the first thing visible, serving as the future home for project-specific timelines and deadlines.

### Solution

#### `ProjectDetailPage.tsx`

- Added `"calendar"` to the `TabId` union type
- Added Calendar as the first entry in the `TABS` array with the `Calendar` icon
- Changed the default active tab from `"boards"` to `"calendar"`
- Added a Coming Soon placeholder for the calendar tab content with a sky-blue calendar icon, "Project Calendar" heading, and description text

---

## 9. Remove Calendar Filter from Project Boards Tab

### Problem

The Boards tab inside a project had a "Calendars" filter pill in the board type filters, which is no longer relevant since calendars are not a board type.

### Solution

#### `ProjectDetailPage.tsx` — `BoardsTab` sub-component

- Removed the `{ value: "Calendar", label: "Calendars", icon: Calendar }` entry from the `boardTypes` array

---

## Files Created

| File | Description |
|------|-------------|
| `Source/frontend/src/components/projects/AddExistingBoardDialog.tsx` | Dialog for selecting and adding existing boards to a project |
| `Source/Backend/src/TableWorks.Infrastructure/Data/Migrations/*_MakeProjectDatesNullable.cs` | EF Core migration making StartDate/EndDate nullable |

## Files Modified

### Backend

| File | Changes |
|------|---------|
| `TableWorks.Core/Entities/Project.cs` | `StartDate` and `EndDate` changed to `DateTime?` |
| `TableWorks.Application/DTOs/Projects/CreateProjectRequest.cs` | `StartDate` and `EndDate` changed to `DateTime?` |
| `TableWorks.Application/DTOs/Projects/UpdateProjectRequest.cs` | `StartDate` and `EndDate` changed to `DateTime?` |
| `TableWorks.Application/DTOs/Projects/ProjectSummaryDto.cs` | `StartDate`/`EndDate` nullable; added `OwnerUsername` |
| `TableWorks.Application/DTOs/Projects/ProjectDetailDto.cs` | `StartDate`/`EndDate` nullable; added `OwnerUsername` |
| `TableWorks.Application/Services/ProjectService.cs` | Nullable date handling; duplicate name check; `.Include(p => p.Owner)`; `OwnerUsername` mapping |
| `TableWorks.Application/Services/BoardService.cs` | Duplicate name check per user+board type |
| `TableWorks.API/Middleware/ExceptionHandlingMiddleware.cs` | Added 409/404/403 exception mapping |

### Frontend

| File | Changes |
|------|---------|
| `frontend/src/types/index.ts` | Nullable dates on project DTOs; optional dates on request DTOs; `ownerUsername` field |
| `frontend/src/pages/DashboardPage.tsx` | Section reorder; active projects fetch; `ProjectCard` rendering; board creation error handling |
| `frontend/src/pages/ProjectsPage.tsx` | Optional dates in `handleCreate`; duplicate name error handling |
| `frontend/src/pages/ProjectDetailPage.tsx` | Add existing board flow; nullable date handling; board creation error; `ownerUsername` display; calendar tab; removed calendar board filter; `TimeConstraintsBlock` sub-component |
| `frontend/src/components/dashboard/CreateBoardDialog.tsx` | Removed Calendar type; added `error` prop; parent-controlled close |
| `frontend/src/components/projects/CreateProjectDialog.tsx` | Sends `undefined` for dates when unchecked; added `error` prop; parent-controlled close |
| `frontend/src/components/projects/ProjectCard.tsx` | Optional `onDelete`; owner username display; "Indefinite" for null dates |
| `frontend/src/components/projects/MemberList.tsx` | `ownerUsername` prop; actual username in OwnerRow with avatar |

## Database Migrations

| Migration | Description |
|-----------|-------------|
| `MakeProjectDatesNullable` | `ALTER TABLE "Projects" ALTER COLUMN "StartDate" DROP NOT NULL; ALTER TABLE "Projects" ALTER COLUMN "EndDate" DROP NOT NULL;` |
