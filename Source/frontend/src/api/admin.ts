import type {
  AdminStatsDto,
  AdminAnalyticsDto,
  AdminUserDto,
  AdminUserDetailDto,
  AdminUserListQuery,
  UpdateUserStatusRequest,
  UpdateUserRoleRequest,
  PaginatedResponse,
} from "../types";
import { apiClient } from "./client";

export async function getAdminStats(): Promise<AdminStatsDto> {
  const response = await apiClient.get<AdminStatsDto>("/admin/stats");
  return response.data;
}

export async function getAdminAnalytics(): Promise<AdminAnalyticsDto> {
  const response = await apiClient.get<AdminAnalyticsDto>("/admin/analytics");
  return response.data;
}

export async function getAdminUsers(
  query: AdminUserListQuery = {}
): Promise<PaginatedResponse<AdminUserDto>> {
  const params: Record<string, string | number | boolean | undefined> = {
    page: query.page ?? 1,
    limit: query.limit ?? 50,
  };
  if (query.search !== undefined && query.search !== "") params.search = query.search;
  if (query.role !== undefined && query.role !== "") params.role = query.role;
  if (query.isActive !== undefined) params.isActive = query.isActive;

  const response = await apiClient.get<PaginatedResponse<AdminUserDto>>("/admin/users", {
    params,
  });
  return response.data;
}

export async function getAdminUserDetail(id: string): Promise<AdminUserDetailDto> {
  const response = await apiClient.get<AdminUserDetailDto>(`/admin/users/${id}`);
  return response.data;
}

export async function updateUserStatus(
  id: string,
  data: UpdateUserStatusRequest
): Promise<void> {
  await apiClient.put(`/admin/users/${id}/status`, data);
}

export async function updateUserRole(
  id: string,
  data: UpdateUserRoleRequest
): Promise<void> {
  await apiClient.put(`/admin/users/${id}/role`, data);
}

export async function deleteUser(id: string): Promise<void> {
  await apiClient.delete(`/admin/users/${id}`);
}

export async function removeUserFriend(userId: string, friendId: string): Promise<void> {
  await apiClient.delete(`/admin/users/${userId}/friends/${friendId}`);
}
