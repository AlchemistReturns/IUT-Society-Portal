"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { setFlash } from "@/lib/flash";

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
  await setFlash(approve ? "Member approved" : "Request rejected");
}

export async function setRole(formData: FormData) {
  const societyId = String(formData.get("society_id") ?? "");
  const userId = String(formData.get("user_id") ?? "");
  const role = String(formData.get("role") ?? "");
  if (!userId) throw new Error("Select a member");

  const supabase = await createClient();
  const { error } = await supabase
    .from("society_roles")
    .upsert(
      { society_id: societyId, user_id: userId, role },
      { onConflict: "user_id,society_id,role" }
    );
  if (error) throw new Error(error.message);
  revalidatePath(`/society/${societyId}/manage/members`);
  await setFlash("Role assigned");
}

export async function removeRole(formData: FormData) {
  const roleRowId = String(formData.get("role_id") ?? "");
  const societyId = String(formData.get("society_id") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.from("society_roles").delete().eq("id", roleRowId);
  if (error) throw new Error(error.message);
  revalidatePath(`/society/${societyId}/manage/members`);
  await setFlash("Role removed");
}
