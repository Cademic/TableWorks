import type {
  AddMemberRequest,
  CreateProjectRequest,
  ProjectDetailDto,
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

export async function leaveProject(projectId: string): Promise<void> {
  await apiClient.post(`/projects/${projectId}/leave`);
}

export async function transferProjectOwnership(
  projectId: string,
  newOwnerId: string,
): Promise<void> {
  await apiClient.post(`/projects/${projectId}/transfer`, {
    newOwnerId,
  });
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

export async function addNotebookToProject(
  projectId: string,
  notebookId: string,
): Promise<void> {
  await apiClient.post(`/projects/${projectId}/notebooks/${notebookId}`);
}

export async function removeNotebookFromProject(
  projectId: string,
  notebookId: string,
): Promise<void> {
  await apiClient.delete(`/projects/${projectId}/notebooks/${notebookId}`);
}

export async function getPinnedProjects(): Promise<ProjectSummaryDto[]> {
  const response = await apiClient.get<ProjectSummaryDto[]>("/projects/pinned");
  return response.data;
}

export async function toggleProjectPin(
  id: string,
  isPinned: boolean,
): Promise<void> {
  await apiClient.put(`/projects/${id}/pin`, { isPinned });
}
