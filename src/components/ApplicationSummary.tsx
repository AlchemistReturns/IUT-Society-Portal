import { DETAIL_LABELS, SUPPORT_OPTIONS, type ApplicationDetails } from "@/lib/application-fields";

const fmt = (d: string | null | undefined) =>
  d
    ? new Date(d + "T00:00:00").toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

export default function ApplicationSummary({
  venue,
  startDate,
  endDate,
  details,
}: {
  venue: string | null;
  startDate: string | null;
  endDate: string | null;
  details: ApplicationDetails | null;
}) {
  const d = details ?? {};
  const dates =
    startDate && endDate && startDate !== endDate
      ? `${fmt(startDate)} – ${fmt(endDate)}`
      : fmt(startDate);
  const support = (d.support ?? [])
    .map((v) => SUPPORT_OPTIONS.find((o) => o.value === v)?.label)
    .filter(Boolean)
    .join(", ");

  const rows: [string, string | null | undefined][] = [
    ["Venue", venue],
    ["Date", dates],
    ["Support requested", support],
    ...DETAIL_LABELS.map(([key, label]): [string, string | undefined] => [
      label,
      key === "purpose" ? (d.purpose || d.description) : (d[key] as string | undefined),
    ]),
  ];
  const filled = rows.filter(([, v]) => v);

  if (!filled.length) return <p className="text-sm text-gray-500">No details provided.</p>;

  return (
    <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-[12rem_1fr]">
      {filled.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="font-medium text-gray-600">{label}</dt>
          <dd className="whitespace-pre-wrap">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
