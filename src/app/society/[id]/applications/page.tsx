import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  submitted: "Submitted",
  changes_requested: "Changes requested",
  approved: "Approved",
  rejected: "Rejected",
};

export default async function ApplicationsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const staffRoles = ["admin", "executive", "sub_executive"];
  const myRole = user.societyRoles.find((r) => r.societyId === id)?.role;
  const isStaff = !!myRole && staffRoles.includes(myRole);

  const supabase = await createClient();
  const { data: applications } = await supabase
    .from("applications")
    .select("id, title, status, current_level_index, created_at, type:application_types(name)")
    .eq("society_id", id)
    .order("created_at", { ascending: false });

  const single = <T,>(v: T | T[] | null) => (Array.isArray(v) ? v[0] ?? null : v);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Applications</h1>
        <div className="flex gap-4 text-sm">
          {isStaff && (
            <Link href={`/society/${id}/applications/new`} className="underline">
              New application
            </Link>
          )}
          <Link href={`/society/${id}`} className="underline">
            Back
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {(applications ?? []).map((a) => {
          const type = single(a.type) as { name: string } | null;
          return (
            <Link
              key={a.id}
              href={`/society/${id}/applications/${a.id}`}
              className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50"
            >
              <span>
                {a.title} <span className="text-gray-400">— {type?.name}</span>
              </span>
              <span className="text-xs text-gray-500">{STATUS_LABELS[a.status] ?? a.status}</span>
            </Link>
          );
        })}
        {!applications?.length && (
          <p className="text-sm text-gray-500">No applications visible to you yet.</p>
        )}
      </div>
    </main>
  );
}
