import type {
  NotebookSummaryDto,
  NotebookDetailDto,
  CreateNotebookRequest,
  UpdateNotebookRequest,
  UpdateNotebookPagesRequest,
  PaginatedResponse,
} from "../types";
import { apiClient } from "./client";

export async function getNotebooks(params?: Record<string, string | number>): Promise<PaginatedResponse<NotebookSummaryDto>> {
  const response = await apiClient.get<PaginatedResponse<NotebookSummaryDto>>("/notebooks", { params });
  return response.data;
}

export async function getNotebookById(id: string): Promise<NotebookDetailDto> {
  const response = await apiClient.get<NotebookDetailDto>(`/notebooks/${id}`);
  return response.data;
}

export async function createNotebook(data: CreateNotebookRequest): Promise<NotebookSummaryDto> {
  const response = await apiClient.post<NotebookSummaryDto>("/notebooks", data);
  return response.data;
}

export async function updateNotebook(id: string, data: UpdateNotebookRequest): Promise<void> {
  await apiClient.put(`/notebooks/${id}`, data);
}

export async function updateNotebookPages(id: string, data: UpdateNotebookPagesRequest): Promise<void> {
  // #region agent log
  const pagesLen = data.pages?.length ?? -1;
  fetch("http://127.0.0.1:7243/ingest/6eecc1c5-be9e-4248-a3b7-8e1107567fb0", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      location: "notebooks.ts:updateNotebookPages",
      message: "PUT request sent",
      data: { id, pagesLength: pagesLen },
      timestamp: Date.now(),
      hypothesisId: "H2",
    }),
  }).catch(() => {});
  // #endregion
  try {
    await apiClient.put(`/notebooks/${id}/pages`, data);
  } catch (err: unknown) {
    // #region agent log
    const res = (err as { response?: { status?: number; data?: unknown } })?.response;
    fetch("http://127.0.0.1:7243/ingest/6eecc1c5-be9e-4248-a3b7-8e1107567fb0", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "notebooks.ts:updateNotebookPages",
        message: "PUT request failed",
        data: { status: res?.status, statusText: (err as { response?: { statusText?: string } })?.response?.statusText },
        timestamp: Date.now(),
        hypothesisId: "H2",
      }),
    }).catch(() => {});
    // #endregion
    throw err;
  }
}

export async function deleteNotebook(id: string): Promise<void> {
  await apiClient.delete(`/notebooks/${id}`);
}

export async function toggleNotebookPin(id: string, isPinned: boolean): Promise<void> {
  await apiClient.put(`/notebooks/${id}/pin`, { isPinned });
}

export async function getPinnedNotebooks(): Promise<NotebookSummaryDto[]> {
  const response = await apiClient.get<NotebookSummaryDto[]>("/notebooks/pinned");
  return response.data;
}
