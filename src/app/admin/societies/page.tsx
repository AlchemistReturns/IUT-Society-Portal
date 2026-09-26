import { createClient } from "@/lib/supabase/server";
import {
  createSociety,
  assignModerator,
  assignDepartmentHead,
  assignInitialAdmin,
  archiveSociety,
} from "./actions";

type UserRef = { email: string; name: string | null };

function toSingle(rel: UserRef | UserRef[] | null): UserRef | null {
  if (!rel) return null;
  return Array.isArray(rel) ? (rel[0] ?? null) : rel;
}

export default async function SocietiesAdminPage() {
  const supabase = await createClient();

  const [{ data: societies }, { data: deptHeads }, { data: admins }, { data: allUsers }, { data: pendingRequests }] =
    await Promise.all([
      supabase
        .from("societies")
        .select("*, moderator:users!societies_moderator_id_fkey(email,name)")
        .is("archived_at", null)
        .order("created_at", { ascending: false }),
      supabase
        .from("society_department_heads")
        .select("society_id, user:users(email,name)"),
      supabase
        .from("society_roles")
        .select("society_id, user:users(email,name)")
        .eq("role", "admin"),
      supabase.from("users").select("email").order("email"),
      // Super Admin bypasses RLS here, so this is ground truth for whether
      // requests actually exist, independent of any admin-role assignment.
      supabase
        .from("membership_requests")
        .select("society_id")
        .eq("status", "pending"),
    ]);

  const pendingCountBySociety = new Map<string, number>();
  for (const r of pendingRequests ?? []) {
    pendingCountBySociety.set(r.society_id, (pendingCountBySociety.get(r.society_id) ?? 0) + 1);
  }

  const deptHeadBySociety = new Map(
    (deptHeads ?? []).map((d) => [d.society_id, toSingle(d.user)])
  );
  const adminsBySociety = new Map<string, UserRef[]>();
  for (const a of admins ?? []) {
    const list = adminsBySociety.get(a.society_id) ?? [];
    const user = toSingle(a.user);
    if (user) list.push(user);
    adminsBySociety.set(a.society_id, list);
  }

  return (
    <div className="flex flex-col gap-10">
      <datalist id="user-emails">
        {(allUsers ?? []).map((u) => (
          <option key={u.email} value={u.email} />
        ))}
      </datalist>

      <section>
        <h2 className="mb-3 text-lg font-medium">Create society</h2>
        <form action={createSociety} className="flex flex-col gap-3 sm:max-w-md">
          <input
            name="name"
            placeholder="Society name"
            required
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <textarea
            name="description"
            placeholder="Description"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <button className="rounded-md bg-black px-3 py-2 text-sm font-medium text-white">
            Create
          </button>
        </form>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium">Societies</h2>
        <div className="flex flex-col gap-6">
          {(societies ?? []).map((s) => {
            const moderator = toSingle(s.moderator);
            const deptHead = deptHeadBySociety.get(s.id) ?? null;
            const admins = adminsBySociety.get(s.id) ?? [];

            return (
              <div key={s.id} className="rounded-lg border border-gray-200 p-4">
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <h3 className="font-medium">{s.name}</h3>
                    {s.description && (
                      <p className="text-sm text-gray-600">{s.description}</p>
                    )}
                  </div>
                  <form action={archiveSociety}>
                    <input type="hidden" name="society_id" value={s.id} />
                    <button className="text-xs text-red-600 underline">
                      Archive
                    </button>
                  </form>
                </div>

                <dl className="mb-4 grid grid-cols-1 gap-1 text-sm sm:grid-cols-3">
                  <div>
                    <dt className="text-gray-500">Moderator</dt>
                    <dd>{moderator ? moderator.email : "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Department Head</dt>
                    <dd>{deptHead ? deptHead.email : "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Admins</dt>
                    <dd>{admins.length ? admins.map((a) => a.email).join(", ") : "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Pending requests</dt>
                    <dd>
                      {pendingCountBySociety.get(s.id) ? (
                        <span className="font-medium text-[var(--accent-from)]">
                          {pendingCountBySociety.get(s.id)}
                        </span>
                      ) : (
                        "0"
                      )}
                    </dd>
                  </div>
                </dl>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <form action={assignModerator} className="flex gap-2">
                    <input type="hidden" name="society_id" value={s.id} />
                    <input
                      name="email"
                      list="user-emails"
                      placeholder="Moderator email"
                      required
                      className="w-full rounded-md border border-gray-300 px-2 py-1 text-xs"
                    />
                    <button className="rounded-md border px-2 py-1 text-xs">Set</button>
                  </form>
                  <form action={assignDepartmentHead} className="flex gap-2">
                    <input type="hidden" name="society_id" value={s.id} />
                    <input
                      name="email"
                      list="user-emails"
                      placeholder="Dept. head email"
                      required
                      className="w-full rounded-md border border-gray-300 px-2 py-1 text-xs"
                    />
                    <button className="rounded-md border px-2 py-1 text-xs">Set</button>
                  </form>
                  <form action={assignInitialAdmin} className="flex gap-2">
                    <input type="hidden" name="society_id" value={s.id} />
                    <input
                      name="email"
                      list="user-emails"
                      placeholder="Admin email"
                      required
                      className="w-full rounded-md border border-gray-300 px-2 py-1 text-xs"
                    />
                    <button className="rounded-md border px-2 py-1 text-xs">Add</button>
                  </form>
                </div>
              </div>
            );
          })}
          {!societies?.length && (
            <p className="text-sm text-gray-500">No societies yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
