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
      .select("id, name, description")
      .is("archived_at", null)
      .order("name"),
    supabase
      .from("membership_requests")
      .select("society_id, status")
      .eq("user_id", user.id)
      .order("requested_at", { ascending: false }),
  ]);

  const myRoleSocietyIds = new Set(user.societyRoles.map((r) => r.societyId));
  const latestRequestBySociety = new Map<string, string>();
  for (const r of myRequests ?? []) {
    if (!latestRequestBySociety.has(r.society_id)) {
      latestRequestBySociety.set(r.society_id, r.status);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Societies</h1>
        <Link href="/dashboard" className="text-sm underline">
          Back to dashboard
        </Link>
      </div>

      <div className="flex flex-col gap-4">
        {(societies ?? []).map((s) => {
          const isMember = myRoleSocietyIds.has(s.id);
          const status = latestRequestBySociety.get(s.id);

          return (
            <div
              key={s.id}
              className="flex items-center justify-between rounded-lg border border-gray-200 p-4"
            >
              <div>
                <Link href={`/society/${s.id}`} className="font-medium underline">
                  {s.name}
                </Link>
                {s.description && (
                  <p className="text-sm text-gray-600">{s.description}</p>
                )}
              </div>

              {isMember ? (
                <span className="text-xs text-green-700">Member</span>
              ) : status === "pending" ? (
                <span className="text-xs text-gray-500">Request pending</span>
              ) : (
                <form action={requestMembership}>
                  <input type="hidden" name="society_id" value={s.id} />
                  <button className="rounded-md border px-3 py-1 text-xs">
                    {status === "rejected" ? "Reapply" : "Request to join"}
                  </button>
                </form>
              )}
            </div>
          );
        })}
        {!societies?.length && (
          <p className="text-sm text-gray-500">No societies yet.</p>
        )}
      </div>
    </main>
  );
}
