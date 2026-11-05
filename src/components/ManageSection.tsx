export default function ManageSection({
  title,
  description,
  count,
  children,
}: {
  title: string;
  description?: string;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <section className="card">
      <div className="mb-4">
        <h2 className="flex items-center gap-2 font-serif text-lg font-semibold">
          {title}
          {count !== undefined && count > 0 && <span className="badge">{count}</span>}
        </h2>
        {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
      </div>
      {children}
    </section>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed border-[var(--card-border)] px-4 py-6 text-center text-sm text-gray-500">
      {children}
    </p>
  );
}
