"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function requestMembership(formData: FormData) {
  const societyId = String(formData.get("society_id") ?? "");
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const { error } = await supabase
    .from("membership_requests")
    .insert({ user_id: user.id, society_id: societyId });

  if (error) throw new Error(error.message);
  revalidatePath("/societies");
}
