import Link from "next/link";
import ManageTabs from "@/components/ManageTabs";

/** Header + tabs shared by the manage pages and the finance page. */
export default function PortalShell({
  societyId,
  societyName,
  isStaff,
  canApply = isStaff,
  children,
}: {
  societyId: string;
  societyName: string;
  isStaff: boolean;
  canApply?: boolean;
  children: React.ReactNode;
}) {
  const base = `/society/${societyId}`;
  const tabs = isStaff
    ? [
        { href: `${base}/manage/members`, label: "Members" },
        { href: `${base}/manage/profile`, label: "Profile content" },
        { href: `${base}/manage/application-types`, label: "Application types" },
        { href: `${base}/applications`, label: "Applications" },
        { href: `${base}/finance`, label: "Finance" },
      ]
    : [{ href: `${base}/finance`, label: "Finance" }];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-widest text-[var(--accent-from)]">
            {isStaff ? "President portal" : "Moderator view"}
          </p>
          <h1 className="font-serif text-3xl font-semibold tracking-tight">{societyName}</h1>
        </div>
        <div className="flex gap-2">
          {canApply && (
            <Link href={`${base}/applications/new`} className="btn btn-primary">
              + New application
            </Link>
          )}
          <Link href={base} className="btn btn-outline">
            View public profile
          </Link>
        </div>
      </div>

      <div className="mb-6 border-b border-[var(--card-border)]">
        <ManageTabs items={tabs} />
      </div>

      {children}
    </div>
  );
}
