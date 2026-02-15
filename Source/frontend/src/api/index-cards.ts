import type {
  CreateIndexCardRequest,
  IndexCardDetailDto,
  IndexCardSummaryDto,
  PaginatedResponse,
  PatchIndexCardRequest,
} from "../types";
import { apiClient } from "./client";

export async function getIndexCards(params?: Record<string, string | number>): Promise<PaginatedResponse<IndexCardSummaryDto>> {
  const response = await apiClient.get<PaginatedResponse<IndexCardSummaryDto>>("/index-cards", { params });
  return response.data;
}

export async function createIndexCard(data: CreateIndexCardRequest): Promise<IndexCardDetailDto> {
  const response = await apiClient.post<IndexCardDetailDto>("/index-cards", data);
  return response.data;
}

export async function patchIndexCard(id: string, data: PatchIndexCardRequest): Promise<void> {
  await apiClient.patch(`/index-cards/${id}`, data);
}

export async function deleteIndexCard(id: string): Promise<void> {
  await apiClient.delete(`/index-cards/${id}`);
}
