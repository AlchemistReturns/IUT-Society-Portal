"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { setFlash } from "@/lib/flash";

export async function createApplicationType(formData: FormData) {
  const societyId = String(formData.get("society_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const entities = formData.getAll("entity").map(String).filter(Boolean);
  if (!name) throw new Error("Name required");
  if (!entities.length) throw new Error("Chain must have at least one level");

  const chain = entities.map((entity, level_index) => ({ level_index, entity }));

  const supabase = await createClient();
  const { error } = await supabase
    .from("application_types")
    .insert({ society_id: societyId, name, default_chain_json: chain });
  if (error) throw new Error(error.message);
  revalidatePath(`/society/${societyId}/manage/application-types`);
  await setFlash(`${name} created`);
}

export async function archiveApplicationType(formData: FormData) {
  const societyId = String(formData.get("society_id") ?? "");
  const typeId = String(formData.get("type_id") ?? "");

  const supabase = await createClient();
  const { error } = await supabase
    .from("application_types")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", typeId);
  if (error) throw new Error(error.message);
  revalidatePath(`/society/${societyId}/manage/application-types`);
  await setFlash("Application type archived");
}
