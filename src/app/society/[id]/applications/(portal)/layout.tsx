import { notFound, redirect } from "next/navigation";
import { getCurrentUser, isSocietyStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import PortalShell from "@/components/PortalShell";

// Staff and Super Admin get the full portal shell. Members and reviewers
// (moderators, committees) see the same pages in a plain container.
export default async function ApplicationsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const staff = isSocietyStaff(user, id);
  const full = staff || user.globalRoles.includes("super_admin");

  if (!full) {
    return <div className="mx-auto max-w-5xl px-4 py-8">{children}</div>;
  }

  const supabase = await createClient();
  const { data: society } = await supabase
    .from("societies")
    .select("id, name")
    .eq("id", id)
    .single();
  if (!society) notFound();

  return (
    <PortalShell societyId={id} societyName={society.name} isStaff={true} canApply={staff}>
      {children}
    </PortalShell>
  );
}
