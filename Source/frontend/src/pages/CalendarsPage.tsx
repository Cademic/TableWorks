import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar } from "lucide-react";
import {
  getCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
} from "../api/calendar-events";
import { getProjects } from "../api/projects";
import { CalendarHeader, type CalendarLayout } from "../components/calendar/CalendarHeader";
import { CalendarGrid } from "../components/calendar/CalendarGrid";
import { CalendarTimeline } from "../components/calendar/CalendarTimeline";
import { CreateEventDialog } from "../components/calendar/CreateEventDialog";
import type {
  CalendarEventDto,
  ProjectSummaryDto,
} from "../types";

function toLocalDateStr(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function CalendarsPage() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [events, setEvents] = useState<CalendarEventDto[]>([]);
  const [projects, setProjects] = useState<ProjectSummaryDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [layout, setLayout] = useState<CalendarLayout>("grid");

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogDate, setDialogDate] = useState<string>("");
  const [editingEvent, setEditingEvent] = useState<CalendarEventDto | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();

      // Fetch a range that covers leading/trailing days in the grid
      const from = new Date(year, month - 1, 1).toISOString();
      const to = new Date(year, month + 2, 0).toISOString();

      const [eventsResult, projectsResult] = await Promise.all([
        getCalendarEvents({ from, to }),
        getProjects({ status: "Active" }).catch(() => [] as ProjectSummaryDto[]),
      ]);

      setEvents(eventsResult);
      setProjects(projectsResult);
    } catch {
      console.error("Failed to load calendar data");
    } finally {
      setIsLoading(false);
    }
  }, [currentDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
    startHour: string;
    endHour: string;
    recurrenceFrequency: string;
    recurrenceInterval: number;
    recurrenceEndDate: string;
  }) {
    try {
      const toDateUtc = (dateStr: string, hour: string, allDay: boolean) =>
        allDay ? `${dateStr}T12:00:00.000Z` : `${dateStr}T${hour}:00:00.000Z`;

      const startIso = toDateUtc(data.startDate, data.startHour, data.isAllDay);
      const endIso = data.endDate
        ? toDateUtc(data.endDate, data.endHour, data.isAllDay)
        : undefined;

      const recurrence = data.recurrenceFrequency
        ? {
            recurrenceFrequency: data.recurrenceFrequency,
            recurrenceInterval: data.recurrenceInterval,
            recurrenceEndDate: data.recurrenceEndDate
              ? `${data.recurrenceEndDate}T12:00:00.000Z`
              : undefined,
          }
        : {
            recurrenceFrequency: undefined,
            recurrenceInterval: 1,
            recurrenceEndDate: undefined,
          };

      // For recurring event instances, edit/delete the source event
      const eventId = editingEvent?.recurrenceSourceId ?? editingEvent?.id;

      if (editingEvent && eventId) {
        await updateCalendarEvent(eventId, {
          title: data.title,
          description: data.description || undefined,
          startDate: startIso,
          endDate: endIso,
          isAllDay: data.isAllDay,
          color: data.color,
          eventType: data.eventType,
          ...recurrence,
        });
      } else {
        await createCalendarEvent({
          title: data.title,
          description: data.description || undefined,
          startDate: startIso,
          endDate: endIso,
          isAllDay: data.isAllDay,
          color: data.color,
          eventType: data.eventType,
          ...recurrence,
        });
      }
      setDialogOpen(false);
      setEditingEvent(null);
      fetchData();
    } catch {
      console.error("Failed to save event");
    }
  }

  async function handleDelete() {
    if (!editingEvent) return;
    try {
      const eventId = editingEvent.recurrenceSourceId ?? editingEvent.id;
      await deleteCalendarEvent(eventId);
      setDialogOpen(false);
      setEditingEvent(null);
      fetchData();
    } catch {
      console.error("Failed to delete event");
    }
  }

  // Build a projectId -> projectName map for displaying project names on events
  const projectNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const p of projects) {
      map[p.id] = p.name;
    }
    return map;
  }, [projects]);

  function handleClickProject(project: ProjectSummaryDto) {
    navigate(`/projects/${project.id}`);
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <span className="text-sm text-foreground/60">
            Loading calendar...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-6xl px-6 py-6">
        {/* Page header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 dark:bg-sky-950/40">
            <Calendar className="h-5 w-5 text-sky-600 dark:text-sky-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Calendar</h1>
            <p className="text-xs text-foreground/50">
              Schedule events, deadlines, and milestones
            </p>
          </div>
        </div>

        {/* Calendar navigation + layout toggle */}
        <CalendarHeader
          currentDate={currentDate}
          onPreviousMonth={handlePreviousMonth}
          onNextMonth={handleNextMonth}
          onToday={handleToday}
          layout={layout}
          onLayoutChange={setLayout}
        />

        {/* Calendar view */}
        {layout === "grid" ? (
          <CalendarGrid
            currentDate={currentDate}
            events={events}
            projects={projects}
            onClickDay={handleClickDay}
            onClickEvent={handleClickEvent}
            onClickProject={handleClickProject}
            projectNameMap={projectNameMap}
          />
        ) : (
          <CalendarTimeline
            currentDate={currentDate}
            events={events}
            projects={projects}
            onClickDay={handleClickDay}
            onClickEvent={handleClickEvent}
            onClickProject={handleClickProject}
            projectNameMap={projectNameMap}
          />
        )}

        {/* Legend */}
        <div className="mt-4 flex items-center gap-4 text-[11px] text-foreground/40">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-violet-400" />
            Projects
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-sky-400" />
            Events
          </span>
          <span className="flex items-center gap-1.5">
            📝 Notes
          </span>
        </div>
      </div>

      {/* Create/Edit Dialog */}
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
      />
    </div>
  );
}
