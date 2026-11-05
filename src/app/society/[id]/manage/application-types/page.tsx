import { createClient } from "@/lib/supabase/server";
import ManageSection, { EmptyState } from "@/components/ManageSection";
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
    <div className="flex flex-col gap-6">
      <ManageSection
        title="Existing types"
        description="Each type has its own approval chain, locked in when an application is submitted."
        count={types?.length}
      >
        <div className="flex flex-col gap-3">
          {(types ?? []).map((t) => {
            const chain = ((t.default_chain_json ?? []) as { level_index: number; entity: string }[])
              .slice()
              .sort((a, b) => a.level_index - b.level_index);
            return (
              <div key={t.id} className="rounded-lg border border-[var(--card-border)] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-serif text-base font-semibold">{t.name}</h3>
                  <form action={archiveApplicationType}>
                    <input type="hidden" name="society_id" value={id} />
                    <input type="hidden" name="type_id" value={t.id} />
                    <button className="btn btn-danger btn-sm">Archive</button>
                  </form>
                </div>
                <ol className="flex flex-wrap items-center gap-1.5 text-xs">
                  <li className="badge !bg-gray-100 !text-gray-700">Society admin submits</li>
                  {chain.map((c, i) => (
                    <li key={i} className="flex items-center gap-1.5">
                      <span className="text-gray-400">→</span>
                      <span className="badge">
                        {i + 1}. {ENTITY_LABELS[c.entity] ?? c.entity}
                      </span>
                    </li>
                  ))}
                  <li className="flex items-center gap-1.5">
                    <span className="text-gray-400">→</span>
                    <span className="badge !bg-[var(--accent-from)] !text-white">Approved</span>
                  </li>
                </ol>
              </div>
            );
          })}
          {!types?.length && <EmptyState>No application types yet. Create one below.</EmptyState>}
        </div>
      </ManageSection>

      <ManageSection
        title="Create application type"
        description="Editing a chain later only affects future applications, not ones already submitted."
      >
        <ChainBuilder societyId={id} />
      </ManageSection>
    </div>
  );
}
