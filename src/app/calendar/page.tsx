import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import CalendarGrid, {
  KIND_STYLES,
  type CalendarEntry,
  type CalendarEvent,
} from "@/components/CalendarGrid";

export const metadata = { title: "Calendar · IUT Society Portal" };

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { from } = await searchParams;
  const now = new Date();
  const m = /^(\d{4})-(\d{2})$/.exec(from ?? "");
  const start = m
    ? { year: Number(m[1]), month: Number(m[2]) - 1 }
    : { year: now.getFullYear(), month: now.getMonth() };

  const shift = (n: number) => {
    const d = new Date(start.year, start.month + n, 1);
    return `/calendar?from=${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  };

  const supabase = await createClient();
  const [user, { data: entries }, { data: events }] = await Promise.all([
    getCurrentUser(),
    supabase.from("academic_calendar_entries").select("*").order("start_date"),
    supabase.rpc("calendar_events"),
  ]);

  return (
    <main>
      {!user && (
        <header className="bg-[var(--brand-700)] text-white">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
            <Link href="/" className="font-serif text-2xl font-semibold tracking-tight">
              IUT Society Portal
            </Link>
            <Link
              href="/login"
              className="rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-[var(--brand-700)]"
            >
              Sign in
            </Link>
          </div>
        </header>
      )}

      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-serif text-2xl font-semibold">Academic &amp; event calendar</h1>
          <div className="flex gap-2 text-sm">
            <Link href={shift(-12)} className="rounded-md border px-3 py-1.5 hover:bg-white">
              ← Earlier
            </Link>
            <Link href="/calendar" className="rounded-md border px-3 py-1.5 hover:bg-white">
              Today
            </Link>
            <Link href={shift(12)} className="rounded-md border px-3 py-1.5 hover:bg-white">
              Later →
            </Link>
          </div>
        </div>

        <ul className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-700">
          {(Object.keys(KIND_STYLES) as CalendarEntry["kind"][]).map((k) =>
            k === "holiday" ? (
              <li key={k} className="font-bold text-red-700 underline">
                Holiday
              </li>
            ) : (
              <li key={k} className="flex items-center gap-1.5">
                <i className="h-3 w-3 rounded" style={{ background: KIND_STYLES[k].bg }} />
                {KIND_STYLES[k].label}
              </li>
            ),
          )}
          <li className="flex items-center gap-1.5">
            <i className="h-2 w-2 rounded-full bg-[var(--accent-from)]" /> Approved event
          </li>
          <li className="flex items-center gap-1.5">
            <i className="h-2 w-2 rounded-full border border-[var(--accent-from)] bg-white" /> Pending event
          </li>
        </ul>

        <CalendarGrid
          from={start}
          entries={(entries ?? []) as CalendarEntry[]}
          events={(events ?? []) as CalendarEvent[]}
        />
      </div>
    </main>
  );
}
