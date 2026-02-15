import type { ProjectSummaryDto } from "../../types";

interface CalendarProjectBarProps {
  project: ProjectSummaryDto;
  onClick?: (project: ProjectSummaryDto) => void;
}

const PROJECT_BAR_COLORS: Record<string, { bg: string; text: string }> = {
  violet:  { bg: "bg-violet-100 dark:bg-violet-950/40",  text: "text-violet-700 dark:text-violet-300" },
  sky:     { bg: "bg-sky-100 dark:bg-sky-950/40",        text: "text-sky-700 dark:text-sky-300" },
  amber:   { bg: "bg-amber-100 dark:bg-amber-950/40",    text: "text-amber-700 dark:text-amber-300" },
  rose:    { bg: "bg-rose-100 dark:bg-rose-950/40",      text: "text-rose-700 dark:text-rose-300" },
  emerald: { bg: "bg-emerald-100 dark:bg-emerald-950/40", text: "text-emerald-700 dark:text-emerald-300" },
  orange:  { bg: "bg-orange-100 dark:bg-orange-950/40",  text: "text-orange-700 dark:text-orange-300" },
};

export function CalendarProjectBar({ project, onClick }: CalendarProjectBarProps) {
  const colors = PROJECT_BAR_COLORS[project.color] ?? PROJECT_BAR_COLORS.violet;
  return (
    <button
      type="button"
      onClick={() => onClick?.(project)}
      className={`w-full min-w-0 overflow-hidden rounded ${colors.bg} px-1.5 py-0.5 text-left text-[11px] font-medium leading-tight ${colors.text} transition-opacity hover:opacity-80`}
      title={`Project: ${project.name}`}
    >
      <span className="block min-w-0 truncate">📁 {project.name}</span>
    </button>
  );
}
