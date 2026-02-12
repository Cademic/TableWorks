import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Calendar,
  ChevronLeft,
  ChevronRight,
  FileText,
  FolderOpen,
} from "lucide-react";
import {
  getCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
} from "../../api/calendar-events";
import { CreateEventDialog } from "../calendar/CreateEventDialog";
import type { CalendarEventDto, ProjectSummaryDto } from "../../types";

/* ─── Constants ────────────────────────────────────────── */

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const BAR_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  sky:     { bg: "bg-sky-50 dark:bg-sky-950/30",     border: "border-sky-300 dark:border-sky-700",     text: "text-sky-700 dark:text-sky-300" },
  amber:   { bg: "bg-amber-50 dark:bg-amber-950/30", border: "border-amber-300 dark:border-amber-700", text: "text-amber-700 dark:text-amber-300" },
  rose:    { bg: "bg-rose-50 dark:bg-rose-950/30",   border: "border-rose-300 dark:border-rose-700",   text: "text-rose-700 dark:text-rose-300" },
  emerald: { bg: "bg-emerald-50 dark:bg-emerald-950/30", border: "border-emerald-300 dark:border-emerald-700", text: "text-emerald-700 dark:text-emerald-300" },
  violet:  { bg: "bg-violet-50 dark:bg-violet-950/30", border: "border-violet-300 dark:border-violet-700", text: "text-violet-700 dark:text-violet-300" },
  orange:  { bg: "bg-orange-50 dark:bg-orange-950/30", border: "border-orange-300 dark:border-orange-700", text: "text-orange-700 dark:text-orange-300" },
};

/* ─── Date helpers ─────────────────────────────────────── */

function toLocalDateStr(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toNoonUtc(dateStr: string): string {
  return `${dateStr}T12:00:00.000Z`;
}

function parseServerDate(isoStr: string): Date {
  const d = new Date(isoStr);
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

function toLocalMidnight(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function localDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((localDay(b) - localDay(a)) / 86400000);
}

function dateInRange(date: Date, start: Date, end: Date): boolean {
  const d = localDay(date);
  return d >= localDay(start) && d <= localDay(end);
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/* ─── Types ────────────────────────────────────────────── */

interface WeekItem {
  id: string;
  title: string;
  color: string;
  kind: "event" | "note" | "project";
  startCol: number;
  span: number;
  continuesLeft: boolean;
  continuesRight: boolean;
  isUpcoming: boolean;
  /** The original event DTO (null for projects) */
  eventDto: CalendarEventDto | null;
}

interface MiniCalendarProps {
  projects: ProjectSummaryDto[];
}

/* ─── Main Component ───────────────────────────────────── */

export function MiniCalendar({ projects }: MiniCalendarProps) {
  const navigate = useNavigate();
  const [events, setEvents] = useState<CalendarEventDto[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogDate, setDialogDate] = useState("");
  const [editingEvent, setEditingEvent] = useState<CalendarEventDto | null>(null);

  const today = useMemo(() => new Date(), []);

  // Build 14-day range starting from Sunday of the current week
  const days = useMemo(() => {
    const startOfWeek = new Date(today);
    const dayOfWeek = today.getDay(); // 0 = Sunday
    startOfWeek.setDate(today.getDate() - dayOfWeek);
    const result: Date[] = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      result.push(d);
    }
    return result;
  }, [today]);

  const fetchEvents = useCallback(async () => {
    try {
      const from = days[0].toISOString();
      const to = days[days.length - 1].toISOString();
      const result = await getCalendarEvents({ from, to });
      setEvents(result);
    } catch {
      // Fail silently for dashboard widget
    }
  }, [days]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  function getItemsForWeek(weekDays: Date[]): WeekItem[] {
    const weekStart = weekDays[0];
    const weekEnd = weekDays[weekDays.length - 1];
    const todayMs = localDay(today);
    const items: WeekItem[] = [];
    const seen = new Set<string>();

    for (const event of events) {
      if (seen.has(event.id)) continue;
      const evStart = parseServerDate(event.startDate);
      const evEnd = event.endDate ? parseServerDate(event.endDate) : evStart;

      if (
        !dateInRange(weekStart, evStart, evEnd) &&
        !dateInRange(evStart, weekStart, weekEnd) &&
        !dateInRange(weekEnd, evStart, evEnd)
      ) {
        continue;
      }

      const continuesLeft = evStart < weekStart;
      const continuesRight = evEnd > weekEnd;
      const clampedStart = continuesLeft ? weekStart : evStart;
      const clampedEnd = continuesRight ? weekEnd : evEnd;
      const startCol = daysBetween(weekStart, clampedStart);
      const span = daysBetween(clampedStart, clampedEnd) + 1;

      if (startCol >= 0 && startCol < 7 && span > 0) {
        seen.add(event.id);
        items.push({
          id: event.id,
          title: event.title,
          color: event.color,
          kind: event.eventType === "Note" ? "note" : "event",
          startCol,
          span: Math.min(span, 7 - startCol),
          continuesLeft,
          continuesRight,
          isUpcoming: localDay(evStart) > todayMs,
          eventDto: event,
        });
      }
    }

    for (const project of projects) {
      if (!project.startDate || !project.endDate) continue;
      if (seen.has(project.id)) continue;
      const pStart = toLocalMidnight(new Date(project.startDate));
      const pEnd = toLocalMidnight(new Date(project.endDate));

      if (
        !dateInRange(weekStart, pStart, pEnd) &&
        !dateInRange(pStart, weekStart, weekEnd) &&
        !dateInRange(weekEnd, pStart, pEnd)
      ) {
        continue;
      }

      const continuesLeft = pStart < weekStart;
      const continuesRight = pEnd > weekEnd;
      const clampedStart = continuesLeft ? weekStart : pStart;
      const clampedEnd = continuesRight ? weekEnd : pEnd;
      const startCol = daysBetween(weekStart, clampedStart);
      const span = daysBetween(clampedStart, clampedEnd) + 1;

      if (startCol >= 0 && startCol < 7 && span > 0) {
        seen.add(project.id);
        items.push({
          id: project.id,
          title: project.name,
          color: project.color || "violet",
          kind: "project",
          startCol,
          span: Math.min(span, 7 - startCol),
          continuesLeft,
          continuesRight,
          isUpcoming: localDay(pStart) > todayMs,
          eventDto: null,
        });
      }
    }

    return items;
  }

  function handleDayClick(date: Date) {
    setEditingEvent(null);
    setDialogDate(toLocalDateStr(date));
    setDialogOpen(true);
  }

  function handleEventClick(item: WeekItem) {
    if (item.kind === "project") {
      navigate(`/projects/${item.id}`);
    } else if (item.eventDto) {
      setEditingEvent(item.eventDto);
      setDialogDate("");
      setDialogOpen(true);
    }
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

  const week1 = days.slice(0, 7);
  const week2 = days.slice(7, 14);
  const week1Items = getItemsForWeek(week1);
  const week2Items = getItemsForWeek(week2);

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      {/* Week 1 */}
      <WeekSection
        days={week1}
        items={week1Items}
        today={today}
        onDayClick={handleDayClick}
        onEventClick={handleEventClick}
      />

      {/* Week 2 */}
      <WeekSection
        days={week2}
        items={week2Items}
        today={today}
        onDayClick={handleDayClick}
        onEventClick={handleEventClick}
      />

      {/* No items placeholder */}
      {week1Items.length === 0 && week2Items.length === 0 && (
        <div className="navbar-surface flex items-center justify-center py-8 text-xs text-foreground/30">
          No events or projects this fortnight
        </div>
      )}

      {/* Footer */}
      <div className="navbar-surface flex items-center justify-end border-t border-border/40 px-3 py-2">
        <button
          type="button"
          onClick={() => navigate("/calendar")}
          className="flex items-center gap-1.5 rounded-lg border border-border/80 bg-background px-4 py-1.5 text-xs font-medium text-foreground/60 transition-all hover:border-sky-400 hover:text-sky-600 hover:shadow-sm dark:hover:text-sky-400"
        >
          View Full Calendar
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Create / Edit Event Dialog */}
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

/* ─── Week Section ─────────────────────────────────────── */

interface WeekSectionProps {
  days: Date[];
  items: WeekItem[];
  today: Date;
  onDayClick: (date: Date) => void;
  onEventClick: (item: WeekItem) => void;
}

function WeekSection({ days, items, today, onDayClick, onEventClick }: WeekSectionProps) {
  return (
    <div className="border-b border-border">
      {/* Day header row */}
      <div className="calendar-day-cell grid grid-cols-7 divide-x divide-white/10 dark:divide-white/5">
        {days.map((date, i) => {
          const isToday = isSameDay(date, today);
          return (
            <button
              key={i}
              type="button"
              onClick={() => onDayClick(date)}
              className={`px-1.5 py-2 text-center transition-colors hover:brightness-95 dark:hover:brightness-110 ${
                isToday
                  ? "ring-1 ring-inset ring-primary/40 font-bold"
                  : ""
              }`}
            >
              <span
                className={`text-[11px] font-semibold ${
                  isToday ? "text-primary" : "text-foreground/60"
                }`}
              >
                {DAY_LABELS[date.getDay()]},{" "}
                {MONTH_LABELS[date.getMonth()]} {date.getDate()}
              </span>
            </button>
          );
        })}
      </div>

      {/* Event bars — navbar background with grid lines */}
      <div className="navbar-surface flex flex-col gap-1.5 py-1.5">
        {items.map((item) => {
          const colors = BAR_COLORS[item.color] ?? BAR_COLORS.sky;

          const badge = item.isUpcoming
            ? "Upcoming"
            : item.kind === "project"
              ? "Project"
              : item.kind === "note"
                ? "Note"
                : "Event";

          const roundLeft = !item.continuesLeft;
          const roundRight = !item.continuesRight;

          return (
            <div
              key={item.id}
              className="grid grid-cols-7"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(90deg, transparent, transparent calc(100% / 7 - 1px), var(--grid-line-color) calc(100% / 7 - 1px), var(--grid-line-color) calc(100% / 7))",
              }}
            >
              <button
                type="button"
                onClick={() => onEventClick(item)}
                className={`relative flex items-center gap-2 ${colors.bg} px-3 py-2 text-left transition-colors cursor-pointer hover:brightness-95 dark:hover:brightness-110 ${
                  roundLeft ? "border-l-[3px] " + colors.border : ""
                } ${roundLeft && roundRight ? "rounded" : roundLeft ? "rounded-l" : roundRight ? "rounded-r" : ""}`}
                style={{
                  gridColumn: `${item.startCol + 1} / span ${item.span}`,
                }}
              >
                {/* Left continuation chevron */}
                {item.continuesLeft && (
                  <ChevronLeft
                    className={`h-3.5 w-3.5 flex-shrink-0 ${colors.text} opacity-60`}
                  />
                )}

                {/* Icon */}
                {item.kind === "project" ? (
                  <FolderOpen
                    className={`h-3.5 w-3.5 flex-shrink-0 ${colors.text}`}
                  />
                ) : item.kind === "note" ? (
                  <FileText
                    className={`h-3.5 w-3.5 flex-shrink-0 ${colors.text}`}
                  />
                ) : (
                  <Calendar
                    className={`h-3.5 w-3.5 flex-shrink-0 ${colors.text}`}
                  />
                )}

                {/* Title */}
                <span
                  className={`truncate text-xs font-medium ${colors.text}`}
                >
                  {item.title}
                </span>

                {/* Badge + right chevron (chevron appears AFTER badge) */}
                <span className="ml-auto flex items-center gap-1 flex-shrink-0">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${colors.text} ${colors.bg} border ${colors.border}`}
                  >
                    {badge}
                  </span>
                  {item.continuesRight && (
                    <ChevronRight
                      className={`h-3.5 w-3.5 ${colors.text} opacity-60`}
                    />
                  )}
                </span>
              </button>
            </div>
          );
        })}

        {/* Empty spacer when there are no items so the bg shows */}
        {items.length === 0 && (
          <div className="h-6" />
        )}
      </div>
    </div>
  );
}
