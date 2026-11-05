const STYLES: Record<string, { label: string; cls: string }> = {
  draft: { label: "Draft", cls: "bg-gray-100 text-gray-700" },
  submitted: { label: "Pending review", cls: "bg-amber-100 text-amber-900" },
  changes_requested: { label: "Changes requested", cls: "bg-orange-100 text-orange-900" },
  approved: { label: "Approved", cls: "bg-[var(--accent-from)] text-white" },
  rejected: { label: "Rejected", cls: "bg-red-100 text-red-800" },
};

export default function StatusBadge({ status }: { status: string }) {
  const s = STYLES[status] ?? { label: status, cls: "bg-gray-100 text-gray-700" };
  return <span className={`badge whitespace-nowrap ${s.cls}`}>{s.label}</span>;
}
