import type {
  NotebookSummaryDto,
  NotebookDetailDto,
  CreateNotebookRequest,
  UpdateNotebookRequest,
  UpdateNotebookContentRequest,
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

export async function updateNotebookContent(id: string, data: UpdateNotebookContentRequest): Promise<void> {
  await apiClient.put(`/notebooks/${id}/content`, data);
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

/** Download notebook export as blob. Use triggerDownload(blob, filename, mimeType) to save to computer. */
export async function downloadNotebookExport(
  id: string,
  format: string,
): Promise<{ blob: Blob; filename: string }> {
  const response = await apiClient.get<Blob>(`/notebooks/${id}/export`, {
    params: { format },
    responseType: "blob",
  });
  const blob = response.data;
  const disposition = response.headers["content-disposition"];
  let filename = "";
  if (typeof disposition === "string") {
    const match = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
    if (match?.[1]) filename = match[1].replace(/['"]/g, "").trim();
  }
  if (!filename && blob instanceof Blob) {
    const ext = format === "pdf" ? "pdf" : format === "md" ? "md" : format === "html" ? "html" : "txt";
    filename = `notebook.${ext}`;
  }
  return { blob, filename };
}
