"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function decideMembership(formData: FormData) {
  const requestId = String(formData.get("request_id") ?? "");
  const approve = formData.get("approve") === "true";
  const societyId = String(formData.get("society_id") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.rpc("decide_membership", {
    p_request_id: requestId,
    p_approve: approve,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/society/${societyId}/manage/members`);
}

export async function setRole(formData: FormData) {
  const societyId = String(formData.get("society_id") ?? "");
  const email = String(formData.get("email") ?? "").trim();
  const role = String(formData.get("role") ?? "");

  const supabase = await createClient();
  const { data: targetUser, error: lookupError } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .single();
  if (lookupError || !targetUser) {
    throw new Error(`No registered user with email ${email}`);
  }

  const { error } = await supabase
    .from("society_roles")
    .upsert(
      { society_id: societyId, user_id: targetUser.id, role },
      { onConflict: "user_id,society_id,role" }
    );
  if (error) throw new Error(error.message);
  revalidatePath(`/society/${societyId}/manage/members`);
}

export async function removeRole(formData: FormData) {
  const roleRowId = String(formData.get("role_id") ?? "");
  const societyId = String(formData.get("society_id") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.from("society_roles").delete().eq("id", roleRowId);
  if (error) throw new Error(error.message);
  revalidatePath(`/society/${societyId}/manage/members`);
}
