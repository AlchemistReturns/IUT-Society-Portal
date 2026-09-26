import { redirect } from "next/navigation";
import { getCurrentUser, isSocietyStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createApplication } from "../actions";

export default async function NewApplicationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (!isSocietyStaff(user, id)) redirect(`/society/${id}/applications`);

  const supabase = await createClient();
  const { data: types } = await supabase
    .from("application_types")
    .select("id, name")
    .eq("society_id", id)
    .is("archived_at", null)
    .order("name");

  return (
    <main className="mx-auto max-w-lg px-4 py-10">
      <h1 className="mb-6 text-2xl font-semibold">New application</h1>

      {!types?.length ? (
        <p className="text-sm text-gray-500">
          No application types configured yet — ask a Society Admin to create one
          under Manage → Application types.
        </p>
      ) : (
        <form action={createApplication} className="flex flex-col gap-3">
          <input type="hidden" name="society_id" value={id} />
          <select name="type_id" required className="rounded-md border px-3 py-2 text-sm">
            {types.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <input name="title" placeholder="Title" required className="rounded-md border px-3 py-2 text-sm" />
          <textarea
            name="description"
            placeholder="Details"
            rows={6}
            className="rounded-md border px-3 py-2 text-sm"
          />
          <button className="w-fit rounded-md bg-black px-3 py-2 text-sm font-medium text-white">
            Save as draft
          </button>
        </form>
      )}
    </main>
  );
}
