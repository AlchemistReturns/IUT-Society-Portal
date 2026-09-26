import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

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

  const staffRoles = ["admin", "executive", "sub_executive"];
  const myRole = user.societyRoles.find((r) => r.societyId === id)?.role;
  const isStaff = !!myRole && staffRoles.includes(myRole);
  const isAdmin = myRole === "admin" || user.globalRoles.includes("super_admin");
  if (!isStaff && !user.globalRoles.includes("super_admin")) redirect(`/society/${id}`);

  const supabase = await createClient();
  const { data: society } = await supabase
    .from("societies")
    .select("id, name")
    .eq("id", id)
    .single();
  if (!society) notFound();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Manage {society.name}</h1>
        <Link href={`/society/${id}`} className="text-sm underline">
          View public profile
        </Link>
      </div>
      <nav className="mb-8 flex flex-wrap gap-4 border-b border-gray-200 pb-4 text-sm">
        <Link href={`/society/${id}/manage/members`} className="underline">
          Members
        </Link>
        <Link href={`/society/${id}/manage/profile`} className="underline">
          Profile content
        </Link>
        {isAdmin && (
          <Link href={`/society/${id}/manage/finance`} className="underline">
            Finance
          </Link>
        )}
        <Link href={`/society/${id}/manage/application-types`} className="underline">
          Application types
        </Link>
        <Link href={`/society/${id}/applications`} className="underline">
          Applications
        </Link>
      </nav>
      {children}
    </div>
  );
}
