import Link from "next/link";
import { getCurrentUser, isSuperAdmin } from "@/lib/auth";
import { signOut } from "@/app/(auth)/actions";

export default async function NavBar() {
  const user = await getCurrentUser();
  if (!user) return null;

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--card-border)] bg-[var(--card-bg)]/80 backdrop-blur print:hidden">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <Link
            href="/dashboard"
            className="bg-gradient-to-br from-[var(--accent-from)] to-[var(--accent-to)] bg-clip-text text-lg font-semibold text-transparent"
          >
            IUT_SMS
          </Link>
          <nav className="hidden gap-4 text-sm text-gray-600 sm:flex">
            <Link href="/dashboard" className="hover:text-[var(--accent-from)]">
              Dashboard
            </Link>
            <Link href="/societies" className="hover:text-[var(--accent-from)]">
              Societies
            </Link>
            {isSuperAdmin(user) && (
              <Link href="/admin" className="hover:text-[var(--accent-from)]">
                Admin panel
              </Link>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-gray-500 sm:inline">
            {user.name ?? user.email}
          </span>
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-full border border-[var(--card-border)] px-3 py-1 text-xs text-gray-600 hover:border-[var(--accent-from)] hover:text-[var(--accent-from)]"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
