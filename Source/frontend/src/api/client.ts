import axios from "axios";

export const apiClient = axios.create({
  baseURL: "/api/v1",
  timeout: 10000,
});

apiClient.interceptors.request.use((config) => {
  const token = window.localStorage.getItem("tableworks.access_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
