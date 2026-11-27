import Link from "next/link";
import { getCurrentUser, isSuperAdmin } from "@/lib/auth";
import { signOut } from "@/app/(auth)/actions";
import NavTabs from "./NavTabs";

export default async function NavBar() {
  const user = await getCurrentUser();
  if (!user) return null;

  const tabs = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/societies", label: "Societies" },
    { href: "/calendar", label: "Calendar" },
    ...(user.isReviewer ? [{ href: "/reviews", label: "Reviews" }] : []),
    ...(isSuperAdmin(user) ? [{ href: "/admin", label: "Admin panel" }] : []),
  ];

  return (
    <header className="print:hidden">
      <div className="bg-[var(--brand-900)] py-1.5 font-mono text-[11px] uppercase tracking-widest text-emerald-100/90">
        <div className="mx-auto max-w-5xl px-4">
          Islamic University of Technology · Society Management
        </div>
      </div>
      <div className="bg-[var(--brand-700)] text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
          <Link href="/dashboard" className="font-serif text-2xl font-semibold tracking-tight">
            IUT Society Portal
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-emerald-50/90 sm:inline">
              {user.name ?? user.email}
            </span>
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-[var(--brand-700)] hover:bg-emerald-50"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </div>
      <div className="bg-[var(--brand-900)]">
        <NavTabs items={tabs} />
      </div>
    </header>
  );
}
