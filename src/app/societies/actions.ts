"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { setFlash } from "@/lib/flash";
import { getCurrentUser } from "@/lib/auth";

export async function requestMembership(formData: FormData) {
  const societyId = String(formData.get("society_id") ?? "");
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const current = await getCurrentUser();
  if (!current?.canRequestMembership) {
    throw new Error("Only students can request society membership");
  }

  const { error } = await supabase
    .from("membership_requests")
    .insert({ user_id: user.id, society_id: societyId });

  if (error) throw new Error(error.message);
  revalidatePath("/societies");
  await setFlash("Membership request sent");
}
