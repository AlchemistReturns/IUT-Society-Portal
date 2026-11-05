import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ApplicationSummary from "@/components/ApplicationSummary";

const ENTITY_LABELS: Record<string, string> = {
  society_moderator: "Society Moderator",
  department_head: "Department Head",
  sca_committee: "SCA Committee",
  student_welfare: "Student Welfare",
  pro_vc: "Pro-VC",
  vc: "VC",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  submitted: "Submitted",
  changes_requested: "Changes requested",
  approved: "Approved",
  rejected: "Rejected",
};

export default async function PrintApplicationPage({
  params,
}: {
  params: Promise<{ id: string; appId: string }>;
}) {
  const { appId } = await params;
  const supabase = await createClient();

  const [{ data: app }, { data: latestHistory }] = await Promise.all([
    supabase
      .from("applications")
      .select("*, type:application_types(name), society:societies(name), creator:users!applications_created_by_fkey(email,name)")
      .eq("id", appId)
      .single(),
    supabase
      .from("application_history")
      .select("*, actor:users(email,name)")
      .eq("application_id", appId)
      .order("created_at", { ascending: false })
      .limit(1),
  ]);

  if (!app) notFound();

  const single = <T,>(v: T | T[] | null) => (Array.isArray(v) ? v[0] ?? null : v);
  const type = single(app.type) as { name: string } | null;
  const society = single(app.society) as { name: string } | null;
  const creator = single(app.creator) as { email: string; name: string | null } | null;
  const latest = (latestHistory ?? [])[0] as
    | {
        entity_role: string;
        action: string;
        comment: string | null;
        signature_url: string | null;
        seal_url: string | null;
        created_at: string;
        actor: { email: string; name: string | null } | { email: string; name: string | null }[] | null;
      }
    | undefined;
  const latestActor = latest ? (single(latest.actor) as { email: string; name: string | null } | null) : null;

  return (
    <main className="mx-auto max-w-[210mm] px-10 py-10 print:px-0 print:py-0">
      <div className="mb-8 flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-xl font-semibold">{society?.name}</h1>
          <p className="text-sm text-gray-500">{type?.name} application</p>
        </div>
        <span className="rounded-full border px-3 py-1 text-xs">
          {STATUS_LABELS[app.status] ?? app.status}
        </span>
      </div>

      <h2 className="mb-2 text-lg font-medium">{app.title}</h2>
      <p className="mb-1 text-sm text-gray-500">
        Submitted by {creator?.name ?? creator?.email}
      </p>
      <div className="mb-6">
        <ApplicationSummary
          venue={app.venue}
          startDate={app.start_date}
          endDate={app.end_date}
          details={app.details}
        />
      </div>

      {latest && latest.action === "approve" && (
        <div className="mt-10 flex items-start justify-between border-t pt-6">
          <div className="text-sm text-gray-600">
            <p className="font-medium">{ENTITY_LABELS[latest.entity_role] ?? latest.entity_role}</p>
            <p>{latestActor?.name ?? latestActor?.email}</p>
            <p>{new Date(latest.created_at).toLocaleDateString()}</p>
            {latest.comment && <p className="mt-1 italic">&quot;{latest.comment}&quot;</p>}
          </div>
          <div className="flex gap-4">
            {latest.signature_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={latest.signature_url} alt="Signature" className="h-16" />
            )}
            {latest.seal_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={latest.seal_url} alt="Seal" className="h-16 w-16" />
            )}
          </div>
        </div>
      )}

      <p className="mt-10 text-xs text-gray-400 print:hidden">
        Use your browser&apos;s Print (Ctrl/Cmd+P) to save as PDF or print this A4 page.
      </p>
    </main>
  );
}
