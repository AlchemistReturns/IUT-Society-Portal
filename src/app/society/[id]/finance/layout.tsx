import { notFound, redirect } from "next/navigation";
import { getCurrentUser, isSocietyStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import PortalShell from "@/components/PortalShell";

export default async function FinanceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { data: society } = await supabase
    .from("societies")
    .select("id, name")
    .eq("id", id)
    .single();
  if (!society) notFound();

  const staff = isSocietyStaff(user, id);
  const full = staff || user.globalRoles.includes("super_admin");
  return (
    <PortalShell societyId={id} societyName={society.name} isStaff={full} canApply={staff}>
      {children}
    </PortalShell>
  );
}
