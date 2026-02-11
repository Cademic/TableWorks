import type {
  BoardSummaryDto,
  CreateBoardRequest,
  PaginatedResponse,
  UpdateBoardRequest,
} from "../types";
import { apiClient } from "./client";

export async function getBoards(params?: Record<string, string | number>): Promise<PaginatedResponse<BoardSummaryDto>> {
  const response = await apiClient.get<PaginatedResponse<BoardSummaryDto>>("/boards", { params });
  return response.data;
}

export async function getBoardById(id: string): Promise<BoardSummaryDto> {
  const response = await apiClient.get<BoardSummaryDto>(`/boards/${id}`);
  return response.data;
}

export async function createBoard(data: CreateBoardRequest): Promise<BoardSummaryDto> {
  const response = await apiClient.post<BoardSummaryDto>("/boards", data);
  return response.data;
}

export async function updateBoard(id: string, data: UpdateBoardRequest): Promise<void> {
  await apiClient.put(`/boards/${id}`, data);
}

export async function deleteBoard(id: string): Promise<void> {
  await apiClient.delete(`/boards/${id}`);
}
