import type { DrawingDto, SaveDrawingRequest } from "../types";
import { apiClient } from "./client";

export async function getDrawing(boardId: string): Promise<DrawingDto> {
  const response = await apiClient.get<DrawingDto>(`/boards/${boardId}/drawing`);
  return response.data;
}

export async function saveDrawing(boardId: string, data: SaveDrawingRequest): Promise<DrawingDto> {
  const response = await apiClient.put<DrawingDto>(`/boards/${boardId}/drawing`, data);
  return response.data;
}
