import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  executive: "Executive",
  sub_executive: "Sub-Executive",
  member: "Member",
};

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-8 text-2xl font-semibold">
        Welcome, <span className="text-[var(--accent-from)]">{user.name ?? user.email}</span>
      </h1>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-200 p-4">
          <h2 className="font-medium">Global roles</h2>
          <p className="mt-1 text-sm text-gray-600">
            {user.globalRoles.length ? user.globalRoles.join(", ") : "None"}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 p-4">
          <h2 className="font-medium">Email verified</h2>
          <p className="mt-1 text-sm text-gray-600">
            {user.universityDomainVerified ? "Yes" : "No — check your inbox"}
          </p>
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-medium">Your societies</h2>
          <Link href="/societies" className="text-sm underline">
            Browse all societies
          </Link>
        </div>
        <div className="flex flex-col gap-2">
          {user.societies.map((s) => (
            <Link
              key={s.societyId}
              href={`/society/${s.societyId}`}
              className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3 text-sm hover:border-[var(--accent-from)]"
            >
              <span className="font-medium">{s.societyName}</span>
              <span className="text-gray-500">
                {s.roles.map((r) => ROLE_LABELS[r] ?? r).join(", ")}
              </span>
            </Link>
          ))}
          {!user.societies.length && (
            <p className="text-sm text-gray-500">
              {user.canRequestMembership
                ? "Not a member of any society yet — browse societies to request one."
                : "No society memberships. Your reviews appear under each society's applications."}
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
