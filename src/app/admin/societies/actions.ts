"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { setFlash } from "@/lib/flash";

async function findUserIdByEmail(
  supabase: Awaited<ReturnType<typeof createClient>>,
  email: string
) {
  const { data, error } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .single();

  if (error || !data) {
    throw new Error(`No registered user with email ${email}`);
  }
  return data.id as string;
}

export async function createSociety(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!name) throw new Error("Name is required");

  const supabase = await createClient();
  const { error } = await supabase
    .from("societies")
    .insert({ name, description: description || null });

  if (error) throw new Error(error.message);
  revalidatePath("/admin/societies");
  await setFlash(`${name} created`);
}

export async function assignModerator(formData: FormData) {
  const societyId = String(formData.get("society_id") ?? "");
  const email = String(formData.get("email") ?? "").trim();

  const supabase = await createClient();
  const userId = await findUserIdByEmail(supabase, email);

  const { error } = await supabase
    .from("societies")
    .update({ moderator_id: userId })
    .eq("id", societyId);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/societies");
  await setFlash(`Moderator set to ${email}`);
}

export async function assignDepartmentHead(formData: FormData) {
  const societyId = String(formData.get("society_id") ?? "");
  const email = String(formData.get("email") ?? "").trim();

  const supabase = await createClient();
  const userId = await findUserIdByEmail(supabase, email);

  const { error } = await supabase
    .from("society_department_heads")
    .upsert({ society_id: societyId, user_id: userId });

  if (error) throw new Error(error.message);
  revalidatePath("/admin/societies");
  await setFlash(`Department Head set to ${email}`);
}

export async function assignInitialAdmin(formData: FormData) {
  const societyId = String(formData.get("society_id") ?? "");
  const email = String(formData.get("email") ?? "").trim();

  const supabase = await createClient();
  const userId = await findUserIdByEmail(supabase, email);

  const { error } = await supabase
    .from("society_roles")
    .upsert(
      { society_id: societyId, user_id: userId, role: "admin" },
      { onConflict: "user_id,society_id,role" }
    );

  if (error) throw new Error(error.message);
  revalidatePath("/admin/societies");
  await setFlash(`${email} added as admin`);
}

export async function archiveSociety(formData: FormData) {
  const societyId = String(formData.get("society_id") ?? "");

  const supabase = await createClient();
  const { error } = await supabase
    .from("societies")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", societyId);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/societies");
  await setFlash("Society archived");
}
