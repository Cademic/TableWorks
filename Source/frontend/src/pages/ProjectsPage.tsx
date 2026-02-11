import { FolderOpen } from "lucide-react";

export function ProjectsPage() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <FolderOpen className="h-8 w-8 text-primary" />
        </div>
        <h1 className="mb-2 text-xl font-semibold text-foreground">Projects</h1>
        <p className="text-sm text-foreground/50">
          Create and manage collaborative projects with your team.
        </p>
        <span className="mt-4 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          Coming Soon
        </span>
      </div>
    </div>
  );
}
