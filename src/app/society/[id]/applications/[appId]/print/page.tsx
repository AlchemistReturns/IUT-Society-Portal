import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PrintControls from "@/components/PrintControls";
import { SUPPORT_OPTIONS, type ApplicationDetails } from "@/lib/application-fields";

// Printed layout follows the SCAC application template (single A4 page,
// letter to the Vice-Chancellor, then the approval remarks grid).

// Fixed office holders printed in the approval grid, in routing order.
const APPROVERS: { entity: string; name: string; title: string; bold?: boolean }[] = [
  { entity: "sca_committee", name: "Prof. Dr. Khondokar Habibul Kabir", title: "Chairman, SCAC" },
  { entity: "student_welfare", name: "Prof. Dr. Mohammad Tawhid Kawsar", title: "Head, OSW" },
  { entity: "pro_vc", name: "Dr. Hissein Araby Nour", title: "Pro Vice-Chancellor, IUT" },
  { entity: "vc", name: "Prof. Dr. Md Mamun Bin Ibne Reaz", title: "Vice-Chancellor, IUT" },
];

type Person = { email: string; name: string | null };
type HistoryRow = {
  entity_role: string;
  action: string;
  comment: string | null;
  signature_url: string | null;
  seal_url: string | null;
  created_at: string;
};

const single = <T,>(v: T | T[] | null) => (Array.isArray(v) ? (v[0] ?? null) : v);
const fmtDate = (d: Date) =>
  d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
const num = (v?: string) => {
  const n = Number(v);
  return v && Number.isFinite(n) ? n : null;
};
const bdt = (n: number) => n.toLocaleString("en-US");

// Strip trailing punctuation from text that is followed by our own punctuation.
const clean = (v?: string) => (v ?? "").trim().replace(/[.;,\s]+$/, "");

function joinList(items: string[]) {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

const DURATION_WORDS = ["", "day-long", "two-day", "three-day", "four-day", "five-day"];

export default async function PrintApplicationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; appId: string }>;
  searchParams: Promise<{ auto?: string }>;
}) {
  const { appId } = await params;
  const { auto } = await searchParams;
  const supabase = await createClient();

  const [{ data: app }, { data: history }] = await Promise.all([
    supabase
      .from("applications")
      .select(
        "*, society:societies(name, moderator:users!societies_moderator_id_fkey(email,name)), creator:users!applications_created_by_fkey(email,name)",
      )
      .eq("id", appId)
      .single(),
    supabase
      .from("application_history")
      .select("entity_role, action, comment, signature_url, seal_url, created_at")
      .eq("application_id", appId)
      .eq("action", "approve")
      .order("created_at", { ascending: true }),
  ]);

  if (!app) notFound();

  const society = single(app.society) as { name: string; moderator: Person | Person[] | null } | null;
  const moderator = society ? (single(society.moderator) as Person | null) : null;
  const creator = single(app.creator) as Person | null;
  const d = (app.details ?? {}) as ApplicationDetails;

  // Latest approval per entity.
  const approvals = new Map<string, HistoryRow>();
  for (const h of (history ?? []) as HistoryRow[]) approvals.set(h.entity_role, h);

  // ---- derived letter content -------------------------------------------
  const support = d.support ?? [];
  const wantsFinancial = support.includes("financial");
  const wantsLogistical = support.includes("logistical");
  const supportLabels = SUPPORT_OPTIONS.filter((o) => support.includes(o.value)).map((o) =>
    o.label.replace(/^./, (c) => c.toUpperCase()).replace(/ support$/, " Support"),
  );
  const subjectKind = supportLabels.length ? joinList(supportLabels) : "Permission";

  const start = app.start_date ? new Date(app.start_date + "T00:00:00") : null;
  const end = app.end_date ? new Date(app.end_date + "T00:00:00") : start;
  const days = start && end ? Math.round((end.getTime() - start.getTime()) / 86400000) + 1 : 1;
  const duration = DURATION_WORDS[days] || `${days}-day`;
  const eventDate = start
    ? end && days > 1
      ? `${fmtDate(start)} to ${fmtDate(end)}`
      : fmtDate(start)
    : "[Event Date]";
  const weekday = start && days === 1 ? start.toLocaleDateString("en-GB", { weekday: "long" }) : null;
  const when = [d.time, weekday, eventDate].filter(Boolean).join(", ");

  const total = num(d.budget_total);
  const secured = num(d.budget_secured) ?? 0;
  const requested = num(d.budget_requested);
  const deficit = total !== null ? Math.max(total - secured, 0) : null;
  const overCap = total !== null && requested !== null && requested > total * 0.25;
  const showFinancial = wantsFinancial || total !== null;
  const prev = num(d.previous_support);

  const enclosures = [
    ...(d.enclosures ?? "").split("\n").map((l) => l.trim()).filter(Boolean),
    ...(showFinancial ? ["Detailed budget breakdown"] : []),
  ];
  const letters = "abcdefghij";

  const short = d.society_short || society?.name || "";
  const presidentName = creator?.name ?? creator?.email ?? "";

  return (
    <main className="letter mx-auto max-w-[210mm] bg-white px-[18mm] py-[14mm] text-[10.5pt] leading-snug text-black print:max-w-none print:p-0">
      <style>{`
        @page { size: A4; margin: 14mm 18mm; }
        .letter { font-family: "Times New Roman", Times, serif; }
        .letter p { margin: 0 0 7pt; text-align: justify; }
        @media print {
          body { background: #fff !important; }
          .letter { font-size: 10pt; }
          .grid-cell, .sig { break-inside: avoid; }
        }
      `}</style>

      <PrintControls auto={auto === "1"} />

      {overCap && (
        <p className="mb-4 rounded border border-amber-300 bg-amber-50 px-3 py-2 font-sans text-xs text-amber-900 print:hidden">
          Requested IUT support exceeds 25% of the total budget. The SCAC template caps it at 25%.
        </p>
      )}

      <p>Date: {fmtDate(new Date())}</p>
      <p style={{ textAlign: "left" }}>
        The Vice-Chancellor
        <br />
        Islamic University of Technology (IUT), Board Bazar, Gazipur-1704
      </p>

      <p className="font-bold" style={{ textAlign: "left" }}>
        Subject: Request for {subjectKind} for organizing &ldquo;{app.title}&rdquo; on {eventDate} at IUT
        Campus
      </p>

      <p>Dear Sir,</p>

      <p>
        With due respect, we would like to state that {society?.name ?? "[Name of Society/Club]"}
        {d.partner ? ` in collaboration with ${d.partner}` : ""} will organize {app.title}
        {when ? ` on ${when}` : ""}
        {app.venue ? ` at ${app.venue}` : ""}. This {duration} event
        {d.participants ? ` will see the participation of ${d.participants}` : " is open to students"}.{" "}
        {(d.purpose || d.description || "").trim()}
      </p>

      {(wantsLogistical || d.logistics) && (
        <p>
          <b>Logistical Support:</b> For the successful organization of the event, we request the following
          support from IUT: {clean(d.logistics) || "[list essential requirements]"}.
        </p>
      )}

      {showFinancial && (
        <p>
          <b>Financial Support:</b> The estimated budget for the event is BDT{" "}
          {total !== null ? bdt(total) : "[Total Budget]"}. We have secured BDT {bdt(secured)}
          {d.funding_sources ? ` through ${clean(d.funding_sources)}` : ""}, leaving a deficit of BDT{" "}
          {deficit !== null ? bdt(deficit) : "[Deficit]"}. We request IUT&apos;s financial support of BDT{" "}
          {requested !== null ? bdt(requested) : "[Requested Amount]"} (not exceeding 25% of the total budget,
          as per the decision of the IUT Authority).
          {prev !== null && ` IUT provided BDT ${bdt(prev)} for the previous edition of this event.`} If
          approved, the amount may be advanced to the Moderator of the Society/Club.
        </p>
      )}

      {showFinancial && (d.cost_main || d.cost_other) && (
        <p>
          <b>Budget Justification:</b> The major portion of the budget will support{" "}
          {clean(d.cost_main) || "[main cost areas]"}
          {d.cost_other ? `; other expenses include ${clean(d.cost_other)}` : ""}. A detailed item-wise budget and
          justification, signed by the President and the Moderator, are attached for review.
        </p>
      )}

      {d.impact && (
        <p>
          <b>Impact on Student Development and IUT&apos;s Visibility:</b> {d.impact}
        </p>
      )}

      {enclosures.length > 0 && (
        <p>
          <b>Enclosures:</b>{" "}
          {enclosures.map((e, i) => `(${letters[i] ?? i + 1}) ${e}`).join("; ")}.
        </p>
      )}

      <p>
        We humbly request your kind approval and the necessary support for the smooth and successful
        organization of the event.
      </p>

      {/* President + Moderator */}
      <div className="sig mt-4 grid grid-cols-2 gap-10">
        <div>
          <p style={{ marginBottom: "16pt", textAlign: "left" }}>Yours sincerely,</p>
          <div className="border-t border-black pt-1">
            <p className="!mb-0" style={{ textAlign: "left" }}>
              {presidentName}
              <br />
              <b>President</b>, {short}
              <br />
              {[d.president_info, d.whatsapp && `WhatsApp: ${d.whatsapp}`].filter(Boolean).join(" · ")}
            </p>
          </div>
        </div>
        <div>
          <p style={{ marginBottom: "16pt", textAlign: "left" }}>
            <u>Moderator&apos;s Remarks:</u>
            {approvals.get("society_moderator")?.comment && (
              <i className="ml-1">{approvals.get("society_moderator")!.comment}</i>
            )}
          </p>
          <div className="border-t border-black pt-1">
            <p className="!mb-0" style={{ textAlign: "left" }}>
              {moderator?.name ?? moderator?.email ?? ""}
              <br />
              <b>Moderator</b>, {short}
              <br />
              {d.moderator_title}
            </p>
          </div>
        </div>
      </div>

      {/* Approval grid */}
      <div className="mt-6 grid grid-cols-2 border border-black">
        {APPROVERS.map((a, i) => {
          const ap = approvals.get(a.entity);
          return (
            <div
              key={a.entity}
              className={`grid-cell flex min-h-[34mm] flex-col justify-between p-2 ${
                i % 2 === 0 ? "border-r border-black" : ""
              } ${i < 2 ? "border-b border-black" : ""}`}
            >
              <div>
                <u>Remarks:</u>
                {ap?.comment && <i className="ml-1">{ap.comment}</i>}
              </div>
              <div>
                <div className="flex h-10 items-end gap-3">
                  {ap?.signature_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={ap.signature_url} alt="Signature" className="max-h-10" />
                  )}
                  {ap?.seal_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={ap.seal_url} alt="Seal" className="max-h-10" />
                  )}
                </div>
                <div className="border-t border-black pt-1 text-[9.5pt]">
                  {a.name}
                  <br />
                  <b>{a.title}</b> | Date:{" "}
                  {ap ? fmtDate(new Date(ap.created_at)) : "______________"}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-6 font-sans text-xs text-gray-400 print:hidden" style={{ textAlign: "left" }}>
        Prints as a single A4 page. Signature and seal images of approvers appear automatically once they
        approve.
      </p>
    </main>
  );
}
