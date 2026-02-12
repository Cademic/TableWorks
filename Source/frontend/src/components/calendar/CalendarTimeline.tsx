import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  FileText,
  FolderOpen,
} from "lucide-react";
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
  eventDto: CalendarEventDto | null;
  projectId: string | null;
}

interface CalendarTimelineProps {
  currentDate: Date;
  events: CalendarEventDto[];
  projects: ProjectSummaryDto[];
  onClickDay: (date: Date) => void;
  onClickEvent: (event: CalendarEventDto) => void;
  onClickProject?: (project: ProjectSummaryDto) => void;
}

/* ─── Main Component ───────────────────────────────────── */

export function CalendarTimeline({
  currentDate,
  events,
  projects,
  onClickDay,
  onClickEvent,
  onClickProject,
}: CalendarTimelineProps) {
  const navigate = useNavigate();
  const today = useMemo(() => new Date(), []);
  const todayMs = localDay(today);

  // Build weeks that cover the current month (Sun–Sat)
  const weeks = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const lastOfMonth = new Date(year, month + 1, 0);

    // Start from Sunday of the first week
    const startDay = new Date(firstOfMonth);
    startDay.setDate(startDay.getDate() - startDay.getDay());

    // End on Saturday of the last week
    const endDay = new Date(lastOfMonth);
    endDay.setDate(endDay.getDate() + (6 - endDay.getDay()));

    const result: Date[][] = [];
    const current = new Date(startDay);
    while (current <= endDay) {
      const week: Date[] = [];
      for (let i = 0; i < 7; i++) {
        week.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }
      result.push(week);
    }
    return result;
  }, [currentDate]);

  function getItemsForWeek(weekDays: Date[]): WeekItem[] {
    const weekStart = weekDays[0];
    const weekEnd = weekDays[6];
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
          projectId: null,
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
          projectId: project.id,
        });
      }
    }

    return items;
  }

  function handleItemClick(item: WeekItem) {
    if (item.kind === "project" && item.projectId) {
      const proj = projects.find((p) => p.id === item.projectId);
      if (proj && onClickProject) {
        onClickProject(proj);
      } else {
        navigate(`/projects/${item.projectId}`);
      }
    } else if (item.eventDto) {
      onClickEvent(item.eventDto);
    }
  }

  const currentMonth = currentDate.getMonth();

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      {weeks.map((weekDays, weekIdx) => {
        const items = getItemsForWeek(weekDays);
        return (
          <WeekRow
            key={weekIdx}
            days={weekDays}
            items={items}
            today={today}
            currentMonth={currentMonth}
            onDayClick={onClickDay}
            onItemClick={handleItemClick}
            isLast={weekIdx === weeks.length - 1}
          />
        );
      })}
    </div>
  );
}

/* ─── Week Row ─────────────────────────────────────────── */

interface WeekRowProps {
  days: Date[];
  items: WeekItem[];
  today: Date;
  currentMonth: number;
  onDayClick: (date: Date) => void;
  onItemClick: (item: WeekItem) => void;
  isLast: boolean;
}

function WeekRow({ days, items, today, currentMonth, onDayClick, onItemClick, isLast }: WeekRowProps) {
  return (
    <div className={!isLast ? "border-b border-border" : ""}>
      {/* Day header row */}
      <div className="calendar-day-cell grid grid-cols-7 divide-x divide-white/10 dark:divide-white/5">
        {days.map((date, i) => {
          const isToday = isSameDay(date, today);
          const isCurrentMonth = date.getMonth() === currentMonth;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onDayClick(date)}
              className={`px-1.5 py-2 text-center transition-colors hover:brightness-95 dark:hover:brightness-110 ${
                isToday ? "ring-1 ring-inset ring-primary/40 font-bold" : ""
              } ${!isCurrentMonth ? "opacity-40" : ""}`}
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

      {/* Event bars */}
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
                onClick={() => onItemClick(item)}
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
                  <FolderOpen className={`h-3.5 w-3.5 flex-shrink-0 ${colors.text}`} />
                ) : item.kind === "note" ? (
                  <FileText className={`h-3.5 w-3.5 flex-shrink-0 ${colors.text}`} />
                ) : (
                  <Calendar className={`h-3.5 w-3.5 flex-shrink-0 ${colors.text}`} />
                )}

                {/* Title */}
                <span className={`truncate text-xs font-medium ${colors.text}`}>
                  {item.title}
                </span>

                {/* Badge + right chevron */}
                <span className="ml-auto flex items-center gap-1 flex-shrink-0">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${colors.text} ${colors.bg} border ${colors.border}`}
                  >
                    {badge}
                  </span>
                  {item.continuesRight && (
                    <ChevronRight className={`h-3.5 w-3.5 ${colors.text} opacity-60`} />
                  )}
                </span>
              </button>
            </div>
          );
        })}

        {items.length === 0 && <div className="h-6" />}
      </div>
    </div>
  );
}
