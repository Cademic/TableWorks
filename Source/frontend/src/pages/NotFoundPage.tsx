import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Page Not Found</h1>
      <p className="text-sm text-foreground/80">
        The route does not exist in the current scaffold.
      </p>
      <Link className="inline-flex rounded bg-primary px-3 py-2 text-primary-foreground" to="/">
        Back to dashboard
      </Link>
    </section>
  );
}
