import type {
  CalendarEventDto,
  CreateCalendarEventRequest,
  UpdateCalendarEventRequest,
} from "../types";
import { apiClient } from "./client";

export async function getCalendarEvents(
  params?: Record<string, string | number>,
): Promise<CalendarEventDto[]> {
  const response = await apiClient.get<CalendarEventDto[]>("/calendar-events", {
    params,
  });
  return response.data;
}

export async function createCalendarEvent(
  data: CreateCalendarEventRequest,
): Promise<CalendarEventDto> {
  const response = await apiClient.post<CalendarEventDto>(
    "/calendar-events",
    data,
  );
  return response.data;
}

export async function updateCalendarEvent(
  id: string,
  data: UpdateCalendarEventRequest,
): Promise<void> {
  await apiClient.put(`/calendar-events/${id}`, data);
}

export async function deleteCalendarEvent(id: string): Promise<void> {
  await apiClient.delete(`/calendar-events/${id}`);
}
