import { createClient } from "@/lib/supabase/server";

export interface CurrentUser {
  id: string;
  email: string;
  name: string | null;
  universityDomainVerified: boolean;
  globalRoles: string[];
  societyRoles: { societyId: string; role: string }[];
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
        .select("society_id, role")
        .eq("user_id", authUser.id),
    ]);

  return {
    id: authUser.id,
    email: authUser.email ?? "",
    name: profile?.name ?? null,
    universityDomainVerified: profile?.university_domain_verified ?? false,
    globalRoles: (globalRoles ?? []).map((r) => r.role),
    societyRoles: (societyRoles ?? []).map((r) => ({
      societyId: r.society_id,
      role: r.role,
    })),
  };
}

export function isSuperAdmin(user: CurrentUser | null): boolean {
  return !!user?.globalRoles.includes("super_admin");
}
