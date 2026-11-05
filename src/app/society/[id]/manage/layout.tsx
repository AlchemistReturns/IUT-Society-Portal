import { notFound, redirect } from "next/navigation";
import { getCurrentUser, isSocietyStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import PortalShell from "@/components/PortalShell";

export default async function ManageLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const isStaff = isSocietyStaff(user, id);
  if (!isStaff && !user.globalRoles.includes("super_admin")) redirect(`/society/${id}`);

  const supabase = await createClient();
  const { data: society } = await supabase
    .from("societies")
    .select("id, name")
    .eq("id", id)
    .single();
  if (!society) notFound();

  return (
    <PortalShell societyId={id} societyName={society.name} isStaff={true} canApply={isStaff}>
      {children}
    </PortalShell>
  );
}
