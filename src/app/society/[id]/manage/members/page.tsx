import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, isSocietyAdmin, rolesInSociety } from "@/lib/auth";
import ManageSection, { EmptyState } from "@/components/ManageSection";
import { decideMembership, setRole, removeRole } from "./actions";

const ASSIGNABLE_ROLES = ["executive", "sub_executive", "admin"];
const ROLE_LABELS: Record<string, string> = {
  admin: "President / Admin",
  executive: "Executive",
  sub_executive: "Sub-Executive",
  member: "Member",
};
const ROLE_STYLES: Record<string, string> = {
  admin: "bg-[var(--accent-from)] text-white",
  executive: "bg-emerald-100 text-emerald-900",
  sub_executive: "bg-amber-100 text-amber-900",
  member: "bg-gray-100 text-gray-700",
};

const initial = (name: string | null, email: string) => (name ?? email).charAt(0).toUpperCase();

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
      .select("id, requested_at, user:users!membership_requests_user_id_fkey(email,name)")
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
  type RoleRow = { roleRowId: string; role: string };
  const rolesByUser = new Map<string, { email: string; name: string | null; roles: RoleRow[] }>();
  for (const r of roles ?? []) {
    const u = single(r.user) as { id: string; email: string; name: string | null } | null;
    if (!u) continue;
    memberOptions.set(u.id, u.email);
    const entry = rolesByUser.get(u.id) ?? { email: u.email, name: u.name, roles: [] };
    entry.roles.push({ roleRowId: r.id, role: r.role });
    rolesByUser.set(u.id, entry);
  }
  const ROLE_ORDER = ["admin", "executive", "sub_executive", "member"];
  const memberRows = [...rolesByUser.values()].sort((a, b) => a.email.localeCompare(b.email));
  for (const row of memberRows) {
    row.roles.sort((a, b) => ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role));
  }

  const stats = [
    { label: "Members", value: memberRows.length },
    { label: "Pending requests", value: pending?.length ?? 0 },
    {
      label: "Leadership",
      value: memberRows.filter((m) => m.roles.some((r) => r.role !== "member")).length,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {!isAdmin && (
        <p className="rounded-lg bg-[var(--accent-soft)] px-4 py-2.5 text-sm text-[var(--accent-from)]">
          Your role here: <strong>{myRoles.length ? myRoles.join(", ") : "none"}</strong>.
          Approve, reject and role controls are available to the society admin only.
        </p>
      )}

      {(pendingError || rolesError) && (
        <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">
          Failed to load data: {pendingError?.message ?? rolesError?.message}
        </p>
      )}

      <div className="grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="card !py-4">
            <p className="font-serif text-3xl font-semibold text-[var(--accent-from)]">{s.value}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      <ManageSection
        title="Pending membership requests"
        description="Students who asked to join. Approving makes them a member."
        count={pending?.length}
      >
        <div className="flex flex-col gap-2">
          {(pending ?? []).map((r) => {
            const u = single(r.user) as { email: string; name: string | null } | null;
            return (
              <div
                key={r.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-[var(--card-border)] px-3 py-2.5"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-sm font-semibold text-[var(--accent-from)]">
                    {initial(u?.name ?? null, u?.email ?? "?")}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{u?.name ?? u?.email ?? "unknown"}</p>
                    {u?.name && <p className="truncate text-xs text-gray-500">{u.email}</p>}
                  </div>
                </div>
                {isAdmin ? (
                  <div className="flex gap-2">
                    <form action={decideMembership}>
                      <input type="hidden" name="request_id" value={r.id} />
                      <input type="hidden" name="society_id" value={id} />
                      <input type="hidden" name="approve" value="true" />
                      <button className="btn btn-primary btn-sm">Approve</button>
                    </form>
                    <form action={decideMembership}>
                      <input type="hidden" name="request_id" value={r.id} />
                      <input type="hidden" name="society_id" value={id} />
                      <input type="hidden" name="approve" value="false" />
                      <button className="btn btn-danger btn-sm">Reject</button>
                    </form>
                  </div>
                ) : (
                  <span className="text-xs text-gray-400">Awaiting admin</span>
                )}
              </div>
            );
          })}
          {!pending?.length && <EmptyState>No pending requests.</EmptyState>}
        </div>
      </ManageSection>

      <ManageSection title="Members and roles" description="Everyone who belongs to this society.">
        <div className="flex flex-col gap-2">
          {memberRows.map((row) => (
            <div
              key={row.email}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--card-border)] px-3 py-2.5"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-sm font-semibold text-[var(--accent-from)]">
                  {initial(row.name, row.email)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{row.name ?? row.email}</p>
                  {row.name && <p className="truncate text-xs text-gray-500">{row.email}</p>}
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {row.roles.map((r) => (
                  <span
                    key={r.roleRowId}
                    className={`badge ${ROLE_STYLES[r.role] ?? ROLE_STYLES.member}`}
                  >
                    {ROLE_LABELS[r.role] ?? r.role}
                    {isAdmin && (
                      <form action={removeRole} className="inline">
                        <input type="hidden" name="role_id" value={r.roleRowId} />
                        <input type="hidden" name="society_id" value={id} />
                        <button
                          type="submit"
                          aria-label={`Remove ${ROLE_LABELS[r.role] ?? r.role}`}
                          className="ml-0.5 opacity-60 hover:opacity-100"
                        >
                          ×
                        </button>
                      </form>
                    )}
                  </span>
                ))}
              </div>
            </div>
          ))}
          {!memberRows.length && <EmptyState>No members yet.</EmptyState>}
        </div>
      </ManageSection>

      {isAdmin && (
        <ManageSection
          title="Assign a role"
          description="Only approved members can be picked. Assigning Admin adds a co-admin; it does not remove existing admins."
        >
          {memberOptions.size === 0 ? (
            <EmptyState>No approved members yet.</EmptyState>
          ) : (
            <form action={setRole} className="flex flex-col gap-2 sm:flex-row">
              <input type="hidden" name="society_id" value={id} />
              <select name="user_id" required className="input">
                {[...memberOptions.entries()].map(([userId, email]) => (
                  <option key={userId} value={userId}>
                    {email}
                  </option>
                ))}
              </select>
              <select name="role" required className="input sm:w-48">
                {ASSIGNABLE_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r] ?? r}
                  </option>
                ))}
              </select>
              <button className="btn btn-primary">Assign</button>
            </form>
          )}
        </ManageSection>
      )}
    </div>
  );
}
