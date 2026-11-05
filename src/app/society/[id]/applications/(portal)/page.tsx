import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, isSocietyStaff } from "@/lib/auth";
import StatusBadge from "@/components/StatusBadge";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "submitted", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "changes_requested", label: "Changes requested" },
  { key: "rejected", label: "Rejected" },
  { key: "draft", label: "Drafts" },
];

const fmt = (d: string | null) =>
  d ? new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : null;

export default async function ApplicationsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { id } = await params;
  const { status } = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const isStaff = isSocietyStaff(user, id);

  const supabase = await createClient();
  const { data: applications } = await supabase
    .from("applications")
    .select("id, title, status, venue, start_date, end_date, created_at, type:application_types(name)")
    .eq("society_id", id)
    .order("created_at", { ascending: false });

  const single = <T,>(v: T | T[] | null) => (Array.isArray(v) ? v[0] ?? null : v);
  const active = FILTERS.some((f) => f.key === status) ? status! : "all";
  const rows = (applications ?? []).filter((a) => active === "all" || a.status === active);
  const count = (key: string) =>
    key === "all" ? (applications?.length ?? 0) : (applications ?? []).filter((a) => a.status === key).length;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={f.key === "all" ? `/society/${id}/applications` : `/society/${id}/applications?status=${f.key}`}
            className={`rounded-full border px-3 py-1 text-sm ${
              active === f.key
                ? "border-[var(--accent-from)] bg-[var(--accent-from)] text-white"
                : "border-[var(--card-border)] bg-white text-gray-700 hover:border-[var(--accent-from)]"
            }`}
          >
            {f.label}
            <span className="ml-1.5 text-xs opacity-70">{count(f.key)}</span>
          </Link>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        {rows.map((a) => {
          const type = single(a.type) as { name: string } | null;
          const when =
            a.start_date && a.end_date && a.start_date !== a.end_date
              ? `${fmt(a.start_date)} – ${fmt(a.end_date)}`
              : fmt(a.start_date);
          return (
            <Link
              key={a.id}
              href={`/society/${id}/applications/${a.id}`}
              className="card flex items-center justify-between gap-4 !py-3.5 hover:border-[var(--accent-from)]"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{a.title}</p>
                <p className="truncate text-xs text-gray-500">
                  {[type?.name, when, a.venue].filter(Boolean).join(" · ")}
                </p>
              </div>
              <StatusBadge status={a.status} />
            </Link>
          );
        })}
        {!rows.length && (
          <p className="rounded-xl border border-dashed border-[var(--card-border)] px-4 py-10 text-center text-sm text-gray-500">
            {applications?.length
              ? "No applications with this status."
              : "No applications visible to you yet."}
            {isStaff && !applications?.length && (
              <>
                {" "}
                <Link href={`/society/${id}/applications/new`} className="underline">
                  Create the first one
                </Link>
              </>
            )}
          </p>
        )}
      </div>
    </div>
  );
}
