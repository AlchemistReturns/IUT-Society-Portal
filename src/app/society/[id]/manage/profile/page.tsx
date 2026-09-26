import { createClient } from "@/lib/supabase/server";
import {
  updateMissionVision,
  addActivity,
  deleteActivity,
  addAchievement,
  deleteAchievement,
  addGalleryImage,
  deleteGalleryImage,
  addReport,
  deleteReport,
  addCustomField,
  deleteCustomField,
} from "./actions";

export default async function ProfileManagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [
    { data: profile },
    { data: activities },
    { data: achievements },
    { data: gallery },
    { data: reports },
    { data: customFields },
  ] = await Promise.all([
    supabase.from("profile_sections").select("*").eq("society_id", id).maybeSingle(),
    supabase.from("activities").select("*").eq("society_id", id).order("created_at", { ascending: false }),
    supabase.from("achievements").select("*").eq("society_id", id).order("created_at", { ascending: false }),
    supabase.from("gallery_images").select("*").eq("society_id", id),
    supabase.from("reports").select("*").eq("society_id", id).order("uploaded_at", { ascending: false }),
    supabase.from("custom_fields").select("*").eq("society_id", id).order("sort_order"),
  ]);

  return (
    <div className="flex flex-col gap-10">
      <section>
        <h2 className="mb-3 text-lg font-medium">Mission &amp; Vision</h2>
        <form action={updateMissionVision} className="flex flex-col gap-3 sm:max-w-lg">
          <input type="hidden" name="society_id" value={id} />
          <textarea
            name="mission"
            placeholder="Mission"
            defaultValue={profile?.mission ?? ""}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <textarea
            name="vision"
            placeholder="Vision"
            defaultValue={profile?.vision ?? ""}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <button className="w-fit rounded-md bg-black px-3 py-2 text-sm font-medium text-white">
            Save
          </button>
        </form>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium">Activities</h2>
        <form action={addActivity} className="mb-4 flex flex-col gap-2 sm:max-w-lg">
          <input type="hidden" name="society_id" value={id} />
          <input name="title" placeholder="Title" required className="rounded-md border px-3 py-2 text-sm" />
          <textarea name="description" placeholder="Description" className="rounded-md border px-3 py-2 text-sm" />
          <input name="images" placeholder="Image URLs, comma separated" className="rounded-md border px-3 py-2 text-sm" />
          <button className="w-fit rounded-md border px-3 py-1 text-sm">Add activity</button>
        </form>
        <div className="flex flex-col gap-2">
          {(activities ?? []).map((a) => (
            <div key={a.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
              <span>{a.title}</span>
              <form action={deleteActivity}>
                <input type="hidden" name="society_id" value={id} />
                <input type="hidden" name="activity_id" value={a.id} />
                <button className="text-xs text-red-600 underline">Delete</button>
              </form>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium">Achievements</h2>
        <form action={addAchievement} className="mb-4 flex flex-col gap-2 sm:max-w-lg">
          <input type="hidden" name="society_id" value={id} />
          <input name="title" placeholder="Title" required className="rounded-md border px-3 py-2 text-sm" />
          <textarea name="description" placeholder="Description" className="rounded-md border px-3 py-2 text-sm" />
          <input name="winners" placeholder="Winner names, comma separated" className="rounded-md border px-3 py-2 text-sm" />
          <input name="images" placeholder="Image URLs, comma separated" className="rounded-md border px-3 py-2 text-sm" />
          <button className="w-fit rounded-md border px-3 py-1 text-sm">Add achievement</button>
        </form>
        <div className="flex flex-col gap-2">
          {(achievements ?? []).map((a) => (
            <div key={a.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
              <span>{a.title}</span>
              <form action={deleteAchievement}>
                <input type="hidden" name="society_id" value={id} />
                <input type="hidden" name="achievement_id" value={a.id} />
                <button className="text-xs text-red-600 underline">Delete</button>
              </form>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium">Gallery</h2>
        <form action={addGalleryImage} className="mb-4 flex gap-2 sm:max-w-lg">
          <input type="hidden" name="society_id" value={id} />
          <input name="image_url" placeholder="Image URL" required className="w-full rounded-md border px-3 py-2 text-sm" />
          <input name="caption" placeholder="Caption" className="w-full rounded-md border px-3 py-2 text-sm" />
          <button className="rounded-md border px-3 py-1 text-sm">Add</button>
        </form>
        <div className="flex flex-col gap-2">
          {(gallery ?? []).map((g) => (
            <div key={g.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
              <span className="truncate">{g.caption || g.image_url}</span>
              <form action={deleteGalleryImage}>
                <input type="hidden" name="society_id" value={id} />
                <input type="hidden" name="image_id" value={g.id} />
                <button className="text-xs text-red-600 underline">Delete</button>
              </form>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium">Reports</h2>
        <form action={addReport} className="mb-4 flex gap-2 sm:max-w-lg">
          <input type="hidden" name="society_id" value={id} />
          <input name="title" placeholder="Title" required className="w-full rounded-md border px-3 py-2 text-sm" />
          <input name="file_url" placeholder="PDF URL" required className="w-full rounded-md border px-3 py-2 text-sm" />
          <button className="rounded-md border px-3 py-1 text-sm">Add</button>
        </form>
        <div className="flex flex-col gap-2">
          {(reports ?? []).map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
              <span>{r.title}</span>
              <form action={deleteReport}>
                <input type="hidden" name="society_id" value={id} />
                <input type="hidden" name="report_id" value={r.id} />
                <button className="text-xs text-red-600 underline">Delete</button>
              </form>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium">Custom fields</h2>
        <form action={addCustomField} className="mb-4 flex flex-col gap-2 sm:max-w-lg sm:flex-row">
          <input type="hidden" name="society_id" value={id} />
          <input name="label" placeholder="Label" required className="w-full rounded-md border px-3 py-2 text-sm" />
          <select name="type" className="rounded-md border px-3 py-2 text-sm">
            <option value="text">Text</option>
            <option value="richtext">Rich text</option>
            <option value="image">Image URL</option>
          </select>
          <input name="value" placeholder="Value" className="w-full rounded-md border px-3 py-2 text-sm" />
          <button className="w-fit rounded-md border px-3 py-1 text-sm">Add</button>
        </form>
        <div className="flex flex-col gap-2">
          {(customFields ?? []).map((f) => (
            <div key={f.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
              <span>
                {f.label}: {f.value}
              </span>
              <form action={deleteCustomField}>
                <input type="hidden" name="society_id" value={id} />
                <input type="hidden" name="field_id" value={f.id} />
                <button className="text-xs text-red-600 underline">Delete</button>
              </form>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
