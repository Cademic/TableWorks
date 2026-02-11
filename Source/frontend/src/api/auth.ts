import type { AuthResponse, LoginRequest, RegisterRequest } from "../types";
import { apiClient } from "./client";

export async function postLogin(data: LoginRequest): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>("/auth/login", data);
  return response.data;
}

export async function postRegister(data: RegisterRequest): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>("/auth/register", data);
  return response.data;
}

export async function postLogout(): Promise<void> {
  await apiClient.post("/auth/logout");
}
