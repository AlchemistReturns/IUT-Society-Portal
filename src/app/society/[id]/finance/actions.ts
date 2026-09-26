"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addFinanceEntry(formData: FormData) {
  const societyId = String(formData.get("society_id") ?? "");
  const type = String(formData.get("type") ?? "");
  const amount = Number(formData.get("amount"));
  const category = String(formData.get("category") ?? "").trim();
  const note = String(formData.get("note") ?? "");
  const date = String(formData.get("date") ?? "");

  if (!category || !date || Number.isNaN(amount) || amount < 0) {
    throw new Error("Invalid finance entry");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const { error } = await supabase.from("finance_entries").insert({
    society_id: societyId,
    type,
    amount,
    category,
    note,
    date,
    entered_by: user.id,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/society/${societyId}/finance`);
}

export async function deleteFinanceEntry(formData: FormData) {
  const societyId = String(formData.get("society_id") ?? "");
  const entryId = String(formData.get("entry_id") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.from("finance_entries").delete().eq("id", entryId);
  if (error) throw new Error(error.message);
  revalidatePath(`/society/${societyId}/finance`);
}
