// Event application fields, modelled on the SCAC Event Portal form.
// `title` (event name), `venue`, `start_date` and `end_date` are columns on
// `applications`; everything else is stored in the `details` jsonb.

export const SUPPORT_OPTIONS = [
  { value: "permission", label: "Permission" },
  { value: "logistical", label: "Logistical support" },
  { value: "financial", label: "Financial support" },
] as const;

export interface ApplicationDetails {
  description?: string; // legacy free-text body
  time?: string;
  participants?: string;
  support?: string[];
  purpose?: string;
  logistics?: string;
  budget_total?: string;
  budget_secured?: string;
  budget_requested?: string;
  funding_sources?: string;
  impact?: string;
  partner?: string;
}

export interface ParsedApplicationForm {
  title: string;
  venue: string | null;
  start_date: string | null;
  end_date: string | null;
  details: ApplicationDetails;
}

const str = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();

export function parseApplicationForm(fd: FormData): ParsedApplicationForm {
  const title = str(fd, "title");
  if (!title) throw new Error("Event name is required");

  const start = str(fd, "start_date") || null;
  const end = str(fd, "end_date") || start;
  if (start && end && end < start) throw new Error("End date cannot be before start date");

  const support = fd
    .getAll("support")
    .map(String)
    .filter((v) => SUPPORT_OPTIONS.some((o) => o.value === v));

  return {
    title,
    venue: str(fd, "venue") || null,
    start_date: start,
    end_date: end,
    details: {
      time: str(fd, "time"),
      participants: str(fd, "participants"),
      support,
      purpose: str(fd, "purpose"),
      logistics: str(fd, "logistics"),
      budget_total: str(fd, "budget_total"),
      budget_secured: str(fd, "budget_secured"),
      budget_requested: str(fd, "budget_requested"),
      funding_sources: str(fd, "funding_sources"),
      impact: str(fd, "impact"),
      partner: str(fd, "partner"),
    },
  };
}

export const DETAIL_LABELS: [keyof ApplicationDetails, string][] = [
  ["time", "Time"],
  ["participants", "Expected participants"],
  ["purpose", "Purpose and student benefit"],
  ["logistics", "Logistical requirements"],
  ["budget_total", "Total budget (BDT)"],
  ["budget_secured", "Secured (BDT)"],
  ["budget_requested", "Requested from IUT (BDT)"],
  ["funding_sources", "Funding sources"],
  ["impact", "Impact on student development & IUT's visibility"],
  ["partner", "Partner organization"],
];
