import type {
  AddMemberRequest,
  CreateProjectRequest,
  ProjectDetailDto,
  ProjectMemberDto,
  ProjectSummaryDto,
  UpdateMemberRoleRequest,
  UpdateProjectRequest,
} from "../types";
import { apiClient } from "./client";

export async function getProjects(
  params?: Record<string, string | number>,
): Promise<ProjectSummaryDto[]> {
  const response = await apiClient.get<ProjectSummaryDto[]>("/projects", {
    params,
  });
  return response.data;
}

export async function createProject(
  data: CreateProjectRequest,
): Promise<ProjectDetailDto> {
  const response = await apiClient.post<ProjectDetailDto>("/projects", data);
  return response.data;
}

export async function getProjectById(
  id: string,
): Promise<ProjectDetailDto> {
  const response = await apiClient.get<ProjectDetailDto>(`/projects/${id}`);
  return response.data;
}

export async function updateProject(
  id: string,
  data: UpdateProjectRequest,
): Promise<void> {
  await apiClient.put(`/projects/${id}`, data);
}

export async function deleteProject(id: string): Promise<void> {
  await apiClient.delete(`/projects/${id}`);
}

export async function addMember(
  projectId: string,
  data: AddMemberRequest,
): Promise<void> {
  await apiClient.post(`/projects/${projectId}/members`, data);
}

export async function getMembers(
  projectId: string,
): Promise<ProjectMemberDto[]> {
  const response = await apiClient.get<ProjectMemberDto[]>(
    `/projects/${projectId}/members`,
  );
  return response.data;
}

export async function updateMemberRole(
  projectId: string,
  userId: string,
  data: UpdateMemberRoleRequest,
): Promise<void> {
  await apiClient.put(`/projects/${projectId}/members/${userId}`, data);
}

export async function removeMember(
  projectId: string,
  userId: string,
): Promise<void> {
  await apiClient.delete(`/projects/${projectId}/members/${userId}`);
}

export async function addBoardToProject(
  projectId: string,
  boardId: string,
): Promise<void> {
  await apiClient.post(`/projects/${projectId}/boards/${boardId}`);
}

export async function removeBoardFromProject(
  projectId: string,
  boardId: string,
): Promise<void> {
  await apiClient.delete(`/projects/${projectId}/boards/${boardId}`);
}
