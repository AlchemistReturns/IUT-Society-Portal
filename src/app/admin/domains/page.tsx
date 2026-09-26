import { createClient } from "@/lib/supabase/server";
import { addDomain, removeDomain } from "./actions";

export default async function DomainsAdminPage() {
  const supabase = await createClient();
  const { data: domains } = await supabase
    .from("allowed_email_domains")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      {(domains?.length ?? 0) === 0 && (
        <p className="rounded-md bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
          No domains configured — signup is currently open to any email
          (bootstrap mode). Add a domain to start enforcing it.
        </p>
      )}

      <form action={addDomain} className="flex gap-2 sm:max-w-md">
        <input
          name="domain"
          placeholder="e.g. iut-dhaka.edu"
          required
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <button className="rounded-md bg-black px-3 py-2 text-sm font-medium text-white">
          Add
        </button>
      </form>

      <ul className="flex flex-col gap-2">
        {(domains ?? []).map((d) => (
          <li
            key={d.id}
            className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2 text-sm"
          >
            {d.domain}
            <form action={removeDomain}>
              <input type="hidden" name="id" value={d.id} />
              <button className="text-xs text-red-600 underline">Remove</button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
