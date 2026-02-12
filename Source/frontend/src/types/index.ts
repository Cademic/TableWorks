// --- Auth DTOs ---

export interface AuthResponse {
  userId: string;
  username: string;
  email: string;
  token: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface AuthUser {
  userId: string;
  username: string;
  email: string;
}

// --- Board DTOs ---

export interface BoardSummaryDto {
  id: string;
  name: string;
  description: string | null;
  boardType: string;
  projectId: string | null;
  createdAt: string;
  updatedAt: string;
  noteCount: number;
  indexCardCount: number;
}

export interface CreateBoardRequest {
  name: string;
  description?: string;
  boardType: string;
  projectId?: string;
}

export interface UpdateBoardRequest {
  name: string;
  description?: string;
}

// --- Note DTOs ---

export interface NoteTagDto {
  id: string;
  name: string;
  color: string | null;
}

export interface NoteSummaryDto {
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

export interface NoteDetailDto extends NoteSummaryDto {
  lastSavedAt: string | null;
}

export interface CreateNoteRequest {
  title?: string;
  content: string;
  folderId?: string;
  projectId?: string;
  boardId?: string;
  tagIds?: string[];
  positionX?: number;
  positionY?: number;
  width?: number;
  height?: number;
  color?: string;
  rotation?: number;
}

export interface PatchNoteRequest {
  title?: string | null;
  patchTitle?: boolean;
  content?: string;
  positionX?: number;
  positionY?: number;
  width?: number;
  height?: number;
  color?: string;
  rotation?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// --- Board Connections ---

export interface BoardConnectionDto {
  id: string;
  fromItemId: string;
  toItemId: string;
  createdAt: string;
}

export interface CreateBoardConnectionRequest {
  fromItemId: string;
  toItemId: string;
  boardId?: string;
}

/** @deprecated Use BoardConnectionDto instead */
export interface NoteConnection {
  id: string;
  fromNoteId: string;
  toNoteId: string;
}

// --- Index Card DTOs ---

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

export interface CreateIndexCardRequest {
  title?: string;
  content: string;
  folderId?: string;
  projectId?: string;
  boardId?: string;
  tagIds?: string[];
  positionX?: number;
  positionY?: number;
  width?: number;
  height?: number;
  color?: string;
  rotation?: number;
}

export interface PatchIndexCardRequest {
  title?: string | null;
  patchTitle?: boolean;
  content?: string;
  positionX?: number;
  positionY?: number;
  width?: number;
  height?: number;
  color?: string;
  rotation?: number;
}

// --- Drawing DTOs ---

export interface DrawingDto {
  id: string;
  boardId: string;
  canvasJson: string;
  createdAt: string;
  updatedAt: string;
}

export interface SaveDrawingRequest {
  canvasJson: string;
}

// --- Project DTOs ---

export interface ProjectSummaryDto {
  id: string;
  name: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  deadline: string | null;
  status: string;
  progress: number;
  color: string;
  ownerId: string;
  ownerUsername: string;
  userRole: string;
  memberCount: number;
  boardCount: number;
  createdAt: string;
}

export interface ProjectMemberDto {
  userId: string;
  username: string;
  email: string;
  role: string;
  joinedAt: string;
}

export interface ProjectDetailDto {
  id: string;
  name: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  deadline: string | null;
  status: string;
  progress: number;
  color: string;
  ownerId: string;
  ownerUsername: string;
  userRole: string;
  createdAt: string;
  members: ProjectMemberDto[];
  boards: BoardSummaryDto[];
  notes: NoteSummaryDto[];
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  deadline?: string;
  color?: string;
}

export interface UpdateProjectRequest {
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  deadline?: string;
  status: string;
  progress: number;
  color?: string;
}

export interface AddMemberRequest {
  email: string;
  role: string;
}

export interface UpdateMemberRoleRequest {
  role: string;
}

// --- Calendar Event DTOs ---

export interface CalendarEventDto {
  id: string;
  title: string;
  description: string | null;
  projectId: string | null;
  startDate: string;
  endDate: string | null;
  isAllDay: boolean;
  color: string;
  eventType: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCalendarEventRequest {
  title: string;
  description?: string;
  projectId?: string;
  startDate: string;
  endDate?: string;
  isAllDay?: boolean;
  color?: string;
  eventType?: string;
}

export interface UpdateCalendarEventRequest {
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  isAllDay?: boolean;
  color?: string;
  eventType?: string;
}
