import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, isSuperAdmin } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!isSuperAdmin(user)) redirect("/dashboard");

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-8 text-2xl font-semibold">Super Admin</h1>
      <nav className="mb-8 flex flex-wrap gap-2 text-sm">
        {[
          ["societies", "Societies"],
          ["users", "Users"],
          ["domains", "Allowed email domains"],
          ["global-roles", "Global roles"],
          ["calendar", "Calendar"],
        ].map(([slug, label]) => (
          <Link
            key={slug}
            href={`/admin/${slug}`}
            className="rounded-full border border-[var(--card-border)] px-3 py-1 hover:border-[var(--accent-from)] hover:text-[var(--accent-from)]"
          >
            {label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
