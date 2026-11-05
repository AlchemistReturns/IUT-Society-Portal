import { createClient } from "@/lib/supabase/server";
import ManageSection, { EmptyState } from "@/components/ManageSection";
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

function Row({
  title,
  sub,
  action,
  hidden,
  thumb,
}: {
  title: string;
  sub?: string | null;
  action: (formData: FormData) => Promise<void>;
  hidden: Record<string, string>;
  thumb?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-[var(--card-border)] px-3 py-2.5">
      <div className="flex min-w-0 items-center gap-3">
        {thumb && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumb} alt="" className="h-10 w-10 shrink-0 rounded-md object-cover" />
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{title}</p>
          {sub && <p className="truncate text-xs text-gray-500">{sub}</p>}
        </div>
      </div>
      <form action={action}>
        {Object.entries(hidden).map(([k, v]) => (
          <input key={k} type="hidden" name={k} value={v} />
        ))}
        <button className="btn btn-danger btn-sm">Delete</button>
      </form>
    </div>
  );
}

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
    <div className="flex flex-col gap-6">
      <ManageSection title="Mission & vision" description="Shown at the top of your public profile.">
        <form action={updateMissionVision} className="flex flex-col gap-3">
          <input type="hidden" name="society_id" value={id} />
          <label className="flex flex-col gap-1 text-sm font-medium">
            Mission
            <textarea name="mission" rows={3} defaultValue={profile?.mission ?? ""} className="input" />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Vision
            <textarea name="vision" rows={3} defaultValue={profile?.vision ?? ""} className="input" />
          </label>
          <button className="btn btn-primary w-fit">Save changes</button>
        </form>
      </ManageSection>

      <ManageSection
        title="Activities"
        description="Events and programs your society has run."
        count={activities?.length}
      >
        <form action={addActivity} className="mb-4 flex flex-col gap-2">
          <input type="hidden" name="society_id" value={id} />
          <input name="title" placeholder="Title" required className="input" />
          <textarea name="description" placeholder="Description" rows={2} className="input" />
          <input name="images" placeholder="Image URLs, comma separated" className="input" />
          <button className="btn btn-outline w-fit">Add activity</button>
        </form>
        <div className="flex flex-col gap-2">
          {(activities ?? []).map((a) => (
            <Row key={a.id} title={a.title} sub={a.description} action={deleteActivity} hidden={{ society_id: id, activity_id: a.id }} />
          ))}
          {!activities?.length && <EmptyState>No activities yet.</EmptyState>}
        </div>
      </ManageSection>

      <ManageSection
        title="Achievements"
        description="Awards and wins, with winner names."
        count={achievements?.length}
      >
        <form action={addAchievement} className="mb-4 flex flex-col gap-2">
          <input type="hidden" name="society_id" value={id} />
          <input name="title" placeholder="Title" required className="input" />
          <textarea name="description" placeholder="Description" rows={2} className="input" />
          <div className="grid gap-2 sm:grid-cols-2">
            <input name="winners" placeholder="Winner names, comma separated" className="input" />
            <input name="images" placeholder="Image URLs, comma separated" className="input" />
          </div>
          <button className="btn btn-outline w-fit">Add achievement</button>
        </form>
        <div className="flex flex-col gap-2">
          {(achievements ?? []).map((a) => (
            <Row key={a.id} title={a.title} sub={a.description} action={deleteAchievement} hidden={{ society_id: id, achievement_id: a.id }} />
          ))}
          {!achievements?.length && <EmptyState>No achievements yet.</EmptyState>}
        </div>
      </ManageSection>

      <ManageSection title="Gallery" description="Photos from your events." count={gallery?.length}>
        <form action={addGalleryImage} className="mb-4 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
          <input type="hidden" name="society_id" value={id} />
          <input name="image_url" placeholder="Image URL" required className="input" />
          <input name="caption" placeholder="Caption" className="input" />
          <button className="btn btn-outline">Add</button>
        </form>
        <div className="flex flex-col gap-2">
          {(gallery ?? []).map((g) => (
            <Row key={g.id} title={g.caption || "Untitled image"} sub={g.image_url} thumb={g.image_url} action={deleteGalleryImage} hidden={{ society_id: id, image_id: g.id }} />
          ))}
          {!gallery?.length && <EmptyState>No images yet.</EmptyState>}
        </div>
      </ManageSection>

      <ManageSection title="Reports" description="Activity and annual reports (PDF links)." count={reports?.length}>
        <form action={addReport} className="mb-4 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
          <input type="hidden" name="society_id" value={id} />
          <input name="title" placeholder="Title" required className="input" />
          <input name="file_url" placeholder="PDF URL" required className="input" />
          <button className="btn btn-outline">Add</button>
        </form>
        <div className="flex flex-col gap-2">
          {(reports ?? []).map((r) => (
            <Row key={r.id} title={r.title} sub={r.file_url} action={deleteReport} hidden={{ society_id: id, report_id: r.id }} />
          ))}
          {!reports?.length && <EmptyState>No reports yet.</EmptyState>}
        </div>
      </ManageSection>

      <ManageSection
        title="Custom fields"
        description="Extra labelled info on your profile, for example Founded or Contact."
        count={customFields?.length}
      >
        <form action={addCustomField} className="mb-4 grid gap-2 sm:grid-cols-[1fr_9rem_1fr_auto]">
          <input type="hidden" name="society_id" value={id} />
          <input name="label" placeholder="Label" required className="input" />
          <select name="type" className="input">
            <option value="text">Text</option>
            <option value="richtext">Rich text</option>
            <option value="image">Image URL</option>
          </select>
          <input name="value" placeholder="Value" className="input" />
          <button className="btn btn-outline">Add</button>
        </form>
        <div className="flex flex-col gap-2">
          {(customFields ?? []).map((f) => (
            <Row key={f.id} title={f.label} sub={f.value} action={deleteCustomField} hidden={{ society_id: id, field_id: f.id }} />
          ))}
          {!customFields?.length && <EmptyState>No custom fields yet.</EmptyState>}
        </div>
      </ManageSection>
    </div>
  );
}
