"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { setFlash } from "@/lib/flash";

const KINDS = ["classes", "exams", "break", "short_term", "holiday"];

export async function addCalendarEntry(formData: FormData) {
  const kind = String(formData.get("kind") ?? "");
  const label = String(formData.get("label") ?? "").trim();
  const start = String(formData.get("start_date") ?? "");
  const end = String(formData.get("end_date") ?? "") || start;
  if (!KINDS.includes(kind)) throw new Error("Invalid type");
  if (!label || !start) throw new Error("Label and start date are required");
  if (end < start) throw new Error("End date cannot be before start date");

  const supabase = await createClient();
  const { error } = await supabase
    .from("academic_calendar_entries")
    .insert({ kind, label, start_date: start, end_date: end });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/calendar");
  revalidatePath("/calendar");
  await setFlash("Calendar entry added");
}

export async function removeCalendarEntry(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();
  const { error } = await supabase.from("academic_calendar_entries").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/calendar");
  revalidatePath("/calendar");
  await setFlash("Calendar entry removed");
}
