import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, isSocietyAdmin, rolesInSociety } from "@/lib/auth";
import { decideMembership, setRole, removeRole } from "./actions";

const ASSIGNABLE_ROLES = ["executive", "sub_executive", "admin"];
const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  executive: "Executive",
  sub_executive: "Sub-Executive",
  member: "Member",
};

export default async function MembersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  const isSuperAdmin = !!user?.globalRoles.includes("super_admin");
  const isAdmin = isSocietyAdmin(user, id) || isSuperAdmin;
  const myRoles = rolesInSociety(user, id);

  const supabase = await createClient();
  const [
    { data: pending, error: pendingError },
    { data: roles, error: rolesError },
  ] = await Promise.all([
    supabase
      .from("membership_requests")
      .select("id, requested_at, user:users(email,name)")
      .eq("society_id", id)
      .eq("status", "pending")
      .order("requested_at"),
    supabase
      .from("society_roles")
      .select("id, user_id, role, user:users(id,email,name)")
      .eq("society_id", id)
      .order("role"),
  ]);

  const single = <T,>(v: T | T[] | null) => (Array.isArray(v) ? (v[0] ?? null) : v);

  const memberOptions = new Map<string, string>();
  for (const r of roles ?? []) {
    const u = single(r.user) as { id: string; email: string } | null;
    if (u) memberOptions.set(u.id, u.email);
  }

  return (
    <div className="flex flex-col gap-10">
      <p className="rounded-md bg-gray-50 px-3 py-2 text-xs text-gray-500">
        Signed in as <strong>{user?.email}</strong> — your role here:{" "}
        <strong>
          {isSuperAdmin ? "Super Admin (global)" : myRoles.length ? myRoles.join(", ") : "none"}
        </strong>
        . Approve/reject controls only show for an Admin of this specific society.
      </p>

      {(pendingError || rolesError) && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
          Failed to load data: {pendingError?.message ?? rolesError?.message}
        </p>
      )}

      <section>
        <h2 className="mb-3 text-lg font-medium">
          Pending membership requests
          {(pending?.length ?? 0) > 0 && (
            <span className="ml-2 rounded-full bg-[var(--accent-from)]/10 px-2 py-0.5 text-xs font-medium text-[var(--accent-from)]">
              {pending!.length}
            </span>
          )}
        </h2>
        <div className="flex flex-col gap-2">
          {(pending ?? []).map((r) => {
            const u = single(r.user) as { email: string; name: string | null } | null;
            return (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2 text-sm"
              >
                <span>{u?.email ?? "unknown"}</span>
                {isAdmin ? (
                  <div className="flex gap-2">
                    <form action={decideMembership}>
                      <input type="hidden" name="request_id" value={r.id} />
                      <input type="hidden" name="society_id" value={id} />
                      <input type="hidden" name="approve" value="true" />
                      <button className="rounded-md border px-2 py-1 text-xs text-green-700 hover:border-green-400">
                        Approve
                      </button>
                    </form>
                    <form action={decideMembership}>
                      <input type="hidden" name="request_id" value={r.id} />
                      <input type="hidden" name="society_id" value={id} />
                      <input type="hidden" name="approve" value="false" />
                      <button className="rounded-md border px-2 py-1 text-xs text-red-600 hover:border-red-400">
                        Reject
                      </button>
                    </form>
                  </div>
                ) : (
                  <span className="text-xs text-gray-400">Awaiting admin</span>
                )}
              </div>
            );
          })}
          {!pending?.length && (
            <p className="text-sm text-gray-500">No pending requests.</p>
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium">Roles</h2>
        <div className="flex flex-col gap-2">
          {(roles ?? []).map((r) => {
            const u = single(r.user) as { id: string; email: string; name: string | null } | null;
            return (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2 text-sm"
              >
                <span>
                  {u?.email ?? "unknown"} —{" "}
                  <strong>{ROLE_LABELS[r.role] ?? r.role}</strong>
                </span>
                {isAdmin && u && (
                  <form action={removeRole}>
                    <input type="hidden" name="role_id" value={r.id} />
                    <input type="hidden" name="society_id" value={id} />
                    <button className="text-xs text-red-600 underline">Remove</button>
                  </form>
                )}
              </div>
            );
          })}
          {!roles?.length && <p className="text-sm text-gray-500">No members yet.</p>}
        </div>
      </section>

      {isAdmin && (
        <section>
          <h2 className="mb-3 text-lg font-medium">Assign role</h2>
          <p className="mb-2 text-xs text-gray-500">
            Only approved members can be picked. Assigning &quot;Admin&quot; adds a
            co-admin — it does not remove existing admins.
          </p>
          {memberOptions.size === 0 ? (
            <p className="text-sm text-gray-500">No approved members yet.</p>
          ) : (
            <form action={setRole} className="flex gap-2 sm:max-w-lg">
              <input type="hidden" name="society_id" value={id} />
              <select
                name="user_id"
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                {[...memberOptions.entries()].map(([userId, email]) => (
                  <option key={userId} value={userId}>
                    {email}
                  </option>
                ))}
              </select>
              <select name="role" required className="rounded-md border border-gray-300 px-3 py-2 text-sm">
                {ASSIGNABLE_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r] ?? r}
                  </option>
                ))}
              </select>
              <button className="rounded-md bg-black px-3 py-2 text-sm font-medium text-white">
                Assign
              </button>
            </form>
          )}
        </section>
      )}
    </div>
  );
}
