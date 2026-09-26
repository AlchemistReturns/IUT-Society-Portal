import { createClient } from "@/lib/supabase/server";

const GLOBAL_ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  sca_committee: "SCA Committee",
  student_welfare: "Student Welfare",
  pro_vc: "Pro-VC",
  vc: "VC",
};

export default async function AdminUsersPage() {
  const supabase = await createClient();

  const [{ data: users }, { data: globalRoles }, { data: societyRoles }] =
    await Promise.all([
      supabase.from("users").select("id, email, name, university_domain_verified, created_at").order("created_at", { ascending: false }),
      supabase.from("global_roles").select("user_id, role"),
      supabase.from("society_roles").select("user_id, role, society:societies(name)"),
    ]);

  const single = <T,>(v: T | T[] | null) => (Array.isArray(v) ? (v[0] ?? null) : v);

  const globalByUser = new Map<string, string[]>();
  for (const g of globalRoles ?? []) {
    const list = globalByUser.get(g.user_id) ?? [];
    list.push(GLOBAL_ROLE_LABELS[g.role] ?? g.role);
    globalByUser.set(g.user_id, list);
  }

  const societyByUser = new Map<string, string[]>();
  for (const s of societyRoles ?? []) {
    const society = single(s.society) as { name: string } | null;
    const list = societyByUser.get(s.user_id) ?? [];
    list.push(`${s.role} @ ${society?.name ?? "?"}`);
    societyByUser.set(s.user_id, list);
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-gray-500">{users?.length ?? 0} registered users.</p>
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Verified</th>
              <th className="px-3 py-2">Global roles</th>
              <th className="px-3 py-2">Society roles</th>
            </tr>
          </thead>
          <tbody>
            {(users ?? []).map((u) => (
              <tr key={u.id} className="border-b border-gray-100 last:border-0">
                <td className="px-3 py-2">
                  <div>{u.email}</div>
                  {u.name && <div className="text-xs text-gray-400">{u.name}</div>}
                </td>
                <td className="px-3 py-2">
                  {u.university_domain_verified ? (
                    <span className="text-green-700">Yes</span>
                  ) : (
                    <span className="text-gray-400">No</span>
                  )}
                </td>
                <td className="px-3 py-2 text-gray-600">
                  {(globalByUser.get(u.id) ?? []).join(", ") || "—"}
                </td>
                <td className="px-3 py-2 text-gray-600">
                  {(societyByUser.get(u.id) ?? []).join(", ") || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
