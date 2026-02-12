# Session Summary — February 11, 2026

This document summarizes all features implemented, bugs fixed, and infrastructure changes made during this development session.

---

## Table of Contents

- [1. Index Card Backend Implementation](#1-index-card-backend-implementation)
- [2. Red String Drop Shadow](#2-red-string-drop-shadow)
- [3. Red String Click-to-Select Deletion](#3-red-string-click-to-select-deletion)
- [4. Red String Database Persistence](#4-red-string-database-persistence)
- [Files Changed](#files-changed)
- [Database Migrations](#database-migrations)

---

## 1. Index Card Backend Implementation

### Problem

Index Cards were not saving to the database. The frontend had complete API client code calling `/api/v1/index-cards` endpoints, but the backend had **zero** Index Card support — no entity, no database table, no controller, no service, no DTOs.

The frontend used an "optimistic creation" workaround where cards were added to local React state with temporary IDs, but they were lost on every page refresh.

### Solution

Built the entire backend stack for Index Cards following the existing Note pattern:

#### Core Layer
- **`IndexCard.cs`** — Entity with all fields: `Id`, `UserId`, `Title`, `Content`, `FolderId`, `ProjectId`, `CreatedAt`, `UpdatedAt`, `LastSavedAt`, `IsArchived`, `PositionX`, `PositionY`, `Width`, `Height`, `Color`, `Rotation`
- **`IndexCardTag.cs`** — Join entity for many-to-many tag relationships
- Added `ICollection<IndexCard> IndexCards` navigation property to `User`, `Folder`, `Project` entities
- Added `ICollection<IndexCardTag> IndexCardTags` navigation property to `Tag` entity

#### Application Layer
- **DTOs**: `IndexCardSummaryDto`, `IndexCardDetailDto`, `CreateIndexCardRequest`, `PatchIndexCardRequest`, `IndexCardListQuery`
- **Interface**: `IIndexCardService` with Get (paginated list), GetById, Create, Patch, Delete
- **Service**: `IndexCardService` — full implementation with filtering (folder, project, tags, search), sorting (createdAt, updatedAt, title), pagination, and tag management
- **Validators**: `CreateIndexCardRequestValidator` (10,000 char content limit), `PatchIndexCardRequestValidator`
- **AutoMapper**: `IndexCard -> IndexCardSummaryDto` and `IndexCard -> IndexCardDetailDto` mappings

#### API Layer
- **`IndexCardsController`** at `api/v{version}/index-cards`
  - `GET /` — paginated list with filters
  - `POST /` — create (returns 201)
  - `GET /{id}` — get by ID
  - `PATCH /{id}` — partial update
  - `DELETE /{id}` — delete

#### Infrastructure
- `DbSet<IndexCard>` and `DbSet<IndexCardTag>` added to `AppDbContext`
- Entity configuration: UUID generation, indexes on `UserId`, `CreatedAt`, `UpdatedAt`, `FolderId`, `ProjectId`; FK relationships with `SetNull` delete behavior for Folder/Project
- `IndexCardTag` composite key on `(IndexCardId, TagId)`
- DI registration: `IIndexCardService -> IndexCardService` in `Program.cs`
- EF Core migration `AddIndexCardTable` created and applied

### Files Created

- `Source/backend/src/ASideNote.Core/Entities/IndexCard.cs`
- `Source/backend/src/ASideNote.Core/Entities/IndexCardTag.cs`
- `Source/backend/src/ASideNote.Application/DTOs/IndexCards/IndexCardSummaryDto.cs`
- `Source/backend/src/ASideNote.Application/DTOs/IndexCards/IndexCardDetailDto.cs`
- `Source/backend/src/ASideNote.Application/DTOs/IndexCards/CreateIndexCardRequest.cs`
- `Source/backend/src/ASideNote.Application/DTOs/IndexCards/PatchIndexCardRequest.cs`
- `Source/backend/src/ASideNote.Application/DTOs/IndexCards/IndexCardListQuery.cs`
- `Source/backend/src/ASideNote.Application/Interfaces/IIndexCardService.cs`
- `Source/backend/src/ASideNote.Application/Services/IndexCardService.cs`
- `Source/backend/src/ASideNote.Application/Validators/IndexCards/CreateIndexCardRequestValidator.cs`
- `Source/backend/src/ASideNote.Application/Validators/IndexCards/PatchIndexCardRequestValidator.cs`
- `Source/backend/src/ASideNote.API/Controllers/IndexCardsController.cs`

### Files Modified

- `Source/backend/src/ASideNote.Core/Entities/User.cs` — added `IndexCards` collection
- `Source/backend/src/ASideNote.Core/Entities/Folder.cs` — added `IndexCards` collection
- `Source/backend/src/ASideNote.Core/Entities/Project.cs` — added `IndexCards` collection
- `Source/backend/src/ASideNote.Core/Entities/Tag.cs` — added `IndexCardTags` collection
- `Source/backend/src/ASideNote.Infrastructure/Data/AppDbContext.cs` — added DbSets and entity configuration
- `Source/backend/src/ASideNote.Application/Mappings/MappingProfile.cs` — added IndexCard mappings
- `Source/backend/src/ASideNote.API/Program.cs` — registered `IIndexCardService`

---

## 2. Red String Drop Shadow

### What Changed

Added a subtle drop shadow to the red string connections on the cork board to give them visual depth.

### Implementation

- Added an SVG `<defs>` block containing a `<filter>` with `<feDropShadow>` (2px blur, 2px offset down, 35% black opacity)
- Applied `filter="url(#string-shadow)"` to each visible string `<path>` element

### Files Modified

- `Source/frontend/src/components/dashboard/RedStringLayer.tsx`

---

## 3. Red String Click-to-Select Deletion

### Problem

The red string deletion used a hover-based interaction which was unreliable because:
1. `pointer-events-stroke` is not a valid Tailwind CSS utility class — it was silently ignored
2. The parent SVG had `pointer-events: none`, which cascaded to children since the Tailwind class didn't override it
3. Hovering over a thin 2px line was difficult for users

### Solution

Replaced the hover-based model with a click-to-select interaction:

1. **Click a string** — it highlights (brighter red `#ef4444`, thicker 3.5px stroke) and a round X delete button appears at the midpoint
2. **Click the X button** — deletes the connection
3. **Click elsewhere** — deselects the string (X disappears)
4. **Click the same string again** — toggles selection off

### Key Fix

Changed the hit-area path from the non-functional Tailwind class `className="pointer-events-stroke"` to an inline style `style={{ pointerEvents: "stroke" }}` which correctly sets the SVG-specific `pointer-events: stroke` value. This allows the invisible wide (16px) hit-area path to capture clicks even though the parent SVG has `pointer-events: none`.

### Technical Details

- `selectedConnection` state replaces `hoveredConnection`
- Click-away listener on `document` (`mousedown`) deselects when clicking outside the string or delete button
- Uses `data-conn-hit` and `data-delete-btn` data attributes to identify click targets
- Delete button is a `<foreignObject>` containing an HTML button with hover scale animation

### Files Modified

- `Source/frontend/src/components/dashboard/RedStringLayer.tsx`

---

## 4. Red String Database Persistence

### Problem

Red string connections were stored entirely in React component state (`useState<NoteConnection[]>([])`). They were lost on every page refresh — there was no backend support whatsoever (no entity, no API endpoints, no database table).

### Solution

Built the complete backend stack and wired the frontend to persist connections.

#### Backend — Core Layer
- **`BoardConnection.cs`** — Entity with `Id` (UUID), `UserId`, `FromItemId` (string), `ToItemId` (string), `CreatedAt`
- Added `ICollection<BoardConnection> BoardConnections` navigation to `User` entity

#### Backend — Application Layer
- **DTOs**: `BoardConnectionDto`, `CreateBoardConnectionRequest`
- **Interface**: `IBoardConnectionService` with GetAll, Create, Delete
- **Service**: `BoardConnectionService` — retrieves all connections for a user, creates new connections, deletes by ID with ownership check

#### Backend — API Layer
- **`BoardConnectionsController`** at `api/v1/board-connections`
  - `GET /` — list all connections for the authenticated user
  - `POST /` — create a connection (returns 201)
  - `DELETE /{id}` — delete a connection

#### Backend — Infrastructure
- `DbSet<BoardConnection>` added to `AppDbContext`
- Entity config: UUID default, `UserId` index, required `FromItemId`/`ToItemId`, cascade delete via User FK
- DI: `IBoardConnectionService -> BoardConnectionService`
- Migration `AddBoardConnectionTable` created and applied

#### Frontend Changes

- **New file**: `api/connections.ts` — API client with `getConnections()`, `createConnection()`, `deleteConnection()`
- **`types/index.ts`** — Added `BoardConnectionDto` and `CreateBoardConnectionRequest` interfaces; deprecated old `NoteConnection`
- **`DashboardPage.tsx`** — Updated to:
  - Fetch connections from API on load (alongside notes and index cards via `Promise.allSettled`)
  - Create connections via `POST /board-connections` when user links two pins
  - Delete connections via `DELETE /board-connections/{id}` when user removes a string
  - Added `connectionsRef` for latest-value access in event handlers
  - Duplicate detection uses `fromItemId`/`toItemId` field names
- **`RedStringLayer.tsx`** — Updated type from `NoteConnection` to `BoardConnectionDto`, field references from `fromNoteId`/`toNoteId` to `fromItemId`/`toItemId`

### Files Created

- `Source/backend/src/ASideNote.Core/Entities/BoardConnection.cs`
- `Source/backend/src/ASideNote.Application/DTOs/BoardConnections/BoardConnectionDto.cs`
- `Source/backend/src/ASideNote.Application/DTOs/BoardConnections/CreateBoardConnectionRequest.cs`
- `Source/backend/src/ASideNote.Application/Interfaces/IBoardConnectionService.cs`
- `Source/backend/src/ASideNote.Application/Services/BoardConnectionService.cs`
- `Source/backend/src/ASideNote.API/Controllers/BoardConnectionsController.cs`
- `Source/frontend/src/api/connections.ts`

### Files Modified

- `Source/backend/src/ASideNote.Core/Entities/User.cs` — added `BoardConnections` collection
- `Source/backend/src/ASideNote.Infrastructure/Data/AppDbContext.cs` — added DbSet and entity configuration
- `Source/backend/src/ASideNote.API/Program.cs` — registered `IBoardConnectionService`
- `Source/frontend/src/types/index.ts` — added new interfaces
- `Source/frontend/src/pages/DashboardPage.tsx` — wired API calls for connections
- `Source/frontend/src/components/dashboard/RedStringLayer.tsx` — updated types and field names

---

## Files Changed

### New Files (19)

| File | Purpose |
|------|---------|
| `Core/Entities/IndexCard.cs` | Index Card entity |
| `Core/Entities/IndexCardTag.cs` | Index Card tag join entity |
| `Application/DTOs/IndexCards/*.cs` (5 files) | Index Card DTOs |
| `Application/Interfaces/IIndexCardService.cs` | Index Card service interface |
| `Application/Services/IndexCardService.cs` | Index Card service implementation |
| `Application/Validators/IndexCards/*.cs` (2 files) | Index Card validators |
| `API/Controllers/IndexCardsController.cs` | Index Card API controller |
| `Core/Entities/BoardConnection.cs` | Board Connection entity |
| `Application/DTOs/BoardConnections/*.cs` (2 files) | Connection DTOs |
| `Application/Interfaces/IBoardConnectionService.cs` | Connection service interface |
| `Application/Services/BoardConnectionService.cs` | Connection service implementation |
| `API/Controllers/BoardConnectionsController.cs` | Connection API controller |
| `frontend/src/api/connections.ts` | Frontend connection API client |

### Modified Files (11)

| File | Changes |
|------|---------|
| `Core/Entities/User.cs` | Added `IndexCards` and `BoardConnections` collections |
| `Core/Entities/Folder.cs` | Added `IndexCards` collection |
| `Core/Entities/Project.cs` | Added `IndexCards` collection |
| `Core/Entities/Tag.cs` | Added `IndexCardTags` collection |
| `Infrastructure/Data/AppDbContext.cs` | Added 3 DbSets and entity configurations |
| `Application/Mappings/MappingProfile.cs` | Added IndexCard AutoMapper mappings |
| `API/Program.cs` | Registered IndexCard and Connection services |
| `frontend/src/types/index.ts` | Added `BoardConnectionDto`, `CreateBoardConnectionRequest` |
| `frontend/src/pages/DashboardPage.tsx` | Wired connection API; updated field names |
| `frontend/src/components/dashboard/RedStringLayer.tsx` | Drop shadow, click-to-select, updated types |

---

## Database Migrations

| Migration | Description |
|-----------|-------------|
| `AddIndexCardTable` | Creates `IndexCards` table with position/size/color/rotation fields, `IndexCardTags` join table, and all indexes |
| `AddBoardConnectionTable` | Creates `BoardConnections` table with `FromItemId`, `ToItemId`, `UserId` FK with cascade delete |
