import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import StatusBadge from "@/components/StatusBadge";

const ACTION_LABELS: Record<string, string> = {
  approve: "You approved",
  reject: "You rejected",
  request_changes: "You requested changes",
};

const single = <T,>(v: T | T[] | null) => (Array.isArray(v) ? (v[0] ?? null) : v);

type AppRow = {
  id: string;
  title: string;
  status: string;
  society_id: string;
  society: { name: string } | { name: string }[] | null;
  type: { name: string } | { name: string }[] | null;
};

export default async function ReviewsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.isReviewer) redirect("/dashboard");

  const supabase = await createClient();
  const select = "id, title, status, society_id, society:societies(name), type:application_types(name)";

  const [{ data: submitted }, { data: acted }] = await Promise.all([
    supabase.from("applications").select(select).eq("status", "submitted").order("updated_at", { ascending: false }),
    supabase
      .from("application_history")
      .select(`application_id, action, created_at, application:applications(${select})`)
      .eq("actor_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  // RLS also exposes submitted applications the user can see but not act on
  // (e.g. a moderator sees them while they sit at a later level).
  const checks = await Promise.all(
    (submitted ?? []).map(async (a) => {
      const { data } = await supabase.rpc("can_review_application", { uid: user.id, app_id: a.id });
      return data === true;
    }),
  );
  const pending = ((submitted ?? []) as AppRow[]).filter((_, i) => checks[i]);

  // Latest action per application.
  const reviewed = new Map<string, { app: AppRow; action: string; at: string }>();
  for (const h of acted ?? []) {
    const app = single(h.application) as AppRow | null;
    if (app && !reviewed.has(h.application_id)) {
      reviewed.set(h.application_id, { app, action: h.action, at: h.created_at });
    }
  }

  const row = (a: AppRow, note?: string) => (
    <Link
      key={a.id}
      href={`/society/${a.society_id}/applications/${a.id}`}
      className="card flex items-center justify-between gap-4 !py-3.5 hover:border-[var(--accent-from)]"
    >
      <div className="min-w-0">
        <p className="truncate font-medium">{a.title}</p>
        <p className="truncate text-xs text-gray-500">
          {[single(a.society)?.name, single(a.type)?.name, note].filter(Boolean).join(" · ")}
        </p>
      </div>
      <StatusBadge status={a.status} />
    </Link>
  );

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 font-serif text-3xl font-semibold tracking-tight">Reviews</h1>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-medium">
          Awaiting your review <span className="text-sm text-gray-500">({pending.length})</span>
        </h2>
        <div className="flex flex-col gap-2">
          {pending.map((a) => row(a))}
          {!pending.length && (
            <p className="rounded-xl border border-dashed border-[var(--card-border)] px-4 py-8 text-center text-sm text-gray-500">
              Nothing waiting on you.
            </p>
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium">
          Reviewed by you <span className="text-sm text-gray-500">({reviewed.size})</span>
        </h2>
        <p className="mb-3 text-xs text-gray-500">
          Shows the application&apos;s current status. Open one to see its history.
        </p>
        <div className="flex flex-col gap-2">
          {[...reviewed.values()].map(({ app, action, at }) =>
            row(
              app,
              `${ACTION_LABELS[action] ?? action} on ${new Date(at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`,
            ),
          )}
          {!reviewed.size && (
            <p className="rounded-xl border border-dashed border-[var(--card-border)] px-4 py-8 text-center text-sm text-gray-500">
              You haven&apos;t reviewed any applications yet.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
