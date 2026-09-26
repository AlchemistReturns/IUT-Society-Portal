import { createClient } from "@/lib/supabase/server";
import { archiveApplicationType } from "./actions";
import { ChainBuilder } from "./ChainBuilder";

const ENTITY_LABELS: Record<string, string> = {
  society_moderator: "Society Moderator",
  department_head: "Department Head",
  sca_committee: "SCA Committee",
  student_welfare: "Student Welfare",
  pro_vc: "Pro-VC",
  vc: "VC",
};

export default async function ApplicationTypesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: types } = await supabase
    .from("application_types")
    .select("*")
    .eq("society_id", id)
    .is("archived_at", null)
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col gap-10">
      <section>
        <h2 className="mb-3 text-lg font-medium">Create application type</h2>
        <p className="mb-3 text-xs text-gray-500">
          The chain is locked to this default at submit time — editing it later
          only affects future applications, not ones already submitted.
        </p>
        <ChainBuilder societyId={id} />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium">Existing types</h2>
        <div className="flex flex-col gap-3">
          {(types ?? []).map((t) => {
            const chain = (t.default_chain_json ?? []) as { level_index: number; entity: string }[];
            return (
              <div key={t.id} className="rounded-lg border border-gray-200 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-medium">{t.name}</h3>
                  <form action={archiveApplicationType}>
                    <input type="hidden" name="society_id" value={id} />
                    <input type="hidden" name="type_id" value={t.id} />
                    <button className="text-xs text-red-600 underline">Archive</button>
                  </form>
                </div>
                <ol className="flex flex-wrap gap-2 text-xs text-gray-600">
                  {chain
                    .sort((a, b) => a.level_index - b.level_index)
                    .map((c, i) => (
                      <li key={i} className="rounded-full border px-2 py-1">
                        {i + 1}. {ENTITY_LABELS[c.entity] ?? c.entity}
                      </li>
                    ))}
                </ol>
              </div>
            );
          })}
          {!types?.length && <p className="text-sm text-gray-500">No application types yet.</p>}
        </div>
      </section>
    </div>
  );
}
