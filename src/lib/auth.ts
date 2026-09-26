import { createClient } from "@/lib/supabase/server";

export interface SocietyMembership {
  societyId: string;
  societyName: string;
  roles: string[];
}

export interface CurrentUser {
  id: string;
  email: string;
  name: string | null;
  universityDomainVerified: boolean;
  globalRoles: string[];
  societies: SocietyMembership[];
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  const [{ data: profile }, { data: globalRoles }, { data: societyRoles }] =
    await Promise.all([
      supabase.from("users").select("*").eq("id", authUser.id).single(),
      supabase.from("global_roles").select("role").eq("user_id", authUser.id),
      supabase
        .from("society_roles")
        .select("society_id, role, society:societies(name)")
        .eq("user_id", authUser.id),
    ]);

  const single = <T,>(v: T | T[] | null) => (Array.isArray(v) ? (v[0] ?? null) : v);

  const bySociety = new Map<string, SocietyMembership>();
  for (const r of societyRoles ?? []) {
    const society = single(r.society) as { name: string } | null;
    const entry: SocietyMembership = bySociety.get(r.society_id) ?? {
      societyId: r.society_id,
      societyName: society?.name ?? "Unknown society",
      roles: [],
    };
    entry.roles.push(r.role);
    bySociety.set(r.society_id, entry);
  }

  return {
    id: authUser.id,
    email: authUser.email ?? "",
    name: profile?.name ?? null,
    universityDomainVerified: profile?.university_domain_verified ?? false,
    globalRoles: (globalRoles ?? []).map((r) => r.role),
    societies: [...bySociety.values()],
  };
}

export function isSuperAdmin(user: CurrentUser | null): boolean {
  return !!user?.globalRoles.includes("super_admin");
}

export function rolesInSociety(user: CurrentUser | null, societyId: string): string[] {
  return user?.societies.find((s) => s.societyId === societyId)?.roles ?? [];
}

export function isSocietyStaff(user: CurrentUser | null, societyId: string): boolean {
  const roles = rolesInSociety(user, societyId);
  return roles.includes("admin") || roles.includes("executive") || roles.includes("sub_executive");
}

export function isSocietyAdmin(user: CurrentUser | null, societyId: string): boolean {
  return rolesInSociety(user, societyId).includes("admin");
}
