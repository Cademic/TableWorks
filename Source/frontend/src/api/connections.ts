import type { BoardConnectionDto, CreateBoardConnectionRequest } from "../types";
import { apiClient } from "./client";

export async function getConnections(params?: Record<string, string>): Promise<BoardConnectionDto[]> {
  const response = await apiClient.get<BoardConnectionDto[]>("/board-connections", { params });
  return response.data;
}

export async function createConnection(data: CreateBoardConnectionRequest): Promise<BoardConnectionDto> {
  const response = await apiClient.post<BoardConnectionDto>("/board-connections", data);
  return response.data;
}

export async function deleteConnection(id: string): Promise<void> {
  await apiClient.delete(`/board-connections/${id}`);
}
