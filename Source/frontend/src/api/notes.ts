import type {
  CreateNoteRequest,
  NoteDetailDto,
  NoteSummaryDto,
  PaginatedResponse,
  PatchNoteRequest,
} from "../types";
import { apiClient } from "./client";

export async function getNotes(params?: Record<string, string | number>): Promise<PaginatedResponse<NoteSummaryDto>> {
  const response = await apiClient.get<PaginatedResponse<NoteSummaryDto>>("/notes", { params });
  return response.data;
}

export async function createNote(data: CreateNoteRequest): Promise<NoteDetailDto> {
  const response = await apiClient.post<NoteDetailDto>("/notes", data);
  return response.data;
}

export async function patchNote(id: string, data: PatchNoteRequest): Promise<void> {
  await apiClient.patch(`/notes/${id}`, data);
}

export async function deleteNote(id: string): Promise<void> {
  await apiClient.delete(`/notes/${id}`);
}
