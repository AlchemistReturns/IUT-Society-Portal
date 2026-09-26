import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser, isSocietyStaff } from "@/lib/auth";
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
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-400">Managing</p>
          <h1 className="text-2xl font-semibold">{society.name}</h1>
        </div>
        <Link href={`/society/${id}`} className="text-sm underline">
          View public profile
        </Link>
      </div>
      <nav className="mb-8 flex flex-wrap gap-2 text-sm">
        {[
          ["members", "Members"],
          ["profile", "Profile content"],
          ["application-types", "Application types"],
        ].map(([slug, label]) => (
          <Link
            key={slug}
            href={`/society/${id}/manage/${slug}`}
            className="rounded-full border border-[var(--card-border)] px-3 py-1 hover:border-[var(--accent-from)] hover:text-[var(--accent-from)]"
          >
            {label}
          </Link>
        ))}
        <Link
          href={`/society/${id}/finance`}
          className="rounded-full border border-[var(--card-border)] px-3 py-1 hover:border-[var(--accent-from)] hover:text-[var(--accent-from)]"
        >
          Finance
        </Link>
        <Link
          href={`/society/${id}/applications`}
          className="rounded-full border border-[var(--card-border)] px-3 py-1 hover:border-[var(--accent-from)] hover:text-[var(--accent-from)]"
        >
          Applications
        </Link>
      </nav>
      {children}
    </div>
  );
}
