import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { updateApplication, submitApplication, reviewApplication } from "../actions";

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

type ChainLevel = { level_index: number; entity: string };

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string; appId: string }>;
}) {
  const { id, appId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();

  const [{ data: app }, { data: history }, { data: mySignature }] = await Promise.all([
    supabase
      .from("applications")
      .select("*, type:application_types(name), creator:users!applications_created_by_fkey(email,name)")
      .eq("id", appId)
      .single(),
    supabase
      .from("application_history")
      .select("*, actor:users(email,name)")
      .eq("application_id", appId)
      .order("created_at", { ascending: true }),
    supabase.from("user_signatures").select("*").eq("user_id", user.id).maybeSingle(),
  ]);

  if (!app) notFound();

  const single = <T,>(v: T | T[] | null) => (Array.isArray(v) ? v[0] ?? null : v);
  const type = single(app.type) as { name: string } | null;
  const creator = single(app.creator) as { email: string; name: string | null } | null;
  const chain = (app.chain_json ?? []) as ChainLevel[];

  const staffRoles = ["admin", "executive", "sub_executive"];
  const myRole = user.societyRoles.find((r) => r.societyId === id)?.role;
  const isStaff = !!myRole && staffRoles.includes(myRole);
  const canEdit = isStaff && (app.status === "draft" || app.status === "changes_requested");

  const { data: canReview } = app.status === "submitted"
    ? await supabase.rpc("can_review_application", { uid: user.id, app_id: appId })
    : { data: false };

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{app.title}</h1>
          <p className="text-sm text-gray-500">
            {type?.name} • by {creator?.email} • {STATUS_LABELS[app.status] ?? app.status}
          </p>
        </div>
        <div className="flex gap-4 text-sm">
          <Link href={`/society/${id}/applications/${appId}/print`} className="underline">
            Print
          </Link>
          <Link href={`/society/${id}/applications`} className="underline">
            Back
          </Link>
        </div>
      </div>

      {chain.length > 0 && (
        <ol className="mb-8 flex flex-wrap gap-2">
          {chain
            .sort((a, b) => a.level_index - b.level_index)
            .map((c) => {
              const done = app.status === "approved" || c.level_index < app.current_level_index;
              const current = app.status === "submitted" && c.level_index === app.current_level_index;
              const rejectedHere =
                app.status === "rejected" && c.level_index === app.current_level_index;
              return (
                <li
                  key={c.level_index}
                  className={`rounded-full border px-3 py-1 text-xs ${
                    done
                      ? "border-green-300 bg-green-50 text-green-700"
                      : current
                        ? "border-blue-300 bg-blue-50 text-blue-700"
                        : rejectedHere
                          ? "border-red-300 bg-red-50 text-red-700"
                          : "border-gray-200 text-gray-500"
                  }`}
                >
                  {c.level_index + 1}. {ENTITY_LABELS[c.entity] ?? c.entity}
                </li>
              );
            })}
        </ol>
      )}

      {canEdit ? (
        <form action={updateApplication} className="mb-8 flex flex-col gap-3">
          <input type="hidden" name="society_id" value={id} />
          <input type="hidden" name="app_id" value={appId} />
          <input
            name="title"
            defaultValue={app.title}
            className="rounded-md border px-3 py-2 text-sm"
          />
          <textarea
            name="description"
            defaultValue={(app.details as { description?: string })?.description ?? ""}
            rows={6}
            className="rounded-md border px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <button className="rounded-md border px-3 py-2 text-sm">Save</button>
            <button
              formAction={submitApplication}
              className="rounded-md bg-black px-3 py-2 text-sm font-medium text-white"
            >
              Submit
            </button>
          </div>
        </form>
      ) : (
        <div className="mb-8 rounded-lg border border-gray-200 p-4 text-sm">
          {(app.details as { description?: string })?.description || "No details provided."}
        </div>
      )}

      {canReview && (
        <section className="mb-8 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <h2 className="mb-3 font-medium">Review this application</h2>
          <form action={reviewApplication} className="flex flex-col gap-3">
            <input type="hidden" name="society_id" value={id} />
            <input type="hidden" name="app_id" value={appId} />
            <textarea
              name="comment"
              placeholder="Comment (visible in history)"
              className="rounded-md border px-3 py-2 text-sm"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                name="signature_url"
                placeholder="Signature image URL"
                defaultValue={mySignature?.signature_image_url ?? ""}
                className="rounded-md border px-3 py-2 text-sm"
              />
              <input
                name="seal_url"
                placeholder="Seal image URL"
                defaultValue={mySignature?.seal_image_url ?? ""}
                className="rounded-md border px-3 py-2 text-sm"
              />
            </div>
            <p className="text-xs text-gray-500">
              Signature and seal are required to approve — saved to your profile and
              reused next time.
            </p>
            <div className="flex gap-2">
              <button
                name="action"
                value="approve"
                className="rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white"
              >
                Approve
              </button>
              <button
                name="action"
                value="request_changes"
                className="rounded-md border px-3 py-2 text-sm"
              >
                Request changes
              </button>
              <button
                name="action"
                value="reject"
                className="rounded-md border border-red-300 px-3 py-2 text-sm text-red-700"
              >
                Reject
              </button>
            </div>
          </form>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-lg font-medium">History</h2>
        <div className="flex flex-col gap-2">
          {(history ?? []).map((h) => {
            const actor = single(h.actor) as { email: string; name: string | null } | null;
            return (
              <div key={h.id} className="rounded-md border border-gray-200 p-3 text-sm">
                <p>
                  <strong>{ENTITY_LABELS[h.entity_role] ?? h.entity_role}</strong>
                  {" — "}
                  {actor?.email ?? "system"} {h.action}
                  {" — "}
                  <span className="text-gray-400">
                    {new Date(h.created_at).toLocaleString()}
                  </span>
                </p>
                {h.comment && <p className="text-gray-700">{h.comment}</p>}
              </div>
            );
          })}
          {!history?.length && <p className="text-sm text-gray-500">No activity yet.</p>}
        </div>
      </section>
    </main>
  );
}
