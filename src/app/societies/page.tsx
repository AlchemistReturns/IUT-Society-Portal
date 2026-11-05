import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { requestMembership } from "./actions";

export default async function SocietiesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();

  const [{ data: societies }, { data: myRequests }] = await Promise.all([
    supabase
      .from("societies")
      .select("id, name, description, moderator_id")
      .is("archived_at", null)
      .order("name"),
    supabase
      .from("membership_requests")
      .select("society_id, status")
      .eq("user_id", user.id)
      .order("requested_at", { ascending: false }),
  ]);

  const myRoleSocietyIds = new Set(user.societies.map((s) => s.societyId));
  const latestRequestBySociety = new Map<string, string>();
  for (const r of myRequests ?? []) {
    if (!latestRequestBySociety.has(r.society_id)) {
      latestRequestBySociety.set(r.society_id, r.status);
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6">
        <h1 className="font-serif text-3xl font-semibold tracking-tight">Societies</h1>
        <p className="mt-1 text-sm text-gray-600">
          {user.canRequestMembership
            ? "Browse IUT societies and request to join the ones you like."
            : "Browse IUT societies and their activities."}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {(societies ?? []).map((s) => {
          const isMember = myRoleSocietyIds.has(s.id);
          const isModerator = s.moderator_id === user.id;
          const status = latestRequestBySociety.get(s.id);

          return (
            <div key={s.id} className="card flex flex-col justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-700)] font-serif text-lg font-semibold text-white">
                  {s.name.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <Link
                    href={`/society/${s.id}`}
                    className="font-serif text-lg font-semibold hover:text-[var(--accent-from)]"
                  >
                    {s.name}
                  </Link>
                  {s.description && (
                    <p className="mt-0.5 line-clamp-2 text-sm text-gray-600">{s.description}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Link href={`/society/${s.id}`} className="text-sm font-medium text-[var(--accent-from)] hover:underline">
                  View profile →
                </Link>
                {isModerator ? (
                  <span className="badge">Moderator</span>
                ) : isMember ? (
                  <span className="badge">Member</span>
                ) : !user.canRequestMembership ? null : status === "pending" ? (
                  <span className="badge !bg-amber-100 !text-amber-900">Request pending</span>
                ) : (
                  <form action={requestMembership}>
                    <input type="hidden" name="society_id" value={s.id} />
                    <button className="btn btn-outline btn-sm">
                      {status === "rejected" ? "Reapply" : "Request to join"}
                    </button>
                  </form>
                )}
              </div>
            </div>
          );
        })}
        {!societies?.length && <p className="text-sm text-gray-500">No societies yet.</p>}
      </div>
    </main>
  );
}
