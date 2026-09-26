import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { signOut } from "../(auth)/actions";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Welcome, {user.name ?? user.email}</h1>
        <form action={signOut}>
          <button className="text-sm underline" type="submit">
            Sign out
          </button>
        </form>
      </div>

      <section className="grid gap-4">
        <div className="rounded-lg border border-gray-200 p-4">
          <h2 className="font-medium">Global roles</h2>
          <p className="text-sm text-gray-600">
            {user.globalRoles.length ? user.globalRoles.join(", ") : "None"}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 p-4">
          <h2 className="font-medium">Society roles</h2>
          <p className="text-sm text-gray-600">
            {user.societyRoles.length
              ? user.societyRoles
                  .map((r) => `${r.role} @ ${r.societyId}`)
                  .join(", ")
              : "None yet — request membership in a society to get started."}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 p-4">
          <h2 className="font-medium">Email verified</h2>
          <p className="text-sm text-gray-600">
            {user.universityDomainVerified ? "Yes" : "No — check your inbox"}
          </p>
        </div>
      </section>
    </main>
  );
}
