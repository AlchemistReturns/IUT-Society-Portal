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
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Super Admin</h1>
        <Link href="/dashboard" className="text-sm underline">
          Back to dashboard
        </Link>
      </div>
      <nav className="mb-8 flex gap-4 border-b border-gray-200 pb-4 text-sm">
        <Link href="/admin/societies" className="underline">
          Societies
        </Link>
        <Link href="/admin/domains" className="underline">
          Allowed email domains
        </Link>
        <Link href="/admin/global-roles" className="underline">
          Global roles
        </Link>
      </nav>
      {children}
    </div>
  );
}
