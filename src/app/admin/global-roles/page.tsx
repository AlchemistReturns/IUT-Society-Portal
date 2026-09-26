import { createClient } from "@/lib/supabase/server";
import { grantGlobalRole, revokeGlobalRole } from "./actions";

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  sca_committee: "Social and Cultural Affairs Committee",
  student_welfare: "Office of Student Welfare",
  pro_vc: "Pro-Vice Chancellor",
  vc: "Vice Chancellor",
};

export default async function GlobalRolesAdminPage() {
  const supabase = await createClient();
  const { data: roles } = await supabase
    .from("global_roles")
    .select("user_id, role, user:users(email,name)")
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <form action={grantGlobalRole} className="flex flex-col gap-3 sm:max-w-md">
        <input
          name="email"
          placeholder="User email"
          required
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <select
          name="role"
          required
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          {Object.entries(ROLE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button className="rounded-md bg-black px-3 py-2 text-sm font-medium text-white">
          Grant role
        </button>
      </form>

      <ul className="flex flex-col gap-2">
        {(roles ?? []).map((r) => {
          const user = (
            Array.isArray(r.user) ? r.user[0] : r.user
          ) as { email: string; name: string | null } | null;
          return (
            <li
              key={`${r.user_id}-${r.role}`}
              className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2 text-sm"
            >
              <span>
                {user?.email ?? r.user_id} — {ROLE_LABELS[r.role] ?? r.role}
              </span>
              <form action={revokeGlobalRole}>
                <input type="hidden" name="user_id" value={r.user_id} />
                <input type="hidden" name="role" value={r.role} />
                <button className="text-xs text-red-600 underline">Revoke</button>
              </form>
            </li>
          );
        })}
        {!roles?.length && (
          <p className="text-sm text-gray-500">No global roles granted yet.</p>
        )}
      </ul>
    </div>
  );
}
