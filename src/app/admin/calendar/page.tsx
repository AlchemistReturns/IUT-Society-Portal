import { createClient } from "@/lib/supabase/server";
import { KIND_STYLES } from "@/components/CalendarGrid";
import { addCalendarEntry, removeCalendarEntry } from "./actions";

const input = "rounded-md border border-gray-300 bg-white px-3 py-2 text-sm";

export default async function CalendarAdminPage() {
  const supabase = await createClient();
  const { data: entries } = await supabase
    .from("academic_calendar_entries")
    .select("*")
    .order("start_date");

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-gray-600">
        Academic periods and holidays shown on the public calendar.
      </p>

      <form action={addCalendarEntry} className="grid gap-2 sm:grid-cols-[10rem_1fr_9rem_9rem_auto]">
        <select name="kind" className={input}>
          {Object.entries(KIND_STYLES).map(([k, v]) => (
            <option key={k} value={k}>
              {k === "holiday" ? "Holiday" : v.label}
            </option>
          ))}
        </select>
        <input name="label" placeholder="Label, e.g. Winter - Classes" required className={input} />
        <input type="date" name="start_date" required className={input} />
        <input type="date" name="end_date" className={input} title="Leave empty for one day" />
        <button className="rounded-md bg-black px-3 py-2 text-sm font-medium text-white">Add</button>
      </form>

      <ul className="flex flex-col gap-2">
        {(entries ?? []).map((e) => (
          <li
            key={e.id}
            className="flex items-center justify-between gap-3 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
          >
            <span className="flex items-center gap-2">
              <i
                className="h-3 w-3 shrink-0 rounded border border-gray-300"
                style={{ background: KIND_STYLES[e.kind as keyof typeof KIND_STYLES]?.bg }}
              />
              <span className="font-medium">{e.label}</span>
              <span className="font-mono text-xs text-gray-500">
                {e.start_date}
                {e.end_date !== e.start_date && ` → ${e.end_date}`}
              </span>
            </span>
            <form action={removeCalendarEntry}>
              <input type="hidden" name="id" value={e.id} />
              <button className="text-xs text-red-600 underline">Remove</button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
