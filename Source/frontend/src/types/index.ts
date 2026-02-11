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

// --- Note DTOs ---

interface NoteTagDto {
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
