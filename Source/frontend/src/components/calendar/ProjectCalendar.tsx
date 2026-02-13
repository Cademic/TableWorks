import { useCallback, useEffect, useState } from "react";
import {
  getCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
} from "../../api/calendar-events";
import { CalendarHeader } from "./CalendarHeader";
import { CalendarGrid } from "./CalendarGrid";
import { CreateEventDialog } from "./CreateEventDialog";
import type { CalendarEventDto, ProjectSummaryDto } from "../../types";

function toLocalDateStr(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

interface ProjectCalendarProps {
  projectId: string;
  projectName: string;
  startDate: string | null;
  endDate: string | null;
  deadline: string | null;
}

export function ProjectCalendar({
  projectId,
  projectName,
  startDate,
  endDate,
  deadline,
}: ProjectCalendarProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [events, setEvents] = useState<CalendarEventDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogDate, setDialogDate] = useState("");
  const [editingEvent, setEditingEvent] = useState<CalendarEventDto | null>(null);

  // Build a synthetic project for the grid to show the project's own date range
  const projectAsEntry: ProjectSummaryDto[] =
    startDate && endDate
      ? [
          {
            id: projectId,
            name: projectName,
            description: null,
            startDate,
            endDate,
            deadline,
            status: "Active",
            progress: 0,
            color: "#6366f1",
            ownerId: "",
            ownerUsername: "",
            userRole: "",
            memberCount: 0,
            boardCount: 0,
            createdAt: "",
          },
        ]
      : [];

  const fetchEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const from = new Date(year, month - 1, 1).toISOString();
      const to = new Date(year, month + 2, 0).toISOString();

      const result = await getCalendarEvents({ from, to, projectId });
      setEvents(result);
    } catch {
      console.error("Failed to load project calendar events");
    } finally {
      setIsLoading(false);
    }
  }, [currentDate, projectId]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  function handlePreviousMonth() {
    setCurrentDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1),
    );
  }

  function handleNextMonth() {
    setCurrentDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1),
    );
  }

  function handleToday() {
    setCurrentDate(new Date());
  }

  function handleClickDay(date: Date) {
    setEditingEvent(null);
    setDialogDate(toLocalDateStr(date));
    setDialogOpen(true);
  }

  function handleClickEvent(event: CalendarEventDto) {
    setEditingEvent(event);
    setDialogDate("");
    setDialogOpen(true);
  }

  async function handleSave(data: {
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    isAllDay: boolean;
    color: string;
    eventType: string;
  }) {
    try {
      const toNoonUtc = (s: string) => `${s}T12:00:00.000Z`;
      if (editingEvent) {
        await updateCalendarEvent(editingEvent.id, {
          title: data.title,
          description: data.description || undefined,
          startDate: toNoonUtc(data.startDate),
          endDate: data.endDate ? toNoonUtc(data.endDate) : undefined,
          isAllDay: data.isAllDay,
          color: data.color,
          eventType: data.eventType,
        });
      } else {
        await createCalendarEvent({
          title: data.title,
          description: data.description || undefined,
          projectId,
          startDate: toNoonUtc(data.startDate),
          endDate: data.endDate ? toNoonUtc(data.endDate) : undefined,
          isAllDay: data.isAllDay,
          color: data.color,
          eventType: data.eventType,
        });
      }
      setDialogOpen(false);
      setEditingEvent(null);
      fetchEvents();
    } catch {
      console.error("Failed to save event");
    }
  }

  async function handleDelete() {
    if (!editingEvent) return;
    try {
      await deleteCalendarEvent(editingEvent.id);
      setDialogOpen(false);
      setEditingEvent(null);
      fetchEvents();
    } catch {
      console.error("Failed to delete event");
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <span className="text-xs text-foreground/50">Loading calendar...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Deadline indicator */}
      {deadline && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-800/50 dark:bg-amber-950/20">
          <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
            Deadline: {new Date(deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </span>
        </div>
      )}

      <CalendarHeader
        currentDate={currentDate}
        onPreviousMonth={handlePreviousMonth}
        onNextMonth={handleNextMonth}
        onToday={handleToday}
      />

      <CalendarGrid
        currentDate={currentDate}
        events={events}
        projects={projectAsEntry}
        onClickDay={handleClickDay}
        onClickEvent={handleClickEvent}
      />

      <CreateEventDialog
        isOpen={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditingEvent(null);
        }}
        onSave={handleSave}
        onDelete={editingEvent ? handleDelete : undefined}
        initialDate={dialogDate}
        editEvent={editingEvent}
        projectId={projectId}
      />
    </div>
  );
}
