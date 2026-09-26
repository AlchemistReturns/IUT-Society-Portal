import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { decideMembership, setRole, removeRole } from "./actions";

const ASSIGNABLE_ROLES = ["executive", "sub_executive", "admin"];

export default async function MembersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  const myRole = user?.societyRoles.find((r) => r.societyId === id)?.role;
  const isAdmin = myRole === "admin" || user?.globalRoles.includes("super_admin");

  const supabase = await createClient();
  const [{ data: pending }, { data: roles }] = await Promise.all([
    supabase
      .from("membership_requests")
      .select("id, requested_at, user:users(email,name)")
      .eq("society_id", id)
      .eq("status", "pending")
      .order("requested_at"),
    supabase
      .from("society_roles")
      .select("id, role, user:users(id,email,name)")
      .eq("society_id", id)
      .order("role"),
  ]);

  const single = <T,>(v: T | T[] | null) => (Array.isArray(v) ? v[0] ?? null : v);

  return (
    <div className="flex flex-col gap-10">
      <section>
        <h2 className="mb-3 text-lg font-medium">Pending membership requests</h2>
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
                      <button className="rounded-md border px-2 py-1 text-xs">Approve</button>
                    </form>
                    <form action={decideMembership}>
                      <input type="hidden" name="request_id" value={r.id} />
                      <input type="hidden" name="society_id" value={id} />
                      <input type="hidden" name="approve" value="false" />
                      <button className="rounded-md border px-2 py-1 text-xs text-red-600">
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
                  {u?.email ?? "unknown"} — <strong>{r.role}</strong>
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
            Target user must already be a member (approved). Assigning &quot;admin&quot;
            adds a co-admin — it does not remove existing admins.
          </p>
          <form action={setRole} className="flex gap-2 sm:max-w-lg">
            <input type="hidden" name="society_id" value={id} />
            <input
              name="email"
              type="email"
              placeholder="Member email"
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
            <select name="role" required className="rounded-md border border-gray-300 px-3 py-2 text-sm">
              {ASSIGNABLE_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <button className="rounded-md bg-black px-3 py-2 text-sm font-medium text-white">
              Assign
            </button>
          </form>
        </section>
      )}
    </div>
  );
}
