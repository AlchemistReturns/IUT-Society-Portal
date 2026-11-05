export type CalendarEntry = {
  id: string;
  kind: "classes" | "exams" | "break" | "short_term" | "holiday";
  label: string;
  start_date: string;
  end_date: string;
};

export type CalendarEvent = {
  id: string;
  society_name: string;
  title: string;
  venue: string | null;
  start_date: string;
  end_date: string;
  status: "submitted" | "approved";
};

export const KIND_STYLES: Record<CalendarEntry["kind"], { label: string; bg: string }> = {
  classes: { label: "Classes", bg: "#e3eee0" },
  exams: { label: "Examinations", bg: "#f6e0bd" },
  break: { label: "Semester break / vacation", bg: "#dbe6f0" },
  short_term: { label: "Short semester · training · convocation", bg: "#ece3f0" },
  holiday: { label: "Holiday", bg: "transparent" },
};

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const pad = (n: number) => String(n).padStart(2, "0");
const iso = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

function Month({
  year,
  month,
  entries,
  events,
  today,
}: {
  year: number;
  month: number; // 0-based
  entries: CalendarEntry[];
  events: CalendarEvent[];
  today: string;
}) {
  const first = new Date(year, month, 1);
  const days = new Date(year, month + 1, 0).getDate();
  const monthStart = iso(year, month, 1);
  const monthEnd = iso(year, month, days);

  const overlaps = (s: string, e: string) => s <= monthEnd && e >= monthStart;
  const notes = [
    ...entries
      .filter((e) => overlaps(e.start_date, e.end_date))
      .filter((e) => e.kind === "holiday" || (e.start_date >= monthStart && e.start_date <= monthEnd))
      .map((e) => ({
        day: Math.max(1, Number((e.start_date < monthStart ? monthStart : e.start_date).slice(8))),
        text: e.label,
        holiday: e.kind === "holiday",
        pending: false,
      })),
    ...events
      .filter((e) => overlaps(e.start_date, e.end_date))
      .map((e) => ({
        day: Math.max(1, Number((e.start_date < monthStart ? monthStart : e.start_date).slice(8))),
        text: `${e.title} — ${e.society_name}${e.status === "submitted" ? " (pending)" : ""}`,
        holiday: false,
        pending: e.status === "submitted",
      })),
  ].sort((a, b) => a.day - b.day);

  const cells: (number | null)[] = [
    ...Array(first.getDay()).fill(null),
    ...Array.from({ length: days }, (_, i) => i + 1),
  ];

  return (
    <section className="rounded-xl border p-4">
      <h2 className="mb-3 font-serif text-lg font-semibold">
        {first.toLocaleString("en-US", { month: "long" })} {year}
      </h2>
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {WEEKDAYS.map((w) => (
          <span key={w} className="pb-1 font-mono text-[10px] text-gray-400">
            {w}
          </span>
        ))}
        {cells.map((d, i) => {
          if (d === null) return <span key={`b${i}`} />;
          const date = iso(year, month, d);
          const on = entries.filter((e) => e.start_date <= date && e.end_date >= date);
          const holiday = on.find((e) => e.kind === "holiday");
          const period = on.find((e) => e.kind !== "holiday");
          const dayEvents = events.filter((e) => e.start_date <= date && e.end_date >= date);
          const title = [...on.map((e) => e.label), ...dayEvents.map((e) => e.title)].join(" · ");
          return (
            <span
              key={d}
              title={title || undefined}
              style={period ? { background: KIND_STYLES[period.kind].bg } : undefined}
              className={`relative flex h-9 flex-col items-center justify-center rounded-md font-mono ${
                holiday ? "font-bold text-red-700 underline" : ""
              } ${date === today ? "ring-2 ring-[var(--accent-from)]" : ""}`}
            >
              {d}
              {dayEvents.length > 0 && (
                <span className="absolute bottom-0.5 flex gap-0.5">
                  {dayEvents.slice(0, 3).map((e) => (
                    <i
                      key={e.id}
                      className={`h-1.5 w-1.5 rounded-full border border-[var(--accent-from)] ${
                        e.status === "approved" ? "bg-[var(--accent-from)]" : "bg-white"
                      }`}
                    />
                  ))}
                </span>
              )}
            </span>
          );
        })}
      </div>
      {notes.length > 0 && (
        <ul className="mt-3 space-y-1 border-t border-dashed border-[var(--card-border)] pt-2 text-xs text-gray-600">
          {notes.map((n, i) => (
            <li key={i} className={n.holiday ? "font-semibold text-red-700" : ""}>
              {n.day} — {n.text}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function CalendarGrid({
  from,
  months = 12,
  entries,
  events,
}: {
  from: { year: number; month: number };
  months?: number;
  entries: CalendarEntry[];
  events: CalendarEvent[];
}) {
  const t = new Date();
  const today = iso(t.getFullYear(), t.getMonth(), t.getDate());
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: months }, (_, i) => {
        const d = new Date(from.year, from.month + i, 1);
        return (
          <Month
            key={i}
            year={d.getFullYear()}
            month={d.getMonth()}
            entries={entries}
            events={events}
            today={today}
          />
        );
      })}
    </div>
  );
}
