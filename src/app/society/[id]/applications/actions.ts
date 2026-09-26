"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { setFlash } from "@/lib/flash";

const ACTION_LABELS: Record<string, string> = {
  approve: "Approved",
  reject: "Rejected",
  request_changes: "Changes requested",
};

export async function createApplication(formData: FormData) {
  const societyId = String(formData.get("society_id") ?? "");
  const typeId = String(formData.get("type_id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "");
  if (!title || !typeId) throw new Error("Title and type are required");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const { data, error } = await supabase
    .from("applications")
    .insert({
      society_id: societyId,
      type_id: typeId,
      title,
      details: { description },
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  await setFlash("Draft created");
  redirect(`/society/${societyId}/applications/${data.id}`);
}

export async function updateApplication(formData: FormData) {
  const societyId = String(formData.get("society_id") ?? "");
  const appId = String(formData.get("app_id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "");

  const supabase = await createClient();
  const { error } = await supabase
    .from("applications")
    .update({ title, details: { description } })
    .eq("id", appId);
  if (error) throw new Error(error.message);
  revalidatePath(`/society/${societyId}/applications/${appId}`);
  await setFlash("Saved");
}

export async function submitApplication(formData: FormData) {
  const societyId = String(formData.get("society_id") ?? "");
  const appId = String(formData.get("app_id") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_application", { p_app_id: appId });
  if (error) throw new Error(error.message);
  revalidatePath(`/society/${societyId}/applications/${appId}`);
  await setFlash("Submitted for review");
}

export async function reviewApplication(formData: FormData) {
  const societyId = String(formData.get("society_id") ?? "");
  const appId = String(formData.get("app_id") ?? "");
  const action = String(formData.get("action") ?? "");
  const comment = String(formData.get("comment") ?? "");
  const signatureUrl = String(formData.get("signature_url") ?? "") || null;
  const sealUrl = String(formData.get("seal_url") ?? "") || null;

  const supabase = await createClient();
  const { error } = await supabase.rpc("review_application", {
    p_app_id: appId,
    p_action: action,
    p_comment: comment || null,
    p_signature_url: signatureUrl,
    p_seal_url: sealUrl,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/society/${societyId}/applications/${appId}`);
  await setFlash(ACTION_LABELS[action] ?? "Reviewed");
}
