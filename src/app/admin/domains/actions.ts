"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { flashRedirect } from "@/lib/flash";

export async function addDomain(formData: FormData) {
  const domain = String(formData.get("domain") ?? "")
    .trim()
    .toLowerCase()
    .replace(/^@/, "");
  if (!domain) throw new Error("Domain is required");

  const supabase = await createClient();
  const { error } = await supabase.from("allowed_email_domains").insert({ domain });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/domains");
  flashRedirect("/admin/domains", `${domain} added`);
}

export async function removeDomain(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();
  const { error } = await supabase.from("allowed_email_domains").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/domains");
  flashRedirect("/admin/domains", "Domain removed");
}
