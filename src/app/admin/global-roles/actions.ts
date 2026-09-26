"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { flashRedirect } from "@/lib/flash";

const VALID_ROLES = [
  "super_admin",
  "sca_committee",
  "student_welfare",
  "pro_vc",
  "vc",
] as const;

export async function grantGlobalRole(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const role = String(formData.get("role") ?? "");
  if (!VALID_ROLES.includes(role as (typeof VALID_ROLES)[number])) {
    throw new Error("Invalid role");
  }

  const supabase = await createClient();
  const { data: user, error: lookupError } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .single();
  if (lookupError || !user) throw new Error(`No registered user with email ${email}`);

  const { error } = await supabase
    .from("global_roles")
    .upsert(
      { user_id: user.id, role },
      { onConflict: "user_id,role" }
    );
  if (error) throw new Error(error.message);
  revalidatePath("/admin/global-roles");
  flashRedirect("/admin/global-roles", `${role.replace("_", " ")} granted to ${email}`);
}

export async function revokeGlobalRole(formData: FormData) {
  const userId = String(formData.get("user_id") ?? "");
  const role = String(formData.get("role") ?? "");

  const supabase = await createClient();
  const { error } = await supabase
    .from("global_roles")
    .delete()
    .eq("user_id", userId)
    .eq("role", role);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/global-roles");
  flashRedirect("/admin/global-roles", "Role revoked");
}
