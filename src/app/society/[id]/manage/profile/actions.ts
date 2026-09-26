"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { setFlash } from "@/lib/flash";

async function revalidateProfile(societyId: string, message: string) {
  revalidatePath(`/society/${societyId}/manage/profile`);
  revalidatePath(`/society/${societyId}`);
  await setFlash(message);
}

export async function updateMissionVision(formData: FormData) {
  const societyId = String(formData.get("society_id") ?? "");
  const mission = String(formData.get("mission") ?? "");
  const vision = String(formData.get("vision") ?? "");

  const supabase = await createClient();
  const { error } = await supabase
    .from("profile_sections")
    .upsert({ society_id: societyId, mission, vision, updated_at: new Date().toISOString() });
  if (error) throw new Error(error.message);
  await revalidateProfile(societyId, "Mission & vision saved");
}

export async function addActivity(formData: FormData) {
  const societyId = String(formData.get("society_id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "");
  const imagesRaw = String(formData.get("images") ?? "");
  const images = imagesRaw.split(",").map((s) => s.trim()).filter(Boolean);
  if (!title) throw new Error("Title required");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await supabase
    .from("activities")
    .insert({ society_id: societyId, title, description, images, created_by: user?.id });
  if (error) throw new Error(error.message);
  await revalidateProfile(societyId, "Activity added");
}

export async function deleteActivity(formData: FormData) {
  const societyId = String(formData.get("society_id") ?? "");
  const activityId = String(formData.get("activity_id") ?? "");
  const supabase = await createClient();
  const { error } = await supabase.from("activities").delete().eq("id", activityId);
  if (error) throw new Error(error.message);
  await revalidateProfile(societyId, "Activity deleted");
}

export async function addAchievement(formData: FormData) {
  const societyId = String(formData.get("society_id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "");
  const imagesRaw = String(formData.get("images") ?? "");
  const winnersRaw = String(formData.get("winners") ?? "");
  const images = imagesRaw.split(",").map((s) => s.trim()).filter(Boolean);
  const winners = winnersRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((name) => ({ name }));
  if (!title) throw new Error("Title required");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await supabase
    .from("achievements")
    .insert({ society_id: societyId, title, description, images, winners, created_by: user?.id });
  if (error) throw new Error(error.message);
  await revalidateProfile(societyId, "Achievement added");
}

export async function deleteAchievement(formData: FormData) {
  const societyId = String(formData.get("society_id") ?? "");
  const achievementId = String(formData.get("achievement_id") ?? "");
  const supabase = await createClient();
  const { error } = await supabase.from("achievements").delete().eq("id", achievementId);
  if (error) throw new Error(error.message);
  await revalidateProfile(societyId, "Achievement deleted");
}

export async function addGalleryImage(formData: FormData) {
  const societyId = String(formData.get("society_id") ?? "");
  const imageUrl = String(formData.get("image_url") ?? "").trim();
  const caption = String(formData.get("caption") ?? "");
  if (!imageUrl) throw new Error("Image URL required");

  const supabase = await createClient();
  const { error } = await supabase
    .from("gallery_images")
    .insert({ society_id: societyId, image_url: imageUrl, caption });
  if (error) throw new Error(error.message);
  await revalidateProfile(societyId, "Gallery image added");
}

export async function deleteGalleryImage(formData: FormData) {
  const societyId = String(formData.get("society_id") ?? "");
  const imageId = String(formData.get("image_id") ?? "");
  const supabase = await createClient();
  const { error } = await supabase.from("gallery_images").delete().eq("id", imageId);
  if (error) throw new Error(error.message);
  await revalidateProfile(societyId, "Gallery image deleted");
}

export async function addReport(formData: FormData) {
  const societyId = String(formData.get("society_id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const fileUrl = String(formData.get("file_url") ?? "").trim();
  if (!title || !fileUrl) throw new Error("Title and file URL required");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await supabase
    .from("reports")
    .insert({ society_id: societyId, title, file_url: fileUrl, uploaded_by: user?.id });
  if (error) throw new Error(error.message);
  await revalidateProfile(societyId, "Report added");
}

export async function deleteReport(formData: FormData) {
  const societyId = String(formData.get("society_id") ?? "");
  const reportId = String(formData.get("report_id") ?? "");
  const supabase = await createClient();
  const { error } = await supabase.from("reports").delete().eq("id", reportId);
  if (error) throw new Error(error.message);
  await revalidateProfile(societyId, "Report deleted");
}

export async function addCustomField(formData: FormData) {
  const societyId = String(formData.get("society_id") ?? "");
  const label = String(formData.get("label") ?? "").trim();
  const type = String(formData.get("type") ?? "text");
  const value = String(formData.get("value") ?? "");
  if (!label) throw new Error("Label required");

  const supabase = await createClient();
  const { error } = await supabase
    .from("custom_fields")
    .insert({ society_id: societyId, label, type, value });
  if (error) throw new Error(error.message);
  await revalidateProfile(societyId, "Custom field added");
}

export async function deleteCustomField(formData: FormData) {
  const societyId = String(formData.get("society_id") ?? "");
  const fieldId = String(formData.get("field_id") ?? "");
  const supabase = await createClient();
  const { error } = await supabase.from("custom_fields").delete().eq("id", fieldId);
  if (error) throw new Error(error.message);
  await revalidateProfile(societyId, "Custom field deleted");
}
