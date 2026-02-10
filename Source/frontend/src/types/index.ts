export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  role: string;
  createdAt: string;
  lastLoginAt: string | null;
  isActive: boolean;
}

export interface Note {
  id: string;
  userId: string;
  title: string | null;
  content: string;
  folderId: string | null;
  projectId: string | null;
  createdAt: string;
  updatedAt: string;
  lastSavedAt: string | null;
  isArchived: boolean;
}

export interface Project {
  id: string;
  ownerId: string;
  name: string;
  description: string | null;
  startDate: string;
  endDate: string;
  deadline: string | null;
  status: string;
  progress: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: string;
  joinedAt: string;
  invitedByUserId: string | null;
}

export interface Tag {
  id: string;
  name: string;
  color: string | null;
  createdAt: string;
}

export interface NoteTag {
  noteId: string;
  tagId: string;
  createdAt: string;
}

export interface Folder {
  id: string;
  userId: string;
  name: string;
  parentFolderId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string | null;
  actionType: string;
  entityType: string;
  entityId: string | null;
  detailsJson: string | null;
  ipAddress: string | null;
  timestamp: string;
}

export interface UserPreferences {
  id: string;
  userId: string;
  theme: "light" | "dark" | "system";
  emailNotificationsJson: string | null;
  autoSaveInterval: number;
  defaultView: string;
  updatedAt: string;
}
